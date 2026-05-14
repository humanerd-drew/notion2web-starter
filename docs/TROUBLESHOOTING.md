# Notion2Web Starter — 문제 해결

---

## Notion API 에러

### "API rate limit exceeded"

Notion API는 3초당 1회 호출 제한이 있음. 스크립트에 내장된 재시도 로직이 있지만, 동기화 página가 많으면 가끔 실패할 수 있음.

**해결**: 다시 실행하면 됨. 계속 실패하면 `scripts/notion-to-hugo.js`의 `getBlocks` 함수의 재시도 delay를 늘리세요.

### "object not found" 또는 "Could not find page"

- Notion Integration이 해당 페이지에 접근 권한 없음
- **해결**: Notion에서 페이지 열기 → 우측 **"..."** → **"Add connections"** → integration 선택

### "Make sure the integration has access to this database"

데이터베이스 접근 권한 없음. 동일한 방식으로 데이터베이스에도 integration 추가.

---

## Hugo 빌드 에러

### " Hugo not found"

Hugo가 설치되지 않음.
```bash
brew install hugo  # macOS
```
[공식 설치 가이드](https://gohugo.io/installation/) 참조.

### "Error: build failed: ..."

대부분 `content/` 폴더의 Markdown 오류 때문:
- Frontmatter 형식 불일치
- 지원되지 않는 block type 포함

**해결**: GitHub Actions 로그에서 어떤 파일이 문제인지 확인 후 Notion에서 해당 페이지 수정.

---

## 이미지 관련

### 이미지가 표시되지 않음

1. **R2 버킷 Public 접근 허용**: Cloudflare R2 → 버킷 → Settings → **Manage R2 public access** 확인
2. **R2_PUBLIC_URL** 환경 변수 올바른지 확인 (https://pub-xxx.r2.dev 형태)
3. Notion 이미지 URL이 만료되었을 수 있음 — Notion에서 이미지 다시 삽입

### WebP 변환 실패

`sharp` 라이브러리 에러. macOS에서 종종 발생:
```bash
brew install sharp
```
또는 Node.js 재설치.

---

## GitHub Actions 관련

### "Cannot find module" 에러

`node_modules/` 가 `.gitignore`에 있으면 GitHub Actions에서 설치 안 됨.
```bash
git rm -r --cached node_modules
```
후 다시 시도.

### Cloudflare Pages 배포 실패

1. **Build command 확인**: `npm run build` 인지
2. **Environment variables**: Cloudflare Pages dashboard의 Environment variables에 10개 모두 입력되었는지
3. **Build output directory**: `public`으로 설정되었는지

---

## 일반적인 디버깅 순서

1. 로컬에서 `npm run dev` 실행해서 에러 확인
2. `.env` 값들이 정확한지再確認
3. Notion 페이지/DB에 integration 연결되었는지 확인
4. GitHub repository Secrets 및 Cloudflare Pages env vars 일치 여부 확인

---

*Built with ❤️ from the HUMANERD Project.*