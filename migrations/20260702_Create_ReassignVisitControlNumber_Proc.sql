-- Stored procedure to reassign a visit to a different control number and record history
IF OBJECT_ID('dbo.ReassignVisitControlNumber', 'P') IS NOT NULL
    DROP PROCEDURE dbo.ReassignVisitControlNumber;
GO

CREATE PROCEDURE dbo.ReassignVisitControlNumber
    @VisitId INT,
    @ToControlId INT,
    @ChangedBy INT,
    @Reason NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @OldControlId INT = (SELECT ControlId FROM Visit WHERE VisitId = @VisitId);

        -- update visit to new control
        UPDATE Visit
        SET ControlId = @ToControlId,
            ModifiedBy = @ChangedBy,
            ModifiedDate = GETDATE()
        WHERE VisitId = @VisitId;

        -- insert history record
        IF OBJECT_ID('dbo.VisitControlReassignHistory') IS NULL
        BEGIN
            CREATE TABLE dbo.VisitControlReassignHistory
            (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                VisitId INT,
                OldControlId INT,
                NewControlId INT,
                ChangedBy INT,
                Reason NVARCHAR(1000),
                ChangedOn DATETIME DEFAULT GETDATE()
            );
        END

        INSERT INTO dbo.VisitControlReassignHistory (VisitId, OldControlId, NewControlId, ChangedBy, Reason)
        VALUES (@VisitId, @OldControlId, @ToControlId, @ChangedBy, @Reason);

        SELECT 1;
    END TRY
    BEGIN CATCH
        INSERT INTO DBError (ErrDate, SPName, ErrNo, ErrLineNo, ErrorMessage)
        VALUES (GETDATE(), ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_LINE(), ERROR_MESSAGE());
        SELECT 0;
    END CATCH
END
GO
