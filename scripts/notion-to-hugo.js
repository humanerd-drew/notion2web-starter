require('dotenv').config();
const { Client } = require('@notionhq/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const crypto = require('crypto');

// Initialize clients
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const PARENT_PAGE_ID = normalizeId(process.env.NOTION_PARENT_PAGE_ID);
const CONTENT_DIR = process.env.HUGO_CONTENT_DIR || 'content';
const PUBLIC_R2_URL = process.env.R2_PUBLIC_URL;

function normalizeId(id) {
  if (!id) return '';
  const cleanId = id.replace(/-/g, '');
  if (cleanId.length !== 32) return id;
  return cleanId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

async function downloadImage(url) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  return buffer;
}

async function uploadToR2(buffer, fileName, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `images/${fileName}`,
    Body: buffer,
    ContentType: contentType,
  });

  try {
    await s3.send(command);
    return `${PUBLIC_R2_URL}/images/${fileName}`;
  } catch (error) {
    console.error('R2 Upload Error:', error);
    return null;
  }
}

function getHash(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

const idToSlugMap = {};
const titleToSlugMap = {};
const syncQueue = new Set();
const syncedFilePaths = new Set();
let lastHeadingLink = '';

function richTextToHtml(richText) {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map(t => {
    let text = t.plain_text || '';
    if (!text) return '';
    
    // Escape HTML special characters
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    if (t.annotations.bold) text = `<strong>${text}</strong>`;
    if (t.annotations.italic) text = `<em>${text}</em>`;
    if (t.annotations.code) text = `<code class="bg-muted px-1.5 py-0.5 rounded text-sm">${text}</code>`;
    if (t.annotations.strikethrough) text = `<s>${text}</s>`;
    
    // Add Notion colors
    if (t.annotations.color && t.annotations.color !== 'default') {
      text = `<span class="notion-${t.annotations.color}">${text}</span>`;
    }
    
    let url = t.href || t.text?.link?.url;
    if (url) {
      // Internal Link Remapping & Automatic Queueing
      const notionPageMatch = url.match(/notion\.so\/(?:[^/]+\-|)([a-f0-9]{32})/);
      if (notionPageMatch) {
        const pageId = notionPageMatch[1];
        const normalizedM = normalizeId(pageId);
        
        // Add to SyncQueue for recursive syncing
        syncQueue.add(normalizedM);
        
        if (normalizedM === PARENT_PAGE_ID) {
          url = '/';
        } else if (idToSlugMap[normalizedM]) {
          url = `/${idToSlugMap[normalizedM]}/`;
        }
      }
      text = `<a href="${url}" class="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity">${text}</a>`;
    }
    return text;
  }).join('');
}

// lastHeadingLink is already defined at line 56

async function renderDatabaseInline(dbId) {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100 }),
    });
    const data = await response.json();
    if (!data.results) return '';
    
    let html = `\n<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-10">\n`;
    for (const item of data.results) {
      const titleProperty = Object.values(item.properties).find(p => p.type === 'title');
      const title = titleProperty ? titleProperty.title.map(t => t.plain_text).join('') : 'Untitled';
      const normId = normalizeId(item.id);
      const slug = idToSlugMap[normId] || getSlug(title);
      
      // Cover Image Implementation (Priority: Page Cover > Page Content)
      let coverUrl = '';
      if (item.cover) {
        const rawUrl = item.cover.external?.url || item.cover.file?.url;
        if (rawUrl) {
          try {
            const imgBuffer = await downloadImage(rawUrl);
            const hash = getHash(imgBuffer);
            const ext = rawUrl.split('?')[0].split('.').pop() || 'png';
            coverUrl = await uploadToR2(imgBuffer, `${hash}.${ext}`, `image/${ext}`);
          } catch(e) {
            console.error(`Cover (Page) upload failed for ${title}:`, e);
          }
        }
      }

      // If no page cover, look for first image in page content (Fallback)
      if (!coverUrl) {
        try {
          const blocks = await getBlocks(normId);
          const firstImgBlock = blocks.find(b => b.type === 'image');
          if (firstImgBlock) {
            const rawUrl = firstImgBlock.image.external?.url || firstImgBlock.image.file?.url;
            if (rawUrl) {
              const imgBuffer = await downloadImage(rawUrl);
              const hash = getHash(imgBuffer);
              const ext = rawUrl.split('?')[0].split('.').pop() || 'png';
              coverUrl = await uploadToR2(imgBuffer, `${hash}.${ext}`, `image/${ext}`);
            }
          }
        } catch(e) {
          console.error(`Cover (Content) extraction failed for ${title}:`, e);
        }
      }
      
      const imgHtml = coverUrl 
        ? `<img src="${coverUrl}" class="w-full h-48 object-cover transition-transform group-hover:scale-105" alt="${title}" />`
        : `<div class="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground italic">No Cover</div>`;

      html += `      <a href="/${slug}/" class="group block border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div class="w-full h-48 overflow-hidden bg-muted flex items-center justify-center">
          ${imgHtml}
        </div>
        <div class="p-4 bg-background">
          <h3 class="font-bold text-lg group-hover:text-primary transition-colors">${title}</h3>
        </div>
      </a>\n`;
    }
    html += `</div>\n`;
    return html;
  } catch (e) {
    console.error(`Error rendering inline database ${dbId}:`, e);
    return '';
  }
}

