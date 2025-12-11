# AutoCheck - Cross-Platform Build Setup

This document provides complete setup instructions for building AutoCheck for all platforms: Windows, macOS, Linux, Android, and iOS.

## Prerequisites

### All Platforms
- Node.js v22.16.0 or higher
- npm 11.4.2 or higher
- Git

### Desktop (Electron)
- **macOS**: Xcode Command Line Tools
- **Windows**: Windows SDK, Visual Studio Build Tools
- **Linux**: Standard build tools (gcc, make, etc.)

### Mobile (Capacitor)
- **Android**:
  - Android Studio
  - Android SDK (API 33+)
  - Java JDK 17+
- **iOS**:
  - macOS only
  - Xcode 14+
  - CocoaPods (`sudo gem install cocoapods`)

## Installation Steps

### 1. Install Dependencies

```bash
# Install all npm dependencies
npm install

# Add Quasar Electron mode
npx quasar mode add electron

# Add Quasar Capacitor mode (for mobile)
npx quasar mode add capacitor
```

### 2. Add Platform-Specific Dependencies

```bash
# Electron builder dependencies
npm install --save-dev electron electron-builder @electron/rebuild

# Capacitor dependencies
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# iOS-specific (macOS only)
cd src-capacitor/ios && pod install && cd ../..

# Additional utilities
npm install --save-dev cross-env rimraf
```

## Build Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "quasar dev",
    "dev:electron": "quasar dev -m electron",
    "dev:android": "quasar dev -m capacitor -T android",
    "dev:ios": "quasar dev -m capacitor -T ios",

    "build": "quasar build",
    "build:electron": "quasar build -m electron",
    "build:electron:mac": "quasar build -m electron -T darwin",
    "build:electron:win": "quasar build -m electron -T win32",
    "build:electron:linux": "quasar build -m electron -T linux",
    "build:electron:all": "npm run build:electron:mac && npm run build:electron:win && npm run build:electron:linux",

    "build:android": "quasar build -m capacitor -T android",
    "build:ios": "quasar build -m capacitor -T ios",
    "build:mobile": "npm run build:android && npm run build:ios",

    "build:all": "npm run build:electron:all && npm run build:mobile",

    "capacitor:sync": "npx cap sync",
    "capacitor:open:android": "npx cap open android",
    "capacitor:open:ios": "npx cap open ios"
  }
}
```

## Building for Each Platform

### Desktop Builds

#### macOS (DMG & ZIP)
```bash
# On macOS machine
npm run build:electron:mac

# Output: dist/electron/Packaged/AutoCheck-1.0.0-{arch}.dmg
#         dist/electron/Packaged/AutoCheck-1.0.0-{arch}-mac.zip
```

#### Windows (NSIS & Portable)
```bash
# On Windows machine or macOS/Linux with Wine
npm run build:electron:win

# Output: dist/electron/Packaged/AutoCheck Setup 1.0.0.exe
#         dist/electron/Packaged/AutoCheck 1.0.0.exe (portable)
```

#### Linux (AppImage, DEB, RPM)
```bash
# On Linux machine
npm run build:electron:linux

# Output: dist/electron/Packaged/AutoCheck-1.0.0-{arch}.AppImage
#         dist/electron/Packaged/autocheck_1.0.0_{arch}.deb
#         dist/electron/Packaged/autocheck-1.0.0.{arch}.rpm
```

### Mobile Builds

#### Android (APK & AAB)
```bash
# Build web assets
npm run build:android

# Open Android Studio to build APK/AAB
npm run capacitor:open:android

# Or build from command line:
cd src-capacitor/android
./gradlew assembleDebug  # Debug APK
./gradlew bundleRelease  # Release AAB
```

#### iOS (IPA)
```bash
# Build web assets (macOS only)
npm run build:ios

# Open Xcode to build IPA
npm run capacitor:open:ios

# Or build from command line:
cd src-capacitor/ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release archive
```

## GitHub Actions CI/CD

### Setup Secrets

Add these secrets in your GitHub repository settings (Settings > Secrets and variables > Actions):

#### For macOS Code Signing
- `APPLE_CERTIFICATE_BASE64`: Base64 encoded .p12 certificate
- `APPLE_CERTIFICATE_PASSWORD`: Certificate password
- `APPLE_ID`: Apple ID email
- `APPLE_ID_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Team ID

#### For Windows Code Signing
- `WINDOWS_CERTIFICATE_BASE64`: Base64 encoded .pfx certificate
- `WINDOWS_CERTIFICATE_PASSWORD`: Certificate password

#### For Android
- `ANDROID_KEYSTORE_BASE64`: Base64 encoded keystore file
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password
- `ANDROID_KEY_ALIAS`: Key alias
- `ANDROID_KEY_PASSWORD`: Key password

#### For iOS
- `IOS_CERTIFICATE_BASE64`: Base64 encoded distribution certificate
- `IOS_CERTIFICATE_PASSWORD`: Certificate password
- `IOS_PROVISIONING_PROFILE_BASE64`: Base64 encoded provisioning profile

