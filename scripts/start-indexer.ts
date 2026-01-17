#!/usr/bin/env tsx
/**
 * Start the blockchain indexer
 * This script starts indexing X1 blockchain for DEX events
 */

import { getIndexer } from "../src/indexer/blockchain-indexer";
import { logger } from "../src/utils/logger";

async function main() {
  logger.info("=".repeat(60));
  logger.info("Starting X1 DEX Blockchain Indexer");
  logger.info("=".repeat(60));

  const indexer = getIndexer();

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    logger.info("\n[Main] Received SIGINT, shutting down gracefully...");
    indexer.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("\n[Main] Received SIGTERM, shutting down gracefully...");
    indexer.stop();
    process.exit(0);
  });

  // Start the indexer
  await indexer.start();

  // Log status every 30 seconds
  setInterval(async () => {
    const status = await indexer.getStatus();
    logger.info(`[Status] ${JSON.stringify(status, null, 2)}`);
  }, 30000);
}

main().catch((error) => {
  logger.error("[Main] Fatal error:", error);
  process.exit(1);
});
