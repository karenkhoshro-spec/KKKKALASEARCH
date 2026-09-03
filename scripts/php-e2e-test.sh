#!/bin/sh
# ============================================================================
# KalaSearch — PHP/MySQL API end-to-end test (no Node.js, no Vite).
#
# Boots the real PHP front controller (php-api/index.php) with PHP's built-in
# web server and exercises the whole flow over HTTP:
#   health → checkout (server-computed totals) → customer lookup → isolation
#   → admin 401 → login → session → admin orders (images) → status update
#   → SERVER RESTART persistence → logout revocation
#
# Prerequisites (on the machine running the test):
#   php-cli with pdo_mysql + mbstring, curl, jq, a running MySQL/MariaDB with
#   database/schema.sql imported into the database named by DB_NAME.
#
# Usage:
#   DB_NAME=kalasearch_test DB_USER=ks_test DB_PASSWORD='...' \
#     sh scripts/php-e2e-test.sh
# Exit code 0 = all checks passed.
# ============================================================================
set -eu

PORT="${PORT:-8795}"
DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-kalasearch_test}"
DB_USER="${DB_USER:-ks_test}"
DB_PASSWORD="${DB_PASSWORD:-}"
ADMIN_USERNAME="${ADMIN_USERNAME:-karen}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-test-admin-pass}"
ADMIN_SESSION_SECRET="${ADMIN_SESSION_SECRET:-e2e-session-secret-change-me}"

BASE="http://127.0.0.1:$PORT"
LOG=/tmp/kalasearch-php-e2e.log
FAILURES=0
TOKEN=""

check() { # label actual expected
    if [ "$2" = "$3" ]; then
        echo "  ok  $1"
    else
        echo "FAIL  $1  (got: [$2] want: [$3])"
        FAILURES=$((FAILURES + 1))
    fi
}

# --- start the PHP API ------------------------------------------------------
ADMIN_HASH=$(php -r "echo password_hash('$ADMIN_PASSWORD', PASSWORD_DEFAULT);")
env \
    DB_HOST="$DB_HOST" DB_NAME="$DB_NAME" DB_USER="$DB_USER" DB_PASSWORD="$DB_PASSWORD" \
    ADMIN_USERNAME="$ADMIN_USERNAME" ADMIN_PASSWORD_HASH="$ADMIN_HASH" \
    ADMIN_SESSION_SECRET="$ADMIN_SESSION_SECRET" \
    php -S 127.0.0.1:"$PORT" php-api/index.php >"$LOG" 2>&1 &
SRV_PID=$!
cleanup() {
    kill "$SRV_PID" 2>/dev/null || true
    wait "$SRV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

i=0
until curl -sf -m 1 "$BASE/api/health" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -gt 25 ]; then
        echo "PHP server did not become ready — log:"; cat "$LOG"; exit 1
    fi
    sleep 0.4
done
echo "PHP API is up (pid $SRV_PID)."

BODY=/tmp/kalasearch-php-e2e-body.json
req() { # method path [json-file]
    METHOD="$1"; PATH_="$2"; DATA="${3:-}"
    if [ -n "$DATA" ]; then
        curl -s -o "$BODY" -w '%{http_code}' -X "$METHOD" \
            -H 'Content-Type: application/json' \
            -H "Authorization: Bearer ${TOKEN:-}" \
            --data-binary @"$DATA" "$BASE$PATH_"
    else
        curl -s -o "$BODY" -w '%{http_code}' -X "$METHOD" \
            -H "Authorization: Bearer ${TOKEN:-}" "$BASE$PATH_"
    fi
}
json() { jq -r "$1" "$BODY"; }

echo "== 1. health =="
CODE=$(req GET /api/health)
check "GET /api/health → 200" "$CODE" "200"
check "health body {ok:true}" "$(json .ok)" "true"

