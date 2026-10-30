using IQEApp.Service.ClientService;
using IQEApp.Service.ServiceOrder;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.ServiceOrderModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.IO;
using System.Transactions;
using IQEApp.Web.Models.EnquiryModel;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Service.ControlNumberService;
using System.Runtime.Remoting.Metadata.W3cXsd2001;
using DocumentFormat.OpenXml.EMMA;

namespace IQEApp.Web.Controllers.ServiceOrder
{
    //  [CustomAuthorize(Roles = "Super Admin Role, Admin Role, Coordinator Role")]
    public class ServiceOrderController : BaseController
    {
        private readonly IServiceOrderService _serviceOrderService;
        private readonly IClientService _clientService;
        private readonly IControlNumberService _controlNumberService;

        ServiceOrderBusinessModel objBusinessModel = new ServiceOrderBusinessModel();
        ClientBusinessModel objClientBusinessModel = new ClientBusinessModel();
        ControlNumberBusinessModel objControlNumberBusinessModel = new ControlNumberBusinessModel();
        public ServiceOrderController()
        {
            _serviceOrderService = new ServiceOrderService();
            _clientService = new ClientService();
            _controlNumberService = new ControlNumberService();
        }
        //
        // GET: /ServiceOrder/
        public ActionResult ServiceOrders()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.SalesServiceOrder, CurrentUser.RoleId.FirstOrDefault()))
            {
                DirectorySearchQueryModel model = new DirectorySearchQueryModel();
                model.SiteId = CurrentUser.SiteId;
                List<ServiceOrderViewModel> objList = new List<ServiceOrderViewModel>();
                try
                {
                    objList = objBusinessModel.GetServiceOrdersBySite(model, _serviceOrderService);
                    ViewBag.Total = objList.Count > 0 ? objList.FirstOrDefault().Total : 0;
                    model.PageCount += model.FetchCount;
                    ViewBag.CurrentPageCount = model.PageCount;
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error while loading service orders", ex);
                }
                return View("ServiceOrderDetails", objList);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        public ActionResult GetServiceOrders(DirectorySearchQueryModel model)
        {
            List<ServiceOrderViewModel> objList = new List<ServiceOrderViewModel>();
            model.SiteId = CurrentUser.SiteId;
            if (string.IsNullOrEmpty(model.StrSearch))
                model.StrSearch = "";
            if (string.IsNullOrEmpty(model.AlphaSearch))
                model.AlphaSearch = "";

            try
            {
                objList = objBusinessModel.GetServiceOrdersBySite(model, _serviceOrderService);
                ViewBag.Total = objList.Count > 0 ? objList.FirstOrDefault().Total : 0;
                model.PageCount += model.FetchCount;
                ViewBag.CurrentPageCount = model.PageCount;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Add Client", ex);
            }

            return PartialView("_ServiceOrdersList", objList);
        }

        public ActionResult CreateServiceOrder()
        {
            ServiceOrderDetailsModel model = new ServiceOrderDetailsModel();
            model = objBusinessModel.GetServiceOrderDetailsToAdd(CurrentUser.SiteId, _serviceOrderService);
            model.LstClientUnits = new List<ClientUnitsViewModel>();
            model.LstPONumbers = new List<PurchaseOrderViewModel>();
            model.LstManufacturerUnits = new List<ManufacturerUnitsViewModel>();
            return PartialView("_CreateServiceOrder", model);
        }
        public ActionResult CreateServiceOrder1(int clientId,string clientName, int enquiryID)
        {
            ServiceOrderDetailsModel model = new ServiceOrderDetailsModel();
            model = objBusinessModel.GetServiceOrderDetailsToAdd(CurrentUser.SiteId, _serviceOrderService);
            model.LstClientUnits = new List<ClientUnitsViewModel>();
            model.LstPONumbers = new List<PurchaseOrderViewModel>();
            model.LstManufacturerUnits = new List<ManufacturerUnitsViewModel>();
            //model.LstCurrencyType = new List<CommonModel.CurrencyTypeModel>();

            model.ClientId = clientId;
           // model.EnquiryIdRefernce = enquiryID;
            model.ClientName = ViewBag.ClientName= Request.QueryString[1];
            model.EID = enquiryID;// Convert.ToInt32(Request.QueryString[2]);
            return View("CreateServiceOrder", model);
        }

        public ActionResult AddServiceOrderCNo(int clientId, string clientName, int controlId, string controlNo, int EID)
        {
            ServiceOrderDetailsModel model = new ServiceOrderDetailsModel();
            model = objBusinessModel.GetServiceOrderDetailsToAdd(CurrentUser.SiteId, _serviceOrderService);
            model.LstClientUnits = new List<ClientUnitsViewModel>();
            model.LstPONumbers = new List<PurchaseOrderViewModel>();
           // model.LstManufacturerUnits = new List<ManufacturerUnitsViewModel>();
            model.ClientId = clientId;
            // model.EnquiryIdRefernce = enquiryID;
            model.ClientName = ViewBag.ClientName = clientName;
            model.ControlId = ViewBag.ControlId = controlId;// Request.QueryString[1];
            model.ControlNo = ViewBag.ControlNo = controlNo;// Request.QueryString[1];
            model.EID = EID;// Convert.ToInt32(Request.QueryString[2]);
            return View("AddServiceOrderCNo", model);
        }
        public ActionResult GetClientUnitsByClientId(int clientId)
        {
            var clientUnits = objClientBusinessModel.GetClientUnitsByClientId(clientId, 0, -1, _clientService);
            return Json(clientUnits, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetPODetailsByClientUnitId(int clientUnitId, int manufacturerUnitId)
        {
            var purchaseOrdersList = objBusinessModel.GetPODetailsByClientUnitId(clientUnitId, CurrentUser.SiteId, manufacturerUnitId.ToString(), _serviceOrderService);
            return Json(purchaseOrdersList, JsonRequestBehavior.AllowGet);
        }
        public ActionResult GetPODetailsByClientUnitIdAndMU(int clientUnitId, string manufacturerUnitIds)
        {
            var purchaseOrdersList = objBusinessModel.GetPODetailsByClientUnitId(clientUnitId, CurrentUser.SiteId, manufacturerUnitIds, _serviceOrderService);
            return PartialView("_PurchaseOrderListForServiceOrder", purchaseOrdersList);
            //return Json(purchaseOrdersList, JsonRequestBehavior.AllowGet);
        }
        public ActionResult SaveServiceOrder(ServiceOrderViewModel model, List<HttpPostedFileBase> files)
        {
            var isSuccess = false;
            var isfileSuccess = false;
            var msg = "";
            var SOId = 0;
            model.SiteId = CurrentUser.SiteId;
            model.LoginUserId = CurrentUser.UserId;

            try
            {
                // Perform validation checks before starting the transaction
                var fileErrors = ValidateFiles(model.UploadFile);
                if (fileErrors.Any())
                {
                    return Json(new { status = false, message = string.Join(", ", fileErrors), ServiceOrderId = 0 }, JsonRequestBehavior.AllowGet);
                }

                // Check if the service order already exists
                if (!_serviceOrderService.IsServiceOrderExistsAlready(model.SOId, model.SONumber, CurrentUser.SiteId))
                {
                    using (TransactionScope transcope = new TransactionScope())
                    {
                        try
                        {
                            // Save the new service order to the database
                            SOId = objBusinessModel.SaveNewServiceOrder(model, _serviceOrderService);

                            if (SOId > 0 && model.UploadFile != null)
                            {
                                var flag = false;
                                foreach (var file in model.UploadFile)
                                {
                                    if (file.ContentLength > 0)
                                    {
                                        var fileName = Path.GetFileName(file.FileName);
                                        var filePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], file.FileName));
               
                                        // Set the model properties for the file
                                        model.FileName = fileName;
                                        model.FilePath = filePath;
                                        model.SOId = SOId;

                                        // Save the file to the disk
                                        file.SaveAs(filePath);

                                        // Save the file record in the database
                                        isfileSuccess = objBusinessModel.ServiceOrderUploadedFilesBySOID(model, flag, _serviceOrderService);
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
                            msg = "An error occurred while saving the service order.";
                            errorLogObj.LogError("Unable to save service order", ex);
                        }
                    }
                }
                else
                {
                    isSuccess = false;
                    msg = "The service order already exists.";
                }
            }
            catch (Exception ex)
            {
                isSuccess = false;
                msg = "An error occurred while processing the request.";
                errorLogObj.LogError("Unable to create service order", ex);
            }

            return Json(new { status = isSuccess, message = msg, ServiceOrderId = SOId }, JsonRequestBehavior.AllowGet);
        }

        // Validation method to check for duplicate files or other errors
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
                        var filePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], file.FileName));

                        //var uploadDirectory = Server.MapPath(ConfigurationManager.AppSettings["ServiceOrderUploadPath"]);
                        //var filePath = Path.Combine(uploadDirectory, fileName);

                        //var filePath = Url.Content(Path.Combine(Server.MapPath(ConfigurationManager.AppSettings["ServiceOrderUploadPath"]), fileName));

                        // Check if the file already exists
                        if (System.IO.File.Exists(filePath))
                        {
                            errors.Add($"The doc '{fileName}' already exists.");
                        }
                    }
                }
            }

            return errors;
        }

        public ActionResult SaveServiceOrderCNo(ServiceOrderViewModel model, List<HttpPostedFileBase> files)
        {
            var isSuccess = false;
            var isfileSuccess = false;
            var msg = "";
            var SOId = 0;
            model.SiteId = CurrentUser.SiteId;
            model.LoginUserId = CurrentUser.UserId;

            try
            {
                // Perform validation checks before starting the transaction
                var fileErrors = ValidateFiles(model.UploadFile);
                if (fileErrors.Any())
                {
                    return Json(new { status = false, message = string.Join(", ", fileErrors), ServiceOrderId = 0 }, JsonRequestBehavior.AllowGet);
                }

                // Check if the service order already exists
                if (!_serviceOrderService.IsServiceOrderExistsAlready(model.SOId, model.SONumber, CurrentUser.SiteId))
                {
                    using (TransactionScope transcope = new TransactionScope())
                    {
                        try
                        {
                            // Save the new service order to the database
                            SOId = objBusinessModel.SaveServiceOrderCNo(model, _serviceOrderService);

                            if (SOId > 0 && model.UploadFile != null)
                            {
                                var flag = false;
                                foreach (var file in model.UploadFile)
                                {
                                    if (file.ContentLength > 0)
                                    {
                                        var fileName = Path.GetFileName(file.FileName);
                                        var filePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], file.FileName));

                                        // Set the model properties for the file
                                        model.FileName = fileName;
                                        model.FilePath = filePath;
                                        model.SOId = SOId;

                                        // Save the file to the disk
                                        file.SaveAs(filePath);

                                        // Save the file record in the database
                                        isfileSuccess = objBusinessModel.ServiceOrderUploadedFilesBySOID(model, flag, _serviceOrderService);
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
                            msg = "An error occurred while saving the service order.";
                            errorLogObj.LogError("Unable to save service order", ex);
                        }
                    }
                }
                else
                {
                    isSuccess = false;
                    msg = "The service order already exists.";
                }
            }
            catch (Exception ex)
            {
                isSuccess = false;
                msg = "An error occurred while processing the request.";
                errorLogObj.LogError("Unable to create service order", ex);
            }

            return Json(new { status = isSuccess, message = msg, ServiceOrderId = SOId }, JsonRequestBehavior.AllowGet);
        }
        public ActionResult SaveServiceOrderCNo1(ServiceOrderViewModel model, List<HttpPostedFileBase> files)
        {
            var isSuccess = false;
            var isfileSuccess = false;
            var msg = "";
            var SOId = 0;
            model.SiteId = CurrentUser.SiteId;
            model.LoginUserId = CurrentUser.UserId;
            try
            {
                if (!_serviceOrderService.IsServiceOrderExistsAlready(model.SOId, model.SONumber, CurrentUser.SiteId))
                {
                    using (TransactionScope Transcope = new TransactionScope())
                    {
                        try
                        {
                            SOId = objBusinessModel.SaveServiceOrderCNo(model, _serviceOrderService);

                            if (SOId > 0 && model.UploadFile != null)
                            {
                                foreach (var file in model.UploadFile)
                                {
                                    var Flag = false;
                                    if (file.ContentLength > 0)
                                    {
                                        model.FileName = Path.GetFileName(file.FileName);
                                        model.FilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], file.FileName));
                                        model.SOId = SOId;
                                        // var path = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], file.FileName));
                                        //Path.Combine(Server.MapPath(ConfigurationManager.AppSettings["EnquiryUploadPath"]), fileName);
                                        isfileSuccess = objBusinessModel.ServiceOrderUploadedFilesBySOID(model, Flag, _serviceOrderService);
                                        Flag = true;
                                        if (isfileSuccess)
                                            file.SaveAs(model.FilePath);
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


                    //if (model.UploadFile != null)
                    //{
                    //    model.FileName = model.UploadFile.FileName;
                    //    model.FilePath = Url.Content(System.IO.Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], model.UploadFile.FileName));
                    //   // model.UploadFile.SaveAs(ConfigurationManager.AppSettings["ServiceOrderUploadPath"] + model.FileName);
                    //}

                    //if (model.UploadFile != null && SOId!= 0  )
                    //    model.UploadFile.SaveAs(ConfigurationManager.AppSettings["ServiceOrderUploadPath"] + model.FileName);
                    isSuccess = true;
                }
                else
                {
                    isSuccess = false;
                    msg = "duplicate";
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Unable to create service order", ex);
            }
            return Json(new { status = isSuccess, message = msg, ServiceOrderId = SOId }, JsonRequestBehavior.AllowGet);
        }

        //public ActionResult EditServiceOrder1(string ControlNo, int SOId)
        //{
        //    ServiceOrderDetailsModel model = new ServiceOrderDetailsModel();
        //    model = objBusinessModel.GetServiceOrderDetailsToEdit(serviceOrderGuid, CurrentUser.SiteId, _serviceOrderService);
        //    //model.LstClientUnits = new List<ClientUnitsViewModel>();
        //    return PartialView("_UpdateServiceOrder", model);
        //}
        public ActionResult EditServiceOrder(Guid serviceOrderGuid,string controlNo)
        {
            ServiceOrderDetailsModel model = new ServiceOrderDetailsModel();
            model = objBusinessModel.GetServiceOrderDetailsToEdit(serviceOrderGuid, CurrentUser.SiteId, _serviceOrderService);
            //model.LstClientUnits = new List<ClientUnitsViewModel>();
            model.ControlNo = ViewBag.ControlNo = controlNo;
            model.ServiceOrderGuid = serviceOrderGuid;
            //model.CurrencyId = empDetails.FirstOrDefault().CurrencyId;
            return View("UpdateServiceOrder", model);
        }
        [HttpPost]
        public ActionResult UpdateFiles(HttpPostedFileBase[] newFiles, string deletedFiles)
        {
            // Handle file deletions
            if (!string.IsNullOrEmpty(deletedFiles))
            {
                var filesToDelete = deletedFiles.Split(',');
                foreach (var file in filesToDelete)
                {
                    // Logic to delete file from server or database
                   // DeleteFile(file);
                }
            }

            // Handle new file uploads
            if (newFiles != null && newFiles.Length > 0)
            {
                foreach (var file in newFiles)
                {
                    if (file != null && file.ContentLength > 0)
                    {
                        // Logic to save the file to the server or database
                      //  SaveFile(file);
                    }
                }
            }

            return RedirectToAction("Edit", new { id = 1 }); // Redirect back to the edit page
        }

        public ActionResult UpdateServiceOrder2(ServiceOrderViewModel model, List<HttpPostedFileBase> files, List<string> ExistingFiles, string RemovedFiles)
        {
            var isSuccess = false;
            var msg = "";
            var SOId = 0;
            model.SiteId = CurrentUser.SiteId;
            model.LoginUserId = CurrentUser.UserId;
            var isfileSuccess = false;

            try
            {
                if (!_serviceOrderService.IsServiceOrderExistsAlready(model.SOId, model.SONumber, CurrentUser.SiteId))
                {
                    using (TransactionScope Transcope = new TransactionScope())
                    {
                        try
                        {
                            // Backup old files (if needed)
                            List<ControlNumberViewModel> lstControlNumbersList = objControlNumberBusinessModel.GetServiceOrderFilesBackup(model.SOId, _controlNumberService);
                            BackupFiles(lstControlNumbersList);

                            isSuccess = objBusinessModel.UpdateServiceOrder(model, _serviceOrderService);

                            // Combine existing files and newly uploaded files
                            var allUploadedFiles = ExistingFiles ?? new List<string>();

                            // Process newly uploaded files
                            if (files != null && files.Count > 0)
                            {
                                foreach (var file in files)
                                {
                                    if (file.ContentLength > 0)
                                    {
                                        var newFileName = Path.GetFileName(file.FileName);
                                        var newFilePath = Path.Combine(Server.MapPath(ConfigurationManager.AppSettings["ServiceOrderUploadPath"]), newFileName);
                                        allUploadedFiles.Add(newFileName); // Add the file to the list
                                        file.SaveAs(newFilePath); // Save the new file
                                    }
                                }
                            }

                            // Remove files that the user deleted
                            if (!string.IsNullOrEmpty(RemovedFiles))
                            {
                                var filesToRemove = RemovedFiles.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                                foreach (var fileToRemove in filesToRemove)
                                {
                                    string filePath = Path.Combine(Server.MapPath(ConfigurationManager.AppSettings["ServiceOrderUploadPath"]), fileToRemove.Trim());
                                    if (System.IO.File.Exists(filePath))
                                    {
                                        System.IO.File.Delete(filePath); // Delete the file from the physical path
                                    }

                                    // Remove the file from the database
                                    model.FileName = fileToRemove.Trim();
                                    isfileSuccess = objBusinessModel.RemoveServiceOrderFileBySOID(model, _serviceOrderService);
                                }
                            }

                            // Save all uploaded files to the database
                            foreach (var uploadedFile in allUploadedFiles)
                            {
                                model.FileName = uploadedFile;
                                model.FilePath = Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], uploadedFile);
                                isfileSuccess = objBusinessModel.ServiceOrderUploadedFilesBySOID(model, true, _serviceOrderService);
                            }

                            Transcope.Complete();
                        }
                        catch (TransactionException ex)
                        {
                            Transcope.Dispose();
                        }
                    }

                    isSuccess = true;
                }
            }
            catch (Exception ex)
            {
                msg = "error";
                errorLogObj.LogError("Unable to Update Service Order", ex);
            }
            return Json(new { status = isSuccess, message = msg }, JsonRequestBehavior.AllowGet);
        }

        // Optional: Backup Files Logic
        private void BackupFiles(List<ControlNumberViewModel> lstControlNumbersList)
        {
            foreach (var backfile in lstControlNumbersList)
            {
                if (backfile.FileName != null)
                {
                    string oldPath = Path.Combine(Server.MapPath(ConfigurationManager.AppSettings["ServiceOrderUploadPath"]), backfile.FileName);
                    string newpath = ConfigurationManager.AppSettings["ServiceOrderBackFilePath"];
                    string newFileName = backfile.FileName;
                    string newFilePath = Path.Combine(newpath, newFileName);

                    FileInfo f1 = new FileInfo(oldPath);
                    if (f1.Exists)
                    {
                        if (!Directory.Exists(newpath))
                        {
                            Directory.CreateDirectory(newpath);
                        }
                        if (!System.IO.File.Exists(newFilePath))
                        {
                            f1.MoveTo(newFilePath);
                        }
                    }
                }
            }
        }

        public ActionResult UpdateServiceOrder(ServiceOrderViewModel model, List<HttpPostedFileBase> files, List<string> ExistingFiles, string RemovedFiles)
        {
            var isSuccess = false;
            var msg = "";
           // var SOId = 0;
            model.SiteId = CurrentUser.SiteId;
            model.LoginUserId = CurrentUser.UserId;
            var isfileSuccess = false;

            try
            {
                if (!_serviceOrderService.IsServiceOrderExistsAlready(model.SOId, model.SONumber, CurrentUser.SiteId))
                {
                    using (TransactionScope Transcope = new TransactionScope())
                    {
                        try
                        {
                            List<ControlNumberViewModel> lstControlNumbersList = new List<ControlNumberViewModel>();
                            lstControlNumbersList = objControlNumberBusinessModel.GetServiceOrderFilesBackup(model.SOId, _controlNumberService);

                            foreach (var backfile in lstControlNumbersList)
                            {
                                if (backfile.FileName != null)
                                {
                                    string oldPath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], backfile.FileName));
                                    string newpath = ConfigurationManager.AppSettings["ServiceOrderBackFilePath"];
                                    string newFileName = backfile.FileName;
                                    string newFilePath = Path.Combine(newpath, newFileName);
                                    FileInfo f1 = new FileInfo(oldPath);
                                    if (f1.Exists)
                                    {
                                        if (!Directory.Exists(newpath))
                                        {
                                            Directory.CreateDirectory(newpath);
                                        }
                                        if (!System.IO.File.Exists(newFilePath))
                                        {
                                            //f1.MoveTo(string.Format("{0}{1}{2}", newpath, newFileName, f1.Extension));
                                            f1.MoveTo(newFilePath);
                                        }

                                        //f1.MoveTo(string.Format("{0}{1}{2}", newpath, newFileName, f1.Extension));
                                    }
                                }
                            }

                            isSuccess = objBusinessModel.UpdateServiceOrder(model, _serviceOrderService);

                            // Prepare a list to hold all uploaded files (existing + new)
                            var allUploadedFiles = ExistingFiles ?? new List<string>();

                            // Process newly uploaded files
                            if (model.UploadFile != null && model.UploadFile.Length > 0)
                            {
                                foreach (var file in model.UploadFile)
                                {
                                    if (file.ContentLength > 0)
                                    {
                                        var newFileName = Path.GetFileName(file.FileName);
                                        var newFilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], newFileName));
                                        allUploadedFiles.Add(newFileName); // Add new file name to the list
                                        file.SaveAs(newFilePath); // Save the new file to the path
                                    }
                                }
                            }

                            // Remove files from the database and physical path
                            if (!string.IsNullOrEmpty(RemovedFiles))
                            {
                                var filesToRemove = RemovedFiles.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                                foreach (var fileToRemove in filesToRemove)
                                {
                                    // Remove from physical path
                                    string filePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], fileToRemove.Trim()));
                                    if (System.IO.File.Exists(filePath))
                                    {
                                        System.IO.File.Delete(filePath);
                                    }

                                    // Remove from the database
                                    model.FileName = fileToRemove.Trim();
                                    isfileSuccess = objBusinessModel.RemoveServiceOrderFileBySOID(model, _serviceOrderService);
                                }
                            }

                            // Save all uploaded files (including existing files) to the database
                            foreach (var uploadedFile in allUploadedFiles)
                            {
                                model.FileName = uploadedFile;
                                model.FilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], uploadedFile));
                                isfileSuccess = objBusinessModel.ServiceOrderUploadedFilesBySOID(model, true, _serviceOrderService);
                            }

                            Transcope.Complete();
                        }
                        catch (TransactionException)
                        {
                            Transcope.Dispose();
                        }
                    }

                    isSuccess = true;
                }
            }
            catch (Exception ex)
            {
                msg = "error";
                errorLogObj.LogError("Unable to Update Service Order", ex);
            }
            return Json(new { status = isSuccess, message = msg }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult UpdateServiceOrder1(ServiceOrderViewModel model, List<HttpPostedFileBase> files, List<string> ExistingFiles)
        {
            var isSuccess = false;
            var msg = "";
            var SOId = 0;
            model.SiteId = CurrentUser.SiteId;
            model.LoginUserId = CurrentUser.UserId;
            var isfileSuccess = false;

            try
            {
                if (!_serviceOrderService.IsServiceOrderExistsAlready(model.SOId, model.SONumber, CurrentUser.SiteId))
                {
                    using (TransactionScope Transcope = new TransactionScope())
                    {
                        try
                        {
                            List<ControlNumberViewModel> lstControlNumbersList = new List<ControlNumberViewModel>();
                            lstControlNumbersList = objControlNumberBusinessModel.GetServiceOrderFilesBackup(model.SOId, _controlNumberService);

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

                            isSuccess = objBusinessModel.UpdateServiceOrder(model, _serviceOrderService);

                            if (model.SOId > 0 && isSuccess)
                            {
                                // Combine existing uploaded files and newly uploaded files
                                var allUploadedFiles = ExistingFiles ?? new List<string>();

                                // Process newly uploaded files
                                if (model.UploadFile != null)
                                {
                                    foreach (var file in model.UploadFile)
                                    {
                                        if (file.ContentLength > 0)
                                        {
                                            var newFileName = Path.GetFileName(file.FileName);
                                            var newFilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], newFileName));
                                            allUploadedFiles.Add(newFileName); // Add new file name to the list
                                            isfileSuccess = objBusinessModel.ServiceOrderUploadedFilesBySOID(model, false, _serviceOrderService);
                                            file.SaveAs(newFilePath);
                                        }
                                    }
                                }

                                // Save all uploaded files to the database
                                foreach (var uploadedFile in allUploadedFiles)
                                {
                                    model.FileName = uploadedFile;
                                    model.FilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["ServiceOrderUploadPath"], uploadedFile));
                                    isfileSuccess = objBusinessModel.ServiceOrderUploadedFilesBySOID(model, true, _serviceOrderService);
                                }
                            }

                            Transcope.Complete();
                        }
                        catch (TransactionException ex)
                        {
                            Transcope.Dispose();
                        }
                    }

                    isSuccess = true;
                }
            }
            catch (Exception ex)
            {
                msg = "error";
                errorLogObj.LogError("Unable to Update Service Order", ex);
            }
            return Json(new { status = isSuccess, message = msg }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult UpdateServiceOrderStatus(Guid serviceOrderGuid, bool status)
        {
            var isSuccess = false;
            var msg = "";
            try
            {
                isSuccess = objBusinessModel.UpdateServiceOrderStatus(serviceOrderGuid, CurrentUser.UserId, status, _serviceOrderService);
                msg = "error";
            }
            catch (Exception ex)
            {
                msg = "error";
                errorLogObj.LogError("Unable to create service order", ex);
            }
            return Json(new { status = isSuccess, message = msg }, JsonRequestBehavior.AllowGet);
        }

    }
}