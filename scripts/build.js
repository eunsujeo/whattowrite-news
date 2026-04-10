const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "articles.json");
const OUTPUT_PATH = path.join(__dirname, "..", "docs", "index.html");

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderArticleCard(article) {
  const a = article.analysis || {};
  const badgeClass = article.source === "claude" ? "badge-claude" : "badge-codex";
  const badgeText = article.source === "claude" ? "Claude" : "Codex";
  const difficultyColor = {
    "초급": "var(--accent-tip)",
    "중급": "var(--accent-claude)",
    "고급": "var(--accent-warn)",
  }[a.difficulty] || "var(--text-muted)";

  const tags = (a.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  const features = (a.keyFeatures || []).map((f) => `<li>${escapeHtml(f)}</li>`).join("");
  const useCases = (a.useCases || []).map((u) => `<li>${escapeHtml(u)}</li>`).join("");

  return `
    <article class="article-card" data-source="${article.source}">
      <div class="card-header">
        <div class="card-meta">
          <span class="badge ${badgeClass}">${badgeText}</span>
          ${a.difficulty ? `<span class="difficulty" style="color:${difficultyColor}">${escapeHtml(a.difficulty)}</span>` : ""}
          <span class="card-date">${escapeHtml(article.date || "")}</span>
        </div>
        <h3><a href="${escapeHtml(article.url)}" target="_blank">${escapeHtml(article.title)}</a></h3>
      </div>

      ${a.summary ? `
      <div class="card-section">
        <h4>요약</h4>
        <p>${escapeHtml(a.summary)}</p>
      </div>` : ""}

      ${features ? `
      <div class="card-section">
        <h4>주요 기능</h4>
        <ul>${features}</ul>
      </div>` : ""}

      ${a.howToUse ? `
      <div class="card-section">
        <h4>사용 방법</h4>
        <p>${escapeHtml(a.howToUse)}</p>
      </div>` : ""}

      ${useCases ? `
      <div class="card-section">
        <h4>이럴 때 사용하세요</h4>
        <ul class="use-cases">${useCases}</ul>
      </div>` : ""}

      <div class="card-footer">
        <div class="tags">${tags}</div>
        <a class="source-link" href="${escapeHtml(article.url)}" target="_blank">원문 보기 &rarr;</a>
      </div>
    </article>`;
}

function buildHTML(data) {
  const claudeArticles = data.articles.filter((a) => a.source === "claude" && a.analyzed);
  const codexArticles = data.articles.filter((a) => a.source === "codex" && a.analyzed);
  const allAnalyzed = data.articles.filter((a) => a.analyzed);

  const lastUpdated = data.lastUpdated
    ? new Date(data.lastUpdated).toLocaleDateString("ko-KR", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "아직 업데이트 없음";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Coding Tools - 매일 분석 가이드</title>
  <style>
    :root {
      --bg: #0a0a0b;
      --surface: #141416;
      --surface2: #1c1c20;
      --border: #2a2a2e;
      --text: #e4e4e7;
      --text-muted: #8b8b94;
      --accent-claude: #d4a574;
      --accent-codex: #74b4d4;
      --accent-tip: #74d4a5;
      --accent-warn: #d47474;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg); color: var(--text); line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: rgba(10,10,11,0.85); backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border); padding: 0 2rem;
    }
    .nav-inner {
      max-width: 1000px; margin: 0 auto; display: flex;
      align-items: center; justify-content: space-between; height: 60px;
    }
    .logo { font-size: 1.1rem; font-weight: 700; }
    .nav-links { display: flex; gap: 0.25rem; list-style: none; }
    .nav-links button {
      color: var(--text-muted); background: none; border: none;
      font-size: 0.85rem; padding: 0.4rem 0.8rem; border-radius: 6px;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .nav-links button:hover, .nav-links button.active {
      color: var(--text); background: var(--surface2);
    }
    .update-info {
      font-size: 0.75rem; color: var(--text-muted);
    }

    .hero {
      padding: 7rem 2rem 3rem; text-align: center; max-width: 700px; margin: 0 auto;
    }
    .hero h1 {
      font-size: 2.4rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2;
      margin-bottom: 0.75rem;
      background: linear-gradient(135deg, var(--accent-claude), var(--accent-codex));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero p { font-size: 1rem; color: var(--text-muted); }
    .hero .stats {
      display: flex; justify-content: center; gap: 2rem; margin-top: 1.5rem;
    }
    .hero .stat { text-align: center; }
    .hero .stat-num { font-size: 1.8rem; font-weight: 800; color: var(--text); }
    .hero .stat-label { font-size: 0.75rem; color: var(--text-muted); }

    main { max-width: 1000px; margin: 0 auto; padding: 0 2rem 4rem; }

    .filter-bar {
      display: flex; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap;
    }
    .filter-btn {
      padding: 0.4rem 1rem; border: 1px solid var(--border); border-radius: 20px;
      background: none; color: var(--text-muted); font-size: 0.8rem; cursor: pointer;
      transition: all 0.2s; font-family: inherit;
    }
    .filter-btn.active, .filter-btn:hover {
      background: var(--surface2); color: var(--text); border-color: #3a3a40;
    }

    .article-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 2rem; margin-bottom: 1.5rem;
      transition: all 0.25s;
    }
    .article-card:hover { border-color: #3a3a40; }
    .article-card.hidden { display: none; }

    .card-header { margin-bottom: 1.25rem; }
    .card-meta {
      display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;
    }
    .badge {
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.08em; padding: 0.2rem 0.6rem; border-radius: 4px;
    }
    .badge-claude { background: rgba(212,165,116,0.15); color: var(--accent-claude); }
    .badge-codex { background: rgba(116,180,212,0.15); color: var(--accent-codex); }
    .difficulty { font-size: 0.75rem; font-weight: 600; }
    .card-date { font-size: 0.75rem; color: var(--text-muted); }

    .card-header h3 { font-size: 1.2rem; font-weight: 700; line-height: 1.4; }
    .card-header h3 a { color: var(--text); text-decoration: none; }
    .card-header h3 a:hover { text-decoration: underline; }

    .card-section { margin-bottom: 1rem; }
    .card-section h4 {
      font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--accent-tip); margin-bottom: 0.4rem;
    }
    .card-section p { font-size: 0.9rem; color: var(--text-muted); }
    .card-section ul { padding-left: 1.25rem; }
    .card-section li {
      font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.25rem;
    }
    .use-cases li { color: var(--text); }

    .card-footer {
      display: flex; justify-content: space-between; align-items: flex-end;
      margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);
    }
    .tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .tag {
      font-size: 0.7rem; padding: 0.2rem 0.5rem; background: var(--surface2);
      border-radius: 4px; color: var(--text-muted);
    }
    .source-link {
      font-size: 0.8rem; color: var(--accent-codex); text-decoration: none;
      white-space: nowrap;
    }
    .source-link:hover { opacity: 0.8; }

    .empty-state {
      text-align: center; padding: 4rem 2rem; color: var(--text-muted);
    }
    .empty-state h3 { font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text); }

    footer {
      text-align: center; padding: 3rem 2rem; border-top: 1px solid var(--border);
      color: var(--text-muted); font-size: 0.8rem;
    }
    footer a { color: var(--accent-codex); text-decoration: none; }

    .new-badge {
      display: inline-block; font-size: 0.65rem; font-weight: 700;
      background: var(--accent-warn); color: #fff; padding: 0.15rem 0.4rem;
      border-radius: 3px; margin-left: 0.5rem; vertical-align: middle;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    @media (max-width: 768px) {
      .hero h1 { font-size: 1.8rem; }
      .hero .stats { gap: 1rem; }
      .article-card { padding: 1.25rem; }
      .filter-bar { gap: 0.3rem; }
    }
    html { scroll-behavior: smooth; }
  </style>
</head>
<body>

<nav>
  <div class="nav-inner">
    <div class="logo">AI Coding Guide</div>
    <div class="update-info">마지막 업데이트: ${lastUpdated}</div>
  </div>
</nav>

<div class="hero">
  <h1>AI Coding Tools<br>매일 분석 가이드</h1>
  <p>Claude & Codex 블로그를 매일 자동 크롤링하고<br>AI가 분석하여 사용법을 알려드립니다</p>
  <div class="stats">
    <div class="stat">
      <div class="stat-num">${allAnalyzed.length}</div>
      <div class="stat-label">분석된 글</div>
    </div>
    <div class="stat">
      <div class="stat-num">${claudeArticles.length}</div>
      <div class="stat-label">Claude</div>
    </div>
    <div class="stat">
      <div class="stat-num">${codexArticles.length}</div>
      <div class="stat-label">Codex</div>
    </div>
  </div>
</div>

<main>
  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterArticles('all')">전체</button>
    <button class="filter-btn" onclick="filterArticles('claude')">Claude</button>
    <button class="filter-btn" onclick="filterArticles('codex')">Codex</button>
  </div>

  <div id="articles">
    ${allAnalyzed.length > 0
      ? allAnalyzed.map(renderArticleCard).join("\n")
      : `<div class="empty-state">
          <h3>아직 분석된 글이 없습니다</h3>
          <p>첫 번째 크롤링 + 분석이 실행되면 여기에 결과가 표시됩니다.</p>
        </div>`
    }
  </div>
</main>

<footer>
  <p>매일 자동 업데이트 | 출처:
    <a href="https://claude.com/blog/" target="_blank">Claude Blog</a> &middot;
    <a href="https://developers.openai.com/blog/topic/codex" target="_blank">Codex Blog</a>
  </p>
  <p style="margin-top:0.5rem;opacity:0.5;">AI로 크롤링 및 분석된 콘텐츠입니다. 정확한 내용은 원문을 확인하세요.</p>
</footer>

<script>
function filterArticles(source) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.article-card').forEach(card => {
    if (source === 'all' || card.dataset.source === source) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}
</script>

</body>
</html>`;
}

function build() {
  console.log("Building site...");
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const html = buildHTML(data);
  fs.writeFileSync(OUTPUT_PATH, html);
  console.log(`Built site with ${data.articles.filter((a) => a.analyzed).length} articles → docs/index.html`);
}

module.exports = { build };

if (require.main === module) {
  build();
}
