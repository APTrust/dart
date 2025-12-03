#!/usr/bin/env bash
#
# Build the DART Wails app and stamp it with the correct tag/release number.
#
# ----------------------------------------------------------------------------

# Make sure script is called from the top-level directory
if [ -z $(ls scripts/build_dart.sh 2> /dev/null) ]; then
    echo "Run this script from the project root directory"
    exit
fi

# Gather variables from Git and the local OS so we can tag
# this release. These vars show up in the Release number
# displayed on DART's About screen. They also appear if the
# user runs `DART -version`.
COMMIT=$(git rev-parse --short HEAD)
TAG=$(git describe --tags 2> /dev/null)
if [ -z "$TAG" ]; then
    TAG="undefined"
fi
DATE=$(date +%Y-%m-%d)
OS=$(uname -s)
ARCH=$(uname -m)
BUILD_TAGS='-tags release'


# Special handling for the special child of the OS world.
# uname returns MINGW64_NT-10.0 on Windows 10 Cygwin
# and MSYS_NT-10.0 on Windows 10 cmd.
if [[ "$OS" == *"_NT-"* ]]; then
	OS="Windows $(uname -m)"
	BUILD_TAGS='-tags="release windows"'
fi

# Create the full version string.
VERSION="DART $TAG for $OS $ARCH (Build $COMMIT $DATE)"

# Now run wails build with the proper tags and version
# number.
wails build $BUILD_TAGS -ldflags "-X 'main.Version=$VERSION'"
