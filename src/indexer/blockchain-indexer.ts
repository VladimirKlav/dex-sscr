import { encodeEventTopics } from "viem";
import { getRpcClient } from "../lib/rpc-client";
import { DEX_CONFIGS, INDEXER_CONFIG } from "../config/x1";
import { eventProcessor } from "./event-processor";
import { logger } from "../utils/logger";
import factoryAbi from "../abi/uniswap-v2-factory.json";
import pairAbi from "../abi/uniswap-v2-pair.json";

/**
 * Blockchain Indexer
 * Indexes DEX events from the X1 blockchain
 */
export class BlockchainIndexer {
  private rpc = getRpcClient();
  private isRunning = false;
  private currentBlock = BigInt(INDEXER_CONFIG.startBlock);

  /**
   * Start indexing from the configured start block
   */
  async start() {
    if (this.isRunning) {
      logger.warn("[Indexer] Already running");
      return;
    }

    this.isRunning = true;
    logger.info("[Indexer] Starting blockchain indexer");

    // If start block is 0, get current block - 1000 to avoid indexing from genesis
    if (this.currentBlock === 0n) {
      const latestBlock = await this.rpc.getBlockNumber();
      this.currentBlock = latestBlock - 1000n > 0n ? latestBlock - 1000n : 0n;
      logger.info(`[Indexer] Starting from block ${this.currentBlock}`);
    }

    // Index historical data first
    await this.indexHistoricalData();

    // Then start real-time indexing
    this.startRealtimeIndexing();
  }

  /**
   * Stop the indexer
   */
  stop() {
    this.isRunning = false;
    logger.info("[Indexer] Stopped blockchain indexer");
  }

  /**
   * Index historical data in batches
   */
  private async indexHistoricalData() {
    logger.info("[Indexer] Indexing historical data");

    const latestBlock = await this.rpc.getBlockNumber();
    const batchSize = BigInt(INDEXER_CONFIG.batchSize);

    while (this.currentBlock < latestBlock && this.isRunning) {
      const toBlock =
        this.currentBlock + batchSize <= latestBlock ? this.currentBlock + batchSize : latestBlock;

      try {
        await this.indexBlockRange(this.currentBlock, toBlock);
        this.currentBlock = toBlock + 1n;

        logger.info(
          `[Indexer] Indexed blocks ${this.currentBlock - batchSize} to ${toBlock} (${((Number(toBlock) / Number(latestBlock)) * 100).toFixed(2)}%)`,
        );
      } catch (error) {
        logger.error(`[Indexer] Error indexing blocks ${this.currentBlock} to ${toBlock}:`, error);
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    logger.info("[Indexer] Historical indexing complete");
  }

  /**
   * Start real-time indexing by polling for new blocks
   */
  private startRealtimeIndexing() {
    logger.info("[Indexer] Starting real-time indexing");

    const poll = async () => {
      while (this.isRunning) {
        try {
          const latestBlock = await this.rpc.getBlockNumber();

          if (latestBlock > this.currentBlock) {
            await this.indexBlockRange(this.currentBlock, latestBlock);
            this.currentBlock = latestBlock + 1n;
          }
        } catch (error) {
          logger.error("[Indexer] Error in real-time indexing:", error);
        }

        await new Promise((resolve) => setTimeout(resolve, INDEXER_CONFIG.pollingInterval));
      }
    };

    poll();
  }

  /**
   * Index a specific block range
   */
  private async indexBlockRange(fromBlock: bigint, toBlock: bigint) {
    // Index PairCreated events from all DEX factories
    await this.indexPairCreatedEvents(fromBlock, toBlock);

    // Index Swap, Mint, Burn events from all pairs
    // Note: We can't filter by all pair addresses upfront, so we'll query broadly
    await this.indexPairEvents(fromBlock, toBlock);
  }

  /**
   * Index PairCreated events from DEX factories
   */
  private async indexPairCreatedEvents(fromBlock: bigint, toBlock: bigint) {
    for (const dex of DEX_CONFIGS) {
      try {
        // Skip if factory address is not configured
        if (dex.factory === "0x0000000000000000000000000000000000000000") {
          continue;
        }

        const topics = encodeEventTopics({
          abi: factoryAbi,
          eventName: "PairCreated",
        });

        const logs = await this.rpc.getLogs({
          address: dex.factory as `0x${string}`,
          fromBlock,
          toBlock,
          topics,
        });

        logger.debug(
          `[Indexer] Found ${logs.length} PairCreated events from ${dex.name} (blocks ${fromBlock}-${toBlock})`,
        );

        for (const log of logs) {
          await eventProcessor.processPairCreated(log, dex.name, dex.factory);
        }
      } catch (error) {
        logger.error(`[Indexer] Error indexing PairCreated from ${dex.name}:`, error);
      }
    }
  }

  /**
   * Index Swap, Mint, Burn events from pair contracts
   */
  private async indexPairEvents(fromBlock: bigint, toBlock: bigint) {
    try {
      // Get all Swap events (no address filter - will get from all pairs)
      const swapTopics = encodeEventTopics({
        abi: pairAbi,
        eventName: "Swap",
      });

      const swapLogs = await this.rpc.getLogs({
        fromBlock,
        toBlock,
        topics: swapTopics,
      });

      logger.debug(`[Indexer] Found ${swapLogs.length} Swap events (blocks ${fromBlock}-${toBlock})`);

      for (const log of swapLogs) {
        await eventProcessor.processSwap(log);
      }

      // Get all Mint events
      const mintTopics = encodeEventTopics({
        abi: pairAbi,
        eventName: "Mint",
      });

      const mintLogs = await this.rpc.getLogs({
        fromBlock,
        toBlock,
        topics: mintTopics,
      });

      logger.debug(`[Indexer] Found ${mintLogs.length} Mint events (blocks ${fromBlock}-${toBlock})`);

      for (const log of mintLogs) {
        await eventProcessor.processMint(log);
      }

      // Get all Burn events
      const burnTopics = encodeEventTopics({
        abi: pairAbi,
        eventName: "Burn",
      });

      const burnLogs = await this.rpc.getLogs({
        fromBlock,
        toBlock,
        topics: burnTopics,
      });

      logger.debug(`[Indexer] Found ${burnLogs.length} Burn events (blocks ${fromBlock}-${toBlock})`);

      for (const log of burnLogs) {
        await eventProcessor.processBurn(log);
      }
    } catch (error) {
      logger.error("[Indexer] Error indexing pair events:", error);
    }
  }

  /**
   * Get current indexing status
   */
  async getStatus() {
    const latestBlock = await this.rpc.getBlockNumber();
    const progress =
      this.currentBlock > 0n ? (Number(this.currentBlock) / Number(latestBlock)) * 100 : 0;

    return {
      isRunning: this.isRunning,
      currentBlock: this.currentBlock.toString(),
      latestBlock: latestBlock.toString(),
      progress: progress.toFixed(2) + "%",
      blocksBehind: (latestBlock - this.currentBlock).toString(),
    };
  }
}

// Singleton instance
let indexer: BlockchainIndexer | null = null;

export function getIndexer(): BlockchainIndexer {
  if (!indexer) {
    indexer = new BlockchainIndexer();
  }
  return indexer;
}
