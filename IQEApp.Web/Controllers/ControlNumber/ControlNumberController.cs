using IQEApp.Service.ControlNumberService;
using IQEApp.Service.ServiceOrder;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.EnquiryModel;
using IQEApp.Web.Models.UserModel;
using IQEApp.Web.Models.VisitProcessing;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Transactions;
using System.Web;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.ControlNumber
{
    //[CustomAuthorize(Roles = "Super Admin Role, Admin Role, Technician Role, Coordinator Role, Quality Check Role, Finance Role")]
    public class ControlNumberController : BaseController
    {
        private readonly ControlNumberService _controlNumberService;
        private readonly IServiceOrderService _serviceOrderService;
        ControlNumberBusinessModel objBusinessModel = new ControlNumberBusinessModel();
        public ControlNumberController()
        {
            _controlNumberService = new ControlNumberService();
            _serviceOrderService = new ServiceOrderService();
        }
        #region ControlNumber
        //
        // GET: /ControlNumber/
        public ActionResult Index(DirectorySearchQueryModel searchQueryModel)
        {
            if (!SingletonScreenFeatureMapping.CanPerformOperation(
                (int)ScnFetMapId.SalesControlNumber,
                CurrentUser.RoleId.FirstOrDefault()))
            {
                return View("UnAuthorized");
            }

            // always set up defaults first
            searchQueryModel.SiteId = CurrentUser.SiteId;
            if (string.IsNullOrEmpty(searchQueryModel.StrSearch))
                searchQueryModel.StrSearch = string.Empty;
            if (string.IsNullOrEmpty(searchQueryModel.AlphaSearch))
                searchQueryModel.AlphaSearch = string.Empty;

            // declare your list OUTSIDE try so it’s in scope
            IEnumerable<ControlNumberViewModel> lstControlNumbersList1 = Enumerable.Empty<ControlNumberViewModel>();

            try
            {
                lstControlNumbersList1 = objBusinessModel.GetControlNumberDetails(searchQueryModel, _controlNumberService);

                ViewBag.Total = lstControlNumbersList1.Any() ? lstControlNumbersList1.First().Total : 0;
                searchQueryModel.PageCount += searchQueryModel.FetchCount;
                ViewBag.CurrentPageCount = searchQueryModel.PageCount;
                ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("fetching control numbers", ex);
                // Optionally you can still return an empty list or an error page
            }

            return View("ControlNumberDetails", lstControlNumbersList1);
        }

        public ActionResult CreateControlNumber()
        {
            ControlNumberDetailsModel model = new ControlNumberDetailsModel();
            try
            {
                model = objBusinessModel.GetControlNumberDetailsToAdd(CurrentUser.SiteId, _controlNumberService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured while fetching service order details", e);
                throw;
            }

            return PartialView("_CreateControlNumber", model);
        }

        public ActionResult GenerateControlNumber(ControlNumberViewModel model)
        {
            var isSuccess = false;
            model.SiteId = CurrentUser.SiteId;
            model.LoginUserId = CurrentUser.UserId;

            var controlNumber = 0;
            try
            {
                controlNumber = objBusinessModel.GenerateControlNumber(model, _controlNumberService);
                if (controlNumber > 0)
                {
                    isSuccess = true;
                }
            }
            catch (Exception va)
            {
                Console.WriteLine(va);
                throw;
            }

            return Json(new { status = isSuccess, ControlNumber = controlNumber }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetControlNumberDetails(DirectorySearchQueryModel searchQueryModel)
        {
            searchQueryModel.SiteId = CurrentUser.SiteId;
            if (string.IsNullOrEmpty(searchQueryModel.StrSearch))
                searchQueryModel.StrSearch = "";
            if (string.IsNullOrEmpty(searchQueryModel.AlphaSearch))
                searchQueryModel.AlphaSearch = "";

            IEnumerable<ControlNumberViewModel> lstControlNumbersList1 = Enumerable.Empty<ControlNumberViewModel>();
            try
            {
                lstControlNumbersList1 = objBusinessModel.GetControlNumberDetails(searchQueryModel, _controlNumberService);
                ViewBag.Total = lstControlNumbersList1.Any() ? lstControlNumbersList1.FirstOrDefault().Total : 0;
                searchQueryModel.PageCount += searchQueryModel.FetchCount;
                ViewBag.CurrentPageCount = searchQueryModel.PageCount;
                ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("fetching control numbers", ex);
            }

            return PartialView("_ControlNumbersList", lstControlNumbersList1);
        }

        public ActionResult GetControlNumberDetailsToUpdate(Guid controlNumberGuid)
        {
            ControlNumberDetailsModel model = new ControlNumberDetailsModel();
            try
            {
                model = objBusinessModel.GetControlNumberDetailsToUpdate(controlNumberGuid, CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
                //if (model.LstPurchaseOrderItems.Count > 0)
                //{
                //    ViewBag.IsBlockEquipmentItem = true;
                //}
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured while fetching service order details", e);
                throw;
            }

            return PartialView("_UpdateControlNumberDetails", model);
        }
        public ActionResult UpdateControlNumber(ControlNumberViewModel model)
        {
            var isSuccess = false;
            model.SiteId = CurrentUser.SiteId;
            model.LoginUserId = CurrentUser.UserId;
            try
            {
                isSuccess = objBusinessModel.UpdateControlNumber(model, _controlNumberService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured while updating control details", e);
                throw;
            }
            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }
        public ActionResult UpdateControlNumberActiveStatus(Guid controlNumberGuid, bool status)
        {
            var isSuccess = false;
            try
            {
                isSuccess = objBusinessModel.UpdateControlNumberActiveStatus(controlNumberGuid, CurrentUser.UserId, status, _controlNumberService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured while fetching service order details", e);
            }
            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetControlNumberToUpdateLOISONumber(Guid controlNumberGuid, int SOId)
        {
           // EnquiryViewModel objEnquiryQuatationViewModel = new EnquiryViewModel();
            ControlNumberDetailsModel model = new ControlNumberDetailsModel();

            //To fetch all the values to fill drop down
            model = objBusinessModel.GetControlNumberToUpdateLOISONumber(controlNumberGuid, CurrentUser.SiteId, _controlNumberService);
            model.ControlNumberGuid = model.ControlNumberDetails.ControlNumberGuid;
            model.SOId = model.ControlNumberDetails.SOId;
            return PartialView("_UpdateLOISONumber", model);
        }

        [HttpPost]
        public ActionResult UpdateLOISONumber(ControlNumberViewModel objCNV, HttpPostedFileBase files)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
            {
                var isSuccess = false;
                var isfileSuccess = false;
                try
                {
                    using (TransactionScope Transcope = new TransactionScope())
                    {
                        try
                        {
                            objCNV.SiteId = CurrentUser.SiteId;
                            objCNV.LoginUserId = CurrentUser.UserId;

                            if (objCNV.LOISOTypeId == 1)
                            {
                                if (objCNV.LOINumber == "" || objCNV.LOINumber == null)
                                {
                                    Transcope.Complete();
                                    Transcope.Dispose();
                                    return Json(new { status = isSuccess, message = "empty" }, JsonRequestBehavior.AllowGet);
                                }
                                else
                                {
                                    isSuccess = objBusinessModel.UpdateLatestSONumber(objCNV, _controlNumberService);

                                    if (isSuccess == true && objCNV.UploadFile != null)
                                    {
                                        List<ControlNumberViewModel> lstControlNumbersList = new List<ControlNumberViewModel>();
                                        lstControlNumbersList = objBusinessModel.GetServiceOrderFilesBackup(objCNV.SOId, _controlNumberService);

                                        foreach (var backfile in lstControlNumbersList)
                                        {
                                            if (backfile.FileName != null)
                                            {
                                                string oldPath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], backfile.FileName));
                                                string newpath = ConfigurationManager.AppSettings["ServiceOrderBackFilePath"];
                                                string newFileName = backfile.FileName;
                                                FileInfo f1 = new FileInfo(oldPath);
                                                if (f1.Exists)
                                                {
                                                    if (!Directory.Exists(newpath))
                                                    {
                                                        Directory.CreateDirectory(newpath);
                                                    }
                                                    f1.MoveTo(string.Format("{0}{1}{2}", newpath, newFileName, f1.Extension));
                                                }
                                            }
                                        }


                                        var flag = false;
                                        foreach (var file in objCNV.UploadFile)
                                        {
                                            if (file.ContentLength > 0)
                                            {
                                                objCNV.FileName = Path.GetFileName(file.FileName);
                                                objCNV.FilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], file.FileName));
                                                //var path = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], file.FileName));
                                                //Path.Combine(Server.MapPath(ConfigurationManager.AppSettings["EnquiryUploadPath"]), fileName);
                                                isfileSuccess = objBusinessModel.UpdateSOFilesBySOID(objCNV, flag, _controlNumberService);
                                                flag = true;
                                                if (isfileSuccess)
                                                    file.SaveAs(objCNV.FilePath);
                                                // else
                                                //   return Json(new { status = isSuccess, message = "Error in file saving" }, JsonRequestBehavior.AllowGet);
                                            }
                                        }
                                        
                                    }

                                    else
                                    {
                                        Transcope.Complete();
                                        Transcope.Dispose();
                                        return Json(new { status = isSuccess, message = "Error in file saving" }, JsonRequestBehavior.AllowGet);
                                    }
                                    // if (isSuccess == true && objCNV.UploadFile != null)
                                    //   objCNV.UploadFile.SaveAs(ConfigurationManager.AppSettings["ServiceOrderUploadPath"] + objCNV.FileName);
                                    Transcope.Complete();
                                    Transcope.Dispose();
                                    return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
                                }
                            }
                            if (objCNV.LOISOTypeId == 2)
                            {
                                if (objCNV.SONumber == "" || objCNV.SONumber == null)
                                {
                                    Transcope.Complete();
                                    Transcope.Dispose();
                                    return Json(new { status = isSuccess, message = "empty" }, JsonRequestBehavior.AllowGet);
                                }
                                else
                                {
                                    if (!_serviceOrderService.IsServiceOrderExistsAlready(objCNV.SOId, objCNV.SONumber, CurrentUser.SiteId))
                                    {
                                        isSuccess = objBusinessModel.UpdateLatestSONumber(objCNV, _controlNumberService);
                                        var flag = false;
                                        if (isSuccess == true && objCNV.UploadFile != null)
                                        {
                                            List<ControlNumberViewModel> lstControlNumbersList = new List<ControlNumberViewModel>();
                                            lstControlNumbersList = objBusinessModel.GetServiceOrderFilesBackup(objCNV.SOId, _controlNumberService);

                                            foreach (var backfile in lstControlNumbersList)
                                            {
                                                string oldPath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], backfile.FileName));
                                                string newpath = ConfigurationManager.AppSettings["ServiceOrderBackFilePath"];
                                                string newFileName = backfile.FileName;
                                                FileInfo f1 = new FileInfo(oldPath);
                                                if (f1.Exists)
                                                {
                                                    if (!Directory.Exists(newpath))
                                                    {
                                                        Directory.CreateDirectory(newpath);
                                                    }
                                                    f1.MoveTo(string.Format("{0}{1}{2}", newpath, newFileName, f1.Extension));
                                                }

                                            }

                                            foreach (var file in objCNV.UploadFile)
                                            {
                                                if (file.ContentLength > 0)
                                                {
                                                    objCNV.FileName = Path.GetFileName(file.FileName);
                                                    objCNV.FilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], file.FileName));
                                                   // var path = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], file.FileName));
                                                    //Path.Combine(Server.MapPath(ConfigurationManager.AppSettings["EnquiryUploadPath"]), fileName);
                                                    isfileSuccess = objBusinessModel.UpdateSOFilesBySOID(objCNV, flag, _controlNumberService);
                                                    flag= true;
                                                    if (isfileSuccess)
                                                        file.SaveAs(objCNV.FilePath);
                                                    // else
                                                    //   return Json(new { status = isSuccess, message = "Error in file saving" }, JsonRequestBehavior.AllowGet);
                                                }
                                            }
                                        }
                                        else
                                        {
                                            Transcope.Complete();
                                            Transcope.Dispose();
                                            return Json(new { status = isSuccess, message = "Error in file saving" }, JsonRequestBehavior.AllowGet);
                                        }
                                        //if (isSuccess == true && objCNV.UploadFile != null)
                                        //  objCNV.UploadFile.SaveAs(ConfigurationManager.AppSettings["ServiceOrderUploadPath"] + objCNV.FileName);
                                        Transcope.Complete();
                                        Transcope.Dispose();
                                        return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
                                    }

                                    else
                                    {
                                        Transcope.Complete();
                                        Transcope.Dispose();
                                        return Json(new { status = isSuccess, message = "duplicate" }, JsonRequestBehavior.AllowGet);
                                    }

                                }
                            }
                            else
                            {
                                Transcope.Complete();
                                Transcope.Dispose();
                                return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
                            }
                        }
                        catch (TransactionException ex)
                        {
                            Transcope.Dispose();

                        }
                    }
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while Updating  " + ex, ex);
                    isSuccess = false;
                }
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return View("UnAuthorized");
            }
        }
       // [HttpPost]
        //public ActionResult UpdateLOISONumber_bkp(ControlNumberViewModel objCNV,HttpPostedFileBase files)
        //{
        //    if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
        //    {


        //        var isSuccess = false;
        //        try
        //        {
                    
        //            if (objCNV.UploadFile != null)
        //            {
        //                objCNV.FileName = objCNV.UploadFile.FileName;

        //                objCNV.FilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], objCNV.UploadFile.FileName));
        //                // objEQV.UploadFile.SaveAs(Server.MapPath("~") + objEQV.FilePath);

        //                //objCNV.UploadFile.SaveAs(ConfigurationManager.AppSettings["storagePath"] + objCNV.FilePath);
                       
                        
        //            }
        //            objCNV.SiteId = CurrentUser.SiteId;
        //            objCNV.LoginUserId = CurrentUser.UserId;

        //            if (objCNV.LOISOTypeId == 1)
        //            {
        //                if (objCNV.LOINumber == "" || objCNV.LOINumber == null)
        //                {
        //                    return Json(new { status = isSuccess, message = "empty" }, JsonRequestBehavior.AllowGet);
        //                }
        //                else
        //                {
        //                    isSuccess = objBusinessModel.UpdateLatestSONumber(objCNV, _controlNumberService);
        //                    if(isSuccess==true && objCNV.UploadFile != null)
        //                      objCNV.UploadFile.SaveAs(ConfigurationManager.AppSettings["ServiceOrderUploadPath"] + objCNV.FileName);
        //                    return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        //                }
        //            }
        //            if (objCNV.LOISOTypeId == 2)
        //            {
        //                if (objCNV.SONumber == "" || objCNV.SONumber == null)
        //                {
        //                    return Json(new { status = isSuccess, message = "empty" }, JsonRequestBehavior.AllowGet);
        //                }
        //                else
        //                {
        //                    if (!_serviceOrderService.IsServiceOrderExistsAlready(objCNV.SOId, objCNV.SONumber, CurrentUser.SiteId))
        //                    {
        //                        isSuccess = objBusinessModel.UpdateLatestSONumber(objCNV, _controlNumberService);
        //                        if (isSuccess== true && objCNV.UploadFile != null)
        //                            objCNV.UploadFile.SaveAs(ConfigurationManager.AppSettings["ServiceOrderUploadPath"] + objCNV.FileName);
        //                        return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        //                    }

        //                    else
        //                    {
        //                        return Json(new { status = isSuccess, message = "duplicate" }, JsonRequestBehavior.AllowGet);
        //                    }

        //                }
        //            }
        //            else
        //            {
        //                return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
        //            }
        //        }
        //        catch (Exception ex)
        //        {
        //            errorLogObj.LogError("Error occured while Updating  " + ex, ex);
        //            isSuccess = false;
        //        }
        //        return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        //    }
        //    else
        //    {
        //        return View("UnAuthorized");
        //    }
        //}




        [HttpPost]
        public ActionResult UpdateLatestSONumber1(Guid controlNumberGuid, int Id,string LatestSONumber, HttpPostedFileBase files) 
        {
            var isSuccess = false;
            try
            {
                var ii=HttpContext.Request.Files.Count;

                for (int i = 0; i < Request.Files.Count; i++)
                {
                    HttpPostedFileBase file = Request.Files[i]; //Uploaded file
                                                                //Use the following properties to get file's name, size and MIMEType
                    int fileSize = file.ContentLength;
                    string fileName = file.FileName;
                    string mimeType = file.ContentType;
                    System.IO.Stream fileContent = file.InputStream;


                    //model.FileName = model.UploadFile.FileName;
                    //model.FilePath = Url.Content(System.IO.Path.Combine("~/UploadedFiles/ServiceOrderDocuments/", model.UploadFile.FileName));
                    //model.UploadFile.SaveAs(ConfigurationManager.AppSettings["storagePath"] + model.FilePath);

                    //isSuccess = objBusinessModel.UpdateLatestSONumber(controlNumberGuid, Id, LatestSONumber, CurrentUser.UserId, _controlNumberService);
                }
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured while fetching service order details", e);
            }
            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }
        #endregion

        #region ScheduleVist

        public ActionResult ScheduleVisit(Guid? controlNumberGuid, string controlNumber)
        {
            ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();
            //controlNumberGuid == null ? Guid.Empty : (object)controlNumberGuid;
            if ((!controlNumberGuid.HasValue) && (string.IsNullOrEmpty(controlNumber)))
            {
                model.ControlNumberDetails = new ControlNumberViewModel();
                model.LstUsers = new List<UserViewModel>();

            }
            else
            {
                try
                {
                    model = objBusinessModel.GetVisitDetails(controlNumberGuid, controlNumber, CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
                    model.LstUsers = new List<UserViewModel>();
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                    throw;
                }

                if (controlNumberGuid.HasValue)
                {
                    ViewBag.ShowControlNumberSearch = false;
                    return View("~/Views/VisitProcessing/ScheduleVisit.cshtml", model);
                }
                return PartialView("~/Views/VisitProcessing/_ControlNumberDetails.cshtml", model);
            }
            return View("~/Views/VisitProcessing/ScheduleVisit.cshtml", model);
        }
        #endregion

        public ActionResult GetControlNumCumPreviousVisitDetails(int serviceOrderId)
        {
            List<ScheduleVisitModel> objList = new List<ScheduleVisitModel>();
            try
            {
                objList = objBusinessModel.GetControlNumCumPreviousVisitDetails(serviceOrderId, _controlNumberService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured while fetching service order details", e);
            }

            return PartialView("_PreviousVisitList", objList);
        }

        [Authorize]
        public ActionResult DownloadFile(Guid GUId, string FileName, int FileId)
        {
            // Check screen-level permission first
            if (!SingletonScreenFeatureMapping.CanPerformOperation((int) ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
                return View("UnAuthorized");

        var userId = CurrentUser.UserId;
        var isSuperAdmin = CurrentUser.RoleId?.FirstOrDefault() == 1;


        // Fetch file info including CreatedByUserId
        var fileInfo = objBusinessModel.GetSOFileDetailsByGUID(GUId, FileName.Trim(), FileId, _controlNumberService);

            // Handle invalid file scenario
            if (fileInfo == null || string.IsNullOrEmpty(fileInfo.FileName))
                return HttpNotFound("File not found.");

            // Check access if not Superadmin
            if (!isSuperAdmin && fileInfo.CreatedBy != userId)
            {
                ViewBag.Message = "You are not authorized to download this document.";
                return View("UnauthorizedDownload");
            }

            // Prepare and return the file
            var downloadFileName = Path.GetFileName(fileInfo.FilePath);
        var fileData = System.IO.File.ReadAllBytes(fileInfo.FilePath);

            Response.Clear();
            Response.Buffer = true;
            Response.Charset = "";
            Response.Cache.SetCacheability(HttpCacheability.NoCache);
            Response.ContentType = MimeMapping.GetMimeMapping(downloadFileName);
            Response.AppendHeader("Content-Disposition", "attachment; filename=" + downloadFileName);
            Response.BinaryWrite(fileData);
            Response.Flush();
            Response.End();

            return null;
        }

//[Authorize]
//        public ActionResult DownloadFile(Guid GUId, string FileName,int FileId)
//        {
//          //  bool retVal = true;
//           // string fileContainerPath = ConfigurationManager.AppSettings["ServiceOrderUploadPath"];
//            ControlNumberViewModel fileInfo = new ControlNumberViewModel();
//            //ControlNumberBusinessModel objFiles = new ControlNumberBusinessModel();
//            fileInfo = objBusinessModel.GetSOFileDetailsByGUID(GUId, FileName.Trim(), FileId, _controlNumberService);
//            if (!string.IsNullOrEmpty(fileInfo.FileName))
//            {

//                string DownloadFileName = System.IO.Path.GetFileName(fileInfo.FilePath);
//                var DownloadFileData = System.IO.File.ReadAllBytes(fileInfo.FilePath);

//                //System.IO.Path.GetFileName(fileInfo.FileName);
//                Response.Clear();
//                Response.Buffer = true;
//                Response.Charset = "";
//                Response.Cache.SetCacheability(HttpCacheability.NoCache);
//                Response.ContentType = "application/*";
//                Response.AppendHeader("Content-Disposition", "attachment; filename=" + DownloadFileName);
//                Response.BinaryWrite(DownloadFileData);
//                Response.Flush();
//                Response.End();


//            }
//            return null;
//        }
    }
}