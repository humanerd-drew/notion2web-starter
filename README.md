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
