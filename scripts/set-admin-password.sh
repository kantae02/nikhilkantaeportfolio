#!/usr/bin/env bash
# Sets the password of the ADMIN_EMAIL user in Supabase Auth.
# The password is typed at a hidden prompt and sent straight to Supabase —
# it is never echoed, logged or written to disk.
#
# Usage: bash scripts/set-admin-password.sh
set -euo pipefail
cd "$(dirname "$0")/.."

set -a; . ./.env.local; set +a
: "${NEXT_PUBLIC_SUPABASE_URL:?missing in .env.local}"
: "${SUPABASE_SERVICE_ROLE_KEY:?missing in .env.local}"
: "${ADMIN_EMAIL:?missing in .env.local}"

auth=(-H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

user_id=$(curl -fsS "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users" "${auth[@]}" |
  ADMIN_EMAIL="$ADMIN_EMAIL" python3 -c '
import json, os, sys
email = os.environ["ADMIN_EMAIL"].strip().lower()
print(next((u["id"] for u in json.load(sys.stdin)["users"] if (u.get("email") or "").lower() == email), ""))')

if [ -z "$user_id" ]; then
  echo "No Supabase user with email $ADMIN_EMAIL. Create it in Authentication → Users first." >&2
  exit 1
fi

read -rsp "New password for $ADMIN_EMAIL: " pw1; echo
read -rsp "Type it again: " pw2; echo
if [ "$pw1" != "$pw2" ]; then echo "Passwords don't match." >&2; exit 1; fi
if [ ${#pw1} -lt 8 ]; then echo "Use at least 8 characters." >&2; exit 1; fi

body=$(PW="$pw1" python3 -c 'import json, os; print(json.dumps({"password": os.environ["PW"], "email_confirm": True}))')
unset pw1 pw2

status=$(curl -sS -o /dev/null -w '%{http_code}' -X PUT "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users/$user_id" \
  "${auth[@]}" -H "Content-Type: application/json" --data @- <<<"$body")
unset body

if [ "$status" = 200 ]; then
  echo "Password updated for $ADMIN_EMAIL. Sign in at http://localhost:3000/admin/login"
else
  echo "Supabase returned HTTP $status — password not changed." >&2
  exit 1
fi
