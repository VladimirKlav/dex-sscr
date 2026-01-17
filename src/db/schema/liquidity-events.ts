import { index, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { pairs } from "./pairs";

/**
 * Liquidity Events Table
 * Stores Mint (add liquidity) and Burn (remove liquidity) events
 */
export const liquidityEvents = pgTable(
  "liquidity_events",
  {
    id: text("id").primaryKey().notNull(), // tx_hash:log_index
    pair: text("pair")
      .notNull()
      .references(() => pairs.address),
    type: text("type").notNull(), // "mint" or "burn"
    txHash: text("tx_hash").notNull(),
    blockNumber: integer("block_number").notNull(),
    logIndex: integer("log_index").notNull(),
    sender: text("sender").notNull(),
    amount0: numeric("amount0").notNull(),
    amount1: numeric("amount1").notNull(),
    liquidity: numeric("liquidity").notNull(), // LP tokens minted/burned
    timestamp: timestamp("timestamp").notNull(),
  },
  (table) => [
    index("liquidity_events_pair_idx").on(table.pair),
    index("liquidity_events_type_idx").on(table.type),
    index("liquidity_events_block_number_idx").on(table.blockNumber.desc()),
    index("liquidity_events_timestamp_idx").on(table.timestamp.desc()),
    index("liquidity_events_sender_idx").on(table.sender),
  ],
);

export type LiquidityEvent = typeof liquidityEvents.$inferSelect;
export type NewLiquidityEvent = typeof liquidityEvents.$inferInsert;
