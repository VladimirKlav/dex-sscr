/**
 * Cloudflare Worker for X1 Trading Bot API & Chart Generation
 */

import * as pairsApi from "./api/pairs";
import * as statsApi from "./api/stats";
import * as tokensApi from "./api/tokens";
import { generateChart } from "./chart-generator";
import { CHART_DEFAULTS } from "./constants";
import { getIndexer } from "./indexer/blockchain-indexer";
import type { ChartGenerationConfig } from "./types";
import { logger } from "./utils/logger";

// For R2 upload functionality, import:
// import { generateChartWithR2 } from "./chart-generator";
// import { getR2Bucket } from "./lib/r2";
// import type { ChartGenerationWithR2Config } from "./types";

interface ChartRequest {
  tokenAddress: string;
  entryPrice: number;
  isBullish: boolean;
  periodHours?: number;
  width?: number;
  height?: number;
  dpr?: number;
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);

      // Add CORS headers
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      // Health check endpoint
      if (url.pathname === "/health") {
        return jsonResponse({ status: "ok" }, corsHeaders);
      }

      // Chart generation endpoint
      if (url.pathname === "/generate-chart" && request.method === "POST") {
        return await handleGenerateChart(request, corsHeaders);
      }

      // ===== API ENDPOINTS =====

      // Get all pairs
      if (url.pathname === "/api/pairs" && request.method === "GET") {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const sortBy = url.searchParams.get("sortBy") as "liquidity" | "volume" | "age" | "holders" | undefined;
        const dex = url.searchParams.get("dex") || undefined;

        const result = await pairsApi.getPairs({ limit, offset, sortBy, dex });
        return jsonResponse(result, corsHeaders);
      }

      // Get new pairs
      if (url.pathname === "/api/pairs/new" && request.method === "GET") {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const result = await pairsApi.getNewPairs(limit);
        return jsonResponse(result, corsHeaders);
      }

      // Get pair by address (must be after /api/pairs/new)
      if (url.pathname.startsWith("/api/pairs/") && request.method === "GET") {
        const address = url.pathname.split("/api/pairs/")[1];
        if (address && address !== "new") {
          const result = await pairsApi.getPairByAddress(address);

          if (!result) {
            return jsonResponse({ error: "Pair not found" }, corsHeaders, 404);
          }

          return jsonResponse(result, corsHeaders);
        }
      }

      // Get all tokens
      if (url.pathname === "/api/tokens" && request.method === "GET") {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        const result = await tokensApi.getTokens({ limit, offset });
        return jsonResponse(result, corsHeaders);
      }

      // Search tokens
      if (url.pathname === "/api/tokens/search" && request.method === "GET") {
        const query = url.searchParams.get("q");
        if (!query) {
          return jsonResponse({ error: "Query parameter 'q' is required" }, corsHeaders, 400);
        }

        const result = await tokensApi.searchTokens(query);
        return jsonResponse(result, corsHeaders);
      }

      // Get token by address
      if (url.pathname.startsWith("/api/tokens/") && request.method === "GET" && !url.pathname.includes("search")) {
        const address = url.pathname.split("/api/tokens/")[1];
        if (address) {
          const result = await tokensApi.getTokenByAddress(address);

          if (!result) {
            return jsonResponse({ error: "Token not found" }, corsHeaders, 404);
          }

          return jsonResponse(result, corsHeaders);
        }
      }

      // Get overall stats
      if (url.pathname === "/api/stats" && request.method === "GET") {
        const result = await statsApi.getOverallStats();
        return jsonResponse(result, corsHeaders);
      }

      // Get top gainers
      if (url.pathname === "/api/stats/gainers" && request.method === "GET") {
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const periodHours = parseInt(url.searchParams.get("hours") || "24");

        const result = await statsApi.getTopGainers(limit, periodHours);
        return jsonResponse(result, corsHeaders);
      }

      // Get recently listed
      if (url.pathname === "/api/stats/recent" && request.method === "GET") {
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const result = await statsApi.getRecentlyListed(limit);
        return jsonResponse(result, corsHeaders);
      }

      // Get indexer status
      if (url.pathname === "/api/indexer/status" && request.method === "GET") {
        const indexer = getIndexer();
        const status = await indexer.getStatus();
        return jsonResponse(status, corsHeaders);
      }

      // Not found
      return jsonResponse({ error: "Not Found" }, corsHeaders, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Worker error: ${message}`);
      return jsonResponse({ error: message }, {}, 500);
    }
  },
};

/**
 * Helper function to create JSON responses with CORS headers
 */
function jsonResponse(data: any, headers: Record<string, string> = {}, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Handle chart generation request
 */
async function handleGenerateChart(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const body = (await request.json()) as ChartRequest;
    const { tokenAddress, entryPrice, isBullish, periodHours, width, height, dpr } = body;

    // Validate required parameters
    if (!tokenAddress || typeof tokenAddress !== "string") {
      return jsonResponse({ error: "tokenAddress is required" }, corsHeaders, 400);
    }

    if (typeof entryPrice !== "number") {
      return jsonResponse({ error: "entryPrice is required and must be a number" }, corsHeaders, 400);
    }

    if (typeof isBullish !== "boolean") {
      return jsonResponse({ error: "isBullish is required and must be a boolean" }, corsHeaders, 400);
    }

    // Create configuration with defaults
    const config: ChartGenerationConfig = {
      tokenAddress,
      entryPrice,
      isBullish,
      periodHours: periodHours || CHART_DEFAULTS.PERIOD_HOURS,
      width: width || CHART_DEFAULTS.WIDTH,
      height: height || CHART_DEFAULTS.HEIGHT,
      dpr: dpr || CHART_DEFAULTS.DPR,
      outputPath: `./data/chart-${Date.now()}.png`,
    };

    // Generate chart
    await generateChart(config);

    return jsonResponse(
      {
        success: true,
        outputPath: config.outputPath,
        config,
      },
      corsHeaders,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Chart generation failed: ${message}`);
    return jsonResponse({ error: message }, corsHeaders, 500);
  }
}
