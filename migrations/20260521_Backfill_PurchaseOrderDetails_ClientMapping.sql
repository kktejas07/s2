-- Backfill PurchaseOrderDetails.ClientId and ClientUnitId from ServiceOrderDetails where missing
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.PurchaseOrderDetails','ClientID') IS NULL
BEGIN
    ALTER TABLE dbo.PurchaseOrderDetails ADD ClientID INT NULL;
END

IF COL_LENGTH('dbo.PurchaseOrderDetails','ClientUnitId') IS NULL
BEGIN
    ALTER TABLE dbo.PurchaseOrderDetails ADD ClientUnitId INT NULL;
END

-- Backfill using ControlNo -> ServiceOrderDetails
UPDATE pod
SET pod.ClientID = COALESCE(pod.ClientID, sod.ClientID),
    pod.ClientUnitId = COALESCE(pod.ClientUnitId, sod.ClientUnitId)
FROM dbo.PurchaseOrderDetails pod
LEFT JOIN dbo.ControlDetails cd ON cd.ControlNo = pod.ControlNo
LEFT JOIN dbo.ServiceOrderDetails sod ON sod.ControlNo = cd.ControlNo OR sod.ControlId = cd.ControlId
WHERE (pod.ClientID IS NULL OR pod.ClientUnitId IS NULL)
  AND (sod.ClientID IS NOT NULL OR sod.ClientUnitId IS NOT NULL);

COMMIT TRANSACTION;
GO

-- Run after ControlDetails has been backfilled.
