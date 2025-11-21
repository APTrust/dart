#!/bin/bash

###########################################
# macOS Code Signing & Notarization Script
# For Wails/Go Applications
#
# Run this script from the top-level DART
# project directory.
###########################################

set -e  # Exit on any error


# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Note that you need to set the following env vars:
#
# $APPLE_CERT   - Absolute path to your Apple code-signing certificate,
#                 which is a .p12 file
# $APPLE_ID     - Your Apple Developer ID (an email address)
#
# $TEAM_ID      - 10-character Apple Developer team id (see your Apple
#                 developer account for this)
#
# $APP_PASSWORD - App-specific password for DART. You have to set this
#                 up at appleid.apple.com.
#
# Also, be sure to set IDENTITY_NAME correctly below.

# Configuration
APP_NAME="DART"
APP_BUNDLE="build/bin/${APP_NAME}.app"
CERT_FILE=$APPLE_CERT
CERT_PASSWORD=""  # Will prompt if not set
IDENTITY_NAME="Developer ID Application: Your Name (TEAMID)"  # e.g., "Developer ID Application: Your Name (TEAMID)"
APPLE_ID=$APPLE_ID       # Your Apple ID email
TEAM_ID=$APPLE_TEAM_ID        # Your 10-character Team ID
APP_PASSWORD=$APPLE_DART_PASSWORD   # App-specific password from appleid.apple.com

# Derived variables
KEYCHAIN_NAME="signing.keychain-db"
KEYCHAIN_PASSWORD=$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32)
DMG_NAME="${APP_NAME}-signed.dmg"
ZIP_NAME="${APP_NAME}-signed.zip"
ENTITLEMENTS_FILE="entitlements.plist"

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    if [ ! -f "$CERT_FILE" ]; then
        print_error "Certificate file not found: $CERT_FILE"
        exit 1
    fi

    if [ ! -d "$APP_BUNDLE" ]; then
        print_error "App bundle not found: $APP_BUNDLE"
        exit 1
    fi

    if ! command -v codesign &> /dev/null; then
        print_error "codesign not found. Are you on macOS?"
        exit 1
    fi

    if ! command -v xcrun &> /dev/null; then
        print_error "xcrun not found. Please install Xcode Command Line Tools."
        exit 1
    fi

    print_status "Prerequisites check passed"
}

# Prompt for missing credentials
prompt_credentials() {
    if [ -z "$CERT_PASSWORD" ]; then
        read -sp "Enter certificate password: " CERT_PASSWORD
        echo
    fi

    if [ -z "$IDENTITY_NAME" ]; then
        read -p "Enter signing identity (e.g., 'Developer ID Application: Your Name (TEAMID)'): " IDENTITY_NAME
    fi

    if [ -z "$APPLE_ID" ]; then
        read -p "Enter Apple ID email: " APPLE_ID
    fi

    if [ -z "$TEAM_ID" ]; then
        read -p "Enter Team ID (10 characters): " TEAM_ID
    fi

    if [ -z "$APP_PASSWORD" ]; then
        read -sp "Enter app-specific password: " APP_PASSWORD
        echo
    fi
}

