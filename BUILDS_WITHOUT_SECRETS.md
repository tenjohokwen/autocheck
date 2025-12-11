# Building AutoCheck Without Secrets

This guide explains how to build AutoCheck without requiring code signing certificates or GitHub tokens.

## ✅ What's Fixed

The build system now works **without any secrets** configured. You can build and distribute unsigned applications.

### Changes Made

1. **Disabled auto-publish in quasar.config.js**
   - Set `publish: null` in electron-builder configuration
   - This prevents the "GH_TOKEN not set" error
   - GitHub Actions manually handles releases instead

2. **GitHub Actions workflows**
   - Builds work without any secrets
   - Artifacts are uploaded to GitHub Actions
   - Release creation only requires the default `GITHUB_TOKEN` (auto-provided)

## 🚀 Building Without Secrets

### Local Builds (No secrets needed)

```bash
# Build for your platform
npm run build:electron:mac     # Unsigned macOS build
npm run build:electron:win     # Unsigned Windows build
npm run build:electron:linux   # Unsigned Linux build

# All platforms
npm run build:electron:all     # Unsigned builds for all platforms
```

**Result**: Unsigned but fully functional applications in `dist/electron/Packaged/`

### GitHub Actions (No secrets needed)

```bash
# Push code to trigger builds
git push origin main

# Or create a tag for releases
git tag v1.0.0
git push origin v1.0.0
```

**Result**:
- Unsigned builds for all platforms
- Artifacts uploaded to GitHub Actions (available for 30 days)
- If tagged: GitHub Release created with all installers attached

## 📦 Unsigned vs Signed Builds

### Unsigned Builds (No secrets required)

**✅ Advantages:**
- Works immediately without setup
- No certificates or tokens needed
- Free and simple
- Perfect for internal use, testing, or open source

**⚠️ Limitations:**
- **macOS**: Users may need to right-click > Open (Gatekeeper warning)
- **Windows**: SmartScreen warning on first run
- **Linux**: No issues
- **Mobile**: Cannot publish to official app stores

**Distribution:**
- Direct downloads from your website
- GitHub Releases
- Internal company distribution
- Beta testing

### Signed Builds (Secrets required)

**✅ Advantages:**
- No security warnings
- Smoother user experience
- Required for official app stores
- Better trust and legitimacy

**💰 Requirements:**
- **macOS**: Apple Developer account ($99/year) + certificate
- **Windows**: Code signing certificate ($50-500/year)
- **Android**: Free keystore or Play App Signing
- **iOS**: Apple Developer account ($99/year)

**When to use:**
- Publishing to app stores
- Wide public distribution
- Corporate/enterprise deployment
- When brand reputation matters

## 🎯 Recommended Approach

### Phase 1: Development & Beta (No secrets)
```bash
# Build and distribute unsigned
npm run build:electron:mac
```
- Use for development
- Internal testing
- Beta testers who understand the warnings
- Open source distribution

### Phase 2: Production (With secrets)
When ready for wider distribution:
1. Get code signing certificates
2. Add secrets to GitHub
3. Enable signing in workflows
4. Distribute signed apps

## 📝 How It Works Now

### Build Process (Unsigned)

1. **Developer pushes code** → GitHub Actions triggers
2. **Workflows run** on macOS/Windows/Linux runners
3. **Builds complete** without requiring GH_TOKEN
4. **Artifacts uploaded** to GitHub Actions
5. **Downloads available** for 30 days

### Release Process (Unsigned)

1. **Developer creates tag**: `git tag v1.0.0 && git push origin v1.0.0`
2. **Workflows build** all platforms
3. **Release created** using default `GITHUB_TOKEN` (auto-provided by GitHub)
4. **Installers attached** to GitHub Release
5. **Users download** unsigned installers

## 🔧 How to Use Unsigned Builds

