#!/usr/bin/env tsx
/**
 * Start the DexScreener data synchronization service for X1/XDEX
 * This script syncs data from DexScreener API to the database
 */

import { getDexScreenerSyncService } from "../src/services/dexscreener-sync";
import { logger } from "../src/utils/logger";

async function main() {
  logger.info("=".repeat(60));
  logger.info("Starting DexScreener Data Synchronization Service");
  logger.info("Source: DexScreener API (https://dexscreener.com)");
  logger.info("Chain: X1");
  logger.info("DEX: XDEX");
  logger.info("=".repeat(60));

  const syncService = getDexScreenerSyncService();

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    logger.info("\n[Main] Received SIGINT, shutting down gracefully...");
    syncService.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("\n[Main] Received SIGTERM, shutting down gracefully...");
    syncService.stop();
    process.exit(0);
  });

  // Start the sync service (syncs every 60 seconds by default)
  await syncService.start(60000);

  // Log status every 30 seconds
  setInterval(async () => {
    const status = syncService.getStatus();
    const stats = await syncService.getStats();

    logger.info(`[Status] ${JSON.stringify(status, null, 2)}`);

    if (stats) {
      logger.info(`[Stats] Pairs: ${stats.totalPairs}, Volume 24h: $${stats.volume24h.toFixed(2)}, Liquidity: $${stats.liquidity.toFixed(2)}`);
      if (stats.topGainers.length > 0) {
        logger.info(`[Top Gainer] ${stats.topGainers[0].baseToken.symbol}/${stats.topGainers[0].quoteToken.symbol} +${stats.topGainers[0].priceChange.h24.toFixed(2)}%`);
      }
    }
  }, 30000);
}

main().catch((error) => {
  logger.error("[Main] Fatal error:", error);
  process.exit(1);
});
