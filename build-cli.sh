#!/bin/bash

echo 'Building dart-cli'

./node_modules/.bin/nexe -i apps/dart-cli.js -o apps/bin/dart-cli -t mac-x64-10.13.0

# --debugBundle=apps/bin/bundle.js

echo 'Executable is in ./apps/bin/dart-cli'
echo ''
echo 'Show version:'
echo ''
echo '  ./apps/bin/dart-cli -- --version'
echo ''
echo 'Show help:'
echo ''
echo '  ./apps/bin/dart-cli -- --help'
echo ''
echo 'Validate a (bad) bag:'
echo '  ./apps/bin/dart-cli -- --command validate-bag --profile test/profiles/aptrust_bagit_profile_2.2.json test/bags/aptrust/example.edu.tagsample_bad.tar'
echo ''
echo 'Validate a (good) bag with debug output:'
echo '  ./apps/bin/dart-cli -- --command validate-bag --profile test/profiles/dpn_bagit_profile_2.1.json --debug test/bags/dpn/a9f7cbab-b531-4eb7-b532-770f592629ba.tar'
echo ''
echo 'Validate a BagItProfile'
echo ''
echo '  ./apps/bin/dart-cli -- --command validate-profile test/profiles/aptrust_bagit_profile_2.2.json'
echo ''
