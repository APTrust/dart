#! /usr/bin/env bash
echo "Generating documentation..."
find . -type f -name "*.js" -not -path "*/node_modules/*" -not -path "*/docs/*" | xargs documentation build -f html -o docs --sort-order alpha
echo "New doc is in docs/index.html"
