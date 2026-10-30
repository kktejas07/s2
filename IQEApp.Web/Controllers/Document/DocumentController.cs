using IQEApp.Service.DocumentService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.DocumentViewModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Transactions;
using System.Web;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Document
{
    public class DocumentController : BaseController
    {
        private readonly IDocumentService _documentService;
        DocumentBusinessModel objDocumentBusinessModel = new DocumentBusinessModel();
        public DocumentController()
        {
            _documentService = new DocumentService();
        }
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.QMSDocuments, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<DocumentViewModel> DocList = new List<DocumentViewModel>();
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                try
                {
                    DocList = objDocumentBusinessModel.GetDocumentsListBySiteId(CurrentUser.SiteId, "", "", 0, defaultFetchCount, true, "ASC", "0", _documentService);
                    if (DocList.Count > 0)
                    {
                        ViewBag.Total = DocList.FirstOrDefault().Total;
                        ViewBag.CurrentPageCount = defaultFetchCount;
                        ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
                    }
                    else
                    {
                        ViewBag.Total = 0;
                        ViewBag.CurrentPageCount = 0;
                    }
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Get documents list by site id page load", ex);
                }
                return View("DocumentDetails", DocList);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }
        public ActionResult GetDocumentsListBySiteId(int pageCount = 0, string strSearch = "", string alphaSearch = "", bool activeStatus = true, string sortingOrder = "ASC", string level="0")
        {
            List<DocumentViewModel> DocList = new List<DocumentViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            try
            {
                DocList = objDocumentBusinessModel.GetDocumentsListBySiteId(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, sortingOrder, level, _documentService);
                if (DocList.Count > 0)
                {
                    ViewBag.Total = DocList.FirstOrDefault().Total;
                    pageCount += defaultFetchCount;
                    ViewBag.CurrentPageCount = pageCount;
                }
                else
                {
                    ViewBag.Total = 0;
                    ViewBag.CurrentPageCount = 0;
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Get documents list by site id", ex);
            }
            return PartialView("_documentDirectory", DocList);

        }
        [HttpGet]
        public JsonResult GetDocumentRevisions1(int documentId)
        {
            var revisions = objDocumentBusinessModel.GetDocumentDetailsToEdit(documentId, CurrentUser.SiteId, _documentService);
            //var revisions = revisions                .Select(d => new
            //    {
            //        documentName = d.DocumentName,
            //        revisionNumber = d.RevisionNo,
            //        revisionDate = d.RevisionDate?.ToString("yyyy-MM-dd"),
            //        status = d.IsSuperceded ? "Superceded" : "Active",
            //        remarks = d.Remarks
            //    }).ToList();

            return Json(revisions, JsonRequestBehavior.AllowGet);
        }

        public JsonResult GetDocumentRevisions(int documentId)
        {
            var documentDetails = objDocumentBusinessModel.GetDocumentDetailsToEdit(documentId, CurrentUser.SiteId, _documentService);

            if (documentDetails == null)
            {
                return Json(new { error = "No document found." }, JsonRequestBehavior.AllowGet);
            }

            // Get the latest revision (from main object)
            var latestRevision = documentDetails;

            // Get older revisions (from lstDocumentViewModels)
            var oldRevisions = documentDetails.lstDocumentViewModels.OrderByDescending(d => d.RevisionNo).ToList();

            var result = new
            {
                latest = new
                {
                    documentName = latestRevision.DocumentName,
                    revisionNumber = latestRevision.RevisionNo,
                    revisionDate = latestRevision.RevisionDate?.ToString("yyyy-MM-dd"),
                    status = "Active",
                    fileName = latestRevision.FileName,
                    filePath = latestRevision.FilePath
                },
                oldRevisions = oldRevisions.Select(d => new
                {
                    documentName = d.DocumentName,
                    revisionNumber = d.RevisionNo,
                    revisionDate = d.CreatedDate?.ToString("yyyy-MM-dd"),
                    status = "Superseded",
                    fileName = d.FileName,
                    filePath = d.FilePath
                }).ToList()
            };

            return Json(result, JsonRequestBehavior.AllowGet);
        }


        public ActionResult AddDocument()
        {
            DocumentViewModel objDocumentViewModel = new DocumentViewModel();

            objDocumentViewModel = objDocumentBusinessModel.GetDocumentDetailsToAdd(CurrentUser.SiteId, _documentService);
            objDocumentViewModel.SiteId = CurrentUser.SiteId;
            return PartialView("_AddDocument", objDocumentViewModel);
        }
       
        [HttpPost]
        public ActionResult CreateDocument(DocumentViewModel model)
        {

            var isfileSuccess = false;
            var msg = "";
            var DocId = 0;
            model.SiteId = CurrentUser.SiteId;
            model.LoginUserId = CurrentUser.UserId;
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.DocumentCreate, CurrentUser.RoleId.FirstOrDefault()))
            {
                var isSuccess = false;

                try
                {
                    // Perform validation checks before starting the transaction
                    var fileErrors = ValidateFiles(model.UploadFile);
                    if (fileErrors.Any())
                    {
                        return Json(new { status = false, message = string.Join(", ", fileErrors), ServiceOrderId = 0 }, JsonRequestBehavior.AllowGet);
                    }

                    //
                    using (TransactionScope transcope = new TransactionScope())
                    {
                        try
                            {
                            // Save the new service order to the database
                            DocId= objDocumentBusinessModel.SaveDocumentDetails(model, _documentService);

                                if (DocId>0 && model.UploadFile != null)
                                {
                                    var flag = false;
                                    foreach (var file in model.UploadFile)
                                    {
                                        if (file.ContentLength > 0)
                                        {
                                            var fileName = Path.GetFileName(file.FileName);
                                            var filePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["DocumentsUploadPath"], file.FileName));

                                            // Set the model properties for the file
                                            model.FileName = fileName;
                                            model.FilePath = filePath;
                                            model.DocumentId = DocId;
                                            //model.RevisionNo=
                                            // Save the file to the disk
                                            file.SaveAs(filePath);

                                            // Save the file record in the database
                                            isfileSuccess = objDocumentBusinessModel.DocumentUploadedByDocId(model, flag, _documentService);
                                            flag = true;
                                        }
                                    }
                                }

                                // Complete the transaction
                                transcope.Complete();
                                isSuccess = true;
                            }
                            catch (TransactionException ex)
                            {
                                transcope.Dispose();
                                isSuccess = false;
                                msg = "An error occurred while saving the Documents.";
                                errorLogObj.LogError("Unable to save Documents", ex);
                            }
                    }
                    
                }
                catch (Exception ex)
                {
                    isSuccess = false;
                    msg = "An error occurred while processing the request.";
                    errorLogObj.LogError("Unable to create Documents", ex);
                }


            return Json(new { status = isSuccess, categoryId=model.CategoryId, message = "error" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return View("UnAuthorized");
            }
        }

        private List<string> ValidateFiles(HttpPostedFileBase[] files)
        {
            var errors = new List<string>();

            if (files != null && files.Length > 0)
            {
                foreach (var file in files)
                {
                    if (file.ContentLength > 0)
                    {
                        var fileName = Path.GetFileName(file.FileName);
                        var filePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["DocumentsUploadPath"], file.FileName));

                        if (System.IO.File.Exists(filePath))
                        {
                            errors.Add($"The doc '{fileName}' already exists. Please rename and upload again.");
                        }
                    }
                }
            }

            return errors;
        }
        public ActionResult EditDocument(int documentId)
        {
            DocumentViewModel objDocumentViewModel = new DocumentViewModel();

            objDocumentViewModel = objDocumentBusinessModel.GetDocumentDetailsToEdit(documentId, CurrentUser.SiteId, _documentService);
            objDocumentViewModel.SiteId = CurrentUser.SiteId;
            return PartialView("_EditDocument", objDocumentViewModel);
        }

        [HttpPost]
        public ActionResult UpdateDocument(DocumentViewModel objDVM)
        {
            if (!SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.DocumentsEdit, CurrentUser.RoleId.FirstOrDefault()))
            {
                return View("UnAuthorized");
            }

            var isSuccess = false;
            try
            {
                objDVM.SiteId = CurrentUser.SiteId;
                objDVM.LoginUserId = CurrentUser.UserId;

                // Update document data first, regardless of file upload
                using (var tranScope = new TransactionScope())
                {
                    int docId = objDocumentBusinessModel.UpdateDocumentsByDocId(objDVM, _documentService);
                    if (docId > 0)
                    {
                        isSuccess = true;

                        // Only handle file upload if files are provided
                        if (objDVM.UploadFile != null && objDVM.UploadFile.Any())
                        {
                            BackupExistingFiles(objDVM);

                            bool isFirstFile = true;
                            foreach (var file in objDVM.UploadFile)
                            {
                                if (file.ContentLength > 0)
                                {
                                    objDVM.FileName = Path.GetFileName(file.FileName);
                                    objDVM.FilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["DocumentsUploadPath"], file.FileName));

                                    var isFileSuccess = objDocumentBusinessModel.DocumentUploadedByDocId(objDVM, isFirstFile, _documentService);
                                    if (isFileSuccess)
                                    {
                                        file.SaveAs(objDVM.FilePath);
                                    }
                                    isFirstFile = false;
                                }
                            }
                        }

                        tranScope.Complete();
                    }
                }

                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            catch (TransactionException ex)
            {
                errorLogObj.LogError($"Transaction error occurred while updating document: {ex}", ex);
                return Json(new { status = isSuccess, message = "Transaction error occurred" }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError($"Error occurred while updating document: {ex}", ex);
                return Json(new { status = isSuccess, message = "An error occurred" }, JsonRequestBehavior.AllowGet);
            }
        }

        private void BackupExistingFiles(DocumentViewModel objDVM)
        {
            var lastRevisionNo = objDocumentBusinessModel.GetLastRevisionNo(objDVM.DocumentId,  _documentService);
            var backupFiles = objDocumentBusinessModel.DocumentsBackupFilesByDocId(objDVM.DocumentId, _documentService);

            foreach (var file in backupFiles)
            {
                if (!string.IsNullOrEmpty(file.FileName))
                {
                    string filePath = Path.Combine(ConfigurationManager.AppSettings["DocumentsUploadPath"], file.FileName);
                    string backupPath = ConfigurationManager.AppSettings["DocumentsUploadBackupPath"];

                    if (!Directory.Exists(backupPath))
                    {
                        Directory.CreateDirectory(backupPath);
                    }

                    string fileNameWithoutExt = Path.GetFileNameWithoutExtension(file.FileName);
                    string fileExt = Path.GetExtension(file.FileName);
                    //int revisionNo = GetNextRevisionNumber(objDVM.DocumentId); // Get next available revision number
                    string newFileName = $"{fileNameWithoutExt}_{DateTime.Now:yyyyMMdd}_{lastRevisionNo}{fileExt}";
                    string newFilePath = Path.Combine(backupPath, newFileName);

                    var fileInfo = new FileInfo(filePath);
                    if (fileInfo.Exists)
                    {
                        fileInfo.MoveTo(newFilePath);

                        // Update database with new filename
                        objDocumentBusinessModel.UpdateBackupFileName(objDVM.DocumentId, newFileName, newFilePath, _documentService);
                    }
                }
            }
        }



        [Authorize]
        public ActionResult DownloadFile(int documentID, string fileName, bool backupFile)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.CustomerComplaintCreate, CurrentUser.RoleId.FirstOrDefault()))
            {
                DocumentViewModel objDocumentViewModel = new DocumentViewModel();

                objDocumentViewModel = objDocumentBusinessModel.GetDocumnetFilesByID(documentID, fileName, backupFile, CurrentUser.SiteId, _documentService);
                if (!string.IsNullOrEmpty(objDocumentViewModel.FileName))
                {
                    string DownloadFileName = System.IO.Path.GetFileName(objDocumentViewModel.FilePath);
                    var DownloadFileData = System.IO.File.ReadAllBytes(objDocumentViewModel.FilePath);


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

    }

}
