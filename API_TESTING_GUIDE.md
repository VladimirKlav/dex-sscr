# XDEX API Testing & Integration Guide

This guide will help you test the XDEX REST API endpoints and integrate them into the project.

## Quick Start

### 1. Run the API Discovery Script

```bash
bun run test-api
```

This script will:
- ✅ Test the documented `/swap/prepare` endpoint
- 🔍 Discover other available endpoints
- 📝 Show you which endpoints work
- 💾 Display sample response data

### 2. Review the Results

The script will output working endpoints like:
```
==========================================================
WORKING ENDPOINTS:
==========================================================
✅ POST /swap/prepare
✅ GET /tokens
✅ GET /pools
==========================================================
```

### 3. Update the API Client

Based on discovered endpoints, update `src/lib/xdex-api.ts` with correct URLs.

## Known Endpoint

### Documented Endpoint ✅

**POST /api/xendex/swap/prepare**

This endpoint is documented in the XDEX developer docs and should work:

```bash
curl -X POST https://api.xdex.xyz/api/xendex/swap/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "network": "X1 Mainnet",
    "wallet": "YourWalletPublicKey",
    "token_in": "TokenMintAddressIn",
    "token_out": "TokenMintAddressOut",
    "token_in_amount": 1.23,
    "is_exact_amount_in": true
  }'
```

**Response** (expected structure):
```json
{
  "success": true,
  "estimated_output": 123.45,
  "price_impact": 0.5,
  "minimum_received": 120.00,
  "route": [...],
  "transaction": "base64-encoded-transaction"
}
```

## Endpoints to Discover

The following endpoints are **placeholders** and need to be discovered:

### Token Endpoints

Try these patterns:
```bash
# List all tokens
GET /api/xendex/tokens?network=X1 Mainnet
GET /api/xendex/token-list?network=X1 Mainnet
GET /api/xendex/tokens/list?network=X1 Mainnet

# Get specific token
GET /api/xendex/token/{mint}?network=X1 Mainnet
GET /api/xendex/tokens/{mint}?network=X1 Mainnet
GET /api/xendex/token?mint={mint}&network=X1 Mainnet

# Search tokens
GET /api/xendex/tokens/search?q=SOL&network=X1 Mainnet
```

### Pool/Pair Endpoints

Try these patterns:
```bash
# List all pools
GET /api/xendex/pools?network=X1 Mainnet
GET /api/xendex/pools/list?network=X1 Mainnet
GET /api/xendex/pairs?network=X1 Mainnet

# Get specific pool
GET /api/xendex/pool/{address}?network=X1 Mainnet
GET /api/xendex/pools/{address}?network=X1 Mainnet

# Get pools for a token
GET /api/xendex/pools?token={mint}&network=X1 Mainnet
```

### Statistics Endpoints

Try these patterns:
```bash
# Overall stats
GET /api/xendex/stats?network=X1 Mainnet
GET /api/xendex/stats/24h?network=X1 Mainnet
GET /api/xendex/statistics?network=X1 Mainnet

# Top gainers
GET /api/xendex/stats/gainers?network=X1 Mainnet&limit=10
GET /api/xendex/stats/top?network=X1 Mainnet

# Recent pairs
GET /api/xendex/stats/recent?network=X1 Mainnet&limit=20
GET /api/xendex/pools/recent?network=X1 Mainnet
```

### Swap/Transaction History

Try these patterns:
```bash
# Recent swaps
GET /api/xendex/swaps?network=X1 Mainnet&limit=50
GET /api/xendex/transactions?network=X1 Mainnet

# Swaps for specific pool
GET /api/xendex/swaps/{pool_address}?network=X1 Mainnet
GET /api/xendex/pool/{address}/swaps?network=X1 Mainnet
```

### Price Endpoints

Try these patterns:
```bash
# Get token price
GET /api/xendex/price/{mint}?network=X1 Mainnet
GET /api/xendex/prices?mints={mint1},{mint2}&network=X1 Mainnet

# Price quote
GET /api/xendex/quote?from={mint}&to={mint}&amount=1&network=X1 Mainnet
```

## Manual Testing with cURL

### Test Swap Prepare

```bash
curl -X POST https://api.xdex.xyz/api/xendex/swap/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "network": "X1 Mainnet",
    "wallet": "11111111111111111111111111111111",
    "token_in": "So11111111111111111111111111111111111111112",
    "token_out": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "token_in_amount": 0.01,
    "is_exact_amount_in": true
  }' | jq '.'
```

### Test Token List

