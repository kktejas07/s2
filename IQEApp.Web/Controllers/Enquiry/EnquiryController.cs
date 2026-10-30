using IQEApp.Service.EnquiryService;
using IQEApp.Service.SecurityService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.EnquiryModel;
using iTextSharp.text;
using iTextSharp.text.pdf;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Util;
using System.Transactions;
using System.Web.Services.Description;
using IQEApp.Web.Models.ControlNumberModel;
using iText.IO.Font.Constants;
using iText.Kernel.Font;
using HtmlAgilityPack;
using iTextSharp.tool.xml;
using DocumentFormat.OpenXml.EMMA;
//using DocumentFormat.OpenXml.Drawing;

namespace IQEApp.Web.Controllers.Enquires
{
    public class EnquiryController : BaseController
    {
        private readonly IEnquiryService _enquiryService;
        private readonly ISecurityService _securityService;
        EnquiryBusinessModel objEnquiryBusinessModel = new EnquiryBusinessModel();
        public EnquiryController()
        {
            _enquiryService = new EnquiryService();
            _securityService = new SecurityService();
            //SingletonScreenFeatureMapping.SetScreenFeatureMapping(CurrentUser.RoleId.FirstOrDefault(), _securityService);
        }

        // GET: Enquires
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.SalesEnquiry, CurrentUser.RoleId.FirstOrDefault()))
            {
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                try
                {
                    // Fetch data from the business model
                    var (enquiries, statusCounts) = objEnquiryBusinessModel.GetEnquiryData(CurrentUser.SiteId, "", "", 0, defaultFetchCount, true, "All", "ASC", "", _enquiryService);

                    // Prepare the view model
                    var model = new EnquiryListViewModel
                    {
                        Enquiries = enquiries,
                        StatusCounts = statusCounts
                    };

                    // Set ViewBag properties
                    ViewBag.CurrentPageCount = defaultFetchCount;
                    ViewBag.Total = model.Enquiries.Any() ? model.Enquiries.First().Total : 0;
                    ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();

                    // Return the view with the model
                    return View("Index", model);
                }
                catch (Exception ex)
                {
                    // Log error and return the view with an error message or a default view
                    errorLogObj.LogError("Get Enquiry list by site id", ex);
                    return View("Error"); // Assuming you have an Error view to handle exceptions
                }
            }
            else
            {
                // Return unauthorized view
                return View("UnAuthorized");
            }
        }

        //public JsonResult GetGridData()
        //{
        //    var data = new List<EnquiryViewModel>();
        //    var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
        //    data = objEnquiryBusinessModel.GetEnquiryListBySiteId(CurrentUser.SiteId, "", "", 0, defaultFetchCount, true, "ASC", _enquiryService);

        //    return Json(new { data = data }, JsonRequestBehavior.AllowGet);
        //}
        public ActionResult AddEnquiry()
        {
            EnquiryViewModel objEnquiryViewModel = new EnquiryViewModel();

            //To fetch all the values to fill drop down
            objEnquiryViewModel = objEnquiryBusinessModel.GetEnquiryDetailsToAdd(CurrentUser.SiteId, _enquiryService);
            return PartialView("_AddEnquiry", objEnquiryViewModel);
        }


        [HttpPost]
        public JsonResult GetEnquiryListBySiteId(int pageCount = 0, string strSearch = "", string alphaSearch = "", bool activeStatus = true, string status = "", string sortingOrder = "DESC", string fiYear = "")
        {
            List<EnquiryViewModel> list = new List<EnquiryViewModel>();
            EnquiryListViewModel list1 = new EnquiryListViewModel();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            try
            {
                var (enquiries, statusCounts) = objEnquiryBusinessModel.GetEnquiryData(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, status, "ASC", fiYear, _enquiryService);
                var model = new EnquiryListViewModel
                {
                    Enquiries = enquiries,
                    StatusCounts = statusCounts
                };
                //                ViewBag.Total = model.Enquiries.Any() ? model.Enquiries.First().Total : 0;
                ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
                return Json(new
                {
                    success = true,
                    data = model,
                    totalCount = model.Enquiries.Any() ? model.Enquiries.First().Total : 0
                }, JsonRequestBehavior.AllowGet);


            }
            catch (Exception e)
            {
                errorLogObj.LogError("enquiry details fetch error" + e, e);
                throw;
            }

            return Json(new { success = false, data = "" }, JsonRequestBehavior.AllowGet);

        }

        public ActionResult GetEnquiryListBySiteId11(int pageCount = 0, string strSearch = "", string alphaSearch = "", bool activeStatus = true, string status = "", string sortingOrder = "DESC", string fiYear = "")
        {
            List<EnquiryViewModel> list = new List<EnquiryViewModel>();
            EnquiryListViewModel list1 = new EnquiryListViewModel();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            try
            {
                var (enquiries, statusCounts) = objEnquiryBusinessModel.GetEnquiryData(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, status, "ASC", fiYear, _enquiryService);
                var model = new EnquiryListViewModel
                {
                    Enquiries = enquiries,
                    StatusCounts = statusCounts
                };
                ViewBag.Total = model.Enquiries.Any() ? model.Enquiries.First().Total : 0;
                ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
                return PartialView("_EnquiryDirectory", model);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("EnquiryList", ex);
            }
            return null;
        }

        [HttpPost]
        public ActionResult CreateEnquiry(EnquiryDetailsModel objEVM)
        {
            var isSuccess = false;
            try
            {
                objEVM.SiteId = CurrentUser.SiteId;
                objEVM.CreatedBy = CurrentUser.UserId;
                if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryCreate, CurrentUser.RoleId.FirstOrDefault()))
                {
                   // objEVM.CreatedBy = CurrentUser.RoleId.FirstOrDefault();
                    var enquiryId = objEnquiryBusinessModel.SaveEnquiryDetails(objEVM, _enquiryService);

                    if (enquiryId != "0")
                    {
                        return Json(new { status = true, enquiryId });
                    }

                    else
                    {
                        return Json(new { status = false, message = "Failed to save enquiry." });
                    }
                }
                else
                {
                    return View("UnAuthorized");
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("SaveEnquiry - Exception", ex);
                return Json(new { status = false, message = "An unexpected error occurred." });
            }
        }

        public ActionResult DeleteFile(int EID, string fileName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(fileName))
                    return Json(new { success = false, message = "Invalid file name." });

                // Construct full path
                string folderPath = Server.MapPath("~/Uploads/Resumes/");
                string filePath = Path.Combine(folderPath, fileName);

                // Ensure file is inside the allowed directory
                if (!filePath.StartsWith(folderPath, StringComparison.OrdinalIgnoreCase))
                    return Json(new { success = false, message = "Unauthorized path." });

                // Check if file exists and delete
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    return Json(new { success = true, message = "File deleted successfully." });
                }

                return Json(new { success = false, message = "File not found." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error deleting file: {ex.Message}" });
            }
        }
        //[HttpPost]
        //public ActionResult CreateEnquiry(EnquiryDetailsModel objEVM)
        //{

            //    if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryCreate, CurrentUser.RoleId.FirstOrDefault()))
            //    {
            //        var isSuccess = false;
            //        try
            //        {
            //            objEVM.SiteId = CurrentUser.SiteId;
            //            objEVM.CreatedBy = CurrentUser.UserId;
            //            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryCreate, CurrentUser.RoleId.FirstOrDefault()))
            //            {
            //                objEVM.CreatedBy = CurrentUser.RoleId.FirstOrDefault();
            //                var eId = objEnquiryBusinessModel.SaveEnquiryDetails(objEVM, _enquiryService);
            //                isSuccess = true;
            //                return Json(new { status = isSuccess, message = "", enquiryId = eId }, JsonRequestBehavior.AllowGet);
            //            }
            //            else
            //            {
            //                return Json(new { status = isSuccess, message = "duplicate" }, JsonRequestBehavior.AllowGet);
            //            }
            //        }
            //        catch (Exception ex)
            //        {
            //            errorLogObj.LogError("Error occured while saving manufacturer " + ex, ex);
            //            isSuccess = false;
            //        }
            //        return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
            //    }
            //    else
            //    {
            //        return View("UnAuthorized");
            //    }
            //}
        public ActionResult EditEnquiry(int eId)
        {
            EnquiryDetailsModel objEDM = new EnquiryDetailsModel();
            var isSuccess = false;
            try
            {
                objEDM = objEnquiryBusinessModel.GetEnquiryDetailsToEdit(eId, CurrentUser.SiteId, _enquiryService);
                //if (objMDM.ManufacturerUnitNameFlag == 1)
                //    objMDM.LstManufacturerUnitName.RemoveAll(x => x.Id == 2);
                return PartialView("_EditEnquiry", objEDM);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error occured while fetching information to edit manufacturer", ex);
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult UpdateEnquiry(EnquiryDetailsModel objEdm)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
            {
                var isSuccess = false;
                try
                {
                    objEdm.SiteId = CurrentUser.SiteId;
                    objEdm.CreatedBy = CurrentUser.UserId;
                    //if (objEnquiryBusinessModel.IsEnquiryExists(objEdm, _enquiryService))
                   // {
                        //if (objEdm.LstWorkScopeIds == null || !objEdm.LstWorkScopeIds.Contains(6))
                        //{
                        //    objEdm.OtherWorkScope = string.Empty;
                        //}
                        isSuccess = objEnquiryBusinessModel.UpdateEnquiryDetails(objEdm, _enquiryService);
                    if(isSuccess)
                        return Json(new { status = isSuccess, message = "", enquiryId = objEdm.EnquiryID }, JsonRequestBehavior.AllowGet);
                    else 
                        return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while saving manufacturer " + ex, ex);
                    isSuccess = false;
                }
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);

            }
            else
            {
                return View("UnAuthorized");
            }
        }
        [HttpPost]
        public ActionResult UpdateEnquiryStatus(EnquiryDetailsModel objEdm)
        {
            var isSuccess = false;
            try
            {
                objEdm.SiteId = CurrentUser.SiteId;
                objEdm.CreatedBy = CurrentUser.UserId;
                isSuccess = objEnquiryBusinessModel.UpdateEnquiryStatus(objEdm, _enquiryService);
                return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while saving manufacturer " + ex, ex);
                isSuccess = false;
            }
            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult UploadQuatation(string enquiryId, int EID)
        {
            EnquiryViewModel objEnquiryQuatationViewModel = new EnquiryViewModel();

            //To fetch all the values to fill drop down
            objEnquiryQuatationViewModel = objEnquiryBusinessModel.GetEnquiryQuatationDetailsToAdd(CurrentUser.SiteId, _enquiryService);

            //if (string.IsNullOrEmpty(objEnquiryQuatationViewModel.QuotationNo))
            //{
            //    var currentDate = DateTime.Now;
            //    int startYear = currentDate.Month >= 4 ? currentDate.Year : currentDate.Year - 1;
            //    int endYear = startYear + 1;
            //    string financialYear = startYear + "-" + endYear.ToString().Substring(2); // e.g. 2025-26
            //    objEnquiryQuatationViewModel.QuotationNo = "IQE/QTN/" + financialYear + "/";
            //}
            return PartialView("_UploadQuation", objEnquiryQuatationViewModel);
        }

        [HttpPost]
        public ActionResult SubmitUploadQuation1(EnquiryViewModel objEQV, List<HttpPostedFileBase> files)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
            {


                var isSuccess = false;
                var isfileSuccess = false;
                try
                {
                    objEQV.SiteId = CurrentUser.SiteId;
                    objEQV.CreatedBy = CurrentUser.UserId;
                    if (objEnquiryBusinessModel.IsEnquiryExists(objEQV, _enquiryService))
                    {
                        using (TransactionScope Transcope = new TransactionScope())
                        {

                            try
                            {
                                List<EnquiryViewModel> lstEnquiry = new List<EnquiryViewModel>();
                                lstEnquiry = objEnquiryBusinessModel.GetEnquiryQuotationBackupFiles(objEQV.EID, _enquiryService);

                                foreach (var backfile in lstEnquiry)
                                {
                                    if (backfile.FileName != null)
                                    {
                                        string oldPath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["EnquiryUploadPath"], backfile.FileName));
                                        string newPath = ConfigurationManager.AppSettings["EnquiryUploadBackupPath"];
                                        string newFileName = backfile.FileName;
                                        FileInfo f1 = new FileInfo(oldPath);

                                        if (f1.Exists)
                                        {
                                            // Ensure the backup directory exists
                                            if (!Directory.Exists(newPath))
                                            {
                                                Directory.CreateDirectory(newPath);
                                            }

                                            // Create the full new file path
                                            string destinationFile = Path.Combine(newPath, newFileName);

                                            // Check if the file already exists in the backup path
                                            if (System.IO.File.Exists(destinationFile))
                                            {
                                                // Rename the new file with a timestamp to avoid conflict
                                                string timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
                                                string newFileNameWithTimestamp = $"{Path.GetFileNameWithoutExtension(newFileName)}_{timestamp}{f1.Extension}";
                                                destinationFile = Path.Combine(newPath, newFileNameWithTimestamp);
                                            }

                                            // Move the file to the new location
                                            f1.MoveTo(destinationFile);
                                        }
                                    }

                                }

                                isSuccess = objEnquiryBusinessModel.UploadQuotationByEnquiryID(objEQV, _enquiryService);
                                if (isSuccess == true && objEQV.UploadFile != null)
                                {
                                    var flag = false;
                                    foreach (var file in objEQV.UploadFile)
                                    {
                                        if (file.ContentLength > 0)
                                        {
                                            objEQV.FileName = Path.GetFileName(file.FileName);
                                            objEQV.FilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["EnquiryUploadPath"], file.FileName));

                                            var path = Url.Content(Path.Combine(ConfigurationManager.AppSettings["EnquiryUploadPath"], file.FileName));
                                            //Path.Combine(Server.MapPath(ConfigurationManager.AppSettings["EnquiryUploadPath"]), fileName);
                                            isfileSuccess = objEnquiryBusinessModel.UploadQuotationFilesByEnquiryID(objEQV, flag, _enquiryService);
                                            flag = true;
                                            if (isfileSuccess)
                                                file.SaveAs(path);
                                            //else
                                            //    return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
                                        }
                                    }
                                }
                                Transcope.Complete();
                                Transcope.Dispose();
                            }
                            catch (TransactionException ex)
                            {
                                Transcope.Dispose();

                            }
                        }


                        // objEQV.UploadFile.SaveAs(ConfigurationManager.AppSettings["EnquiryUploadPath"] + objEQV.FileName);
                        // }

                        return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
                    }
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while saving manufacturer " + ex, ex);
                    isSuccess = false;
                }
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return View("UnAuthorized");
            }
        }
        [HttpPost]
        public ActionResult SubmitUploadQuation(EnquiryViewModel objEQV, List<HttpPostedFileBase> files)
        {
            if (!SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
                return View("UnAuthorized");

            bool isSuccess = false;
            var isfileSuccess = false; 

            try
            {
                objEQV.SiteId = CurrentUser.SiteId;
                objEQV.CreatedBy = CurrentUser.UserId;

                if (!objEnquiryBusinessModel.IsEnquiryExists(objEQV, _enquiryService))
                    return Json(new { status = false, message = "Enquiry does not exist." });

                using (TransactionScope scope = new TransactionScope())
                {
                    // Get existing files and their backup PhysicalFileName
                    var lstEnquiry = objEnquiryBusinessModel.GetEnquiryQuotationBackupFiles(objEQV.EID, _enquiryService);
                    
                    string uploadPath = ConfigurationManager.AppSettings["EnquiryUploadPath"];
                    string backupPath = ConfigurationManager.AppSettings["EnquiryUploadBackupPath"];
                    if (!Directory.Exists(backupPath)) Directory.CreateDirectory(backupPath);

                    foreach (var backfile in lstEnquiry)
                    {
                        if (string.IsNullOrEmpty(backfile.FileName) || string.IsNullOrEmpty(backfile.PhysicalFileName))
                            continue;

                        //string oldPath = Path.Combine(uploadPath, backfile.FileName);
                        string oldPath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["EnquiryUploadPath"], backfile.FileName));

                        string destinationFile = Path.Combine(backupPath, backfile.PhysicalFileName);

                        FileInfo f1 = new FileInfo(oldPath);
                        if (f1.Exists)
                        {
                            f1.MoveTo(destinationFile);
                        }
                    }

                    // Update main enquiry record
                    isSuccess = objEnquiryBusinessModel.UploadQuotationByEnquiryID(objEQV, _enquiryService);

                    // Save new uploaded files
                    if (isSuccess == true && objEQV.UploadFile != null)
                    {
                        var flag = false;
                        foreach (var file in objEQV.UploadFile)
                        {
                            if (file.ContentLength > 0)
                            {
                                objEQV.FileName = Path.GetFileName(file.FileName);
                                objEQV.FilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["EnquiryUploadPath"], file.FileName));

                                var path = Url.Content(Path.Combine(ConfigurationManager.AppSettings["EnquiryUploadPath"], file.FileName));
                                //Path.Combine(Server.MapPath(ConfigurationManager.AppSettings["EnquiryUploadPath"]), fileName);
                                isfileSuccess = objEnquiryBusinessModel.UploadQuotationFilesByEnquiryID(objEQV, flag, _enquiryService);
                                flag = true;
                                if (isfileSuccess)
                                    file.SaveAs(path);
                                //else
                                //    return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
                            }
                        }
                    }

                    scope.Complete();
                    scope.Dispose();
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error saving quotation: " + ex, ex);
                isSuccess = false;
            }

            return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        }

        [Authorize]
        //public ActionResult DownloadFile1(string EnquiryId, string FileName, bool backupFile)
        //{
        //    // Check screen-level permission first
        //    if (!SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
        //        return View("UnAuthorized");

        //    var userId = CurrentUser.UserId;
        //    var isSuperAdmin = CurrentUser.RoleId?.FirstOrDefault() == 1;


        //    // Fetch file info including CreatedByUserId
        //    var fileInfo = objEnquiryBusinessModel.GetEnquiryQuotationFileDetailsByID(_enquiryService, EnquiryId, FileName, backupFile);

        //    // Handle invalid file scenario
        //    if (fileInfo == null || string.IsNullOrEmpty(fileInfo.FileName))
        //        return HttpNotFound("File not found.");

        //    // Check access if not Superadmin
        //    if (!isSuperAdmin && fileInfo.CreatedBy != userId)
        //    {
        //        ViewBag.Message = "You are not authorized to download this document.";
        //        return View("UnauthorizedDownload");
        //    }

        //    // Prepare and return the file
        //    //var downloadFileName = Path.GetFileName(fileInfo.FilePath);


        //    string basePath = backupFile
        //        ? ConfigurationManager.AppSettings["EnquiryUploadBackupPath"]
        //        : ConfigurationManager.AppSettings["EnquiryUploadPath"];


        //    string fullPath = Path.Combine(basePath, fileInfo.FileName);
        //    var fileData = System.IO.File.ReadAllBytes(fullPath);

        //    Response.Clear();
        //    Response.Buffer = true;
        //    Response.Charset = "";
        //    Response.Cache.SetCacheability(HttpCacheability.NoCache);
        //    Response.ContentType = MimeMapping.GetMimeMapping(fileInfo.FileName);
        //    Response.AppendHeader("Content-Disposition", "attachment; filename=" + fileInfo.FileName);
        //    Response.BinaryWrite(fileData);
        //    Response.Flush();
        //    Response.End();

        //    return null;
        //}
        public ActionResult DownloadFile(string EnquiryId, int? FileID,  bool backupFile)
        {
            if (!SingletonScreenFeatureMapping.CanPerformOperation(
                    (int)ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
                return View("UnAuthorized");

            var userId = CurrentUser.UserId;
            var isSuperAdmin = CurrentUser.RoleId?.FirstOrDefault() == 1;

            // Fetch file info
            var fileInfo = objEnquiryBusinessModel.GetEnquiryQuotationFileDetailsByID(
                _enquiryService, EnquiryId, FileID,  backupFile);

            if (fileInfo == null || string.IsNullOrEmpty(fileInfo.FileName))
                return HttpNotFound("File not found.");

            if (!isSuperAdmin && fileInfo.CreatedBy != userId)
            {
                ViewBag.Message = "You are not authorized to download this document.";
                return View("UnauthorizedDownload");
            }

            // Determine base path
            string basePath = backupFile
                ? ConfigurationManager.AppSettings["EnquiryUploadBackupPath"]
                : ConfigurationManager.AppSettings["EnquiryUploadPath"];

            // Use the actual stored file name
            string fullPath =  Path.Combine(basePath, fileInfo.FileName);

            if (!System.IO.File.Exists(fullPath))
                return HttpNotFound("File does not exist on the server.");

            byte[] fileData = System.IO.File.ReadAllBytes(fullPath);
            string contentType = MimeMapping.GetMimeMapping(fileInfo.FileName ?? fileInfo.FileName);

            return File(fileData, contentType, fileInfo.FileName ?? fileInfo.FileName);
        }

        public JsonResult GetEnquiryQuotationsRevisionsFiles(int EnquiryId)
        {
            var documentDetails = objEnquiryBusinessModel.GetEnquiryQuotationsRevisionsFiles(
                EnquiryId, CurrentUser.SiteId, _enquiryService);

            if (documentDetails == null)
                return Json(new { error = "No document found." }, JsonRequestBehavior.AllowGet);

            // Active files
            var activeFiles = documentDetails.ActiveFiles ?? new List<EnquiryViewModel>();

            // Superseded files
            var supersededFiles = documentDetails.SupersededFiles ?? new List<EnquiryViewModel>();

            var result = new
            {
                activeFiles = activeFiles.Select(d => new
                {
                    quotationNo = d.QuotationNo,
                    revisionNumber = d.RevisionNo,
                    revisionDate = d.QuotationDate?.ToString("yyyy-MM-dd"),
                    status = "Active",
                    fileName = d.FileName,
                    filePath = d.FilePath,
                    fileId = d.FileId
                }).ToList(),
                supersededFiles = supersededFiles.Select(d => new
                {
                    quotationNo = d.QuotationNo,
                    revisionNumber = d.RevisionNo,
                    revisionDate = d.CreatedDate?.ToString("yyyy-MM-dd"),
                    status = "Superseded",
                    fileName = d.FileName,
                    filePath = d.FilePath,
                    fileId = d.FileId
                }).ToList()
            };

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        //public JsonResult GetEnquiryQuotationsRevisionsFiles(int EnquiryId)
        //{
        //    var documentDetails = objEnquiryBusinessModel.GetEnquiryQuotationsRevisionsFiles(
        //        EnquiryId, CurrentUser.SiteId, _enquiryService);

        //    if (documentDetails == null)
        //    {
        //        return Json(new { error = "No document found." }, JsonRequestBehavior.AllowGet);
        //    }

        //    var latest = documentDetails;
        //    var oldRevisions = documentDetails.LstEnquiryViewModel ?? new List<EnquiryViewModel>();

        //    var result = new
        //    {
        //        latest = new
        //        {
        //            quotationNo = latest.QuotationNo,
        //            revisionNumber = latest.RevisionNo,
        //            revisionDate = latest.QuotationDate?.ToString("yyyy-MM-dd"),
        //            status = "Active",
        //            fileName = latest.FileName,
        //            filePath = latest.FilePath,
        //            fileId = latest.FileId
        //        },
        //        oldRevisions = oldRevisions.Select(d => new
        //        {
        //            quotationNo = d.QuotationNo,
        //            revisionNumber = d.RevisionNo,
        //            revisionDate = d.CreatedDate?.ToString("yyyy-MM-dd"),
        //            status = "Superseded",
        //            fileName = d.FileName,
        //            filePath = d.FilePath,
        //            fileId= d.FileId
        //        }).ToList()
        //    };

        //    return Json(result, JsonRequestBehavior.AllowGet);
        //}

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
        public static string RenderViewToString(ControllerContext context, string viewName, object model)
        {
            ViewDataDictionary viewData = new ViewDataDictionary(model);
            TempDataDictionary tempData = new TempDataDictionary();

            using (var sw = new StringWriter())
            {
                ViewEngineResult viewResult = ViewEngines.Engines.FindPartialView(context, viewName);
                ViewContext viewContext = new ViewContext(context, viewResult.View, viewData, tempData, sw);
                viewResult.View.Render(viewContext, sw);
                return sw.GetStringBuilder().ToString();
            }
        }
        [Authorize]
        public ActionResult DownloadEnquiryPDF(int EnquiryId)
        {
            try
            {
                EnquiryDetailsModel objEDM = new EnquiryDetailsModel();
                // Sample Enquiry Data (Replace with Database Data)
                objEDM = objEnquiryBusinessModel.GetEnquiryDetailsToEdit(EnquiryId, CurrentUser.SiteId, _enquiryService);


                // Render the Razor View into an HTML string
                string htmlContent = RenderViewToString(ControllerContext, "_EnquiryTemplate", objEDM);

                byte[] pdfBytes;
                using (MemoryStream stream = new MemoryStream())
                {
                    iTextSharp.text.Document pdfDoc = new iTextSharp.text.Document(PageSize.A4.Rotate(), 100f, 10f, 10f, 10f);
                    // Document pdfDoc = new Document(PageSize.A4, 20f, 20f, 30f, 30f);
                    PdfWriter pdfWriter = PdfWriter.GetInstance(pdfDoc, stream);
                    pdfDoc.Open();

                    using (StringReader sr = new StringReader(htmlContent))
                    {
                        XMLWorkerHelper.GetInstance().ParseXHtml(pdfWriter, pdfDoc, sr);
                    }

                    pdfDoc.Close();
                    pdfBytes = stream.ToArray();
                }

                return File(pdfBytes, "application/pdf", $"Enquiry_Report_{EnquiryId}.pdf");

            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }


        //private string ConvertViewToString(string viewName, object model)
        //{
        //    ViewData.Model = model;
        //    using (StringWriter sw = new StringWriter())
        //    {
        //        ViewEngineResult viewResult = ViewEngines.Engines.FindView(ControllerContext, viewName, null);
        //        if (viewResult.View == null)
        //        {
        //            return "Error: View not found.";
        //        }

        //        ViewContext viewContext = new ViewContext(ControllerContext, viewResult.View, ViewData, TempData, sw);
        //        viewResult.View.Render(viewContext, sw);
        //        return sw.ToString();
        //    }
        //}
        // public ActionResult DownloadEnquiryPDF1(int EID)
        //{
        //     if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
        //     {

        //         try
        //         {
        //             string templateType =  "_EnquiryTemplate";
        //             var data = "";
        //             string viewContent = ConvertViewToString(templateType, data);
        //             byte[] bytes;
        //             using (MemoryStream stream = new System.IO.MemoryStream())
        //             {
        //                 var lines = viewContent.Split(new[] { "<div style=\"page-break-before:always\">&nbsp;</div>" }, StringSplitOptions.None);
        //                 lines[0] += "</div>\r\n</body>\r\n </html>";
        //                 StringReader sr = new StringReader(lines[0]);

        //                 iTextSharp.text.Document pdfDoc = new iTextSharp.text.Document(PageSize.A4, 20f, 10f, 45f, 45f);
        //                 PdfWriter pdfWriter = PdfWriter.GetInstance(pdfDoc, stream);
        //                 pdfDoc.Open();
        //                 //pdfDoc.Add(new Paragraph(lines[0]));

        //                 //pdfDoc.SetPageSize(new Rectangle(950f, 1100f));
        //                 XMLWorkerHelper.GetInstance().ParseXHtml(pdfWriter, pdfDoc, sr);


        //                 // pdfDoc.SetPageSize(iTextSharp.text.PageSize.A4.Rotate());
        //                 pdfDoc.NewPage();

        //                 pdfDoc.Close();
        //                 bytes = stream.ToArray();
        //             }

        //             return File(bytes, "application/pdf", "Sample.pdf");

        //         }
        //         catch (Exception ex)
        //         {
        //             return Content("Error generating PDF: " + ex.Message);
        //         }
        //     }
        //     else
        //     {
        //         return null;
        //     }
        // }

        public ActionResult SubmitEnquiryStatus(EnquiryDetailsModel objEdm)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
            {

                var isSuccess = false;
                try
                {
                    objEdm.SiteId = CurrentUser.SiteId;
                    objEdm.CreatedBy = CurrentUser.UserId;
                    isSuccess = objEnquiryBusinessModel.SubmitEnquiryStatus(objEdm, _enquiryService);
                    return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while saving manufacturer " + ex, ex);
                    isSuccess = false;
                }
                return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return View("UnAuthorized");
            }
        }
    }
}