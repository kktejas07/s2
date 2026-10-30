using AutoMapper;
using IQEApp.Domain.Invoice;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.EMMA;
using HtmlAgilityPack;
using IQEApp.Service.InvoiceService;
using IQEApp.Service.VisitProcessing;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.InvoiceModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.ServiceOrderModel;
using IQEApp.Web.Models.SiteDetailsModel;
using iTextSharp.text;
using iTextSharp.text.pdf;
using iTextSharp.tool.xml;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Newtonsoft.Json;

namespace IQEApp.Web.Controllers.Invoice
{
    //[CustomAuthorize(Roles = "Super Admin Role, Admin Role, Technician Role, Coordinator Role, Quality Check Role, Finance Role")]
    public class InvoiceController : BaseController
    {
        private readonly InvoiceService _invoiceService;

        InvoiceBusinessModel objBusinessModel = new InvoiceBusinessModel();

        public InvoiceController()
        {
            _invoiceService = new InvoiceService();
        }
        //
        // GET: /Invoice/
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.MenuFinance, CurrentUser.RoleId.FirstOrDefault()))
            {
                var model = new List<InvoiceViewModel>();
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                InvoiceSummaryModel summary;

                try
                {
                    model = objBusinessModel.GetInvoiceListForDirectory(CurrentUser.SiteId, "", "", 0, defaultFetchCount, true, "DESC", "", "Customer", out summary, _invoiceService);

                    if (model.Count > 0)
                    {
                        ViewBag.Total = model.FirstOrDefault().Total;
                        ViewBag.CurrentPageCount = defaultFetchCount;

                        ViewBag.TotalAmount = summary?.Grand_TotalAmount ?? 0;
                        ViewBag.GrandTotalAmount = summary?.Grand_GrandTotalAmount ?? 0;
                        ViewBag.AmountReceived = summary?.Grand_AmountReceived ?? 0;
                        ViewBag.GrandTDS = summary?.Grand_TDS ?? 0;
                        ViewBag.OutstandingAmount = summary?.Grand_OutstandingAmount ?? 0;
                        ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();// model.FirstOrDefault().RoleId;
                    }
                    else
                    {
                        ViewBag.Total = 0;
                        ViewBag.CurrentPageCount = 0;

                        ViewBag.TotalAmount = 0;
                        ViewBag.GrandTotalAmount = 0;
                        ViewBag.AmountReceived = 0;
                        ViewBag.GrandTDS = 0;
                        ViewBag.OutstandingAmount = 0;

                    }
                }
                catch (Exception e)
                {
                    // Handle or log error
                    Console.WriteLine(e);
                    throw;
                }

                return View("InvoiceDirectory", model);
            }
            else
            {
                return View("UnAuthorized");
            }
        }

        public ActionResult GetInvoiceList(int pageCount = 0, string strSearch = "", string alphaSearch = "", bool activeStatus = true, string sortingOrder = "DESC", string fiYear = "", string InvoiceType = "Customer")
        {
            List<InvoiceViewModel> list = new List<InvoiceViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            if (pageCount < 0)
                pageCount = 0;
            InvoiceSummaryModel summary;
            try
            {
                list = objBusinessModel.GetInvoiceListForDirectory(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, sortingOrder, fiYear, InvoiceType, out summary, _invoiceService);
                ViewBag.InvoiceType = InvoiceType;
                if (list.Count > 0)
                {
                    ViewBag.Total = list.FirstOrDefault().Total;
                    pageCount += defaultFetchCount;
                    ViewBag.CurrentPageCount = pageCount;

                    ViewBag.TotalAmount = summary?.Grand_TotalAmount ?? 0;
                    ViewBag.GrandTotalAmount = summary?.Grand_GrandTotalAmount ?? 0;
                    ViewBag.AmountReceived = summary?.Grand_AmountReceived ?? 0;
                    ViewBag.GrandTDS = summary?.Grand_TDS ?? 0;
                    ViewBag.OutstandingAmount = summary?.Grand_OutstandingAmount ?? 0;
                    ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
                }
                else
                {
                    ViewBag.Total = 0;
                    ViewBag.CurrentPageCount = 0;

                    ViewBag.TotalAmount = 0;
                    ViewBag.GrandTotalAmount = 0;
                    ViewBag.BaseValue = 0;
                    ViewBag.AmountReceived = 0;
                    ViewBag.GrandTDS = 0;
                    ViewBag.OutstandingAmount = 0;
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Add Client", ex);
            }
            return PartialView("_InvoiceList", list);
        }
        public ActionResult GenerateInvoice()
        {
            InvoiceDetailsModel model = new InvoiceDetailsModel();
            model = objBusinessModel.GetDefaultDetailsToGenerateInvoice(CurrentUser.SiteId, invoiceService: _invoiceService);
            // Do not overwrite lists returned by business model — keep populated collections so dropdowns bind on page load
            model.LstClientUnits = new List<ClientUnitsViewModel>();
            model.LstServiceOrders = new List<ServiceOrderViewModel>();
            model.LstControlNumbers = new List<ControlNumberViewModel>();
            model.LstManufacturerUnitDetails = new List<ManufacturerUnitsViewModel>();
            //model.LstClients = new List<ClientViewModel>();
            return View("GenerateInvoice", model);
        }

        public ActionResult GetVisitListForInvoice(InvoiceViewModel model)
        {
            InvoiceDetailsModel dataModel = new InvoiceDetailsModel();
            try
            {
                // If client supplied multiple ControlIds via comma separated in ControlId (legacy), parse
                // Prefer client to send list of visits; business model will handle multi-CNo via service SP.
                dataModel = objBusinessModel.GetVisitsListForInvoice(model, _invoiceService);
                // keep header mapping out of this method; it only returns visits/template/stats/cons
                // dataModel.LstVisitProcessings = dataModel.LstVisitProcessings ?? new List<VisitDetailsInvoiceModel>();
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("fetching visit list for invoice", ex);
                // dataModel.LstVisitProcessings = new List<VisitDetailsInvoiceModel>();
            }
            return PartialView("_VisitListForInvocie", dataModel);
        }

        // New helper to load visits for an existing invoice (Edit page)
        [HttpGet]
        public ActionResult GetVisitsListForInvoiceEdit(int invoiceId)
        {
            try
            {
                var model = objBusinessModel.GetVisitsListForInvoiceEdit(invoiceId, _invoiceService);
                model.LstVisitProcessings = model.LstVisitProcessings ?? new List<VisitDetailsInvoiceModel>();
                return PartialView("_VisitListForInvocie", model);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("GetVisitsListForInvoiceEdit error", ex);
                return PartialView("_VisitListForInvocie", new InvoiceDetailsModel { LstVisitProcessings = new List<VisitDetailsInvoiceModel>() });
            }
        }

        // New helper to load consolidated charges partial for an existing invoice
        [HttpGet]
        public ActionResult GetConsolidatedChargesPartial(Guid invoiceGuid)
        {
            try
            {
                var list = objBusinessModel.GetInvoiceConsolidatedDetails(0, invoiceGuid, _invoiceService);
                return PartialView("_ConsolidatedChargesList", list);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("GetConsolidatedChargesPartial error", ex);
                return PartialView("_ConsolidatedChargesList", new List<InvoiceConsolidateDetailsModel>());
            }
        }

        [HttpPost]
        public ActionResult SaveInvoiceDetails(InvoiceViewModel dataModel)
        {
            if (dataModel == null)
            {
                return Json(new { status = false, message = "No data received" });
            }

            try
            {
                int InvoiceId = 0;
                // var InvoiceGuid = "";
                var isSuccess = false;
                dataModel.UserId = CurrentUser.UserId;
                dataModel.LoginUserId = CurrentUser.UserId;
                dataModel.SiteId = CurrentUser.SiteId;
                dataModel.InvoiceDate = DateTime.Now;
                List<InvoiceConsolidateDetailsModel> model = new List<InvoiceConsolidateDetailsModel>();

                InvoiceId = objBusinessModel.SaveInvoiceCumAnnexureDetails(dataModel, _invoiceService);
                isSuccess = true;
                if (InvoiceId > 0)
                {
                    model = objBusinessModel.GetInvoiceConsolidatedDetails(InvoiceId, Guid.Empty, _invoiceService);
                    return PartialView("_ConsolidatedChargesList", model);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("SaveInvoiceDetails error", ex);
            }

            return Json(new { status = false });
        }

        public ActionResult GetConsolidatedInvoiceDetails(Guid invoiceGuid)
        {
            InvoiceConsolidateViewModel model = new InvoiceConsolidateViewModel();
            try
            {

                model.LstInvoiceConsolidateDetails = objBusinessModel.GetInvoiceConsolidatedDetails(0, invoiceGuid, _invoiceService);
                ViewBag.InvoiceGuid = invoiceGuid;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error while fetching consolidated invoice details", ex);
            }
            return View("ConsolidatedChargesList", model);
        }

        // Compatibility wrapper: some client code calls GetInvoiceConsolidatedDetails (different name/order).
        [AcceptVerbs(HttpVerbs.Get | HttpVerbs.Post)]
        public ActionResult GetInvoiceConsolidatedDetails(string invoiceGuid)
        {
            try
            {
                Guid guid = Guid.Empty;
                if (!string.IsNullOrWhiteSpace(invoiceGuid))
                    Guid.TryParse(invoiceGuid, out guid);
                return GetConsolidatedInvoiceDetails(guid);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("GetInvoiceConsolidatedDetails wrapper error", ex);
                return Json(new { status = false, message = "Error" }, JsonRequestBehavior.AllowGet);
            }
        }

        public ActionResult SaveConsolidatedInvoiceDetails(List<InvoiceConsolidateDetailsModel> model, string InvoiceType)
        {
            var InvoiceGuid = "";
            var isSuccess = false;
            try
            {
                objBusinessModel.SaveConsolidatedInvoiceDetails(model, _invoiceService);
                InvoiceGuid = PrintInvoice(model.FirstOrDefault().InvoiceId, InvoiceType);
                isSuccess = true;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error while saving consolidated invoice details", ex);
            }

            return Json(new { status = isSuccess, id = model.FirstOrDefault().InvoiceId, invoiceGuid = InvoiceGuid }, JsonRequestBehavior.AllowGet);
        }

        // Load the Edit page for an existing invoice by id
        public ActionResult EditInvoice(int invoiceId)
        {
            InvoiceDetailsModel model = new InvoiceDetailsModel();
            try
            {
                model = objBusinessModel.GetInvoiceDetailsForEdit(invoiceId, CurrentUser.SiteId, _invoiceService);

                // defensive initialization
                model.LstClientUnits = model.LstClientUnits ?? new List<ClientUnitsViewModel>();
                model.LstServiceOrders = model.LstServiceOrders ?? new List<ServiceOrderViewModel>();
                model.LstControlNumbers = model.LstControlNumbers ?? new List<ControlNumberViewModel>();
                model.LstManufacturerUnitDetails = model.LstManufacturerUnitDetails ?? new List<ManufacturerUnitsViewModel>();
                model.TemplateTypes = model.TemplateTypes ?? new List<CommonModel.InvoiceTemplateType>();
                model.LstInvoiceConsolidatedDetails = model.LstInvoiceConsolidatedDetails ?? new List<InvoiceConsolidateDetailsModel>();
                model.LstVisitProcessings = model.LstVisitProcessings ?? new List<VisitDetailsInvoiceModel>();
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error loading edit invoice", ex);
                model = new InvoiceDetailsModel();
            }

            return View("EditInvoice", model);
        }

        // Load the Edit page for an existing invoice by guid

        // Backwards-compatible alias
        public ActionResult GetInvoiceDetailsForEdit(int invoiceId)
        {
            return EditInvoice(invoiceId);
        }


        #region InvoiceDesignForDevelopment
        public ActionResult ViewInvoiceTemplate(int templateType = 1)
        {
            InvoicePrintModel model = new InvoicePrintModel();
            model.InvoiceDetails = new InvoiceViewModel();
            model.InvoiceDetails.LstVisitProcessings = new List<VisitDetailsInvoiceModel>();
            model.SiteDetails = new SiteDetailsModel();
            model.LstInvoiceConsolidatedDetails = new List<InvoiceConsolidateDetailsModel>();

            return View("~/views/Invoice/InvoiceTemplateWithoutTimings.cshtml", model);
        }
        public ActionResult InvoiceDraft(int invoiceId = 15)
        {
            var isSuccess = false;
            var invoiceGuid = "";
            try
            {
                var model = objBusinessModel.GetInvoiceDataToPrint(invoiceId, CurrentUser.SiteId, _invoiceService);
                invoiceGuid = model.InvoiceDetails.InvoiceGuid.ToString();
                //return View("InvoiceTemplateWithoutTimings", data);
                string templateType = model.InvoiceDetails.InvoiceTemplateId == 1 ? "InvoiceTemplateWithoutTimings" : "InvoiceTemplateWithTimings";
                model.InvoiceDetails.AmountInWords =
                    Utils.ConvertExtensions.NumberToWords.ConvertAmount(double.Parse(model.InvoiceDetails.GrandTotalAmount.ToString()));
                model.InvoiceDetails.TotalInWords =
                    Utils.ConvertExtensions.NumberToWords.ConvertAmount(double.Parse(model.InvoiceDetails.TotalAmount.ToString()));
                string viewContent = ConvertViewToString(templateType, model);
                var invoiceTitle = model.InvoiceDetails.InvoiceNo + "_Rev" + model.InvoiceDetails.CurrentVersion;
                var clientName = model.InvoiceDetails.ClientName;
                //if(model.InvoiceDetails.InvoiceTemplateId == 1)
                //CreateInvoicePdf(viewContent, model.InvoiceDetails.InvoiceNo, invoiceTitle, CurrentUser.SiteId, invoiceId, clientName);
                //if(model.InvoiceDetails.InvoiceTemplateId ==2)
                CreateInvoicePdf2(viewContent, model.InvoiceDetails.InvoiceNo, invoiceTitle, CurrentUser.SiteId, invoiceId, clientName);
                isSuccess = true;
                return View(templateType, model);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("saving invoice details error", ex);
            }
            return Json(new { status = isSuccess, retMsg = "" }, JsonRequestBehavior.AllowGet);
        }

        #endregion

        #region InvoicePrint
        public string PrintInvoice11(int invoiceId, string InvoiceType)
        {
            var isSuccess = false;
            var invoiceGuid = "";
            try
            {
                var data = objBusinessModel.GetInvoiceDataToPrint(invoiceId, CurrentUser.SiteId, _invoiceService);
                invoiceGuid = data.InvoiceDetails.InvoiceGuid.ToString();
                string templateType;
                if (InvoiceType == "Customer")
                {
                    templateType = data.InvoiceDetails.InvoiceTemplateId == 1 ? "InvoiceTemplateWithoutTimings" : "InvoiceTemplateWithTimings";
                }
                else
                {
                    templateType = data.InvoiceDetails.InvoiceTemplateId == 1 ? "InvoiceManuTemplateWithoutTimings" : "InvoiceManuTemplateWithTimings";
                }
                data.InvoiceDetails.AmountInWords = Utils.ConvertExtensions.NumberToWords.ConvertAmount(double.Parse(data.InvoiceDetails.GrandTotalAmount.ToString()));
                data.InvoiceDetails.TotalInWords = Utils.ConvertExtensions.NumberToWords.ConvertAmount(double.Parse(data.InvoiceDetails.TotalAmount.ToString()));
                string viewContent = ConvertViewToString(templateType, data);
                var invoiceTitle = data.InvoiceDetails.InvoiceNo + "_Rev" + data.InvoiceDetails.CurrentVersion;
                var clientName = data.InvoiceDetails.ClientName;
                //if(data.InvoiceDetails.InvoiceTemplateId == 1)
                //CreateInvoicePdf(viewContent, data.InvoiceDetails.InvoiceNo, invoiceTitle, CurrentUser.SiteId, invoiceId, clientName);
                //if(data.InvoiceDetails.InvoiceTemplateId == 2)
                CreateInvoicePdf2(viewContent, data.InvoiceDetails.InvoiceNo, invoiceTitle, CurrentUser.SiteId, invoiceId, clientName);
                isSuccess = true;
                //objBusinessModel.UpdateInvoiceStatus(data.InvoiceDetails.InvoiceGuid, (int)VisitStatus.PrintInvoice, CurrentUser.UserId, _invoiceService);
            }
            catch (Exception ex)
            {

                errorLogObj.LogError("saving invoice details error", ex);
            }

            return invoiceGuid;
            //return Json(new {status = isSuccess, retMsg = ""}, JsonRequestBehavior.AllowGet);
        }

        public string PrintInvoice(int invoiceId, string invoiceType)
        {
            string invoiceGuid = string.Empty;

            try
            {
                var data = objBusinessModel.GetInvoiceDataToPrint(
                    invoiceId,
                    CurrentUser.SiteId,
                    _invoiceService);

                var details = data?.InvoiceDetails;
                if (details == null)
                    return invoiceGuid;

                invoiceGuid = details.InvoiceGuid.ToString();

                // ✅ Fast template resolution
                string templateType = ResolveTemplate(invoiceType, details.InvoiceTemplateId);

                // ✅ Fast numeric conversion (no boxing/string)
                details.AmountInWords = ConvertAmountSafe(details.GrandTotalAmount);
                details.TotalInWords = ConvertAmountSafe(details.TotalAmount);

                // ✅ Render once
                string viewContent = ConvertViewToString(templateType, data);

                // ✅ Pre-build title efficiently
                string invoiceTitle = string.Concat(
                    details.InvoiceNo,
                    "_Rev",
                    details.CurrentVersion);

                // ✅ PDF generation
                CreateInvoicePdf2(
                    viewContent,
                    details.InvoiceNo,
                    invoiceTitle,
                    CurrentUser.SiteId,
                    invoiceId,
                    details.ClientName);

                // 🔒 Optional status update (keep if needed)
                // objBusinessModel.UpdateInvoiceStatus(
                //     details.InvoiceGuid,
                //     (int)VisitStatus.PrintInvoice,
                //     CurrentUser.UserId,
                //     _invoiceService);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("PrintInvoice error", ex);
            }

            return invoiceGuid;
        }

        private static string ConvertAmountSafe(object amountObj)
        {
            if (amountObj == null)
                return string.Empty;

            // fast path for numeric types
            if (amountObj is double d)
                return Utils.ConvertExtensions.NumberToWords.ConvertAmount(d);

            if (amountObj is decimal dec)
                return Utils.ConvertExtensions.NumberToWords.ConvertAmount((double)dec);

            if (double.TryParse(amountObj.ToString(), out double parsed))
                return Utils.ConvertExtensions.NumberToWords.ConvertAmount(parsed);

            return string.Empty;
        }

        private static string ResolveTemplate(string invoiceType, int templateId)
        {
            bool withoutTimings = templateId == 1;

            // fastest case-insensitive check
            if (invoiceType?.Equals("Customer", StringComparison.OrdinalIgnoreCase) == true)
            {
                return withoutTimings
                    ? "InvoiceTemplateWithoutTimings"
                    : "InvoiceTemplateWithTimings";
            }

            if (invoiceType?.Equals("Supplier", StringComparison.OrdinalIgnoreCase) == true)
            {
                return withoutTimings
                    ? "InvoiceManuTemplateWithoutTimings"
                    : "InvoiceManuTemplateWithTimings";
            }

            // safe fallback
            return "InvoiceTemplateWithoutTimings";
        }

        private string ConvertViewToString(string viewName, object model)
        {
            string val = "";
            try
            {
                ViewData.Model = model;
                using (StringWriter writer = new StringWriter())
                {
                    ViewEngineResult vResult = ViewEngines.Engines.FindPartialView(ControllerContext, viewName);
                    ViewContext vContext = new ViewContext(this.ControllerContext, vResult.View, ViewData, new TempDataDictionary(), writer);
                    vResult.View.Render(vContext, writer);
                    return writer.ToString();
                }
            }
            catch (Exception ex)
            {
                this.errorLogObj.LogError(Request.Url.PathAndQuery + "Error Convert View To String", ex);
                val = ex.ToString();
            }
            return val;
        }

        // working code 
        public string CreateInvoicePdf(string GridHtml, string invoiceNo, string invoiceTitle, int siteId, int invoiceId, string clientName)
        {

            HtmlNode.ElementsFlags["img"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["input"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["br"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["hr"] = HtmlElementFlag.Closed;
            HtmlDocument doc = new HtmlDocument();
            doc.OptionFixNestedTags = true;
            doc.LoadHtml(GridHtml);
            GridHtml = doc.DocumentNode.OuterHtml;
            byte[] bytes;
            string logo = ConfigurationManager.AppSettings["Logo"];
            using (MemoryStream stream = new System.IO.MemoryStream())
            {
                //StringReader sr = new StringReader(GridHtml);
                //iTextSharp.text.Document pdfDoc = new iTextSharp.text.Document(PageSize.A4, 20f, 10f, 45f, 45f);
                //PdfWriter writer = PdfWriter.GetInstance(pdfDoc, stream);
                //pdfDoc.Open();
                //XMLWorkerHelper.GetInstance().ParseXHtml(writer, pdfDoc, sr);
                //pdfDoc.Close();



                var lines = GridHtml.Split(new[] { "<div style=\"page-break-before:always\">&nbsp;</div>" }, StringSplitOptions.None);
                lines[0] += "</div>\r\n</body>\r\n </html>";
                //lines[1] = "<!DOCTYPE html>\r\n<html xmlns=\"http://www.w3.org/1999/xhtml\">\r\n<head>\r\n<style type=\"text/css\">\r\n.invoice-box {\r\n width: 100%;\r\n  /*margin: auto;*/\r\n            padding: 30px;\r\n            /*border: 1px solid #eee;*/\r\n            /*box-shadow: 0 0 10px rgba(0, 0, 0, .15);*/\r\n            font-size: 14px;\r\n            line-height: 24px;\r\n            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;\r\n            color: #555;\r\n        }\r\n\r\n            .invoice-box table {\r\n                width: 95%;\r\n                line-height: inherit;\r\n                text-align: left;\r\n            }\r\n\r\n                .invoice-box table td {\r\n                    padding: 2px;\r\n                    vertical-align: top;\r\n                }\r\n\r\n                .invoice-box table tr td:nth-child(2) {\r\n                    text-align: right;\r\n                }\r\n\r\n                .invoice-box table tr.top table td {\r\n                    padding-bottom: 15px;\r\n                }\r\n\r\n                    .invoice-box table tr.top table td.title {\r\n                        font-size: 45px;\r\n                        line-height: 45px;\r\n                        color: #333;\r\n                    }\r\n\r\n                .invoice-box table tr.information table td {\r\n                    /*padding-bottom: 40px;*/\r\n                }\r\n\r\n                .invoice-box table tr.heading td {\r\n                    background: #eee;\r\n                    border-bottom: 1px solid #ddd;\r\n                    font-weight: bold;\r\n                }\r\n\r\n                .invoice-box table tr.details td {\r\n                    padding-bottom: 15px;\r\n                }\r\n\r\n                .invoice-box table tr.item td {\r\n                    border-bottom: 1px solid #eee;\r\n                }\r\n\r\n                .invoice-box table tr.item.last td {\r\n                    border-bottom: none;\r\n                }\r\n\r\n                .invoice-box table tr.total td:nth-child(2) {\r\n                    border-top: 2px solid #eee;\r\n                    font-weight: bold;\r\n                }\r\n\r\n        .billing table tr td {\r\n            border: 1px solid black;\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        .individual table tr td {\r\n            border: 1px solid black;\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        .page {\r\n            -webkit-transform: rotate(-90deg);\r\n            -moz-transform: rotate(-90deg);\r\n            filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);\r\n        }\r\n\r\n        .font10 {\r\n            font-size: 10px;\r\n        }\r\n\r\n        .font12 {\r\n            font-size: 12px;\r\n        }\r\n        .font13 {\r\n            font-size: 13px;\r\n        }\r\n        .font14 {\r\n            font-size: 14px;\r\n        }\r\n\r\n        .font15 {\r\n            font-size: 15px;\r\n        }\r\n\r\n        .font20 {\r\n            font-size: 20px;\r\n        }\r\n\r\n        .p0 {\r\n            padding: 0px;\r\n        }\r\n    </style>\r\n</head>\r\n<body>\r\n  <div> " + lines[1];

                lines[1] = "<!DOCTYPE html>\r\n<html xmlns=\"http://www.w3.org/1999/xhtml\">\r\n<head>\r\n<style type=\"text/css\">\r\n.invoice-box {\r\n width: 100%;\r\n  /*margin: auto;*/\r\n            padding: 30px;\r\n            /*border: 1px solid #eee;*/\r\n            /*box-shadow: 0 0 10px rgba(0, 0, 0, .15);*/\r\n            font-size: 14px;\r\n            line-height: 24px;\r\n            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;\r\n            color: #555;\r\n        }\r\n\r\n            .invoice-box table {\r\n                width: 95%;\r\n                line-height: inherit;\r\n                text-align: left;\r\n            }\r\n\r\n                .invoice-box table td {\r\n                    padding: 2px;\r\n                    vertical-align: top;\r\n                }\r\n\r\n                .invoice-box table tr td:nth-child(2) {\r\n                    text-align: right;\r\n                }\r\n\r\n                .invoice-box table tr.top table td {\r\n                    padding-bottom: 15px;\r\n                }\r\n\r\n                    .invoice-box table tr.top table td.title {\r\n                        font-size: 45px;\r\n                        line-height: 45px;\r\n                        color: #333;\r\n                    }\r\n\r\n                .invoice-box table tr.information table td {\r\n                    /*padding-bottom: 40px;*/\r\n                }\r\n\r\n                .invoice-box table tr.heading td {\r\n                    background: #eee;\r\n                    border-bottom: 1px solid #ddd;\r\n                    font-weight: bold;\r\n                }\r\n\r\n                .invoice-box table tr.details td {\r\n                    padding-bottom: 15px;\r\n                }\r\n\r\n                .invoice-box table tr.item td {\r\n                    border-bottom: 1px solid #eee;\r\n                }\r\n\r\n                .invoice-box table tr.item.last td {\r\n                    border-bottom: none;\r\n                }\r\n\r\n                .invoice-box table tr.total td:nth-child(2) {\r\n                    border-top: 2px solid #eee;\r\n                    font-weight: bold;\r\n                }\r\n\r\n        .billing table tr td {\r\n            border: 1px solid black;\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        .individual table tr td {\r\n            border: 1px solid black;\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        .page {\r\n            -webkit-transform: rotate(-90deg);\r\n            -moz-transform: rotate(-90deg);\r\n            filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);\r\n        }\r\n\r\n        .font10 {\r\n            font-size: 10px;\r\n        }\r\n\r\n        .font12 {\r\n            font-size: 12px;\r\n        }\r\n        .font13 {\r\n            font-size: 13px;\r\n        }\r\n        .font14 {\r\n            font-size: 14px;\r\n        }\r\n\r\n        .font15 {\r\n            font-size: 15px;\r\n        }\r\n\r\n        .font20 {\r\n            font-size: 20px;\r\n        }\r\n\r\n        .p0 {\r\n            padding: 0px;\r\n}\r\n </style>\r\n</head>\r\n<body>\r\n  <div> " + lines[1];

                //if (lines[1].Contains("<tr id=\"10\">"))
                //{
                //    lines[1] = lines[1].Replace("<p style=\"page-break-after: always;\">&nbsp;</p><tr id=\"10\">", "<tr style=\"border-top-style: none;\" > <td colspan=\"14\" style=\"border:0\">'</td></tr><tr style=\"border:0;\"><td colspan=\"14\" style=\"border:0\">'</td></tr><tr style=\"border:0;\"><td colspan=\"14\" style=\"border:0;\" >'</td></tr><tr style=\"align-items: center;  padding-top: 500px;\" >\r\n        <td style=\"width: 5%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      S.No\r\n  </b>\r\n        </td>\r\n\r\n        <td style=\"width: 12%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Visit Date\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 15%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Supplier Details <br /><hr class=\"class-1\" />\r\n      Location\r\n  </b>\r\n        </td>\r\n        \r\n        <td style=\"width: 15%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      PO No <br /><hr class=\"class-1\" />Date\r\n  </b>\r\n        </td>\r\n        \r\n        <td style=\"width: 15%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Insp Name <br /><hr class=\"class-1\" />\r\n      Report No\r\n  </b>\r\n        </td>\r\n        \r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Distance\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Mileage Cost\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Boarding Charges\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Hotel\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Travel Fare\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Other Expenses\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Service Charge\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Total\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 20%;align-items: center\" class=\"font10\">\r\n  <b>\r\n     Remarks\r\n</b>\r\n </td>\r\n   </tr>\r\n <tr id=\"10\">");
                //    // lines[1] = lines[1].Replace("<tr id=\"10\">", "<tr style=\"align-items: center;  padding-top: 500px;\" >\r\n        <td style=\"width: 5%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      S.No\r\n  </b>\r\n        </td>\r\n\r\n        <td style=\"width: 12%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Visit Date\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 15%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Supplier Details <br /><hr class=\"class-1\" />\r\n      Location\r\n  </b>\r\n        </td>\r\n        \r\n        <td style=\"width: 15%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      PO No <br /><hr class=\"class-1\" />Date\r\n  </b>\r\n        </td>\r\n        \r\n        <td style=\"width: 15%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Insp Name <br /><hr class=\"class-1\" />\r\n      Report No\r\n  </b>\r\n        </td>\r\n        \r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Distance\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Mileage Cost\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Boarding Charges\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Hotel\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Travel Fare\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Other Expenses\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Service Charge\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 12%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Total\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 20%;align-items: center\" class=\"font10\">\r\n  <b>\r\n     Remarks\r\n</b>\r\n </td>\r\n   </tr>\r\n <tr id=\"10\">");
                //}


                StringReader sr = new StringReader(lines[0]);

                iTextSharp.text.Document pdfDoc = new iTextSharp.text.Document(PageSize.A4, 20f, 10f, 45f, 45f);
                PdfWriter pdfWriter = PdfWriter.GetInstance(pdfDoc, stream);
                pdfDoc.Open();
                //pdfDoc.Add(new Paragraph(lines[0]));

                //pdfDoc.SetPageSize(new Rectangle(950f, 1100f));
                XMLWorkerHelper.GetInstance().ParseXHtml(pdfWriter, pdfDoc, sr);


                StringReader sr1 = new StringReader(lines[1]);
                pdfDoc.SetPageSize(new Rectangle(950f, 845f));
                pdfDoc.NewPage();
                XMLWorkerHelper.GetInstance().ParseXHtml(pdfWriter, pdfDoc, sr1);
                pdfDoc.Close();
                bytes = stream.ToArray();
            }
            string fileContainerPath = ConfigurationManager.AppSettings["InvoicePath"];
            Font headerFontStyle = FontFactory.GetFont("Arial", 10, Font.NORMAL, BaseColor.BLACK);
            Font footerFontStyle = FontFactory.GetFont("Arial", 12, Font.NORMAL, BaseColor.BLACK);
            string tempFileName = Guid.NewGuid() + ".pdf";
            string filePath = fileContainerPath + tempFileName;

            string strHeader = "Ideal Quality Engineers (I) Pvt.Ltd ";
            string strHeader1 = "Flat No. 302, Plot No. 410, Mathrusri Nagar, Miyapur, Hyderabad - 500 049. Ph: 040-48543475, Mobile:09542028555";

            using (MemoryStream stream = new MemoryStream())
            {
                PdfReader reader = new PdfReader(bytes);
                using (PdfStamper stamper = new PdfStamper(reader, stream))
                {
                    int pages = reader.NumberOfPages;
                    for (int i = 2; i <= pages; i++)
                    {
                        Image image = Image.GetInstance(Server.MapPath("~/Images/IQElogo.png")); // Image.GetInstance(logo);
                        image.Alignment = Image.ALIGN_LEFT;

                        var pdfContentByte = stamper.GetOverContent(i);
                        image.SetAbsolutePosition(10, 780);
                        pdfContentByte.AddImage(image);

                        if (i >= 3)
                        {
                            ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_RIGHT, new Phrase("Client Name :" + clientName, headerFontStyle), 780, 780, 0);
                            ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_RIGHT, new Phrase("Document :Annexure to Invoice No: " + invoiceNo, headerFontStyle), 950, 770, 0);
                            ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_RIGHT, new Phrase("Date :", headerFontStyle), 900, 760, 0);
                        }
                        ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_LEFT, new Phrase(strHeader, headerFontStyle), 20, 760, 0);
                        ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_LEFT, new Phrase(strHeader1, headerFontStyle), 20, 750, 0);
                        ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_CENTER, new Phrase((i - 1).ToString() + " / " + (pages - 1).ToString(), footerFontStyle), 500f, 20, 0);
                        ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_CENTER, new Phrase("Authorized Signatory", footerFontStyle), 800f, 20, 0);
                    }
                }
                bytes = stream.ToArray();
            }
            System.IO.File.WriteAllBytes(filePath, bytes);

            string retFileNameFromAzure = string.Empty;
            string fileName = filePath;

            invoiceTitle = invoiceTitle.Replace('/', '_');
            if (System.IO.File.Exists(filePath))
            {
                retFileNameFromAzure = filePath;
                double fileSize = filePath.Length;
                if (!string.IsNullOrEmpty(retFileNameFromAzure))
                {
                    try
                    {
                        _invoiceService.UpdateInvoiceFileDetails(invoiceId, invoiceTitle, retFileNameFromAzure, Convert.ToDecimal(fileSize), CurrentUser.UserId);
                    }
                    catch (Exception e)
                    {
                        this.errorLogObj.LogError(Request.Url.PathAndQuery + "Error while updating summary detail uploaded file details", e);
                        var status = new FileBusinessModel().DeleteFileFromAzure(retFileNameFromAzure, siteId);
                    }
                }
            }
            return null;
        }

        public string CreateInvoicePdf2(string GridHtml, string invoiceNo, string invoiceTitle, int siteId, int invoiceId, string clientName)
        {

            HtmlNode.ElementsFlags["img"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["input"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["br"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["hr"] = HtmlElementFlag.Closed;
            HtmlDocument doc = new HtmlDocument();
            doc.OptionFixNestedTags = true;
            doc.LoadHtml(GridHtml);
            GridHtml = doc.DocumentNode.OuterHtml;
            byte[] bytes;
            string logo = ConfigurationManager.AppSettings["Logo"];
            using (MemoryStream stream = new System.IO.MemoryStream())
            {
                var lines = GridHtml.Split(new[] { "<div style=\"page-break-before:always\">&nbsp;</div>" }, StringSplitOptions.None);
                lines[0] += "</div>\r\n</body>\r\n </html>";

                lines[1] = "<!DOCTYPE html>\r\n<html xmlns=\"http://www.w3.org/1999/xhtml\">\r\n<head>\r\n<style type=\"text/css\">\r\n.invoice-box {\r\n width: 100%;\r\n  /*margin: auto;*/\r\n            padding: 30px;\r\n            /*border: 1px solid #eee;*/\r\n            /*box-shadow: 0 0 10px rgba(0, 0, 0, .15);*/\r\n            font-size: 14px;\r\n            line-height: 24px;\r\n            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;\r\n            color: #555;\r\n        }\r\n\r\n            .invoice-box table {\r\n                width: 95%;\r\n                line-height: inherit;\r\n                text-align: left;\r\n            }\r\n\r\n                .invoice-box table td {\r\n                    padding: 2px;\r\n                    vertical-align: top;\r\n                }\r\n\r\n                .invoice-box table tr td:nth-child(2) {\r\n                    text-align: right;\r\n                }\r\n\r\n                .invoice-box table tr.top table td {\r\n                    padding-bottom: 15px;\r\n                }\r\n\r\n                    .invoice-box table tr.top table td.title {\r\n                        font-size: 45px;\r\n                        line-height: 45px;\r\n                        color: #333;\r\n                    }\r\n\r\n                .invoice-box table tr.information table td {\r\n                    /*padding-bottom: 40px;*/\r\n                }\r\n\r\n                .invoice-box table tr.heading td {\r\n                    background: #eee;\r\n                    border-bottom: 1px solid #ddd;\r\n                    font-weight: bold;\r\n                }\r\n\r\n                .invoice-box table tr.details td {\r\n                    padding-bottom: 15px;\r\n                }\r\n\r\n                .invoice-box table tr.item td {\r\n                    border-bottom: 1px solid #eee;\r\n                }\r\n\r\n                .invoice-box table tr.item.last td {\r\n                    border-bottom: none;\r\n                }\r\n\r\n                .invoice-box table tr.total td:nth-child(2) {\r\n                    border-top: 2px solid #eee;\r\n                    font-weight: bold;\r\n                }\r\n\r\n        .billing table tr td {\r\n            border: 1px solid black;\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        .individual table tr td {\r\n            border: 1px solid black;\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        .page {\r\n            -webkit-transform: rotate(-90deg);\r\n            -moz-transform: rotate(-90deg);\r\n            filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);\r\n        }\r\n\r\n        .font10 {\r\n            font-size: 10px;\r\n        }\r\n\r\n        .font12 {\r\n            font-size: 12px;\r\n        }\r\n        .font13 {\r\n            font-size: 13px;\r\n        }\r\n        .font14 {\r\n            font-size: 14px;\r\n        }\r\n\r\n        .font15 {\r\n            font-size: 15px;\r\n        }\r\n\r\n        .font20 {\r\n            font-size: 20px;\r\n        }\r\n\r\n        .p0 {\r\n            padding: 0px;\r\n}\r\n </style>\r\n</head>\r\n<body>\r\n  <div> " + lines[1];

                StringReader sr = new StringReader(lines[0]);

                iTextSharp.text.Document pdfDoc = new iTextSharp.text.Document(PageSize.A4, 40f, 10f, 45f, 45f);
                PdfWriter pdfWriter = PdfWriter.GetInstance(pdfDoc, stream);
                pdfDoc.Open();
                XMLWorkerHelper.GetInstance().ParseXHtml(pdfWriter, pdfDoc, sr);

                StringReader sr1 = new StringReader(lines[1]);
                pdfDoc.SetPageSize(PageSize.A4.Rotate());
                pdfDoc.NewPage();

                XMLWorkerHelper.GetInstance().ParseXHtml(pdfWriter, pdfDoc, sr1);
                pdfDoc.Close();
                bytes = stream.ToArray();
            }
            string fileContainerPath = ConfigurationManager.AppSettings["InvoicePath"];
            Font headerFontStyle = FontFactory.GetFont("Arial", 10, Font.NORMAL, BaseColor.BLACK);
            Font footerFontStyle = FontFactory.GetFont("Arial", 12, Font.NORMAL, BaseColor.BLACK);
            string tempFileName = Guid.NewGuid() + ".pdf";
            string filePath = fileContainerPath + tempFileName;

            string strHeader = "Ideal Quality Engineers (I) Pvt.Ltd";
            string strHeader1 = "Flat No. 302, Plot No. 410, Mathrusri Nagar, Miyapur, Hyderabad - 500 049. Ph: 040-48543475, Mobile:09542028555";
         
            using (MemoryStream stream = new MemoryStream())
            {
                PdfReader reader = new PdfReader(bytes);
                using (PdfStamper stamper = new PdfStamper(reader, stream))
                {


                    int pages = reader.NumberOfPages;
                    for (int i = 2; i <= pages; i++)
                    {
                        ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_CENTER, new Phrase((i - 1).ToString() + " / " + (pages - 1).ToString(), footerFontStyle), 400f, 20, 0);
                        ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_CENTER, new Phrase("Authorized Signatory", footerFontStyle), 730f, 20, 0);
                    }
                }
                bytes = stream.ToArray();
            }

            System.IO.File.WriteAllBytes(filePath, bytes);

            string retFileNameFromAzure = string.Empty;
            string fileName = filePath;

            invoiceTitle = invoiceTitle.Replace('/', '_');
            if (System.IO.File.Exists(filePath))
            {

                retFileNameFromAzure = filePath;
                double fileSize = filePath.Length;
                //  System.IO.File.Delete(filePath);
                if (!string.IsNullOrEmpty(retFileNameFromAzure))
                {
                    try
                    {
                        _invoiceService.UpdateInvoiceFileDetails(invoiceId, invoiceTitle, retFileNameFromAzure, Convert.ToDecimal(fileSize), CurrentUser.UserId);
                    }
                    catch (Exception e)
                    {
                        this.errorLogObj.LogError(Request.Url.PathAndQuery + "Error while updating summary detail uploaded file details", e);
                        // need to delete uploaded file as the status not updated to completed in summary details, so the file will be uploaded again.
                        var status = new FileBusinessModel().DeleteFileFromAzure(retFileNameFromAzure, siteId);
                    }
                }

            }
            return null;
        }

        public string CreateInvoicePdf1(string GridHtml, string invoiceNo, string invoiceTitle, int siteId, int invoiceId, string clientName)
        {

            HtmlNode.ElementsFlags["img"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["input"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["br"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["hr"] = HtmlElementFlag.Closed;
            HtmlDocument doc = new HtmlDocument();
            doc.OptionFixNestedTags = true;
            doc.LoadHtml(GridHtml);
            GridHtml = doc.DocumentNode.OuterHtml;
            byte[] bytes;
            string logo = ConfigurationManager.AppSettings["Logo"];
            using (MemoryStream stream = new System.IO.MemoryStream())
            {


                var lines = GridHtml.Split(new[] { "<div style=\"page-break-before:always\">&nbsp;</div>" }, StringSplitOptions.None);
                lines[0] += "</div>\r\n</body>\r\n </html>";
                //lines[1] = "<!DOCTYPE html>\r\n<html xmlns=\"http://www.w3.org/1999/xhtml\">\r\n<head>\r\n<style type=\"text/css\">\r\n.invoice-box {\r\n width: 100%;\r\n  /*margin: auto;*/\r\n            padding: 30px;\r\n            /*border: 1px solid #eee;*/\r\n            /*box-shadow: 0 0 10px rgba(0, 0, 0, .15);*/\r\n            font-size: 14px;\r\n            line-height: 24px;\r\n            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;\r\n            color: #555;\r\n        }\r\n\r\n            .invoice-box table {\r\n                width: 95%;\r\n                line-height: inherit;\r\n                text-align: left;\r\n            }\r\n\r\n                .invoice-box table td {\r\n                    padding: 2px;\r\n                    vertical-align: top;\r\n                }\r\n\r\n                .invoice-box table tr td:nth-child(2) {\r\n                    text-align: right;\r\n                }\r\n\r\n                .invoice-box table tr.top table td {\r\n                    padding-bottom: 15px;\r\n                }\r\n\r\n                    .invoice-box table tr.top table td.title {\r\n                        font-size: 45px;\r\n                        line-height: 45px;\r\n                        color: #333;\r\n                    }\r\n\r\n                .invoice-box table tr.information table td {\r\n                    /*padding-bottom: 40px;*/\r\n                }\r\n\r\n                .invoice-box table tr.heading td {\r\n                    background: #eee;\r\n                    border-bottom: 1px solid #ddd;\r\n                    font-weight: bold;\r\n                }\r\n\r\n                .invoice-box table tr.details td {\r\n                    padding-bottom: 15px;\r\n                }\r\n\r\n                .invoice-box table tr.item td {\r\n                    border-bottom: 1px solid #eee;\r\n                }\r\n\r\n                .invoice-box table tr.item.last td {\r\n                    border-bottom: none;\r\n                }\r\n\r\n                .invoice-box table tr.total td:nth-child(2) {\r\n                    border-top: 2px solid #eee;\r\n                    font-weight: bold;\r\n                }\r\n\r\n        .billing table tr td {\r\n            border: 1px solid black;\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        .individual table tr td {\r\n            border: 1px solid black;\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        .page {\r\n            -webkit-transform: rotate(-90deg);\r\n            -moz-transform: rotate(-90deg);\r\n            filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);\r\n        }\r\n\r\n        .font10 {\r\n            font-size: 10px;\r\n        }\r\n\r\n        .font12 {\r\n            font-size: 12px;\r\n        }\r\n        .font13 {\r\n            font-size: 13px;\r\n        }\r\n        .font14 {\r\n            font-size: 14px;\r\n        }\r\n\r\n        .font15 {\r\n            font-size: 15px;\r\n        }\r\n\r\n        .font20 {\r\n            font-size: 20px;\r\n        }\r\n\r\n        .p0 {\r\n            padding: 0px;\r\n        }\r\n    </style>\r\n</head>\r\n<body>\r\n  <div> " + lines[1];

                lines[1] = "<!DOCTYPE html>\r\n<html xmlns=\"http://www.w3.org/1999/xhtml\">\r\n<head>\r\n<style type=\"text/css\">\r\n.invoice-box {\r\n width: 100%;\r\n  /*margin: auto;*/\r\n            padding: 30px;\r\n            /*border: 1px solid #eee;*/\r\n            /*box-shadow: 0 0 10px rgba(0, 0, 0, .15);*/\r\n            font-size: 14px;\r\n            line-height: 24px;\r\n            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;\r\n            color: #555;\r\n        }\r\n\r\n            .invoice-box table {\r\n                width: 95%;\r\n                line-height: inherit;\r\n                text-align: left;\r\n            }\r\n\r\n                .invoice-box table td {\r\n                    padding: 2px;\r\n                    vertical-align: top;\r\n                }\r\n\r\n                .invoice-box table tr td:nth-child(2) {\r\n                    text-align: right;\r\n                }\r\n\r\n                .invoice-box table tr.top table td {\r\n                    padding-bottom: 15px;\r\n                }\r\n\r\n                    .invoice-box table tr.top table td.title {\r\n                        font-size: 45px;\r\n                        line-height: 45px;\r\n                        color: #333;\r\n                    }\r\n\r\n                .invoice-box table tr.information table td {\r\n                    /*padding-bottom: 40px;*/\r\n                }\r\n\r\n                .invoice-box table tr.heading td {\r\n                    background: #eee;\r\n                    border-bottom: 1px solid #ddd;\r\n                    font-weight: bold;\r\n                }\r\n\r\n                .invoice-box table tr.details td {\r\n                    padding-bottom: 15px;\r\n                }\r\n\r\n                .invoice-box table tr.item td {\r\n                    border-bottom: 1px solid #eee;\r\n                }\r\n\r\n                .invoice-box table tr.item.last td {\r\n                    border-bottom: none;\r\n                }\r\n\r\n                .invoice-box table tr.total td:nth-child(2) {\r\n                    border-top: 2px solid #eee;\r\n                    font-weight: bold;\r\n                }\r\n\r\n        .billing table tr td {\r\n            border: 1px solid black;\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        .individual table tr td {\r\n            border: 1px solid black;\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        .page {\r\n            -webkit-transform: rotate(-90deg);\r\n            -moz-transform: rotate(-90deg);\r\n            filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);\r\n        }\r\n\r\n        .font10 {\r\n            font-size: 10px;\r\n        }\r\n\r\n        .font12 {\r\n            font-size: 12px;\r\n        }\r\n        .font13 {\r\n            font-size: 13px;\r\n        }\r\n        .font14 {\r\n            font-size: 14px;\r\n        }\r\n\r\n        .font15 {\r\n            font-size: 15px;\r\n        }\r\n\r\n        .font20 {\r\n            font-size: 20px;\r\n        }\r\n\r\n        .p0 {\r\n            padding: 0px;\r\n        }\r\n     thead {width: 100%; font-size: 12; padding: 0; margin: 0; border: none; page-break-inside: auto; }      </style>\r\n</head>\r\n<body>\r\n  <div> " + lines[1];

                if (lines[1].Contains("<tr id=\"10\">"))
                {
                    lines[1] = lines[1].Replace("<tr id=\"10\">", "<tr style=\"border-top-style: none;\" > <td colspan=\"16\" style=\"border:0\">'</td></tr><tr style=\"border:0;\"><td colspan=\"16\" style=\"border:0\">'</td></tr><tr style=\"border:0;\"><td colspan=\"16\" style=\"border:0;\" >'</td></tr><tr style=\"align-items: center;  padding-top: 500px;\" >\r\n        <td style=\"width: 5%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      S.No\r\n  </b>\r\n        </td>\r\n\r\n        <td style=\"width: 10%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Visit Date\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Supplier Details <br /><hr class=\"class-1\" />\r\n      Location\r\n  </b>\r\n        </td>\r\n        \r\n        <td style=\"width: 10%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      PO No <br /><hr class=\"class-1\" />Date\r\n  </b>\r\n        </td>\r\n  <td style=\"width: 10%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Insp Name <br /><hr class=\"class-1\" />\r\n      Report No\r\n  </b>\r\n        </td>\r\n <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Distance\r\n  </b>\r\n        </td>\r\n<td style=\"width: 10%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Time In  <br /><hr class=\"class-1\" />\r\n      Time Out </b></td><td style=\"width: 10%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Toal Hrs </b></td><td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Mileage Cost\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Boarding Charges\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Hotel\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Travel Fare\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Other Expenses\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Service Charge\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Total\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 20%;align-items: center\" class=\"font10\">\r\n  <b>\r\n     Remarks\r\n</b>\r\n </td>\r\n   </tr>\r\n <tr id=\"10\">");
                //    // lines[1] = lines[1].Replace("<tr id=\"10\">", "<tr style=\"align-items: center;  padding-top: 500px;\" >\r\n        <td style=\"width: 5%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      S.No\r\n  </b>\r\n        </td>\r\n\r\n        <td style=\"width: 10%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Visit Date\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Supplier Details <br /><hr class=\"class-1\" />\r\n      Location\r\n  </b>\r\n        </td>\r\n        \r\n        <td style=\"width: 10%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      PO No <br /><hr class=\"class-1\" />Date\r\n  </b>\r\n        </td>\r\n        \r\n        <td style=\"width: 10%; align-items: center\" class=\"font10\">\r\n  <b>\r\n      Insp Name <br /><hr class=\"class-1\" />\r\n      Report No\r\n  </b>\r\n        </td>\r\n        \r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Distance\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Mileage Cost\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Boarding Charges\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Hotel\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Travel Fare\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Other Expenses\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Service Charge\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 10%;align-items: center\" class=\"font10\">\r\n  <b>\r\n      Total\r\n  </b>\r\n        </td>\r\n        <td style=\"width: 20%;align-items: center\" class=\"font10\">\r\n  <b>\r\n     Remarks\r\n</b>\r\n </td>\r\n   </tr>\r\n <tr id=\"10\">");
                }


                //StringReader sr = new StringReader(lines[0]);
                StringReader sr2 = new StringReader(GridHtml);

                // iTextSharp.text.Document pdfDoc = new iTextSharp.text.Document(PageSize.A4, 20f, 10f, 45f, 45f);
                iTextSharp.text.Document pdfDoc = new iTextSharp.text.Document(PageSize.A4.Rotate(), 20f, 10f, 50f, 45f);
                PdfWriter pdfWriter = PdfWriter.GetInstance(pdfDoc, stream);
                pdfDoc.Open();
                //pdfDoc.Add(new Paragraph(lines[0]));

                //pdfDoc.SetPageSize(new Rectangle(950f, 1100f));
                XMLWorkerHelper.GetInstance().ParseXHtml(pdfWriter, pdfDoc, sr2);


                // StringReader sr1 = new StringReader(lines[1]);
                // pdfDoc.SetPageSize(new Rectangle(950f, 845f));
                //List<IElement> elements = iTextSharp.text.html.simpleparser.HTMLWorker.ParseToList(sr1, null);
                //foreach (IElement el in elements)
                //{
                //    //If the element is a table manually set its header row count
                //    if (el is PdfPTable)
                //    {
                //        ((PdfPTable)el).HeaderRows = 2;
                //    }
                //    pdfDoc.Add(el);
                //}

                //XMLWorkerHelper.GetInstance().ParseXHtml(pdfWriter, pdfDoc, sr1);




                pdfDoc.Close();
                bytes = stream.ToArray();



            }
            string fileContainerPath = ConfigurationManager.AppSettings["InvoicePath"];
            Font headerFontStyle = FontFactory.GetFont("Arial", 10, Font.NORMAL, BaseColor.BLACK);
            Font footerFontStyle = FontFactory.GetFont("Arial", 12, Font.NORMAL, BaseColor.BLACK);
            string tempFileName = Guid.NewGuid() + ".pdf";
            //string filePath = Server.MapPath("~/Docs/" + tempFileName);
            string filePath = fileContainerPath + tempFileName;

            //Start of header and footer for pdf report
            //var data = objBusinessModel.GetInvoiceDataToPrint(invoiceId, CurrentUser.SiteId, _invoiceService);

            string strHeader = "Ideal Quality Engineers (I) Pvt.Ltd ";
            string strHeader1 = "Flat No. 302, Plot No. 410, Mathrusri Nagar, Miyapur, Hyderabad - 500 049. Ph: 040-48543475, Mobile:09542028555";

            using (MemoryStream stream = new MemoryStream())
            {
                PdfReader reader = new PdfReader(bytes);
                using (PdfStamper stamper = new PdfStamper(reader, stream))
                {


                    int pages = reader.NumberOfPages;
                    for (int i = 2; i <= pages; i++)
                    {
                        Image image = Image.GetInstance(Server.MapPath("~/Images/IQElogo.png")); // Image.GetInstance(logo);
                        image.Alignment = Image.ALIGN_LEFT;


                        var pdfContentByte = stamper.GetOverContent(i);
                        image.SetAbsolutePosition(10, 780);
                        pdfContentByte.AddImage(image);
                        if (i >= 3)
                        {
                            ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_RIGHT, new Phrase("Client Name :" + clientName, headerFontStyle), 780, 780, 0);
                            ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_RIGHT, new Phrase("Document :Annexure to Invoice No: " + invoiceNo, headerFontStyle), 950, 770, 0);
                            ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_RIGHT, new Phrase("Date :", headerFontStyle), 900, 760, 0);
                        }
                        ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_LEFT, new Phrase(strHeader, headerFontStyle), 20, 760, 0);
                        ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_LEFT, new Phrase(strHeader1, headerFontStyle), 20, 750, 0);
                        //ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_LEFT, new Phrase("Client Name:" + clientName, headerFontStyle), 20, 785, 0);
                        //ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_LEFT, new Phrase(strDocumentDetails, headerFontStyle), 250, 785, 0);
                        //Footer part
                        //ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_CENTER, new Phrase("page " + (i - 1).ToString() + " of " + (pages - 1).ToString(), footerFontStyle), 500f, 20, 0);
                        ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_CENTER, new Phrase((i - 1).ToString() + " / " + (pages - 1).ToString(), footerFontStyle), 500f, 20, 0);
                        ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_CENTER, new Phrase("Authorized Signatory", footerFontStyle), 800f, 20, 0);
                        // we have started the loop with 2 and deducted 1 from i & pages since we dont want to print in 1st page header
                        ////http://what-when-how.com/itext-5/adding-content-with-pdfstamper-part-1-itext-5/
                    }
                }
                bytes = stream.ToArray();
            }
            //end of header and footer for pdf report

            System.IO.File.WriteAllBytes(filePath, bytes);

            string retFileNameFromAzure = string.Empty;
            string fileName = filePath;

            invoiceTitle = invoiceTitle.Replace('/', '_');
            if (System.IO.File.Exists(filePath))
            {

                retFileNameFromAzure = filePath;
                double fileSize = filePath.Length;
                //  System.IO.File.Delete(filePath);
                if (!string.IsNullOrEmpty(retFileNameFromAzure))
                {
                    try
                    {
                        _invoiceService.UpdateInvoiceFileDetails(invoiceId, invoiceTitle, retFileNameFromAzure, Convert.ToDecimal(fileSize), CurrentUser.UserId);
                    }
                    catch (Exception e)
                    {
                        this.errorLogObj.LogError(Request.Url.PathAndQuery + "Error while updating summary detail uploaded file details", e);
                        // need to delete uploaded file as the status not updated to completed in summary details, so the file will be uploaded again.
                        var status = new FileBusinessModel().DeleteFileFromAzure(retFileNameFromAzure, siteId);
                    }
                }

            }
            return null;
        }
        public ActionResult PrintInvoiceManually(int invoiceId, string invoiceType)
        {
            var isSuccess = false;
            try
            {
                PrintInvoice(invoiceId, invoiceType);
                isSuccess = true;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error while regenerating invoice details", ex);
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }
        #endregion

        [Authorize]
        public ActionResult DownloadFile(Guid GUId)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.Download, CurrentUser.RoleId.FirstOrDefault()))
            {

                // string fileContainerPath = ConfigurationManager.AppSettings["InvoicePath"];
                InvoiceViewModel fileInfo = new InvoiceViewModel();
                fileInfo = objBusinessModel.GetInvoiceDetailsToPreviewOrDownload(GUId, _invoiceService);

                if (!string.IsNullOrEmpty(fileInfo.InvoiceAzureLink))
                {
                    string DownloadFileName = fileInfo.InvoiceName + ".pdf";
                  //  string DownloadFileName = System.IO.Path.GetFileName(fileInfo.InvoiceName);
                    var DownloadFileData = System.IO.File.ReadAllBytes(fileInfo.InvoiceAzureLink);

                    //System.IO.Path.GetFileName(fileInfo.FileName);
                    Response.Clear();
                    Response.Buffer = true;
                    Response.Charset = "";
                    Response.Cache.SetCacheability(HttpCacheability.NoCache);
                    Response.ContentType = "application/*";
                    Response.AppendHeader("Content-Disposition", "attachment; filename=" + DownloadFileName);
                    Response.BinaryWrite(DownloadFileData);
                    Response.Flush();
                    Response.End();

                }
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        public ActionResult InvoicePreview(Guid invoiceGuid)
        {
            InvoiceViewModel IVMObj = new InvoiceViewModel();
            IVMObj = objBusinessModel.InvoicePreview(invoiceGuid, _invoiceService);
            var ContentLink = IVMObj.InvoiceAzureLink;
            string mType = MimeMapping.GetMimeMapping(ContentLink);
            string StoragePath = ConfigurationManager.AppSettings["InvoicePath"];
            return Json(new { status = true, strString = "success", strContentLink = ContentLink, imageTitle = IVMObj.InvoiceName, imageSiteId = IVMObj.SiteId, containerPath = StoragePath }, JsonRequestBehavior.AllowGet);
        }
        public ActionResult UnFreezeInvoice(int invoiceId)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.InvoiceUnFreeze, CurrentUser.RoleId.FirstOrDefault()))
            {

                var isSuccess = _invoiceService.updateUnFreezeInvoiceStatus(invoiceId);

                // need to refresh the list after unfreeze
                //List<InvoiceViewModel> list = new List<InvoiceViewModel>();
                //var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                //try
                //{
                //    list = objBusinessModel.GetInvoiceListForDirectory(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, sortingOrder, _invoiceService);
                //    if (list.Count > 0)
                //    {
                //        ViewBag.Total = list.FirstOrDefault().Total;
                //        pageCount += defaultFetchCount;
                //        ViewBag.CurrentPageCount = pageCount;
                //    }
                //    else
                //    {
                //        ViewBag.Total = 0;
                //        ViewBag.CurrentPageCount = 0;
                //    }
                //}
                //catch (Exception ex)
                //{
                //    errorLogObj.LogError("Add Client", ex);
                //}
                //return PartialView("_InvoiceList", list);
                return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);

            }
            else
            {
                return View("UnAuthorized");
            }
        }

        #region Update Invoice

        public ActionResult GetDataForEditInvoice(Guid invoiceGuid)
        {
            InvoiceDetailsModel model = new InvoiceDetailsModel();
            try
            {
                model = objBusinessModel.GetInvoiceDetailsToEdit(invoiceGuid, CurrentUser.SiteId, _invoiceService) ?? new InvoiceDetailsModel();
                model.LstControlNumbers = model.LstControlNumbers ?? new List<ControlNumberViewModel>();
                model.LstServiceOrders = model.LstServiceOrders ?? new List<ServiceOrderViewModel>();
                model.LstClientUnits = model.LstClientUnits ?? new List<ClientUnitsViewModel>();
                model.TemplateTypes = model.TemplateTypes ?? new List<CommonModel.InvoiceTemplateType>();
                model.LstInvoiceConsolidatedDetails = model.LstInvoiceConsolidatedDetails ?? new List<InvoiceConsolidateDetailsModel>();
                model.LstVisitProcessings = model.LstVisitProcessings ?? new List<VisitDetailsInvoiceModel>();
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("loading edit invoice by guid", ex);
            }

            return View("EditInvoice", model);
        }

        //public ActionResult GetDataForEditInvoice(Guid invoiceGuid)
        //{
        //    InvoiceDetailsModel model = new InvoiceDetailsModel();
        //    try
        //    {
        //        model = objBusinessModel.GetInvoiceDetailsToEdit(invoiceGuid, CurrentUser.SiteId, _invoiceService);
        //    }
        //    catch (Exception ex)
        //    {
        //        errorLogObj.LogError("saving invoice details error", ex);
        //    }

        //    return View("EditInvoice", model);
        //}

        public ActionResult UpdateInvoiceDetails(InvoiceViewModel model)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.InvoiceCreate, CurrentUser.RoleId.FirstOrDefault()))
            {

                var isSuccess = false;
                model.SiteId = CurrentUser.SiteId;
                model.UserId = CurrentUser.UserId;
                try
                {
                    isSuccess = objBusinessModel.UpdateInvoiceDetails(model, _invoiceService);
                    if (isSuccess)
                    {
                        List<InvoiceConsolidateDetailsModel> objConsolidateInvoiceDetails = new List<InvoiceConsolidateDetailsModel>();
                        objConsolidateInvoiceDetails = objBusinessModel.GetInvoiceConsolidatedDetails(0, model.InvoiceGuid, _invoiceService);
                        ViewBag.InvoiceGuid = model.InvoiceGuid;
                        return PartialView("_UpdateConsolidatedCharges", objConsolidateInvoiceDetails);
                    }
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("updating invoice details error", ex);
                    isSuccess = false;
                }
                return Json(new { status = isSuccess, id = model.InvoiceID, invoiceGuid = model.InvoiceGuid }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return View("UnAuthorized");
            }
        }
        public ActionResult EditConsolidatedInvoiceDetails(Guid invoiceGuid)
        {
            List<InvoiceConsolidateDetailsModel> model = new List<InvoiceConsolidateDetailsModel>();
            try
            {
                model = objBusinessModel.GetInvoiceConsolidatedDetails(0, invoiceGuid, _invoiceService);
                ViewBag.InvoiceGuid = invoiceGuid;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error while fetching consolidated invoice details", ex);
            }
            return View("_UpdateConsolidatedCharges", model);
        }
        public ActionResult UpdateConsolidatedInvoiceDetails(List<InvoiceConsolidateDetailsModel> model, string invoiceType)
        {
            var InvoiceGuid = "";
            var isSuccess = false;
            try
            {
                isSuccess = objBusinessModel.UpdateConsolidatedInvoiceDetails(model, _invoiceService);
                if (isSuccess)
                {
                    InvoiceGuid = PrintInvoice(model.FirstOrDefault().InvoiceId, invoiceType);
                    isSuccess = true;
                }
            }
            catch (Exception ex)
            {
                isSuccess = false;
                errorLogObj.LogError("error while updating consolidated invoice details", ex);
            }
            return Json(new { status = isSuccess, id = model.FirstOrDefault().InvoiceId, invoiceGuid = InvoiceGuid }, JsonRequestBehavior.AllowGet);
        }
        #endregion


        //// Compatibility shim used elsewhere in code - delegate to existing implementation
        //public string CreateInvoicePdf2(string GridHtml, string invoiceNo, string invoiceTitle, int siteId, int invoiceId, string clientName)
        //{
        //    return CreateInvoicePdf(GridHtml, invoiceNo, invoiceTitle, siteId, invoiceId, clientName);
        //}
        //#endregion

        #region InvoiceCancelation
        public ActionResult ShowInvoiceCancellationRemarksCapture(Guid invoiceGuid)
        {
            InvoiceViewModel objModel = new InvoiceViewModel();
            objModel.InvoiceGuid = invoiceGuid;
            return PartialView("_CaptureInvoiceCancellationComments", objModel);
        }
        public ActionResult CancelInvoice(Guid invoiceGuid, string CancellationComments)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.InvoiceCancel, CurrentUser.RoleId.FirstOrDefault()))
            {

                var isSuccess = false;
                try
                {
                    objBusinessModel.CancelInvoice(invoiceGuid, CurrentUser.UserId, CancellationComments, _invoiceService);
                    isSuccess = true;
                }
                catch (Exception e)
                {
                    errorLogObj.LogError("", e);
                }

                return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return View("UnAuthorized");
            }
        }

        public JsonResult DownloadInvoiceList(DateTime Startdate, DateTime Enddate)
        {
            int pageCount = 0;
            bool UserActive = true;
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            List<InvoiceViewModel> list = new List<InvoiceViewModel>();
            try
            {
                //  (CurrentUser.SiteId, isUserActive, UserType, strSearch, alphaSearch, pageCount, defaultFetchCount, sortingOrder, _userService);

                list = objBusinessModel.GeInvoiceListToDownload(CurrentUser.SiteId, Startdate, Enddate, _invoiceService);

                System.Data.DataTable dt = new System.Data.DataTable("Test");

                dt.Columns.Add("S.No");
                dt.Columns.Add("Invoice No");
                dt.Columns.Add("Invoice Date");
                dt.Columns.Add("Client Name");
                dt.Columns.Add("Project/Unit");
                dt.Columns.Add("Base Value(INR)");
                dt.Columns.Add("Invoice Value (Incl_GST)");
                dt.Columns.Add("Ageing");
                dt.Columns.Add("TDS");
                dt.Columns.Add("Received");
                dt.Columns.Add("Received Date");
                dt.Columns.Add("Status");
                dt.Columns.Add("Balance");
                dt.Columns.Add("Paid In Days");
                dt.Columns.Add("Remarks");

                foreach (var ls in list)
                {
                    var row = dt.NewRow();
                    row["S.No"] = ls.InvoiceID;
                    row["Invoice No"] = ls.InvoiceNo;
                    row["Invoice Date"] = ls.InvoiceDate.ToString("dd/MM/yy");
                    row["Client Name"] = ls.ClientName;
                    row["Project/Unit"] = ls.ClientUnitName;
                    row["Base Value(INR)"] = ls.TotalAmount;
                    row["Invoice Value (Incl_GST)"] = ls.GrandTotalAmount;
                    row["Ageing"] = ls.AmountReceived == 0 ? DateTime.Now.Subtract(ls.InvoiceDate).Days.ToString() : DateTime.Now.Subtract(DateTime.Now).Days.ToString();
                    row["TDS"] = ls.TDS;
                    row["Received"] = ls.AmountReceived;
                    row["Received Date"] = ls.AmountReceivedDate == DateTime.MinValue ? "" : ls.AmountReceivedDate.ToString("dd/MM/yy");
                    row["Status"] = ls.InvoiceStatus;
                    row["Balance"] = ls.TotalAmount - (ls.AmountReceived + ls.TDS);
                    row["Paid In Days"] = ls.AmountReceived > 0 ? ls.AmountReceivedDate.Subtract(ls.InvoiceDate).Days.ToString() : DateTime.Now.Subtract(DateTime.Now).Days.ToString();
                    row["Remarks"] = "";
                    dt.Rows.Add(row);
                }

                using (XLWorkbook wb = new XLWorkbook())
                {
                    wb.Worksheets.Add(dt);
                    using (MemoryStream stream = new MemoryStream())
                    {
                        wb.SaveAs(stream);
                        return Json(Convert.ToBase64String(stream.ToArray(), 0, stream.ToArray().Length), JsonRequestBehavior.AllowGet);
                    }
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Visit Processing", ex);
            }

            return null;

        }
        #endregion

    }
}