#!/usr/bin/env bash
# Prepares the e2e database: apply migrations and (re)seed demo data. Non-destructive: the seed
# only replaces its own demo rows (*.test addresses), and every test uses unique e-mail addresses.
set -euo pipefail
export DATABASE_URL="${E2E_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/findersarmy_test}"
npx prisma migrate deploy
npx tsx prisma/seed.ts
