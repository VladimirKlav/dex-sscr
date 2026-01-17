#!/usr/bin/env tsx
/**
 * Start the XDEX data synchronization service
 * This script syncs data from XDEX REST API to the database
 */

import { getXDEXSyncService } from "../src/services/xdex-sync";
import { logger } from "../src/utils/logger";

async function main() {
  logger.info("=".repeat(60));
  logger.info("Starting XDEX Data Synchronization Service");
  logger.info("=".repeat(60));

  const syncService = getXDEXSyncService();

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
  setInterval(() => {
    const status = syncService.getStatus();
    logger.info(`[Status] ${JSON.stringify(status, null, 2)}`);
  }, 30000);
}

main().catch((error) => {
  logger.error("[Main] Fatal error:", error);
  process.exit(1);
});