# Create temporary keychain
create_keychain() {
    print_info "Creating temporary keychain..."

    # Delete keychain if it already exists
    security delete-keychain "$KEYCHAIN_NAME" 2>/dev/null || true

    # Create new keychain
    security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"
    security set-keychain-settings -lut 21600 "$KEYCHAIN_NAME"
    security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

    # Add to search list
    security list-keychains -d user -s "$KEYCHAIN_NAME" $(security list-keychains -d user | sed s/\"//g)

    print_status "Keychain created"
}

# Import certificate
import_certificate() {
    print_info "Importing certificate..."

    security import "$CERT_FILE" \
        -k "$KEYCHAIN_NAME" \
        -P "$CERT_PASSWORD" \
        -T /usr/bin/codesign \
        -T /usr/bin/security

    # Set partition list to avoid repeated password prompts
    security set-key-partition-list \
        -S apple-tool:,apple: \
        -s \
        -k "$KEYCHAIN_PASSWORD" \
        "$KEYCHAIN_NAME" >/dev/null 2>&1

    print_status "Certificate imported"
}

# Create entitlements file
create_entitlements() {
    print_info "Creating entitlements file..."

    cat > "$ENTITLEMENTS_FILE" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <false/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
</dict>
</plist>
EOF

    print_status "Entitlements file created"
}

# Sign the application
sign_app() {
    print_info "Signing application bundle..."

    # Sign all nested frameworks and libraries first
    find "$APP_BUNDLE/Contents" -type f \( -name "*.dylib" -o -name "*.framework" \) -print0 | while IFS= read -r -d '' file; do
        print_info "Signing: $file"
        codesign --force --sign "$IDENTITY_NAME" \
            --timestamp \
            --options runtime \
            "$file" 2>/dev/null || true
    done

    # Sign the main executable
    print_info "Signing main executable..."
    codesign --force --sign "$IDENTITY_NAME" \
        --entitlements "$ENTITLEMENTS_FILE" \
        --timestamp \
        --options runtime \
        "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

    # Sign the entire app bundle
    print_info "Signing app bundle..."
    codesign --force --sign "$IDENTITY_NAME" \
        --entitlements "$ENTITLEMENTS_FILE" \
        --timestamp \
        --options runtime \
        --deep \
        "$APP_BUNDLE"

    print_status "Application signed successfully"
}

# Verify signature
verify_signature() {
    print_info "Verifying signature..."

    codesign --verify --deep --strict --verbose=2 "$APP_BUNDLE"
    spctl --assess --type execute --verbose=4 "$APP_BUNDLE"

    print_status "Signature verified"
}

# Create DMG for distribution
create_dmg() {
    print_info "Creating DMG..."

    rm -f "$DMG_NAME"

    hdiutil create -volname "$APP_NAME" \
        -srcfolder "$APP_BUNDLE" \
        -ov -format UDZO \
        "$DMG_NAME"

    print_status "DMG created: $DMG_NAME"
}

# Create ZIP for notarization
create_zip() {
    print_info "Creating ZIP for notarization..."

    rm -f "$ZIP_NAME"

    ditto -c -k --keepParent "$APP_BUNDLE" "$ZIP_NAME"

    print_status "ZIP created: $ZIP_NAME"
}

# Submit for notarization
notarize_app() {
    print_info "Submitting for notarization..."
    print_info "This may take several minutes..."

    # Submit using notarytool
    SUBMISSION_ID=$(xcrun notarytool submit "$ZIP_NAME" \
        --apple-id "$APPLE_ID" \
        --team-id "$TEAM_ID" \
        --password "$APP_PASSWORD" \
        --wait \
        --output-format json | grep -o '"id":"[^"]*' | cut -d'"' -f4)

    if [ -z "$SUBMISSION_ID" ]; then
        print_error "Failed to get submission ID"
        exit 1
    fi

    print_info "Submission ID: $SUBMISSION_ID"

    # Check status
    STATUS=$(xcrun notarytool info "$SUBMISSION_ID" \
        --apple-id "$APPLE_ID" \
        --team-id "$TEAM_ID" \
        --password "$APP_PASSWORD" \
        --output-format json | grep -o '"status":"[^"]*' | cut -d'"' -f4)

    if [ "$STATUS" == "Accepted" ]; then
        print_status "Notarization successful!"
    else
        print_error "Notarization failed with status: $STATUS"
        print_info "Getting log..."
        xcrun notarytool log "$SUBMISSION_ID" \
            --apple-id "$APPLE_ID" \
            --team-id "$TEAM_ID" \
            --password "$APP_PASSWORD"
        exit 1
    fi
}

# Staple the notarization ticket
staple_ticket() {
    print_info "Stapling notarization ticket..."

    xcrun stapler staple "$APP_BUNDLE"
    xcrun stapler staple "$DMG_NAME"

    print_status "Notarization ticket stapled"
}

# Cleanup
cleanup() {
    print_info "Cleaning up..."

    # Remove temporary keychain
    security delete-keychain "$KEYCHAIN_NAME" 2>/dev/null || true

    # Remove temporary files
    rm -f "$ZIP_NAME" "$ENTITLEMENTS_FILE"

    print_status "Cleanup complete"
}

# Main execution
main() {
    echo "======================================"
    echo "  macOS Code Signing & Notarization"
    echo "  App: $APP_NAME"
    echo "======================================"
    echo

    check_prerequisites
    prompt_credentials
    create_keychain
    import_certificate
    create_entitlements
    sign_app
    verify_signature
    create_zip
    notarize_app
    staple_ticket
    create_dmg
    cleanup

    echo
    print_status "All done! Your signed and notarized app is ready:"
    print_status "  - App Bundle: $APP_BUNDLE"
    print_status "  - DMG: $DMG_NAME"
    echo
}

# Run main function
main
