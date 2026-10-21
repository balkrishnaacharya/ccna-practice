# Android APK Build & Signing Guide

This guide documents the automated and manual processes to build, zip-align, and cryptographically sign the Android APK for the **CCNA 2.0 Practice** app.

---

## 1. Quick Start (Build Script)

An automated script is provided:

```bash
./release-apk/build-apk.sh [OPTIONS]
```

### Modes

#### Development Mode (Default)
Builds and signs using the local Android debug keystore (`~/.android/debug.keystore`), auto-generating one if missing:
```bash
./release-apk/build-apk.sh
# Or explicitly:
./release-apk/build-apk.sh --mode debug
```

#### Production / Release Mode (Fail-Closed)
Builds and signs using your release keystore. All credentials must be provided via CLI flags or environment variables. Fails closed if any credential is missing, if keystore file does not exist, or if the certificate SHA-256 does not match `--fingerprint`:
```bash
./release-apk/build-apk.sh --mode release \
  --keystore /path/to/release.keystore \
  --alias my-key-alias \
  --keystore-pass "mypassword" \
  --key-pass "mypassword" \
  --fingerprint "fb897dbcae1a64095177e99d54484ececc66c7961372dff00178bde0fd59d7eb"
```

Or using environment variables:
```bash
export MODE=release
export KEYSTORE=/path/to/release.keystore
export KEY_ALIAS=my-key-alias
export KEYSTORE_PASS="pass:mypassword"
export KEY_PASS="pass:mypassword"
export EXPECTED_FINGERPRINT="fb897dbcae1a64095177e99d54484ececc66c7961372dff00178bde0fd59d7eb"

./release-apk/build-apk.sh
```

---

## 2. GitHub Actions CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/build.yml`) automates building and signing for every release tag push (`v*.*.*`) and workflow dispatch.

### Required GitHub Repository Secrets

Configure the following secrets in **Settings > Secrets and variables > Actions**:

| Secret Name | Description | Example / Format |
|---|---|---|
| `ANDROID_KEY_BASE64` | Base64-encoded JKS/PKCS12 keystore file | `base64 -w 0 release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | Password protecting the keystore | Plain text password |
| `ANDROID_KEY_ALIAS` | Alias of the signing key inside the keystore | `androiddebugkey` or release alias |
| `ANDROID_KEY_PASSWORD` | Password for the key entry | Plain text password |
| `ANDROID_CERT_SHA256` | Pinned SHA-256 certificate fingerprint | `fb897dbcae1a64095177e99d54484ececc66c7961372dff00178bde0fd59d7eb` |

### Security & Integrity Enforcement
1. **Dynamic Build-Tools Discovery**: Discovers the latest installed `build-tools` automatically in the runner.
2. **Fail-Closed Verification**: If secrets are missing during a release build, the pipeline immediately halts with an exit code 1. No unsigned or default-debug artifact can ever be released.
3. **Fingerprint Pinning**: Compares `apksigner verify --print-certs` SHA-256 digest against `ANDROID_CERT_SHA256` to prevent unauthorized key replacements.
4. **Intermediate Cleanup**: Unsigned intermediate APKs and temporary keystore files are purged via trap handlers prior to artifact packaging.

---

## 3. Environment Prerequisites (Local Build)

Ensure your shell exports the Android SDK paths:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/27.3.13750724"  # or installed NDK version
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
```

Verify required tools:
- **Rust Android Target:**
  ```bash
  rustup target add aarch64-linux-android
  ```
- **Java / JDK:** OpenJDK 17 (`java -version`)
- **Android Build-Tools:** e.g., `36.0.0` or latest installed in `$ANDROID_HOME/build-tools/`

---

## 4. Manual Step-by-Step Build & Sign Process

### Step 4.1: Build Frontend Assets
```bash
npm run build
```

### Step 4.2: Compile & Bundle Android APK via Tauri
```bash
npm run tauri android build -- --apk --target aarch64
```
Unsigned APK output path:
```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

### Step 4.3: Zip-Align
```bash
$BUILD_TOOLS/zipalign -p -f 4 \
  src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk \
  /tmp/ccna-aligned.apk
```

### Step 4.4: Sign with `apksigner`
```bash
$BUILD_TOOLS/apksigner sign \
  --ks /path/to/keystore.jks \
  --ks-pass pass:YOUR_PASSWORD \
  --ks-key-alias YOUR_ALIAS \
  --key-pass pass:YOUR_KEY_PASSWORD \
  --out release-apk/ccna-practice.apk \
  /tmp/ccna-aligned.apk
```

### Step 4.5: Verify Signature & Fingerprint
```bash
$BUILD_TOOLS/apksigner verify --verbose --print-certs release-apk/ccna-practice.apk
```
Expected output:
- `Verifies: true`
- `Verified using v2 scheme (APK Signature Scheme v2): true`
- `Verified using v3 scheme (APK Signature Scheme v3): true`
- `Signer #1 certificate SHA-256 digest: <EXPECTED_DIGEST>`

---

## 5. Artifact Details

- **Output File:** `release-apk/ccna-practice.apk` (and `ccna-practice.apk` in repository root)
- **Architecture:** `arm64-v8a` (`aarch64`)
- **Package ID:** `com.ccnapractice.app`
- **Tauri Target:** Android Universal Release Bundle
