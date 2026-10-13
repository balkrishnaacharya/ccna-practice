# Android APK Build & Signing Guide

This guide documents the exact process and commands required to build, zip-align, and sign the Android APK for the **CCNA 2.0 Practice** app.

---

## 1. Quick Start (1-Command Build)

An automated script is provided in this folder:

```bash
./release-apk/build-apk.sh
```

This script will:
1. Set up the Android SDK and NDK environment.
2. Build the production React frontend bundle via Vite (`npm run build`).
3. Compile the Rust Android library and bundle the unsigned APK with Tauri (`aarch64`).
4. Run `zipalign` to optimize APK alignment on 4-byte boundaries.
5. Sign the APK using `apksigner` and `~/.android/debug.keystore`.
6. Verify the v2/v3 signatures and copy the signed APK to `release-apk/ccna-practice.apk` and the project root.

---

## 2. Environment Prerequisites

Before building manually, ensure your shell environment variables are exported:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/27.3.13750724"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
```

Verify that required tools and targets are installed:
- **Rust Android Target:**
  ```bash
  rustup target add aarch64-linux-android
  ```
- **Java / JDK:** OpenJDK 17 (`java -version`)
- **Android Build-Tools:** e.g., `36.0.0` or latest located at `$ANDROID_HOME/build-tools/`

---

## 3. Step-by-Step Manual Build Process

### Step 3.1: Build Frontend Assets
```bash
npm run build
```
Generates production assets into `dist/`.

### Step 3.2: Compile & Bundle Android APK via Tauri
```bash
npm run tauri android build -- --apk --target aarch64
```
The raw, unsigned APK is produced at:
```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

### Step 3.3: Zip-Align the APK
Zip-alignment ensures uncompressed data is aligned on 4-byte boundaries for memory-mapped file access on Android devices:
```bash
$ANDROID_HOME/build-tools/36.0.0/zipalign -p -f 4 \
  src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk \
  /tmp/ccna-aligned.apk
```

### Step 3.4: Sign the APK

#### Using the Development/Debug Keystore (`~/.android/debug.keystore`):
```bash
$ANDROID_HOME/build-tools/36.0.0/apksigner sign \
  --ks ~/.android/debug.keystore \
  --ks-pass pass:android \
  --key-pass pass:android \
  --ks-key-alias androiddebugkey \
  --out release-apk/ccna-practice.apk \
  /tmp/ccna-aligned.apk
```

#### Using a Custom / Production Keystore:
To generate a production keystore (valid for 25+ years):
```bash
keytool -genkey -v \
  -keystore ccna-release.keystore \
  -alias ccnakey \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```
Then sign with your production keystore:
```bash
$ANDROID_HOME/build-tools/36.0.0/apksigner sign \
  --ks ccna-release.keystore \
  --ks-key-alias ccnakey \
  --out release-apk/ccna-practice.apk \
  /tmp/ccna-aligned.apk
```

### Step 3.5: Verify the Signature
```bash
$ANDROID_HOME/build-tools/36.0.0/apksigner verify --verbose --print-certs release-apk/ccna-practice.apk
```
Expected output:
- `Verifies: true`
- `Verified using v2 scheme (APK Signature Scheme v2): true`
- `Verified using v3 scheme (APK Signature Scheme v3): true`

---

## 4. Current Build Information

- **Output File:** `release-apk/ccna-practice.apk`
- **Architecture:** `arm64-v8a` (`aarch64`)
- **Package ID:** `com.ccnapractice.app`
- **Database:** Bundled `ccna.db` seeded on first run into app data storage (~500 questions, 25/25/20/20/10 blueprint).
- **Features Included:**
  - Android status bar / notch safe-area handling (`viewport-fit=cover`).
  - Material 3 styling tokens (`#4d6bfe` primary, pill action buttons, mobile bottom nav).
  - Dynamic choice shuffle on every question load (`ORDER BY RANDOM()`).
  - Spaced anti-repeat engine (70% bank coverage, 72h decay, least-recently-answered fallback).
