#!/usr/bin/env bash

# Note: CGO_ENABLED is set to zero in this script because we are
# not using any CGO dependencies. If CGO happens to be enabled in
# the greater environment, we want to override it here to prevent
# cross compilation failures. For details on why we do this, see
# https://stackoverflow.com/questions/77293369/dynamic-linked-go-program-when-cross-compile

# While DART does use SQLite, we're using the pure Go driver from
# https://pkg.go.dev/modernc.org/sqlite. So, no C interop required.

if [ -z $(ls scripts/build_dart.sh 2> /dev/null) ]; then
    echo "Run this script from the project root directory"
    exit
fi

COMMIT=$(git rev-parse --short HEAD)
#TAG=$(git describe --tags 2> /dev/null)
DATE=$(date +%Y-%m-%d)
OS=$(uname -s)
ARCH=$(uname -m)

BUILD_TAGS='-tags release'

# uname returns MINGW64_NT-10.0 on Windows 10 Cygwin
# and MSYS_NT-10.0 on Windows 10 cmd.
if [[ "$OS" == *"_NT-"* ]]; then
	OS="Windows $(uname -m)"
	BUILD_TAGS='-tags="release windows"'
fi

#TAG="${TAG:=Alpha-01}"

VERSION="DART Alpha-01 for Darwin amd64 (Build $COMMIT $DATE)"
echo "Building MacOS amd64 version in ./dist/mac-amd64/dart3"
mkdir -p dist/mac-amd64
#mkdir -p dist/mac-amd64/dart3.app/Contents/MacOS
#mkdir -p dist/mac-amd64/dart3.app/Contents/Resources
#cp server/build_support/macos/Info.plist dist/mac-amd64/dart3.app/Contents/Info.plist
#cp server/build_support/macos/icons/icon.icns dist/mac-amd64/dart3.app/Contents/Resources/icon.icns
GOOS=darwin \
	GOARCH=amd64 \
	CGO_ENABLED=0 \
	go build -o dist/mac-amd64/dart3 \
	-ldflags "-X 'main.Version=$VERSION'" \
	$BUILD_TAGS dart/main.go

VERSION="DART Alpha-01 for Darwin arm64 (Build $COMMIT $DATE)"
echo "Building MacOS arm-64 (M-chip) version in ./dist/mac-arm64/dart3"
mkdir -p dist/mac-arm64
#mkdir -p dist/mac-arm64/dart3.app/Contents/MacOS
#mkdir -p dist/mac-arm64/dart3.app/Contents/Resources
#cp server/build_support/macos/Info.plist dist/mac-arm64/dart3.app/Contents/Info.plist
#cp server/build_support/macos/icons/* dist/mac-arm64/dart3.app/Contents/Resources/
GOOS=darwin \
	GOARCH=arm64 \
	CGO_ENABLED=0 \
	go build -o dist/mac-arm64/dart3 \
	-ldflags "-X 'main.Version=$VERSION'" \
	$BUILD_TAGS dart/main.go


# Note: When running `./scripts/run tests`, post_build_test.go uses its own special build command for Windows.
VERSION="DART Alpha-01 for Windows amd64 (Build $COMMIT $DATE)"
echo "Building Windows amd64 version in ./dist/windows-amd64/dart3"
mkdir -p dist/windows-amd64
GOOS=windows \
	GOARCH=amd64 \
	CGO_ENABLED=0 \
	go build -o dist/windows-amd64/dart3.exe \
	-ldflags "-X 'main.Version=$VERSION' -H=windowsgui" \
	$BUILD_TAGS dart/main.go

VERSION="DART Alpha-01 for Windows arm64 (Build $COMMIT $DATE)"
echo "Building Windows arm64 version in ./dist/windows-arm64/dart3"
mkdir -p dist/windows-arm64
GOOS=windows \
	GOARCH=arm64 \
	CGO_ENABLED=0 \
	go build -o dist/windows-arm64/dart3.exe \
	-ldflags "-X 'main.Version=$VERSION' -H=windowsgui" \
	$BUILD_TAGS dart/main.go


VERSION="DART Alpha-01 for Linux amd64 (Build $COMMIT $DATE)"
echo "Building Linux amd64 version in ./dist/linux-amd64/dart3"
mkdir -p dist/linux-amd64
GOOS=linux \
	GOARCH=amd64 \
	CGO_ENABLED=0 \
	go build -o dist/linux-amd64/dart3 \
	-ldflags "-X 'main.Version=$VERSION'" \
	$BUILD_TAGS dart/main.go


VERSION="DART Alpha-01 for Linux arm64 (Build $COMMIT $DATE)"
echo "Building Linux arm64 version in ./dist/linux-arm64/dart3"
mkdir -p dist/linux-arm64
GOOS=linux \
	GOARCH=arm64 \
	CGO_ENABLED=0 \
	go build -o dist/linux-arm64/dart3 \
	-ldflags "-X 'main.Version=$VERSION'" \
	$BUILD_TAGS dart/main.go


echo "Version info from latest build:"
if [[ "$OS" == "Darwin" ]]; then
    if [[ "$ARCH" == "x86_64" ]]; then
        dist/mac-amd64/dart3 --version
    else
        dist/mac-arm64/dart3 --version
    fi
elif [[ "$OS" == "Linux" ]]; then
    if [[ "$ARCH" == "x86_64" ]]; then
        dist/linux-amd64/dart3 --version
    else
        dist/linux-arm64/dart3 --version
    fi
else
    if [[ "$ARCH" == "x86_64" ]]; then
        dist/windows-amd64/dart3.exe --version
    else
        dist/windows-arm64/dart3.exe --version
    fi
fi
