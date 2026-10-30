using IQEApp.Service.HomeService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.EnquiryModel;
using IQEApp.Web.Models.HomeModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Transactions;
using System.Web;
using System.Web.Mvc;
//using DocumentFormat.OpenXml.Drawing;

namespace IQEApp.Web.Controllers
{
    //[CustomAuthorize(Roles = "Super Admin Role, Admin Role, Technician Role, Coordinator Role, Quality Check Role, Finance Role")]
    public class HomeController : BaseController
    {
        private readonly IHomeService _homeService;
        HomeBusinessModel objHomeBusinessModel = new HomeBusinessModel();
        public HomeController()
        {
            _homeService = new HomeService();
        }

        public ActionResult HomePage()
        {
            CurrentUser.SetUserViewModuleType(UserViewModuleType.Home);
            ViewBag.CurrentPageCount = 10;

            if (CurrentUser.RoleId.FirstOrDefault() == (int)UserRoles.EmployeeRole)
            {
                // need to check this functionality later, for a moment kept the Same SP logic 'GetOpenCallsVisitsList1'. this is verify 'GetMyScheduledVisits_bkp'
                objHomeBusinessModel.GetMyScheduledVisits(1, CurrentUser.SiteId, CurrentUser.UserId, _homeService);
                return View("ScheduleVisitsList", objHomeBusinessModel);
            }
            else
            {
                objHomeBusinessModel.GetSelectDateScheduledVisitsList(CurrentUser.SiteId, DateTime.Today, "", "", 0, 1000, true, "ASC", _homeService);
                if (objHomeBusinessModel.LstHomeDetailViewModel.Count > 0)
                {
                    ViewBag.Total = objHomeBusinessModel.LstHomeDetailViewModel.FirstOrDefault().Total;
                    ViewBag.ProspectiveCount = objHomeBusinessModel.LstHomeDetailViewModel.FirstOrDefault().ProspectiveCount;
                }
                ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
                ViewBag.VisitType = "Active";
                return View("ScheduleVisitsList", objHomeBusinessModel);
            }
        }

        public ActionResult GetCancelledVisits(int VisitStatus)
        {
            var (homeList, prospectiveCount) = objHomeBusinessModel.GetCancelledVisits(CurrentUser.SiteId, DateTime.Today, "", "", 0, 1000, VisitStatus, "ASC", _homeService);

            objHomeBusinessModel.LstHomeDetailViewModel = homeList.ToList();

            if (objHomeBusinessModel.LstHomeDetailViewModel.Count > 0)
            {
                ViewBag.Total = objHomeBusinessModel.LstHomeDetailViewModel.First().Total;
            }

            // ProspectiveCount is now taken from tuple, NOT from list
            ViewBag.ProspectiveCount = prospectiveCount;
            if (VisitStatus == 11)
                ViewBag.VisitType = "Abortive";

            if (VisitStatus == 10)
                ViewBag.VisitType = "Cancelled";

            if (VisitStatus == 0)
                ViewBag.VisitType = "Inactive";
            ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();

            return PartialView("_ScheduleVisitList", objHomeBusinessModel);
        }


        public ActionResult GetProspectiveVisits(int VisitStatus)
        {
            objHomeBusinessModel.GetProspectiveVisits(CurrentUser.SiteId, DateTime.Today, "", "", 0, 1000, "ASC", _homeService);
            if (objHomeBusinessModel.LstHomeDetailViewModel.Count > 0)
            {
                ViewBag.Total = ViewBag.ProspectiveCount = objHomeBusinessModel.LstHomeDetailViewModel.FirstOrDefault().Total;
            }
            ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
            ViewBag.VisitType = "Prospective";
            return PartialView("_ScheduleVisitList", objHomeBusinessModel);
        }

