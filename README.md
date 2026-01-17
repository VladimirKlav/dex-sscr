# X1 Trading Bot & DEX Tracker

A comprehensive trading bot and DEX tracker for the X1 blockchain, inspired by [x1.ninja](https://x1.ninja). This project indexes DEX pairs, tracks swaps, monitors liquidity, provides automated trading capabilities, and generates beautiful trading charts.

## 🚀 Features

### 🔍 DEX Indexing & Tracking
- Real-time indexing of Uniswap V2-style DEX events (PairCreated, Swap, Mint, Burn)
- Tracks all token pairs, swaps, and liquidity changes
- Automatic token metadata fetching
- Multi-DEX support (X1Swap, QuickSwap, etc.)
- Holder tracking and analytics

### 📊 Chart Generation
- **Beautiful Trading Charts**: Create neon-styled charts with entry price indicators
- **Professional Axes**: Y-axis (price) and X-axis (time/date) with intelligent formatting
- **Multiple Token Support**: Works with all tokens in the database
- **High Performance**: Built with Bun runtime and skia-canvas rendering

### 🌐 REST API
- **Pairs**: List pairs, get pair details, filter by liquidity/age/DEX
- **Tokens**: List tokens, search, get token details
- **Stats**: Overall statistics, top gainers, recently listed pairs
- **Chart Generation**: Generate trading charts via API
- **Indexer Status**: Monitor blockchain indexing progress

### 🤖 Trading Bot (Coming Soon)
- Auto-sniper for new pair launches
- Take-profit / Stop-loss automation
- Copy trading from specific wallets
- Price alerts and notifications

### 🎨 Dashboard UI (Coming Soon)
- Token pair listings with real-time data
- Filters (liquidity, volume, age, DEX)
- Watchlist & alerts
- Charts & analytics

## 📋 Prerequisites

- **Bun** v1.2.19+ ([Install Bun](https://bun.sh))
- **Node.js** v22+
- **PostgreSQL database** (we recommend [Neon](https://neon.tech))
- **X1 RPC endpoint** (default: https://rpc.x1.xyz)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dex-sscr
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment variables template
   cp .dev.vars.example .dev.vars

   # Edit .dev.vars with your configuration
   ```

4. **Configure .dev.vars** with the following:
   ```bash
   # Database
   DATABASE_URL=postgres://user:password@host:5432/database

   # X1 Network
   X1_RPC_URL=https://rpc.x1.xyz

   # DEX Contracts (Update with actual addresses)
   X1SWAP_FACTORY=0x...
   X1SWAP_ROUTER=0x...
   WETH_ADDRESS=0x...
   USDC_ADDRESS=0x...

   # Indexer Settings
   START_BLOCK=0
   BATCH_SIZE=100
   POLLING_INTERVAL=5000
   ```

## 🏃‍♂️ Usage

### Running the Blockchain Indexer

The indexer monitors the X1 blockchain for DEX events and stores them in the database:

```bash
bun run indexer
```

This will:
- Connect to X1 RPC at https://rpc.x1.xyz
- Index historical data from START_BLOCK
- Continue with real-time indexing
- Log progress every 30 seconds

### Running the API Server

Start the API server (Cloudflare Worker compatible):

```bash
# Development with hot reload
bun run dev

# Production
bun run start
```

API will be available at `http://localhost:8787`

### Generate Charts Locally

```bash
# List available tokens
bun run gen-chart

# Generate chart for a token (24 hours)
bun run gen-chart SOL

# Generate chart (custom period)
bun run gen-chart USDC 12

# Custom output path
bun run gen-chart JUP 48 ./data/jup-custom.png
```

## 🌐 API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /api/indexer/status` - Get blockchain indexer status

### Pairs
- `GET /api/pairs?limit=50&offset=0&sortBy=age&dex=X1Swap` - List all pairs
- `GET /api/pairs/new?limit=50` - Get newly created pairs (last 24h)
- `GET /api/pairs/:address` - Get detailed pair information

### Tokens
- `GET /api/tokens?limit=50&offset=0` - List all tokens
- `GET /api/tokens/search?q=XNT` - Search tokens by name or symbol
- `GET /api/tokens/:address` - Get token details with pairs and holder count

### Statistics
- `GET /api/stats` - Overall platform statistics
- `GET /api/stats/gainers?limit=10&hours=24` - Top gaining pairs
- `GET /api/stats/recent?limit=20` - Recently listed pairs

### Chart Generation
- `POST /generate-chart` - Generate trading chart
  ```json
  {
    "tokenAddress": "0x...",
    "entryPrice": 1.23,
    "isBullish": true,
    "periodHours": 24,
    "width": 800,
    "height": 360
  }
  ```

### Example API Calls

```bash
# Get overall stats
curl http://localhost:8787/api/stats

# List all pairs
curl http://localhost:8787/api/pairs?limit=10

# Get new pairs
curl http://localhost:8787/api/pairs/new

# Search for a token
curl http://localhost:8787/api/tokens/search?q=XNT

# Get indexer status
curl http://localhost:8787/api/indexer/status

# Generate chart
curl -X POST http://localhost:8787/generate-chart \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAddress": "0x...",
    "entryPrice": 1.5,
    "isBullish": true,
    "periodHours": 24
  }'
```

## 📁 Project Structure

```
dex-sscr/
├── src/
│   ├── api/                      # REST API endpoints
│   │   ├── pairs.ts              # Pair-related endpoints
│   │   ├── tokens.ts             # Token-related endpoints
│   │   └── stats.ts              # Statistics endpoints
│   ├── db/
│   │   ├── schema/               # Database schema definitions
│   │   │   ├── tokens.ts         # Token metadata
│   │   │   ├── token-ohlcv.ts    # OHLCV price data
│   │   │   ├── pairs.ts          # DEX trading pairs
│   │   │   ├── swaps.ts          # Swap/trade events
│   │   │   ├── liquidity-events.ts # Mint/Burn events
│   │   │   ├── holders.ts        # Token holder tracking
│   │   │   ├── watchlist.ts      # User watchlists
│   │   │   ├── alerts.ts         # Price alerts
│   │   │   └── bot-configs.ts    # Trading bot configs
│   │   └── index.ts              # Database connection
│   ├── indexer/                  # Blockchain indexer
│   │   ├── blockchain-indexer.ts # Main indexer logic
│   │   └── event-processor.ts    # Process DEX events
│   ├── lib/
│   │   ├── rpc-client.ts         # X1 RPC client (viem)
│   │   ├── canvas.ts             # Chart rendering utilities
│   │   └── r2.ts                 # Cloudflare R2 storage
│   ├── config/
│   │   └── x1.ts                 # X1 network & DEX configuration
│   ├── abi/                      # Smart contract ABIs
│   │   ├── uniswap-v2-factory.json
│   │   ├── uniswap-v2-pair.json
│   │   └── erc20.json
│   ├── worker.ts                 # Cloudflare Worker / API server
│   ├── chart-generator.ts        # Chart rendering logic
│   ├── constants.ts              # App constants
│   └── utils/                    # Utility functions
├── scripts/
│   ├── start-indexer.ts          # Start blockchain indexer
│   └── gen-chart.ts              # Generate charts locally
└── migrations/                   # Database migrations
```

## 🗄️ Database Schema

### Core Tables
- **tokens** - Token metadata (address, name, symbol, decimals, icon)
- **token_ohlcv** - Historical price data (OHLCV candles)
- **pairs** - DEX trading pairs with reserves and creation data
- **swaps** - All swap/trade transactions
- **liquidity_events** - Liquidity additions (Mint) and removals (Burn)
- **holders** - Token holder balances and tracking

### User Features
- **watchlist** - User's favorite pairs to track
- **alerts** - Price alerts and notifications
- **bot_configs** - Trading bot configurations and settings

## ⚙️ Configuration

### X1 Network (src/config/x1.ts)
- **Chain ID**: 204005
- **RPC**: https://rpc.x1.xyz
- **Explorer**: https://explorer.x1.xyz
- **Native Currency**: XN (18 decimals)

### DEX Configuration

Update `src/config/x1.ts` with actual DEX contract addresses:

```typescript
export const DEX_CONFIGS = [
  {
    name: "X1Swap",
    factory: "0x...",  // Update with actual factory address
    router: "0x...",   // Update with actual router address
    version: "v2",
  },
];
```

**To find DEX contract addresses:**
1. Visit https://explorer.x1.xyz
2. Search for the DEX name (e.g., "X1Swap")
3. Find the factory and router contract addresses
4. Update the configuration file

### Chart Styling
- **Bullish Color**: `#00ffa2` (neon green)
- **Bearish Color**: `#ff5f6d` (neon red)
- **Background**: Dark gradient (`#050607` → `#0b0f10`)
- **Default Dimensions**: 800×360px @ 1.5x DPR
- **Neon Effects**: Multi-layer glow with blur

## 🏗️ Development

### Available Scripts

```bash
# API Server
bun run dev                    # Development with hot reload
bun run start                  # Production server

# Blockchain Indexer
bun run indexer               # Start indexing X1 blockchain

# Chart Generation
bun run gen-chart             # List available tokens
bun run gen-chart SOL         # Generate SOL chart (24h)
bun run gen-chart USDC 12     # USDC chart (12h)

# Database
bunx drizzle-kit generate     # Generate migration
bunx drizzle-kit push         # Push schema to database

# Code Quality
bun run lint                  # Check and fix with Biome
bun run format                # Format code
bun run ci                    # Run all quality checks

# Utilities
bun run clean                 # Clean generated data
bun run cf-typegen            # Generate Cloudflare types
```

### Database Migrations

```bash
# Generate a new migration
bunx drizzle-kit generate

# Apply migrations to database
bunx drizzle-kit push

# Open Drizzle Studio (database GUI)
bunx drizzle-kit studio
```

## 🚀 Deployment

### Cloudflare Workers

```bash
# Build
bun run build

# Deploy to production
wrangler deploy

# Deploy to staging
wrangler deploy --env staging
```

### Traditional Server

```bash
# Start production server
bun run start
```

## 🔐 Security

⚠️ **Important Security Notes**:
- Never commit private keys or sensitive credentials
- Always use environment variables for configuration
- Be cautious when using automated trading features
- Test thoroughly on testnet before mainnet
- Understand the risks of automated trading
- Set appropriate gas limits and slippage tolerance

## 📋 Roadmap

### Completed ✅
- [x] Database schema design (tokens, pairs, swaps, liquidity, holders, watchlist, alerts, bot configs)
- [x] X1 RPC client with viem
- [x] Blockchain event indexer (PairCreated, Swap, Mint, Burn)
- [x] Event processor with automatic token metadata fetching
- [x] REST API endpoints for pairs, tokens, and statistics
- [x] Chart generation with entry price indicators
- [x] Indexer CLI script
- [x] API documentation

### In Progress 🚧
- [ ] Real-time price tracking & OHLCV generation
- [ ] WebSocket server for live updates
- [ ] Frontend dashboard (Next.js)

### Upcoming 📅
- [ ] Watchlist & alerts implementation
- [ ] Auto-sniper bot for new pairs
- [ ] Take-profit/Stop-loss automation
- [ ] Copy trading functionality
- [ ] Pump.Fun integration
- [ ] bonk.fun integration
- [ ] Multi-wallet support
- [ ] Mobile-responsive dashboard
- [ ] Advanced charting (TradingView integration)
- [ ] Historical data export

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Follow TypeScript and Bun coding standards
4. Run `bun run ci` before committing
5. Submit a pull request

## 📄 License

MIT

## 🙏 Acknowledgments

- Inspired by [x1.ninja](https://x1.ninja)
- Built with:
  - [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
  - [Viem](https://viem.sh) - TypeScript interface for Ethereum
  - [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
  - [Cloudflare Workers](https://workers.cloudflare.com) - Serverless platform
  - [Skia Canvas](https://github.com/samizdatco/skia-canvas) - High-performance canvas rendering

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ for the X1 blockchain community**
