import { decodeEventLog, type Log } from "viem";
import { getDB } from "../db";
import { pairs, swaps, liquidityEvents, tokens } from "../db/schema";
import { DEX_CONFIGS } from "../config/x1";
import { logger } from "../utils/logger";
import factoryAbi from "../abi/uniswap-v2-factory.json";
import pairAbi from "../abi/uniswap-v2-pair.json";
import erc20Abi from "../abi/erc20.json";
import { getRpcClient } from "../lib/rpc-client";
import { eq } from "drizzle-orm";

/**
 * Event Processor
 * Processes blockchain events and stores them in the database
 */
export class EventProcessor {
  private db = getDB();
  private rpc = getRpcClient();

  /**
   * Process PairCreated event from DEX factory
   */
  async processPairCreated(log: Log, dexName: string, factoryAddress: string) {
    try {
      const decoded = decodeEventLog({
        abi: factoryAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== "PairCreated") return;

      const { token0, token1, pair } = decoded.args as {
        token0: `0x${string}`;
        token1: `0x${string}`;
        pair: `0x${string}`;
      };

      logger.info(`[Indexer] New pair created: ${pair} (${token0}/${token1}) on ${dexName}`);

      // Fetch token metadata for both tokens
      await this.fetchAndStoreTokenMetadata(token0);
      await this.fetchAndStoreTokenMetadata(token1);

      // Get block info for timestamp
      const block = await this.rpc.getBlock(log.blockNumber);

      // Store pair in database
      await this.db.insert(pairs).values({
        address: pair.toLowerCase(),
        dex: dexName,
        factory: factoryAddress.toLowerCase(),
        token0: token0.toLowerCase(),
        token1: token1.toLowerCase(),
        reserve0: "0",
        reserve1: "0",
        totalSupply: "0",
        createdBlock: Number(log.blockNumber),
        createdTx: log.transactionHash || "0x",
        createdAt: new Date(Number(block.timestamp) * 1000),
        lastSyncedBlock: Number(log.blockNumber),
      }).onConflictDoNothing();

      logger.info(`[Indexer] Stored pair ${pair} in database`);
    } catch (error) {
      logger.error("[Indexer] Error processing PairCreated event:", error);
    }
  }

  /**
   * Process Swap event from pair contract
   */
  async processSwap(log: Log) {
    try {
      const decoded = decodeEventLog({
        abi: pairAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== "Swap") return;

      const { sender, to, amount0In, amount1In, amount0Out, amount1Out } = decoded.args as {
        sender: `0x${string}`;
        to: `0x${string}`;
        amount0In: bigint;
        amount1In: bigint;
        amount0Out: bigint;
        amount1Out: bigint;
      };

      const block = await this.rpc.getBlock(log.blockNumber);
      const swapId = `${log.transactionHash}:${log.logIndex}`;

      await this.db.insert(swaps).values({
        id: swapId,
        pair: log.address.toLowerCase(),
        txHash: log.transactionHash || "0x",
        blockNumber: Number(log.blockNumber),
        logIndex: Number(log.logIndex),
        sender: sender.toLowerCase(),
        to: to.toLowerCase(),
        amount0In: amount0In.toString(),
        amount1In: amount1In.toString(),
        amount0Out: amount0Out.toString(),
        amount1Out: amount1Out.toString(),
        timestamp: new Date(Number(block.timestamp) * 1000),
      }).onConflictDoNothing();

      logger.debug(`[Indexer] Processed swap ${swapId}`);
    } catch (error) {
      logger.error("[Indexer] Error processing Swap event:", error);
    }
  }

  /**
   * Process Mint (add liquidity) event
   */
  async processMint(log: Log) {
    try {
      const decoded = decodeEventLog({
        abi: pairAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== "Mint") return;

      const { sender, amount0, amount1 } = decoded.args as {
        sender: `0x${string}`;
        amount0: bigint;
        amount1: bigint;
      };

      const block = await this.rpc.getBlock(log.blockNumber);
      const eventId = `${log.transactionHash}:${log.logIndex}`;

      await this.db.insert(liquidityEvents).values({
        id: eventId,
        pair: log.address.toLowerCase(),
        type: "mint",
        txHash: log.transactionHash || "0x",
        blockNumber: Number(log.blockNumber),
        logIndex: Number(log.logIndex),
        sender: sender.toLowerCase(),
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        liquidity: "0", // Will be updated from Sync event
        timestamp: new Date(Number(block.timestamp) * 1000),
      }).onConflictDoNothing();

      logger.debug(`[Indexer] Processed mint ${eventId}`);
    } catch (error) {
      logger.error("[Indexer] Error processing Mint event:", error);
    }
  }

  /**
   * Process Burn (remove liquidity) event
   */
  async processBurn(log: Log) {
    try {
      const decoded = decodeEventLog({
        abi: pairAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== "Burn") return;

      const { sender, amount0, amount1, to } = decoded.args as {
        sender: `0x${string}`;
        amount0: bigint;
        amount1: bigint;
        to: `0x${string}`;
      };

      const block = await this.rpc.getBlock(log.blockNumber);
      const eventId = `${log.transactionHash}:${log.logIndex}`;

      await this.db.insert(liquidityEvents).values({
        id: eventId,
        pair: log.address.toLowerCase(),
        type: "burn",
        txHash: log.transactionHash || "0x",
        blockNumber: Number(log.blockNumber),
        logIndex: Number(log.logIndex),
        sender: sender.toLowerCase(),
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        liquidity: "0", // Will be updated from Sync event
        timestamp: new Date(Number(block.timestamp) * 1000),
      }).onConflictDoNothing();

      logger.debug(`[Indexer] Processed burn ${eventId}`);
    } catch (error) {
      logger.error("[Indexer] Error processing Burn event:", error);
    }
  }

  /**
   * Fetch and store token metadata (name, symbol, decimals)
   */
  private async fetchAndStoreTokenMetadata(tokenAddress: `0x${string}`) {
    try {
      // Check if token already exists
      const existing = await this.db.query.tokens.findFirst({
        where: eq(tokens.address, tokenAddress.toLowerCase()),
      });

      if (existing) {
        return; // Token already stored
      }

      // Fetch token metadata from contract
      const [name, symbol, decimals] = await Promise.all([
        this.rpc.readContract<string>({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "name",
        }),
        this.rpc.readContract<string>({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "symbol",
        }),
        this.rpc.readContract<number>({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);

      await this.db.insert(tokens).values({
        address: tokenAddress.toLowerCase(),
        name,
        symbol,
        decimals,
        iconUrl: "", // TODO: Fetch from token list or generate
      }).onConflictDoNothing();

      logger.info(`[Indexer] Stored token metadata: ${symbol} (${tokenAddress})`);
    } catch (error) {
      logger.error(`[Indexer] Error fetching token metadata for ${tokenAddress}:`, error);

      // Store with placeholder data if fetch fails
      await this.db.insert(tokens).values({
        address: tokenAddress.toLowerCase(),
        name: "Unknown",
        symbol: "UNKNOWN",
        decimals: 18,
        iconUrl: "",
      }).onConflictDoNothing();
    }
  }
}

export const eventProcessor = new EventProcessor();
