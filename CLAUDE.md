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
  analyze.js        # (옵션) Claude API 분석 스크립트 — CI에서는 사용 안 함
  build.js          # 분석 데이터 → docs/index.html 생성 (analyzed:true만 렌더)
  run.js            # crawl → pricing → build (analyze 제외)
  manual-analyze.js # 하드코딩된 분석 데이터 적용 (레거시)
data/
  articles.json     # 크롤링 + 분석 데이터 (git 추적됨)
docs/
  index.html        # 빌드된 사이트 (GitHub Pages 배포 대상)
```

## 주요 명령어

```bash
npm run crawl     # 새 글 크롤링만
npm run build     # 사이트 빌드
npm run run       # 전체 실행 (crawl → pricing → build)
```

## 분석 워크플로우 (중요)

**분석은 CI에서 자동 실행하지 않습니다.** Anthropic API 크레딧 소비를 피하기 위해 **로컬에서 Claude Code로 직접 수행**합니다.

### 흐름
1. GitHub Actions가 매일 자동 실행 → 새 글을 `analyzed:false`로 [data/articles.json](data/articles.json)에 저장, 커밋/푸시
2. [build.js](scripts/build.js)는 `analyzed:true`인 글만 사이트에 노출 → 신규 글은 분석되기 전까지 숨김 상태
3. 새 글이 쌓이면 로컬에서:
   - `git pull`
   - Claude Code에 "articles.json에서 analyzed:false인 글 분석해줘"라고 요청
   - Claude Code가 각 글의 `content`를 읽고, 아래 스키마의 JSON을 생성해 articles.json에 write-back하며 `analyzed:true` + `analyzedAt` 설정
   - `npm run build` → `git commit && git push`

### 분석 JSON 스키마 (모든 필드 한국어)
```
analysis: {
  summary: "3-4줄 핵심 요약",
  keyFeatures: ["주요 기능/특징 3-5개"],
  howToUse: "실제 사용법 구체적 설명 3-5줄",
  useCases: ["구체적 활용 시나리오 3-4개"],
  tags: ["관련 키워드 3-5개"],
  difficulty: "초급" | "중급" | "고급",
  toolRecommendation: "Claude" | "Codex" | "둘 다"
}
```
상세 프롬프트는 [scripts/analyze.js](scripts/analyze.js)의 `ANALYZE_PROMPT` 참고.

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

- `ANTHROPIC_API_KEY` - [analyze.js](scripts/analyze.js) 로컬 실행 시에만 필요. CI/워크플로우에서는 사용하지 않음.
