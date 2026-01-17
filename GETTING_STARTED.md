# Getting Started with X1/XDEX Trading Bot

This guide will help you set up and run the X1/XDEX trading bot step by step.

## Prerequisites

- [Bun](https://bun.sh/) installed (already installed ✓)
- A Neon PostgreSQL database (free tier available)

## Step 1: Get a Neon Database (Free)

1. Go to https://console.neon.tech/
2. Sign up for a free account
3. Create a new project (e.g., "x1-trading-bot")
4. Copy the connection string - it looks like:
   ```
   postgres://username:password@ep-xxxxx.us-east-2.aws.neon.tech/database?sslmode=require
   ```

## Step 2: Configure Database Connection

1. Open the `.dev.vars` file (already created for you)
2. Replace the `DATABASE_URL` with your Neon connection string:
   ```bash
   DATABASE_URL=postgres://your-user:your-password@your-host.neon.tech/your-db?sslmode=require
   ```

## Step 3: Install Dependencies

```bash
bun install
```

## Step 4: Setup Database Schema

This will create all the necessary tables (tokens, pairs, swaps, etc.):

```bash
bunx drizzle-kit push
```

You should see output showing the tables being created.

## Step 5: Test DexScreener API

Test if DexScreener has X1/XDEX data:

```bash
bunx tsx scripts/test-dexscreener.ts
```

**Expected Output (if X1 data exists):**
```
Testing DexScreener API for X1/XDEX...
✓ Found 15 pairs on X1/XDEX
✓ Sample pair: XN/USDC - Price: $0.045
✓ Top gainers found
```

**If you see 0 pairs:** X1 might be too new for DexScreener. We can integrate directly with Solana RPC.

## Step 6: Start the Sync Service

This will sync DexScreener data to your database every 60 seconds:

```bash
bun run sync
```

**What it does:**
- Fetches all X1/XDEX pairs from DexScreener
- Updates tokens and pairs in your database
- Shows live stats (volume, liquidity, top gainers)
- Runs continuously - press Ctrl+C to stop

## Step 7: Verify Data

Once the sync is running, you can check your Neon database dashboard to see the data populating.

## Troubleshooting

### Error: "DATABASE_URL must be a Neon postgres connection string"
- Make sure you updated `.dev.vars` with your real Neon connection string
- Connection string should start with `postgres://` or `postgresql://`

### Error: Network issues / Cannot connect
- Check your internet connection
- Verify Neon database is accessible

### DexScreener returns 0 pairs
- X1 blockchain might be too new for DexScreener indexing
- Alternative: We can build direct Solana RPC integration to query XDEX program

## What's Next?

After data is syncing successfully:

1. **Build Frontend Dashboard**
   - Next.js UI to view tokens, pairs, charts
   - Real-time price updates with WebSocket
   - Watchlist and alerts UI

2. **Implement Trading Bot Features**
   - Auto-sniper for new pairs
   - Take-profit / Stop-loss automation
   - Copy trading functionality

3. **Add Pump.Fun & bonk.fun**
   - Integrate additional DEXes

## Project Structure

```
src/
├── db/
│   └── schema/          # Database tables (tokens, pairs, swaps, etc.)
├── lib/
│   └── dexscreener-client.ts  # DexScreener API client
├── services/
│   └── dexscreener-sync.ts    # Sync service
└── scripts/
    ├── test-dexscreener.ts     # Test API
    └── start-dexscreener-sync.ts  # Run sync
```

## Need Help?

If you get stuck at any step, let me know and I'll help troubleshoot!
