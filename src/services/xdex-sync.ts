/**
 * XDEX Data Synchronization Service
 * Syncs data from XDEX REST API to our local database
 */

import { getDB } from "../db";
import { tokens, pairs } from "../db/schema";
import { getXDEXClient, type XDEXNetwork } from "../lib/xdex-api";
import { logger } from "../utils/logger";
import { eq } from "drizzle-orm";

export class XDEXSyncService {
  private client = getXDEXClient();
  private db = getDB();
  private isRunning = false;
  private syncInterval: Timer | null = null;

  /**
   * Start periodic synchronization
   */
  async start(intervalMs = 60000) {
    // 1 minute default
    if (this.isRunning) {
      logger.warn("[XDEX Sync] Already running");
      return;
    }

    this.isRunning = true;
    logger.info("[XDEX Sync] Starting data synchronization");

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
    logger.info("[XDEX Sync] Stopped data synchronization");
  }

  /**
   * Sync all data
   */
  private async syncAll() {
    try {
      logger.info("[XDEX Sync] Starting sync cycle");

      await Promise.all([
        this.syncTokens(),
        this.syncPools(),
        // Add more sync tasks as needed
      ]);

      logger.info("[XDEX Sync] Sync cycle completed");
    } catch (error) {
      logger.error("[XDEX Sync] Error in sync cycle:", error);
    }
  }

  /**
   * Sync tokens from XDEX API to database
   */
  private async syncTokens() {
    try {
      const xdexTokens = await this.client.getTokens();
      logger.info(`[XDEX Sync] Fetched ${xdexTokens.length} tokens from XDEX API`);

      for (const xdexToken of xdexTokens) {
        try {
          // Check if token exists
          const existing = await this.db.query.tokens.findFirst({
            where: eq(tokens.address, xdexToken.mint.toLowerCase()),
          });

          if (existing) {
            // Update existing token
            // Could update price, volume, etc. here
            continue;
          }

          // Insert new token
          await this.db.insert(tokens).values({
            address: xdexToken.mint.toLowerCase(),
            name: xdexToken.name || "Unknown",
            symbol: xdexToken.symbol || "UNKNOWN",
            decimals: xdexToken.decimals || 9, // Solana default is 9
            iconUrl: xdexToken.logoURI || "",
          });

          logger.debug(
            `[XDEX Sync] Inserted new token: ${xdexToken.symbol} (${xdexToken.mint})`,
          );
        } catch (error) {
          logger.error(`[XDEX Sync] Error syncing token ${xdexToken.mint}:`, error);
        }
      }
    } catch (error) {
      logger.error("[XDEX Sync] Error syncing tokens:", error);
    }
  }

  /**
   * Sync pools/pairs from XDEX API to database
   */
  private async syncPools() {
    try {
      const xdexPools = await this.client.getPools();
      logger.info(`[XDEX Sync] Fetched ${xdexPools.length} pools from XDEX API`);

      for (const xdexPool of xdexPools) {
        try {
          // Ensure tokens exist first
          await this.ensureToken(xdexPool.token0);
          await this.ensureToken(xdexPool.token1);

          // Check if pair exists
          const existing = await this.db.query.pairs.findFirst({
            where: eq(pairs.address, xdexPool.address.toLowerCase()),
          });

          if (existing) {
            // Update reserves
            await this.db
              .update(pairs)
              .set({
                reserve0: xdexPool.reserve0.toString(),
                reserve1: xdexPool.reserve1.toString(),
                totalSupply: xdexPool.totalSupply.toString(),
              })
              .where(eq(pairs.address, xdexPool.address.toLowerCase()));
            continue;
          }

          // Insert new pair
          await this.db.insert(pairs).values({
            address: xdexPool.address.toLowerCase(),
            dex: "XDEX",
            factory: "N/A", // Not applicable for API-sourced data
            token0: xdexPool.token0.mint.toLowerCase(),
            token1: xdexPool.token1.mint.toLowerCase(),
            reserve0: xdexPool.reserve0.toString(),
            reserve1: xdexPool.reserve1.toString(),
            totalSupply: xdexPool.totalSupply.toString(),
            createdBlock: 0, // Not available from API
            createdTx: "N/A",
            createdAt: xdexPool.createdAt ? new Date(xdexPool.createdAt) : new Date(),
            lastSyncedBlock: 0,
          });

          logger.debug(
            `[XDEX Sync] Inserted new pool: ${xdexPool.token0.symbol}/${xdexPool.token1.symbol}`,
          );
        } catch (error) {
          logger.error(`[XDEX Sync] Error syncing pool ${xdexPool.address}:`, error);
        }
      }
    } catch (error) {
      logger.error("[XDEX Sync] Error syncing pools:", error);
    }
  }

  /**
   * Ensure a token exists in the database
   */
  private async ensureToken(tokenInfo: { mint: string; symbol: string; name: string; decimals: number; logoURI?: string }) {
    const existing = await this.db.query.tokens.findFirst({
      where: eq(tokens.address, tokenInfo.mint.toLowerCase()),
    });

    if (!existing) {
      await this.db.insert(tokens).values({
        address: tokenInfo.mint.toLowerCase(),
        name: tokenInfo.name || "Unknown",
        symbol: tokenInfo.symbol || "UNKNOWN",
        decimals: tokenInfo.decimals || 9,
        iconUrl: tokenInfo.logoURI || "",
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
    };
  }
}

// Singleton instance
let syncService: XDEXSyncService | null = null;

export function getXDEXSyncService(): XDEXSyncService {
  if (!syncService) {
    syncService = new XDEXSyncService();
  }
  return syncService;
}
