# AutoCheck - Local Build Testing Guide

This guide explains how to test your builds locally without GitHub Actions, and provides workarounds for the `act` tool limitations.

## The `act` Limitation

The `act` tool you're using has a significant limitation:
- ✅ **Supports**: Linux runners (`ubuntu-latest`)
- ❌ **Does NOT support**: macOS runners (`macos-latest`)
- ❌ **Does NOT support**: Windows runners (`windows-latest`)

This is because `act` runs workflows in Docker containers, and Docker doesn't support macOS or Windows guests on macOS hosts.

## Solution: Test Builds Directly

Instead of using `act` for macOS/Windows builds, test the builds directly on your machine.

## 🍎 Testing macOS Builds Locally

### Prerequisites Check

```bash
# Check Node.js version (should be 20+)
node --version

# Check if you have Xcode Command Line Tools
xcode-select -p

# If not installed:
xcode-select --install
```

### Setup and Build

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Add platform dependencies
npm install --save-dev electron electron-builder @electron/rebuild

# 3. Add Electron mode
npx quasar mode add electron

# 4. Test development build
npm run dev:electron

# 5. Test production build for macOS
npm run build:electron:mac
```

### Expected Output

If successful, you'll find builds in:
```
dist/electron/Packaged/
├── AutoCheck-1.0.0-arm64.dmg
├── AutoCheck-1.0.0-x64.dmg
├── AutoCheck-1.0.0-arm64-mac.zip
└── AutoCheck-1.0.0-x64-mac.zip
```

### Verify the Build

```bash
# List the output files
ls -lh dist/electron/Packaged/

# Open the DMG to test
open dist/electron/Packaged/AutoCheck-1.0.0-arm64.dmg

# Or mount and test
hdiutil attach dist/electron/Packaged/AutoCheck-1.0.0-arm64.dmg
# Then open the app from /Volumes/AutoCheck/
```

## 🐧 Testing Linux Builds with `act`

Since you want to use `act`, you CAN test Linux builds locally:

### Install `act` (if not installed)

```bash
# macOS with Homebrew
brew install act

# Or with curl
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### Test Linux Build with `act`

```bash
# Test the Linux build job
act push -j build-linux

# Or test with specific platform
act push -j build-linux -P ubuntu-latest=catthehacker/ubuntu:act-latest

# Run with verbose output
act push -j build-linux -v
```

### Expected Output

`act` will:
1. Pull the Docker image
2. Set up Node.js
3. Install dependencies
4. Run the Linux build
5. Create artifacts (AppImage, DEB, RPM)

## 🪟 Testing Windows Builds

Since `act` doesn't support Windows either, you have two options:

### Option 1: Use GitHub Actions (Recommended)

Just push to GitHub and let the CI/CD build it:

```bash
git add .
git commit -m "Test Windows build"
git push origin develop
```

Then monitor in GitHub Actions.

### Option 2: Cross-Compile on macOS (Limited)

Electron Builder can create Windows executables on macOS, but with limitations:

```bash
# Install Wine (required for Windows builds on macOS)
brew install --cask wine-stable

# Build for Windows
npm run build:electron:win
```

**Note**: This creates unsigned Windows executables. Full Windows builds with signing work best on actual Windows machines.

## 📱 Testing Mobile Builds Locally

Mobile builds also can't use `act`. Test them directly:

### Android

```bash
# Prerequisites: Android Studio installed, ANDROID_HOME set

# Install dependencies
npm install

# Add Capacitor mode
npx quasar mode add capacitor

# Sync and build
npm run build:android
npm run capacitor:open:android

# Or build APK directly
cd src-capacitor/android
./gradlew assembleDebug
cd ../..
```

### iOS (macOS only)

```bash
# Prerequisites: Xcode installed, CocoaPods installed

# Install CocoaPods (if needed)
sudo gem install cocoapods

# Add Capacitor mode (if not done)
npx quasar mode add capacitor

# Build and open in Xcode
npm run build:ios
npm run capacitor:open:ios

# Or build from command line
cd src-capacitor/ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator
```

## 🔧 Complete Local Testing Script

Create this script to test all builds you can run locally:

```bash
#!/bin/bash
# test-local-builds.sh

set -e

echo "🧪 AutoCheck Local Build Testing"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Test macOS build
echo ""
echo "🍎 Building for macOS..."
if npm run build:electron:mac; then
    echo -e "${GREEN}✓ macOS build successful${NC}"
    ls -lh dist/electron/Packaged/*.dmg
else
    echo -e "${RED}❌ macOS build failed${NC}"
fi

# Test web build
echo ""
echo "🌐 Building web (SPA)..."
if npm run build; then
    echo -e "${GREEN}✓ Web build successful${NC}"
    ls -lh dist/spa/
else
    echo -e "${RED}❌ Web build failed${NC}"
fi

# Optional: Test Linux with Docker (if act is installed)
if command -v act &> /dev/null; then
    echo ""
    echo "🐧 Testing Linux build with act..."
    if act push -j build-linux --dryrun; then
        echo -e "${YELLOW}ℹ Linux build dry-run successful (use 'act push -j build-linux' to actually build)${NC}"
    else
        echo -e "${RED}❌ Linux build dry-run failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ act not installed, skipping Linux test${NC}"
fi

echo ""
echo "✅ Local testing complete!"
```

