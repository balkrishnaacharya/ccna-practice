#!/usr/bin/env bash
set -euo pipefail

# CCNA Practice - Android APK Build & Sign Script
# Supports both debug (local development) and release (production signed) modes.

MODE="debug"
EXPECTED_FINGERPRINT="${EXPECTED_FINGERPRINT:-}"
KEYSTORE="${KEYSTORE:-}"
KEY_ALIAS="${KEY_ALIAS:-}"
KEYSTORE_PASS="${KEYSTORE_PASS:-}"
KEY_PASS="${KEY_PASS:-}"

print_usage() {
  cat << 'EOF'
Usage: ./release-apk/build-apk.sh [OPTIONS]

Options:
  --mode <debug|release>       Build mode (default: debug)
  --keystore <path>            Path to keystore file (required in release mode)
  --alias <alias>              Key alias (required in release mode)
  --keystore-pass <pass>       Keystore password (e.g. "pass:secret" or "secret")
  --key-pass <pass>            Key password (e.g. "pass:secret" or "secret")
  --fingerprint <sha256>       Expected certificate SHA-256 digest to verify
  -h, --help                   Display this help message

Environment variables accepted:
  MODE, KEYSTORE, KEY_ALIAS, KEYSTORE_PASS, KEY_PASS, EXPECTED_FINGERPRINT
  ANDROID_HOME, NDK_HOME
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --keystore)
      KEYSTORE="$2"
      shift 2
      ;;
    --alias)
      KEY_ALIAS="$2"
      shift 2
      ;;
    --keystore-pass)
      KEYSTORE_PASS="$2"
      shift 2
      ;;
    --key-pass)
      KEY_PASS="$2"
      shift 2
      ;;
    --fingerprint)
      EXPECTED_FINGERPRINT="$2"
      shift 2
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Error: Unknown option: $1" >&2
      print_usage
      exit 1
      ;;
  esac
done

if [[ "$MODE" != "debug" && "$MODE" != "release" ]]; then
  echo "Error: Invalid mode '$MODE'. Must be 'debug' or 'release'." >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Configuring Android environment..."
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
# Discover latest installed NDK version if not explicitly set
if [ -z "${NDK_HOME:-}" ]; then
  if [ -d "$ANDROID_HOME/ndk" ]; then
    NDK_HOME=$(ls -d "$ANDROID_HOME/ndk/"* 2>/dev/null | sort -V | tail -n 1)
    export NDK_HOME
  fi
fi
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

# Discover latest installed build-tools version
BUILD_TOOLS_DIR=$(ls -d "$ANDROID_HOME/build-tools/"* 2>/dev/null | sort -V | tail -n 1)
if [ -z "$BUILD_TOOLS_DIR" ] || [ ! -x "$BUILD_TOOLS_DIR/zipalign" ] || [ ! -x "$BUILD_TOOLS_DIR/apksigner" ]; then
  echo "Error: No valid Android build-tools with zipalign/apksigner found under $ANDROID_HOME/build-tools" >&2
  exit 1
fi
echo "==> Using Android build-tools at: $BUILD_TOOLS_DIR"
if [ -n "${NDK_HOME:-}" ]; then
  echo "==> Using Android NDK at: $NDK_HOME"
fi

if [[ "$MODE" == "release" ]]; then
  echo "==> Running in RELEASE mode (fail-closed signing verification)"
  if [[ -z "$KEYSTORE" ]]; then
    echo "Error: In release mode, KEYSTORE must be specified via --keystore or \$KEYSTORE." >&2
    exit 1
  fi
  if [[ ! -f "$KEYSTORE" ]]; then
    echo "Error: Keystore file does not exist at: $KEYSTORE" >&2
    exit 1
  fi
  if [[ -z "$KEY_ALIAS" ]]; then
    echo "Error: In release mode, KEY_ALIAS must be specified via --alias or \$KEY_ALIAS." >&2
    exit 1
  fi
  if [[ -z "$KEYSTORE_PASS" ]]; then
    echo "Error: In release mode, KEYSTORE_PASS must be specified via --keystore-pass or \$KEYSTORE_PASS." >&2
    exit 1
  fi
  if [[ -z "$KEY_PASS" ]]; then
    echo "Error: In release mode, KEY_PASS must be specified via --key-pass or \$KEY_PASS." >&2
    exit 1
  fi
