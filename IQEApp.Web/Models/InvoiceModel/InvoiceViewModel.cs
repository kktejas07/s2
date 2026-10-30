using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.ControlNumberDomain;
using IQEApp.Domain.Invoice;
using IQEApp.Service.ControlNumberService;
using IQEApp.Service.InvoiceService;
using IQEApp.Service.VisitProcessing;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.ServiceOrderModel;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Linq;

namespace IQEApp.Web.Models.InvoiceModel
{
    public class InvoiceViewModel : BaseViewModel
    {
        public int InvoiceID { get; set; }
        public Guid InvoiceGuid { get; set; }
        [Display(Name = "From Date")]
        public DateTime FromDate { get; set; }
        [Display(Name = "To Date")]
        public DateTime ToDate { get; set; }
        public int? ClientId { get; set; }
        public int? ClientUnitId { get; set; }
        [Display(Name = "Service Order No")]
        public int SOID { get; set; }
        public int ControlId { get; set; }
        public string SONumber { get; set; }
        public DateTime SODate { get; set; }
        [Display(Name = "Invoice No")]
        public string InvoiceNo { get; set; }
        [Display(Name = "Contact Name")]
        public string ClientContactName { get; set; }
        [Display(Name = "Contact Address")]
        public string ClientContactAddress { get; set; }
        [Display(Name = "P.O. Number")]
        public string PONumber { get; set; }
        public DateTime PODate { get; set; }

        public string Encl { get; set; }
        public string Currency { get; set; }
        public string Subject { get; set; }
        [Display(Name = "Invoice Price")]
        public decimal InvoicePrice { get; set; }
        [Display(Name = "Email Id")]
        public string EmailId { get; set; }
        [Display(Name = "Courier Sent Date")]
        public DateTime CourierSendDate { get; set; }
        [Display(Name = "Courier Received Date")]
        public DateTime CourierReceiveDate { get; set; }
        [Display(Name = "Invoice Date")]
        public DateTime InvoiceDate { get; set; }
        public int InvoiceTemplateId { get; set; }
        public List<VisitDetailsInvoiceModel> LstVisitProcessings { get; set; }
        [Display(Name = "Grand Total")]
        public decimal GrandTotalAmount { get; set; }
        [Display(Name = "Total")]
        public decimal TotalAmount { get; set; }
        [Display(Name = "Exchange Rate")]
        public decimal ExchangeRate { get; set; }
        public string ClientName { get; set; }
        public string ClientUnitName { get; set; }
        public bool IsInvoiceFrozen { get; set; }
        [Display(Name = "CGST")]
        public decimal CGST { get; set; }

        [Display(Name = "CGST Percentage")]
        public int CGSTPercentage { get; set; }
        [Display(Name = "SGST")]
        public decimal SGST { get; set; }
        [Display(Name = "SGST Percentage")]
        public int SGSTPercentage { get; set; }
        [Display(Name = "IGST")]
        public decimal IGST { get; set; }
        [Display(Name = "IGST Percentage")]
        public int IGSTPercentage { get; set; }
        [Display(Name = "Customer GST No")]
        public string ClientGSTNo { get; set; }
        public bool IsSez { get; set; }
        public bool IsOverseas { get; set; }
        public string InvoiceName { get; set; }
        public string InvoiceAzureLink { get; set; }
        public decimal InvoiceSize { get; set; }
        public int InvoiceStatusId { get; set; }
        public string InvoiceStatus { get; set; }
        public int CurrentVersion { get; set; }
        public string AmountInWords { get; set; }
        public string TotalInWords { get; set; }
        public string StateName { get; set; }
        public bool IsInvoicePrinted { get; set; }
        public decimal MileageCost { get; set; }
        [Display(Name = "Cancellation Comments")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        public string CancellationComments { get; set; }
        public int CancelledBy { get; set; }
        public DateTime CancelledDate { get; set; }

        //Hari
        public decimal TDS { get; set; }
        public decimal TDSPercent { get; set; }
        public decimal AmountReceived { get; set; }
        public DateTime AmountReceivedDate { get; set; }
        public string InvoiceType { get; set; } // "Client" or "Manufacturer"
        public int? ManufacturerId { get; set; }
        public int? ManufacturerUnitId { get; set; }

        public string ManufacturerName { get; set; }
        public string ManufacturerUnitName { get; set; }
    }

    public class InvoiceSummaryModel
    {
        public decimal Grand_TotalAmount { get; set; }
        public decimal Grand_GrandTotalAmount { get; set; }
        public decimal Grand_TDS { get; set; }
        public decimal Grand_AmountReceived { get; set; }
        public decimal Grand_OutstandingAmount { get; set; }
    }

    public class InvoiceDetailsModel : InvoiceViewModel
    {
        public List<ClientViewModel> LstClients { get; set; }
        public List<ClientUnitsViewModel> LstClientUnits { get; set; }
        public List<ManufacturerDetailsModel> LstManufacturer { get; set; }
        public List<ManufacturerUnitsViewModel> LstManufacturerUnitDetails { get; set; }
        public List<CommonModel.InvoiceTemplateType> TemplateTypes { get; set; }
        public List<ServiceOrderViewModel> LstServiceOrders { get; set; }

