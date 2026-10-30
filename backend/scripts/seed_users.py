import asyncio
from pymongo import AsyncMongoClient
from beanie import init_beanie
from core.config import settings
from core.auth import hash_password
from modules.auth.models import UserLogin
from core.audit import AuditEntry
from core.sequences import Sequence


async def seed_users():
    print("Connecting to MongoDB to seed standard login users...")
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(database=client[settings.mongodb_db_name], document_models=[
            AuditEntry,
            Sequence,UserLogin])

    site_id = "SITE-01"
    pwd_hash = hash_password("password123")
    admin_pwd_hash = hash_password("admin123")
    tenant_pwd_hash = hash_password("tenant123")
    engineer_pwd_hash = hash_password("engineer123")

    users = [
        # Standard admin
        UserLogin(
            user_id="USR-ADMIN-01",
            site_id=site_id,
            login_name="admin",
            login_password=admin_pwd_hash,
            email="admin@iqeapp.com",
            full_name="System Administrator",
            role_id=1,
            role_name="Super Admin",
            is_active=True,
        ),
        # Quick-login button: admin_system
        UserLogin(
            user_id="USR-ADMIN-02",
            site_id=site_id,
            login_name="admin_system",
            login_password=admin_pwd_hash,
            email="admin_system@iqeapp.com",
            full_name="System Admin User",
            role_id=1,
            role_name="Super Admin",
            is_active=True,
        ),
        # Quick-login button: tenant_client
        UserLogin(
            user_id="USR-TENANT-01",
            site_id=site_id,
            login_name="tenant_client",
            login_password=tenant_pwd_hash,
            email="tenant@iqeapp.com",
            full_name="Tenant Project Manager",
            role_id=3,
            role_name="Tenant",
            is_active=True,
        ),
        # Quick-login button: tpi_engineer
        UserLogin(
            user_id="USR-ENG-01",
            site_id=site_id,
            login_name="tpi_engineer",
            login_password=engineer_pwd_hash,
            email="engineer@iqeapp.com",
            full_name="TPI Verification Engineer",
            role_id=2,
            role_name="Inspector",
            is_active=True,
        ),
    ]

    for u in users:
        existing = await UserLogin.find_one(UserLogin.login_name == u.login_name)
        if existing:
            existing.login_password = u.login_password
            existing.is_active = True
            await existing.save()
            print(f"Updated user: {u.login_name}")
        else:
            await u.insert()
            print(f"Created user: {u.login_name}")

    print("All core auth users seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_users())
