-- Create VisitControlReassignHistory table (if not exists)
IF OBJECT_ID('dbo.VisitControlReassignHistory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.VisitControlReassignHistory
    (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        VisitId INT NOT NULL,
        OldControlId INT NULL,
        NewControlId INT NULL,
        ChangedBy INT NULL,
        Reason NVARCHAR(1000) NULL,
        ChangedOn DATETIME NOT NULL DEFAULT(GETDATE())
    );
END
GO
