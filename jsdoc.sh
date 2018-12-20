#! /usr/bin/env bash
echo "Generating documentation..."
find . -type f -name "*.js" -not -path "*/node_modules/*" -not -path "*/docs/*" -not -path "*/apps/bin" | xargs documentation build -f html -o docs --sort-order alpha
echo "New doc is in docs/index.html"

echo "Hello, Travis! You there?"
if [[ -z "${TRAVIS}" ]]; then
    echo "No Travis here. I'm done here."
    exit;
else
    echo "Travis: Yup, here."
    git config --global user.email "travis@travis-ci.org"
    git config --global user.name "travis-ci"
    git add docs
    git commit -m "Latest docs on successful travis build $TRAVIS_BUILD_NUMBER auto-pushed to gh-pages"
   git push -fq origin master > /dev/null
fi