        [Display(Name ="Control No.")]
        public List<ControlNumberViewModel> LstControlNumbers { get; set; }
        public InvoiceStatsModel InvoiceStats { get; set; }

        public List<InvoiceViewModel> Invoices { get; set; }
        public InvoiceSummaryModel Summary { get; set; }
        public List<InvoiceConsolidateDetailsModel> LstInvoiceConsolidatedDetails { get; set; }
    }

    public class InvoicePrintModel
    {
        public SiteDetailsModel.SiteDetailsModel SiteDetails { get; set; }
        public InvoiceViewModel InvoiceDetails { get; set; }
        public List<InvoiceConsolidateDetailsModel> LstInvoiceConsolidatedDetails { get; set; }
    }

    public class InvoiceStatsModel
    {
        public int CompletedVisitCount { get; set; }
        public int CompletedQCCount { get; set; }
        public int CompletedFCCount { get; set; }
        public int TotalVisits { get; set; }
        public int ScheduledVisitCount { get; set; }
        public int CompletedInvoiceCount { get; set; }
    }

    public class InvoiceBusinessModel
    {
        public List<InvoiceViewModel> LstInvoiceViewModel { get; set; }
        public List<InvoiceViewModel> GetInvoiceListForDirectory(int siteId, string strSearch, string alphaChar,
        int offsetIndex, int fetchCount, bool activeStatus, string sortingOrder, string fiYear,string InvoiceType, out InvoiceSummaryModel summary, IInvoiceService invoiceService)
        {
            summary = null;

            var domainResult = invoiceService.GetInvoiceListForDirectory(siteId, strSearch, alphaChar, offsetIndex, fetchCount, activeStatus, sortingOrder, fiYear, InvoiceType);

            var model = new List<InvoiceViewModel>();

            if (domainResult?.Invoices != null)
            {
                Mapper.CreateMap<InvoiceDomainModel, InvoiceViewModel>();
                model = domainResult.Invoices.Select(Mapper.Map<InvoiceDomainModel, InvoiceViewModel>).ToList();

                if (domainResult.Summary != null)
                {
                    Mapper.CreateMap<InvoiceSummaryDomainModel, InvoiceSummaryModel>();
                    summary = Mapper.Map<InvoiceSummaryModel>(domainResult.Summary);
                }
            }

            return model;
        }
        public InvoiceDetailsModel GetDefaultDetailsToGenerateInvoice(int loginUserSiteId, IInvoiceService invoiceService)
        {
            InvoiceDetailsModel model = new InvoiceDetailsModel();
            var defaultValues = invoiceService.GetDefaultDetailsToGenerateInvoice(loginUserSiteId);
            if (defaultValues != null && defaultValues.Tables != null)
            {
                // Table 0: Clients
                if (defaultValues.Tables.Count > 0)
                    model.LstClients = defaultValues.Tables[0].DataTableToList<ClientViewModel>();

                // Table 1: Template types (optional)
                if (defaultValues.Tables.Count > 1)
                    model.TemplateTypes = defaultValues.Tables[1].DataTableToList<CommonModel.InvoiceTemplateType>();

                // Table 2: Service orders (optional)
                if (defaultValues.Tables.Count > 2)
                    model.LstServiceOrders = defaultValues.Tables[2].DataTableToList<ServiceOrderViewModel>();

                // Table 3: Manufacturers
                if (defaultValues.Tables.Count > 3)
                    model.LstManufacturer = defaultValues.Tables[3].DataTableToList<ManufacturerDetailsModel>();

                // Table 4: Control numbers (optional)
                if (defaultValues.Tables.Count > 4)
                    model.LstControlNumbers = defaultValues.Tables[4].DataTableToList<ControlNumberViewModel>();
            }
            else
            {
                model.LstClients = new List<ClientViewModel>();
                model.LstManufacturer = new List<ManufacturerDetailsModel>();
                model.TemplateTypes = new List<CommonModel.InvoiceTemplateType>();
                model.LstServiceOrders = new List<ServiceOrderViewModel>();
                model.LstControlNumbers = new List<ControlNumberViewModel>();
            }
            return model;
        }
       
