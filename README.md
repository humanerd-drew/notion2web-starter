# Notion2Web Starter

Notion 데이터베이스를 자동으로 Hugo 정적 사이트로 동기화하는 프레임워크.
Cloudflare R2 이미지 호스팅 + shadcn/ui 스타일 포함.

## 주요 기능

- **Notion → 정적 사이트**: Notion에서 쓰면 웹사이트에 자동으로 반영
- **R2 이미지 호스팅**: Notion 이미지(만료됨)를 Cloudflare R2에 영구 저장
- **재귀 동기화**: 내부 링크，自动으로 연결된 페이지도 다운로드
- **커스텀 태그**: `[no-date]`로 날짜 숨기기, `[hide]`로 토글 내 콘텐츠 제외

## 빠른 시작 (5단계)

```bash
# 1. 이 저장소 fork
# https://github.com/humanerd-drew/notion2web-starter → "Use this template"

# 2. 로컬에 복제
git clone https://github.com/YOUR_NAME/notion2web-starter.git
cd notion2web-starter

# 3. 의존성 설치
npm install

# 4. Hugo 설치 (macOS)
brew install hugo

# 5. .env.example → .env 복사 후 값 채우기
cp .env.example .env
```

`.env`에 채워야 할 값 (어디서 구하는지는 [docs/SETUP.md](docs/SETUP.md) 참조):
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`
- `NOTION_PARENT_PAGE_ID`
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_PUBLIC_URL`
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

Notion 페이지/데이터베이스에 integration 연결 필요 (상세: [docs/SETUP.md](docs/SETUP.md))

## 로컬 개발

```bash
npm run dev
# → http://localhost:1313 에서 확인
```

## 배포 (Cloudflare Pages)

1. Cloudflare Pages dashboard → GitHub repository 연결
2. Build settings:
   - Framework preset: `Hugo`
   - Build command: `npm run build`
   - Build output directory: `public`
3. Environment variables에 위의 10개 값 입력
4. `main` 브랜치 push하면 자동 배포

## 문서

- [docs/SETUP.md](docs/SETUP.md) — 상세 설정 가이드 (Secrets 순서, Hugo 설치, Cloudflare 설정)
- [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) — Tailwind/CSS, Hugo 템플릿, SEO 커스터마이징
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — 자주 발생하는 문제 해결

## AI에게 물어볼 때

- "notion2web starter 세팅 도와줘" → README 빠른 시작 사용
- "notion2web R2 설정 방법 알려줘" → docs/SETUP.md 참조
- "notion2web 이미지 안 보여" → docs/TROUBLESHOOTING.md 참조

---

*Built with ❤️ from the HUMANERD Project.*