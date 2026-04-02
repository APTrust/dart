#!/usr/bin/env bash
#
# release.sh - Build and release DART binaries to S3.
#
# Usage:
#   release.sh --pre-check <version>   Run pre-release checks only.
#   release.sh <version>               Build and release binaries.
#
# Example:
#   release.sh --pre-check beta-03
#   release.sh beta-03
#
# ----------------------------------------------------------------------------

set -euo pipefail

# ---------------------------------------------------------------------------
# Determine script and project directories
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
die() {
    echo "ERROR: $*" >&2
    exit 1
}

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
PRE_CHECK=false
VERSION=""

if [[ $# -eq 0 ]]; then
    die "Usage: release.sh [--pre-check] <version>  (e.g. release.sh beta-03)"
fi

if [[ "$1" == "--pre-check" ]]; then
    PRE_CHECK=true
    shift
fi

if [[ $# -eq 0 ]]; then
    die "Usage: release.sh [--pre-check] <version>  (e.g. release.sh beta-03)"
fi

VERSION="$1"

# ---------------------------------------------------------------------------
# Detect operating system
# ---------------------------------------------------------------------------
OS_RAW="$(uname -s)"
case "$OS_RAW" in
    Darwin*)  OS="mac"     ;;
    Linux*)   OS="linux"   ;;
    CYGWIN*|MINGW*|MSYS*) OS="windows" ;;
    *)        OS="unknown" ;;
esac

# ---------------------------------------------------------------------------
# Check required environment variables
# ---------------------------------------------------------------------------
check_env() {
    [[ -n "${AWS_ACCESS_KEY_ID:-}"     ]] || die "AWS_ACCESS_KEY_ID is not set in the environment."
    [[ -n "${AWS_SECRET_ACCESS_KEY:-}" ]] || die "AWS_SECRET_ACCESS_KEY is not set in the environment."
}

# ---------------------------------------------------------------------------
# Check that codesign.env exists (macOS only)
# ---------------------------------------------------------------------------
check_codesign_env() {
    if [[ "$OS" == "mac" ]]; then
        [[ -f "$PROJECT_DIR/codesign.env" ]] || \
            die "codesign.env not found in $PROJECT_DIR. This file is required for macOS builds."
    fi
}

# ---------------------------------------------------------------------------
# Check that git tag matches the requested version
# ---------------------------------------------------------------------------
check_git_tag() {
    local current_tag
    current_tag="$(git -C "$PROJECT_DIR" describe --tags --exact-match HEAD 2>/dev/null || true)"
    if [[ "$current_tag" != "$VERSION" ]]; then
        die "Current git tag ('${current_tag:-<none>}') does not match the requested version '$VERSION'. " \
            "Please create or check out tag '$VERSION' before releasing."
    fi
}

# ---------------------------------------------------------------------------
# Verify ReleaseNotes.md contains an h2 entry for this version with a date
# ---------------------------------------------------------------------------
check_release_notes() {
    local notes_file="$PROJECT_DIR/ReleaseNotes.md"
    [[ -f "$notes_file" ]] || die "ReleaseNotes.md not found in $PROJECT_DIR."

    # Match the first ## headline that contains the version string.
    # The headline may be prefixed (e.g. "## 3.0-beta-03 - January 30, 2026").
    local match
    local version_no_v="${VERSION#v}"
    match="$(grep -m1 "^## .*${version_no_v}" "$notes_file" || true)"

    if [[ -z "$match" ]]; then
        die "ReleaseNotes.md does not contain an h2 (##) section for '$VERSION'. " \
            "Please add release notes and a release date for this version before releasing."
    fi

    # Check that the matched line contains a date.
    # We look for a pattern like "January 30, 2026" or "Jan 30, 2026".
    if ! echo "$match" | grep -qE '[A-Za-z]+ [0-9]{1,2},? [0-9]{4}'; then
        die "The '## $VERSION' headline in ReleaseNotes.md does not include a release date. " \
            "Please add a date (e.g. 'January 30, 2026') to the headline before releasing."
    fi

    echo "ReleaseNotes.md: found entry for '$VERSION' with a release date."
}

