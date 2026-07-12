# Notion2Web Starter

Notion에서 글을 쓰면 자동으로 웹사이트가 만들어집니다.

## 어떻게 동작하나요?

```
Notion에서 글 쓰기 → GitHub가 자동 저장 → Cloudflare가 웹사이트 배포
```

Notion에서 페이지를 수정하면 GitHub Actions가 실행되어 내용을 저장소에 반영하고, Cloudflare Pages가 웹사이트를 다시 빌드합니다.

## 필요한 서비스 (모두 무료)

| 서비스 | 용도 |
|--------|------|
| **GitHub 계정** | 코드 저장소 + 자동화 |
| **Cloudflare 계정** | 이미지 저장(R2) + 웹사이트 호스팅(Pages) |
| **Notion 계정** | 글쓰기 |

## 설정 순서 (총 20~30분)

### 1단계. GitHub에서 저장소 만들기
[이 링크](https://github.com/humanerd-drew/notion2web-starter)에 접속 → 초록색 **"Use this template"** 버튼 클릭 → 저장소 이름 입력 → **"Create repository"**

### 2단계. Cloudflare R2 설정 (이미지 저장소)
Cloudflare 대시보드 → **R2** → 버킷 만들기 → API 토큰 생성
([자세한 방법](docs/SETUP.md#2-cloudflare-r2-버킷))

### 3단계. Cloudflare Pages 설정 (웹사이트 호스팅)
Cloudflare 대시보드 → **Pages** → 프로젝트 생성 → GitHub 저장소 연결 → 빌드 설정 저장
([자세한 방법](docs/SETUP.md#3-cloudflare-pages-프로젝트))

### 4단계. Cloudflare Deploy Hook 만들기
Cloudflare Pages → 프로젝트 설정 → **Deploy hooks** → "Add deploy hook" → URL 복사
([자세한 방법](docs/SETUP.md#4-cloudflare-deploy-hook))

### 5단계. GitHub Personal Access Token 발급
[github.com/settings/tokens](https://github.com/settings/tokens) → **Generate new token** → `repo` 권한 체크 → 토큰 복사
([자세한 방법](docs/SETUP.md#1-github-personal-access-token-pat))

### 6단계. Notion API 키 발급
[notion.so/my-integrations](https://www.notion.so/my-integrations) → 새 Integration 만들기 → 토큰 복사
([자세한 방법](docs/SETUP.md#2-notion-integration-token))

### 7단계. Cloudflare Worker 배포 (Notion → GitHub 중개 다리)
`workers/webhook-bridge/` 폴더의 Worker를 Cloudflare에 배포합니다.
이 Worker는 Notion webhook을 받아서 GitHub Actions를 트리거합니다.
([자세한 방법](docs/SETUP.md#6-cloudflare-worker-배포))

### 8단계. Notion에 웹훅 등록하기
Worker URL을 Notion API에 웹훅으로 등록합니다.
([자세한 방법](docs/SETUP.md#7-notion에-웹훅-등록하기))

### 9단계. GitHub에 비밀값 등록하기
GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
위에서 만든 키와 토큰 9개를 하나씩 등록합니다.
([자세한 방법](docs/SETUP.md#github-secrets-github-actions용))

### 10단계. Notion 페이지에 Integration 연결하기
Notion에서 동기화할 페이지 열기 → 우측 상단 **`...`** → **"Add connections"** → 방금 만든 Integration 선택

### ✅ 완료
이제 Notion에서 페이지를 수정하면 GitHub가 자동으로 감지하고 웹사이트가 업데이트됩니다.

## 로컬에서 미리보기 (선택사항, 개발자용)

웹사이트 모양을 내 컴퓨터에서 미리 보고 싶다면:

```bash
# 1. 저장소 내려받기
git clone https://github.com/내계정/notion2web-starter.git
cd notion2web-starter

# 2. .env 파일 만들고 값 채우기
cp .env.example .env

# 3. 실행
npm install
npm run dev
# → http://localhost:1313 에서 확인
```

## 문서

- [docs/SETUP.md](docs/SETUP.md) — 각 단계별 상세 설정 가이드
- [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) — 디자인 수정, 폰트 변경, SEO 설정
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — 문제 해결

---

*Built with ❤️ from the HUMANERD Project.*