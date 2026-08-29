#!/usr/bin/env bash
# Run after operator injects CLERK_SECRET_KEY (+ optional VITE_CLERK_PUBLISHABLE_KEY).
set -euo pipefail
cd "$(dirname "$0")/../.."
: "${CLERK_SECRET_KEY:?set CLERK_SECRET_KEY}"
if [[ -n "${VITE_CLERK_PUBLISHABLE_KEY:-}" ]]; then
  grep -q '^VITE_CLERK_PUBLISHABLE_KEY=' .env.local 2>/dev/null \
    && sed -i "s|^VITE_CLERK_PUBLISHABLE_KEY=.*|VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY|" .env.local \
    || echo "VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY" >> .env.local
fi
grep -q '^CLERK_SECRET_KEY=' .env.local 2>/dev/null \
  && sed -i "s|^CLERK_SECRET_KEY=.*|CLERK_SECRET_KEY=$CLERK_SECRET_KEY|" .env.local \
  || echo "CLERK_SECRET_KEY=$CLERK_SECRET_KEY" >> .env.local
echo "Wrote Clerk secrets into .env.local — restart vite-dev, then sign in with *+clerk_test@example.com / 424242"
