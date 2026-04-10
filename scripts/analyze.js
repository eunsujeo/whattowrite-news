const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "articles.json");

const client = new Anthropic.default();

const ANALYZE_PROMPT = `당신은 AI 코딩 도구 전문 분석가입니다.
아래 블로그 글의 내용을 분석하여 JSON 형식으로 응답해주세요.

블로그 글:
- 제목: {title}
- 출처: {source}
- URL: {url}
- 내용:
{content}

다음 JSON 형식으로 응답해주세요 (JSON만 출력, 다른 텍스트 없이):
{
  "summary": "3-4줄 핵심 요약 (한국어)",
  "keyFeatures": ["주요 기능/특징 3-5개 (한국어)"],
  "howToUse": "실제로 어떻게 사용하는지 구체적 방법 설명 (한국어, 3-5줄)",
  "useCases": ["이런 상황에서 사용하면 좋다 - 구체적 시나리오 3-4개 (한국어)"],
  "tags": ["관련 키워드 태그 3-5개 (한국어)"],
  "difficulty": "초급|중급|고급",
  "toolRecommendation": "Claude|Codex|둘 다"
}`;

async function analyzeArticle(article) {
  const prompt = ANALYZE_PROMPT
    .replace("{title}", article.title)
    .replace("{source}", article.source === "claude" ? "Anthropic Claude Blog" : "OpenAI Codex Blog")
    .replace("{url}", article.url)
    .replace("{content}", article.content || "내용을 가져올 수 없었습니다. 제목과 URL을 기반으로 분석해주세요.");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].text.trim();

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]);
}

async function analyze() {
  console.log("Starting analysis...");

  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const unanalyzed = data.articles.filter((a) => !a.analyzed);

  if (unanalyzed.length === 0) {
    console.log("No articles to analyze.");
    return;
  }

  console.log(`Analyzing ${unanalyzed.length} articles...`);

  for (const article of unanalyzed) {
    console.log(`  Analyzing: ${article.title}`);
    try {
      const analysis = await analyzeArticle(article);
      article.analysis = analysis;
      article.analyzed = true;
      article.analyzedAt = new Date().toISOString();
      console.log(`  Done: ${article.title}`);
    } catch (err) {
      console.error(`  Error analyzing ${article.title}:`, err.message);
    }
  }

  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log("Analysis complete.");
}

module.exports = { analyze };

if (require.main === module) {
  analyze().catch(console.error);
}
