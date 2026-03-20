# Notion2Web Starter

A high-performance framework to automatically sync a Notion database into a beautiful, static Hugo website, complete with Cloudflare R2 image optimization and shadcn/ui inspired styling.

## 🌟 Features
- **Notion as CMS**: Write and manage your content entirely in Notion.
- **R2 Image Hosting**: Automatically downloads Notion images (which expire) and uploads them to Cloudflare R2 for permanent, fast delivery.
- **Recursive Sync**: Detects internal Notion links and automatically downloads the linked pages to prevent 404 errors.
- **Dynamic Layouts**: Automatically detects column blocks in Notion and generates native responsive grids (e.g. 2-column, 3-column).
- **Date Hiding `[no-date]`**: Add `[no-date]` anywhere in your Notion text to seamlessly hide the publish date on the Hugo frontend.
- **Premium Design**: Built-in Tailwind CSS + Typography with styling inspired by `shadcn/ui`.
- **SEO & Analytics Ready**: Unified configuration for Google Analytics, Naver, Clarity, and standard SEO meta tags.
- **Lightning Fast**: Generates static HTML via Hugo.

## 💡 Custom Features & Formatting
This starter template provides several powerful ways to control your generated website directly from Notion:

- **Hiding Dates (`[no-date]`)**
  If you want to hide the publish date of a page (e.g., for 'About' or 'Contact' pages), simply type `[no-date]` anywhere in the Notion page content. The script will automatically remove the text and hide the date from the Hugo layout.
  
- **Hidden Blocks (`[hide]`)**
  If you want to keep notes or draft content in Notion that shouldn't be published to the website, create a **Toggle Block**, name it with `[hide]` (e.g., `[hide] Draft Notes`), and place your content inside. The script will completely ignore this toggle during sync.

- **Clickable Images**
  Notion doesn't natively support adding links directly to image blocks. To make an image clickable on your website, add a **Caption** to the image block in Notion, and insert a hyperlink into the caption text. The sync script will automatically wrap the image in an `<a>` tag using that link. If the caption *only* contains the link, the text itself will be hidden for a cleaner look.

- **Dynamic Columns**
  Simply use Notion's native multi-column layout. The script calculates the actual number of columns (up to 12) and maps them natively to Tailwind CSS grid classes (`grid-cols-2`, `grid-cols-3`, etc.).

- **Smart Linking (Recursive Sync)**
  When you insert an inline link to another Notion page, or use a `link_to_page` block, the script automatically queues that target page and downloads it into your static site. Internal links are perfectly mapped to Hugo's local routing system.

## 🚀 Getting Started

### 1. Prerequisites
- **Notion Integration Token**: [Create one here](https://www.notion.so/my-integrations).
- **Cloudflare R2**: Create a bucket in your Cloudflare dashboard.
- **Node.js** & **Hugo Extended** (for local development).

### 2. Setup
1. Click **"Use this template"** on GitHub to create your own repository.
2. Clone your repository locally.
3. Run `npm install`.

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```
Make sure you invite your Notion Integration to the Root Page / Database you want to sync!

### 4. Configuration
Open `hugo.toml` and update:
- `baseURL` (Your live domain)
- `title` (Your website name)
- Analytics tracking IDs inside `[params.analytics]`.

### 5. Local Development
To sync data from Notion and run the site locally:
```bash
npm run dev
```
> This will execute the sync script (`notion-to-hugo.js`), build the Tailwind CSS, and start the Hugo server.

## ☁️ Deployment (GitHub Actions)
This template comes with a ready-to-use GitHub Actions workflow (`.github/workflows/deploy.yml`) designed for Cloudflare Pages.

1. Go to your repository **Settings > Secrets and variables > Actions**.
2. Add all the variables from your `.env` file as **Repository Secrets**.
3. When you push to the `main` branch, the Action will automatically run the sync script, build the site, and you can map the `/public` folder to Cloudflare Pages.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ from the HUMANERD Project.*