```bash
# Try different patterns
curl "https://api.xdex.xyz/api/xendex/tokens?network=X1%20Mainnet" | jq '.'
curl "https://api.xdex.xyz/api/xendex/token-list?network=X1%20Mainnet" | jq '.'
curl "https://api.xdex.xyz/api/xendex/tokens/list?network=X1%20Mainnet" | jq '.'
```

### Test Pool List

```bash
curl "https://api.xdex.xyz/api/xendex/pools?network=X1%20Mainnet" | jq '.'
curl "https://api.xdex.xyz/api/xendex/pairs?network=X1%20Mainnet" | jq '.'
```

## Updating the API Client

Once you discover working endpoints, update `src/lib/xdex-api.ts`:

### Example: Update getTokens()

```typescript
// Before (placeholder)
async getTokens(): Promise<XDEXTokenInfo[]> {
  const response = await fetch(`${this.baseUrl}/tokens?network=${this.network}`);
  // ...
}

// After (discovered endpoint)
async getTokens(): Promise<XDEXTokenInfo[]> {
  // If you find it's actually /token-list
  const response = await fetch(`${this.baseUrl}/token-list?network=${this.network}`);
  // ...
}
```

### Example: Update Response Type

If the response structure is different:

```typescript
// Update the interface based on actual response
export interface XDEXTokenInfo {
  mint: string;              // Actual field name in response
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  // Add new fields discovered in response
  price_usd?: number;        // If API returns this
  volume_24h?: number;       // If API returns this
  market_cap?: number;       // If API returns this
}
```

## Alternative: Check XDEX Frontend

If API documentation isn't available, inspect the XDEX app:

### 1. Open XDEX App

Visit https://app.xdex.xyz

### 2. Open Browser DevTools

- Chrome/Edge: F12
- Firefox: F12
- Safari: Cmd+Option+I (Mac)

### 3. Go to Network Tab

Click on the "Network" tab in DevTools

### 4. Use the App

- View token list
- Click on a pool
- Make a swap
- Check stats

### 5. Inspect Requests

Look for requests to `api.xdex.xyz` and note:
- URL path
- Request method (GET/POST)
- Query parameters
- Request body (if POST)
- Response structure

### 6. Copy Working Patterns

Once you find working endpoints, copy the exact URL pattern and update the API client.

## Response Structure Examples

Document the actual response structures you find:

### Token Response

```json
{
  "tokens": [
    {
      "mint": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "name": "Wrapped SOL",
      "decimals": 9,
      "logoURI": "https://...",
      "price": 123.45,
      "volume24h": 1000000
    }
  ]
}
```

### Pool Response

```json
{
  "pools": [
    {
      "address": "...",
      "token0": { "mint": "...", "symbol": "SOL" },
      "token1": { "mint": "...", "symbol": "USDC" },
      "reserve0": 1000,
      "reserve1": 2000,
      "volume24h": 50000,
      "apr": 25.5
    }
  ]
}
```

## Common Issues

### CORS Errors

If testing from browser console:
```javascript
// Browser blocks CORS
fetch('https://api.xdex.xyz/api/xendex/tokens')
  .then(r => r.json())
  .then(console.log)
```

**Solution**: Use the test script (`bun run test-api`) or curl instead.

### 404 Not Found

Endpoint doesn't exist at that path.
- Try different URL patterns
- Check API documentation
- Inspect XDEX app network requests

### 401 Unauthorized

API requires authentication.
- Check if API key is needed
- Look for auth headers in XDEX app
- May need to contact XDEX team

### Empty Response

API might return empty data if:
- No tokens/pools on X1 Mainnet yet
- Wrong network parameter
- API is still in development

**Solution**: Try "X1 Testnet" or "Solana Mainnet" instead.

## Next Steps After Discovery

1. **Update API Client**
   ```bash
   vim src/lib/xdex-api.ts
   ```

2. **Test Sync Service**
   ```bash
   bun run sync
   ```

3. **Check Database**
   ```sql
   SELECT COUNT(*) FROM tokens;
   SELECT COUNT(*) FROM pairs;
   ```

4. **Test REST API**
   ```bash
   bun run dev
   curl http://localhost:8787/api/stats
   ```

5. **Build Frontend**
   - Now that data is flowing, build the UI!

## Help & Support

- **XDEX Docs**: https://xdexdocs.gitbook.io/xdex
- **XDEX Twitter**: https://x.com/xdex_xyz
- **X1 Docs**: https://docs.x1.xyz
- **Issue Tracker**: Open an issue on GitHub

## Contributing

Found working endpoints? Please update:
1. `src/lib/xdex-api.ts` - Add/fix endpoints
2. This guide - Document response structures
3. `README.md` - Update instructions
4. Open a PR!

---

**Happy Testing! 🚀**
