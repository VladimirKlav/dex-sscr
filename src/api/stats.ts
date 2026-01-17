import { desc, gte, sql } from "drizzle-orm";
import { getDB } from "../db";
import { pairs, swaps, tokens } from "../db/schema";
import { logger } from "../utils/logger";

/**
 * Get overall platform statistics
 */
export async function getOverallStats() {
  const db = getDB();

  try {
    // Total pairs
    const pairCount = await db.select({ count: sql<number>`count(*)` }).from(pairs).execute();

    // Total tokens
    const tokenCount = await db.select({ count: sql<number>`count(*)` }).from(tokens).execute();

    // Total swaps (24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const swapCount24h = await db
      .select({ count: sql<number>`count(*)` })
      .from(swaps)
      .where(gte(swaps.timestamp, oneDayAgo))
      .execute();

    // New pairs (24h)
    const newPairs24h = await db
      .select({ count: sql<number>`count(*)` })
      .from(pairs)
      .where(gte(pairs.createdAt, oneDayAgo))
      .execute();

    return {
      totalPairs: pairCount[0]?.count || 0,
      totalTokens: tokenCount[0]?.count || 0,
      swaps24h: swapCount24h[0]?.count || 0,
      newPairs24h: newPairs24h[0]?.count || 0,
    };
  } catch (error) {
    logger.error("[API] Error fetching overall stats:", error);
    throw error;
  }
}

/**
 * Get top gainers (based on recent swaps)
 */
export async function getTopGainers(limit = 10, periodHours = 24) {
  const db = getDB();
  const startTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);

  try {
    // This is a simplified version - in production you'd calculate price changes
    const topPairs = await db
      .select({
        pair: pairs.address,
        swapCount: sql<number>`count(${swaps.id})`,
      })
      .from(pairs)
      .leftJoin(swaps, sql`${swaps.pair} = ${pairs.address} AND ${swaps.timestamp} >= ${startTime}`)
      .groupBy(pairs.address)
      .orderBy(desc(sql`count(${swaps.id})`))
      .limit(Math.min(limit, 50))
      .execute();

    return topPairs;
  } catch (error) {
    logger.error("[API] Error fetching top gainers:", error);
    throw error;
  }
}

/**
 * Get recently listed pairs
 */
export async function getRecentlyListed(limit = 20) {
  const db = getDB();

  try {
    const recent = await db.query.pairs.findMany({
      orderBy: [desc(pairs.createdAt)],
      limit: Math.min(limit, 100),
    });

    return recent;
  } catch (error) {
    logger.error("[API] Error fetching recently listed pairs:", error);
    throw error;
  }
}
