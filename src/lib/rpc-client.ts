import { createPublicClient, http, type PublicClient, type Block } from "viem";
import { X1_CONFIG } from "../config/x1";
import { logger } from "../utils/logger";

/**
 * X1 RPC Client
 * Provides methods to interact with the X1 blockchain
 */
export class X1RpcClient {
  private client: PublicClient;

  constructor(rpcUrl?: string) {
    const url = rpcUrl || X1_CONFIG.rpcUrl;

    this.client = createPublicClient({
      transport: http(url, {
        batch: true,
        retryCount: 3,
        retryDelay: 1000,
      }),
    });

    logger.info(`[RPC] Initialized X1 RPC client: ${url}`);
  }

  /**
   * Get the latest block number
   */
  async getBlockNumber(): Promise<bigint> {
    return await this.client.getBlockNumber();
  }

  /**
   * Get block by number
   */
  async getBlock(blockNumber: bigint): Promise<Block> {
    return await this.client.getBlock({ blockNumber });
  }

  /**
   * Get logs for a specific block range
   */
  async getLogs(params: {
    address?: `0x${string}` | `0x${string}`[];
    fromBlock: bigint;
    toBlock: bigint;
    topics?: (`0x${string}` | `0x${string}`[] | null)[];
  }) {
    return await this.client.getLogs({
      address: params.address,
      fromBlock: params.fromBlock,
      toBlock: params.toBlock,
      topics: params.topics,
    });
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: `0x${string}`) {
    return await this.client.getTransactionReceipt({ hash });
  }

  /**
   * Read from a contract
   */
  async readContract<T>(params: {
    address: `0x${string}`;
    abi: any[];
    functionName: string;
    args?: any[];
  }): Promise<T> {
    return (await this.client.readContract({
      address: params.address,
      abi: params.abi,
      functionName: params.functionName,
      args: params.args,
    })) as T;
  }

  /**
   * Get the underlying viem client for advanced operations
   */
  getClient(): PublicClient {
    return this.client;
  }

  /**
   * Subscribe to new blocks (polling-based since HTTP doesn't support subscriptions)
   */
  async watchBlocks(
    callback: (block: Block) => void,
    options: { pollingInterval?: number } = {},
  ): Promise<() => void> {
    const pollingInterval = options.pollingInterval || 5000;
    let lastBlockNumber = await this.getBlockNumber();
    let isRunning = true;

    const poll = async () => {
      while (isRunning) {
        try {
          const currentBlockNumber = await this.getBlockNumber();

          if (currentBlockNumber > lastBlockNumber) {
            for (let i = lastBlockNumber + 1n; i <= currentBlockNumber; i++) {
              const block = await this.getBlock(i);
              callback(block);
            }
            lastBlockNumber = currentBlockNumber;
          }
        } catch (error) {
          logger.error("[RPC] Error polling for new blocks:", error);
        }

        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      }
    };

    poll();

    // Return unsubscribe function
    return () => {
      isRunning = false;
    };
  }
}

// Singleton instance
let rpcClient: X1RpcClient | null = null;

export function getRpcClient(): X1RpcClient {
  if (!rpcClient) {
    rpcClient = new X1RpcClient();
  }
  return rpcClient;
}
