public ActionResult DownloadLog(DateTime Startdate, DateTime Enddate, string filters = null, bool flat = false)
        {
            try
            {
                // =========================================
                // FILTER CONVERSION
                // =========================================
                var jsonFilters = ConvertFilterQueryStringToJson(filters);

                // =========================================
                // GET RAW DATA
                // =========================================
                var rawData = objVisitProcessingBusinessModel
                    .GetLogSheetDetailsDownload1(
                        CurrentUser.SiteId,
                        Startdate,
                        Enddate,
                        jsonFilters,
                        _visitProcessingService)
                    .ToList();

                // =========================================
                // DETAILED MODE DATA
                // =========================================
                var parentList = rawData
                    .GroupBy(x => x.VisitId)
                    .Select(g => g.First())
                    .ToList();

                var parentIds = parentList
                    .Select(x => x.VisitId)
                    .Distinct()
                    .ToList();

                var allChildren = objScheduleVisitBusinessModel
                    .GetVisitPODetailsByVisitIds(parentIds, _visitProcessingService)
                    .ToList();

                // =========================================
                // BUILD PurchaseID -> VR lookup so VR is PO-specific
                // =========================================
                var vrLookup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                try
                {
                    var purchaseIds = allChildren
                        .Where(c => !string.IsNullOrEmpty(c.PurchaseID))
                        .Select(c => c.PurchaseID.Trim())
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();

                    foreach (var pid in purchaseIds)
                    {
                        try
                        {
                            var inspList = objScheduleVisitBusinessModel.GetInspRepoNoByPurchaseId(pid, _visitProcessingService);
                            if (inspList != null && inspList.Any())
                            {
                                vrLookup[pid] = string.Join(";", inspList.Select(i => i.InspReportNo).Where(s => !string.IsNullOrEmpty(s)));
                            }
                            else
                            {
                                vrLookup[pid] = string.Empty;
                            }
                        }
                        catch
                        {
                            if (!vrLookup.ContainsKey(pid)) vrLookup[pid] = string.Empty;
                        }
                    }
                }
                catch
                {
                    // ignore and fallback to visit-level VR
                }

                // =========================================
                // BUILD EXCEL
                // =========================================
                using (XLWorkbook wb = new XLWorkbook())
                {
                    var ws = wb.Worksheets.Add("LogSheet");

                    int row = 1;
                    int counter = 1;
                    bool isAdmin = CurrentUser.RoleId.FirstOrDefault() == 1;

                    // =====================================================
                    // FLAT FORMAT (ONE ROW PER PO)
                    // =====================================================
                    if (flat)
                    {
                        var headers = new[]
                        {
                            "S.No",
                            "Visit ID",
                            "C No",
                            "Insp Date",
                            "Customer Name",
                            "Unit/Proj",
                            "Supplier",
                            "Location",
                            "PO Number",
                            "PO Date",
                            "Inspector",
                            "VR",
                            "Remarks"
                        };

                        for (int i = 0; i < headers.Length; i++)
                            ws.Cell(row, i + 1).Value = headers[i];

                        ws.Range(row, 1, row, headers.Length).Style.Font.Bold = true;
                        ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.LightGray;

                        row++;

                        foreach (var parent in parentList)
                        {
                            var childList = allChildren.Where(x => x.VisitId == parent.VisitId).ToList();

                            if (!childList.Any())
                            {
                                ws.Cell(row, 1).Value = counter++;
                                ws.Cell(row, 2).Value = parent.VisitSeqId;
                                ws.Cell(row, 3).Value = parent.ControlNo;
                                ws.Cell(row, 4).Value = parent.VisitDate?.ToString("dd/MM/yyyy");
                                ws.Cell(row, 5).Value = parent.ClientName;
                                ws.Cell(row, 6).Value = parent.ClientUnitName;
                                ws.Cell(row, 7).Value = parent.ManufacturerName;
                                ws.Cell(row, 11).Value = parent.InspectorName;
                                ws.Cell(row, 12).Value = parent.InspReportNo;
                                ws.Cell(row, 13).Value = parent.ScheduleComments;

                                row++;
                            }
                            else
                            {
                                foreach (var child in childList)
                                {
                                    ws.Cell(row, 1).Value = counter++;
                                    ws.Cell(row, 2).Value = parent.VisitSeqId;
                                    ws.Cell(row, 3).Value = child.ControlNo;
                                    ws.Cell(row, 4).Value = parent.VisitDate?.ToString("dd/MM/yyyy");
                                    ws.Cell(row, 5).Value = parent.ClientName;
                                    ws.Cell(row, 6).Value = child.ClientUnitName;
                                    ws.Cell(row, 7).Value = child.ManufacturerName;
                                    ws.Cell(row, 8).Value = child.LocationDetails;
                                    ws.Cell(row, 9).Value = child.PONumber;
                                    ws.Cell(row, 10).Value = child.PODate?.ToString("dd/MM/yyyy");
                                    ws.Cell(row, 11).Value = parent.InspectorName;

                                    // Prefer PO-level VR if available
                                    string vr = parent.InspReportNo;
                                    if (!string.IsNullOrEmpty(child.PurchaseID) && vrLookup.TryGetValue(child.PurchaseID.Trim(), out var mapped) && !string.IsNullOrEmpty(mapped))
                                    {
                                        vr = mapped;
                                    }

                                    ws.Cell(row, 12).Value = vr;
                                    ws.Cell(row, 13).Value = parent.ScheduleComments;

                                    row++;
                                }
                            }
                        }

                        ws.Cells().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                        for (int c = 1; c <= headers.Length; c++) ws.Column(c).AdjustToContents();

                        using (MemoryStream stream = new MemoryStream())
                        {
                            wb.SaveAs(stream);
                            stream.Position = 0;

                            Response.Cookies.Add(new HttpCookie("fileDownload", "true") { Path = "/" });

                            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "LogSheet_Flat.xlsx");
                        }
                    }

                    // =====================================================
                    // DETAILED FORMAT (ORIGINAL)
                    // =====================================================
                    foreach (var parent in parentList)
                    {
                        // HEADER
                        ws.Cell(row, 1).Value = "S.No";
                        ws.Cell(row, 2).Value = "Visit ID";
                        ws.Cell(row, 3).Value = "C No";
                        ws.Cell(row, 4).Value = "Insp Date";
                        ws.Cell(row, 5).Value = "Customer Name";
                        ws.Cell(row, 6).Value = "Unit/Proj";
                        ws.Cell(row, 7).Value = "Supplier";
                        ws.Cell(row, 8).Value = "Equipment";
                        ws.Cell(row, 9).Value = "Inspector";
                        ws.Cell(row, 10).Value = "VR";
                        ws.Cell(row, 11).Value = "Reviewed By";
                        ws.Cell(row, 12).Value = "Comments";

                        if (isAdmin)
                        {
                            ws.Cell(row, 13).Value = "Invoice No";
                            ws.Cell(row, 14).Value = "Inv Date";
                            ws.Cell(row, 15).Value = "Sale";
                            ws.Cell(row, 16).Value = "Cost";
                            ws.Cell(row, 17).Value = "GP";
                        }

                        ws.Range(row, 1, row, isAdmin ? 17 : 12).Style.Font.Bold = true;
                        ws.Range(row, 1, row, isAdmin ? 17 : 12).Style.Fill.BackgroundColor = XLColor.LightGray;

                        row++;

                        // PARENT DATA
                        ws.Cell(row, 1).Value = counter++;
                        ws.Cell(row, 2).Value = parent.VisitSeqId;
                        ws.Cell(row, 3).Value = parent.ControlNo;
                        ws.Cell(row, 4).Value = parent.VisitDate?.ToString("dd/MM/yyyy");
                        ws.Cell(row, 5).Value = parent.ClientName;
                        ws.Cell(row, 6).Value = parent.ClientUnitName;
                        ws.Cell(row, 7).Value = parent.ManufacturerName + "/" + parent.ManufacturerUnitName;
                        ws.Cell(row, 8).Value = parent.Equipment;
                        ws.Cell(row, 9).Value = parent.InspectorName;
                        ws.Cell(row, 10).Value = parent.InspReportNo;
                        ws.Cell(row, 11).Value = parent.QualityDoneByName;
                        ws.Cell(row, 12).Value = parent.ScheduleComments;

                        if (isAdmin)
                        {
                            ws.Cell(row, 13).Value = parent.InvoiceNo;
                            ws.Cell(row, 14).Value = parent.InvoiceDate.ToString("dd/MM/yyyy");
                            ws.Cell(row, 15).Value = parent.SaleValue;
                            ws.Cell(row, 16).Value = parent.CostValue;
                            ws.Cell(row, 17).Value = parent.GP;
                        }

                        row++;

                        // CHILD DATA
                        var childListDetailed = allChildren.Where(x => x.VisitId == parent.VisitId).ToList();

                        if (childListDetailed.Any())
                        {
                            ws.Cell(row, 2).Value = "PO Number";
                            ws.Cell(row, 3).Value = "PO Date";
                            ws.Cell(row, 4).Value = "File No";
                            ws.Cell(row, 5).Value = "Item No";
                            ws.Cell(row, 6).Value = "Control No";
                            ws.Cell(row, 7).Value = "Customer Unit";
                            ws.Cell(row, 8).Value = "Manufacturer";
                            ws.Cell(row, 9).Value = "Location";
                            ws.Cell(row, 10).Value = "Contact No";
                            ws.Cell(row, 11).Value = "Description";
                            ws.Cell(row, 12).Value = "Qty";
                            ws.Cell(row, 13).Value = "UOM";
                            ws.Cell(row, 14).Value = "Insp Activity";
                            ws.Cell(row, 15).Value = "Cost";

                            ws.Range(row, 2, row, 15).Style.Font.Bold = true;
                            ws.Range(row, 2, row, 15).Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");

                            row++;

                            foreach (var child in childListDetailed)
                            {
                                ws.Cell(row, 2).Value = child.PONumber;
                                ws.Cell(row, 3).Value = child.PODate?.ToString("dd/MM/yyyy");
                                ws.Cell(row, 4).Value = child.PurchaseID;
                                ws.Cell(row, 5).Value = child.POItemNo;
                                ws.Cell(row, 6).Value = child.ControlNo;
                                ws.Cell(row, 7).Value = child.ClientUnitName;
                                ws.Cell(row, 8).Value = child.ManufacturerName;
                                ws.Cell(row, 9).Value = child.LocationDetails;
                                ws.Cell(row, 10).Value = child.ContactNo;
                                ws.Cell(row, 11).Value = child.Description;
                                ws.Cell(row, 12).Value = child.Quantity;
                                ws.Cell(row, 13).Value = child.UOMName;
                                ws.Cell(row, 14).Value = child.InspectionActivity;

                                if (isAdmin)
                                    ws.Cell(row, 15).Value = child.Cost;

                                row++;
                            }
                        }

                        row++;
                    }

                    // COLUMN WIDTHS
                    ws.Columns().AdjustToContents();

                    using (MemoryStream stream = new MemoryStream())
                    {
                        wb.SaveAs(stream);
                        stream.Position = 0;

                        Response.Cookies.Add(new HttpCookie("fileDownload", "true")
                        {
                            Path = "/"
                        });

                        return File(
                            stream.ToArray(),
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "LogSheet.xlsx"
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Visit Processing", ex);
                return new HttpStatusCodeResult(500, "Download failed");
            }
        }