async function blockToMarkdown(block) {
  const { type, has_children } = block;
  const value = block[type];

  // console.log(`[Processing Block] Type: ${type}, ID: ${block.id}`);

  // Base styles (Tailwind/shadcn-like)
  const h1Class = 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6 mt-10';
  const h2Class = 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4 mt-8';
  const h3Class = 'scroll-m-20 text-2xl font-semibold tracking-tight mb-3 mt-6';
  const pClass = 'leading-7 [&:not(:first-child)]:mt-4 mb-4';
  const quoteClass = 'mt-6 border-l-2 pl-6 italic text-muted-foreground';
  const calloutClass = 'flex items-start space-x-4 border rounded-lg p-4 bg-muted/30 my-6';

  // [Custom Feature] Hide blocks inside toggles marked with [hide]
  const blockTitle = value?.rich_text ? value.rich_text.map(t => t.plain_text).join('') : '';
  if (type === 'toggle' && blockTitle.toLowerCase().includes('[hide]')) {
    return '';
  }

  let childrenContent = '';
  // Recursive fetch for nested content
  if (has_children && type !== 'child_database' && type !== 'child_page') {
    const children = await getBlocks(block.id);
    for (const child of children) {
      childrenContent += await blockToMarkdown(child);
    }
  }

  const richText = value?.rich_text ? richTextToHtml(value.rich_text) : '';

  switch (type) {
    case 'heading_1': {
      let h1Link = value.rich_text?.find(t => t.href || t.text?.link)?.href || value.rich_text?.find(t => t.href || t.text?.link)?.text?.link?.url;
      lastHeadingLink = h1Link;
      let h1Html = richTextToHtml(value.rich_text);
      if (h1Link && !h1Html.includes('<a ')) h1Html = `<a href="${h1Link}">${h1Html}</a>`;
      const colorClass = value.color && value.color !== 'default' ? ` notion-${value.color}` : '';
      return `<h1 class="${h1Class}${colorClass}">${h1Html}</h1>\n\n`;
    }
    case 'heading_2': {
      let h2Link = value.rich_text?.find(t => t.href || t.text?.link)?.href || value.rich_text?.find(t => t.href || t.text?.link)?.text?.link?.url;
      lastHeadingLink = h2Link;
      let h2Html = richTextToHtml(value.rich_text);
      if (h2Link && !h2Html.includes('<a ')) h2Html = `<a href="${h2Link}">${h2Html}</a>`;
      const colorClass = value.color && value.color !== 'default' ? ` notion-${value.color}` : '';
      return `<h2 class="${h2Class}${colorClass}">${h2Html}</h2>\n\n`;
    }
    case 'heading_3': {
      let h3Link = value.rich_text?.find(t => t.href || t.text?.link)?.href || value.rich_text?.find(t => t.href || t.text?.link)?.text?.link?.url;
      lastHeadingLink = h3Link;
      let h3Html = richTextToHtml(value.rich_text);
      if (h3Link && !h3Html.includes('<a ')) h3Html = `<a href="${h3Link}">${h3Html}</a>`;
      const colorClass = value.color && value.color !== 'default' ? ` notion-${value.color}` : '';
      return `<h3 class="${h3Class}${colorClass}">${h3Html}</h3>\n\n`;
    }
    case 'paragraph': {
      if (!richText && !childrenContent) return '';
      const colorClass = value.color && value.color !== 'default' ? ` notion-${value.color}` : '';
      return `<p class="${pClass}${colorClass}">${richText}</p>\n\n${childrenContent}`;
    }
    case 'quote': {
      const colorClass = value.color && value.color !== 'default' ? ` notion-${value.color}` : '';
      return `<blockquote class="${quoteClass}${colorClass}">${richText}</blockquote>\n\n${childrenContent}`;
    }
    case 'callout':
      const icon = value.icon?.emoji;
      const iconSpan = icon ? `<span class="text-2xl">${icon}</span>` : '';
      return `<div class="${calloutClass}">${iconSpan}<div>${richText}${childrenContent}</div></div>\n\n`;
    case 'bulleted_list_item':
      return `- ${richText}\n${childrenContent}`;
    case 'numbered_list_item':
      return `1. ${richText}\n${childrenContent}`;
    case 'divider':
      return `<hr class="my-8 border-t-2" />\n\n`;
    case 'bookmark':
      return `<div class="my-6 border rounded-xl p-4 flex items-center space-x-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onclick="window.open('${value.url}', '_blank')">
        <div class="flex-1 overflow-hidden">
          <div class="text-sm font-bold truncate">${value.url}</div>
          <div class="text-xs text-muted-foreground truncate">${value.url}</div>
        </div>
        <span class="text-xl">🔗</span>
      </div>\n\n`;
    case 'image': {
      const imageUrl = value.type === 'external' ? value.external.url : value.file.url;
      const captionRichText = value.caption ? richTextToHtml(value.caption) : '';
      const plainTextCaption = value.caption ? value.caption.map(t => t.plain_text).join('') : '';
      const firstLink = value.caption?.find(t => t.href || t.text?.link)?.href || value.caption?.find(t => t.href || t.text?.link)?.text?.link?.url;
      
      try {
        const buffer = await downloadImage(imageUrl);
        const hash = getHash(buffer);
        const ext = imageUrl.split('?')[0].split('.').pop() || 'png';
        const fileName = `${hash}.${ext}`;
        const r2Url = await uploadToR2(buffer, fileName, `image/${ext}`);
        
        const imgHtml = `<img src="${r2Url}" alt="${plainTextCaption || 'Notion Image'}" class="rounded-xl shadow-md w-full h-auto transition-transform hover:scale-[1.01]" />`;
        
        // [개선] 캡션에서 링크 추출 (노션 API는 이미지 자체 링크 필드를 제공하지 않음)
        let linkUrl = firstLink;
        
        if (linkUrl) {
          const m = linkUrl.match(/notion\.so\/(?:[^/]+\-|)([a-f0-9]{32})/);
          if (m) {
            const normalizedM = normalizeId(m[1]);
            if (normalizedM === PARENT_PAGE_ID) {
              linkUrl = '/';
            } else if (idToSlugMap[normalizedM]) {
              linkUrl = `/${idToSlugMap[normalizedM]}/`;
            }
          }
        }
        
        const linkHtml = linkUrl ? `<a href="${linkUrl}" class="cursor-pointer block">${imgHtml}</a>` : imgHtml;
        
        // [지능형 캡션 관리] 캡션이 단순 URL이면 숨기고, 텍스트가 있으면 표시
        let captionHtml = '';
        if (plainTextCaption && plainTextCaption.trim() !== (linkUrl || '').trim()) {
          captionHtml = `<figcaption class="mt-3 text-center text-sm text-muted-foreground">${captionRichText}</figcaption>`;
        }

        return `<figure class="my-10">${linkHtml}${captionHtml}</figure>\n\n`;
      } catch (e) {
        return `<p class="text-red-500 underline"><a href="${imageUrl}" target="_blank">Image Load Failed</a></p>\n\n`;
      }
    }
    case 'column_list':
      return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">${childrenContent}</div>\n\n`;
    case 'column':
      return `<div class="flex flex-col space-y-4 w-full h-full">${childrenContent}</div>`;
    case 'link_to_page':
      const targetId = normalizeId(value.page_id);
      const targetSlug = targetId === PARENT_PAGE_ID ? '' : (idToSlugMap[targetId] || `page-${targetId.substring(0, 8)}`);
      const targetUrl = targetSlug === '' ? '/' : `/${targetSlug}/`;
      
      // Add to SyncQueue for recursive syncing
      syncQueue.add(targetId);
      
      return `
<div class="my-4">
  <a href="${targetUrl}" class="group flex items-center space-x-4 border p-4 rounded-xl hover:bg-muted/30 transition-all shadow-sm hover:shadow-md border-primary/20 bg-primary/5">
    <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
      🔗
    </div>
    <div class="flex-1 font-semibold text-lg group-hover:text-primary transition-colors">
      연결된 페이지로 이동
    </div>
    <div class="text-muted-foreground/50 group-hover:translate-x-1 transition-transform">
      →
    </div>
  </a>
</div>\n\n`;
    case 'child_page':
      const pageTitle = value.title || 'Untitled Page';
      const normChildId = normalizeId(block.id);
      const pageSlug = normChildId === PARENT_PAGE_ID ? '' : (idToSlugMap[normChildId] || getSlug(pageTitle));
      const pageUrl = pageSlug === '' ? '/' : `/${pageSlug}/`;
      syncQueue.add(normChildId);
      
      return `
<div class="my-4">
  <a href="${pageUrl}" class="group flex items-center space-x-4 border p-4 rounded-xl hover:bg-muted/30 transition-all shadow-sm hover:shadow-md">
    <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
      📄
    </div>
    <div class="flex-1 font-semibold text-lg group-hover:text-primary transition-colors">
      ${pageTitle}
    </div>
    <div class="text-muted-foreground/50 group-hover:translate-x-1 transition-transform">
      →
    </div>
  </a>
</div>\n\n`;
    case 'toggle':
      return `<details class="cursor-pointer border p-4 rounded-lg my-4 transition-all hover:bg-muted/20"><summary class="font-bold">${richText}</summary><div class="mt-4 pl-4 border-l">${childrenContent}</div></details>\n\n`;
    case 'child_database':
      return await renderDatabaseInline(block.id);
    default:
      return childrenContent;
  }
}

