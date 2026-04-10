const fs = require("fs");
const path = require("path");

const PRICING_PATH = path.join(__dirname, "..", "data", "pricing.json");

async function fetchExchangeRate() {
  // Free API, no key required
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error(`Exchange rate API failed: ${res.status}`);
  const data = await res.json();
  if (!data.rates || !data.rates.KRW) throw new Error("KRW rate not found");
  return data.rates.KRW;
}

async function updatePricing() {
  console.log("Fetching exchange rate...");

  const pricing = JSON.parse(fs.readFileSync(PRICING_PATH, "utf-8"));

  try {
    const krw = await fetchExchangeRate();
    pricing.exchangeRate.usdToKrw = Math.round(krw * 100) / 100;
    pricing.exchangeRate.fetchedAt = new Date().toISOString();
    console.log(`  USD/KRW: ${pricing.exchangeRate.usdToKrw}`);
  } catch (err) {
    console.error("  Exchange rate fetch failed:", err.message);
    if (!pricing.exchangeRate.usdToKrw) {
      pricing.exchangeRate.usdToKrw = 1450; // fallback
      console.log("  Using fallback rate: 1450");
    }
  }

  pricing.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PRICING_PATH, JSON.stringify(pricing, null, 2));
  console.log("Pricing data updated.");
}

module.exports = { updatePricing };

if (require.main === module) {
  updatePricing().catch(console.error);
}
