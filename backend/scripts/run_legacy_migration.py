import asyncio
from pymongo import AsyncMongoClient
from beanie import init_beanie
from core.config import settings

from modules.jobs.models import Job
from modules.service_orders.models import ServiceOrder
from modules.visits.models import Visit
from modules.invoices.models import Invoice
from modules.analytics.models import AnalyticsEvent
from modules.jobs.migration import LegacyMigrationService
from modules.analytics.service import AnalyticsService
from core.audit import AuditEntry
from core.sequences import Sequence


async def main():
    print("Initializing MongoDB Connection for Legacy Migration Execution...")
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            AuditEntry,
            Sequence,Job, ServiceOrder, Visit, Invoice, AnalyticsEvent],
    )

    print("\n--- Running Legacy Data Ingestion Engine ---")
    res = await LegacyMigrationService.migrate_legacy_records(site_id="SITE-01")
    print("Migration Result:", res)

    print("\n--- Fetching Telemetry Summary Metrics ---")
    summary = await AnalyticsService.get_summary("SITE-01")
    print("Analytics Summary:", summary)


if __name__ == "__main__":
    asyncio.run(main())
