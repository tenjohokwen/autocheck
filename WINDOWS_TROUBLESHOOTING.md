# Windows Build Troubleshooting

## Blank Screen Issue

If the Windows Electron app shows a blank/white screen, this is typically caused by one of the following issues:

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

To see console output from the Electron app on Windows:

**Method 1: Run from Command Prompt**
```cmd
cd "C:\Program Files\AutoCheck"
AutoCheck.exe
```
Console logs will appear in the terminal.

**Method 2: Enable DevTools**
The app now automatically opens DevTools if there's a loading error.

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
