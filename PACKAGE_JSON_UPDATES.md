# Package.json Updates for Cross-Platform Builds

Add these sections to your `package.json` file for complete cross-platform build support.

## Required Dependencies

Add to `dependencies`:
```json
{
  "@capacitor/android": "^6.0.0",
  "@capacitor/cli": "^6.0.0",
  "@capacitor/core": "^6.0.0",
  "@capacitor/ios": "^6.0.0"
}
```

Add to `devDependencies`:
```json
{
  "electron": "^28.0.0",
  "electron-builder": "^24.9.1",
  "@electron/rebuild": "^3.5.0",
  "cross-env": "^7.0.3",
  "rimraf": "^5.0.5"
}
```

## Build Scripts

Add/merge these scripts into your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint -c ./eslint.config.js \"./src*/**/*.{js,cjs,mjs,vue}\"",
    "format": "prettier --write \"**/*.{js,vue,scss,html,md,json}\" --ignore-path .gitignore",
    "test": "echo \"No test specified\" && exit 0",

    "dev": "quasar dev",
    "dev:electron": "quasar dev -m electron",
    "dev:android": "quasar dev -m capacitor -T android",
    "dev:ios": "quasar dev -m capacitor -T ios",

    "build": "quasar build",
    "build:spa": "quasar build",

    "build:electron": "quasar build -m electron",
    "build:electron:mac": "quasar build -m electron -T darwin",
    "build:electron:win": "quasar build -m electron -T win32",
    "build:electron:linux": "quasar build -m electron -T linux",
    "build:electron:all": "npm run build:electron:mac && npm run build:electron:win && npm run build:electron:linux",

    "build:android": "quasar build -m capacitor -T android",
    "build:android:apk": "npm run build:android && cd src-capacitor/android && ./gradlew assembleDebug",
    "build:android:aab": "npm run build:android && cd src-capacitor/android && ./gradlew bundleRelease",

    "build:ios": "quasar build -m capacitor -T ios",
    "build:ios:simulator": "npm run build:ios && cd src-capacitor/ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator",
    "build:ios:device": "npm run build:ios && cd src-capacitor/ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -sdk iphoneos archive",

    "build:mobile": "npm run build:android && npm run build:ios",
    "build:all": "npm run build:electron:all && npm run build:mobile",

    "capacitor:sync": "npx cap sync",
    "capacitor:sync:android": "npx cap sync android",
    "capacitor:sync:ios": "npx cap sync ios",
    "capacitor:open:android": "npx cap open android",
    "capacitor:open:ios": "npx cap open ios",
    "capacitor:update": "npx cap update",

    "clean": "rimraf dist node_modules/.vite",
    "clean:all": "rimraf dist node_modules src-capacitor/node_modules src-electron/node_modules",

    "postinstall": "quasar prepare",
    "setup:platforms": "./scripts/setup-platforms.sh"
  }
}
```

## Complete Package.json Template

Here's a complete `package.json` with all updates:

```json
{
  "name": "autocheck",
  "version": "1.0.0",
  "description": "Vehicle maintenance management system",
  "productName": "AutoCheck",
  "author": "AutoCheck Team",
  "type": "module",
  "private": true,
  "scripts": {
    "lint": "eslint -c ./eslint.config.js \"./src*/**/*.{js,cjs,mjs,vue}\"",
    "format": "prettier --write \"**/*.{js,vue,scss,html,md,json}\" --ignore-path .gitignore",
    "test": "echo \"No test specified\" && exit 0",
    "dev": "quasar dev",
    "dev:electron": "quasar dev -m electron",
    "dev:android": "quasar dev -m capacitor -T android",
    "dev:ios": "quasar dev -m capacitor -T ios",
    "build": "quasar build",
    "build:spa": "quasar build",
    "build:electron": "quasar build -m electron",
    "build:electron:mac": "quasar build -m electron -T darwin",
    "build:electron:win": "quasar build -m electron -T win32",
    "build:electron:linux": "quasar build -m electron -T linux",
    "build:electron:all": "npm run build:electron:mac && npm run build:electron:win && npm run build:electron:linux",
    "build:android": "quasar build -m capacitor -T android",
    "build:android:apk": "npm run build:android && cd src-capacitor/android && ./gradlew assembleDebug",
    "build:android:aab": "npm run build:android && cd src-capacitor/android && ./gradlew bundleRelease",
    "build:ios": "quasar build -m capacitor -T ios",
    "build:ios:simulator": "npm run build:ios && cd src-capacitor/ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator",
    "build:ios:device": "npm run build:ios && cd src-capacitor/ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -sdk iphoneos archive",
    "build:mobile": "npm run build:android && npm run build:ios",
    "build:all": "npm run build:electron:all && npm run build:mobile",
    "capacitor:sync": "npx cap sync",
    "capacitor:sync:android": "npx cap sync android",
    "capacitor:sync:ios": "npx cap sync ios",
    "capacitor:open:android": "npx cap open android",
    "capacitor:open:ios": "npx cap open ios",
    "capacitor:update": "npx cap update",
    "clean": "rimraf dist node_modules/.vite",
    "clean:all": "rimraf dist node_modules src-capacitor/node_modules src-electron/node_modules",
    "postinstall": "quasar prepare",
    "setup:platforms": "./scripts/setup-platforms.sh"
  },
  "dependencies": {
    "axios": "^1.2.1",
    "vue-i18n": "^11.0.0",
    "pinia": "^3.0.1",
    "@quasar/extras": "^1.16.4",
    "quasar": "^2.16.0",
    "vue": "^3.5.22",
    "vue-router": "^4.0.0",
    "@capacitor/android": "^6.0.0",
    "@capacitor/cli": "^6.0.0",
    "@capacitor/core": "^6.0.0",
    "@capacitor/ios": "^6.0.0"
  },
  "devDependencies": {
    "@intlify/unplugin-vue-i18n": "^4.0.0",
    "@eslint/js": "^9.14.0",
    "eslint": "^9.14.0",
    "eslint-plugin-vue": "^10.4.0",
    "globals": "^16.4.0",
    "vite-plugin-checker": "^0.11.0",
    "vue-eslint-parser": "^10.2.0",
    "@vue/eslint-config-prettier": "^10.1.0",
    "prettier": "^3.3.3",
    "@quasar/app-vite": "^2.4.0",
    "autoprefixer": "^10.4.2",
    "postcss": "^8.4.14",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "@electron/rebuild": "^3.5.0",
    "cross-env": "^7.0.3",
    "rimraf": "^5.0.5"
  },
  "engines": {
    "node": "^28 || ^26 || ^24 || ^22 || ^20",
    "npm": ">= 6.13.4",
    "yarn": ">= 1.21.1"
  }
}
```

## Installation Steps

1. **Backup your current package.json**:
   ```bash
   cp package.json package.json.backup
   ```

2. **Update package.json** with the scripts and dependencies above

3. **Install new dependencies**:
   ```bash
   npm install
   ```

4. **Run the setup script**:
   ```bash
   npm run setup:platforms
   ```

5. **Verify installation**:
   ```bash
   npm run dev:electron  # Test desktop
   ```

## Quick Start Commands

After installation, use these commands:

### Development
```bash
npm run dev              # Web (SPA)
npm run dev:electron     # Desktop
npm run dev:android      # Android (requires Android Studio)
npm run dev:ios          # iOS (macOS only, requires Xcode)
```

### Production Builds
```bash
npm run build:electron:mac     # macOS DMG & ZIP
npm run build:electron:win     # Windows EXE (NSIS & Portable)
npm run build:electron:linux   # Linux AppImage, DEB, RPM
npm run build:android          # Android APK & AAB
npm run build:ios              # iOS IPA
npm run build:all              # All platforms
```

### Capacitor Management
```bash
npm run capacitor:sync         # Sync web assets to mobile
npm run capacitor:open:android # Open Android Studio
npm run capacitor:open:ios     # Open Xcode
npm run capacitor:update       # Update Capacitor dependencies
```

## Notes

- **macOS builds** can only be done on macOS machines
- **iOS builds** require macOS with Xcode installed
- **Android builds** can be done on any platform with Android Studio
- **Windows builds** can be done on any platform (Linux/macOS require Wine)
- **Linux builds** work best on Linux, but can be done on macOS

## Troubleshooting

If you encounter issues:

1. **Clear cache and reinstall**:
   ```bash
   npm run clean:all
   npm install
   npm run setup:platforms
   ```

2. **Electron issues**:
   ```bash
   npx electron-rebuild
   ```

3. **Capacitor issues**:
   ```bash
   npm run capacitor:sync
   npx cap doctor
   ```

4. **Node version issues**:
   ```bash
   node --version  # Should be v20+
   nvm use 22      # If using nvm
   ```

For more detailed troubleshooting, see BUILD_SETUP.md.
