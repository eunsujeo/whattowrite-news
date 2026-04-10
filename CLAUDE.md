# CLAUDE.md

## 프로젝트 개요

AI 코딩 도구(Claude, Codex) 블로그를 매일 자동 크롤링하고 AI로 분석하여 학습용 정적 사이트를 생성하는 프로젝트.

- **사이트**: https://eunsujeo.github.io/whattowrite-news/
- **저장소**: https://github.com/eunsujeo/whattowrite-news

## 기술 스택

- Node.js (CommonJS)
- cheerio (HTML 파싱)
- @anthropic-ai/sdk (AI 분석)
- GitHub Actions (매일 09:00 KST 자동 실행)
- GitHub Pages (docs/ 폴더 배포)

## 프로젝트 구조

```
scripts/
  crawl.js          # 블로그 크롤링 (새 글 감지 + 본문 + 날짜 추출)
  analyze.js        # Claude API로 분석 (요약, 사용법, 추천 시나리오)
  build.js          # 분석 데이터 → docs/index.html 생성
  run.js            # crawl → analyze → build 전체 실행
  manual-analyze.js # API 키 없이 수동 분석 데이터 적용
data/
  articles.json     # 크롤링 + 분석 데이터 (git 추적됨)
docs/
  index.html        # 빌드된 사이트 (GitHub Pages 배포 대상)
```

## 주요 명령어

```bash
npm run crawl     # 새 글 크롤링만
npm run analyze   # 미분석 글 AI 분석 (ANTHROPIC_API_KEY 필요)
npm run build     # 사이트 빌드
npm run run       # 전체 실행 (crawl → analyze → build)
```

## 크롤링 대상

| 소스 | URL | 파서 |
|------|-----|------|
| Claude Blog | https://claude.com/blog/ | `a[href^="/blog/"]` 링크 추출 |
| Codex Blog | https://developers.openai.com/blog/topic/codex | `a[href*="/blog/"]` 링크 추출 |

## 규칙

- 날짜는 항상 한국어 형식 (`2026년 4월 9일`)
- 글 제목에서 `| Claude`, `| OpenAI Developers` 접미사 제거
- 날짜 추출은 nav/header 제거 전에 body 텍스트에서 수행 (Codex 글 날짜가 nav에 있음)
- 분석 결과는 한국어로 작성
- docs/index.html은 직접 수정하지 않음 (build.js가 생성)
- data/articles.json은 git 추적 대상 (GitHub Actions가 자동 커밋)

## 새 블로그 소스 추가 방법

1. `scripts/crawl.js`의 `SOURCES` 배열에 추가
2. 필요시 `extractArticleUrls()`에 파싱 로직 추가
3. `npm run crawl`로 테스트

## 환경 변수

- `ANTHROPIC_API_KEY` - Claude API 키 (analyze 시 필요, GitHub repo secret에 설정됨)
