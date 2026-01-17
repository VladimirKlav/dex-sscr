import { boolean, index, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Trading Bot Configurations Table
 * Stores user bot settings for auto-trading
 */
export const botConfigs = pgTable(
  "bot_configs",
  {
    id: text("id").primaryKey().notNull(), // UUID
    user: text("user").notNull(), // User wallet address
    name: text("name").notNull(), // Bot configuration name
    type: text("type").notNull(), // "sniper" | "copy_trade" | "dca" | "grid"
    isActive: boolean("is_active").notNull().default(false),

    // Sniper bot settings
    autoSniperEnabled: boolean("auto_sniper_enabled").notNull().default(false),
    sniperMinLiquidity: numeric("sniper_min_liquidity").default("0"),
    sniperMaxBuyAmount: numeric("sniper_max_buy_amount").default("0"),
    sniperSlippageTolerance: integer("sniper_slippage_tolerance").default(10), // percentage

    // Take profit / Stop loss
    takeProfitEnabled: boolean("take_profit_enabled").notNull().default(false),
    takeProfitPercentage: integer("take_profit_percentage").default(50), // %
    stopLossEnabled: boolean("stop_loss_enabled").notNull().default(false),
    stopLossPercentage: integer("stop_loss_percentage").default(20), // %

    // Copy trading settings
    copyTradeEnabled: boolean("copy_trade_enabled").notNull().default(false),
    copyTradeWallets: text("copy_trade_wallets"), // JSON array of wallet addresses to copy
    copyTradeMinAmount: numeric("copy_trade_min_amount").default("0"),
    copyTradeMaxAmount: numeric("copy_trade_max_amount").default("0"),

    // General settings
    gasPrice: text("gas_price").default("auto"), // "auto" or specific gwei
    maxGasPrice: numeric("max_gas_price"), // Max gwei willing to pay

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("bot_configs_user_idx").on(table.user),
    index("bot_configs_type_idx").on(table.type),
    index("bot_configs_is_active_idx").on(table.isActive),
  ],
);

export type BotConfig = typeof botConfigs.$inferSelect;
export type NewBotConfig = typeof botConfigs.$inferInsert;
