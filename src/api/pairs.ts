import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDB } from "../db";
import { liquidityEvents, pairs, swaps, tokens } from "../db/schema";
import { logger } from "../utils/logger";

/**
 * Get all pairs with pagination and filtering
 */
export async function getPairs(params: {
  limit?: number;
  offset?: number;
  sortBy?: "liquidity" | "volume" | "age" | "holders";
  sortOrder?: "asc" | "desc";
  minLiquidity?: number;
  dex?: string;
}) {
  const db = getDB();
  const limit = Math.min(params.limit || 50, 100);
  const offset = params.offset || 0;

  try {
    let query = db
      .select({
        pair: pairs,
        token0: tokens,
        token1: tokens,
      })
      .from(pairs)
      .leftJoin(tokens, eq(pairs.token0, tokens.address))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions = [];
    if (params.dex) {
      conditions.push(eq(pairs.dex, params.dex));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    if (params.sortBy === "age") {
      query = query.orderBy(params.sortOrder === "asc" ? pairs.createdAt : desc(pairs.createdAt));
    } else {
      query = query.orderBy(desc(pairs.createdAt)); // Default: newest first
    }

    const results = await query;

    return {
      pairs: results,
      total: results.length,
      limit,
      offset,
    };
  } catch (error) {
    logger.error("[API] Error fetching pairs:", error);
    throw error;
  }
}

/**
 * Get pair by address
 */
export async function getPairByAddress(address: string) {
  const db = getDB();

  try {
    const result = await db.query.pairs.findFirst({
      where: eq(pairs.address, address.toLowerCase()),
      with: {
        // Note: Relations need to be defined in schema
      },
    });

    if (!result) {
      return null;
    }

    // Get token details
    const [token0Data, token1Data] = await Promise.all([
      db.query.tokens.findFirst({ where: eq(tokens.address, result.token0) }),
      db.query.tokens.findFirst({ where: eq(tokens.address, result.token1) }),
    ]);

    // Get recent swaps
    const recentSwaps = await db.query.swaps.findMany({
      where: eq(swaps.pair, address.toLowerCase()),
      orderBy: [desc(swaps.timestamp)],
      limit: 10,
    });

    // Get liquidity events
    const liquidityChanges = await db.query.liquidityEvents.findMany({
      where: eq(liquidityEvents.pair, address.toLowerCase()),
      orderBy: [desc(liquidityEvents.timestamp)],
      limit: 10,
    });

    return {
      pair: result,
      token0: token0Data,
      token1: token1Data,
      recentSwaps,
      liquidityChanges,
    };
  } catch (error) {
    logger.error(`[API] Error fetching pair ${address}:`, error);
    throw error;
  }
}

/**
 * Get new pairs (last 24h)
 */
export async function getNewPairs(limit = 50) {
  const db = getDB();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const results = await db.query.pairs.findMany({
      where: gte(pairs.createdAt, oneDayAgo),
      orderBy: [desc(pairs.createdAt)],
      limit: Math.min(limit, 100),
    });

    return results;
  } catch (error) {
    logger.error("[API] Error fetching new pairs:", error);
    throw error;
  }
}

/**
 * Get pair statistics
 */
export async function getPairStats(address: string, periodHours = 24) {
  const db = getDB();
  const startTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);

  try {
    // Get swap count and volume
    const swapStats = await db
      .select({
        count: sql<number>`count(*)`,
        volume0: sql<string>`sum(${swaps.amount0Out} + ${swaps.amount0In})`,
        volume1: sql<string>`sum(${swaps.amount1Out} + ${swaps.amount1In})`,
      })
      .from(swaps)
      .where(and(eq(swaps.pair, address.toLowerCase()), gte(swaps.timestamp, startTime)))
      .execute();

    return {
      swapCount: swapStats[0]?.count || 0,
      volume0: swapStats[0]?.volume0 || "0",
      volume1: swapStats[0]?.volume1 || "0",
      periodHours,
    };
  } catch (error) {
    logger.error(`[API] Error fetching pair stats for ${address}:`, error);
    throw error;
  }
}