        public InvoiceDetailsModel GetVisitsListForInvoice(InvoiceViewModel dataModel, IInvoiceService invoiceService)
        {
            InvoiceDetailsModel model = new InvoiceDetailsModel();

            Mapper.CreateMap<InvoiceViewModel, InvoiceDomainModel>();
            var postData = Mapper.Map<InvoiceViewModel, InvoiceDomainModel>(dataModel);

            DataSet data = invoiceService.GetVisitsListForInvoice(postData);

            if (data == null || data.Tables.Count == 0)
                return model;

            // ===== TABLE 0 : CUSTOMER / MANUFACTURER HEADER DETAILS =====
            var headerDetails = data.Tables[0].DataTableToList<ClientUnitsViewModel>().FirstOrDefault();
            if (headerDetails != null)
            {
                model.ClientContactName = headerDetails.ContactPersonName;
                model.ClientContactAddress = headerDetails.Address;
                model.IsSez = headerDetails.IsSEZ;
                model.IsOverseas = headerDetails.IsOverseas;
                model.CGSTPercentage = Convert.ToInt32(headerDetails.CGST);
                model.SGSTPercentage = Convert.ToInt32(headerDetails.SGST);
                model.IGSTPercentage = Convert.ToInt32(headerDetails.IGST);
                model.ClientGSTNo = headerDetails.GSTNo;
            }

            // ===== TABLE 1 : VISITS =====
            model.LstVisitProcessings = data.Tables[1].DataTableToList<VisitDetailsInvoiceModel>().ToList();

            // ===== TABLE 2 : TEMPLATE TYPES =====
            model.TemplateTypes = data.Tables[2].DataTableToList<CommonModel.InvoiceTemplateType>();

            // ===== TABLE 3 : STATS =====
            model.InvoiceStats = data.Tables[3].DataTableToList<InvoiceStatsModel>().FirstOrDefault();

            return model;
        }

