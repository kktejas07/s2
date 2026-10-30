-- Migration: Create VisitReportReferences table
-- Run in target database
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VisitReportReferences]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VisitReportReferences]
    (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [VisitId] INT NOT NULL,
        [VisitGuid] UNIQUEIDENTIFIER NULL,
        [InspReportNo] NVARCHAR(200) NULL,
        [InternalReference] NVARCHAR(200) NULL,
        [PrimaryControlId] INT NULL,
        [SecondaryControlIds] NVARCHAR(MAX) NULL, -- comma separated list
        [PurchaseId] NVARCHAR(100) NULL,
        [CreatedBy] INT NULL,
        [CreatedOn] DATETIME NOT NULL DEFAULT(GETDATE())
    );
END
GO

-- Index for quick lookup by VisitId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VisitReportReferences_VisitId' AND object_id = OBJECT_ID('dbo.VisitReportReferences'))
BEGIN
    CREATE INDEX IX_VisitReportReferences_VisitId ON dbo.VisitReportReferences(VisitId);
END
GO
