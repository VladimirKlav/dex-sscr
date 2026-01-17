/**
 * DexScreener Data Synchronization Service
 * Syncs X1/XDEX data from DexScreener API to our local database
 */

import { eq } from "drizzle-orm";
import { getDB } from "../db";
import { pairs, swaps, tokens } from "../db/schema";
import { getDexScreenerClient, type DexScreenerPair } from "../lib/dexscreener-client";
import { logger } from "../utils/logger";

export class DexScreenerSyncService {
  private client = getDexScreenerClient();
  private db = getDB();
  private isRunning = false;
  private syncInterval: Timer | null = null;

  /**
   * Start periodic synchronization
   */
  async start(intervalMs = 60000) {
    if (this.isRunning) {
      logger.warn("[DexScreener Sync] Already running");
      return;
    }

    this.isRunning = true;
    logger.info("[DexScreener Sync] Starting data synchronization from DexScreener");

    // Initial sync
    await this.syncAll();

    // Periodic sync
    this.syncInterval = setInterval(async () => {
      await this.syncAll();
    }, intervalMs);
  }

  /**
   * Stop synchronization
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    logger.info("[DexScreener Sync] Stopped data synchronization");
  }

  /**
   * Sync all data
   */
  private async syncAll() {
    try {
      logger.info("[DexScreener Sync] Starting sync cycle");

      // Fetch all X1/XDEX pairs from DexScreener
      const allPairs = await this.client.getAllX1Pairs();
      logger.info(`[DexScreener Sync] Fetched ${allPairs.length} pairs from DexScreener`);

      // Sync pairs and tokens
      for (const pair of allPairs) {
        await this.syncPair(pair);
      }

      logger.info("[DexScreener Sync] Sync cycle completed");
    } catch (error) {
      logger.error("[DexScreener Sync] Error in sync cycle:", error);
    }
  }

  /**
   * Sync a single pair and its tokens
   */
  private async syncPair(pair: DexScreenerPair) {
    try {
      // Ensure both tokens exist
      await this.ensureToken({
        address: pair.baseToken.address,
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        decimals: 9, // Default for Solana/X1
      });

      await this.ensureToken({
        address: pair.quoteToken.address,
        name: pair.quoteToken.name,
        symbol: pair.quoteToken.symbol,
        decimals: 9,
      });

      // Check if pair exists
      const existing = await this.db.query.pairs.findFirst({
        where: eq(pairs.address, pair.pairAddress.toLowerCase()),
      });

      if (existing) {
        // Update reserves and liquidity
        await this.db
          .update(pairs)
          .set({
            reserve0: pair.liquidity?.base.toString() || "0",
            reserve1: pair.liquidity?.quote.toString() || "0",
            totalSupply: pair.liquidity?.usd?.toString() || "0",
          })
          .where(eq(pairs.address, pair.pairAddress.toLowerCase()));

        return;
      }

      // Insert new pair
      await this.db.insert(pairs).values({
        address: pair.pairAddress.toLowerCase(),
        dex: pair.dexId || "XDEX",
        factory: "DexScreener", // Source marker
        token0: pair.baseToken.address.toLowerCase(),
        token1: pair.quoteToken.address.toLowerCase(),
        reserve0: pair.liquidity?.base.toString() || "0",
        reserve1: pair.liquidity?.quote.toString() || "0",
        totalSupply: pair.liquidity?.usd?.toString() || "0",
        createdBlock: 0,
        createdTx: "N/A",
        createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt) : new Date(),
        lastSyncedBlock: 0,
      });

      logger.debug(
        `[DexScreener Sync] Inserted new pair: ${pair.baseToken.symbol}/${pair.quoteToken.symbol} (${pair.pairAddress.substring(0, 10)}...)`,
      );
    } catch (error) {
      logger.error(`[DexScreener Sync] Error syncing pair ${pair.pairAddress}:`, error);
    }
  }

  /**
   * Ensure a token exists in the database
   */
  private async ensureToken(tokenInfo: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  }) {
    const existing = await this.db.query.tokens.findFirst({
      where: eq(tokens.address, tokenInfo.address.toLowerCase()),
    });

    if (!existing) {
      await this.db.insert(tokens).values({
        address: tokenInfo.address.toLowerCase(),
        name: tokenInfo.name || "Unknown",
        symbol: tokenInfo.symbol || "UNKNOWN",
        decimals: tokenInfo.decimals || 9,
        iconUrl: "",
      });
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.syncInterval !== null,
      source: "DexScreener API",
    };
  }

  /**
   * Get statistics from DexScreener
   */
  async getStats() {
    try {
      const [allPairs, topGainers, trending] = await Promise.all([
        this.client.getAllX1Pairs(),
        this.client.getTopGainers("x1", "h24"),
        this.client.getTrendingPairs("x1", 10),
      ]);

      const total24hVolume = allPairs.reduce((sum, p) => sum + (p.volume?.h24 || 0), 0);
      const totalLiquidity = allPairs.reduce((sum, p) => sum + (p.liquidity?.usd || 0), 0);

      return {
        totalPairs: allPairs.length,
        volume24h: total24hVolume,
        liquidity: totalLiquidity,
        topGainers: topGainers.slice(0, 10),
        trending: trending,
      };
    } catch (error) {
      logger.error("[DexScreener Sync] Error fetching stats:", error);
      return null;
    }
  }
}

// Singleton instance
let syncService: DexScreenerSyncService | null = null;

export function getDexScreenerSyncService(): DexScreenerSyncService {
  if (!syncService) {
    syncService = new DexScreenerSyncService();
  }
  return syncService;
}