echo "== 2. checkout (server recomputes totals; client total is tampered) =="
cat > /tmp/ks-order.json <<'JSON'
{
  "customer": {
    "name": "Ali Rezaei",
    "phone": "09123456789",
    "email": "ali@example.com",
    "province": "Tehran",
    "city": "Tehran",
    "address": "Azadi St, No 12",
    "postalCode": "1234567890",
    "notes": "deliver after 6pm"
  },
  "items": [
    {
      "productId": "8039010",
      "productCode": "8039010",
      "sku": "4030",
      "name": "Shopping Basket 4030",
      "variation": "Red",
      "color": "Red",
      "quantity": 2,
      "unitPrice": 120000,
      "image": "https://img.example.com/4030.jpg"
    },
    {
      "productId": "7025010",
      "productCode": "7025010",
      "sku": "22212",
      "name": "Container 22212",
      "quantity": 1,
      "unitPrice": 452000,
      "image": "https://img.example.com/22212.jpg"
    }
  ],
  "total": 1
}
JSON
CODE=$(req POST /api/orders /tmp/ks-order.json)
check "POST /api/orders → 201" "$CODE" "201"
ORDER_NO=$(json .order.orderNumber)
check "order number matches KS-YYYYMMDD-XXXXXX" "$(echo "$ORDER_NO" | grep -Ec '^KS-[0-9]{8}-[A-F0-9]{6}$')" "1"
check "grand total server-computed (692000, tampered 1 ignored)" "$(json .order.total)" "692000"
check "lineTotal item 0" "$(json '.order.items[0].lineTotal')" "240000"
check "lineTotal item 1" "$(json '.order.items[1].lineTotal')" "452000"
check "status registered" "$(json .order.status)" "registered"
check "paymentStatus unpaid" "$(json .order.paymentStatus)" "unpaid"
check "image snapshot item 0" "$(json '.order.items[0].image')" "https://img.example.com/4030.jpg"
check "image snapshot item 1" "$(json '.order.items[1].image')" "https://img.example.com/22212.jpg"
check "sku snapshot item 0" "$(json '.order.items[0].sku')" "4030"
check "customer email round-trips" "$(json '.order.customer.email')" "ali@example.com"
check "postal code round-trips" "$(json '.order.customer.postalCode')" "1234567890"
check "document filename" "$(json '.order.document.filename')" "$ORDER_NO.pdf"
check "createdAt is ISO-8601 UTC" "$(echo "$(json .order.createdAt)" | grep -Ec '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$')" "1"

echo "== 3. validation rejects =="
cat > /tmp/ks-bad.json <<'JSON'
{ "customer": { "name": "", "phone": "123", "province": "", "city": "", "address": "", "postalCode": "1" }, "items": [] }
JSON
CODE=$(req POST /api/orders /tmp/ks-bad.json)
check "invalid payload → 400" "$CODE" "400"
check "first validation error is name_required" "$(json .error)" "name_required"

