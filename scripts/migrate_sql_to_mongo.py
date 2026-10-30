import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import pyodbc
from motor.motor_asyncio import AsyncIOMotorClient


SQL_CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=tcp:20.121.48.206;"
    "DATABASE=IQEIMS_DEV;"
    "UID=IQEAppDBUser;"
    "PWD=WebAppUser#963"
)
MONGO_URL = "mongodb://localhost:27017"
MONGO_DB = "iqeapp_dev"


sql_conn = None
mongo = None


def get_sql_connection():
    global sql_conn
    if sql_conn is None:
        sql_conn = pyodbc.connect(SQL_CONN_STR)
    return sql_conn


def fetch_all(cursor, query):
    cursor.execute(query)
    columns = [column[0] for column in cursor.description]
    rows = []
    for row in cursor.fetchall():
        rows.append(dict(zip(columns, row)))
    return rows


async def migrate_clients(cursor):
    print("Migrating clients...")
    rows = fetch_all(cursor, "SELECT * FROM ClientDetails")
    for row in rows:
        doc = {
            "client_id": str(row.get("ClientId", "")),
            "site_id": str(row.get("SiteId", 1)),
            "name": row.get("ClientName", ""),
            "code": row.get("ClientCode", ""),
            "industry_type": row.get("IndustryTypeName", None),
            "is_active": row.get("IsClientActive", True),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        await mongo.clients.update_one(
            {"client_id": doc["client_id"]},
            {"$set": doc},
            upsert=True,
        )
    print(f"  {len(rows)} clients migrated")


async def migrate_manufacturers(cursor):
    print("Migrating manufacturers...")
    rows = fetch_all(cursor, "SELECT * FROM ManufacturerDetails")
    for row in rows:
        doc = {
            "manufacturer_id": str(row.get("ManufacturerId", "")),
            "site_id": str(row.get("SiteId", 1)),
            "name": row.get("ManufacturerName", ""),
            "contact_number": row.get("ContactNumber", None),
            "gst": row.get("GSTNo", None),
            "is_active": row.get("IsManufacturerActive", True),
            "created_at": datetime.now(),
        }
        await mongo.manufacturers.update_one(
            {"manufacturer_id": doc["manufacturer_id"]},
            {"$set": doc},
            upsert=True,
        )
    print(f"  {len(rows)} manufacturers migrated")


async def migrate_users(cursor):
    print("Migrating users...")
    rows = fetch_all(cursor, "SELECT * FROM UserDetails")
    for row in rows:
        doc = {
            "user_id": str(row.get("UserId", "")),
            "site_id": str(row.get("SiteId", 1)),
            "login_name": row.get("LoginName", ""),
            "login_password": row.get("LoginPassword", ""),
            "email": row.get("EmailId", ""),
            "full_name": row.get("UserFullName", ""),
            "first_name": row.get("FirstName", ""),
            "role_id": int(row.get("RoleId", 3)),
            "employee_code": row.get("EmployeeCode", None),
            "inspector_code": row.get("InspectorCode", None),
            "is_active": row.get("IsUserActive", True),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        await mongo.users.update_one(
            {"user_id": doc["user_id"]},
            {"$set": doc},
            upsert=True,
        )
    print(f"  {len(rows)} users migrated")


async def migrate_service_orders(cursor):
    print("Migrating service orders...")
    rows = fetch_all(cursor, "SELECT * FROM ServiceOrderDetails")
    for row in rows:
        so_id = str(row.get("SOId", ""))
        client_id = str(row.get("ClientId", ""))
        client = await mongo.clients.find_one({"client_id": client_id})
        job_id = f"JOB-{so_id[:8]}"
        doc = {
            "so_id": so_id,
            "job_id": job_id,
            "site_id": str(row.get("SiteId", 1)),
            "status": "active" if row.get("IsSOActive", True) else "inactive",
            "client": {"client_id": client_id, "name": client["name"] if client else ""} if client else None,
            "so_type": "LOI" if row.get("LOISOType") == 1 else "SO",
            "so_number": row.get("SONumber") or row.get("LOINumber", ""),
            "so_date": row.get("SODate", None),
            "amount": float(row.get("Amount", 0) or 0),
            "is_active": row.get("IsSOActive", True),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        await mongo.service_orders.update_one(
            {"so_id": so_id},
            {"$set": doc},
            upsert=True,
        )

        job = await mongo.jobs.find_one({"job_id": job_id})
        if not job:
            job_doc = {
                "job_id": job_id,
                "site_id": str(row.get("SiteId", 1)),
                "status": "open",
                "client": doc["client"],
                "title": f"Job - {row.get('SONumber', so_id)}",
                "job_type": "inspection",
                "budget": float(row.get("Amount", 0) or 0),
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }
            await mongo.jobs.insert_one(job_doc)
    print(f"  {len(rows)} service orders migrated")


async def main():
    global mongo
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    mongo = mongo_client[MONGO_DB]

    cursor = get_sql_connection().cursor()

    await migrate_clients(cursor)
    await migrate_manufacturers(cursor)
    await migrate_users(cursor)
    await migrate_service_orders(cursor)

    print("\nMigration complete!")

    mongo_client.close()


if __name__ == "__main__":
    asyncio.run(main())
