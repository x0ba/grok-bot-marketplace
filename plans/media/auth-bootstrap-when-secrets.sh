#!/usr/bin/env bash
# Run after operator injects Clerk secrets for auth live lanes.
set -euo pipefail
umask 077
cd "$(dirname "$0")/../.."
: "${CLERK_SECRET_KEY:?set CLERK_SECRET_KEY}"
: "${VITE_CLERK_PUBLISHABLE_KEY:?set VITE_CLERK_PUBLISHABLE_KEY}"

# Issuer is required for Convex JWT validation (auth.config.ts). Prefer an
# explicit env override; otherwise reuse a value already present in .env.local.
if [ -z "${CLERK_JWT_ISSUER_DOMAIN:-}" ] && [ -f .env.local ]; then
  CLERK_JWT_ISSUER_DOMAIN="$(
    awk -F= '$1=="CLERK_JWT_ISSUER_DOMAIN" { print substr($0, index($0,"=")+1); exit }' .env.local
  )"
fi
: "${CLERK_JWT_ISSUER_DOMAIN:?set CLERK_JWT_ISSUER_DOMAIN to the Clerk Frontend API URL (e.g. https://<slug>.clerk.accounts.dev)}"

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
upsert_env CLERK_JWT_ISSUER_DOMAIN "$CLERK_JWT_ISSUER_DOMAIN"

# Push issuer into the active Convex deployment so auth.config.ts can validate JWTs.
npx convex env set CLERK_JWT_ISSUER_DOMAIN "$CLERK_JWT_ISSUER_DOMAIN"

echo "Wrote Clerk secrets + JWT issuer into .env.local and Convex env."
echo "Restart vite-dev, then sign in with a Clerk *+clerk_test@example.com account (use Clerk's documented test OTP for that address pattern)."
