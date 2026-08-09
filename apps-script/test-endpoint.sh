#!/usr/bin/env bash
#
# Posts one test row to each sheet, without involving the website.
# Use it to confirm the Apps Script deployment and the spreadsheet work.
#
#   ./apps-script/test-endpoint.sh https://script.google.com/macros/s/AKfy.../exec
#
# Test rows are written with "Source page: local test" so they are easy to
# spot and delete afterwards.

set -euo pipefail

ENDPOINT="${1:-}"

if [ -z "$ENDPOINT" ]; then
  echo "usage: $0 <apps-script-exec-url>" >&2
  exit 1
fi

echo "→ health check"
curl -sL "$ENDPOINT"
echo

echo "→ contact form"
curl -sL "$ENDPOINT" \
  --data-urlencode 'form=contact' \
  --data-urlencode 'name=Local Test' \
  --data-urlencode 'email=test@example.com' \
  --data-urlencode 'message=Test row from test-endpoint.sh — safe to delete.' \
  --data-urlencode 'page=local test'
echo

echo "→ rfq form"
curl -sL "$ENDPOINT" \
  --data-urlencode 'form=rfq' \
  --data-urlencode 'rName=Local Test' \
  --data-urlencode 'rCompany=Test Co' \
  --data-urlencode 'rEmail=test@example.com' \
  --data-urlencode 'rPhone=+39 000 000 0000' \
  --data-urlencode 'rCountry=Italy' \
  --data-urlencode 'rProduct=Test row from test-endpoint.sh — safe to delete.' \
  --data-urlencode 'rQty=1 pc' \
  --data-urlencode 'rIncoterm=EXW' \
  --data-urlencode 'rDate=2026-01-01' \
  --data-urlencode 'page=local test'
echo

echo
echo 'Expected: {"ok":true} three times. Now check the Contact and RFQ tabs.'
