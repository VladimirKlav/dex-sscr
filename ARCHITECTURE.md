# Architecture Documentation

## Overview

This project is a trading bot and DEX tracker for X1 blockchain, inspired by [x1.ninja](https://x1.ninja). The main DEX on X1 is **XDEX** (https://app.xdex.xyz).

## Architecture Evolution

### Initial Approach (EVM-based) ❌
Initially designed for EVM-style event indexing using:
- viem (Ethereum library)
- Event log parsing (PairCreated, Swap, Mint, Burn)
- Uniswap V2-style contract ABIs

**Status**: Deprecated - X1 is SVM-based, not EVM

### Current Approach (SVM-based with REST API) ✅
Using XDEX REST API for data access:
- **API Base**: https://api.xdex.xyz/api/xendex
- **Data Source**: XDEX REST endpoints
- **Sync Strategy**: Periodic polling + caching in database
- **Real-time**: WebSocket for critical events (future)

## System Components

### 1. XDEX API Client (`src/lib/xdex-api.ts`)
- Interfaces with XDEX REST API
- Handles swap preparation, token/pool queries
- Network support: X1 Mainnet, X1 Testnet, Solana Mainnet, Solana Devnet

**Key Methods**:
```typescript
- prepareSwap() - Prepare swap transactions
- getTokens() - Fetch all tokens
- getPools() - Fetch all pools/pairs
- getToken(mint) - Get specific token
- getPool(address) - Get specific pool
- get24hStats() - Get 24h statistics
```

### 2. Data Sync Service (`src/services/xdex-sync.ts`)
- Periodically fetches data from XDEX API
- Stores in local PostgreSQL database
- Runs every 60 seconds (configurable)
- Syncs: tokens, pools, reserves

**Run with**:
```bash
bun run sync
```

### 3. Database Layer (`src/db/`)
Stores XDEX data locally for:
- Fast queries
- Historical tracking
- User features (watchlist, alerts)
- Trading bot state

**Schema**:
- `tokens` - Token metadata
- `pairs` - Pool/pair information
- `swaps` - Trade history
- `liquidity_events` - Liquidity changes
- `holders` - Token holder tracking
- `watchlist` - User favorites
- `alerts` - Price alerts
- `bot_configs` - Trading bot settings

### 4. REST API (`src/worker.ts`)
Cloudflare Worker serving:
- `/api/pairs` - List pairs
- `/api/tokens` - List tokens
- `/api/stats` - Statistics
- `/api/indexer/status` - Sync status
- `/generate-chart` - Generate charts

### 5. Chart Generator (`src/chart-generator.ts`)
- Generates trading charts with Skia Canvas
- Entry price indicators
- OHLCV data visualization

## Data Flow

```
XDEX REST API
    ↓
XDEX API Client (src/lib/xdex-api.ts)
    ↓
Sync Service (src/services/xdex-sync.ts)
    ↓
PostgreSQL Database (Neon)
    ↓
REST API (src/worker.ts)
    ↓
Frontend / Trading Bot
```

## Deployment

### Production Stack
- **API**: Cloudflare Workers
- **Database**: Neon PostgreSQL
- **Sync Service**: Long-running process (VPS, Docker, etc.)
- **Charts**: R2 storage (optional)

### Local Development
1. Database: Neon or local PostgreSQL
2. Sync: `bun run sync`
3. API: `bun run dev`

## Trading Bot Architecture (Future)

### Auto-Sniper Bot
```
XDEX Sync Service
    → Detects new pool
        → Check liquidity threshold
            → Prepare swap via XDEX API
                → Sign with wallet
                    → Execute swap
```

### Take-Profit / Stop-Loss
```
Price Monitor (polling)
    → Check target price
        → If TP/SL triggered
            → Prepare swap via XDEX API
                → Execute sell
```

### Copy Trading
```
Monitor target wallets (via Solana RPC)
    → Detect swap transaction
        → Parse swap details
            → Mirror swap via XDEX API
                → Execute with configured amount
```

## Key Differences: EVM vs SVM

| Aspect | EVM (Ethereum) | SVM (Solana/X1) |
|--------|----------------|-----------------|
| **Architecture** | Account-based | Account-based (different model) |
| **Events** | Event logs | Account state changes |
| **Addresses** | 0x... (20 bytes) | Base58 (32 bytes) |
| **Indexing** | Event filtering | Account subscriptions |
| **Libraries** | viem, ethers.js | @solana/web3.js |
| **Contracts** | Solidity | Rust + Anchor |
| **Our Approach** | ~~Direct indexing~~ | REST API + sync |

## Why REST API over Direct Indexing?

### Advantages ✅
- **Simpler**: No need to understand Solana internals
- **Maintained**: XDEX maintains the API
- **Faster**: Quicker implementation
- **Reliable**: Official data source
- **Less Infrastructure**: No need for Solana RPC node

### Trade-offs ⚠️
- **API Dependency**: Relies on XDEX API uptime
- **Rate Limits**: Potential API rate limiting
- **Latency**: Slightly delayed vs real-time indexing
- **Features**: Limited to what API exposes

## Future Enhancements

### Phase 1: Core Features ✅ (Current)
- [x] XDEX API client
- [x] Data sync service
- [x] REST API endpoints
- [x] Database schema

### Phase 2: Real-time & Frontend
- [ ] WebSocket for live updates
- [ ] Next.js dashboard
- [ ] Token listing with filters
- [ ] Charts integration

### Phase 3: Trading Bot
- [ ] Auto-sniper for new pools
- [ ] TP/SL automation
- [ ] Copy trading
- [ ] Multi-wallet support

### Phase 4: Advanced
- [ ] Pump.Fun integration
- [ ] bonk.fun integration
- [ ] Advanced charting (TradingView)
- [ ] Mobile app

## Deprecated Components

### ❌ EVM-based Indexer
- `src/indexer/blockchain-indexer.ts` - EVM event indexer (won't work with X1)
- `src/indexer/event-processor.ts` - EVM event processor
- `src/lib/rpc-client.ts` - viem-based RPC client
- `src/abi/*.json` - Uniswap V2 ABIs

**These files are kept as reference/template for EVM chains but are not used for X1.**

To use them for another EVM chain:
1. Update chain configuration
2. Update DEX contract addresses
3. Run `bun run indexer`

## Configuration

### Environment Variables (.dev.vars)
```bash
# Database
DATABASE_URL=postgres://...

# X1 Network
X1_RPC_URL=https://rpc.x1.xyz  # For future direct integration

# XDEX API (handled by code, no env var needed)
# API Base: https://api.xdex.xyz/api/xendex

# Sync Settings
SYNC_INTERVAL=60000  # Milliseconds between syncs
```

## Monitoring & Debugging

### Check Sync Status
```bash
curl http://localhost:8787/api/indexer/status
```

### Check Database
```sql
SELECT COUNT(*) FROM tokens;
SELECT COUNT(*) FROM pairs;
SELECT * FROM pairs ORDER BY created_at DESC LIMIT 10;
```

### Logs
- Sync service logs to console
- API logs to console (Cloudflare Worker logs in production)
- Log levels: ERROR, WARN, INFO, DEBUG

## Resources

- **X1 Network**: https://x1.xyz
- **XDEX App**: https://app.xdex.xyz
- **XDEX API Docs**: https://api.xdex.xyz (check for official docs)
- **X1 Explorer**: https://explorer.x1.xyz
- **Solana Docs**: https://docs.solana.com (X1 is SVM-based)
- **Anchor Framework**: https://www.anchor-lang.com

## Contributing

When adding features:
1. Use XDEX API client for data access
2. Store in database for caching/history
3. Expose via REST API
4. Update documentation

For direct Solana/X1 integration (advanced):
1. Use @solana/web3.js
2. Subscribe to account changes
3. Parse Anchor IDL for instruction decoding
4. Update sync service accordingly