Save this as `scripts/test-local-builds.sh` and run:

```bash
chmod +x scripts/test-local-builds.sh
./scripts/test-local-builds.sh
```

## 🎯 Recommended Testing Strategy

Based on your 2017 Intel MacBook Pro:

### What to Test Locally

1. **macOS Intel (x64) builds** ✅
   ```bash
   npm run build:electron:mac
   # Will build both x64 and arm64, but test x64 on your machine
   ```

2. **Web/SPA builds** ✅
   ```bash
   npm run dev
   npm run build
   ```

3. **Development mode** ✅
   ```bash
   npm run dev:electron
   # Test quickly without full build
   ```

### What to Test on GitHub Actions

1. **macOS Apple Silicon (arm64) builds**
   - Let GitHub Actions build and test on actual M1/M2 runners

2. **Windows builds**
   - Let GitHub Actions build on actual Windows runners

3. **Linux builds**
   - Can test locally with `act` OR let GitHub Actions handle it

4. **Mobile builds**
   - Android can be built locally if you have Android Studio
   - iOS can be built locally with Xcode

## 🔍 Debugging Build Issues Locally

### Enable Verbose Output

```bash
# Quasar verbose mode
npm run build:electron:mac -- --debug

# Electron Builder verbose
DEBUG=electron-builder npm run build:electron:mac
```

### Check Build Logs

```bash
# Build logs are in:
cat dist/electron/builder-debug.yml
cat dist/electron/builder-effective-config.yaml
```

### Clean Build

```bash
# Clean everything and rebuild
npm run clean:all
rm -rf dist
npm install
npm run build:electron:mac
```

## 📊 Testing Matrix for Your Machine

Your 2017 Intel MacBook Pro (macOS Ventura 13.6.7) can test:

| Platform | Can Test Locally | Method | Notes |
|----------|------------------|--------|-------|
| **macOS Intel** | ✅ Yes | Direct build | Native build |
| **macOS Apple Silicon** | ⚠️ Limited | Cross-compile | Can build but can't run |
| **Windows** | ⚠️ Limited | Wine/Cross-compile | Unsigned only |
| **Linux** | ✅ Yes | `act` + Docker | Full support |
| **Android** | ✅ Yes | Android Studio | If installed |
| **iOS** | ✅ Yes | Xcode | If installed |
| **Web** | ✅ Yes | Direct build | Full support |

## 🚀 Quick Test Commands

```bash
# Quick development test (fastest)
npm run dev:electron

# Quick production test (macOS only)
npm run build:electron

# Full macOS build (both architectures)
npm run build:electron:mac

# Test in browser (instant feedback)
npm run dev

# Test Linux with act (if installed)
act push -j build-linux

# Build everything locally (macOS + Web)
npm run build && npm run build:electron:mac
```

## 💡 Best Practice for Local Development

1. **Develop in browser** (`npm run dev`) - Fastest iteration
2. **Test in Electron** occasionally (`npm run dev:electron`)
3. **Build locally** before pushing (`npm run build:electron:mac`)
4. **Use GitHub Actions** for final builds and other platforms
5. **Only test what you can run** - Don't waste time on builds you can't test

## 🎓 Understanding `act` Limitations

The `act` tool is excellent for Linux workflows but has fundamental limitations:

**Why `act` doesn't support macOS:**
- Docker doesn't support macOS guests on any host
- macOS licenses prohibit virtualization on non-Apple hardware
- macOS builds require actual macOS hardware or cloud runners

**Alternatives to `act` for macOS/Windows:**
1. Use GitHub Actions (free for public repos, 2000 min/month for private)
2. Use local builds (what you should do for macOS on your Mac)
3. Use cloud CI/CD (CircleCI, Travis CI, etc. - but GitHub Actions is better)

## 📝 Summary

For your Intel MacBook Pro:

✅ **Do locally:**
- macOS builds (`npm run build:electron:mac`)
- Web builds (`npm run build`)
- Development testing (`npm run dev:electron`)

❌ **Don't use `act` for:**
- macOS builds (not supported)
- Windows builds (not supported)

✅ **Can use `act` for:**
- Linux builds (`act push -j build-linux`)

🚀 **Use GitHub Actions for:**
- Final macOS builds (including Apple Silicon)
- Windows builds
- Mobile builds
- Automated releases

---

**Your Next Steps:**

```bash
# 1. Test local macOS build
npm run build:electron:mac

# 2. If successful, commit and push
git add .
git commit -m "test: verify macOS build"
git push

# 3. Let GitHub Actions handle other platforms
# Monitor at: https://github.com/your-username/autocheck/actions
```

That's it! You don't need `act` for macOS builds - just build directly on your Mac. 🎉
