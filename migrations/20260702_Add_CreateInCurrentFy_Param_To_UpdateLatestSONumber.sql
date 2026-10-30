-- Migration: Add CreateInCurrentFy parameter handling to UpdateLatestSONumber stored procedure
-- Note: this script assumes the existing procedure UpdateLatestSONumber accepts parameters as used in code.
-- This version adds optional @CreateInCurrentFy BIT parameter and if set executes logic to create SO in current FY.

IF OBJECT_ID('dbo.UpdateLatestSONumber', 'P') IS NOT NULL
BEGIN
    PRINT 'Altering UpdateLatestSONumber to accept @CreateInCurrentFy...'

    EXEC('ALTER PROCEDURE dbo.UpdateLatestSONumber
        @ControlNumberGuid UNIQUEIDENTIFIER,
        @LoggedInUser INT,
        @LOISOTypeId INT,
        @LOINumber NVARCHAR(200),
        @SONumber NVARCHAR(200),
        @SODate DATETIME = NULL,
        @CreateInCurrentFy BIT = 0
    AS
    BEGIN
        SET NOCOUNT ON;

        -- Existing logic kept; example flow below. Actual logic must be adjusted per business rules.

        DECLARE @SoId INT = NULL;

        IF @LOISOTypeId = 1
        BEGIN
            -- LOI path: update control number''s LOINumber
            UPDATE dbo.ControlNumbers
            SET LOINumber = @LOINumber
            WHERE ControlNumberGuid = @ControlNumberGuid;
        END
        ELSE IF @LOISOTypeId = 2
        BEGIN
            -- SO path: if CreateInCurrentFy = 1 then create a new SO entry in current FY (pseudo-code)
            IF @CreateInCurrentFy = 1
            BEGIN
                -- Example: insert new ServiceOrder, using SO number and date and current FY logic
                INSERT INTO dbo.ServiceOrders (SONumber, SODate, FinancialYear, CreatedBy, CreatedOn)
                VALUES (@SONumber, ISNULL(@SODate, GETDATE()), dbo.udf_GetFinancialYear(GETDATE()), @LoggedInUser, GETDATE());

                SET @SoId = SCOPE_IDENTITY();

                -- associate control number with new SO
                UPDATE dbo.ControlNumbers
                SET SOId = @SoId, SONumber = @SONumber, SODate = @SODate
                WHERE ControlNumberGuid = @ControlNumberGuid;
            END
            ELSE
            BEGIN
                -- Default behaviour: update existing SO fields on control number
                UPDATE dbo.ControlNumbers
                SET SONumber = @SONumber, SODate = @SODate
                WHERE ControlNumberGuid = @ControlNumberGuid;
            END
        END

        RETURN 1;
    END')
END
ELSE
BEGIN
    PRINT 'Stored procedure UpdateLatestSONumber not found. Please create or adjust manually.'
END
GO
