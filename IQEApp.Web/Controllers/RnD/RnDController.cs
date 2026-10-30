using HtmlAgilityPack;
using IQEApp.Service.UserService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models;
using iTextSharp.text;
using iTextSharp.text.pdf;
using iTextSharp.tool.xml;
using System;
using System.Configuration;
using System.IO;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Font = iTextSharp.text.Font;

namespace IQEApp.Web.Controllers
{
    public class RnDController : Controller
    {
        private readonly IUserService _userService;

        public RnDController()
        {
            _userService = new UserService();
        }
        //
        // GET: /RnD/
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult ProfilePage()
        {
            return View("ProfilePage");
        }


        public ActionResult CreatePdf()
        {
            var isSuccess = false;
            try
            {
                //Get data from DB
                //Pass the data to cshtml and convert cshtml to string
                string viewContent = ConvertViewToString("PdfSampleHtml");
                string pdfName = CreateSummaryPdf(viewContent, "TestPdf", 67);
                isSuccess = true;
                return Json(new { status = isSuccess, fileName = pdfName });
            }
            catch (Exception e)
            {
                throw e;
            }
            return Json(new { status = isSuccess });
        }
        private string ConvertViewToString(string viewName)
        {
            string val = "";
            try
            {
                //ViewData.Model = model;
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
                val = ex.ToString();
            }
            return val;
        }
        public string CreateSummaryPdf(string GridHtml, string pdfName, int siteId)
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
            using (MemoryStream stream = new System.IO.MemoryStream())
            {
                StringReader sr = new StringReader(GridHtml);
                iTextSharp.text.Document pdfDoc = new iTextSharp.text.Document(PageSize.A4, 40f, 40f, 60f, 60f);
                PdfWriter writer = PdfWriter.GetInstance(pdfDoc, stream);
                pdfDoc.Open();
                XMLWorkerHelper.GetInstance().ParseXHtml(writer, pdfDoc, sr);
                pdfDoc.Close();
                bytes = stream.ToArray();
            }
            Font footerFont = FontFactory.GetFont("Arial", 12, Font.NORMAL, BaseColor.BLACK);
            pdfName = pdfName + ".pdf";
            string filePath = Server.MapPath("~/Docs/" + pdfName);
            //***
            //working for footer start
            using (MemoryStream stream = new MemoryStream())
            {
                PdfReader reader = new PdfReader(bytes);
                using (PdfStamper stamper = new PdfStamper(reader, stream))
                {
                    int pages = reader.NumberOfPages;
                    for (int i = 1; i <= pages; i++)
                    {
                        //ColumnText.ShowTextAligned(stamper.GetOverContent(i), Element.ALIGN_CENTER, new Phrase(headerString.ToString(), headerFont), 300f, 800, 0);
                        ColumnText.ShowTextAligned(stamper.GetUnderContent(i), Element.ALIGN_RIGHT, new Phrase("page " + i.ToString() + " of " + pages.ToString(), footerFont), 550f, 20, 0);
                    }
                }
                bytes = stream.ToArray();
            }
            //end
            ////***

            System.IO.File.WriteAllBytes(filePath, bytes);

            string retval = string.Empty;
            string fileName = filePath;
            if (System.IO.File.Exists(filePath))
            {

                var webRequest = WebRequest.Create(fileName);
                using (var response = webRequest.GetResponse())
                using (var stream = response.GetResponseStream())
                {
                    var uploadRequestInfo = new RemoteFileInfo
                    {
                        FileName = Convert.ToString(fileName),
                        Length = fileName.Length,
                        FileByteStream = stream,
                        SectionId = 1,
                        userId = 1000732, // dummyvalue
                        Title = "",
                        Description = "",
                        ApprovalStatus = 1,
                        Data = "",
                        contentId = 0,
                        IsAdminContent = 0
                    };
                    string containerName = "site-" + siteId;   //Here the file is uploaded in the requested user site
                    FileUploadController objFUC = new FileUploadController();
                    //retval = objFUC.DataPortUploadFileToAzure(uploadRequestInfo, containerName);
                }
                double fileSize = new FileUploadController().FileSizeCal(siteId, retval);
            }
            return retval;
        }
        public ActionResult OpenEditor()
        {
            return PartialView("_Editor");
        }
        public ActionResult SaveDiscussion(string edit)
        {
            try
            {
                _userService.saveEditorText(edit);
            }
            catch (Exception e)
            {
                throw e;
            }
            return null;
        }

        public ActionResult FilePreview(string GUId)
        {
            var ContentLink = "";
            if (GUId == "2119b8c4-089b-4e17-8657-eaccc5a2f978")
            {
                ContentLink = "2119b8c4-089b-4e17-8657-eaccc5a2f978.pdf";
            }
            else if (GUId == "6c4c4517-a2d9-4cde-ba7a-fca91438509c")
            {
                ContentLink = "6c4c4517-a2d9-4cde-ba7a-fca91438509c.jpg";
            }
            else if (GUId == "ff44f936-87d5-4d19-98d9-ba41cc15d83a")
            {
                ContentLink = "ff44f936-87d5-4d19-98d9-ba41cc15d83a.xlsx";
            }
            else if (GUId == "d6db9650-1cfb-49e5-abe0-3dc39631399d")
            {
                ContentLink = "d6db9650-1cfb-49e5-abe0-3dc39631399d.docx";
            }
            string mType = MimeMapping.GetMimeMapping(ContentLink);
            string StoragePath = ConfigurationManager.AppSettings["storagePath"];
            if ((mType == "application/pdf") || (mType == "image/jpeg") || (mType == "image/png") || (mType == "image/jpeg") || (mType == "text/plain") || (mType == "image/gif"))
            {
                return Json(new { status = true, strString = "success", fType = "normal", strContentLink = ContentLink, imageTitle = "FolderName", imageSiteId = "67", containerPath = StoragePath }, JsonRequestBehavior.AllowGet);

            }
            else if ((mType == "application/vnd.ms-excel") || (mType == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") || (mType == "application/msword") || (mType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document") || (mType == "application/vnd.ms-powerpoint") || (mType == "application/vnd.openxmlformats-officedocument.presentationml.presentation"))
            {
                return Json(new { status = true, strString = "success", fType = "mstype", strContentLink = ContentLink, imageTitle = "FolderName", imageSiteId = "67", containerPath = StoragePath }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new { status = true, strString = "Preview Not Available", fType = "noPreview", strGuid = GUId, genericId = 0, imageTitle = "", containerPath = StoragePath }, JsonRequestBehavior.AllowGet);

            }
        }
    }
}