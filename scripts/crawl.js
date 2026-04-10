const { load } = require("cheerio");
const fs = require("fs");
const path = require("path");

const SOURCES = [
  {
    id: "claude",
    name: "Claude Blog",
    listUrl: "https://claude.com/blog/",
    baseUrl: "https://claude.com",
  },
  {
    id: "codex",
    name: "Codex Blog",
    listUrl: "https://developers.openai.com/blog/topic/codex",
    baseUrl: "https://developers.openai.com",
  },
];

const DATA_PATH = path.join(__dirname, "..", "data", "articles.json");

async function fetchHTML(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

// Extract unique blog post URLs from listing page
function extractArticleUrls(html, source) {
  const $ = load(html);
  const urls = new Set();

  if (source.id === "claude") {
    $('a[href^="/blog/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href && href !== "/blog/" && href !== "/blog") {
        urls.add(`${source.baseUrl}${href}`);
      }
    });
  } else {
    $('a[href*="/blog/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (!href || href.includes("/topic/") || href === "/blog/") return;
      const url = href.startsWith("http") ? href : `${source.baseUrl}${href}`;
      urls.add(url);
    });
  }

  return [...urls];
}

// Fetch an individual article page and extract title, date, content
async function fetchArticle(url, sourceId) {
  const html = await fetchHTML(url);
  const $ = load(html);

  // Title: try <title>, og:title, or first h1
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim().split("|")[0].trim() ||
    "";

  // Date: try <time>, meta, or date patterns in text
  const date =
    $("time").first().attr("datetime") ||
    $("time").first().text().trim() ||
    $('meta[property="article:published_time"]').attr("content") ||
    "";

  // Content: clean and extract
  $("nav, footer, script, style, header, [role='navigation']").remove();
  const content = (
    $("main, article, [role='main']").first().text().trim() ||
    $("body").text().trim()
  ).slice(0, 8000);

  return { title, date, url, source: sourceId, content, analyzed: false };
}

async function crawl() {
  console.log("Starting crawl...");

  // Load existing data
  let existing = { lastUpdated: "", articles: [] };
  try {
    existing = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    // First run
  }

  const existingUrls = new Set(existing.articles.map((a) => a.url));
  const newArticles = [];

  for (const source of SOURCES) {
    console.log(`Crawling ${source.name}...`);
    try {
      const html = await fetchHTML(source.listUrl);
      const urls = extractArticleUrls(html, source);
      console.log(`  Found ${urls.length} article URLs`);

      for (const url of urls) {
        if (existingUrls.has(url)) continue;

        try {
          console.log(`  Fetching: ${url}`);
          const article = await fetchArticle(url, source.id);
          if (article.title && article.title.length >= 5) {
            console.log(`  NEW: ${article.title}`);
            newArticles.push(article);
          }
        } catch (err) {
          console.error(`  Error fetching ${url}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`  Error crawling ${source.name}:`, err.message);
    }
  }

  if (newArticles.length === 0) {
    console.log("No new articles found.");
    return { newCount: 0 };
  }

  // Add new articles to data
  existing.articles = [...newArticles, ...existing.articles];
  existing.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(existing, null, 2));

  console.log(`Found ${newArticles.length} new articles.`);
  return { newCount: newArticles.length };
}

module.exports = { crawl };

if (require.main === module) {
  crawl().catch(console.error);
}
