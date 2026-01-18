# Quick Start - X1/XDEX Trading Bot

Get up and running in 2 minutes!

## Prerequisites

✅ Bun installed
✅ Neon database connection string

## Setup (One Command)

```bash
./scripts/setup.sh
```

This will:
- Install dependencies
- Create database tables
- Test DexScreener API
- Show you what to do next

## If Setup Script Fails

Run commands manually:

```bash
# 1. Install dependencies
bun install

# 2. Make sure .dev.vars has your DATABASE_URL
cat .dev.vars  # Should show your real Neon connection string

# 3. Setup database
bunx drizzle-kit push

# 4. Test API
bunx tsx scripts/test-dexscreener.ts

# 5. Start syncing (if test passed)
bun run sync
```

## Current Network Status

⚠️ **Note**: This environment has restricted network access. The database and API tests will need to run on your local machine where network access is available.

## What Happens When You Run `bun run sync`?

The sync service will:
- Fetch all X1/XDEX trading pairs from DexScreener every 60 seconds
- Update your database with tokens and pairs
- Show live stats (volume, liquidity, top gainers)
- Keep running until you press Ctrl+C

## Check If It's Working

1. Run `bun run sync`
2. Open another terminal
3. Check your Neon database at https://console.neon.tech/
4. Look for data in the `tokens` and `pairs` tables

## Next Steps

Once data is syncing:
- Build Next.js dashboard UI
- Add WebSocket for real-time updates
- Implement trading bot features (auto-sniper, TP/SL)
- Integrate Pump.Fun and bonk.fun

## Need Help?

See `GETTING_STARTED.md` for detailed instructions.