# ---------------------------------------------------------------------------
# pre-check mode
# ---------------------------------------------------------------------------
run_pre_check() {
    echo "Running pre-release checks for version '$VERSION'..."
    check_release_notes
    check_git_tag
    check_env
    check_codesign_env
    echo "All pre-release checks passed."
}

# ---------------------------------------------------------------------------
# Full release
# ---------------------------------------------------------------------------
run_release() {
    # 1. Verify git tag
    check_git_tag

    # 2. Build binary
    echo "Building DART binary..."
    cd "$PROJECT_DIR"
    bash "$SCRIPT_DIR/build_dart.sh"

    # 3. macOS: sign and notarize
    if [[ "$OS" == "mac" ]]; then
        echo "Signing and notarizing for macOS."
        echo "This step can take a LONG time! Like 20 minutes!"
        cd "$PROJECT_DIR"
        bash "$SCRIPT_DIR/mac_sign_and_notarize.sh"
    fi

    # 4. Create S3 folders
    echo "Creating S3 folders for version '$VERSION'..."
    cd "$SCRIPT_DIR"
    go run s3_helper.go -make-folders -version "$VERSION" || \
        die "Failed to create S3 folders for version '$VERSION'."

    # 5. Determine arch and filepath, then upload
    local arch=""
    local filepath=""

    case "$OS" in
        mac)
            arch="mac-universal"
            filepath="$PROJECT_DIR/DART.dmg"
            ;;
        windows)
            arch="windows-amd64"
            # Rename to lowercase
            if [[ -f "$PROJECT_DIR/build/bin/DART.exe" ]]; then
                mv "$PROJECT_DIR/build/bin/DART.exe" "$PROJECT_DIR/build/bin/dart.exe"
            fi
            filepath="$PROJECT_DIR/build/bin/dart.exe"
            ;;
        linux)
            arch="linux-amd64"
            # Rename to lowercase
            if [[ -f "$PROJECT_DIR/build/bin/DART" ]]; then
                mv "$PROJECT_DIR/build/bin/DART" "$PROJECT_DIR/build/bin/dart"
            fi
            filepath="$PROJECT_DIR/build/bin/dart"
            ;;
        *)
            die "Unsupported operating system: $OS_RAW"
            ;;
    esac

    [[ -f "$filepath" ]] || die "Expected binary not found at: $filepath"

    echo "Uploading $filepath to S3 (arch: $arch, version: $VERSION)..."
    cd "$SCRIPT_DIR"
    go run s3_helper.go -upload -version "$VERSION" -arch "$arch" "$filepath" || \
        die "Failed to upload $filepath to S3."

    # 6. Print download links
    echo ""
    echo "Download links for version '$VERSION':"
    go run s3_helper.go -get-links "$VERSION" || \
        die "Failed to retrieve download links for version '$VERSION'."

    # 7. Print checklist
    cat <<EOF

Checklist:

1. Ensure that builds for Windows, Mac, and Linux are in aptrust.public.download.
2. Using the output from go run s3_helper.go -get-links ${VERSION} above, update the DART 3 version number, release date, links and sha256 checksums in the following places:
    a. https://github.com/APTrust/dart/blob/master/README.md#dart-3-installation
    b. https://github.com/APTrust/dart/blob/master/README_Dart3.md#getting-started
    c. https://github.com/APTrust/dart-docs/blob/master/docs/dart3/shared/downloads.md
3. After updating dart-docs, run \`mkdocs gh-deploy\` to publish the updates. Updates to the DART repo will be published simply by pushing changes to GitHub.
4. Send an email to dart-users@aptrust.org announcing the new release.
EOF
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if [[ "$PRE_CHECK" == "true" ]]; then
    run_pre_check
else
    check_env
    check_codesign_env
    run_release
fi
