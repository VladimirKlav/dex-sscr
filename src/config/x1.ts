/**
 * X1 Network Configuration
 *
 * NOTE: X1 blockchain architecture needs verification.
 * Some sources indicate SVM-based (Solana VM), while explorer suggests EVM compatibility.
 * Currently configured for EVM-style indexing. May need adjustment based on actual architecture.
 */
export const X1_CONFIG = {
  chainId: 204005,
  name: "X1 Network",
  rpcUrl: process.env.X1_RPC_URL || "https://rpc.x1.xyz",
  explorerUrl: "https://explorer.x1.xyz", // Mainnet: https://explorer.mainnet.x1.xyz
  nativeCurrency: {
    name: "XN",
    symbol: "XN",
    decimals: 18,
  },
  // Block time in seconds (estimate)
  blockTime: 2,
  // Number of confirmations to wait before considering a block final
  confirmations: 3,
} as const;

/**
 * DEX Configurations
 * Main DEX on X1: XDEX (https://app.xdex.xyz)
 *
 * IMPORTANT: Update these addresses by visiting https://explorer.x1.xyz
 * and searching for XDEX contracts
 */
export const DEX_CONFIGS = [
  {
    name: "XDEX",
    factory: process.env.XDEX_FACTORY || "0x0000000000000000000000000000000000000000", // TODO: Find actual XDEX factory address
    router: process.env.XDEX_ROUTER || "0x0000000000000000000000000000000000000000", // TODO: Find actual XDEX router address
    initCodeHash: process.env.XDEX_INIT_CODE_HASH || "", // For CREATE2 pair address calculation
    version: "v2" as const, // Assuming Uniswap V2 style - verify with actual implementation
  },
  // Add more DEXs as they launch on X1
] as const;

/**
 * Important contract addresses on X1
 */
export const CONTRACTS = {
  WETH: process.env.WETH_ADDRESS || "0x0000000000000000000000000000000000000000", // Wrapped XN
  USDC: process.env.USDC_ADDRESS || "0x0000000000000000000000000000000000000000",
  // Add more common tokens
} as const;

/**
 * Indexer Configuration
 */
export const INDEXER_CONFIG = {
  // Block to start indexing from (0 = genesis, or set to recent block)
  startBlock: Number(process.env.START_BLOCK || 0),
  // How many blocks to process in a single batch
  batchSize: Number(process.env.BATCH_SIZE || 100),
  // Polling interval in milliseconds
  pollingInterval: Number(process.env.POLLING_INTERVAL || 5000),
  // Maximum concurrent RPC requests
  maxConcurrentRequests: Number(process.env.MAX_CONCURRENT_REQUESTS || 10),
} as const;
