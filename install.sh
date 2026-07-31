#!/bin/bash

# Farmer Groceries - Installation Script
# This script helps you get started quickly

echo "🌾 Farmer Groceries - Installation Script"
echo "=========================================="
echo ""

# Check Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"
echo ""

# Check npm
echo "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm version: $NPM_VERSION"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "This may take a few minutes..."
echo ""
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
else
    echo ""
    echo "❌ Failed to install dependencies"
    echo "Try running: npm install --legacy-peer-deps"
    exit 1
fi

# Check Expo CLI
echo "Checking Expo CLI..."
if ! command -v expo &> /dev/null; then
    echo "⚠️  Expo CLI not found globally. Installing..."
    npm install -g expo-cli
    echo "✅ Expo CLI installed"
else
    EXPO_VERSION=$(expo --version)
    echo "✅ Expo CLI version: $EXPO_VERSION"
fi
echo ""

# Success message
echo "🎉 Installation Complete!"
echo ""
echo "📚 Next Steps:"
echo "1. Run: npm start"
echo "2. Scan QR code with Expo Go app"
echo "   (Runs in demo mode with sample data - no backend needed.)"
echo "   Optional: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env for a real backend."
echo ""
echo "📖 Read README.md for detailed instructions"
echo ""
echo "Happy coding! 🚀"

