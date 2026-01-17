import { index, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { tokens } from "./tokens";

/**
 * DEX Trading Pairs Table
 * Stores all discovered trading pairs from DEX factories
 */
export const pairs = pgTable(
  "pairs",
  {
    address: text("address").primaryKey().notNull(), // Pair contract address
    dex: text("dex").notNull(), // DEX name (e.g., "X1Swap", "QuickSwap")
    factory: text("factory").notNull(), // Factory contract address
    token0: text("token0")
      .notNull()
      .references(() => tokens.address),
    token1: text("token1")
      .notNull()
      .references(() => tokens.address),
    reserve0: numeric("reserve0").notNull().default("0"),
    reserve1: numeric("reserve1").notNull().default("0"),
    totalSupply: numeric("total_supply").notNull().default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBlock: integer("created_block").notNull(),
    createdTx: text("created_tx").notNull(),
    lastSyncedBlock: integer("last_synced_block").notNull().default(0),
  },
  (table) => [
    index("pairs_token0_idx").on(table.token0),
    index("pairs_token1_idx").on(table.token1),
    index("pairs_dex_idx").on(table.dex),
    index("pairs_created_at_idx").on(table.createdAt.desc()),
    index("pairs_created_block_idx").on(table.createdBlock.desc()),
  ],
);

export type Pair = typeof pairs.$inferSelect;
export type NewPair = typeof pairs.$inferInsert;