        public InvoiceDetailsModel GetVisitsListForInvoiceEdit(int invoiceId, IInvoiceService invoiceService)
        {
            InvoiceDetailsModel model = new InvoiceDetailsModel();

            DataSet data = invoiceService.GetVisitsListForInvoiceEdit(invoiceId);

            if (data == null || data.Tables.Count == 0)
                return model;

            // ================= TABLE 0 : HEADER =================
            if (data.Tables.Count > 0 && data.Tables[0].Rows.Count > 0)
            {
                var row = data.Tables[0].Rows[0];

                model.InvoiceID = Convert.ToInt32(row["InvoiceId"]);
                model.InvoiceNo = row["InvoiceNo"]?.ToString();
                model.InvoiceDate = Convert.ToDateTime(row["InvoiceDate"]);
                model.InvoiceType = row["InvoiceType"]?.ToString();

                model.ClientContactName = row["ClientContactName"]?.ToString();
                model.ClientContactAddress = row["ClientContactAddress"]?.ToString();

                // 🔥 IMPORTANT: Column mismatch fix
                model.ClientGSTNo = row["GSTNo"]?.ToString();

                model.CGST = Convert.ToDecimal(row["CGST"] == DBNull.Value ? 0 : row["CGST"]); 
                model.SGST = Convert.ToDecimal(row["SGST"] == DBNull.Value ? 0 : row["SGST"]);
                model.IGST = Convert.ToDecimal(row["IGST"] == DBNull.Value ? 0 : row["IGST"]);

                model.CGSTPercentage = Convert.ToInt32(row["CGST"] == DBNull.Value ? 0 : row["CGST"]);
                model.SGSTPercentage = Convert.ToInt32(row["SGST"] == DBNull.Value ? 0 : row["SGST"]);
                model.IGSTPercentage = Convert.ToInt32(row["IGST"] == DBNull.Value ? 0 : row["IGST"]);

                model.InvoiceTemplateId = Convert.ToInt32(row["InvoiceTemplateId"] ?? 0);
                model.Subject = row["Subject"]?.ToString();
                model.MileageCost = Convert.ToDecimal(row["MileageCost"] ?? 0);
                model.Encl = row["Encl"]?.ToString();
                model.Currency = row["Currency"]?.ToString();
                model.SONumber = row["SONumber"]?.ToString();
            }

            // ================= TABLE 1 : VISITS =================
            if (data.Tables.Count > 1)
            {
                model.LstVisitProcessings = data.Tables[1]
                    .DataTableToList<VisitDetailsInvoiceModel>()
                    .Select(x => new VisitDetailsInvoiceModel
                    {
                        VisitId = x.VisitId,
                        VisitDate = x.VisitDate,
                        ManufacturerName = x.ManufacturerName,
                        VisitLocation = x.VisitLocation,
                        PONumber = x.PONumber,
                        PODate = x.PODate,
                        InspReportNo = x.InspReportNo,
                        InspectorName = x.InspectorName,
                        TimeIn = x.TimeIn,
                        TimeOut = x.TimeOut,
                        TotalHrs = x.TotalHrs,
                        VEMId = x.VEMId,

                        // 🔥 EDIT VALUES (CRITICAL)
                        Distance = x.Distance,
                        MileageCost = x.MileageCost,
                        FoodAllowance = x.FoodAllowance,
                        TravelFare = x.TravelFare,
                        Hotel = x.Hotel,
                        OtherExpenses = x.OtherExpenses,
                        ServiceCharge = x.ServiceCharge,
                        Total = x.Total,
                        Remarks = x.Remarks
                       // IsSelected = true
                    }).ToList();
            }

            // ================= TABLE 2 : TEMPLATE =================
            if (data.Tables.Count > 2)
            {
                model.TemplateTypes = data.Tables[2]
                    .DataTableToList<CommonModel.InvoiceTemplateType>();
            }

            // ================= TABLE 3 : STATS =================
            if (data.Tables.Count > 3 && data.Tables[3].Rows.Count > 0)
            {
                model.InvoiceStats = data.Tables[3]
                    .DataTableToList<InvoiceStatsModel>()
                    .FirstOrDefault();
            }

            // ================= TABLE 4 : CONSOLIDATED =================
            if (data.Tables.Count > 4)
            {
                model.LstInvoiceConsolidatedDetails = data.Tables[4]
                    .DataTableToList<InvoiceConsolidateDetailsModel>();
            }

            // === Ensure service orders are available for the visits partial so the SONumber dropdown can be rendered server-side ===
            foreach (DataTable dt in data.Tables)
            {
                if (dt == null) continue;
                try
                {
                    var cols = dt.Columns.Cast<DataColumn>().Select(c => c.ColumnName.ToLowerInvariant()).ToArray();
                    if (cols.Contains("soid") || cols.Contains("sonumber"))
                    {
                        model.LstServiceOrders = dt.DataTableToList<ServiceOrderViewModel>()?.ToList() ?? new List<ServiceOrderViewModel>();
                        break;
                    }
                }
                catch { /* ignore */ }
            }

             return model;
         }
        public InvoiceDetailsModel GetVisitsListForInvoiceEdit111(int invoiceId, IInvoiceService invoiceService)
        {
            InvoiceDetailsModel model = new InvoiceDetailsModel();
            var data = invoiceService.GetVisitsListForInvoiceEdit(invoiceId);

            if (data == null || data.Tables == null || data.Tables.Count == 0)
                return model;

            // Initialize collections to avoid null reference in views
            model.LstVisitProcessings = new List<VisitDetailsInvoiceModel>();
            model.TemplateTypes = new List<CommonModel.InvoiceTemplateType>();
            model.InvoiceStats = null;
            model.LstInvoiceConsolidatedDetails = new List<InvoiceConsolidateDetailsModel>();

            // local helper to detect table type by column names
            bool HasAnyColumn(System.Data.DataTable dt, params string[] names)
            {
                if (dt == null || dt.Columns == null) return false;
                var cols = dt.Columns.Cast<System.Data.DataColumn>().Select(c => c.ColumnName.ToLowerInvariant()).ToArray();
                return names.Any(n => cols.Contains(n.ToLowerInvariant()));
            }

            foreach (System.Data.DataTable dt in data.Tables)
            {
                if (dt == null) continue;

                try
                {
                    // Header / client details (some SPs return header in visits SP)
                    if (HasAnyColumn(dt, "ClientContactName", "ClientContactAddress", "Encl", "MileageCost", "Currency", "Subject", "IsSez", "IsOverseas", "CGST", "SGST", "IGST", "ClientGSTNo"))
                    {
                        var clientList = dt.DataTableToList<ClientUnitsViewModel>() ?? new List<ClientUnitsViewModel>();
                        var header = clientList.FirstOrDefault();
                        if (header != null)
                        {
                            model.ClientContactName = header.ContactPersonName ?? model.ClientContactName;
                            model.ClientContactAddress = header.Address ?? model.ClientContactAddress;
                            model.IsSez = header.IsSEZ;
                            model.IsOverseas = header.IsOverseas;
                            // Attempt to read GST/GST percentages if present on DTO
                            try { model.CGSTPercentage = Convert.ToInt32(header.CGST); } catch { }
                            try { model.SGSTPercentage = Convert.ToInt32(header.SGST); } catch { }
                            try { model.IGSTPercentage = Convert.ToInt32(header.IGST); } catch { }
                            model.ClientGSTNo = header.GSTNo ?? model.ClientGSTNo;
                        }

                        // continue to next table since this was header
                        continue;
                    }

                    // Visits table: map rows into VisitDetailsInvoiceModel
                    if (HasAnyColumn(dt, "visitid", "invoicevisitid", "visitdate", "name") || HasAnyColumn(dt, "visitcontactname", "visitlocation"))
                    {
                        var visits = dt.DataTableToList<VisitDetailsInvoiceModel>() ?? new List<VisitDetailsInvoiceModel>();
                        model.LstVisitProcessings = visits.ToList();
                        continue;
                    }

                    // Template types
                    if (HasAnyColumn(dt, "invoicetemplatename", "invoicetemplateid"))
                    {
                        var templates = dt.DataTableToList<CommonModel.InvoiceTemplateType>() ?? new List<CommonModel.InvoiceTemplateType>();
                        model.TemplateTypes = templates.ToList();
                        continue;
                    }

                    // Invoice stats
                    if (HasAnyColumn(dt, "completedvisitcount", "totalvisits", "completedinvoicecount"))
                    {
                        var stats = dt.DataTableToList<InvoiceStatsModel>() ?? new List<InvoiceStatsModel>();
                        model.InvoiceStats = stats.FirstOrDefault();
                        continue;
                    }

                    // Consolidated details
                    if (HasAnyColumn(dt, "category", "sno", "amount", "invoiceconsolidateid"))
                    {
                        var cons = dt.DataTableToList<InvoiceConsolidateDetailsModel>() ?? new List<InvoiceConsolidateDetailsModel>();
                        model.LstInvoiceConsolidatedDetails = cons.ToList();
                        continue;
                    }

                    // Fallback: if table looks like invoice header, skip here (header should come from GetInvoiceDetailsForEdit)
                }
                catch
                {
                    // swallow per-table mapping exceptions
                }
            }

            return model;
        }