async function getBlocks(blockId) {
  const blocks = [];
  let cursor;
  while (true) {
    try {
      const response = await fetch(`https://api.notion.com/v1/blocks/${blockId}/children${cursor ? `?start_cursor=${cursor}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
        },
      });
      const data = await response.json();
      if (data.object === 'error') break;
      blocks.push(...data.results);
      if (!data.next_cursor) break;
      cursor = data.next_cursor;
    } catch (error) {
      break;
    }
  }
  return blocks;
}

async function getPageTitle(pageId) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      },
    });
    const page = await response.json();
    const titleProperty = Object.values(page.properties).find(p => p.type === 'title');
    return titleProperty ? titleProperty.title.map(t => t.plain_text).join('') : 'Untitled';
  } catch (error) {
    return 'Untitled';
  }
}

function getSlug(title) {
  return title.toLowerCase().trim().replace(/ /g, '-').replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣-]/g, '');
}

async function fetchPageContent(pageId) {
  const blocks = await getBlocks(pageId);
  let markdown = '';
  for (const block of blocks) {
    markdown += await blockToMarkdown(block);
  }
  return markdown;
}

async function processParentPage(pageId) {
  console.log(`[PASS 2] Writing Parent Page Content: ${pageId}`);
  const title = await getPageTitle(pageId);
  const content = await fetchPageContent(pageId);
  
  const frontmatter = `---\ntitle: "${title}"\nlayout: "single"\n---\n\n`;
  if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });
  const filePath = path.join(CONTENT_DIR, '_index.md');
  fs.writeFileSync(filePath, frontmatter + content);
  syncedFilePaths.add(path.resolve(filePath).normalize('NFC'));
}

