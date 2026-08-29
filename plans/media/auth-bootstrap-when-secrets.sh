#!/usr/bin/env bash
# Run after operator injects Clerk secrets for auth live lanes.
set -euo pipefail
cd "$(dirname "$0")/../.."
: "${CLERK_SECRET_KEY:?set CLERK_SECRET_KEY}"
: "${VITE_CLERK_PUBLISHABLE_KEY:?set VITE_CLERK_PUBLISHABLE_KEY}"

grep -q '^VITE_CLERK_PUBLISHABLE_KEY=' .env.local 2>/dev/null \
  && sed -i "s|^VITE_CLERK_PUBLISHABLE_KEY=.*|VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY|" .env.local \
  || echo "VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY" >> .env.local

grep -q '^CLERK_SECRET_KEY=' .env.local 2>/dev/null \
  && sed -i "s|^CLERK_SECRET_KEY=.*|CLERK_SECRET_KEY=$CLERK_SECRET_KEY|" .env.local \
  || echo "CLERK_SECRET_KEY=$CLERK_SECRET_KEY" >> .env.local

echo "Wrote Clerk secrets into .env.local — restart vite-dev, then sign in with *+clerk_test@example.com / 424242"