        public InvoiceViewModel GetInvoiceDetailsToPreviewOrDownload( Guid InvoiceguId, IInvoiceService invoiceservice)
        {
            InvoiceViewModel files = new InvoiceViewModel();
            var filesInfo = invoiceservice.GetInvoiceDetailsToPreviewOrDownload(InvoiceguId);
            Mapper.CreateMap<InvoiceDomainModel, InvoiceViewModel>();
            files = Mapper.Map<InvoiceDomainModel, InvoiceViewModel>(filesInfo);
            return files;
        }
        public int SaveInvoiceCumAnnexureDetails(InvoiceViewModel model, IInvoiceService invoiceService)
        {
            Mapper.CreateMap<InvoiceViewModel, InvoiceDomainModel>();
            var dataModel = Mapper.Map<InvoiceViewModel, InvoiceDomainModel>(model);
            var invoiceId = invoiceService.SaveInvoiceDetails(dataModel);
            foreach (var visit in model.LstVisitProcessings)
            {
                visit.InvoiceId = invoiceId;
                if (visit.PODate == Convert.ToDateTime("01/01/0001"))
                {
                    visit.PODate = Convert.ToDateTime("01/01/1900");
                }
                if (visit.VisitDate == Convert.ToDateTime("01/01/0001"))
                {
                    visit.VisitDate = Convert.ToDateTime("01/01/1900");
                }
                if (visit.TimeIn == Convert.ToDateTime("01/01/0001"))
                {
                    visit.TimeIn = Convert.ToDateTime("01/01/1900");
                }
                if (visit.TimeOut == Convert.ToDateTime("01/01/0001"))
                {
                    visit.TimeOut = Convert.ToDateTime("01/01/1900");
                }
                Mapper.CreateMap<VisitDetailsInvoiceModel, VisitDetailsInvoiceDomainModel>();
                var data = Mapper.Map<VisitDetailsInvoiceModel, VisitDetailsInvoiceDomainModel>(visit);
                invoiceService.SaveAnnexureDetails(data);
            }
            return invoiceId;
        }

        public List<InvoiceConsolidateDetailsModel> GetInvoiceConsolidatedDetails(int invoiceId, Guid invoiceGuid, IInvoiceService invoiceService)
        {
            List<InvoiceConsolidateDetailsModel> model = new List<InvoiceConsolidateDetailsModel>();
            var consolidatedDetails = invoiceService.GetConsolidatedInvoiceDetails(invoiceId, invoiceGuid);
            Mapper.CreateMap<InvoiceConsolidateDomainModel, InvoiceConsolidateDetailsModel>();
            return model = consolidatedDetails.Select(Mapper.Map<InvoiceConsolidateDomainModel, InvoiceConsolidateDetailsModel>).ToList();
        }

        public void SaveConsolidatedInvoiceDetails(List<InvoiceConsolidateDetailsModel> dataModel, IInvoiceService invoiceService)
        {
            foreach (var data in dataModel)
            {
                Mapper.CreateMap<InvoiceConsolidateDetailsModel, InvoiceConsolidateDomainModel>();
                var consolidatedDetails = Mapper.Map<InvoiceConsolidateDetailsModel, InvoiceConsolidateDomainModel>(data);
                invoiceService.SaveConsolidatedInvoiceDetails(consolidatedDetails);
            }
        }
        public InvoicePrintModel GetInvoiceDataToPrint(int invoiceId, int siteId, IInvoiceService invoiceService)
        {
            var invoiceData = invoiceService.GetInvoiceDataToPrint(invoiceId, siteId);
            InvoicePrintModel model = new InvoicePrintModel();
            model.SiteDetails = invoiceData.Tables[0].DataTableToList<SiteDetailsModel.SiteDetailsModel>().FirstOrDefault();
            model.InvoiceDetails = invoiceData.Tables[1].DataTableToList<InvoiceViewModel>().FirstOrDefault();
            model.InvoiceDetails.LstVisitProcessings = invoiceData.Tables[2].DataTableToList<VisitDetailsInvoiceModel>().ToList();
            model.LstInvoiceConsolidatedDetails = invoiceData.Tables[3].DataTableToList<InvoiceConsolidateDetailsModel>().ToList();
            return model;
        }

