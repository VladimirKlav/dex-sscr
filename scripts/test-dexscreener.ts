#!/usr/bin/env tsx
/**
 * Test DexScreener API for X1/XDEX data
 */

import { getDexScreenerClient } from "../src/lib/dexscreener-client";

async function main() {
  console.log("=".repeat(60));
  console.log("Testing DexScreener API for X1/XDEX");
  console.log("=".repeat(60));

  const client = getDexScreenerClient();

  console.log("\n1. Searching for X1/XDEX pairs...");
  const allPairs = await client.getAllX1Pairs();
  console.log(`✅ Found ${allPairs.length} pairs on X1/XDEX`);

  if (allPairs.length > 0) {
    console.log("\n📊 Sample Pair:");
    const sample = allPairs[0];
    console.log(`  Pair: ${sample.baseToken.symbol}/${sample.quoteToken.symbol}`);
    console.log(`  DEX: ${sample.dexId}`);
    console.log(`  Price USD: $${sample.priceUsd || "N/A"}`);
    console.log(`  Volume 24h: $${sample.volume?.h24?.toFixed(2) || "N/A"}`);
    console.log(`  Liquidity: $${sample.liquidity?.usd?.toFixed(2) || "N/A"}`);
    console.log(`  Price Change 24h: ${sample.priceChange?.h24?.toFixed(2) || "N/A"}%`);
  }

  console.log("\n2. Getting top gainers...");
  const gainers = await client.getTopGainers("x1", "h24");
  console.log(`✅ Found ${gainers.length} gainers`);

  if (gainers.length > 0) {
    console.log("\n🚀 Top 3 Gainers (24h):");
    gainers.slice(0, 3).forEach((pair, i) => {
      console.log(`  ${i + 1}. ${pair.baseToken.symbol}/${pair.quoteToken.symbol}: +${pair.priceChange.h24.toFixed(2)}%`);
    });
  }

  console.log("\n3. Getting trending pairs...");
  const trending = await client.getTrendingPairs("x1", 5);
  console.log(`✅ Found ${trending.length} trending pairs`);

  if (trending.length > 0) {
    console.log("\n🔥 Top 3 by Volume:");
    trending.slice(0, 3).forEach((pair, i) => {
      console.log(`  ${i + 1}. ${pair.baseToken.symbol}/${pair.quoteToken.symbol}: $${pair.volume?.h24?.toFixed(2) || 0} (24h)`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ DexScreener API Test Complete!");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
