#!/bin/bash

#
set -x
GCOMMIT=`git log -1 --pretty=format:%h`
DARTVER=`grep version electron/package.json |sed \"s/[^0-9.]//g\"`

# Update build artifact name
cd $TRAVIS_BUILD_DIR
mv electron/dist/DART-$DARTVER.dmg electron/dist/DART-$DARTVER.$GCOMMIT.dmg"

