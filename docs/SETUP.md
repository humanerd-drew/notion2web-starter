# Notion2Web Starter — 상세 설정 가이드

이 문서는 Notion2Web Starter를 처음부터 완전히 설정하는 방법에 대한 상세 가이드입니다.
빠른 시작이 필요하면 [README.md](../README.md)를 참조하세요.

---

## 사전 준비물

### 1. Notion Integration Token

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) 접속
2. **"New integration"** 클릭
3. 이름: `notion2web` (마음대로)
4. Associated workspace: 자신의 워크스페이스
5. **Token 복사** (sk-...로 시작)

### 2. Cloudflare R2 버킷

1. [dash.cloudflare.com](https://dash.cloudflare.com) → R2 접속
2. **"Create bucket"** 클릭
3. 버킷 이름: `notion-images` (마음대로)
4. **Public URL** 복사 (구성설정에서 확인)
5. R2 관리 페이지 → **Create API Token** 클릭:
   - Permissions: Object Read/Write
   - Account: R2 Storage
   - TTL: 무제한
6. **Access Key ID**, **Secret Access Key** 복사

### 3. Cloudflare Pages 프로젝트

1. dash.cloudflare.com → Pages 접속
2. **"Create a project"** → **"Connect to Git"**
3. GitHub repository 연결 (이 저장소 fork한 것)
4. **Build settings**:
   - Framework preset: `Hugo`
   - Build command: `npm run build`
   - Build output directory: `public`
5. **Environment variables** 설정 (아래 GitHub Secrets와 동일)

### 4. Cloudflare Deploy Hook

GitHub Actions가 변경사항을 push한 후 Cloudflare Pages를 재배포하도록 deploy hook 생성:

1. Cloudflare Pages → 프로젝트 → **Settings** → **Deploy hooks**
2. **"Add deploy hook"** → 이름: `notion-sync`, Branch: `main`
3. 생성된 URL 복사 → GitHub Secrets에 `CLOUDFLARE_DEPLOY_HOOK`으로 등록

---

## 환경 변수 설정

### GitHub Secrets (GitHub Actions용)

GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

GitHub Actions 워크플로우가 `repository_dispatch` 이벤트를 받으면 아래 Secrets를 사용해 Notion 동기화를 실행합니다.

| Secret Name | 값 |
|-------------|-----|
| `NOTION_API_KEY` | Notion Integration Token |
| `NOTION_DATABASE_ID` | Notion 데이터베이스 ID (URL에서 32자리) |
| `NOTION_PARENT_PAGE_ID` | 루트 페이지 ID |
| `R2_ACCESS_KEY_ID` | R2 API Token Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API Token Secret |
| `R2_BUCKET_NAME` | 생성한 버킷 이름 |
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | R2 Public URL (https://pub-xxx.r2.dev 형태) |
| `CLOUDFLARE_DEPLOY_HOOK` | Cloudflare Pages → Deploy hooks에서 생성한 URL |

### Cloudflare Pages Environment Variables

Cloudflare Pages deploy hook 방식으로 배포하므로 Pages 환경변수는 별도로 설정하지 않아도 됩니다.
단, 로컬 `.env` 파일은 `CLOUDFLARE_DEPLOY_HOOK` 없이 Notion/R2 값만 있으면 됩니다.

---

## 로컬 개발 환경

### Hugo 설치 (macOS)

```bash
brew install hugo
```

### Hugo 설치 (Windows)

[官方 문서](https://gohugo.io/installation/windows/) 참조 atau:
```powershell
wing install hugo -extended
```

### Hugo 설치 (Linux)

```bash
sudo apt install hugo
# 또는
sudo pacman -S hugo
```

### 확인

```bash
hugo version
# Extended variant가 표시되어야 함
# 예: Hugo Static Site Generator v0.123.0+extended darwin/arm64
```

### .env 파일 생성

```bash
cp .env.example .env
```

`.env` 파일을 열고 위에서 구한 값들을 채워넣으세요.

### 로컬에서 실행

```bash
npm install
npm run dev
```

`http://localhost:1313` 에서 확인 가능.

---

## Notion 페이지/데이터베이스 공유

Notion Integration Token만 있으면 API 접근 불가. 각 페이지/데이터베이스에 직접 초대해야 함.

1. Notion에서 루트 페이지 열기
2. 우측 상단 **"..."** → **"Add connections"**
3. 만든 integration 선택 → **"Confirm"**

데이터베이스도 동일하게.

---

## 다음 단계

- [CUSTOMIZATION.md](./CUSTOMIZATION.md) — Tailwind 커스터마이징, Hugo 템플릿 수정
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — 자주 발생하는 문제 해결

---

*Built with ❤️ from the HUMANERD Project.*