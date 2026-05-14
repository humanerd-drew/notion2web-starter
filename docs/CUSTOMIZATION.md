# Notion2Web Starter — 커스터마이징 가이드

---

## Tailwind CSS 수정

### 색상 변경

`tailwind.config.js` 수정:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#YOUR_COLOR',
      },
    },
  },
}
```

### 폰트 변경

`assets/css/main.css` 상단:
```css
@import url('https://fonts.googleapis.com/css2?family=Your+Font&display=swap');
```

---

## Hugo 템플릿 구조

```
layouts/
├── _default/
│   ├── baseof.html   # 기본 HTML 구조
│   ├── single.html  # 단일 페이지 템플릿
│   └── list.html    # 목록 페이지 템플릿
└── partials/
    ├── seo.html     # SEO 메타 태그
    └── analytics.html # 분석 스크립트
```

### 특정 페이지 레이아웃 변경

Notion 페이지 frontmatter에 추가:
```yaml
layout: "custom"
```

`layouts/custom.html` 파일 생성.

---

## SEO 설정

`hugo.toml`에서 수정:

```toml
[params]
  title = "Your Site Name"
  description = "Site description"
  og_image = "/images/og.png"

[params.analytics]
  ga_id = "G-XXXXXXXXXX"
  naver_verification = "xxxxxxxxxx"
  clarity_id = "xxxxxxxxxx"
```

---

## 이미지/Cover 설정 변경

`scripts/notion-to-hugo.js`의 `extractCoverUrl` 함수에서:
- Page cover 우선 → Content 내 첫 번째 이미지로 변경 가능
- Cover 없는 경우 기본 placeholder 스타일 변경

---

*Built with ❤️ from the HUMANERD Project.*