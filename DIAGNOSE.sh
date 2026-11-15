#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Make sure the dev proxy is up
if ! curl -s -o /dev/null "http://localhost:5173/" 2>/dev/null; then
  echo "❌ Vite is not running. Start it first: npm run dev"
  echo "   Then re-run this script in another terminal."
  exit 1
fi

echo "════════════════════════════════════════════════════════════"
echo "  BACKEND ENDPOINT DIAGNOSTIC"
echo "  (running against http://localhost:5173/be → backend)"
echo "════════════════════════════════════════════════════════════"
echo ""

# Get a real admin token from the browser's localStorage is not possible in bash.
# Instead we use your seed login. Change these if you have a different admin account.
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}"

echo "==> Attempting login as $ADMIN_EMAIL ..."
LOGIN=$(curl -s -X POST "http://localhost:5173/be/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>/dev/null || echo "FAIL")

if echo "$LOGIN" | grep -q "accessToken"; then
  TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null || echo "")
  echo "  ✓ Logged in, token acquired"
else
  TOKEN=""
  echo "  ⚠ Login failed. Testing endpoints WITHOUT auth (some will 401)."
  echo "    Response: $LOGIN"
  echo "    To fix: run  ADMIN_EMAIL=your@admin.com ADMIN_PASSWORD=yourpass ./DIAGNOSE.sh"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
printf "%-6s %-8s %s\n" "STATUS" "METHOD" "URL"
echo "════════════════════════════════════════════════════════════"

test_ep() {
  local method="$1"; local path="$2"; local desc="$3"
  local code
  if [ -n "$TOKEN" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "http://localhost:5173/be$path" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "ERR")
  else
    code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "http://localhost:5173/be$path" \
      -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "ERR")
  fi
  local status="❌"
  case "$code" in
    200|201|204|400|401|403|422) status="✓" ;;  # exists (even if it rejected our dummy body/auth)
    404) status="❌" ;;
    000|ERR) status="❌" ;;
  esac
  printf "%-6s %-8s %-55s %s\n" "$code" "$method" "$path" "$status"
}

# Events
test_ep GET   "/events?limit=50"                                "list events (public)"
test_ep GET   "/events/admin/all"                               "list ALL events (admin) ⚠ used by AdminDashboard"
test_ep GET   "/events/mine"                                    "list my events (organizer) ⚠ used by OrganizerDashboard"
test_ep GET   "/events/1"                                       "single event"

# Publish / restore
test_ep POST  "/events/1/publish"                               "publish event ⚠ used by admin restore"
test_ep PATCH "/events/1"                                       "PATCH event (status change) ⚠ used by admin cancel/restore"
test_ep DELETE "/events/1"                                      "DELETE event"

# Staff
test_ep GET   "/organizers/me/staff"                            "list organizer's staff"
test_ep POST  "/organizers/me/staff"                            "create staff account"
test_ep PUT   "/organizers/me/staff/1/events"                   "assign events to staff"
test_ep PATCH "/organizers/me/staff/1/active"                   "enable/disable staff"
test_ep DELETE "/organizers/me/staff/1"                         "remove staff"

# Staff-side (this is what the scanner needs)
test_ep GET   "/staff/tasks"                                    "staff's assigned tasks ⚠ used by ScannerPage"
test_ep GET   "/staff/me/events"                                "staff's assigned events ⚠ used by ScannerPage"
test_ep POST  "/tickets/validate"                               "validate ticket (scan)"

# Users (admin)
test_ep GET   "/users?limit=100"                                "list users"
test_ep PATCH "/users/1/active"                                 "enable/disable user"

# KYC
test_ep GET   "/organizers/me/kyc"                              "get organizer KYC"
test_ep PUT   "/organizers/me/kyc"                              "submit organizer KYC"

echo "════════════════════════════════════════════════════════════"
echo ""
echo "LEGEND:"
echo "  ✓  = endpoint EXISTS (returned 200/400/401/403/422 — any non-404)"
echo "  ❌ = endpoint is MISSING (404) or connection failed"
echo ""
echo "If any ⚠-marked endpoint is ❌, that's exactly what's broken."
echo "Take this list to your backend developer."
echo ""
echo "Expected endpoints the frontend calls but backend may not have:"
echo "  GET    /events/admin/all                (admin dashboard events list)"
echo "  POST   /events/:id/publish              (admin restore / organizer publish)"
echo "  GET    /staff/me/events                 (staff scanner events)"
echo "  GET    /staff/tasks                     (staff scanner tasks)"
echo "════════════════════════════════════════════════════════════"