else
  echo "==> Running in DEBUG mode (local development)"
  KEYSTORE="${KEYSTORE:-$HOME/.android/debug.keystore}"
  KEYSTORE_PASS="${KEYSTORE_PASS:-pass:android}"
  KEY_ALIAS="${KEY_ALIAS:-androiddebugkey}"
  KEY_PASS="${KEY_PASS:-pass:android}"

  if [ ! -f "$KEYSTORE" ]; then
    echo "==> Debug keystore not found at $KEYSTORE. Creating one..."
    mkdir -p "$(dirname "$KEYSTORE")"
    keytool -genkey -v -keystore "$KEYSTORE" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
  fi
fi

# Format passwords with pass: prefix if not already formatted
if [[ "$KEYSTORE_PASS" != pass:* && "$KEYSTORE_PASS" != env:* && "$KEYSTORE_PASS" != file:* ]]; then
  KEYSTORE_PASS="pass:$KEYSTORE_PASS"
fi
if [[ "$KEY_PASS" != pass:* && "$KEY_PASS" != env:* && "$KEY_PASS" != file:* ]]; then
  KEY_PASS="pass:$KEY_PASS"
fi

echo "==> Building frontend bundle..."
npm run build

echo "==> Building Android release bundle via Tauri (aarch64)..."
npm run tauri android build -- --apk --target aarch64

UNSIGNED_APK="$REPO_ROOT/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"
if [ ! -f "$UNSIGNED_APK" ]; then
  # Fallback discovery
  UNSIGNED_APK=$(find "$REPO_ROOT/src-tauri/gen/android/app/build/outputs/apk/" -type f -name "*unsigned.apk" | head -n 1)
fi
if [ -z "$UNSIGNED_APK" ] || [ ! -f "$UNSIGNED_APK" ]; then
  echo "Error: Unsigned APK was not found under build outputs" >&2
  exit 1
fi
echo "==> Located unsigned APK at: $UNSIGNED_APK"

OUTPUT_DIR="$REPO_ROOT/release-apk"
mkdir -p "$OUTPUT_DIR"
ALIGNED_TMP=$(mktemp /tmp/ccna-aligned.XXXXXX.apk)
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

echo "==> Verifying signed APK with apksigner..."
"$BUILD_TOOLS_DIR/apksigner" verify --verbose --print-certs "$OUTPUT_APK"

# Extract actual certificate SHA-256
ACTUAL_FINGERPRINT=$("$BUILD_TOOLS_DIR/apksigner" verify --print-certs "$OUTPUT_APK" | grep -i "SHA-256 digest" | head -n 1 | awk '{print tolower($NF)}' | tr -d ':\r\n ')
echo "==> Signer certificate SHA-256: $ACTUAL_FINGERPRINT"

if [ -n "$EXPECTED_FINGERPRINT" ]; then
  NORM_EXPECTED=$(echo "$EXPECTED_FINGERPRINT" | tr '[:upper:]' '[:lower:]' | tr -d ':\r\n ')
  if [ "$ACTUAL_FINGERPRINT" != "$NORM_EXPECTED" ]; then
    echo "Error: Certificate fingerprint mismatch!" >&2
    echo "  Expected: $NORM_EXPECTED" >&2
    echo "  Actual:   $ACTUAL_FINGERPRINT" >&2
    exit 1
  fi
  echo "==> Fingerprint verification PASSED: matches expected fingerprint"
fi

echo "==> Done!"
echo "Signed APK available at:"
echo "  - $OUTPUT_APK"
echo "  - $REPO_ROOT/ccna-practice.apk"
ls -lh "$OUTPUT_APK"
sha256sum "$OUTPUT_APK"
