#!/bin/bash
# AutoCheck Platform Setup Script
# This script sets up all necessary dependencies and configurations for cross-platform builds

set -e

echo "🚀 AutoCheck Platform Setup"
echo "==========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v20+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version) found${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm --version) found${NC}"
echo ""

# Install base dependencies
echo "📦 Installing base dependencies..."
npm install

# Install Electron dependencies
echo ""
echo "🖥️  Setting up Electron for desktop builds..."
npm install --save-dev electron@latest electron-builder@latest

# Install Capacitor dependencies
echo ""
echo "📱 Setting up Capacitor for mobile builds..."
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# Install additional build tools
echo ""
echo "🔧 Installing build tools..."
npm install --save-dev cross-env rimraf

# Add Quasar modes
echo ""
echo "⚙️  Adding Quasar build modes..."

# Add Electron mode
if [ ! -d "src-electron" ]; then
    echo "Adding Electron mode..."
    npx quasar mode add electron
    echo -e "${GREEN}✓ Electron mode added${NC}"
else
    echo -e "${YELLOW}⚠ Electron mode already exists${NC}"
fi

# Add Capacitor mode
if [ ! -d "src-capacitor" ]; then
    echo "Adding Capacitor mode..."
    npx quasar mode add capacitor
    echo -e "${GREEN}✓ Capacitor mode added${NC}"
else
    echo -e "${YELLOW}⚠ Capacitor mode already exists${NC}"
fi

# Create icons directory
echo ""
echo "🎨 Setting up icons directory..."
mkdir -p src-electron/icons
mkdir -p public/icons

# Platform-specific setup
echo ""
echo "🔍 Checking platform-specific requirements..."

# Check for macOS-specific tools
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GREEN}✓ macOS detected${NC}"

    # Check for Xcode
    if command -v xcodebuild &> /dev/null; then
        echo -e "${GREEN}✓ Xcode found${NC}"
    else
        echo -e "${YELLOW}⚠ Xcode not found. Install Xcode for iOS builds.${NC}"
    fi

    # Check for CocoaPods
    if command -v pod &> /dev/null; then
        echo -e "${GREEN}✓ CocoaPods found${NC}"
    else
        echo -e "${YELLOW}⚠ CocoaPods not found. Run: sudo gem install cocoapods${NC}"
    fi
fi

# Check for Android-specific tools
if [ ! -z "$ANDROID_HOME" ]; then
    echo -e "${GREEN}✓ Android SDK found at $ANDROID_HOME${NC}"
else
    echo -e "${YELLOW}⚠ ANDROID_HOME not set. Install Android Studio for Android builds.${NC}"
fi

# Check for Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
    echo -e "${GREEN}✓ Java $JAVA_VERSION found${NC}"
else
    echo -e "${YELLOW}⚠ Java not found. Install JDK 17+ for Android builds.${NC}"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review BUILD_SETUP.md for platform-specific requirements"
echo "2. Add app icons to src-electron/icons/"
echo "3. Configure environment variables in .env.production"
echo "4. Run 'npm run dev:electron' to test desktop build"
echo "5. Run 'npm run dev:android' or 'npm run dev:ios' to test mobile builds"
echo ""
echo "For production builds:"
echo "  Desktop: npm run build:electron:all"
echo "  Mobile:  npm run build:mobile"
echo "  All:     npm run build:all"
echo ""