### macOS Users
```bash
# First time opening (Gatekeeper warning)
1. Double-click AutoCheck.dmg
2. Drag to Applications
3. Right-click app > Open (or use Open Anyway in Security settings)
4. Click "Open" in dialog
5. App runs normally from now on
```

Alternative:
```bash
# Remove quarantine attribute
xattr -cr /Applications/AutoCheck.app
```

### Windows Users
```bash
# First time opening (SmartScreen warning)
1. Double-click AutoCheck Setup.exe
2. Click "More info" in SmartScreen dialog
3. Click "Run anyway"
4. Follow installer prompts
5. App runs normally from now on
```

### Linux Users
```bash
# No warnings or issues
chmod +x AutoCheck-1.0.0-x86_64.AppImage
./AutoCheck-1.0.0-x86_64.AppImage

# Or install DEB/RPM normally
sudo dpkg -i autocheck_1.0.0_amd64.deb
sudo rpm -i autocheck-1.0.0.x86_64.rpm
```

## 🌐 Distribution Options (Unsigned)

### 1. GitHub Releases (Easiest)
```bash
# Create release
git tag v1.0.0
git push origin v1.0.0

# Builds automatically attach to release
# Users download from: https://github.com/your-org/autocheck/releases
```

**Pros:**
- Automatic with GitHub Actions
- Built-in hosting
- Version tracking
- Changelog support

**Cons:**
- Unsigned build warnings
- GitHub account required to download (for private repos)

### 2. Direct Download (Your Website)
```bash
# Download artifacts from GitHub Actions
# Upload to your web server
# Link from your website
```

**Pros:**
- Your branding
- No GitHub account needed
- Can add custom instructions

**Cons:**
- Manual upload process
- Need web hosting
- Unsigned build warnings

### 3. Internal Distribution
```bash
# Share via company network
# Email to team members
# Cloud storage (Dropbox, Google Drive)
```

**Pros:**
- Easy for internal teams
- No public visibility needed
- Quick distribution

**Cons:**
- Manual sharing
- Unsigned build warnings
- Not scalable for many users

## 🔐 Adding Secrets Later (Optional)

If you want signed builds later, see [CI_CD_GUIDE.md](CI_CD_GUIDE.md) for:
- Getting code signing certificates
- Adding secrets to GitHub Actions
- Enabling signing in workflows

## 🎨 Current Workflow Status

### What Works NOW (No secrets)

✅ **Local builds**: All platforms, unsigned
✅ **GitHub Actions**: All platforms, unsigned
✅ **Artifacts**: 30-day storage on GitHub
✅ **Releases**: Auto-created on tags
✅ **Downloads**: Direct from GitHub Releases

### What Requires Secrets (Optional)

🔐 **macOS signing**: Apple certificate
🔐 **Windows signing**: Code signing certificate
🔐 **Notarization**: Apple notarization
🔐 **App Store**: Apple/Google accounts

## 📋 Summary

**Current State:**
- ✅ Builds work without any secrets
- ✅ No GH_TOKEN error
- ✅ No code signing certificates needed
- ✅ Fully functional unsigned apps
- ✅ GitHub Releases work automatically

**User Experience:**
- ⚠️ One-time security warning (easy to bypass)
- ✅ Normal operation after first open
- ✅ All features work perfectly

**When to Add Secrets:**
- 🎯 Wide public distribution
- 🎯 App store publishing
- 🎯 Corporate deployment
- 🎯 Better user experience

## 🚀 Next Steps

```bash
# 1. Push your code
git push origin main

# 2. Check GitHub Actions
# Go to: https://github.com/your-org/autocheck/actions

# 3. Download artifacts or create release
git tag v1.0.0
git push origin v1.0.0

# 4. Share with users
# Direct them to: https://github.com/your-org/autocheck/releases
```

Your users just need to bypass the security warning once, then the app works perfectly! 🎉

---

**Bottom Line**: You can build, distribute, and use AutoCheck **right now** without any secrets, certificates, or paid accounts. Code signing is optional and only needed for a smoother first-run experience or app store distribution.
