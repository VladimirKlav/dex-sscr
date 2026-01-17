import { boolean, index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { pairs } from "./pairs";

/**
 * Price Alerts Table
 * Stores user-configured price alerts
 */
export const alerts = pgTable(
  "alerts",
  {
    id: text("id").primaryKey().notNull(), // UUID
    user: text("user").notNull(), // User wallet address or session ID
    pair: text("pair")
      .notNull()
      .references(() => pairs.address),
    type: text("type").notNull(), // "price_above" | "price_below" | "volume_spike" | "new_pair" | "liquidity_change"
    condition: text("condition").notNull(), // JSON string with condition params
    targetPrice: numeric("target_price"), // For price alerts
    isActive: boolean("is_active").notNull().default(true),
    isTriggered: boolean("is_triggered").notNull().default(false),
    triggeredAt: timestamp("triggered_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    notificationChannel: text("notification_channel").notNull().default("ui"), // "ui" | "email" | "telegram" | "discord"
  },
  (table) => [
    index("alerts_user_idx").on(table.user),
    index("alerts_pair_idx").on(table.pair),
    index("alerts_is_active_idx").on(table.isActive),
    index("alerts_type_idx").on(table.type),
    index("alerts_created_at_idx").on(table.createdAt.desc()),
  ],
);

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
