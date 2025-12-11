# AutoCheck - Troubleshooting Guide

Common issues and solutions for building AutoCheck.

## Build Errors

### ❌ "GH_TOKEN not set" Error

**Error:**
```
GitHub Personal Access Token is not set, neither programmatically, nor using env "GH_TOKEN"
```

**Solution:**
This is fixed! The `publish: null` setting in [quasar.config.js](quasar.config.js) disables auto-publish.

If you still see this:
1. Make sure you have the latest code: `git pull`
2. Check `quasar.config.js` line 225 shows: `publish: null,`
3. Rebuild: `npm run build:electron`

**See:** [BUILDS_WITHOUT_SECRETS.md](BUILDS_WITHOUT_SECRETS.md)

---

### ❌ "Please specify author 'email'" Error

**Error:**
```
App • ⚠️   electron/builder could not build
Error: Please specify author 'email' in the application package.json
It is required to set Linux .deb package maintainer.
```

**Cause:**
electron-builder requires maintainer information for Linux .deb packages.

**Solution:**
✅ **Already fixed!** Two things are configured:

1. The [package.json](package.json:6-9) has author with email:
```json
{
  "author": {
    "name": "AutoCheck Team",
    "email": "support@autocheck.app"
  }
}
```

2. The [quasar.config.js](quasar.config.js:273) has Linux maintainer:
```javascript
linux: {
  maintainer: 'AutoCheck Team <support@autocheck.app>',
  // ... other config
}
```

**To customize (optional):**
Update both locations with your information:
- package.json author object
- quasar.config.js linux.maintainer field

---

### ❌ "npm run dev:electron" - Missing Script

**Error:**
```
npm error Missing script: "dev:electron"
```

**Solution:**
The build scripts are missing from package.json.

1. Check if scripts exist:
   ```bash
   grep "dev:electron" package.json
   ```

2. If missing, they should already be added. Try:
   ```bash
   git pull  # Get latest changes
   npm install  # Reinstall dependencies
   ```

3. Or manually verify [package.json](package.json:14) has:
   ```json
   "dev:electron": "quasar dev -m electron"
   ```

---

### ❌ Electron Mode Not Found

**Error:**
```
App • ⚠️  Electron support detected already. Aborting.
```
or
```
Error: src-electron folder not found
```

**Solution:**
Add Electron mode:
```bash
npx quasar mode add electron
```

If it says "already exists" but builds fail:
```bash
# Remove and re-add
rm -rf src-electron
npx quasar mode add electron
```

---

### ❌ Capacitor Mode Not Found

**Error:**
```
Error: src-capacitor folder not found
```

**Solution:**
Add Capacitor mode:
```bash
npx quasar mode add capacitor
```

---

### ❌ Build Fails with Module Errors

**Error:**
```
Error: Cannot find module 'electron'
```
or similar module errors.

**Solution:**
```bash
# Clean and reinstall
npm run clean:all
npm install

# Try building again
npm run build:electron
```

---

### ❌ Icons Missing Warning

**Warning:**
```
WARNING: icon.icns not found
WARNING: icon.ico not found
WARNING: icon.png not found
```

**Impact:**
Build works but uses default Electron icon.

**Solution (optional):**
Add custom icons to `src-electron/icons/`:
- `icon.icns` - macOS (512x512)
- `icon.ico` - Windows (256x256)
- `icon.png` - Linux (512x512)

Or ignore if you're fine with default icon during development.

---

### ❌ GitHub Actions: Build Fails

**Check these:**

1. **Workflow file syntax**:
   - Check `.github/workflows/build-desktop.yml`
   - Verify YAML indentation

2. **Dependencies installation**:
   ```yaml
   - name: Install dependencies
     run: npm ci
   ```

3. **Node version**:
   ```yaml
   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       node-version: '22'  # Must be 20+
   ```

4. **View logs**:
   - Go to Actions tab in GitHub
   - Click on failed workflow
   - Expand failed step to see error

---

### ❌ macOS Build: Code Signing Fails

**Error:**
```
Code signing failed
```

**For unsigned builds:**
This is expected and okay. The build completes, just without signing.

**To enable signing:**
See [CI_CD_GUIDE.md](CI_CD_GUIDE.md) - "macOS Signing Setup"

---

### ❌ Windows Build: SmartScreen Warning

**"Windows protected your PC"**

**This is normal for unsigned apps.**

To bypass:
1. Click "More info"
2. Click "Run anyway"

To eliminate warning:
- Get code signing certificate
- See [CI_CD_GUIDE.md](CI_CD_GUIDE.md) - "Windows Signing Setup"

---

### ❌ macOS: "App is damaged and can't be opened"

**Error:**
```
"AutoCheck.app" is damaged and can't be opened. You should move it to the Trash.
```

**Cause:**
macOS Gatekeeper quarantine on unsigned apps.

**Solution:**
```bash
# Remove quarantine attribute
xattr -cr /Applications/AutoCheck.app

# Or right-click > Open (first time only)
```

---

### ❌ Linux: AppImage Won't Run

**Error:**
```
Permission denied
```

**Solution:**
```bash
# Make executable
chmod +x AutoCheck-1.0.0-x86_64.AppImage

# Run
./AutoCheck-1.0.0-x86_64.AppImage
```

---