        public InvoiceViewModel InvoicePreview(Guid invoiceGuid, InvoiceService invoiceService)
        {
            InvoiceViewModel model = new InvoiceViewModel();
            var invoicePreviewData = invoiceService.GetInvoiceDetailsToPreview(invoiceGuid);
            Mapper.CreateMap<InvoiceDomainModel, InvoiceViewModel>();
            return model = Mapper.Map<InvoiceDomainModel, InvoiceViewModel>(invoicePreviewData);
        }

        public InvoiceDetailsModel GetInvoiceDetailsForEdit(int InvoiceId, int siteId, IInvoiceService invoiceService)
        {
            InvoiceDetailsModel model = new InvoiceDetailsModel();
            var invoiceData = invoiceService.GetInvoiceDetailsForEdit(InvoiceId);

            if (invoiceData == null || invoiceData.Tables == null || invoiceData.Tables.Count == 0)
                return model;

            // initialize collections
            model.LstClients = new List<ClientViewModel>();
            model.LstManufacturer = new List<ManufacturerDetailsModel>();
            model.LstClientUnits = new List<ClientUnitsViewModel>();
            model.TemplateTypes = new List<CommonModel.InvoiceTemplateType>();
            model.LstVisitProcessings = new List<VisitDetailsInvoiceModel>();
            model.LstInvoiceConsolidatedDetails = new List<InvoiceConsolidateDetailsModel>();

            bool HasAnyColumn(DataTable dt, params string[] names)
            {
                if (dt == null || dt.Columns == null) return false;
                var cols = dt.Columns.Cast<System.Data.DataColumn>().Select(c => c.ColumnName.ToLowerInvariant()).ToArray();
                return names.Any(n => cols.Contains(n.ToLowerInvariant()));
            }

            foreach (DataTable dt in invoiceData.Tables)
            {
                if (dt == null) continue;
                try
                {
                    // Header invoice details
                    if (HasAnyColumn(dt, "InvoiceId", "InvoiceNo", "ContactPersonName", "Address"))
                    {
                        var inv = dt.DataTableToList<InvoiceViewModel>()?.FirstOrDefault();
                        if (inv != null)
                        {
                            model.InvoiceID = inv.InvoiceID;
                            model.InvoiceGuid = inv.InvoiceGuid;
                            model.ClientId = inv.ClientId;
                            model.ClientUnitId = inv.ClientUnitId;
                            model.ManufacturerId = inv.ManufacturerId;
                            model.InvoiceNo = inv.InvoiceNo;
                            model.FromDate = inv.FromDate;
                            model.ToDate = inv.ToDate;
                            model.ClientContactName = inv.ClientContactName;
                            model.ClientContactAddress = inv.ClientContactAddress;
                            model.Currency = inv.Currency;
                            model.Subject = inv.Subject;
                            model.IsSez = inv.IsSez;
                            model.IsOverseas = inv.IsOverseas;
                            model.Encl = inv.Encl;
                            model.ClientGSTNo = inv.ClientGSTNo;
                            model.EmailId = inv.EmailId;
                            model.CourierSendDate = inv.CourierSendDate;
                            model.CourierReceiveDate = inv.CourierReceiveDate;
                            model.InvoiceTemplateId = inv.InvoiceTemplateId;
                            model.ExchangeRate = inv.ExchangeRate;
                            model.TotalAmount = inv.TotalAmount;
                            model.InvoicePrice = inv.InvoicePrice;
                            model.CGST = inv.CGST;
                            model.SGST = inv.SGST;
                            model.IGST = inv.IGST;
                            model.CGSTPercentage = inv.CGSTPercentage;
                            model.SGSTPercentage = inv.SGSTPercentage;
                            model.IGSTPercentage = inv.IGSTPercentage;
                            model.GrandTotalAmount = inv.GrandTotalAmount;
                            model.SONumber = inv.SONumber;
                            model.SOID = inv.SOID;
                            model.ControlId = inv.ControlId;
                            model.MileageCost = inv.MileageCost;
                            model.InvoiceType = inv.InvoiceType;
                        }
                        continue;
                    }

                    // Clients
                    if (HasAnyColumn(dt, "ClientId", "ClientName"))
                    {
                        model.LstClients = dt.DataTableToList<ClientViewModel>()?.ToList() ?? new List<ClientViewModel>();
                        continue;
                    }

                    // Manufacturers
                    if (HasAnyColumn(dt, "ManufacturerId", "ManufacturerName"))
                    {
                        model.LstManufacturer = dt.DataTableToList<ManufacturerDetailsModel>()?.ToList() ?? new List<ManufacturerDetailsModel>();
                        continue;
                    }

                    // Visits
                    if (HasAnyColumn(dt, "VisitId", "VisitContactName", "InvoiceVisitId"))
                    {
                        model.LstVisitProcessings = dt.DataTableToList<VisitDetailsInvoiceModel>()?.ToList() ?? new List<VisitDetailsInvoiceModel>();
                        continue;
                    }

                    // Template types
                    if (HasAnyColumn(dt, "InvoiceTemplateId", "InvoiceTemplateName"))
                    {
                        model.TemplateTypes = dt.DataTableToList<CommonModel.InvoiceTemplateType>()?.ToList() ?? new List<CommonModel.InvoiceTemplateType>();
                        continue;
                    }

                    // Consolidated details
                    if (HasAnyColumn(dt, "InvoiceConsolidateId", "SNo", "Category", "Amount"))
                    {
                        model.LstInvoiceConsolidatedDetails = dt.DataTableToList<InvoiceConsolidateDetailsModel>()?.ToList() ?? new List<InvoiceConsolidateDetailsModel>();
                        continue;
                    }
                }
                catch
                {
                    // swallow per-table mapping exceptions
                }
            }

            return model;
        }

