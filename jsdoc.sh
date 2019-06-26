#! /usr/bin/env bash
#set -x
echo "Generating documentation..."
./node_modules/.bin/jsdoc -c .jsdoc.json -t node_modules/braintree-jsdoc-template/ -d docs -r bagit/ core/ migrations/ plugins/ ui/ util/
echo "New doc is in docs/index.html"

#echo "Hello, Travis! You there?"
#if [[ -z "${TRAVIS}" ]]; then
#    echo "No Travis here. I'm done here."
#    exit;
#else
#    echo "Travis: Yup, here."
#    cd docs || exit
#    git config --global user.email "travis@travis-ci.org"
#    git config --global user.name "Travis-CI"
#    git init
#    git add .
#    git commit -m "Latest docs Travis build $TRAVIS_BUILD_NUMBER auto-pushed to gh-pages"
#    git push -v --force "https://${GH_TOKEN}@github.com/APTrust/dart.git" master:gh-pages
#fi