### ❌ Android Build Fails

**Error:**
```
ANDROID_HOME not set
```

**Solution:**
```bash
# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Add to ~/.zshrc or ~/.bashrc to persist

# Windows
set ANDROID_HOME=C:\Users\YourUser\AppData\Local\Android\Sdk
```

---

### ❌ iOS Build Fails (macOS only)

**Error:**
```
CocoaPods not installed
```

**Solution:**
```bash
# Install CocoaPods
sudo gem install cocoapods

# Install pod dependencies
cd src-capacitor/ios/App
pod install
cd ../../..
```

---

### ❌ "act" Doesn't Support macOS

**Error:**
```
Skipping unsupported platform -- Try running with `-P macos-latest=..`
```

**This is expected!**

`act` only supports Linux runners. For macOS:
- Build locally: `npm run build:electron:mac`
- Or use GitHub Actions

**See:** [LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md)

---

## Development Issues

### ❌ Hot Reload Not Working

**In Electron dev mode:**

1. Stop dev server: `Ctrl+C`
2. Clean cache:
   ```bash
   npm run clean
   ```
3. Restart:
   ```bash
   npm run dev:electron
   ```

---

### ❌ Electron Window Blank/White Screen

**Possible causes:**

1. **Console errors**: Check DevTools (View > Toggle Developer Tools)
2. **Base URL issue**: Check `quasar.config.js` has `publicPath: './'`
3. **Cache**: Try `npm run clean && npm run dev:electron`

---

### ❌ Changes Not Reflected

**Solution:**
```bash
# Kill all processes
pkill -f quasar
pkill -f electron

# Clean and restart
npm run clean
npm run dev:electron
```

---

## Platform-Specific Issues

### macOS

**Issue:** Xcode Command Line Tools not found

**Solution:**
```bash
xcode-select --install
```

---

### Windows

**Issue:** Python/Visual Studio errors

**Solution:**
```bash
npm install --global --production windows-build-tools
```

---

### Linux

**Issue:** Missing system libraries

**Ubuntu/Debian:**
```bash
sudo apt-get install -y libgtk-3-dev libnotify-dev libnss3 libxss1 libasound2 libxtst-dev libsecret-1-dev
```

**Fedora/RHEL:**
```bash
sudo dnf install gtk3-devel libnotify-devel nss libXScrnSaver alsa-lib libXtst libsecret-devel
```

---

## Performance Issues

### ❌ Build Too Slow

**Tips:**

1. **Use SSD**: Builds on SSD are much faster
2. **Increase RAM**: electron-builder is memory-intensive
3. **Close apps**: Free up CPU/memory
4. **Build one platform**: Don't use `build:all` during development
5. **Use caching**: GitHub Actions has caching enabled

---

### ❌ App Runs Slowly

**Check:**

1. **Development mode**: Use `npm run dev` instead of `npm run dev:electron` for faster iteration
2. **Console errors**: Open DevTools to check for errors
3. **Memory leaks**: Check Task Manager/Activity Monitor
4. **API delays**: Check network tab in DevTools

---

## Getting More Help

### 1. Check Documentation

- [QUICK_START.md](QUICK_START.md) - Quick reference
- [BUILD_SETUP.md](BUILD_SETUP.md) - Complete build guide
- [LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md) - Local testing
- [CI_CD_GUIDE.md](CI_CD_GUIDE.md) - GitHub Actions
- [BUILDS_WITHOUT_SECRETS.md](BUILDS_WITHOUT_SECRETS.md) - Unsigned builds

### 2. Enable Verbose Logging

**Quasar:**
```bash
npm run dev:electron -- --debug
```

**Electron Builder:**
```bash
DEBUG=electron-builder npm run build:electron
```

### 3. Check Logs

**Local builds:**
```bash
cat dist/electron/builder-debug.yml
```

**GitHub Actions:**
- Actions tab > Click workflow > Expand steps

### 4. Clean Everything

**Nuclear option:**
```bash
npm run clean:all
rm -rf node_modules package-lock.json
npm install
npm run build:electron
```

### 5. Check Versions

```bash
node --version  # Should be 20+
npm --version   # Should be 10+
npx quasar --version  # Should match package.json
```

### 6. GitHub Issues

If nothing works:
1. Check existing issues: https://github.com/your-org/autocheck/issues
2. Create new issue with:
   - Error message
   - Platform (macOS/Windows/Linux)
   - Node version
   - Steps to reproduce

---

## Common Questions

**Q: Do I need code signing?**
A: No, it's optional. See [BUILDS_WITHOUT_SECRETS.md](BUILDS_WITHOUT_SECRETS.md)

**Q: Why are builds unsigned?**
A: Code signing requires paid certificates. Unsigned builds work perfectly, just have a one-time security warning.

**Q: Can I use `act` for macOS builds?**
A: No, `act` only supports Linux. Build macOS locally or use GitHub Actions.

**Q: How do I add custom icons?**
A: Place icons in `src-electron/icons/` (icns, ico, png)

**Q: Where are build outputs?**
A: `dist/electron/Packaged/` for local builds, Artifacts section in GitHub Actions

**Q: How do I create a release?**
A: `git tag v1.0.0 && git push origin v1.0.0`

---

**Still stuck?** Check the full documentation or create an issue!
