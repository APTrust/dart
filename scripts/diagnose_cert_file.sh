#!/bin/bash

###########################################
# Certificate Diagnostic Script
###########################################

set -e

# Note: Env var $APPLE_CERT should be the absolute path to your
# Apple code-signing certificate, which is a .p12 file.

# Configuration
CERT_FILE=$APPLE_CERT
TEST_KEYCHAIN="test-cert.keychain-db"
TEST_PASSWORD=$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32)

echo "======================================"
echo "  Certificate Diagnostic Tool"
echo "======================================"
echo

# Check if cert file exists
if [ ! -f "$CERT_FILE" ]; then
    echo "❌ Certificate file not found: $CERT_FILE"
    exit 1
fi

echo "✓ Certificate file found: $CERT_FILE"
echo

# Ask for password
read -sp "Enter certificate password: " CERT_PASSWORD
echo
echo

# Create test keychain
echo "Creating temporary test keychain..."
security delete-keychain "$TEST_KEYCHAIN" 2>/dev/null || true
security create-keychain -p "$TEST_PASSWORD" "$TEST_KEYCHAIN"
security set-keychain-settings -lut 21600 "$TEST_KEYCHAIN"
security unlock-keychain -p "$TEST_PASSWORD" "$TEST_KEYCHAIN"
security list-keychains -d user -s "$TEST_KEYCHAIN" $(security list-keychains -d user | sed s/\"//g)

echo "✓ Test keychain created"
echo

# Try to import certificate
echo "Importing certificate..."
if security import "$CERT_FILE" \
    -k "$TEST_KEYCHAIN" \
    -P "$CERT_PASSWORD" \
    -T /usr/bin/codesign \
    -T /usr/bin/security \
    -A 2>&1 | tee /tmp/import_output.txt; then
    echo "✓ Certificate imported successfully"
else
    echo "❌ Certificate import failed!"
    echo "Error output:"
    cat /tmp/import_output.txt
    security delete-keychain "$TEST_KEYCHAIN" 2>/dev/null || true
    exit 1
fi

echo

# Set partition list
echo "Setting partition list..."
security set-key-partition-list \
    -S apple-tool:,apple: \
    -s \
    -k "$TEST_PASSWORD" \
    "$TEST_KEYCHAIN" >/dev/null 2>&1 || true

echo "✓ Partition list set"
echo

# Show all identities
echo "======================================"
echo "ALL IDENTITIES in test keychain:"
echo "======================================"
security find-identity -v "$TEST_KEYCHAIN"
echo

# Check for Developer ID Application
echo "======================================"
echo "DEVELOPER ID APPLICATION identities:"
echo "======================================"
security find-identity -v -p codesigning "$TEST_KEYCHAIN" | grep "Developer ID Application" || echo "❌ None found!"
echo

# Check for ANY codesigning identities
echo "======================================"
echo "ALL CODE SIGNING identities:"
echo "======================================"
security find-identity -v -p codesigning "$TEST_KEYCHAIN"
echo

# Try to extract the identity name
IDENTITY=$(security find-identity -v -p codesigning "$TEST_KEYCHAIN" | grep "Developer ID Application" | head -1 | sed -n 's/.*"\(.*\)"/\1/p')

if [ -n "$IDENTITY" ]; then
    echo "======================================"
    echo "✅ FOUND SIGNING IDENTITY:"
    echo "======================================"
    echo "$IDENTITY"
    echo
    echo "Use this exact string in your script:"
    echo "IDENTITY_NAME=\"$IDENTITY\""
else
    echo "======================================"
    echo "⚠️  NO DEVELOPER ID APPLICATION FOUND"
    echo "======================================"
    echo
    echo "Your certificate might be one of these types instead:"
    security find-identity -v -p codesigning "$TEST_KEYCHAIN" | grep -v "Developer ID Application" | grep ")" || echo "None found"
    echo
    echo "Common certificate types:"
    echo "  - 'Developer ID Application' = For distribution outside App Store ✅"
    echo "  - 'Apple Development' = For development/testing only ❌"
    echo "  - 'Apple Distribution' = For App Store only ❌"
    echo "  - 'Mac Developer' = Old development cert ❌"
    echo
    echo "You need a 'Developer ID Application' certificate for notarization."
    echo "Get one from: https://developer.apple.com/account/resources/certificates/list"
fi

echo

# Also check system keychain
echo "======================================"
echo "Checking system login keychain:"
echo "======================================"
security find-identity -v -p codesigning | grep "Developer ID Application" || echo "None found in login keychain"
echo

# Cleanup
echo "Cleaning up test keychain..."
security delete-keychain "$TEST_KEYCHAIN" 2>/dev/null || true
echo "✓ Done"
echo

echo "======================================"
echo "Summary:"
echo "======================================"
if [ -n "$IDENTITY" ]; then
    echo "✅ Your certificate is valid for code signing and notarization"
    echo "✅ Identity: $IDENTITY"
else
    echo "❌ No valid 'Developer ID Application' certificate found"
    echo "   You need to obtain this type of certificate from Apple Developer"
fi
