/**
 * DexScreener API Client for X1/XDEX Data
 * Docs: https://docs.dexscreener.com/api/reference
 */

import { logger } from "../utils/logger";

const DEXSCREENER_API = "https://api.dexscreener.com/latest";

/**
 * DexScreener Pair Data
 */
export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  pairCreatedAt?: number;
}

/**
 * DexScreener API Client
 */
export class DexScreenerClient {
  private baseUrl = DEXSCREENER_API;

  /**
   * Search pairs by token address
   */
  async searchPairs(tokenAddress: string): Promise<DexScreenerPair[]> {
    try {
      const response = await fetch(`${this.baseUrl}/dex/tokens/${tokenAddress}`);

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json();
      return data.pairs || [];
    } catch (error) {
      logger.error(`[DexScreener] Error searching pairs for ${tokenAddress}:`, error);
      return [];
    }
  }

  /**
   * Get pair by address
   */
  async getPair(pairAddress: string, chainId = "x1"): Promise<DexScreenerPair | null> {
    try {
      const response = await fetch(`${this.baseUrl}/dex/pairs/${chainId}/${pairAddress}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json();
      return data.pair || null;
    } catch (error) {
      logger.error(`[DexScreener] Error fetching pair ${pairAddress}:`, error);
      return null;
    }
  }

  /**
   * Get latest pairs for a chain
   */
  async getLatestPairs(chainId = "x1", limit = 30): Promise<DexScreenerPair[]> {
    try {
      // Note: DexScreener doesn't have a direct "latest pairs" endpoint
      // This is a workaround - search for known tokens or use their boosted endpoint
      const response = await fetch(`${this.baseUrl}/dex/search?q=${chainId}`);

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json();
      const pairs = data.pairs || [];

      // Filter for X1 chain and sort by creation date
      return pairs
        .filter((p: DexScreenerPair) => p.chainId.toLowerCase() === chainId.toLowerCase())
        .sort((a: DexScreenerPair, b: DexScreenerPair) => {
          const timeA = a.pairCreatedAt || 0;
          const timeB = b.pairCreatedAt || 0;
          return timeB - timeA;
        })
        .slice(0, limit);
    } catch (error) {
      logger.error(`[DexScreener] Error fetching latest pairs:`, error);
      return [];
    }
  }

  /**
   * Get top gainers
   */
  async getTopGainers(chainId = "x1", period: "m5" | "h1" | "h6" | "h24" = "h24"): Promise<DexScreenerPair[]> {
    try {
      const response = await fetch(`${this.baseUrl}/dex/search?q=${chainId}`);

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json();
      const pairs = data.pairs || [];

      // Filter for X1 and sort by price change
      return pairs
        .filter((p: DexScreenerPair) => p.chainId.toLowerCase() === chainId.toLowerCase())
        .filter((p: DexScreenerPair) => p.priceChange?.[period] !== undefined)
        .sort((a: DexScreenerPair, b: DexScreenerPair) => {
          const changeA = a.priceChange?.[period] || 0;
          const changeB = b.priceChange?.[period] || 0;
          return changeB - changeA;
        })
        .slice(0, 20);
    } catch (error) {
      logger.error(`[DexScreener] Error fetching top gainers:`, error);
      return [];
    }
  }

  /**
   * Get all pairs for X1 chain (XDEX)
   */
  async getAllX1Pairs(): Promise<DexScreenerPair[]> {
    try {
      // Search for XDEX or X1
      const response = await fetch(`${this.baseUrl}/dex/search?q=xdex x1`);

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json();
      const pairs = data.pairs || [];

      // Filter for X1 chain
      return pairs.filter(
        (p: DexScreenerPair) =>
          p.chainId.toLowerCase() === "x1" ||
          p.dexId.toLowerCase().includes("xdex")
      );
    } catch (error) {
      logger.error(`[DexScreener] Error fetching X1 pairs:`, error);
      return [];
    }
  }

  /**
   * Get trending pairs (high volume)
   */
  async getTrendingPairs(chainId = "x1", limit = 20): Promise<DexScreenerPair[]> {
    try {
      const pairs = await this.getAllX1Pairs();

      // Sort by 24h volume
      return pairs
        .filter((p) => p.volume?.h24 > 0)
        .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
        .slice(0, limit);
    } catch (error) {
      logger.error(`[DexScreener] Error fetching trending pairs:`, error);
      return [];
    }
  }
}

// Singleton instance
let dexScreenerClient: DexScreenerClient | null = null;

export function getDexScreenerClient(): DexScreenerClient {
  if (!dexScreenerClient) {
    dexScreenerClient = new DexScreenerClient();
  }
  return dexScreenerClient;
}
