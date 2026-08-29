#!/usr/bin/env bash
# Swarm-ready probe once operator reviews + Clerk + Graphite secrets land.
# Usage: ./plans/media/swarm-ready-checklist.sh <pr-head-sha>
set -euo pipefail
SHA="${1:?pass the STACK-READY head SHA}"
cd "$(dirname "$0")/../.."
echo "=== swarm-ready @ $SHA ==="
git rev-parse --verify "$SHA^{commit}" >/dev/null
echo "commit ok"
test -n "${CLERK_SECRET_KEY:-}" || { echo "BLOCKED: CLERK_SECRET_KEY"; exit 2; }
test -n "${GRAPHITE_AUTH_TOKEN:-}" -o -f "$HOME/.config/graphite/user_config.json" || {
  echo "BLOCKED: Graphite auth"
  exit 2
}
npm test -- --run
npx tsc --noEmit
echo "unit+typecheck PASS — run live auth lanes + perf next, then gt submit --stack"