        public InvoiceDetailsModel GetInvoiceDetailsToEdit(Guid invoiceGuid, int siteId, IInvoiceService invoiceService)
        {
            InvoiceDetailsModel model = new InvoiceDetailsModel();
            var invoiceData = invoiceService.GetInvoiceDataToEdit(invoiceGuid, siteId);

            if (invoiceData == null || invoiceData.Tables == null || invoiceData.Tables.Count == 0)
                return model;

            // initialize collections
            model.LstClients = new List<ClientViewModel>();
            model.LstManufacturer = new List<ManufacturerDetailsModel>();
            model.LstClientUnits = new List<ClientUnitsViewModel>();
            model.TemplateTypes = new List<CommonModel.InvoiceTemplateType>();
            model.LstVisitProcessings = new List<VisitDetailsInvoiceModel>();
            model.LstInvoiceConsolidatedDetails = new List<InvoiceConsolidateDetailsModel>();

            bool HasAnyColumn(DataTable dt, params string[] names)
            {
                if (dt == null || dt.Columns == null) return false;
                var cols = dt.Columns.Cast<System.Data.DataColumn>().Select(c => c.ColumnName.ToLowerInvariant()).ToArray();
                return names.Any(n => cols.Contains(n.ToLowerInvariant()));
            }

            foreach (DataTable dt in invoiceData.Tables)
            {
                if (dt == null) continue;
                try
                {
                    // Header
                    if (HasAnyColumn(dt, "InvoiceId", "InvoiceNo", "ContactPersonName", "Address"))
                    {
                        var inv = dt.DataTableToList<InvoiceViewModel>()?.FirstOrDefault();
                        if (inv != null)
                        {
                            model.InvoiceID = inv.InvoiceID;
                            model.InvoiceGuid = inv.InvoiceGuid;
                            model.ClientId = inv.ClientId;
                            model.ClientUnitId = inv.ClientUnitId;
                            model.ManufacturerId = inv.ManufacturerId;
                            model.InvoiceNo = inv.InvoiceNo;
                            model.FromDate = inv.FromDate;
                            model.ToDate = inv.ToDate;
                            model.ClientContactName = inv.ClientContactName;
                            model.ClientContactAddress = inv.ClientContactAddress;
                            model.Currency = inv.Currency;
                            model.Subject = inv.Subject;
                            model.IsSez = inv.IsSez;
                            model.IsOverseas = inv.IsOverseas;
                            model.Encl = inv.Encl;
                            model.ClientGSTNo = inv.ClientGSTNo;
                            model.EmailId = inv.EmailId;
                            model.CourierSendDate = inv.CourierSendDate;
                            model.CourierReceiveDate = inv.CourierReceiveDate;
                            model.InvoiceTemplateId = inv.InvoiceTemplateId;
                            model.ExchangeRate = inv.ExchangeRate;
                            model.TotalAmount = inv.TotalAmount;
                            model.InvoicePrice = inv.InvoicePrice;
                            model.CGST = inv.CGST;
                            model.SGST = inv.SGST;
                            model.IGST = inv.IGST;
                            model.CGSTPercentage = inv.CGSTPercentage;
                            model.SGSTPercentage = inv.SGSTPercentage;
                            model.IGSTPercentage = inv.IGSTPercentage;
                            model.GrandTotalAmount = inv.GrandTotalAmount;
                            model.SONumber = inv.SONumber;
                            model.SOID = inv.SOID;
                            model.ControlId = inv.SOID;
                            model.MileageCost = inv.MileageCost;
                            model.InvoiceType = inv.InvoiceType;
                        }
                        continue;
                    }

                    // Visits
                    if (HasAnyColumn(dt, "VisitId", "InvoiceVisitId", "VisitContactName"))
                    {
                        model.LstVisitProcessings = dt.DataTableToList<VisitDetailsInvoiceModel>()?.ToList() ?? new List<VisitDetailsInvoiceModel>();
                        continue;
                    }

                    // Clients
                    if (HasAnyColumn(dt, "ClientId", "ClientName"))
                    {
                        model.LstClients = dt.DataTableToList<ClientViewModel>()?.ToList() ?? new List<ClientViewModel>();
                        continue;
                    }

                    // Template types
                    if (HasAnyColumn(dt, "InvoiceTemplateId", "InvoiceTemplateName"))
                    {
                        model.TemplateTypes = dt.DataTableToList<CommonModel.InvoiceTemplateType>()?.ToList() ?? new List<CommonModel.InvoiceTemplateType>();
                        continue;
                    }

                    // Consolidated details
                    if (HasAnyColumn(dt, "InvoiceConsolidateId", "Category", "Amount", "SNo"))
                    {
                        model.LstInvoiceConsolidatedDetails = dt.DataTableToList<InvoiceConsolidateDetailsModel>()?.ToList() ?? new List<InvoiceConsolidateDetailsModel>();
                        continue;
                    }
                }
                catch
                {
                    // swallow mapping errors per table
                }
            }

            return model;
        }

