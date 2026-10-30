#!/usr/bin/env bash
# One-command demo-data seeder for a deployed stack (or a fresh local MongoDB).
#
# What it does:
#   1. backend/scripts/seed_200_mock_data.py   - 200 clients, 200 manufacturers,
#      work types, report formats, people, and the other big collections.
#      Idempotent: skips/updates what already exists.
#   2. backend/scripts/seed_inspectors_jobs.py - 200 inspectors + 50 jobs.
#      DESTRUCTIVE note: it deletes users with role_id=2 (inspectors) first,
#      so any real inspector accounts in that database are replaced by the
#      mock set. Set SKIP_INSPECTORS=1 to leave them alone.
#   3. backend/scripts/seed_users.py           - core logins (admin/admin123,
#      admin_system, tenant_client, tpi_engineer). Idempotent upsert.
#
# Safety gate: refusing to run against a database unless the caller
# explicitly acknowledges the target with IQA_SEED_LIVE=1. Local dev can
# export it freely; for a production server, set it only on the command
# where you actually mean to seed.
#
# Usage:
#   Local dev container:
#     docker run --rm \
#       -e MONGODB_URL=mongodb://host.docker.internal:27017 \
#       -e MONGODB_DB_NAME=iqeapp_dev \
#       -e IQA_SEED_LIVE=1 \
#       iqe-backend bash scripts/seed_demo_data.sh
#
#   Production compose stack (db named `iqe` on the mongodb service):
#     docker compose -f docker-compose.prod.yml exec -T -e IQA_SEED_LIVE=1 api \
#       bash scripts/seed_demo_data.sh
#
set -euo pipefail

# Backend root, overridable for tests/CI. The seeder's siblings import `core`
# from here, and PYTHONPATH must point at it for every python invocation below.
BACKEND_ROOT="${BACKEND_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$BACKEND_ROOT"
export PYTHONPATH="$BACKEND_ROOT"

if [[ -z "${IQA_SEED_LIVE:-}" ]]; then
  echo "Refusing to run: this script seeds a full database with mock data."
  echo "If that is intended, re-run with IQA_SEED_LIVE=1, e.g."
  echo "  IQA_SEED_LIVE=1 bash scripts/seed_demo_data.sh"
  exit 1
fi

DB_NAME="$(python -c 'from core.config import settings; print(settings.mongodb_db_name)' 2>/dev/null || echo unknown)"
echo "Target database: ${DB_NAME}"
echo "  - seed_200_mock_data.py (clients, manufacturers, work types, formats, people, ...)"
python scripts/seed_200_mock_data.py

if [[ "${SKIP_INSPECTORS:-0}" != "1" ]]; then
  echo "  - seed_inspectors_jobs.py (200 inspectors + 50 jobs; wipes existing role_id=2 users)"
  python scripts/seed_inspectors_jobs.py
else
  echo "  - seed_inspectors_jobs.py SKIPPED (SKIP_INSPECTORS=1)"
fi

echo "  - seed_users.py (core logins)"
python scripts/seed_users.py

echo
echo "Seeding complete: ${DB_NAME}"
echo "Record counts:"
python - <<'PY'
import asyncio
from core.config import settings
from pymongo import AsyncMongoClient
from beanie import init_beanie
from modules.auth.models import UserLogin
from modules.clients.models import Client
from modules.jobs.models import Job

async def counts():
    c = AsyncMongoClient(settings.mongodb_url)
    db = c[settings.mongodb_db_name]
    await init_beanie(database=db, document_models=[UserLogin, Client, Job])
    print(f"  users:    {await UserLogin.find().count()}")
    print(f"  clients:  {await Client.find().count()}")
    print(f"  jobs:     {await Job.find().count()}")
    await c.close()

asyncio.run(counts())
PY
