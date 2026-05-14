#!/usr/bin/env node
/**
 * Notion2Web Starter — Interactive Setup CLI
 * 
 * Run: npm run setup
 * 
 * This script:
 * 1. Checks if .env exists, creates from .env.example if not
 * 2. Checks if Hugo is installed
 * 3. Prints environment variable setup instructions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(q) {
  return new Promise(resolve => rl.question(q, resolve));
}

async function checkHugo() {
  try {
    const version = execSync('hugo version', { encoding: 'utf8' });
    console.log(`✅ Hugo installed: ${version.trim()}`);
    return true;
  } catch {
    console.log('❌ Hugo not found');
    return false;
  }
}

function createEnvIfNeeded() {
  const envPath = path.join(__dirname, '..', '.env');
  const examplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      console.log('✅ Created .env from .env.example');
    } else {
      console.log('⚠️  .env.example not found — cannot create .env');
    }
  } else {
    console.log('✅ .env already exists');
  }
}

async function printInstructions() {
  console.log('\n========================================');
  console.log('Notion2Web Starter — Setup Guide');
  console.log('========================================\n');
  
  console.log('STEP 1: Notion Integration Token');
  console.log('  → https://www.notion.so/my-integrations');
  console.log('  → "New integration" → 이름 입력 → Token 복사 (sk-...)');
  console.log('  → .env의 NOTION_API_KEY에 붙여넣기\n');
  
  console.log('STEP 2: Cloudflare R2 Setup');
  console.log('  → https://dash.cloudflare.com → R2 → "Create bucket"');
  console.log('  → R2 버킷 내에서 API Token 생성 (Object Read/Write)');
  console.log('  → .env의 7개 R2 변수 채우기\n');
  
  console.log('STEP 3: Notion 페이지/DB 연결');
  console.log('  → Notion에서 루트 페이지 열기');
  console.log('  → 우측 "..." → "Add connections" → 방금 만든 integration 선택');
  console.log('  → (데이터베이스도 동일하게)\n');
  
  console.log('STEP 4: GitHub Secrets & Cloudflare Pages');
  console.log('  → docs/SETUP.md의 "GitHub Secrets 설정" 섹션 참조\n');
  
  console.log('========================================');
  console.log('환경 변수 채운 후:');
  console.log('  로컬: npm run dev');
  console.log('  배포: GitHub push → Cloudflare Pages 자동 빌드');
  console.log('========================================\n');
}

async function main() {
  console.log('\n🔧 Notion2Web Starter Setup\n');
  
  createEnvIfNeeded();
  
  const hugoOk = await checkHugo();
  if (!hugoOk) {
    console.log('\n⚠️  Hugo 설치 필요:');
    console.log('     macOS: brew install hugo');
    console.log('     Linux: sudo apt install hugo');
    console.log('     Windows: wing install hugo -extended');
    console.log('     (자세한 내용: https://gohugo.io/installation/)\n');
  }
  
  await printInstructions();
  
  rl.close();
}

main().catch(console.error);