        public ActionResult GetProspectiveAndSaveScheduleVisit(int VisitPId)
        {
            var VisitId = objHomeBusinessModel.GetProspectiveAndSaveScheduleVisit(VisitPId, CurrentUser.UserId, _homeService);
            if (VisitId > 0)
            {
                return Json(new { VisitId = VisitId, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new { VisitId = VisitId, message = "error" }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult GetSelDateScheduledVisitsList1(DateTime selDate)
        {
            objHomeBusinessModel.GetSelectDateScheduledVisitsList(CurrentUser.SiteId, selDate, "", "", 0, 10, true, "ASC", _homeService);
            return Json(objHomeBusinessModel.LstHomeDetailViewModel, JsonRequestBehavior.AllowGet);
        }

        public ActionResult UploadInspectionReport(int VisitId, string VisitSeqID, bool revised)
        {
            InspectionReportViewModel objInspectionReportViewModel = new InspectionReportViewModel();
            objInspectionReportViewModel = objHomeBusinessModel.UploadIRDocumentsToAdd_Edit(VisitId, CurrentUser.SiteId, revised, _homeService);
            return PartialView("_UploadInspectionReport", objInspectionReportViewModel);
        }

        [HttpPost]
        public ActionResult CloseVisitNoReport(HomeViewModel model)
        {
            if (model == null || model.VisitId <= 0)
                return Json(new { status = false, message = "Invalid visit" }, JsonRequestBehavior.AllowGet);

            try
            {
                model.ModifiedBy = CurrentUser.UserId;
                bool isSuccess = false;

                if (!string.IsNullOrWhiteSpace(model.ReferenceVisitSeqId))
                {
                    var result = objHomeBusinessModel.CloseVisitReferencingVisit(model, _homeService);
                    isSuccess = result.Success;
                    if (isSuccess)
                        return Json(new { status = true, message = result.Message ?? "Visit closed (no report) successfully" }, JsonRequestBehavior.AllowGet);
                    else
                        return Json(new { status = false, message = result.Message ?? "Failed to close visit" }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    model.VisitStatusId = 11;
                    var res = objHomeBusinessModel.OnHoldCancalledInspectionVisit(model, _homeService);
                    if (res)
                        return Json(new { status = true, message = "Visit closed (no report) successfully" }, JsonRequestBehavior.AllowGet);
                    else
                        return Json(new { status = false, message = "Failed to close visit" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("CloseVisitNoReport error", ex);
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> SubmitUploadInspectionReport1(InspectionReportViewModel objIRV)
        {
            if (objIRV == null)
                return Json(new { status = false, message = "Invalid input" }, JsonRequestBehavior.AllowGet);

            bool dbUpdateSuccess = false;
            var savedFiles = new List<(string FilePath, InspectionReportViewModel PayloadCopy)>();
            string filesRoot = ConfigurationManager.AppSettings["InspectionReportFilesPath"];
            string backupRoot = ConfigurationManager.AppSettings["InspectionReportFilesBackUpPath"];

            try
            {
                var lstInspectionReportModel = objHomeBusinessModel.GetInspectionReportBackupFiles(objIRV.VisitId, _homeService);
                if (lstInspectionReportModel != null && lstInspectionReportModel.Count > 0)
                {
                    if (!Directory.Exists(backupRoot))
                        Directory.CreateDirectory(backupRoot);

                    foreach (var backfile in lstInspectionReportModel)
                    {
                        if (!string.IsNullOrEmpty(backfile.FileName))
                        {
                            string oldPath = Path.Combine(filesRoot, backfile.FileName);
                            if (System.IO.File.Exists(oldPath))
                            {
                                string newFilePath = Path.Combine(backupRoot, backfile.FileName);
                                System.IO.File.Move(oldPath, newFilePath);
                            }
                        }
                    }
                }

                dbUpdateSuccess = objHomeBusinessModel.UpdateInspectionReportByVisitID(objIRV.VisitId, objIRV.InspReportDate, objIRV.LoginUserId, _homeService);
                if (!dbUpdateSuccess)
                    return Json(new { status = false, message = "Failed to update inspection report" }, JsonRequestBehavior.AllowGet);

                var saveTasks = new List<Task>();
                int maxParallelWrites = Math.Max(2, Environment.ProcessorCount);
                using (var throttle = new System.Threading.SemaphoreSlim(maxParallelWrites))
                {
                    foreach (var po in objIRV.LstPONumbers ?? new List<POInspectionItem>())
                    {
                        if (string.IsNullOrEmpty(po.InspReportNo))
                            continue;

                        if (objHomeBusinessModel.IsInspReportNumberExitsAlready(po.InspReportNo, _homeService))
                        {
                            return Json(new { status = false, message = $"Report No {po.InspReportNo} Exists Already" }, JsonRequestBehavior.AllowGet);
                        }

                        foreach (var file in po.UploadFiles ?? new List<HttpPostedFileBase>())
                        {
                            if (file == null || file.ContentLength <= 0)
                                continue;

                            await throttle.WaitAsync().ConfigureAwait(false);

                            var capturedPo = po;
                            var capturedFile = file;

                            var task = Task.Run(async () =>
                            {
                                try
                                {
                                    string originalFileName = Path.GetFileName(capturedFile.FileName);
                                    string uniqueFileName = $"{Guid.NewGuid():N}_{originalFileName}";
                                    string savePath = Path.Combine(filesRoot, uniqueFileName);

                                    var dir = Path.GetDirectoryName(savePath);
                                    if (!Directory.Exists(dir))
                                        Directory.CreateDirectory(dir);

                                    using (var destStream = new FileStream(savePath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true))
                                    {
                                        if (capturedFile.InputStream.CanSeek)
                                            capturedFile.InputStream.Position = 0;

                                        await capturedFile.InputStream.CopyToAsync(destStream).ConfigureAwait(false);
                                    }

                                    var payload = new InspectionReportViewModel
                                    {
                                        VisitId = objIRV.VisitId,
                                        FileName = originalFileName,
                                        FilePath = savePath,
                                        InspReportNo = capturedPo.InspReportNo,
                                        PONId = capturedPo.PONId,
                                        POItemId = capturedPo.POItemId,
                                        VisitedFrom = capturedPo.VisitedFrom,
                                        VisitedTo = capturedPo.VisitedTo,
                                        LoginUserId = objIRV.LoginUserId
                                    };

                                    lock (savedFiles)
                                    {
                                        savedFiles.Add((savePath, payload));
                                    }
                                }
                                finally
                                {
                                    throttle.Release();
                                }
                            });

                            saveTasks.Add(task);
                        }
                    }

                    await Task.WhenAll(saveTasks).ConfigureAwait(false);
                }

                bool anyFileUploaded = false;
                using (var transcope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
                {
                    bool flag = false;
                    foreach (var saved in savedFiles)
                    {
                        var payload = saved.PayloadCopy;
                        var tempObj = objIRV;
                        tempObj.FileName = payload.FileName;
                        tempObj.FilePath = payload.FilePath;
                        tempObj.InspReportNo = payload.InspReportNo;
                        tempObj.PONId = payload.PONId;
                        tempObj.POItemId = payload.POItemId;
                        tempObj.VisitedFrom = payload.VisitedFrom;
                        tempObj.VisitedTo = payload.VisitedTo;

                        bool fileUploaded = objHomeBusinessModel.UploadInspectionReportByVisitID(tempObj, flag, _homeService);
                        flag = true;
                        if (fileUploaded)
                            anyFileUploaded = true;
                        else
                            throw new Exception($"Failed to save DB record for file {payload.FileName}");
                    }

                    transcope.Complete();
                }

                return Json(new { status = true, message = "Inspection report uploaded successfully" }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                try
                {
                    foreach (var f in savedFiles)
                    {
                        if (!string.IsNullOrEmpty(f.FilePath) && System.IO.File.Exists(f.FilePath))
                        {
                            System.IO.File.Delete(f.FilePath);
                        }
                    }
                }
                catch { }

                return Json(new { status = false, message = $"Error: {ex.Message}" }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        [Authorize]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> SubmitUploadInspectionReport(InspectionReportViewModel objIRV)
        {
            // 0. Authentication and Authorization Check
            if (CurrentUser == null || CurrentUser.UserId <= 0)
                return Json(new { status = false, message = "Unauthorized" }, JsonRequestBehavior.AllowGet);

            int currentUserId = CurrentUser.UserId;
            int roleId = CurrentUser.RoleId.FirstOrDefault();
            bool hasPermission = CurrentUser.IsAdmin ||
                SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ScheduleVisitEdit, roleId) ||
                SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsScheduleVisit, roleId) ||
                roleId == (int)UserRoles.EmployeeRole;

            if (!hasPermission)
                return Json(new { status = false, message = "Unauthorized to modify or upload inspection reports" }, JsonRequestBehavior.AllowGet);

            if (objIRV == null || objIRV.VisitId <= 0)
                return Json(new { status = false, message = "Invalid input" }, JsonRequestBehavior.AllowGet);

            // Correct user attribution from authenticated CurrentUser
            objIRV.LoginUserId = currentUserId;
            objIRV.ModifiedBy = currentUserId;
            objIRV.CreatedBy = currentUserId;

            var poList = objIRV.LstPONumbers ?? new List<POInspectionItem>();

            // 1. Validate every submitted item before moving files, updating records, or starting parallel uploads
            foreach (var po in poList)
            {
                if (string.IsNullOrWhiteSpace(po.InspReportNo))
                    continue;

                if (objHomeBusinessModel.IsInspReportNumberExitsAlready(po.InspReportNo, _homeService))
                {
                    return Json(new
                    {
                        status = false,
                        message = $"Report No {po.InspReportNo} Exists Already"
                    }, JsonRequestBehavior.AllowGet);
                }
            }

            string filesRoot = ConfigurationManager.AppSettings["InspectionReportFilesPath"];
            string backupRoot = ConfigurationManager.AppSettings["InspectionReportFilesBackUpPath"];

            // Maintain separate lists for newly created files and moved existing files
            var newFilesToCleanup = new List<string>();
            var movedExistingFiles = new List<(string OriginalPath, string BackupPath)>();
            var recordsToSave = new List<InspectionReportViewModel>();

            void CleanupAndRestore()
            {
                // Delete only newly created and partially written files
                lock (newFilesToCleanup)
                {
                    foreach (var path in newFilesToCleanup)
                    {
                        try
                        {
                            if (System.IO.File.Exists(path))
                                System.IO.File.Delete(path);
                        }
                        catch { /* best-effort cleanup */ }
                    }
                }

                // Restore previously moved existing files back to their original physical paths
                foreach (var moved in movedExistingFiles)
                {
                    try
                    {
                        if (System.IO.File.Exists(moved.BackupPath))
                        {
                            if (System.IO.File.Exists(moved.OriginalPath))
                                System.IO.File.Delete(moved.OriginalPath);
                            System.IO.File.Move(moved.BackupPath, moved.OriginalPath);
                        }
                    }
                    catch { /* best-effort recovery */ }
                }
            }

            try
            {
                // 2. Retrieve trusted file metadata for existing files
                var existingDbFiles = objHomeBusinessModel.GetInspectionReportBackupFiles(objIRV.VisitId, _homeService)
                    ?? new List<InspectionReportViewModel>();

                // Build set of retained files across all POs
                // Retained files keep their display names separate from physical storage names
                var retainedPhysicalPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var po in poList)
                {
                    var existingFiles = po.ExistingFiles ?? new List<string>();
                    var removedFiles = string.IsNullOrEmpty(po.RemovedFiles)
                        ? new List<string>()
                        : po.RemovedFiles.Split(';').Select(x => x.Trim()).ToList();

                    var finalExistingFiles = existingFiles.Except(removedFiles, StringComparer.OrdinalIgnoreCase).ToList();

                    foreach (var displayName in finalExistingFiles)
                    {
                        // Match with trusted metadata from database
                        var matchedDbFile = existingDbFiles.FirstOrDefault(f =>
                            string.Equals(f.FileName, displayName, StringComparison.OrdinalIgnoreCase) &&
                            (f.POItemId == po.POItemId || f.PONId == po.PONId));

                        if (matchedDbFile == null)
                        {
                            matchedDbFile = existingDbFiles.FirstOrDefault(f =>
                                string.Equals(f.FileName, displayName, StringComparison.OrdinalIgnoreCase));
                        }

                        string actualStoredPath = null;
                        if (matchedDbFile != null && !string.IsNullOrWhiteSpace(matchedDbFile.FilePath))
                        {
                            actualStoredPath = matchedDbFile.FilePath;
                            if (!Path.IsPathRooted(actualStoredPath))
                                actualStoredPath = Path.Combine(filesRoot, actualStoredPath);
                        }
                        else
                        {
                            actualStoredPath = Path.Combine(filesRoot, displayName);
                        }

                        retainedPhysicalPaths.Add(actualStoredPath);

                        var payload = new InspectionReportViewModel
                        {
                            VisitId = objIRV.VisitId,
                            FileName = displayName, // Keep original display name
                            FilePath = actualStoredPath, // Use actual stored physical path
                            InspReportNo = po.InspReportNo,
                            PONId = po.PONId,
                            POItemId = po.POItemId,
                            VisitedFrom = po.VisitedFrom,
                            VisitedTo = po.VisitedTo,
                            LoginUserId = currentUserId,
                            ModifiedBy = currentUserId,
                            CreatedBy = currentUserId
                        };

                        recordsToSave.Add(payload);
                    }
                }

                // Move only non-retained existing files to backup
                if (existingDbFiles.Count > 0)
                {
                    if (!Directory.Exists(backupRoot))
                        Directory.CreateDirectory(backupRoot);

                    foreach (var backfile in existingDbFiles)
                    {
                        string originalPath = null;
                        if (!string.IsNullOrWhiteSpace(backfile.FilePath))
                        {
                            originalPath = backfile.FilePath;
                            if (!Path.IsPathRooted(originalPath))
                                originalPath = Path.Combine(filesRoot, originalPath);
                        }
                        else if (!string.IsNullOrWhiteSpace(backfile.FileName))
                        {
                            originalPath = Path.Combine(filesRoot, backfile.FileName);
                        }

                        if (!string.IsNullOrEmpty(originalPath) &&
                            !retainedPhysicalPaths.Contains(originalPath) &&
                            System.IO.File.Exists(originalPath))
                        {
                            string physicalFileName = Path.GetFileName(originalPath);
                            string backupPath = Path.Combine(backupRoot, physicalFileName);

                            System.IO.File.Move(originalPath, backupPath);
                            movedExistingFiles.Add((OriginalPath: originalPath, BackupPath: backupPath));
                        }
                    }
                }

                // 3. Save newly uploaded files with concurrency throttling and partial-file tracking
                var saveTasks = new List<Task>();
                int maxParallelWrites = Math.Max(2, Environment.ProcessorCount);

                using (var throttle = new System.Threading.SemaphoreSlim(maxParallelWrites))
                {
                    foreach (var po in poList)
                    {
                        foreach (var file in po.UploadFiles ?? new List<HttpPostedFileBase>())
                        {
                            if (file == null || file.ContentLength <= 0)
                                continue;

                            await throttle.WaitAsync().ConfigureAwait(false);

                            var capturedPo = po;
                            var capturedFile = file;

                            string originalFileName = Path.GetFileName(capturedFile.FileName);
                            string uniqueFileName = $"{Guid.NewGuid():N}_{originalFileName}";
                            string savePath = Path.Combine(filesRoot, uniqueFileName);

                            // Track new path before writing so partial files cannot escape cleanup
                            lock (newFilesToCleanup)
                            {
                                newFilesToCleanup.Add(savePath);
                            }

                            var task = Task.Run(async () =>
                            {
                                try
                                {
                                    if (!Directory.Exists(filesRoot))
                                        Directory.CreateDirectory(filesRoot);

                                    using (var fs = new FileStream(
                                        savePath,
                                        FileMode.Create,
                                        FileAccess.Write,
                                        FileShare.None,
                                        81920,
                                        true))
                                    {
                                        if (capturedFile.InputStream.CanSeek)
                                            capturedFile.InputStream.Position = 0;

                                        await capturedFile.InputStream.CopyToAsync(fs).ConfigureAwait(false);
                                    }

                                    var payload = new InspectionReportViewModel
                                    {
                                        VisitId = objIRV.VisitId,
                                        FileName = originalFileName, // Display name
                                        FilePath = savePath,         // Physical storage path
                                        InspReportNo = capturedPo.InspReportNo,
                                        PONId = capturedPo.PONId,
                                        POItemId = capturedPo.POItemId,
                                        VisitedFrom = capturedPo.VisitedFrom,
                                        VisitedTo = capturedPo.VisitedTo,
                                        LoginUserId = currentUserId,
                                        ModifiedBy = currentUserId,
                                        CreatedBy = currentUserId
                                    };

                                    lock (recordsToSave)
                                    {
                                        recordsToSave.Add(payload);
                                    }
                                }
                                catch (Exception)
                                {
                                    // Delete partial file inside write task failure handler
                                    try
                                    {
                                        if (System.IO.File.Exists(savePath))
                                            System.IO.File.Delete(savePath);
                                    }
                                    catch { }
                                    throw;
                                }
                                finally
                                {
                                    throttle.Release();
                                }
                            });

                            saveTasks.Add(task);
                        }
                    }

                    // Ensure all started write tasks complete before proceeding or cleaning up
                    await Task.WhenAll(saveTasks).ConfigureAwait(false);
                }

                // 4. Include header update AND file records inside the same TransactionScope
                using (var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
                {
                    bool headerUpdated = objHomeBusinessModel.UpdateInspectionReportByVisitID(
                        objIRV.VisitId,
                        objIRV.InspReportDate,
                        currentUserId,
                        _homeService);

                    if (!headerUpdated)
                        throw new Exception("Failed to update inspection report header details");

                    bool flag = false;
                    foreach (var p in recordsToSave)
                    {
                        objIRV.FileName = p.FileName;
                        objIRV.FilePath = p.FilePath;
                        objIRV.InspReportNo = p.InspReportNo;
                        objIRV.PONId = p.PONId;
                        objIRV.POItemId = p.POItemId;
                        objIRV.VisitedFrom = p.VisitedFrom;
                        objIRV.VisitedTo = p.VisitedTo;
                        objIRV.LoginUserId = currentUserId;
                        objIRV.ModifiedBy = currentUserId;
                        objIRV.CreatedBy = currentUserId;

                        bool uploaded = objHomeBusinessModel.UploadInspectionReportByVisitID(
                            objIRV, flag, _homeService);

                        if (!uploaded)
                            throw new Exception($"DB insert failed for {p.FileName}");

                        flag = true;
                    }

                    scope.Complete();
                }

                return Json(new { status = true, message = "Inspection report uploaded successfully" },
                            JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                // Single unified recovery path: delete only new files and restore moved files
                CleanupAndRestore();

                return Json(new { status = false, message = ex.Message },
                            JsonRequestBehavior.AllowGet);
            }
        }
        [HttpPost]
        public ActionResult SubmitUploadInspectionReport1(InspectionReportViewModel objIRV, List<HttpPostedFileBase> files)
        {
            var isSuccess = false;
            var isfileSuccess = false;

            return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult FetchMyScheduledVisits(int statusId)
        {
            objHomeBusinessModel.GetMyScheduledVisits(statusId, CurrentUser.SiteId, CurrentUser.UserId, _homeService);
            return PartialView("_ViewMySchedules", objHomeBusinessModel.LstHomeDetailViewModel);
        }

        [HttpPost]
        public ActionResult SubmitQualityCheckDateByVisitID(HomeViewModel objHDM)
        {
            var isSuccess = false;
            isSuccess = objHomeBusinessModel.SubmitQualityCheckDateByVisitID(objHDM, _homeService);

            if (isSuccess)
            {
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public ActionResult GetInspectionReportFiles(int VisitId)
        {
            var lstInspectionReportModel = objHomeBusinessModel.GetInspectionReportFiles(VisitId, _homeService);

            if (lstInspectionReportModel != null)
            {
                return Json(new
                {
                    status = true,
                    message = "Success",
                    data = lstInspectionReportModel
                }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new
                {
                    status = false,
                    message = "Failed to fetch Inspection Report files."
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [Authorize]
        public ActionResult DownloadFile(int VisitId, string FileName)
        {
            if (CurrentUser == null || CurrentUser.UserId <= 0)
            {
                return View("UnAuthorized");
            }

            int roleId = CurrentUser.RoleId.FirstOrDefault();
            bool canDownload = CurrentUser.IsAdmin ||
                SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.Download, roleId) ||
                SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ScheduleVisitEdit, roleId) ||
                SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsScheduleVisit, roleId) ||
                roleId == (int)UserRoles.EmployeeRole;

            if (canDownload)
            {
                HomeViewModel fileInfo = objHomeBusinessModel.GetFileDetailsByVisitId(VisitId, FileName, _homeService);
                if (fileInfo != null && !string.IsNullOrEmpty(fileInfo.FilePath) && System.IO.File.Exists(fileInfo.FilePath))
                {
                    string downloadFileName = !string.IsNullOrEmpty(fileInfo.FileName)
                        ? fileInfo.FileName
                        : System.IO.Path.GetFileName(fileInfo.FilePath);
                    var downloadFileData = System.IO.File.ReadAllBytes(fileInfo.FilePath);

                    Response.Clear();
                    Response.Buffer = true;
                    Response.Charset = "";
                    Response.Cache.SetCacheability(HttpCacheability.NoCache);
                    Response.ContentType = "application/octet-stream";
                    Response.AppendHeader("Content-Disposition", "attachment; filename=\"" + downloadFileName + "\"");
                    Response.BinaryWrite(downloadFileData);
                    Response.Flush();
                    Response.End();
                }
                else
                {
                    return HttpNotFound("File not found");
                }
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        [HttpPost]
        public ActionResult UpdateInspectionDateByVisitID(HomeViewModel objHDM)
        {
            var isSuccess = false;
            isSuccess = objHomeBusinessModel.UpdateInspectionDateByVisitID(objHDM, _homeService);

            if (isSuccess)
            {
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public ActionResult InActivateProspective(int VisitPId, bool status)
        {
            var isSuccess = false;
            try
            {
                if (status == false)
                {
                    var cId = objHomeBusinessModel.InActivateProspective(VisitPId, CurrentUser.UserId, _homeService);
                    isSuccess = true;
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while Inactivating Prospective", ex);
                isSuccess = false;
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult OnHoldCancalledInspectionVisit(HomeViewModel objHDM)
        {
            var isSuccess = false;
            isSuccess = objHomeBusinessModel.OnHoldCancalledInspectionVisit(objHDM, _homeService);

            if (isSuccess)
            {
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public ActionResult SubmitInspectorNameByVisitID(HomeViewModel objHDM)
        {
            var isSuccess = false;
            isSuccess = objHomeBusinessModel.SubmitInspectorNameByVisitID(objHDM, _homeService);

            if (isSuccess)
            {
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public ActionResult ReportSubmitToClientDateByVisitID(HomeViewModel objHDM)
        {
            var isSuccess = false;
            isSuccess = objHomeBusinessModel.ReportSubmitToClientDateByVisitID(objHDM, _homeService);

            if (isSuccess)
            {
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
            }

        }
        
        [HttpPost]
        public ActionResult UpdateCommentsByVisitID(HomeViewModel objHDM)
        {
            var isSuccess = false;
            isSuccess = objHomeBusinessModel.UpdateCommentsByVisitID(objHDM, _homeService);

            if (isSuccess)
            {
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public ActionResult UpdateCostValueByVisitID(HomeViewModel objHDM)
        {
            if (objHDM.ManufacturerId <= 0)
                return Json(new { status = false, totalCost = 0 });

            decimal totalCost = objHomeBusinessModel.UpdateCostValueByVisitID(objHDM, _homeService);

            return Json(new { status = true, totalCost = totalCost });

        }

        public ActionResult SortMyScheduleVisits(int statusId, string secName, string OrderBy)
        {
            objHomeBusinessModel.GetMyScheduledVisits(statusId, CurrentUser.SiteId, CurrentUser.UserId, _homeService);
            if ((OrderBy == "Asc") && (secName == "Date"))
                objHomeBusinessModel.LstHomeDetailViewModel = objHomeBusinessModel.LstHomeDetailViewModel.OrderBy(i => i.ScheduleDate).ToList();
            else if ((OrderBy == "Desc") && (secName == "Date"))
                objHomeBusinessModel.LstHomeDetailViewModel = objHomeBusinessModel.LstHomeDetailViewModel.OrderByDescending(i => i.ScheduleDate).ToList();
            else if ((OrderBy == "Asc") && (secName == "Status"))
                objHomeBusinessModel.LstHomeDetailViewModel = objHomeBusinessModel.LstHomeDetailViewModel.OrderBy(i => i.VisitStatusName).ToList();
            else if ((OrderBy == "Desc") && (secName == "Status"))
                objHomeBusinessModel.LstHomeDetailViewModel = objHomeBusinessModel.LstHomeDetailViewModel.OrderByDescending(i => i.VisitStatusName).ToList();
            return PartialView("_ViewMySchedules", objHomeBusinessModel.LstHomeDetailViewModel);
        }
    }
}