# X1 XDEX Setup Guide

This guide will help you find the correct XDEX contract addresses and configure the indexer.

## Finding XDEX Contract Addresses

### Option 1: X1 Explorer (Recommended)

1. Visit the X1 blockchain explorer:
   - Mainnet: https://explorer.mainnet.x1.xyz
   - Or: https://explorer.x1.xyz

2. Search for "XDEX" in the search bar

3. Look for these contracts:
   - **Factory Contract**: Usually named something like "XDEX Factory" or "UniswapV2Factory"
   - **Router Contract**: Usually named "XDEX Router" or "UniswapV2Router02"
   - **Pair Contracts**: Individual trading pairs

4. Copy the contract addresses (they start with `0x...`)

### Option 2: XDEX Application

1. Visit https://app.xdex.xyz/swap

2. Open browser developer tools (F12)

3. Look at the Network tab while making a swap

4. Find contract interaction calls - they will show the contract addresses

5. Common contract names to look for:
   - `factoryAddress`
   - `routerAddress`
   - `pairAddress`

### Option 3: XDEX Documentation

1. Check the official XDEX documentation: https://xdexdocs.gitbook.io/xdex

2. Look for a "Contract Addresses" or "Developers" section

3. Copy the addresses for X1 Network (Chain ID: 204005)

### Option 4: XDEX Social/Community

1. Visit XDEX Twitter: https://x.com/xdex_xyz

2. Look for pinned tweets or announcements about contract deployments

3. Check their Discord or Telegram for official announcements

## Updating Configuration

Once you have the addresses, update your `.dev.vars` file:

```bash
# Copy the example file
cp .dev.vars.example .dev.vars

# Edit with your favorite editor
nano .dev.vars
# or
code .dev.vars
```

Update these values:
```bash
# XDEX Contract Addresses
XDEX_FACTORY=0x1234...  # Replace with actual factory address
XDEX_ROUTER=0x5678...   # Replace with actual router address
XDEX_INIT_CODE_HASH=abc123...  # Optional - for CREATE2 pair calculation
```

## Verifying X1 Architecture

⚠️ **Important**: There's conflicting information about X1's architecture:
- Some sources say it's **SVM-based** (Solana Virtual Machine)
- Other indicators suggest **EVM compatibility** (chain ID 204005, 0x addresses)

To verify:

1. Try making an RPC call to https://rpc.x1.xyz:
   ```bash
   curl -X POST https://rpc.x1.xyz \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
   ```

2. If you get a valid response with `"result":"0x31d85"` (or 204005 in hex), it's EVM-compatible

3. If it doesn't respond to `eth_` methods, it might be SVM-based and need a different approach

## Common Token Addresses

After finding XDEX contracts, also find these common token addresses:

- **WETH (Wrapped XN)**: The wrapped version of X1's native token XN
- **USDC**: Stablecoin on X1
- **XDEX**: The XDEX governance token

Update these in `.dev.vars`:
```bash
WETH_ADDRESS=0x...
USDC_ADDRESS=0x...
```

## Testing Your Configuration

1. After updating `.dev.vars`, generate database migrations:
   ```bash
   bunx drizzle-kit push
   ```

2. Start the indexer:
   ```bash
   bun run indexer
   ```

3. Watch for the first `PairCreated` event to be detected

4. If nothing appears after a few minutes:
   - Verify the factory address is correct
   - Check if there are recent pairs created on XDEX
   - Adjust `START_BLOCK` to a more recent block number

## Troubleshooting

### No events detected
- ✅ Verify factory address is correct
- ✅ Check START_BLOCK is not too far back (try recent block)
- ✅ Ensure RPC URL is responding (try curl command above)
- ✅ Check X1 blockchain is still using Chain ID 204005

### RPC errors
- ✅ Check if RPC is rate-limited (try different RPC provider)
- ✅ Verify network connectivity
- ✅ Check if X1_RPC_URL in .dev.vars is correct

### Database connection errors
- ✅ Verify DATABASE_URL is correct
- ✅ Check if database exists and is accessible
- ✅ Run `bunx drizzle-kit push` to create tables

## Next Steps

After successful configuration:

1. **Verify indexing**: Check that pairs, swaps, and tokens are being stored
   ```bash
   # Connect to your database and query
   SELECT COUNT(*) FROM pairs;
   SELECT COUNT(*) FROM tokens;
   SELECT COUNT(*) FROM swaps;
   ```

2. **Start API server**:
   ```bash
   bun run dev
   ```

3. **Test API endpoints**:
   ```bash
   # Check stats
   curl http://localhost:8787/api/stats

   # List pairs
   curl http://localhost:8787/api/pairs

   # Indexer status
   curl http://localhost:8787/api/indexer/status
   ```

4. **Build the frontend** (see README.md roadmap)

## Need Help?

If you're stuck:
1. Check the main README.md for detailed documentation
2. Open an issue on GitHub
3. Review the X1 and XDEX official documentation

## Resources

- **X1 Network**: https://x1.xyz
- **X1 Explorer**: https://explorer.x1.xyz
- **X1 Mainnet Explorer**: https://explorer.mainnet.x1.xyz
- **XDEX App**: https://app.xdex.xyz
- **XDEX Docs**: https://xdexdocs.gitbook.io/xdex
- **XDEX Twitter**: https://x.com/xdex_xyz
- **X1 Docs**: https://docs.x1.xyz
