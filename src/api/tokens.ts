import { desc, eq, sql } from "drizzle-orm";
import { getDB } from "../db";
import { tokens, pairs, holders } from "../db/schema";
import { logger } from "../utils/logger";

/**
 * Get all tokens
 */
export async function getTokens(params: { limit?: number; offset?: number }) {
  const db = getDB();
  const limit = Math.min(params.limit || 50, 100);
  const offset = params.offset || 0;

  try {
    const results = await db.query.tokens.findMany({
      limit,
      offset,
      orderBy: [desc(tokens.symbol)],
    });

    return {
      tokens: results,
      total: results.length,
      limit,
      offset,
    };
  } catch (error) {
    logger.error("[API] Error fetching tokens:", error);
    throw error;
  }
}

/**
 * Get token by address
 */
export async function getTokenByAddress(address: string) {
  const db = getDB();

  try {
    const token = await db.query.tokens.findFirst({
      where: eq(tokens.address, address.toLowerCase()),
    });

    if (!token) {
      return null;
    }

    // Get pairs containing this token
    const tokenPairs = await db.query.pairs.findMany({
      where: sql`${pairs.token0} = ${address.toLowerCase()} OR ${pairs.token1} = ${address.toLowerCase()}`,
      limit: 20,
      orderBy: [desc(pairs.createdAt)],
    });

    // Get holder count
    const holderCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(holders)
      .where(eq(holders.token, address.toLowerCase()))
      .execute();

    return {
      token,
      pairs: tokenPairs,
      holderCount: holderCount[0]?.count || 0,
    };
  } catch (error) {
    logger.error(`[API] Error fetching token ${address}:`, error);
    throw error;
  }
}

/**
 * Search tokens by symbol or name
 */
export async function searchTokens(query: string, limit = 20) {
  const db = getDB();

  try {
    const results = await db.query.tokens.findMany({
      where: sql`${tokens.symbol} ILIKE ${"%" + query + "%"} OR ${tokens.name} ILIKE ${"%" + query + "%"}`,
      limit: Math.min(limit, 50),
    });

    return results;
  } catch (error) {
    logger.error(`[API] Error searching tokens with query "${query}":`, error);
    throw error;
  }
}
