#!/bin/sh
# KalaSearch — PHP syntax lint for the cPanel backend (POSIX sh compatible).
# Usage:  sh scripts/php-lint.sh
set -eu

FAILED=0
FILES=$(find php-api -name '*.php' -type f | sort)
if [ -z "$FILES" ]; then
  echo "No PHP files found under php-api/."
  exit 1
fi

for f in $FILES; do
  OUT=$(php -l "$f" 2>&1) || { echo "FAIL  $f"; echo "$OUT"; FAILED=1; continue; }
  echo "OK    $f"
done

if [ "$FAILED" -ne 0 ]; then
  echo "PHP lint FAILED."
  exit 1
fi
echo "PHP lint passed ($(echo "$FILES" | wc -l) files)."