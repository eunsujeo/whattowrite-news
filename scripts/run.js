const { crawl } = require("./crawl");
const { analyze } = require("./analyze");
const { updatePricing } = require("./pricing");
const { build } = require("./build");

async function run() {
  console.log("=== AI Coding Blog Crawler ===");
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // Step 1: Crawl
  const { newCount } = await crawl();
  console.log("");

  // Step 2: Analyze new articles with AI
  if (newCount > 0) {
    await analyze();
    console.log("");
  }

  // Step 3: Update pricing (exchange rate)
  await updatePricing();
  console.log("");

  // Step 4: Build static site
  build();

  console.log("\nDone!");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
