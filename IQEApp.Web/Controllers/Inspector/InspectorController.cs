using Azure.Storage.Blobs.Models;
using IQEApp.Service.InspectorsService;
using IQEApp.Service.SecurityService;
using IQEApp.Service.UserService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.AssociatesModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.Data;
using IQEApp.Web.Models.EnquiryModel;
using IQEApp.Web.Models.UserModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Transactions;
using System.Web;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Inspector
{
    public class InspectorController : BaseController
    {
        private static List<InspectorRateViewModel> _inspectors = new List<InspectorRateViewModel>();

        private readonly IInspectorsServices _inspectorsService;
        private readonly ISecurityService _securityService;
        private readonly IUserService _userService;

        InspectorsBusinessModel objInspectorsBusinessModel = new InspectorsBusinessModel();
        public InspectorController()
        {
            _inspectorsService = new InspectorsServices();
            _securityService = new SecurityService();
            _userService = new UserService();
            //SingletonScreenFeatureMapping.SetScreenFeatureMapping(CurrentUser.RoleId.FirstOrDefault(), _securityService);
        }

        private bool IsSuperAdmin()
        {
            return CurrentUser.RoleId != null && CurrentUser.RoleId.Contains(1);
        }

        private bool HasPermission(ScnFetMapId permission)
        {
            return CurrentUser.RoleId != null &&
                   CurrentUser.RoleId.Any(roleId =>
                       SingletonScreenFeatureMapping.CanPerformOperation((int)permission, roleId));
        }

        public ActionResult Index()
        {
            // Superadmin OR AdminData permission
            if (!IsSuperAdmin() && !HasPermission(ScnFetMapId.AdminData))
                return View("UnAuthorized");

            List<InspectorRateViewModel> lst = new List<InspectorRateViewModel>();
            int defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);

            try
            {
                lst = objInspectorsBusinessModel.GetAllInspectorsDetails(
                    CurrentUser.SiteId, "", "", 0, defaultFetchCount, true, "DESC", _inspectorsService);

                ViewBag.Total = lst.Any() ? lst.First().Total : 0;
                ViewBag.CurrentPageCount = lst.Any() ? defaultFetchCount : 0;
                ViewBag.ActiveStatus = true;
                ViewBag.RoleId = CurrentUser.RoleId;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Inspector Index", ex);
            }

            return View("Index", lst);
        }

        public ActionResult GetInspectorListBySiteId( int pageCount = 0, string strSearch = "",string alphaSearch = "",  bool activeStatus = true, string sortingOrder = "ASC")
        {
            List<InspectorRateViewModel> list = new List<InspectorRateViewModel>();
            int defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);

            try
            {
                list = objInspectorsBusinessModel.GetAllInspectorsDetails(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, sortingOrder, _inspectorsService);

                if (list.Any())
                {
                    ViewBag.Total = list.First().Total;
                    pageCount += defaultFetchCount;
                    ViewBag.CurrentPageCount = pageCount;
                }
                else
                {
                    ViewBag.Total = 0;
                    ViewBag.CurrentPageCount = 0;
                }

                ViewBag.RoleId = CurrentUser.RoleId;
                ViewBag.ActiveStatus = activeStatus;

                return PartialView("_InspectorsDirectory", list);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("GetInspectorList", ex);
                return null;
            }
        }


        [HttpPost]
        public ActionResult SaveUpdateInspector(InspectorRateViewModel objIRVM, bool flag, HttpPostedFileBase[] UploadFile)
        {
            if (!IsSuperAdmin() && !HasPermission(ScnFetMapId.DataCreate))
                return View("UnAuthorized");

            bool isSuccess = false;
            bool isFileSuccess = false;

            try
            {
                objIRVM.CreatedBy = CurrentUser.UserId;
                objIRVM.SiteId = CurrentUser.SiteId;

                using (TransactionScope scope = new TransactionScope())
                {
                    string uploadPath = ConfigurationManager.AppSettings["InspectorDataUploadPath"];
                    string backupPath = ConfigurationManager.AppSettings["InspectorDataBackUpPath"];

                    if (!Directory.Exists(backupPath))
                        Directory.CreateDirectory(backupPath);

                    bool hasNewUploads = UploadFile != null &&
                                         UploadFile.Any(f => f != null && f.ContentLength > 0);

                    // 1️⃣ Save / Update Inspector
                    int inspectorId = objInspectorsBusinessModel
                        .SaveUpdateInspector(objIRVM, flag, _inspectorsService);

                    isSuccess = inspectorId > 0;

                    // 2️⃣ Move existing files to backup ONLY if new files uploaded
                    if (isSuccess && hasNewUploads)
                    {
                        var existingFiles =
                            objInspectorsBusinessModel.GetInspectorUploadedBackupFiles(
                                inspectorId, _inspectorsService);

                        foreach (var file in existingFiles)
                        {
                            if (string.IsNullOrEmpty(file.FileName) ||
                                string.IsNullOrEmpty(file.PhysicalFileName))
                                continue;

                            string oldPath = Path.Combine(uploadPath, file.FileName);
                            string backupFilePath = Path.Combine(backupPath, file.PhysicalFileName);

                            if (System.IO.File.Exists(oldPath))
                                System.IO.File.Move(oldPath, backupFilePath);
                        }

                        // 3️⃣ Save new files
                        bool fileFlag = false;

                        foreach (var file in UploadFile)
                        {
                            if (file == null || file.ContentLength == 0)
                                continue;

                            string originalFileName = Path.GetFileName(file.FileName);
                            string destPath = Path.Combine(uploadPath, originalFileName);

                            objIRVM.FileName = originalFileName;
                            objIRVM.FilePath = destPath;
                            objIRVM.InspectorId = inspectorId;

                            isFileSuccess = objInspectorsBusinessModel
                                .SaveInspectorDocument(objIRVM, fileFlag, _inspectorsService);

                            if (isFileSuccess)
                                file.SaveAs(destPath);

                            fileFlag = true;
                        }
                    }
                    // 4️⃣ No new upload → retain existing file
                    else if (isSuccess && !hasNewUploads && !string.IsNullOrEmpty(objIRVM.FileName))
                    {
                        objIRVM.FilePath = Path.Combine(uploadPath, objIRVM.FileName);
                        objInspectorsBusinessModel
                            .SaveInspectorDocument(objIRVM, true, _inspectorsService);
                    }

                    scope.Complete();
                }

                return Json(new
                {
                    status = isSuccess,
                    message = flag ? "updated" : "saved"
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("SaveUpdateInspector", ex);
                return Json(new { status = false, message = "error" },
                    JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetInspectorRevisionsFiles(int InspectorId)
        {
            var documentDetails = objInspectorsBusinessModel.GetInspectorRevisionsFiles(
                InspectorId, CurrentUser.SiteId, _inspectorsService);

            if (documentDetails == null)
                return Json(new { error = "No document found." }, JsonRequestBehavior.AllowGet);

            // Active files
            var activeFiles = documentDetails.ActiveFiles ?? new List<InspectorRateViewModel>();

            // Superseded files
            var supersededFiles = documentDetails.SupersededFiles ?? new List<InspectorRateViewModel>();

            var result = new
            {
                activeFiles = activeFiles.Select(d => new
                {
                    revisionNumber = d.RevisionNo,
                    revisionDate = d.CreatedDate?.ToString("yyyy-MM-dd"),
                    status = "Active",
                    fileName = d.FileName,
                    filePath = d.FilePath,
                    fileId = d.FileId
                }).ToList(),
                supersededFiles = supersededFiles.Select(d => new
                {
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

        public ActionResult DownloadFile(int InspectorId, int? FileID, bool backupFile)
        {
            if (!IsSuperAdmin() && !HasPermission(ScnFetMapId.EnquiryEdit))
                return View("UnAuthorized");

            int userId = CurrentUser.UserId;
            bool isSuperAdmin = IsSuperAdmin();

            var fileInfo = objInspectorsBusinessModel
                .GetInspectorFileDetailsByID(
                    _inspectorsService, InspectorId, FileID, backupFile);

            if (fileInfo == null || string.IsNullOrEmpty(fileInfo.FileName))
                return HttpNotFound("File not found.");

            // Non-superadmin can download only their own files
            if (!isSuperAdmin && fileInfo.CreatedBy != userId)
            {
                ViewBag.Message = "You are not authorized to download this document.";
                return View("UnauthorizedDownload");
            }

            string basePath = backupFile
                ? ConfigurationManager.AppSettings["InspectorDataBackUpPath"]
                : ConfigurationManager.AppSettings["InspectorDataUploadPath"];

            string fullPath = Path.Combine(basePath, fileInfo.FileName);

            if (!System.IO.File.Exists(fullPath))
                return HttpNotFound("File does not exist on the server.");

            byte[] fileData = System.IO.File.ReadAllBytes(fullPath);
            string contentType = MimeMapping.GetMimeMapping(fileInfo.FileName);

            return File(fileData, contentType, fileInfo.FileName);
        }

        [HttpPost]
        public JsonResult DeleteInspector(int inspectorId, string remarks)
        {
            if (!IsSuperAdmin() && !HasPermission(ScnFetMapId.DataDelete))
                return Json(new { success = false, message = "Unauthorized" });

            //bool hasDeletePermission = CurrentUser.RoleId.Any(roleId =>
            //    SingletonScreenFeatureMapping.CanPerformOperation(
            //        (int)ScnFetMapId.DataDelete, roleId));

            //// Superadmin OR user with delete permission
            //if (!isSuperAdmin && !hasDeletePermission)
            //{
            //    return Json(new { success = false, message = "Unauthorized" });
            //}

            try
            {
                bool deleted = objInspectorsBusinessModel
                    .DeleteInspector(inspectorId, remarks, CurrentUser.UserId, _inspectorsService);

                if (deleted)
                    return Json(new { success = true });

                return Json(new { success = false, message = "Record already inactivated." });
            }
            catch (Exception)
            {
                // log exception
                return Json(new
                {
                    success = false,
                    message = "Unable to delete inspector. Please try again later."
                });
            }
        }

    }
}