echo "== 4. customer lookup + isolation =="
CODE=$(req GET "/api/customer/orders?phone=09123456789")
check "customer orders → 200" "$CODE" "200"
check "customer sees the order" "$(json ".orders | map(select(.orderNumber == \"$ORDER_NO\")) | length")" "1"
CODE=$(req GET "/api/customer/orders?phone=09351112233")
check "other phone sees nothing" "$(json ".orders | length")" "0"
CODE=$(req GET "/api/orders/$ORDER_NO?phone=09351112233")
check "other phone single-order GET → 404" "$CODE" "404"
check "…with not_found" "$(json .error)" "not_found"
CODE=$(req GET "/api/orders/$ORDER_NO?phone=09123456789")
check "owner single-order GET → 200" "$CODE" "200"

echo "== 5. admin auth =="
CODE=$(req GET /api/admin/orders)
check "admin orders without token → 401" "$CODE" "401"
check "…with unauthorized" "$(json .error)" "unauthorized"
cat > /tmp/ks-login.json <<JSON
{ "username": "$ADMIN_USERNAME", "password": "wrong-password" }
JSON
CODE=$(req POST /api/admin/login /tmp/ks-login.json)
check "wrong password → 401" "$CODE" "401"
check "…with invalid_credentials" "$(json .error)" "invalid_credentials"
cat > /tmp/ks-login.json <<JSON
{ "username": "$ADMIN_USERNAME", "password": "$ADMIN_PASSWORD" }
JSON
CODE=$(req POST /api/admin/login /tmp/ks-login.json)
check "correct password → 200" "$CODE" "200"
TOKEN=$(json .token)
check "token issued (non-empty)" "$([ -n "$TOKEN" ] && echo yes)" "yes"
CODE=$(req GET /api/admin/session)
check "session check with token → 200" "$CODE" "200"

echo "== 6. admin orders (images + snapshots) =="
CODE=$(req GET /api/admin/orders)
check "admin orders with token → 200" "$CODE" "200"
check "new order in admin list" "$(json ".orders | map(select(.orderNumber == \"$ORDER_NO\")) | length")" "1"
check "admin sees 2 items" "$(json ".orders[] | select(.orderNumber == \"$ORDER_NO\") | .items | length")" "2"
check "item image URL present in admin response" "$(json ".orders[] | select(.orderNumber == \"$ORDER_NO\") | .items[0].image")" "https://img.example.com/4030.jpg"
check "product code present" "$(json ".orders[] | select(.orderNumber == \"$ORDER_NO\") | .items[0].productCode")" "8039010"
check "product name snapshot present" "$(json ".orders[] | select(.orderNumber == \"$ORDER_NO\") | .items[1].name")" "Container 22212"
check "variation present" "$(json ".orders[] | select(.orderNumber == \"$ORDER_NO\") | .items[0].variation")" "Red"
check "quantity present" "$(json ".orders[] | select(.orderNumber == \"$ORDER_NO\") | .items[0].quantity")" "2"
check "unit price present" "$(json ".orders[] | select(.orderNumber == \"$ORDER_NO\") | .items[0].unitPrice")" "120000"
check "total present" "$(json ".orders[] | select(.orderNumber == \"$ORDER_NO\") | .total")" "692000"

echo "== 7. status update =="
cat > /tmp/ks-status.json <<'JSON'
{ "status": "delivered" }
JSON
CODE=$(req PATCH "/api/admin/orders/$ORDER_NO/status" /tmp/ks-status.json)
check "PATCH status → 200" "$CODE" "200"
check "status now delivered" "$(json .order.status)" "delivered"
echo '{"status":"bogus"}' > /tmp/ks-status.json
CODE=$(req PATCH "/api/admin/orders/$ORDER_NO/status" /tmp/ks-status.json)
check "invalid status → 400" "$CODE" "400"
check "…with invalid_status" "$(json .error)" "invalid_status"

echo "== 8. RESTART persistence (MySQL survives process kill) =="
kill "$SRV_PID"
wait "$SRV_PID" 2>/dev/null || true
env \
    DB_HOST="$DB_HOST" DB_NAME="$DB_NAME" DB_USER="$DB_USER" DB_PASSWORD="$DB_PASSWORD" \
    ADMIN_USERNAME="$ADMIN_USERNAME" ADMIN_PASSWORD_HASH="$ADMIN_HASH" \
    ADMIN_SESSION_SECRET="$ADMIN_SESSION_SECRET" \
    php -S 127.0.0.1:"$PORT" php-api/index.php >"$LOG" 2>&1 &
SRV_PID=$!
i=0
until curl -sf -m 1 "$BASE/api/health" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -gt 25 ]; then echo "server did not restart"; cat "$LOG"; exit 1; fi
    sleep 0.4
done
CODE=$(req GET /api/admin/orders)
check "order survives restart" "$(json ".orders | map(select(.orderNumber == \"$ORDER_NO\")) | length")" "1"
check "delivered status survives restart" "$(json ".orders[] | select(.orderNumber == \"$ORDER_NO\") | .status")" "delivered"
CODE=$(req GET /api/admin/session)
check "session token survives restart (DB-backed) → 200" "$CODE" "200"

echo "== 9. logout revokes the token =="
CODE=$(req POST /api/admin/logout)
check "logout → 200" "$CODE" "200"
check "…with {ok:true}" "$(json .ok)" "true"
CODE=$(req GET /api/admin/session)
check "revoked token → 401" "$CODE" "401"
CODE=$(req GET /api/admin/orders)
check "revoked token admin orders → 401" "$CODE" "401"

echo "== 10. unknown API route =="
CODE=$(req GET /api/nope)
check "unknown /api route → 404" "$CODE" "404"
check "…with not_found" "$(json .error)" "not_found"

echo
if [ "$FAILURES" -eq 0 ]; then
    echo "PHP e2e: ALL CHECKS PASSED (order $ORDER_NO)."
    exit 0
else
    echo "PHP e2e: $FAILURES check(s) FAILED."
    exit 1
fi