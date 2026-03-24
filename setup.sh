#!/bin/bash
# CoreClaw セットアップ & ビルドスクリプト
# 実行: bash setup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  CoreClaw Setup & Build"
echo "============================================"
echo ""

# --- 1. npm install ---
echo "📦 Installing npm dependencies..."
npm install
echo ""

# --- 2. .env の生成 ---
echo "⚙️  Generating .env..."
cp .env.example .env

# GitHub token を gh CLI から取得して上書き
if command -v gh &>/dev/null; then
  GH_TOKEN="$(gh auth token 2>/dev/null || true)"
  if [ -n "$GH_TOKEN" ]; then
    echo "GITHUB_TOKEN=${GH_TOKEN}" > .env
    # .env.example の残りの設定を追記
    grep -v '^GITHUB_TOKEN=' .env.example >> .env
    echo "   GitHub token: set via gh CLI"
  else
    echo "   ⚠️  gh auth token が取得できませんでした。.env の GITHUB_TOKEN を手動で設定してください。"
  fi
else
  echo "   ⚠️  gh CLI が見つかりません。.env の GITHUB_TOKEN を手動で設定してください。"
fi
echo ""

# --- 3. TypeScript ビルド ---
echo "🔨 Building TypeScript (npm run build)..."
npm run build
echo ""

# --- 4. Docker コンテナイメージのビルド ---
echo "🐳 Building Docker container image..."
./container/build.sh
echo ""

echo "============================================"
echo "  ✅ セットアップ完了!"
echo "============================================"
echo ""
echo "起動方法:"
echo "  node dist/index.js"
echo ""
