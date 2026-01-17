/**
 * XDEX REST API Client
 * Official API: https://api.xdex.xyz
 */

import { logger } from "../utils/logger";

const XDEX_API_BASE = "https://api.xdex.xyz/api/xendex";

export type XDEXNetwork = "X1 Mainnet" | "X1 Testnet" | "Solana Mainnet" | "Solana Devnet";

/**
 * Swap Preparation Request
 */
export interface SwapPrepareRequest {
  network: XDEXNetwork;
  wallet: string; // Public key
  token_in: string; // SPL mint address
  token_out: string; // SPL mint address
  token_in_amount: number;
  is_exact_amount_in: boolean;
}

/**
 * Swap Preparation Response (example structure - adjust based on actual API)
 */
export interface SwapPrepareResponse {
  success: boolean;
  estimated_output?: number;
  price_impact?: number;
  minimum_received?: number;
  route?: any[]; // Route information
  transaction?: string; // Serialized transaction to sign
  error?: string;
}

/**
 * Token Info (example structure)
 */
export interface XDEXTokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  price?: number;
  volume24h?: number;
  liquidity?: number;
}

/**
 * Pool/Pair Info (example structure)
 */
export interface XDEXPoolInfo {
  address: string;
  token0: XDEXTokenInfo;
  token1: XDEXTokenInfo;
  reserve0: number;
  reserve1: number;
  totalSupply: number;
  volume24h?: number;
  fees24h?: number;
  apr?: number;
  createdAt?: string;
}

/**
 * XDEX API Client
 */
export class XDEXApiClient {
  private baseUrl: string;
  private network: XDEXNetwork;

  constructor(network: XDEXNetwork = "X1 Mainnet") {
    this.baseUrl = XDEX_API_BASE;
    this.network = network;
  }

  /**
   * Prepare a swap transaction
   */
  async prepareSwap(params: Omit<SwapPrepareRequest, "network">): Promise<SwapPrepareResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/swap/prepare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...params,
          network: this.network,
        }),
      });

      if (!response.ok) {
        throw new Error(`XDEX API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as SwapPrepareResponse;
    } catch (error) {
      logger.error("[XDEX API] Error preparing swap:", error);
      throw error;
    }
  }

  /**
   * Get all available tokens (if API provides this endpoint)
   * TODO: Update with actual XDEX API endpoint when available
   */
  async getTokens(): Promise<XDEXTokenInfo[]> {
    try {
      // This is a placeholder - update with actual XDEX API endpoint
      const response = await fetch(`${this.baseUrl}/tokens?network=${this.network}`);

      if (!response.ok) {
        throw new Error(`XDEX API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.tokens || [];
    } catch (error) {
      logger.error("[XDEX API] Error fetching tokens:", error);
      return [];
    }
  }

  /**
   * Get token by mint address
   * TODO: Update with actual XDEX API endpoint when available
   */
  async getToken(mint: string): Promise<XDEXTokenInfo | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/token/${mint}?network=${this.network}`,
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`XDEX API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as XDEXTokenInfo;
    } catch (error) {
      logger.error(`[XDEX API] Error fetching token ${mint}:`, error);
      return null;
    }
  }

  /**
   * Get all pools/pairs
   * TODO: Update with actual XDEX API endpoint when available
   */
  async getPools(): Promise<XDEXPoolInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/pools?network=${this.network}`);

      if (!response.ok) {
        throw new Error(`XDEX API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.pools || [];
    } catch (error) {
      logger.error("[XDEX API] Error fetching pools:", error);
      return [];
    }
  }

  /**
   * Get pool by address
   * TODO: Update with actual XDEX API endpoint when available
   */
  async getPool(address: string): Promise<XDEXPoolInfo | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/pool/${address}?network=${this.network}`,
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`XDEX API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as XDEXPoolInfo;
    } catch (error) {
      logger.error(`[XDEX API] Error fetching pool ${address}:`, error);
      return null;
    }
  }

  /**
   * Get recent swaps/trades
   * TODO: Update with actual XDEX API endpoint when available
   */
  async getRecentSwaps(poolAddress?: string, limit = 50): Promise<any[]> {
    try {
      const url = poolAddress
        ? `${this.baseUrl}/swaps/${poolAddress}?network=${this.network}&limit=${limit}`
        : `${this.baseUrl}/swaps?network=${this.network}&limit=${limit}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`XDEX API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.swaps || [];
    } catch (error) {
      logger.error("[XDEX API] Error fetching swaps:", error);
      return [];
    }
  }

  /**
   * Get token price in USD or other quote
   * TODO: Update with actual XDEX API endpoint when available
   */
  async getTokenPrice(mint: string): Promise<number | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/price/${mint}?network=${this.network}`,
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`XDEX API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.price || null;
    } catch (error) {
      logger.error(`[XDEX API] Error fetching price for ${mint}:`, error);
      return null;
    }
  }

  /**
   * Get 24h statistics
   * TODO: Update with actual XDEX API endpoint when available
   */
  async get24hStats(): Promise<{
    totalVolume?: number;
    totalLiquidity?: number;
    totalPools?: number;
    topGainers?: any[];
    newPools?: any[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/24h?network=${this.network}`);

      if (!response.ok) {
        throw new Error(`XDEX API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error("[XDEX API] Error fetching 24h stats:", error);
      return {};
    }
  }
}

/**
 * Singleton instance
 */
let xdexClient: XDEXApiClient | null = null;

export function getXDEXClient(network?: XDEXNetwork): XDEXApiClient {
  if (!xdexClient) {
    xdexClient = new XDEXApiClient(network || "X1 Mainnet");
  }
  return xdexClient;
}
