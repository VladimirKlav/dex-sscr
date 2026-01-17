#!/usr/bin/env tsx
/**
 * Test script for XDEX API endpoints
 * Run this locally to discover available endpoints
 */

import { logger } from "../src/utils/logger";

const API_BASE = "https://api.xdex.xyz/api/xendex";
const NETWORK = "X1 Mainnet";

/**
 * Test the documented swap/prepare endpoint
 */
async function testSwapPrepare() {
  logger.info("[Test] Testing POST /api/xendex/swap/prepare");

  try {
    const response = await fetch(`${API_BASE}/swap/prepare`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        network: NETWORK,
        wallet: "11111111111111111111111111111111", // Placeholder
        token_in: "So11111111111111111111111111111111111111112", // SOL (example)
        token_out: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC (example)
        token_in_amount: 0.01,
        is_exact_amount_in: true,
      }),
    });

    logger.info(`[Test] Response status: ${response.status}`);
    const text = await response.text();
    logger.info(`[Test] Response: ${text}`);

    if (response.ok) {
      const data = JSON.parse(text);
      logger.info("[Test] ✅ /swap/prepare works!");
      logger.info(`[Test] Response keys: ${Object.keys(data).join(", ")}`);
      return data;
    } else {
      logger.warn(`[Test] ❌ /swap/prepare failed: ${response.status}`);
    }
  } catch (error) {
    logger.error("[Test] Error testing /swap/prepare:", error);
  }
}

/**
 * Try to discover available endpoints
 */
async function discoverEndpoints() {
  logger.info("\n[Discovery] Trying to discover available endpoints...\n");

  const possibleEndpoints = [
    // Tokens
    { method: "GET", path: "/tokens", params: `?network=${NETWORK}` },
    { method: "GET", path: "/tokens/list", params: `?network=${NETWORK}` },
    { method: "GET", path: "/token-list", params: `?network=${NETWORK}` },

    // Pools/Pairs
    { method: "GET", path: "/pools", params: `?network=${NETWORK}` },
    { method: "GET", path: "/pools/list", params: `?network=${NETWORK}` },
    { method: "GET", path: "/pairs", params: `?network=${NETWORK}` },

    // Stats
    { method: "GET", path: "/stats", params: `?network=${NETWORK}` },
    { method: "GET", path: "/stats/24h", params: `?network=${NETWORK}` },
    { method: "GET", path: "/statistics", params: `?network=${NETWORK}` },

    // Swaps/Transactions
    { method: "GET", path: "/swaps", params: `?network=${NETWORK}` },
    { method: "GET", path: "/transactions", params: `?network=${NETWORK}` },

    // Price
    { method: "GET", path: "/price", params: `?network=${NETWORK}` },
    { method: "GET", path: "/prices", params: `?network=${NETWORK}` },
  ];

  const workingEndpoints: string[] = [];

  for (const endpoint of possibleEndpoints) {
    try {
      const url = `${API_BASE}${endpoint.path}${endpoint.params}`;
      logger.info(`[Discovery] Trying: ${endpoint.method} ${endpoint.path}`);

      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        logger.info(`[Discovery] ✅ ${endpoint.method} ${endpoint.path} WORKS!`);
        logger.info(`[Discovery] Response keys: ${data ? Object.keys(data).join(", ") : "empty"}`);
        logger.info(`[Discovery] Sample data: ${JSON.stringify(data).substring(0, 200)}...\n`);

        workingEndpoints.push(`${endpoint.method} ${endpoint.path}`);
      } else if (response.status === 404) {
        logger.warn(`[Discovery] ❌ ${endpoint.method} ${endpoint.path} - 404 Not Found`);
      } else {
        logger.warn(
          `[Discovery] ⚠️  ${endpoint.method} ${endpoint.path} - ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      logger.error(`[Discovery] Error testing ${endpoint.path}:`, error);
    }

    // Rate limit: wait 500ms between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  logger.info("\n" + "=".repeat(60));
  logger.info("WORKING ENDPOINTS:");
  logger.info("=".repeat(60));

  if (workingEndpoints.length === 0) {
    logger.warn("No endpoints discovered. They may require authentication or different parameters.");
  } else {
    workingEndpoints.forEach((endpoint) => {
      logger.info(`✅ ${endpoint}`);
    });
  }

  logger.info("=".repeat(60) + "\n");
}

/**
 * Try common REST patterns for specific resources
 */
async function testResourcePatterns() {
  logger.info("\n[Patterns] Testing common REST patterns...\n");

  // Try to get a specific token (if we knew an address)
  const testMints = [
    "So11111111111111111111111111111111111111112", // SOL (might work)
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC (might work)
  ];

  for (const mint of testMints) {
    const patterns = [
      `/token/${mint}?network=${NETWORK}`,
      `/tokens/${mint}?network=${NETWORK}`,
      `/token?mint=${mint}&network=${NETWORK}`,
      `/tokens?mint=${mint}&network=${NETWORK}`,
    ];

    for (const pattern of patterns) {
      try {
        const url = `${API_BASE}${pattern}`;
        logger.info(`[Patterns] Trying: GET ${pattern.substring(0, 50)}...`);

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          logger.info(`[Patterns] ✅ Found working pattern!`);
          logger.info(`[Patterns] URL: ${pattern}`);
          logger.info(
            `[Patterns] Response: ${JSON.stringify(data).substring(0, 200)}...\n`,
          );
          return; // Stop after first success
        }
      } catch (error) {
        // Ignore errors
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

/**
 * Main test runner
 */
async function main() {
  logger.info("=".repeat(60));
  logger.info("XDEX API Endpoint Discovery");
  logger.info(`API Base: ${API_BASE}`);
  logger.info(`Network: ${NETWORK}`);
  logger.info("=".repeat(60) + "\n");

  // Test documented endpoint
  await testSwapPrepare();

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Discover other endpoints
  await discoverEndpoints();

  // Test resource patterns
  await testResourcePatterns();

  logger.info("\n[Test] Complete!");
  logger.info("\nNext steps:");
  logger.info("1. Review the working endpoints above");
  logger.info("2. Update src/lib/xdex-api.ts with correct URLs");
  logger.info("3. Update src/services/xdex-sync.ts to use correct data structure");
  logger.info("4. Run: bun run sync");
}

main().catch((error) => {
  logger.error("[Test] Fatal error:", error);
  process.exit(1);
});
