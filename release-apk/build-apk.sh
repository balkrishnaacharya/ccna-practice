#!/usr/bin/env bash
set -euo pipefail

# CCNA Practice - Android APK Build & Sign Script
# Automatically builds, zip-aligns, and signs the Android APK for CCNA Practice.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Configuring Android environment..."
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export NDK_HOME="${NDK_HOME:-$ANDROID_HOME/ndk/27.3.13750724}"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

# Discover latest installed build-tools version
BUILD_TOOLS_DIR=$(ls -d "$ANDROID_HOME/build-tools/"* 2>/dev/null | sort -V | tail -n 1)
if [ -z "$BUILD_TOOLS_DIR" ]; then
  echo "Error: No Android build-tools found under $ANDROID_HOME/build-tools" >&2
  exit 1
fi
echo "==> Using Android build-tools at: $BUILD_TOOLS_DIR"

KEYSTORE="${KEYSTORE:-$HOME/.android/debug.keystore}"
KEYSTORE_PASS="${KEYSTORE_PASS:-pass:android}"
KEY_ALIAS="${KEY_ALIAS:-androiddebugkey}"
KEY_PASS="${KEY_PASS:-pass:android}"

if [ ! -f "$KEYSTORE" ]; then
  echo "==> Debug keystore not found at $KEYSTORE. Creating one..."
  mkdir -p "$(dirname "$KEYSTORE")"
  keytool -genkey -v -keystore "$KEYSTORE" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
fi

echo "==> Building frontend bundle..."
npm run build

echo "==> Building Android release bundle via Tauri (aarch64)..."
npm run tauri android build -- --apk --target aarch64

UNSIGNED_APK="$REPO_ROOT/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"
if [ ! -f "$UNSIGNED_APK" ]; then
  echo "Error: Unsigned APK was not found at $UNSIGNED_APK" >&2
  exit 1
fi

OUTPUT_DIR="$REPO_ROOT/release-apk"
mkdir -p "$OUTPUT_DIR"
ALIGNED_TMP="/tmp/ccna-aligned-$$.apk"
trap 'rm -f "$ALIGNED_TMP"' EXIT

OUTPUT_APK="$OUTPUT_DIR/ccna-practice.apk"

echo "==> Zip-aligning APK..."
"$BUILD_TOOLS_DIR/zipalign" -p -f 4 "$UNSIGNED_APK" "$ALIGNED_TMP"

echo "==> Signing APK with apksigner..."
"$BUILD_TOOLS_DIR/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-pass "$KEYSTORE_PASS" \
  --key-pass "$KEY_PASS" \
  --ks-key-alias "$KEY_ALIAS" \
  --out "$OUTPUT_APK" \
  "$ALIGNED_TMP"

# Also update root copy for backward compatibility
cp -f "$OUTPUT_APK" "$REPO_ROOT/ccna-practice.apk"

echo "==> Verifying signed APK..."
"$BUILD_TOOLS_DIR/apksigner" verify --verbose --print-certs "$OUTPUT_APK"

echo "==> Done!"
echo "Signed APK available at:"
echo "  - $OUTPUT_APK"
echo "  - $REPO_ROOT/ccna-practice.apk"
ls -lh "$OUTPUT_APK"
sha256sum "$OUTPUT_APK"
