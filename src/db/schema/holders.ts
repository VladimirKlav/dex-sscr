import { index, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { tokens } from "./tokens";

/**
 * Token Holders Table
 * Tracks unique holders for each token
 */
export const holders = pgTable(
  "holders",
  {
    id: text("id").primaryKey().notNull(), // token:holder
    token: text("token")
      .notNull()
      .references(() => tokens.address),
    holder: text("holder").notNull(),
    balance: numeric("balance").notNull().default("0"),
    firstSeenBlock: integer("first_seen_block").notNull(),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastUpdatedBlock: integer("last_updated_block").notNull(),
    lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("holders_token_idx").on(table.token),
    index("holders_holder_idx").on(table.holder),
    index("holders_balance_idx").on(table.balance.desc()),
    index("holders_first_seen_at_idx").on(table.firstSeenAt.desc()),
  ],
);

export type Holder = typeof holders.$inferSelect;
export type NewHolder = typeof holders.$inferInsert;
