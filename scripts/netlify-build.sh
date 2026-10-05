#!/usr/bin/env bash
# Netlify build: generate the Prisma client, apply migrations, seed demo data once (test phase
# only, DEMO_MODE=true), then build Next.js.
set -euo pipefail

npx prisma generate

# Neon's pooled host ("-pooler") sits behind PgBouncer, which does not support the advisory locks
# migrations use; migrate over the direct host instead.
MIGRATE_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL/-pooler/}}"
DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy

if [ "${DEMO_MODE:-}" = "true" ]; then
  # Seed only when the demo accounts are missing, so what you click around in survives deploys.
  if DATABASE_URL="$MIGRATE_URL" node -e '
    const { PrismaClient } = require("@prisma/client");
    const db = new PrismaClient();
    db.user.count({ where: { email: "admin@findersarmy.test" } })
      .then((n) => process.exit(n > 0 ? 0 : 1))
      .catch(() => process.exit(1));
  '; then
    echo "Demo data present, not reseeding."
  else
    DATABASE_URL="$MIGRATE_URL" npx tsx prisma/seed.ts
  fi
fi

npx next build
