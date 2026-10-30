using IQEApp.Service.CustomerComplaintService;
using IQEApp.Service.SecurityService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.CustomerComplaintModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.CustomerComplaint
{
    public class CustomerComplaintController : BaseController
    {
        // GET: CustomerCompliance
        private readonly ICustomerComplaintService _customerComplaintService;
        private readonly ISecurityService _securityService;

        CustomerComplaintBusinessModel objCustomerComplaintBusinessModel = new CustomerComplaintBusinessModel();
        public CustomerComplaintController()
        {
            _customerComplaintService = new CustomerComplaintService();
            _securityService = new SecurityService();
        }
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.SalesCustomerComplaint, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<CustomerComplaintViewModel> list = new List<CustomerComplaintViewModel>();
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                try
                {
                    list = objCustomerComplaintBusinessModel.GetCustomerComplaintListBySiteId(CurrentUser.SiteId, "", "", 0, defaultFetchCount, true, "ASC","", _customerComplaintService);

                    if (list.Count > 0)
                    {
                        ViewBag.CurrentPageCount = defaultFetchCount;
                        ViewBag.Total = list.FirstOrDefault().Total;
                    }
                    else
                    {
                        ViewBag.Total = 0;
                        ViewBag.CurrentPageCount = 0;
                    }
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Get Enquiry list by site id", ex);
                }

                //  return View();
                return View("Index", list);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;

        }

        public ActionResult GetComplaintListBySiteId(int pageCount = 0, string strSearch = "", string alphaSearch = "", bool activeStatus = true, string sortingOrder = "ASC", string fiYear="")
        {
            List<CustomerComplaintViewModel> list = new List<CustomerComplaintViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            try
            {
                list = objCustomerComplaintBusinessModel.GetCustomerComplaintListBySiteId(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, sortingOrder, fiYear, _customerComplaintService);
                // (CurrentUser.SiteId, "", "", 0, 10, activeStatus, "ASC", _customerComplaintService);
                //return View("Index", list);
                if (list.Count > 0)
                {
                    ViewBag.Total = list.FirstOrDefault().Total;
                    pageCount += defaultFetchCount;
                    ViewBag.CurrentPageCount = pageCount;
                }
                else
                {
                    ViewBag.Total = 0;
                    ViewBag.CurrentPageCount = 0;
                }
               // ViewBag.Total = list.FirstOrDefault().Total;
                return PartialView("_CustomerComplaintDirectory", list);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("GetComplaintListBySiteId", ex);
            }
            return null;
        }

        public ActionResult AddComplaint()
        {
            CustomerComplaintViewModel objCCVM = new CustomerComplaintViewModel();
            objCCVM = objCustomerComplaintBusinessModel.GetComplaintDetailsToAdd(CurrentUser.SiteId, _customerComplaintService);
            return PartialView("_AddCustomerComplaint", objCCVM);
        }

        [HttpPost]
        public ActionResult CreateCustomerComplaint(CustomerComplaintViewModel objCCVM)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.CustomerComplaintCreate, CurrentUser.RoleId.FirstOrDefault()))
            {
                var isSuccess = false;
                try
                {

                    objCCVM.SiteId = CurrentUser.SiteId;
                    if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.CustomerComplaintCreate, CurrentUser.RoleId.FirstOrDefault()))
                    {
                        if (objCCVM.UploadFile != null)
                        {
                            objCCVM.FileName = objCCVM.UploadFile.FileName;
                            // objCCVM.FilePath = Url.Content(System.IO.Path.Combine("~/UploadedFiles/CustomerComplaintFiles/", objCCVM.UploadFile.FileName));
                            objCCVM.FilePath = Url.Content(System.IO.Path.Combine(ConfigurationManager.AppSettings["CustomerComplaintUploadPath"], objCCVM.UploadFile.FileName));
                        }

                        objCCVM.CreatedBy = CurrentUser.RoleId.FirstOrDefault();

                        var cId = objCustomerComplaintBusinessModel.SaveComplaintDetails(objCCVM, _customerComplaintService);
                        if (cId != null && objCCVM.UploadFile != null)
                        {
                            objCCVM.UploadFile.SaveAs(ConfigurationManager.AppSettings["CustomerComplaintUploadPath"] + objCCVM.FileName);
                        }
                        isSuccess = true;
                        return Json(new { status = isSuccess, message = "", complaintId = cId }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { status = isSuccess, message = "duplicate" }, JsonRequestBehavior.AllowGet);
                    }

                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while saving manufacturer " + ex, ex);
                    isSuccess = false;
                }
                return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return View("UnAuthorized");
            }
        }

        public ActionResult EditComplaint(string complaintId)
        {
            CustomerComplaintViewModel objCCVM = new CustomerComplaintViewModel();
            objCCVM = objCustomerComplaintBusinessModel.GetComplaintDetailsToEdit(complaintId, CurrentUser.SiteId, _customerComplaintService);
            return PartialView("_EditCustomerComplaint", objCCVM);
        }

        [HttpPost]
        public ActionResult UpdateCustomerComplaint(CustomerComplaintViewModel objCCVM)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.CustomerComplaintEdit, CurrentUser.RoleId.FirstOrDefault()))
            {

                var isSuccess = false;
                try
                {
                    objCCVM.SiteId = CurrentUser.SiteId;
                    objCCVM.CreatedBy = CurrentUser.UserId;
                    if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.CustomerComplaintEdit, CurrentUser.RoleId.FirstOrDefault()))
                    {
                        if (objCCVM.UploadFile != null)
                        {
                            objCCVM.FileName = objCCVM.UploadFile.FileName;
                            objCCVM.FilePath = Url.Content(System.IO.Path.Combine(ConfigurationManager.AppSettings["CustomerComplaintUploadPath"], objCCVM.UploadFile.FileName));
                           // objCCVM.UploadFile.SaveAs(ConfigurationManager.AppSettings["CustomerComplaintUploadPath"] + objCCVM.FileName);
                        }
                        objCCVM.CreatedBy = CurrentUser.RoleId.FirstOrDefault();
                        isSuccess  = objCustomerComplaintBusinessModel.UpdateComplaintDetails(objCCVM, _customerComplaintService);

                        if (isSuccess && objCCVM.UploadFile != null)
                        {
                            objCCVM.UploadFile.SaveAs(ConfigurationManager.AppSettings["CustomerComplaintUploadPath"] + objCCVM.FileName);
                        }
                       // isSuccess = true;
                        return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { status = isSuccess, message = "duplicate" }, JsonRequestBehavior.AllowGet);
                    }
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while saving manufacturer " + ex, ex);
                    isSuccess = false;
                }
                return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);

            }
            else
            {
                return View("UnAuthorized");
            }
        }

        [Authorize]
        public ActionResult DownloadFile(string Id)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.CustomerComplaintCreate, CurrentUser.RoleId.FirstOrDefault()))
            {

                //   bool retVal = true;
                //   string fileContainerPath = ConfigurationManager.AppSettings["CustomerComplaintUploadPath"];
                CustomerComplaintViewModel fileInfo = new CustomerComplaintViewModel();
                fileInfo = objCustomerComplaintBusinessModel.GetComplaintFilesByID(Id, _customerComplaintService);
                if (!string.IsNullOrEmpty(fileInfo.FileName))
                {
                 
                    string DownloadFileName = System.IO.Path.GetFileName(fileInfo.FilePath);
                    var DownloadFileData = System.IO.File.ReadAllBytes(fileInfo.FilePath);

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