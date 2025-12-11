# AutoCheck Cross-Platform Quick Start

Get AutoCheck running on all platforms in 3 simple steps!

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Node.js v20+ installed
- npm or yarn
- Git

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/autocheck.git
cd autocheck

# Install dependencies
npm install

# Run setup script (adds Electron and Capacitor modes)
chmod +x scripts/setup-platforms.sh
./scripts/setup-platforms.sh
```

### Step 2: Test Web Version

```bash
# Start development server
npm run dev

# Open http://localhost:9000
```

That's it! AutoCheck is running in your browser. 🎉

## 🖥️ Desktop Development (Electron)

### Test Desktop App

```bash
# Start Electron app
npm run dev:electron
```

The desktop app will open automatically.

### Build Desktop App

```bash
# Build for your current platform
npm run build:electron

# Or build for specific platforms
npm run build:electron:mac     # macOS
npm run build:electron:win     # Windows
npm run build:electron:linux   # Linux

# Build for all platforms
npm run build:electron:all
```

**Output**: `dist/electron/Packaged/`

## 📱 Mobile Development (Capacitor)

### Additional Prerequisites

#### Android
- Android Studio installed
- Android SDK (API 33+)
- Java JDK 17+
- Set `ANDROID_HOME` environment variable

#### iOS (macOS only)
- Xcode 14+
- CocoaPods: `sudo gem install cocoapods`
- Active Apple Developer account

### Setup Mobile

```bash
# Add Capacitor mode (if not already added)
npx quasar mode add capacitor

# Sync web assets to mobile platforms
npm run capacitor:sync
```

### Test Mobile Apps

```bash
# Android (requires Android Studio)
npm run dev:android

# iOS (macOS only, requires Xcode)
npm run dev:ios

# Or open in IDEs
npm run capacitor:open:android  # Opens Android Studio
npm run capacitor:open:ios      # Opens Xcode
```

### Build Mobile Apps

```bash
# Build Android
npm run build:android
npm run build:android:apk  # Debug APK
npm run build:android:aab  # Release AAB

# Build iOS (macOS only)
npm run build:ios
npm run build:ios:device   # For physical devices
```

**Android Output**: `src-capacitor/android/app/build/outputs/`
**iOS Output**: `src-capacitor/ios/App/build/`

## 🔧 Platform-Specific Setup

### macOS Setup

```bash
# Install Xcode Command Line Tools (if not installed)
xcode-select --install

# Install CocoaPods for iOS builds
sudo gem install cocoapods

# You're ready for macOS and iOS builds!
npm run build:electron:mac
npm run build:ios
```

### Windows Setup

```bash
# Install Windows Build Tools (if needed)
npm install --global --production windows-build-tools

# You're ready for Windows builds!
npm run build:electron:win
```

### Linux Setup

```bash
# Install required libraries (Ubuntu/Debian)
sudo apt-get install -y libgtk-3-dev libnotify-dev libnss3 \
  libxss1 libasound2 libxtst-dev libsecret-1-dev

# Install required libraries (Fedora/RHEL)
sudo dnf install gtk3-devel libnotify-devel nss libXScrnSaver \
  alsa-lib libXtst libsecret-devel

# You're ready for Linux builds!
npm run build:electron:linux
```

### Android Setup

```bash
# 1. Download and install Android Studio
#    https://developer.android.com/studio

# 2. Install Android SDK via Android Studio
#    Tools > SDK Manager > Install latest SDK

# 3. Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
set ANDROID_HOME=C:\Users\YourUser\AppData\Local\Android\Sdk  # Windows

# 4. Add to PATH
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# 5. Install Java 17
# macOS: brew install openjdk@17
# Linux: sudo apt install openjdk-17-jdk
# Windows: Download from https://adoptium.net/

# 6. Verify setup
java -version        # Should show version 17
android --version    # Should show SDK version

# 7. You're ready for Android builds!
npm run dev:android
```

### iOS Setup (macOS only)

```bash
# 1. Install Xcode from App Store
#    https://apps.apple.com/app/xcode/id497799835

# 2. Install Xcode Command Line Tools
sudo xcode-select --install

# 3. Install CocoaPods
sudo gem install cocoapods

# 4. Accept Xcode license
sudo xcodebuild -license accept

# 5. Install iOS dependencies
cd src-capacitor/ios/App
pod install
cd ../../..

# 6. You're ready for iOS builds!
npm run dev:ios
```

## 📦 Build Outputs

### Desktop (Electron)

After building, find installers in `dist/electron/Packaged/`:

```
macOS:
  - AutoCheck-1.0.0-arm64.dmg      (Apple Silicon)
  - AutoCheck-1.0.0-x64.dmg        (Intel)
  - AutoCheck-1.0.0-arm64-mac.zip
  - AutoCheck-1.0.0-x64-mac.zip

