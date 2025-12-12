# Windows Build Troubleshooting

## ✅ FIXED: Blank Screen Issue

**Issue Identified**: The problem was caused by incompatible package versions, specifically `@quasar/app-vite`.

**Root Cause**:
- This app was using `@quasar/app-vite: ^2.4.0`
- The working app uses `@quasar/app-vite: ^2.1.0`
- The version jump (2.1 → 2.4) introduced breaking changes affecting Windows Electron builds
- The electron-main.js was always correct and identical to the working app

**Solution**: Pinned @quasar/app-vite to exact version 2.1.0:
- `@quasar/app-vite`: `^2.4.0` → `2.1.0` (exact version, not ^2.1.0)
- `@capacitor/*`: `^6.0.0` → `^8.0.0` (to match working app)
- **Critical**: Use exact version `2.1.0` not `^2.1.0` - the caret allows npm to install 2.4.0
- Regenerated package-lock.json by running: `rm -rf node_modules package-lock.json && npm install`

**Important Notes**:
- The electron-main.js file was never the problem. It was already correct.
- GitHub Actions uses `npm ci` which installs from package-lock.json, not package.json
- Simply changing package.json without regenerating package-lock.json will not fix CI builds

---

## Historical Context: Blank Screen Issue

If you encounter a blank/white screen in future Electron builds, it's typically caused by one of the following issues:

### 1. File Path Resolution

**Symptom**: Blank white screen, no errors in console

**Cause**: Windows uses backslashes (`\`) for paths while the app expects forward slashes (`/`)

**Fixed in**: [electron-main.js](src-electron/electron-main.js#L46-L56)
- Using `path.resolve()` for cross-platform path resolution
- Added error handling and logging

### 2. ASAR Packaging Issues

**Symptom**: Files not found errors

**Solution**: Check if files are being packaged correctly
```bash
# Extract ASAR to inspect contents (on Windows)
npx asar extract app.asar extracted/
```

### 3. Console Logging on Windows

**CURRENT DEBUG VERSION**: The app now has extensive logging enabled. To see it:

**Run from Command Prompt (REQUIRED)**:
```cmd
# Navigate to where you extracted/installed the app
cd "path\to\AutoCheck"
AutoCheck.exe
```

You should immediately see output like:
```
=== AutoCheck Electron Starting ===
Platform: win32
Current directory: C:\...\resources\app.asar
Process version: v20.x.x
Electron version: xx.x.x
Waiting for app ready...
App ready! Creating window...
Creating window...
Preload path: C:\...\
Window created
Opening DevTools for debugging
PRODUCTION mode: Loading index.html from: C:\...\index.html
Directory contents check...
Successfully loaded index.html
```

**If you see NO output at all**, this indicates:
- The console isn't attached (run from cmd.exe, not by double-clicking)
- The app is crashing before any code runs
- Windows is blocking the executable

**Method 2: DevTools Auto-Open**
The debug build automatically opens DevTools. Check the DevTools console for:
- Red error messages
- Network tab for failed resource loads
- Console tab for JavaScript errors

### 4. Recent Fixes Applied

✅ **Path Resolution** - Using `path.resolve(currentDir, 'index.html')` instead of relative path
✅ **Ready-to-Show Event** - Window only shows after content is loaded
✅ **Error Logging** - Added console logging for load failures
✅ **Background Color** - Set to white to prevent visual flash
✅ **Console Message Forwarding** - Renderer logs forwarded to main process

### 5. Testing the Fix

After rebuilding with these fixes:

1. **Check Console Output**:
   ```cmd
   AutoCheck.exe
   ```
   Look for:
   ```
   Loading index.html from: C:\...\index.html
   Successfully loaded index.html
   ```

2. **Look for Error Messages**:
   ```
   Failed to load: <error code> <description>
   Error loading index.html: <error>
   ```

3. **DevTools**: If loading fails, DevTools should open automatically

### 6. Manual DevTools Activation

To temporarily enable DevTools in production for debugging:

Edit [electron-main.js](src-electron/electron-main.js#L59-L67) and comment out the DevTools prevention:

```javascript
// Temporarily comment these lines:
// if (process.env.DEBUGGING) {
//   mainWindow.webContents.openDevTools()
// } else {
//   mainWindow.webContents.on('devtools-opened', () => {
//     mainWindow.webContents.closeDevTools()
//   })
// }

// Always open DevTools for debugging:
mainWindow.webContents.openDevTools()
```

### 7. Known Working Configuration

The following configuration is confirmed to work on macOS. Windows builds use the same configuration:

- **publicPath**: `'./'` (relative paths)
- **viteConf.base**: `'./'`
- **vueRouterMode**: `'hash'` (not 'history')
- **File loading**: `path.resolve(currentDir, 'index.html')`

### 8. If Issue Persists

1. **Check Windows Security**:
   - Windows Defender may block unsigned apps
   - Right-click app → Properties → Unblock

2. **Check File Integrity**:
   ```cmd
   dir "C:\Program Files\AutoCheck"
   ```
   Verify `index.html` and `app.asar` exist

3. **Try Portable Version**:
   The portable `.exe` doesn't require installation and may work better for testing

4. **Collect Logs**:
   Run from command prompt and share any error messages

### 9. Future Improvements

Consider adding:
- Electron log file (electron-log package)
- Sentry/error reporting for production
- Better error UI instead of blank screen
- Automatic DevTools in unsigned builds
