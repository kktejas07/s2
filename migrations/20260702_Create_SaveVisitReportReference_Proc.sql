-- Migration: Stored procedure to insert VisitReportReferences record
IF OBJECT_ID('dbo.SaveVisitReportReference', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SaveVisitReportReference;
GO

CREATE PROCEDURE dbo.SaveVisitReportReference
    @VisitId INT,
    @VisitGuid UNIQUEIDENTIFIER = NULL,
    @InspReportNo NVARCHAR(200) = NULL,
    @InternalReference NVARCHAR(200) = NULL,
    @PrimaryControlId INT = NULL,
    @SecondaryControlIds NVARCHAR(MAX) = NULL,
    @PurchaseId NVARCHAR(100) = NULL,
    @CreatedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.VisitReportReferences (VisitId, VisitGuid, InspReportNo, InternalReference, PrimaryControlId, SecondaryControlIds, PurchaseId, CreatedBy, CreatedOn)
    VALUES (@VisitId, @VisitGuid, @InspReportNo, @InternalReference, @PrimaryControlId, @SecondaryControlIds, @PurchaseId, @CreatedBy, GETDATE());

    SELECT SCOPE_IDENTITY() AS Id;
END
GO