        public bool UpdateInvoiceDetails(InvoiceViewModel model, IInvoiceService invoiceService)
        {
            Mapper.CreateMap<InvoiceViewModel, InvoiceDomainModel>();
            var dataModel = Mapper.Map<InvoiceViewModel, InvoiceDomainModel>(model);
            var status = invoiceService.UpdateInvoiceDetails(dataModel);
            if (status)
            {
                foreach (var visit in model.LstVisitProcessings)
                {
                    if (visit.PODate == Convert.ToDateTime("01/01/0001"))
                    {
                        visit.PODate = Convert.ToDateTime("01/01/1900");
                    }
                    if (visit.VisitDate == Convert.ToDateTime("01/01/0001"))
                    {
                        visit.VisitDate = Convert.ToDateTime("01/01/1900");
                    }

                    Mapper.CreateMap<VisitDetailsInvoiceModel, VisitDetailsInvoiceDomainModel>();
                    var data = Mapper.Map<VisitDetailsInvoiceModel, VisitDetailsInvoiceDomainModel>(visit);
                    invoiceService.UpdateAnnexureDetails(data);


                    //Mapper.CreateMap<VisitDetailsInvoiceModel, VisitDetailsInvoiceDomainModel>();
                    //var data = Mapper.Map<VisitDetailsInvoiceModel, VisitDetailsInvoiceDomainModel>(visit);
                    //invoiceService.UpdateAnnexureDetails(data);
                }
            }

            return status;
        }
        public List<InvoiceConsolidateDetailsModel> EditConsolidatedInvoiceDetails(Guid invoiceGuid, IInvoiceService invoiceService)
        {
            List<InvoiceConsolidateDetailsModel> model = new List<InvoiceConsolidateDetailsModel>();
            var consolidatedDetails = invoiceService.EditConsolidatedInvoiceDetails(invoiceGuid);
            Mapper.CreateMap<InvoiceConsolidateDomainModel, InvoiceConsolidateDetailsModel>();
            return model = consolidatedDetails.Select(Mapper.Map<InvoiceConsolidateDomainModel, InvoiceConsolidateDetailsModel>).ToList();
        }
        public bool UpdateConsolidatedInvoiceDetails(List<InvoiceConsolidateDetailsModel> dataModel, IInvoiceService invoiceService)
        {
            var retStatus = invoiceService.ClearPreviousConsolidatedInvoiceDetailsOnUpdate(dataModel.FirstOrDefault().InvoiceId);
            if (retStatus)
            {
                foreach (var data in dataModel)
                {
                    Mapper.CreateMap<InvoiceConsolidateDetailsModel, InvoiceConsolidateDomainModel>();
                    var consolidatedDetails = Mapper.Map<InvoiceConsolidateDetailsModel, InvoiceConsolidateDomainModel>(data);
                    invoiceService.UpdateConsolidatedInvoiceDetails(consolidatedDetails);
                }
            }

            return retStatus;
        }

        public bool CancelInvoice(Guid invoiceGuid, int currentLoggedInUser, string cancellationComments, IInvoiceService invoiceService)
        {
            var retStatus = invoiceService.CancelInvoice(invoiceGuid, currentLoggedInUser, cancellationComments);
            return retStatus;
        }
        public bool UpdateInvoiceStatus(Guid invoiceGuid, int statusId, int currentLoggedInUser, IInvoiceService invoiceService)
        {
            var retStatus = invoiceService.UpdateInvoiceStatus(invoiceGuid, statusId, currentLoggedInUser);
            return retStatus;
        }

        
        public List<InvoiceViewModel> GeInvoiceListToDownload(int loginUserSiteId, DateTime Startdate, DateTime Enddate, IInvoiceService invoiceService)
        {
            var visitProcessingDetails = invoiceService.GeInvoiceListToDownload(loginUserSiteId, Startdate, Enddate);
            Mapper.CreateMap<InvoiceDomainModel, InvoiceViewModel>();
            LstInvoiceViewModel = visitProcessingDetails.Select(Mapper.Map<InvoiceDomainModel, InvoiceViewModel>).ToList();
            return LstInvoiceViewModel;
        }

    }
}