async function processDatabase(databaseId) {
  console.log(`[PASS 2] Writing Database Pages: ${databaseId}`);
  let cursor;
  let allResults = [];

  while (true) {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ start_cursor: cursor }),
    });
    const data = await response.json();
    if (data.object === 'error') break;
    allResults.push(...data.results);
    if (!data.next_cursor) break;
    cursor = data.next_cursor;
  }

  for (const page of allResults) {
    const titleProperty = Object.values(page.properties).find(p => p.type === 'title');
    const title = titleProperty ? titleProperty.title.map(t => t.plain_text).join('') : 'Untitled';
    const normalizedPageId = normalizeId(page.id);
    const slug = idToSlugMap[normalizedPageId] || getSlug(title);
    const date = page.created_time;

    console.log(`[Writing File] ${title} -> ${slug}.md`);
    const content = await fetchPageContent(page.id);
    const frontmatter = `---\ntitle: "${title}"\ndate: ${date}\ndraft: false\n---\n\n`;
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);
    fs.writeFileSync(filePath, frontmatter + content);
    syncedFilePaths.add(path.resolve(filePath).normalize('NFC'));
  }
}

async function buildIdMap(parentPageId) {
  console.log(`[PASS 1] Building Global ID-to-Slug Map...`);
  idToSlugMap[parentPageId] = '';

  let cursor;
  while (true) {
    const response = await notion.search({
      filter: { property: 'object', value: 'page' },
      start_cursor: cursor,
      page_size: 100,
    });
    
    for (const page of response.results) {
      const normalizedPageId = normalizeId(page.id);
      if (normalizedPageId === PARENT_PAGE_ID) continue;
      
      const titleProp = Object.values(page.properties).find(p => p.type === 'title');
      const title = titleProp ? titleProp.title.map(t => t.plain_text).join('') : 'Untitled';
      const slug = getSlug(title);
      idToSlugMap[normalizedPageId] = slug;
      titleToSlugMap[title] = slug;
    }
    
    if (!response.has_more) break;
    cursor = response.next_cursor;
  }
  console.log(`[PASS 1] Completed. Total Global Pages Mapped: ${Object.keys(idToSlugMap).length}`);
}

