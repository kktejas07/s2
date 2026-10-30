USE [IQEIMS_DEV]
GO
/****** Altered stored procedure: UpdateLatestSONumber ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER   Proc [dbo].[UpdateLatestSONumber]
@ControlNumberGuid UniqueIdentifier,
@LoggedInUser INT      ,
@LOISOTypeId int,
@LOINumber nvarchar(100)=null,
@SODate datetime = NULL,
@SONumber nvarchar(100)=null,
@CreateInCurrentFy bit = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF(@LOISOTypeId = 1)
        BEGIN
            UPDATE SOD
            SET SOD.LOINumber = @LOINumber,
                SOD.SODate = @SODate,
                SOD.ModifiedBy = @LoggedInUser,
                SOD.ModifiedDate = GETDATE()
            FROM ServiceOrderDetails SOD
            INNER JOIN ControlDetails CD ON CD.ControlID = SOD.ControlID
            WHERE CD.ControlNumberGuid = @ControlNumberGuid;

            SELECT 1;
        END
        ELSE IF(@LOISOTypeId = 2)
        BEGIN
            IF(@CreateInCurrentFy = 1)
            BEGIN
                -- Get control id for the control number
                DECLARE @ControlID INT = (SELECT TOP 1 ControlID FROM ControlDetails WHERE ControlNumberGuid = @ControlNumberGuid);

                -- Insert a new ServiceOrderDetails row tied to this control
                INSERT INTO ServiceOrderDetails (ControlID, SONumber, SODate, CreatedBy, CreatedDate, IsSOActive)
                VALUES (@ControlID, @SONumber, ISNULL(@SODate, GETDATE()), @LoggedInUser, GETDATE(), 1);

                DECLARE @NewSOId INT = SCOPE_IDENTITY();

                -- Update ControlDetails to point to the newly created SO (column name is SOID)
                IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'SOID' AND Object_ID = Object_ID(N'dbo.ControlDetails'))
                BEGIN
                    UPDATE ControlDetails
                    SET SOID = @NewSOId,
                        -- optional mirrors on control for quick reference
                        -- if these columns exist, update them; SONumber and SODate are not defined on ControlDetails in current schema, so guard updates
                        ModifiedBy = CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'ModifiedBy' AND Object_ID = Object_ID(N'dbo.ControlDetails')) THEN @LoggedInUser ELSE ModifiedBy END,
                        ModifiedDate = CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'ModifiedDate' AND Object_ID = Object_ID(N'dbo.ControlDetails')) THEN GETDATE() ELSE ModifiedDate END
                    WHERE ControlNumberGuid = @ControlNumberGuid;
                END

                SELECT 1;
            END
            ELSE
            BEGIN
                UPDATE SOD
                SET SOD.SONumber = @SONumber,
                    SOD.SODate = @SODate,
                    SOD.ModifiedBy = @LoggedInUser,
                    SOD.ModifiedDate = GETDATE()
                FROM ServiceOrderDetails SOD
                INNER JOIN ControlDetails CD ON CD.ControlID = SOD.ControlID
                WHERE CD.ControlNumberGuid = @ControlNumberGuid;

                SELECT 1;
            END
        END
    END TRY
    BEGIN CATCH
        INSERT INTO DBError (ErrDate, SPName, ErrNo, ErrLineNo, ErrorMessage)
        VALUES (GETDATE(), ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_LINE(), ERROR_MESSAGE());
        SELECT 0;
    END CATCH
END
GO
