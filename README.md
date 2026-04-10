# AI Coding Tools - 매일 분석 가이드

Claude & Codex 공식 블로그를 매일 자동 크롤링하고, AI가 분석하여 사용법을 정리하는 학습용 사이트입니다.

**사이트**: https://eunsujeo.github.io/whattowrite-news/

## 구조

```
scripts/
  crawl.js          # 블로그 크롤링 (새 글 감지 + 본문 수집)
  analyze.js        # Claude API로 AI 분석 (요약, 사용법, 추천 시나리오)
  build.js          # 분석 결과 → 정적 HTML 생성
  run.js            # crawl → analyze → build 전체 실행
  manual-analyze.js # API 키 없이 수동 분석 데이터 적용
data/
  articles.json     # 크롤링 + 분석 데이터
docs/
  index.html        # 빌드된 사이트 (GitHub Pages 배포)
```

## 사용법

### 1. 수동 업데이트 (API 키 없이)

```bash
# 새 글 크롤링만
npm run crawl

# 사이트 빌드 (기존 분석 데이터로)
npm run build

# 브라우저에서 확인
open docs/index.html
```

### 2. 전체 자동 실행 (API 키 필요)

```bash
# Anthropic API 키 설정
export ANTHROPIC_API_KEY=sk-ant-...

# 크롤링 → AI 분석 → 사이트 빌드
npm run run
```

### 3. 배포

```bash
git add data/articles.json docs/index.html
git commit -m "chore: update articles"
git push
```

push하면 GitHub Pages에 자동 반영됩니다.

### 4. 다른 PC에서 작업하기

```bash
git clone https://github.com/eunsujeo/whattowrite-news.git
cd whattowrite-news
npm install
npm run run   # 또는 npm run crawl && npm run build
git push
```

## GitHub Actions 자동화

매일 오전 9시(KST)에 자동으로 크롤링 + 분석 + 배포가 실행됩니다.

### 설정 방법

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. **New repository secret** 클릭
3. Name: `ANTHROPIC_API_KEY`, Value: API 키 입력
4. 저장

### 수동 실행

GitHub 저장소 → Actions → "Daily Blog Crawl & Analysis" → Run workflow

## 크롤링 대상

| 소스 | URL |
|------|-----|
| Claude Blog | https://claude.com/blog/ |
| Codex Blog | https://developers.openai.com/blog/topic/codex |

## AI 분석 항목

각 블로그 글에 대해 다음을 분석합니다:

- **요약** - 핵심 내용 3-4줄
- **주요 기능** - 핵심 기능/특징 3-5개
- **사용 방법** - 실제로 어떻게 사용하는지
- **추천 시나리오** - 이런 상황에서 사용하면 좋다
- **난이도** - 초급/중급/고급
- **추천 도구** - Claude/Codex/둘 다
