CREATE OR ALTER PROCEDURE GetVisitsListForInvoice2
(
    @InvoiceType VARCHAR(20), -- Client / Manufacturer
    @ClientId INT = NULL,
    @ClientUnitId INT = NULL,
    @ManufacturerId INT = NULL,
    @SOID INT = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Normalize SOID: treat values <= 0 as not provided
    IF (@SOID IS NOT NULL AND @SOID <= 0)
        SET @SOID = NULL;

    /* ================= HEADER DETAILS ================= */
    IF(@InvoiceType = 'Customer')
    BEGIN
        SELECT CU.ContactPersonName,
               CU.Address + ',' + CU.City AS Address,
               CU.IsSez, CU.IsOverseas,
               ISNULL(CU.SGST,0) SGST,
               ISNULL(CU.CGST,0) CGST,
               ISNULL(CU.IGST,0) IGST,
               CU.GSTNo
        FROM ClientUnits CU
        WHERE CU.ClientUnitId = @ClientUnitId
    END
    ELSE
    BEGIN
        SELECT
            MU.ContactPersonName,
            MU.Address AS Address,
            MD.IsSez, MD.IsOverseas,
            ISNULL(MD.SGST,0) SGST,
            ISNULL(MD.CGST,0) CGST,
            ISNULL(MD.IGST,0) IGST,
            MD.GSTNo
        FROM ManufacturerDetails MD
        INNER JOIN ManufacturerUnits MU on MD.ManufacturerId = MU.ManufacturerId
        INNER JOIN VisitScheduleSelectedPOItems1 VSPI on VSPI.ManufacturerId = MD.ManufacturerId
        INNER JOIN ClientUnits CU on CU.ClientUnitId = VSPI.ClientUnitId
        WHERE MD.ManufacturerId = @ManufacturerId
    END

    /* ================= VISITS ================= */
    SELECT DISTINCT
        VEM.VEM_ID AS VEMId,
        VEM.UserId,
        UD.InspectorCode,
        VEF.InspReportNo,
        VD.VisitDate,
        VEF.VisitedFrom AS TimeIn,
        VEF.VisitedTo AS TimeOut,
        REPLACE(
            CONVERT(varchar(5),
                DATEADD(minute,
                    DATEDIFF(minute, VEF.VisitedFrom, VEF.VisitedTo), 0
                ), 114
            ), ':', '.'
        ) AS TotalHrs,

        CD.ControlNo,
        ISNULL(SOD.SONumber, SOD.LOINumber) AS SONumber,
        VSPI.SOID,

        PON.PONumber,
        PON.PODate,

        VD.ClientID,
        VSPI.ClientUnitId,
        MVS.VisitStatusName,
        VD.VisitId,

        MD.ManufacturerName,
        MU.ManufacturerUnitName AS VisitContactName,
        MU.Address AS ManufacturerAddress,

        UD.FirstName + ' ' + ISNULL(UD.LastName,'') AS InspectorName,

        MVL.LocationDetails AS VisitLocation,

        VSPI.POID,
        VSPI.PONID,
        VSPI.Quantity,
        VSPI.UOMID

    FROM VisitDetails VD
    LEFT JOIN VisitEmpMapping VEM ON VD.VisitId = VEM.VisitID
    INNER JOIN UserDetails UD ON VEM.UserId = UD.UserId
    INNER JOIN VisitScheduleSelectedPOItems1 VSPI ON VSPI.VisitId = VD.VisitId
    LEFT JOIN ControlDetails CD ON CD.ControlId = VSPI.ControlId
    LEFT JOIN ServiceOrderDetails SOD ON VSPI.SOID = SOD.SOID
    LEFT JOIN ClientUnits CU ON CU.ClientUnitId = VSPI.ClientUnitId
    INNER JOIN PurchaseOrderDetails POD ON POD.POID = VSPI.POID
    INNER JOIN PurchaseOrderNumber PON ON PON.PONID = VSPI.PONID
    LEFT JOIN PurchaseOrderItems POI ON POI.POItemId = VSPI.POItemId AND POI.PONID = VSPI.PONID AND POI.POItemNo = VSPI.POItemNo
    LEFT JOIN mstVisitStatus MVS ON MVS.VisitStatusId = VD.VisitStatusId
    LEFT JOIN ManufacturerUnits MU ON MU.ManufacturerUnitId = VD.ManufacturerUnitId
    LEFT JOIN ManufacturerDetails MD ON MD.ManufacturerId = VSPI.ManufacturerId
    LEFT JOIN VisitEmpUploadFiles VEF ON VEF.VisitID = VSPI.VisitId AND VEF.PONID = VSPI.PONID
    OUTER APPLY (
        SELECT TOP (1) M.LocationDetails
        FROM ManufacturerVisitLocation M
        WHERE M.VisitId = VSPI.VisitId
          AND M.ManufacturerId = VSPI.ManufacturerId
        ORDER BY M.Id
    ) MVL
    WHERE
        (@FromDate IS NULL OR VD.VisitDate >= @FromDate)
        AND (@ToDate IS NULL OR VD.VisitDate <= @ToDate)
        -- Only apply SO filter when provided
        AND (@SOID IS NULL OR VSPI.SOID = @SOID)
        AND VD.VisitStatusId !< 5
        AND VEM.IsInvoiceRaised = 0
        AND (
              (@InvoiceType = 'Customer' AND VD.ClientID = @ClientId AND VSPI.ClientUnitId = @ClientUnitId)
           OR (@InvoiceType = 'Supplier' AND VSPI.ManufacturerId = @ManufacturerId)
        )
    ORDER BY VD.VisitDate;

    /* ================= TEMPLATE TYPES ================= */
    Select InvoiceTemplateId, InvoiceTemplateName From InvoiceTemplateType;

    /* ================= Visit Stats ================= */
    DECLARE @TotalVisits INT, @CompletedVisits INT, @CompletedQC INT, @CompletedFC INT, @ScheduledVisitCount INT, @CompletedInvoiceCount INT;

    SELECT @TotalVisits = Count(VEM.VEM_ID)
    FROM VisitDetails VD
    LEFT JOIN VisitEmpMapping VEM ON VD.VisitId = VEM.VisitID
    LEFT JOIN Controldetails CD on CD.ControlId = VD.ControlId
    LEFT JOIN ServiceOrderDetails SOD on SOD.ControlId = CD.ControlId and VD.SOID = SOD.SOID
    LEFT JOIN mstVisitStatus MVS on MVS.VisitStatusId = VD.VisitStatusId
    WHERE VD.VisitDate between ISNULL(@FromDate, '1900-01-01') and ISNULL(@ToDate, '9999-12-31')
      AND SOD.ClientID = @ClientId
      AND SOD.ClientUnitId = @ClientUnitId
      AND (@SOID IS NULL OR SOD.SOID = @SOID);

    SELECT @CompletedVisits = Count(VEM.VEM_ID)
    FROM VisitDetails VD
    LEFT JOIN VisitEmpMapping VEM ON VD.VisitId = VEM.VisitID
    LEFT JOIN Controldetails CD on CD.ControlId = VD.ControlId
    LEFT JOIN ServiceOrderDetails SOD on SOD.ControlId = CD.ControlId and VD.SOID = SOD.SOID
    LEFT JOIN mstVisitStatus MVS on MVS.VisitStatusId = VD.VisitStatusId
    WHERE VD.VisitDate between ISNULL(@FromDate, '1900-01-01') and ISNULL(@ToDate, '9999-12-31')
      AND SOD.ClientID = @ClientId
      AND SOD.ClientUnitId = @ClientUnitId
      AND (@SOID IS NULL OR SOD.SOID = @SOID)
      AND VD.VisitStatusId = 3
      AND VEM.IsInvoiceRaised = 0;

    SELECT @CompletedQC = Count(VEM.VEM_ID)
    FROM VisitDetails VD
    LEFT JOIN VisitEmpMapping VEM ON VD.VisitId = VEM.VisitID
    LEFT JOIN Controldetails CD on CD.ControlId = VD.ControlId
    LEFT JOIN ServiceOrderDetails SOD on SOD.ControlId = CD.ControlId and VD.SOID = SOD.SOID
    LEFT JOIN mstVisitStatus MVS on MVS.VisitStatusId = VD.VisitStatusId
    WHERE VD.VisitDate between ISNULL(@FromDate, '1900-01-01') and ISNULL(@ToDate, '9999-12-31')
      AND SOD.ClientID = @ClientId
      AND SOD.ClientUnitId = @ClientUnitId
      AND (@SOID IS NULL OR SOD.SOID = @SOID)
      AND VD.VisitStatusId = 4
      AND VEM.IsInvoiceRaised = 0;

    SELECT @CompletedFC = Count(VEM.VEM_ID)
    FROM VisitDetails VD
    LEFT JOIN VisitEmpMapping VEM ON VD.VisitId = VEM.VisitID
    LEFT JOIN Controldetails CD on CD.ControlId = VD.ControlId
    LEFT JOIN ServiceOrderDetails SOD on SOD.ControlId = CD.ControlId and VD.SOID = SOD.SOID
    LEFT JOIN mstVisitStatus MVS on MVS.VisitStatusId = VD.VisitStatusId
    WHERE VD.VisitDate between ISNULL(@FromDate, '1900-01-01') and ISNULL(@ToDate, '9999-12-31')
      AND SOD.ClientID = @ClientId
      AND SOD.ClientUnitId = @ClientUnitId
      AND (@SOID IS NULL OR SOD.SOID = @SOID)
      AND VD.VisitStatusId > 4
      AND VEM.IsInvoiceRaised = 0;

    SELECT @ScheduledVisitCount = Count(VEM.VEM_ID)
    FROM VisitDetails VD
    LEFT JOIN VisitEmpMapping VEM ON VD.VisitId = VEM.VisitID
    LEFT JOIN Controldetails CD on CD.ControlId = VD.ControlId
    LEFT JOIN ServiceOrderDetails SOD on SOD.ControlId = CD.ControlId and VD.SOID = SOD.SOID
    LEFT JOIN mstVisitStatus MVS on MVS.VisitStatusId = VD.VisitStatusId
    WHERE VD.VisitDate between ISNULL(@FromDate, '1900-01-01') and ISNULL(@ToDate, '9999-12-31')
      AND SOD.ClientID = @ClientId
      AND SOD.ClientUnitId = @ClientUnitId
      AND (@SOID IS NULL OR SOD.SOID = @SOID)
      AND VD.VisitStatusId IN(1,2)
      AND VEM.IsInvoiceRaised = 0;

    SELECT @CompletedInvoiceCount = Count(VEM.VEM_ID)
    FROM VisitDetails VD
    LEFT JOIN VisitEmpMapping VEM ON VD.VisitId = VEM.VisitID
    LEFT JOIN Controldetails CD on CD.ControlId = VD.ControlId
    LEFT JOIN ServiceOrderDetails SOD on SOD.ControlId = CD.ControlId and VD.SOID = SOD.SOID
    LEFT JOIN mstVisitStatus MVS on MVS.VisitStatusId = VD.VisitStatusId
    WHERE VD.VisitDate between ISNULL(@FromDate, '1900-01-01') and ISNULL(@ToDate, '9999-12-31')
      AND SOD.ClientID = @ClientId
      AND SOD.ClientUnitId = @ClientUnitId
      AND (@SOID IS NULL OR SOD.SOID = @SOID)
      AND VD.VisitStatusId IN(6,7)
      AND VEM.IsInvoiceRaised = 1;

    SELECT @TotalVisits AS TotalVisits, @CompletedVisits AS CompletedVisitCount, @CompletedQC AS CompletedQCCount, @CompletedFC AS CompletedFCCount, @ScheduledVisitCount AS ScheduledVisitCount, @CompletedInvoiceCount AS CompletedInvoiceCount;
END
