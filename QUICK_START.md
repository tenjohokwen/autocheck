# AutoCheck - Quick Start Guide

Your build scripts are now set up! Here's what you can do:

## ✅ What's Ready

- ✅ All build scripts added to package.json
- ✅ Electron and Capacitor dependencies installed
- ✅ Electron mode configured (src-electron/ folder exists)
- ✅ Cross-env and rimraf utilities installed

## 🚀 Quick Commands

### Development (Test Locally)

```bash
# Web browser (fastest for development)
npm run dev

# Desktop app (Electron)
npm run dev:electron

# Android (requires Android Studio)
npm run dev:android

# iOS (requires Xcode on macOS)
npm run dev:ios
```

### Production Builds

```bash
# Desktop - Current platform
npm run build:electron

# Desktop - Specific platform
npm run build:electron:mac      # macOS (your machine)
npm run build:electron:win      # Windows
npm run build:electron:linux    # Linux

# Desktop - All platforms
npm run build:electron:all

# Mobile
npm run build:android
npm run build:ios

# Everything
npm run build:all
```

### Capacitor (Mobile) Management

```bash
# Sync web assets to mobile
npm run capacitor:sync

# Open in IDEs
npm run capacitor:open:android  # Android Studio
npm run capacitor:open:ios      # Xcode

# Update Capacitor
npm run capacitor:update
```

### Maintenance

```bash
# Clean build cache
npm run clean

# Clean everything (including node_modules)
npm run clean:all

# Lint code
npm run lint

# Format code
npm run format
```

## 📦 What You Get

### macOS Builds (Your Machine)
After running `npm run build:electron:mac`:
```
dist/electron/Packaged/
├── AutoCheck-1.0.0-arm64.dmg          (Apple Silicon)
├── AutoCheck-1.0.0-x64.dmg            (Intel - Your Mac)
├── AutoCheck-1.0.0-arm64-mac.zip
└── AutoCheck-1.0.0-x64-mac.zip
```

### Windows Builds
After running `npm run build:electron:win`:
```
dist/electron/Packaged/
├── AutoCheck Setup 1.0.0.exe          (Installer)
└── AutoCheck 1.0.0.exe                (Portable)
```

### Linux Builds
After running `npm run build:electron:linux`:
```
dist/electron/Packaged/
├── AutoCheck-1.0.0-x86_64.AppImage    (Universal)
├── autocheck_1.0.0_amd64.deb          (Debian/Ubuntu)
└── autocheck-1.0.0.x86_64.rpm         (RedHat/Fedora)
```

## 🎯 Recommended Workflow

### For Your Intel MacBook Pro (2017)

1. **Develop in browser** (fastest):
   ```bash
   npm run dev
   ```

2. **Test desktop occasionally**:
   ```bash
   npm run dev:electron
   ```

3. **Build macOS before pushing**:
   ```bash
   npm run build:electron:mac
   ```

4. **Let GitHub Actions build other platforms**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

## 🔧 First Time Setup

If you haven't run the setup script yet:

```bash
# Make script executable
chmod +x scripts/setup-platforms.sh

# Run setup (checks requirements, adds modes)
./scripts/setup-platforms.sh
```

## 🧪 Test Everything

Run the automated test script:

```bash
chmod +x scripts/test-local-builds.sh
./scripts/test-local-builds.sh
```

This will:
- ✅ Check prerequisites
- ✅ Build web version
- ✅ Test Electron development
- ✅ Build macOS app
- ✅ Show detailed results

## 📱 Mobile Setup (Optional)

### Android

1. Install Android Studio
2. Set ANDROID_HOME:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```
3. Add Capacitor mode:
   ```bash
   npx quasar mode add capacitor
   ```
4. Test:
   ```bash
   npm run dev:android
   ```

### iOS (macOS only)

1. Install Xcode from App Store
2. Install CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```
3. Add Capacitor mode:
   ```bash
   npx quasar mode add capacitor
   ```
4. Test:
   ```bash
   npm run dev:ios
   ```

## 🚀 Create a Release

When ready to release:

```bash
# 1. Update version in package.json
# Edit package.json: "version": "1.0.0"

# 2. Commit changes
git add .
git commit -m "chore: release v1.0.0"

# 3. Create and push tag
git tag v1.0.0
git push origin main
git push origin v1.0.0

# 4. GitHub Actions will:
#    - Build for all platforms
#    - Create GitHub Release
#    - Upload all installers
```

## 🐛 Troubleshooting

### "npm run dev:electron" fails
```bash
# Reinstall dependencies
npm install

# Clear cache
npm run clean
npm run dev:electron
```

### Electron build fails
```bash
# Clean and rebuild
npm run clean:all
npm install
npm run build:electron:mac
```

### "Missing mode" error
```bash
# Add Electron mode
npx quasar mode add electron

# Add Capacitor mode
npx quasar mode add capacitor
```

## 📚 Full Documentation

- **Complete build guide**: [BUILD_SETUP.md](BUILD_SETUP.md)
- **GitHub Actions CI/CD**: [CI_CD_GUIDE.md](CI_CD_GUIDE.md)
- **Local testing**: [LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md)
- **Package updates**: [PACKAGE_JSON_UPDATES.md](PACKAGE_JSON_UPDATES.md)
- **Platform summary**: [PLATFORM_SETUP_SUMMARY.md](PLATFORM_SETUP_SUMMARY.md)

## ✅ Next Steps

```bash
# 1. Test development mode
npm run dev:electron

# 2. Build for macOS
npm run build:electron:mac

# 3. Test the build
open dist/electron/Packaged/AutoCheck-1.0.0-x64.dmg

# 4. Push to GitHub
git push
```

## 💡 Pro Tips

1. Use `npm run dev` for fast iteration (web browser)
2. Use `npm run dev:electron` to test desktop features
3. Build locally only for your platform (macOS)
4. Let GitHub Actions handle other platforms
5. Tag releases to trigger automated builds

---

**You're all set!** 🎉

Try: `npm run dev:electron`
