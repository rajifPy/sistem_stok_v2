#!/bin/bash

# Kantin POS - Quick Deploy Script
# Usage: ./deploy.sh [preview|production]

set -e

echo "🏪 Kantin POS - Deployment Script"
echo "================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Get deployment type
DEPLOY_TYPE=${1:-preview}

echo ""
echo "📋 Deployment Type: $DEPLOY_TYPE"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type check
echo "🔍 Running type check..."
npm run type-check

# Lint
echo "✨ Running linter..."
npm run lint

# Build locally to catch errors
echo "🔨 Building application..."
npm run build

echo ""
echo "✅ Local build successful!"
echo ""

# Deploy to Vercel
if [ "$DEPLOY_TYPE" = "production" ]; then
    echo "🚀 Deploying to PRODUCTION..."
    vercel --prod
else
    echo "🚀 Deploying to PREVIEW..."
    vercel
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Check deployment URL in output above"
echo "   2. Test all features"
echo "   3. Monitor logs: vercel logs --follow"
echo ""
