#!/bin/bash

# X1/XDEX Trading Bot Setup Script
# This script will set up the database and test the DexScreener API

set -e  # Exit on error

echo "============================================================"
echo "X1/XDEX Trading Bot Setup"
echo "============================================================"
echo ""

# Check if .dev.vars exists
if [ ! -f .dev.vars ]; then
    echo "❌ Error: .dev.vars file not found"
    echo "Please copy .dev.vars.example to .dev.vars and add your DATABASE_URL"
    exit 1
fi

# Check if DATABASE_URL is set
source .dev.vars
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .dev.vars"
    exit 1
fi

if [[ "$DATABASE_URL" == *"user:password@host"* ]]; then
    echo "❌ Error: DATABASE_URL still has placeholder values"
    echo "Please update .dev.vars with your actual Neon database connection string"
    exit 1
fi

echo "✅ Configuration file found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
bun install
echo "✅ Dependencies installed"
echo ""

# Setup database schema
echo "🗄️  Setting up database schema..."
bunx drizzle-kit push
echo "✅ Database schema created"
echo ""

# Test DexScreener API
echo "🔍 Testing DexScreener API..."
bunx tsx scripts/test-dexscreener.ts
echo ""

echo "============================================================"
echo "Setup Complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "  1. If DexScreener test found X1/XDEX pairs:"
echo "     Run: bun run sync"
echo "     This will start syncing data to your database"
echo ""
echo "  2. If DexScreener returned 0 pairs:"
echo "     X1 might be too new for DexScreener"
echo "     We'll need to integrate directly with Solana RPC"
echo ""
echo "  3. Check your Neon database dashboard to see the data"
echo "     https://console.neon.tech/"
echo ""
