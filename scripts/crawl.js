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
  {
    id: "codex",
    name: "OpenAI Developers Blog",
    listUrl: "https://developers.openai.com/blog",
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

const MONTHS = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

// Convert English date string to Korean format
function toKoreanDate(dateStr) {
  if (!dateStr) return "";
  const m = dateStr.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return "";
  const month = MONTHS[m[1]];
  if (!month) return "";
  return `${m[3]}년 ${month}월 ${m[2]}일`;
}

// Extract date from page content using multiple strategies
function extractDate($, bodyText) {
  // 1. <time> tag
  const timeEl = $("time").first();
  if (timeEl.length) {
    const dt = timeEl.attr("datetime") || timeEl.text().trim();
    if (dt) return dt;
  }

  // 2. meta tag
  const metaDate = $('meta[property="article:published_time"]').attr("content");
  if (metaDate) return metaDate;

  // 3. "DateMonth DD, YYYY" pattern (Claude blog)
  const claudeMatch = bodyText.match(/Date((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})/i);
  if (claudeMatch) return claudeMatch[1];

  // 4. "Mon DD, YYYY" pattern (Codex blog - e.g. "Mar 25, 2026")
  const shortMatch = bodyText.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4})/);
  if (shortMatch) return shortMatch[1];

  return "";
}

// Fetch an individual article page and extract title, date, content
async function fetchArticle(url, sourceId) {
  const html = await fetchHTML(url);
  const $ = load(html);

  // Title: try og:title, first h1, or <title>
  let title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim().split("|")[0].trim() ||
    "";
  // Clean title suffix
  title = title.replace(/\s*\|\s*(Claude|OpenAI Developers)$/, "");

  // Date: extract BEFORE removing nav/header (date may be in those elements)
  const fullText = $("body").text();
  const rawDate = extractDate($, fullText);
  const date = toKoreanDate(rawDate);

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
