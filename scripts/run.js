const { crawl } = require("./crawl");
const { updatePricing } = require("./pricing");
const { build } = require("./build");

async function run() {
  console.log("=== AI Coding Blog Crawler ===");
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // Step 1: Crawl (saves new articles with analyzed:false)
  await crawl();
  console.log("");

  // Note: Analysis is performed locally via Claude Code, not in CI.
  // See CLAUDE.md for the local analyze workflow.

  // Step 2: Update pricing (exchange rate)
  await updatePricing();
  console.log("");

  // Step 3: Build static site (only renders analyzed articles)
  build();

  console.log("\nDone!");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
