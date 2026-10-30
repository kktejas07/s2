using HtmlAgilityPack;
using IQEApp.Service.ReportService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.Reports;
using iTextSharp.text;
using iTextSharp.text.pdf;
using iTextSharp.tool.xml;
using System;
using System.Collections.Generic;
using System.IO;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Reports
{
    public class ReportsController : BaseController
    {
        private readonly ReportService _reportService;
        ReportsBusinessModel objReportBusinessModel = new ReportsBusinessModel();

        public ReportsController()
        {
            _reportService = new ReportService();
        }
        //
        // GET: /Reports/
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult GetReportFilters(string reportType)
        {
            ReportFiltersViewModel obj = new ReportFiltersViewModel();
            if (reportType == "visits")
            {
                obj = objReportBusinessModel.GetVisitFiltersData(_reportService);
                return PartialView("_VisitFilters", obj);
            }
            else if (reportType == "visit expenses")
            {
                //obj = objReportBusinessModel.GetVisitFiltersData(_reportService);
                return PartialView("_VisitExpensesFilters", obj);
            }

            return null;
        }

        public ActionResult GetVisitDetailsForReport(ReportFiltersViewModel rptFilterModel)
        {
            bool isSuccess = false;
            string returnFile = "";
            List<RptVisitViewModel> model = new List<RptVisitViewModel>();
            try
            {
                model = objReportBusinessModel.GetVisitDetailsForReports(rptFilterModel, _reportService);
                var convertedHtml = ConvertViewToString("RptVisitDetailsTemplate", model);
                returnFile = CreateReportPdf(convertedHtml, CurrentUser.SiteId);
                if (!string.IsNullOrEmpty(returnFile))
                {
                    isSuccess = true;
                }
            }
            catch (Exception e)
            {
                isSuccess = false;
                Console.WriteLine(e);
                throw;
            }

            return Json(new { retStatus = isSuccess, file = returnFile, msg = "" }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GenerateVisitExpenseReport(ReportFiltersViewModel rptFilterModel)
        {
            bool isSuccess = false;
            string returnFile = "";
            List<RptVisitExpensesModel> model = new List<RptVisitExpensesModel>();
            try
            {
                model = objReportBusinessModel.GetVisitExpensesForReports(rptFilterModel, _reportService);
                var convertedHtml = ConvertViewToString("RptVisitExpensesTemplate", model);
                returnFile = CreateReportPdf(convertedHtml, CurrentUser.SiteId);
                if (!string.IsNullOrEmpty(returnFile))
                {
                    isSuccess = true;
                }
            }
            catch (Exception e)
            {
                isSuccess = false;
                Console.WriteLine(e);
                throw;
            }

            return Json(new { retStatus = isSuccess, file = returnFile, msg = "" }, JsonRequestBehavior.AllowGet);
        }

        #region HtmlToPdfReportConverter

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
        public string CreateReportPdf(string gridHtml, int siteId)
        {
            string tempFileName = "";
            HtmlNode.ElementsFlags["img"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["input"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["br"] = HtmlElementFlag.Closed;
            HtmlNode.ElementsFlags["hr"] = HtmlElementFlag.Closed;
            HtmlDocument doc = new HtmlDocument();
            doc.OptionFixNestedTags = true;
            doc.LoadHtml(gridHtml);
            gridHtml = doc.DocumentNode.OuterHtml;
            byte[] bytes;
            using (MemoryStream stream = new System.IO.MemoryStream())
            {
                StringReader sr = new StringReader(gridHtml);
                iTextSharp.text.Document pdfDoc = new iTextSharp.text.Document(PageSize.A4, 20f, 10f, 45f, 45f);
                PdfWriter writer = PdfWriter.GetInstance(pdfDoc, stream);
                pdfDoc.Open();
                XMLWorkerHelper.GetInstance().ParseXHtml(writer, pdfDoc, sr);
                pdfDoc.Close();
                bytes = stream.ToArray();
            }


            tempFileName = Guid.NewGuid() + ".pdf";
            //Below code is throwing error for creating directory for first time, so pls create directory manually in the respective environment.
            //if (!Directory.Exists(Server.MapPath("~/Reports")))
            //{
            //    Directory.CreateDirectory("~/Reports");
            //}
            string filePath = Server.MapPath("~/Reports/" + tempFileName);

            //Start of header and footer for pdf report
            Font headerFontStyle = FontFactory.GetFont("Arial", 10, Font.NORMAL, BaseColor.BLACK);
            Font footerFontStyle = FontFactory.GetFont("Arial", 10, Font.NORMAL, BaseColor.BLACK);
            string strHeader = "Ideal Quality Engineers (I) Pvt.Ltd ";
            string strHeader1 = "Flat No. 302, Plot No. 410, Mathrusri Nagar, Miyapur, Hyderabad - 500 049. Ph: 040-48543475, Mobile:09542028555";
            using (MemoryStream stream = new MemoryStream())
            {
                PdfReader reader = new PdfReader(bytes);
                using (PdfStamper stamper = new PdfStamper(reader, stream))
                {
                    int pages = reader.NumberOfPages;
                    for (int i = 1; i <= pages; i++)
                    {
                        // XMLWorkerHelper.GetInstance().ParseXHtml();
                        //Header
                        //ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_RIGHT, new Phrase("Date:" + DateTime.Today.ToShortDateString(), headerFontStyle), 550f, 815, 0);
                        ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_LEFT, new Phrase(strHeader, headerFontStyle), 20, 815, 0);
                        ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_LEFT, new Phrase(strHeader1, headerFontStyle), 20, 800, 0);
                        //ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_LEFT, new Phrase(strHeader1, new Font(|Font.UNDERLINE)), 20, 800, 0);
                        //Footer part
                        ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_LEFT, new Phrase("Report generated By " + CurrentUser.UserFullName, footerFontStyle), 20f, 20, 0);
                        ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_CENTER, new Phrase("page " + (i).ToString() + " of " + (pages).ToString(), footerFontStyle), 270f, 20, 0);
                        ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_CENTER, new Phrase(DateTime.Now.ToShortDateString(), footerFontStyle), 500f, 20, 0);
                        // we have started the loop with 2 and deducted 1 from i & pages since we dont want to print in 1st page header
                        ////http://what-when-how.com/itext-5/adding-content-with-pdfstamper-part-1-itext-5/
                    }
                }
                bytes = stream.ToArray();
            }
            //end of header and footer for pdf report

            System.IO.File.WriteAllBytes(filePath, bytes);

            //string retFileNameFromAzure = string.Empty;
            //string fileName = filePath;
            //invoiceTitle = invoiceTitle.Replace('/', '_');
            //if (System.IO.File.Exists(filePath))
            //{

            //    var webRequest = WebRequest.Create(fileName);
            //    using (var response = webRequest.GetResponse())
            //    using (var stream = response.GetResponseStream())
            //    {
            //        var uploadRequestInfo = new RemoteFileInfo
            //        {
            //            FileName = Convert.ToString(fileName),
            //            Length = fileName.Length,
            //            FileByteStream = stream,
            //            SectionId = 1,
            //            userId = 1000732, // dummyvalue
            //            Title = invoiceTitle + ".pdf", //Title can be used to save the file in azure with that name
            //            Description = "",
            //            ApprovalStatus = 1,
            //            Data = "",
            //            contentId = 0,
            //            IsAdminContent = 0
            //        };
            //        string containerName = "site-" + siteId;   //Here the file is uploaded in the requested user site
            //        retFileNameFromAzure = new FileUploadController().DataPortUploadFileToAzureWithOriginalFileTitle(uploadRequestInfo, containerName);
            //    }
            //    double fileSize = new FileUploadController().FileSizeCal(siteId, retFileNameFromAzure);
            //    System.IO.File.Delete(filePath);
            //    //if (!string.IsNullOrEmpty(retFileNameFromAzure))
            //    //{
            //    //    try
            //    //    {
            //    //        _invoiceService.UpdateInvoiceFileDetails(invoiceId, invoiceTitle, retFileNameFromAzure, Convert.ToDecimal(fileSize), CurrentUser.UserId);
            //    //    }
            //    //    catch (Exception e)
            //    //    {
            //    //        this.errorLogObj.LogError(Request.Url.PathAndQuery + "Error while updating summary detail uploaded file details", e);
            //    //        // need to delete uploaded file as the status not updated to completed in summary details, so the file will be uploaded again.
            //    //        var status = new FileBusinessModel().DeleteFileFromAzure(retFileNameFromAzure, siteId);
            //    //    }
            //    //}
            //}
            return tempFileName;
        }

        #endregion
    }
}