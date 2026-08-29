#!/usr/bin/env bash
# Run after operator injects Clerk secrets for auth live lanes.
set -euo pipefail
umask 077
cd "$(dirname "$0")/../.."
: "${CLERK_SECRET_KEY:?set CLERK_SECRET_KEY}"
: "${VITE_CLERK_PUBLISHABLE_KEY:?set VITE_CLERK_PUBLISHABLE_KEY}"

touch .env.local
chmod 600 .env.local

upsert_env() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"
  chmod 600 "$tmp"
  if grep -q "^${key}=" .env.local; then
    KEY="$key" VALUE="$value" awk '
      BEGIN { k = ENVIRON["KEY"]; v = ENVIRON["VALUE"] }
      index($0, k "=") == 1 { print k "=" v; next }
      { print }
    ' .env.local >"$tmp"
  else
    cat .env.local >"$tmp"
    printf '%s=%s\n' "$key" "$value" >>"$tmp"
  fi
  mv "$tmp" .env.local
  chmod 600 .env.local
}

upsert_env VITE_CLERK_PUBLISHABLE_KEY "$VITE_CLERK_PUBLISHABLE_KEY"
upsert_env CLERK_SECRET_KEY "$CLERK_SECRET_KEY"

echo "Wrote Clerk secrets into .env.local — restart vite-dev, then sign in with a Clerk *+clerk_test@example.com account (use Clerk's documented test OTP for that address pattern)."