Windows:
  - AutoCheck Setup 1.0.0.exe      (NSIS installer)
  - AutoCheck 1.0.0.exe            (Portable)

Linux:
  - AutoCheck-1.0.0-x86_64.AppImage  (Universal)
  - autocheck_1.0.0_amd64.deb        (Debian/Ubuntu)
  - autocheck-1.0.0.x86_64.rpm       (RedHat/Fedora)
```

### Mobile (Capacitor)

**Android**:
```
src-capacitor/android/app/build/outputs/apk/debug/
  - app-debug.apk                   (For testing)

src-capacitor/android/app/build/outputs/bundle/release/
  - app-release.aab                 (For Play Store)
```

**iOS**:
```
src-capacitor/ios/App/build/
  - AutoCheck.xcarchive             (Archive)
  - AutoCheck.ipa                   (For distribution)
```

## 🌐 Environment Configuration

Create `.env.production` for production builds:

```env
# API Configuration
VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# App Configuration
VITE_APP_ENV=production
VITE_APP_NAME=AutoCheck
VITE_APP_VERSION=1.0.0
```

## 🔐 Code Signing (Optional)

For distribution, you'll need to sign your apps:

### macOS/iOS (Apple)
- Apple Developer Account ($99/year)
- Distribution certificate
- App IDs and provisioning profiles

### Windows
- Code signing certificate ($50-500/year)
- Available from DigiCert, Sectigo, etc.

### Android
- Self-signed keystore (free)
- Or Play App Signing (recommended)

**See BUILD_SETUP.md for detailed signing instructions.**

## 🤖 GitHub Actions CI/CD

### Quick Setup

1. **Enable Actions** in your GitHub repository

2. **Add secrets** (Settings > Secrets and variables > Actions):
   - For releases: No secrets needed for unsigned builds
   - For signed builds: See CI_CD_GUIDE.md

3. **Push code** or create a tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Monitor builds** in Actions tab

5. **Download artifacts** or get from Releases

**See CI_CD_GUIDE.md for complete instructions.**

## 🆘 Troubleshooting

### Build Fails

```bash
# Clear everything and reinstall
npm run clean:all
npm install
./scripts/setup-platforms.sh

# Rebuild
npm run build:electron
```

### Electron Won't Start

```bash
# Rebuild Electron
npx electron-rebuild

# Try again
npm run dev:electron
```

### Android Build Fails

```bash
# Check Java version (must be 17)
java -version

# Check Android SDK
echo $ANDROID_HOME

# Clean Android build
cd src-capacitor/android
./gradlew clean
cd ../..

# Try again
npm run dev:android
```

### iOS Build Fails (macOS)

```bash
# Update CocoaPods
sudo gem install cocoapods

# Reinstall pods
cd src-capacitor/ios/App
pod deintegrate
pod install
cd ../../..

# Clean Xcode build
npm run build:ios
```

### Capacitor Sync Issues

```bash
# Force sync
npx cap sync --force

# Doctor check
npx cap doctor

# Update Capacitor
npm run capacitor:update
```

## 📚 Next Steps

1. **Read documentation**:
   - BUILD_SETUP.md - Detailed build instructions
   - CI_CD_GUIDE.md - GitHub Actions setup
   - README.md - Project overview

2. **Customize app**:
   - Update app icons in `src-electron/icons/`
   - Configure `quasar.config.js`
   - Set environment variables

3. **Test thoroughly**:
   - Test on all target platforms
   - Verify functionality
   - Check performance

4. **Distribute**:
   - Sign apps for security
   - Upload to stores (Play Store, App Store)
   - Host on website for direct download

## 💡 Pro Tips

1. **Develop in web first** - Faster iteration, easier debugging
2. **Test mobile often** - Mobile has different constraints
3. **Use platform features wisely** - Not everything works everywhere
4. **Keep builds small** - Optimize bundle size
5. **Monitor performance** - Profile on actual devices

## 🎯 Common Use Cases

### Just need a web app?
```bash
npm run dev          # Development
npm run build        # Production build
```

### Desktop app for all platforms?
```bash
npm run build:electron:all
```

### Android APK for testing?
```bash
npm run build:android:apk
```

### Everything for a release?
```bash
npm run build:all    # All platforms
```

Or let GitHub Actions do it:
```bash
git tag v1.0.0
git push origin v1.0.0
# Wait for builds to complete
# Download from Releases
```

## 📞 Get Help

- **Documentation**: Check BUILD_SETUP.md, CI_CD_GUIDE.md
- **Issues**: https://github.com/your-org/autocheck/issues
- **Discussions**: https://github.com/your-org/autocheck/discussions
- **Discord**: [Join our community](#)

---

**Happy Building! 🚀**

Built with Vue 3, Quasar, Electron, and Capacitor.