#### General
- `GH_TOKEN`: GitHub personal access token (for releases)

### Workflow Files

Create `.github/workflows/` directory with the following workflow files:

## Platform-Specific Notes

### macOS
- Requires macOS 10.15+ for building
- Builds both Intel (x64) and Apple Silicon (arm64) versions
- DMG is the preferred distribution format
- Code signing recommended for distribution

### Windows
- Can be built on Windows, macOS (with Wine), or Linux (with Wine)
- NSIS installer for standard installation
- Portable version requires no installation
- Code signing recommended for avoiding SmartScreen warnings

### Linux
- AppImage works on all major distributions (most portable)
- DEB for Debian/Ubuntu-based systems
- RPM for RedHat/Fedora-based systems
- No code signing required

### Android
- Minimum SDK: API 22 (Android 5.1)
- Target SDK: API 33 (Android 13)
- APK for direct installation
- AAB required for Google Play Store
- Requires signing for release builds

### iOS
- Minimum iOS version: 13.0
- Requires macOS for building
- Requires Apple Developer account ($99/year)
- App Store distribution requires TestFlight review

## Environment Variables

Create `.env.production` for production builds:

```env
# API Configuration
VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_APP_ENV=production

# App Configuration
VITE_APP_NAME=AutoCheck
VITE_APP_VERSION=1.0.0
```

## Icon Assets

Place app icons in the following locations:

### Electron
- `src-electron/icons/icon.icns` - macOS (512x512)
- `src-electron/icons/icon.ico` - Windows (256x256)
- `src-electron/icons/icon.png` - Linux (512x512)

### Capacitor
- `src-capacitor/android/app/src/main/res/` - Android icons (various sizes)
- `src-capacitor/ios/App/Assets.xcassets/AppIcon.appiconset/` - iOS icons (various sizes)

Use icon generation tools:
```bash
# Install icon generator
npm install -g cordova-res

# Generate icons from a single source (1024x1024)
cordova-res android --skip-config --copy
cordova-res ios --skip-config --copy
```

## Testing Builds Locally

### Desktop
```bash
# Test Electron app
npm run dev:electron

# Test production build
npm run build:electron:mac  # or :win or :linux
open dist/electron/Packaged/*.dmg  # or .exe or .AppImage
```

### Mobile
```bash
# Test Android
npm run dev:android  # Runs in emulator/device

# Test iOS (macOS only)
npm run dev:ios  # Runs in simulator/device
```

## Troubleshooting

### Electron Build Fails
- Ensure electron-builder is installed: `npm install --save-dev electron-builder`
- Clear cache: `rm -rf node_modules dist && npm install`
- Check Node version: `node --version` (should be 20+)

### Android Build Fails
- Check Java version: `java -version` (should be JDK 17+)
- Check Android SDK path: `echo $ANDROID_HOME`
- Update Gradle: `cd src-capacitor/android && ./gradlew wrapper --gradle-version=8.0`

### iOS Build Fails (macOS only)
- Install CocoaPods: `sudo gem install cocoapods`
- Update pods: `cd src-capacitor/ios && pod install`
- Check Xcode: `xcode-select -p`
- Clean build: `cd src-capacitor/ios/App && xcodebuild clean`

### Code Signing Issues
- Ensure certificates are valid and not expired
- Check keychain access (macOS)
- Verify certificate paths and passwords
- Use `security find-identity -v` to list available signing identities (macOS)

## Distribution

### macOS
- **DMG**: Direct download from website
- **Mac App Store**: Requires Apple review process
- **Homebrew**: Create formula for package manager distribution

### Windows
- **Direct Download**: Host .exe installers on website
- **Microsoft Store**: Requires Microsoft Partner Center account
- **Chocolatey**: Create package for package manager distribution

### Linux
- **Direct Download**: Host AppImage/DEB/RPM on website
- **Snap Store**: Create snap package
- **Flatpak**: Create flatpak package
- **App Repositories**: Submit to distribution repositories

### Android
- **Google Play Store**: Submit AAB through Play Console
- **Direct Download**: Host APK on website (enable "Unknown Sources")
- **Alternative Stores**: F-Droid, Amazon Appstore, Samsung Galaxy Store

### iOS
- **App Store**: Submit through App Store Connect (requires review)
- **TestFlight**: Beta testing platform
- **Enterprise Distribution**: Requires Apple Enterprise account

## Resources

- [Quasar Electron Mode](https://quasar.dev/quasar-cli-vite/developing-electron-apps/introduction)
- [Quasar Capacitor Mode](https://quasar.dev/quasar-cli-vite/developing-capacitor-apps/introduction)
- [Electron Builder](https://www.electron.build/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/)

## Support

For build issues, please check:
1. This documentation
2. GitHub Issues
3. Quasar Discord/Forum
4. Stack Overflow

---

**Last Updated**: December 2025
**Version**: 1.0.0
