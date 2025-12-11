# AutoCheck CI/CD Guide

Complete guide for setting up GitHub Actions CI/CD for cross-platform builds.

## Overview

The AutoCheck build system includes two GitHub Actions workflows:
1. **build-desktop.yml** - Builds for macOS, Windows, and Linux
2. **build-mobile.yml** - Builds for Android and iOS

## Workflow Triggers

Both workflows trigger on:
- **Push** to `main` or `develop` branches
- **Pull requests** to `main` or `develop` branches
- **Tags** starting with `v` (e.g., `v1.0.0`) - Creates GitHub Releases
- **Manual** dispatch from Actions tab

## Setup Instructions

### 1. Repository Setup

1. Fork or create the repository on GitHub
2. Go to repository **Settings** > **Actions** > **General**
3. Enable **Allow all actions and reusable workflows**
4. Under **Workflow permissions**, select **Read and write permissions**
5. Check **Allow GitHub Actions to create and approve pull requests**

### 2. Required Secrets

Navigate to **Settings** > **Secrets and variables** > **Actions** and add the following secrets:

#### General Secrets

| Secret Name | Description | Required For | How to Get |
|------------|-------------|--------------|------------|
| `GITHUB_TOKEN` | GitHub API token | Releases | Auto-provided by GitHub |
| `GH_TOKEN` | Personal access token | Optional | [Create PAT](https://github.com/settings/tokens) |

#### Android Secrets (Optional - for signed builds)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `ANDROID_KEYSTORE_BASE64` | Base64 encoded keystore file | See Android Signing below |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | Your keystore password |
| `ANDROID_KEY_ALIAS` | Key alias | Your key alias |
| `ANDROID_KEY_PASSWORD` | Key password | Your key password |

#### iOS Secrets (Optional - for signed builds, macOS only)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `IOS_CERTIFICATE_BASE64` | Distribution certificate | See iOS Signing below |
| `IOS_CERTIFICATE_PASSWORD` | Certificate password | Your certificate password |
| `IOS_PROVISIONING_PROFILE_BASE64` | Provisioning profile | See iOS Signing below |
| `APPLE_ID` | Apple ID email | Your Apple developer email |
| `APPLE_ID_PASSWORD` | App-specific password | [Generate here](https://appleid.apple.com) |
| `APPLE_TEAM_ID` | Team ID | From Apple Developer portal |

#### macOS/Windows Secrets (Optional - for signed builds)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `APPLE_CERTIFICATE_BASE64` | macOS signing certificate | See macOS Signing below |
| `APPLE_CERTIFICATE_PASSWORD` | Certificate password | Your certificate password |
| `WINDOWS_CERTIFICATE_BASE64` | Windows code signing cert | See Windows Signing below |
| `WINDOWS_CERTIFICATE_PASSWORD` | Certificate password | Your certificate password |

### 3. Android Signing Setup

#### Generate Keystore

```bash
# Generate a new keystore
keytool -genkey -v -keystore autocheck-release.keystore \
  -alias autocheck -keyalg RSA -keysize 2048 -validity 10000

# Convert to base64
base64 -i autocheck-release.keystore -o keystore.base64

# Copy the base64 content
cat keystore.base64
```

#### Add to Secrets
- Copy the base64 content to `ANDROID_KEYSTORE_BASE64`
- Add your passwords and alias to respective secrets

#### Configure Gradle Signing

Create `src-capacitor/android/keystore.properties`:
```properties
storePassword=<your-store-password>
keyPassword=<your-key-password>
keyAlias=autocheck
storeFile=autocheck-release.keystore
```

Update `src-capacitor/android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

### 4. iOS Signing Setup (macOS only)

#### Export Certificate

```bash
# Export from Keychain (Certificate + Private Key)
# 1. Open Keychain Access
# 2. Select "My Certificates"
# 3. Right-click your distribution certificate
# 4. Export as .p12 file

# Convert to base64
base64 -i Certificates.p12 -o certificate.base64

# Copy content
cat certificate.base64
```

#### Export Provisioning Profile

```bash
# Get from Apple Developer portal
# 1. Go to https://developer.apple.com/account/resources/profiles/list
# 2. Download your distribution profile
# 3. Convert to base64

base64 -i AutoCheck_Distribution.mobileprovision -o profile.base64

# Copy content
cat profile.base64
```

#### Add to Secrets
- Copy certificate base64 to `IOS_CERTIFICATE_BASE64`
- Copy profile base64 to `IOS_PROVISIONING_PROFILE_BASE64`
- Add certificate password to `IOS_CERTIFICATE_PASSWORD`

### 5. macOS Signing Setup

Similar to iOS, but use Developer ID Application certificate:

```bash
# Export Developer ID Application certificate from Keychain
# Convert to base64
base64 -i DeveloperID.p12 -o macos-cert.base64

# Copy content to APPLE_CERTIFICATE_BASE64
cat macos-cert.base64
```

### 6. Windows Signing Setup

```bash
# If you have a .pfx certificate
base64 -i certificate.pfx -o windows-cert.base64

# Copy content to WINDOWS_CERTIFICATE_BASE64
cat windows-cert.base64
```

## Workflow Usage

### Automatic Builds

1. **On Push to main/develop**:
   - Builds all platforms
   - Uploads artifacts for 30 days
   - No release created

2. **On Pull Request**:
   - Builds all platforms
   - Uploads artifacts for testing
   - No release created

3. **On Tag (v*):**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   - Builds all platforms
   - Creates GitHub Release
   - Attaches all build artifacts
   - Auto-generates release notes

### Manual Workflow Dispatch

1. Go to **Actions** tab in GitHub
2. Select workflow (build-desktop or build-mobile)
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow** button

## Build Artifacts

### Desktop Builds

After workflow completion, download artifacts:

- **autocheck-macos**: Contains .dmg and .zip files
- **autocheck-windows**: Contains .exe installers
- **autocheck-linux**: Contains .AppImage, .deb, .rpm files

Artifacts location: `Actions` > Select workflow run > `Artifacts` section

### Mobile Builds

- **autocheck-android-apk**: Debug APK for testing
- **autocheck-android-aab**: Release AAB for Play Store
- **autocheck-ios-ipa**: iOS app for App Store

## Release Process

### Creating a Release

1. **Update version** in `package.json`:
   ```json
   {
     "version": "1.0.0"
   }
   ```

2. **Commit changes**:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.0.0"
   git push origin main
   ```

3. **Create and push tag**:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

4. **Monitor builds** in Actions tab

5. **Verify release** in Releases section

### Release Checklist

- [ ] All tests passing
- [ ] Version updated in package.json
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Tag created and pushed
- [ ] All platform builds successful
- [ ] Release artifacts uploaded
- [ ] Release notes generated
- [ ] Download and test artifacts

## Monitoring Builds

### View Build Status

1. Go to **Actions** tab
2. Click on workflow run
3. View logs for each job (build-macos, build-windows, build-linux, etc.)

### Common Issues

#### Build Fails - macOS

**Issue**: Code signing fails
```
Solution: Ensure APPLE_CERTIFICATE_BASE64 and password are correct
```

**Issue**: Node version mismatch
```
Solution: Update node-version in workflow to match package.json engines
```

#### Build Fails - Windows

**Issue**: MSBuild not found
```
Solution: Workflow uses windows-latest which includes Visual Studio
```

**Issue**: Electron builder fails
```
Solution: Check electron-builder configuration in quasar.config.js
```

#### Build Fails - Linux

**Issue**: Missing dependencies
```
Solution: Add required packages to workflow
- name: Install dependencies
  run: sudo apt-get install -y libgtk-3-dev
```

#### Build Fails - Android

**Issue**: Gradle build fails
```
Solution: Check Java version (should be 17), update in workflow
```

**Issue**: Signing fails
```
Solution: Verify keystore secrets are correctly set
```

#### Build Fails - iOS

**Issue**: CocoaPods fails
```
Solution: Ensure pod install runs correctly
```

**Issue**: Code signing fails
```
Solution: Verify certificate and provisioning profile are valid
```

## Advanced Configuration

### Custom Build Matrix

Modify workflows to build specific combinations:

```yaml
strategy:
  matrix:
    os: [macos-latest, windows-latest, ubuntu-latest]
    node: [20, 22]
    arch: [x64, arm64]
```

### Conditional Steps

Run steps only for specific conditions:

```yaml
- name: Sign macOS app
  if: runner.os == 'macOS' && startsWith(github.ref, 'refs/tags/v')
  run: ...
```

### Cache Dependencies

Speed up builds with caching:

```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Parallel Jobs

Run independent jobs in parallel:

```yaml
jobs:
  build-macos:
    runs-on: macos-latest
  build-windows:
    runs-on: windows-latest
  build-linux:
    runs-on: ubuntu-latest
```

## Testing Workflows Locally

Use [act](https://github.com/nektos/act) to test workflows locally:

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow
act push -j build-macos

# Run with secrets
act push -j build-macos -s GITHUB_TOKEN=your-token
```

## Best Practices

1. **Always test locally** before pushing
2. **Use semantic versioning** (v1.0.0, v1.1.0, v2.0.0)
3. **Keep secrets secure** - never commit them
4. **Monitor build times** - optimize if >30 minutes
5. **Use caching** to speed up builds
6. **Document breaking changes** in release notes
7. **Test artifacts** before distributing
8. **Keep workflows updated** with latest actions versions

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Electron Builder](https://www.electron.build/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Signing](https://developer.android.com/studio/publish/app-signing)
- [iOS Distribution](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)

## Support

For CI/CD issues:
1. Check workflow logs in Actions tab
2. Review this guide
3. Search GitHub Issues
4. Open new issue with workflow logs

---

**Last Updated**: December 2025
**Version**: 1.0.0
