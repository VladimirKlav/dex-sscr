import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { pairs } from "./pairs";

/**
 * User Watchlist Table
 * Stores user's favorite pairs to track
 */
export const watchlist = pgTable(
  "watchlist",
  {
    id: text("id").primaryKey().notNull(), // user:pair
    user: text("user").notNull(), // User wallet address or session ID
    pair: text("pair")
      .notNull()
      .references(() => pairs.address),
    addedAt: timestamp("added_at").notNull().defaultNow(),
    notes: text("notes"), // Optional user notes
  },
  (table) => [
    index("watchlist_user_idx").on(table.user),
    index("watchlist_pair_idx").on(table.pair),
    index("watchlist_added_at_idx").on(table.addedAt.desc()),
  ],
);

export type WatchlistItem = typeof watchlist.$inferSelect;
export type NewWatchlistItem = typeof watchlist.$inferInsert;
