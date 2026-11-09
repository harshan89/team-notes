#!/usr/bin/env bash
# Runs every test in the project:
#   1. each service's own unit + integration tests (Vitest)
#   2. builds and starts the app with docker compose (separate project, fresh data)
#   3. runs the Playwright UI tests against it
#   4. stops everything and deletes the test data
#
# Usage:  ./run.sh                 run all tests
#         ./run.sh --headed        watch the browser
#         ./run.sh -g "viewer"     only tests whose name matches
#         KEEP_STACK=1 ./run.sh    leave the services running afterwards
#         SKIP_SERVICE_TESTS=1 ./run.sh   only the UI tests
set -euo pipefail
cd "$(dirname "$0")"

PROJECT=team-notes-e2e
# Different ports from the normal stack, so both can run at the same time.
export AUTH_PORT="${AUTH_PORT:-14000}" NOTES_PORT="${NOTES_PORT:-13000}" FRONTEND_PORT="${FRONTEND_PORT:-18080}"
export FRONTEND_URL="http://localhost:$FRONTEND_PORT"

compose() { docker compose -p "$PROJECT" -f ../docker-compose.yml "$@"; }

# Runs a service's existing Vitest suite (installs its dependencies if needed).
service_tests() {
  echo "==> $1 tests"
  (cd "../$1" && { [ -d node_modules ] || npm ci; } && npm test)
}

if [ "${SKIP_SERVICE_TESTS:-0}" != 1 ]; then
  service_tests auth-service
  service_tests notes-service
fi

cleanup() {
  if [ "${KEEP_STACK:-0}" = 1 ]; then
    echo "Services left running (frontend: $FRONTEND_URL). Stop with: docker compose -p $PROJECT down -v"
  else
    echo "==> Stopping services"
    compose down -v --remove-orphans >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# Waits until a URL answers with the expected HTTP status.
wait_for() {
  local name=$1 expected=$2 method=$3 url=$4 status=""
  for _ in $(seq 1 60); do
    status=$(curl -s -o /dev/null -w '%{http_code}' -X "$method" "$url" || true)
    if [ "$status" = "$expected" ]; then echo "    $name is up"; return 0; fi
    sleep 1
  done
  echo "!! $name did not come up (last status: $status). Recent logs:"
  compose logs --tail 40
  exit 1
}

echo "==> Starting the app (project: $PROJECT)"
compose down -v --remove-orphans >/dev/null 2>&1 || true # start from empty data
compose up --build -d frontend # also starts auth-service and note-service (depends_on)

echo "==> Waiting for services"
wait_for "auth-service" 200 GET  "http://localhost:$AUTH_PORT/.well-known/jwks.json"
wait_for "frontend"     200 GET  "$FRONTEND_URL/"
wait_for "note-service" 401 GET  "$FRONTEND_URL/api/notes" # 401 = up and asking for a token

echo "==> Preparing Playwright"
[ -d node_modules ] || npm ci
npx playwright install chromium

echo "==> UI end-to-end tests"
npx playwright test "$@"