async function processQueue() {
  console.log(`[PASS 3] Processing Sync Queue: ${syncQueue.size} pages remaining...`);
  for (const pageId of syncQueue) {
    const title = await getPageTitle(pageId);
    const slug = idToSlugMap[pageId] || getSlug(title);
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);
    
    // Check if already synced in previous steps
    if (syncedFilePaths.has(path.resolve(filePath).normalize('NFC'))) continue;

    console.log(`[Queue Sync] ${title} -> ${slug}.md`);
    const content = await fetchPageContent(pageId);
    const frontmatter = `---\ntitle: "${title}"\ndraft: false\n---\n\n`;
    fs.writeFileSync(filePath, frontmatter + content);
    syncedFilePaths.add(path.resolve(filePath).normalize('NFC'));
  }
}

function cleanUpStaleFiles() {
  console.log(`[PASS 4] Cleaning up stale files...`);
  if (!fs.existsSync(CONTENT_DIR)) return;
  
  const files = fs.readdirSync(CONTENT_DIR);
  let removedCount = 0;
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const fullPath = path.resolve(path.join(CONTENT_DIR, file)).normalize('NFC');
    if (!syncedFilePaths.has(fullPath)) {
      console.log(`[Cleanup] Removing stale file: ${file}`);
      fs.unlinkSync(fullPath);
      removedCount++;
    }
  }
  console.log(`Cleanup completed. Removed ${removedCount} stale files.`);
}

async function main() {
  if (!PARENT_PAGE_ID) throw new Error('NOTION_PARENT_PAGE_ID is required.');

  // PASS 1: Build Map
  await buildIdMap(PARENT_PAGE_ID);

  // PASS 2: Process Content
  await processParentPage(PARENT_PAGE_ID);
  
  const blocks = await getBlocks(PARENT_PAGE_ID);
  const dbIds = blocks.filter(b => b.type === 'child_database').map(b => b.id);
  
  console.log(`Found ${dbIds.length} databases to process.`);
  for (const dbId of dbIds) {
    await processDatabase(dbId);
  }

  // PASS 3: Process Queue (Linked Pages)
  await processQueue();

  // PASS 4: Cleanup
  cleanUpStaleFiles();

  console.log('Successfully completed full integrated sync.');
}

main().catch(console.error);
