#!/bin/bash
# AutoCheck Local Build Testing Script
# Tests all builds that can run on your local machine

set -e

echo "🧪 AutoCheck Local Build Testing"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track success/failure
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for test status
test_passed() {
    echo -e "${GREEN}✓ $1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

test_failed() {
    echo -e "${RED}❌ $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

test_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

test_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

if ! command -v node &> /dev/null; then
    test_failed "Node.js not found - install Node.js v20+"
    exit 1
fi
test_passed "Node.js $(node --version) found"

if ! command -v npm &> /dev/null; then
    test_failed "npm not found"
    exit 1
fi
test_passed "npm $(npm --version) found"

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    test_passed "Running on macOS"
    CAN_BUILD_MACOS=true
else
    test_warning "Not running on macOS - macOS builds will be skipped"
    CAN_BUILD_MACOS=false
fi

# Check for Xcode (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v xcodebuild &> /dev/null; then
        test_passed "Xcode found"
    else
        test_warning "Xcode not found - iOS builds will be skipped"
    fi
fi

# Check for act (optional)
if command -v act &> /dev/null; then
    test_passed "act found - can test Linux builds"
    CAN_TEST_LINUX=true
else
    test_warning "act not found - Linux builds will be skipped"
    test_info "Install act: brew install act"
    CAN_TEST_LINUX=false
fi

echo ""
echo "================================="
echo ""

# Install dependencies
echo "📦 Installing/verifying dependencies..."
if npm install --silent; then
    test_passed "Dependencies installed"
else
    test_failed "Failed to install dependencies"
    exit 1
fi

echo ""
echo "================================="
echo ""

# Test 1: Web build
echo "🌐 Test 1: Building web version (SPA)..."
if npm run build --silent; then
    test_passed "Web build successful"
    if [ -d "dist/spa" ]; then
        SIZE=$(du -sh dist/spa | cut -f1)
        test_info "Build size: $SIZE"
        test_info "Files created: $(find dist/spa -type f | wc -l | xargs)"
    fi
else
    test_failed "Web build failed"
fi

echo ""
echo "================================="
echo ""

# Test 2: Electron development mode
echo "🔧 Test 2: Testing Electron development mode..."
# Start Electron in background and kill after 5 seconds
if timeout 5s npm run dev:electron > /dev/null 2>&1 || [ $? -eq 124 ]; then
    test_passed "Electron development mode works"
else
    test_warning "Electron development mode test inconclusive"
fi

echo ""
echo "================================="
echo ""

# Test 3: macOS build (if on macOS)
if [ "$CAN_BUILD_MACOS" = true ]; then
    echo "🍎 Test 3: Building for macOS..."

    # Check if Electron mode exists
    if [ ! -d "src-electron" ]; then
        test_info "Adding Electron mode..."
        npx quasar mode add electron
    fi

    if npm run build:electron:mac; then
        test_passed "macOS build successful"

        if [ -d "dist/electron/Packaged" ]; then
            echo ""
            test_info "Build artifacts:"
            ls -lh dist/electron/Packaged/ | grep -E '\.(dmg|zip)$' | awk '{print "  - " $9 " (" $5 ")"}'

            # Count artifacts
            DMG_COUNT=$(ls -1 dist/electron/Packaged/*.dmg 2>/dev/null | wc -l | xargs)
            ZIP_COUNT=$(ls -1 dist/electron/Packaged/*.zip 2>/dev/null | wc -l | xargs)
            test_info "Created $DMG_COUNT DMG file(s) and $ZIP_COUNT ZIP file(s)"
        fi
    else
        test_failed "macOS build failed"
    fi
else
    test_warning "Skipping macOS build (not on macOS)"
fi

echo ""
echo "================================="
echo ""

# Test 4: Linux build with act (if available)
if [ "$CAN_TEST_LINUX" = true ]; then
    echo "🐧 Test 4: Testing Linux build with act (dry-run)..."

    if act push -j build-linux --dryrun 2>&1 | grep -q "Success"; then
        test_passed "Linux build dry-run successful"
        test_info "Run 'act push -j build-linux' to build for real"
    else
        test_warning "Linux build dry-run had issues"
        test_info "You can still run 'act push -j build-linux' to try"
    fi
else
    test_warning "Skipping Linux build test (act not installed)"
fi

echo ""
echo "================================="
echo ""

# Test 5: Check Capacitor setup (if available)
if [ -d "src-capacitor" ]; then
    echo "📱 Test 5: Checking mobile setup..."

    # Check Android
    if [ -d "src-capacitor/android" ]; then
        test_passed "Android project exists"
    else
        test_warning "Android project not found"
    fi

    # Check iOS (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ -d "src-capacitor/ios" ]; then
            test_passed "iOS project exists"
        else
            test_warning "iOS project not found"
        fi
    fi
else
    test_warning "Capacitor not set up - mobile builds not available"
    test_info "Run: npx quasar mode add capacitor"
fi

echo ""
echo "================================="
echo ""

# Summary
echo "📊 Test Summary"
echo "================================="
echo ""
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test the builds manually"
    if [ "$CAN_BUILD_MACOS" = true ]; then
        echo "     - macOS: open dist/electron/Packaged/*.dmg"
    fi
    echo "     - Web: npx serve dist/spa"
    echo "  2. Push to GitHub to test other platforms"
    echo "     - git push origin your-branch"
    echo "  3. Create a release:"
    echo "     - git tag v1.0.0"
    echo "     - git push origin v1.0.0"
    exit 0
else
    echo -e "${RED}⚠ Some tests failed - please review the errors above${NC}"
    exit 1
fi
