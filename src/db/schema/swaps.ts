import { index, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { pairs } from "./pairs";
import { tokens } from "./tokens";

/**
 * Swap/Trade Events Table
 * Stores all swap transactions from DEX pairs
 */
export const swaps = pgTable(
  "swaps",
  {
    id: text("id").primaryKey().notNull(), // tx_hash:log_index
    pair: text("pair")
      .notNull()
      .references(() => pairs.address),
    txHash: text("tx_hash").notNull(),
    blockNumber: integer("block_number").notNull(),
    logIndex: integer("log_index").notNull(),
    sender: text("sender").notNull(), // msg.sender
    to: text("to").notNull(), // recipient
    amount0In: numeric("amount0_in").notNull(),
    amount1In: numeric("amount1_in").notNull(),
    amount0Out: numeric("amount0_out").notNull(),
    amount1Out: numeric("amount1_out").notNull(),
    timestamp: timestamp("timestamp").notNull(),
  },
  (table) => [
    index("swaps_pair_idx").on(table.pair),
    index("swaps_block_number_idx").on(table.blockNumber.desc()),
    index("swaps_timestamp_idx").on(table.timestamp.desc()),
    index("swaps_sender_idx").on(table.sender),
    index("swaps_tx_hash_idx").on(table.txHash),
  ],
);

export type Swap = typeof swaps.$inferSelect;
export type NewSwap = typeof swaps.$inferInsert;
