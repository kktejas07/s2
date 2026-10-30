-- Migration: Add Client mapping columns to ControlDetails and backfill from ServiceOrderDetails
-- Run in a transaction on staging before production. Adjust table/column names if different.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 1) Add nullable columns if they don't exist
IF COL_LENGTH('dbo.ControlDetails','ClientId') IS NULL
BEGIN
    ALTER TABLE dbo.ControlDetails ADD ClientId INT NULL;
END

IF COL_LENGTH('dbo.ControlDetails','ClientUnitId') IS NULL
BEGIN
    ALTER TABLE dbo.ControlDetails ADD ClientUnitId INT NULL;
END

-- Optional: add SiteId if you need site scoping
IF COL_LENGTH('dbo.ControlDetails','SiteId') IS NULL
BEGIN
    -- Uncomment if your application wants SiteId on ControlDetails
    -- ALTER TABLE dbo.ControlDetails ADD SiteId INT NULL;
END

-- 2) Backfill ControlDetails from ServiceOrderDetails
-- This assumes ServiceOrderDetails table has ControlNo/ControlId and ClientId, ClientUnitId
-- Adjust joins/column names to match your schema
UPDATE cd
SET cd.ClientId = sod.ClientId,
    cd.ClientUnitId = sod.ClientUnitId
FROM dbo.ControlDetails cd
INNER JOIN dbo.ServiceOrderDetails sod
    ON (cd.ControlNo = sod.ControlNo OR cd.ControlId = sod.ControlId)
WHERE (cd.ClientId IS NULL OR cd.ClientUnitId IS NULL)
  AND (sod.ClientId IS NOT NULL OR sod.ClientUnitId IS NOT NULL);

-- 3) Add non-clustered index to speed lookups by ControlNo
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name = 'IX_ControlDetails_ControlNo')
BEGIN
    CREATE NONCLUSTERED INDEX IX_ControlDetails_ControlNo ON dbo.ControlDetails(ControlNo);
END

COMMIT TRANSACTION;
GO

-- NOTE: Test on staging before production. If ControlNo datatype differs (varchar/int), adjust comparisons.
