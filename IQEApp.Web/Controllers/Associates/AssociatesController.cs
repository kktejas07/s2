using ClosedXML.Excel;
using IQEApp.Service.AssociatesService;
using IQEApp.Service.SecurityService;
using IQEApp.Service.UserService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.AssociatesModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.UserModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.IO;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Associates
{
    public class AssociatesController : BaseController
    {
        private readonly IAssociatesServices _associateService;
        private readonly ISecurityService _securityService;
        private readonly IUserService _userService;
        UserBusinessModel objUserBusinessModel = new UserBusinessModel();
        AssociatesBusinessModel objAssociatesBusinessModel = new AssociatesBusinessModel();
        public AssociatesController()
        {
            _associateService = new AssociatesServices();
            _securityService = new SecurityService();
            _userService = new UserService();
            //SingletonScreenFeatureMapping.SetScreenFeatureMapping(CurrentUser.RoleId.FirstOrDefault(), _securityService);
        }

        // GET: Enquires
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.AdminAssociate, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<AssociatesViewModel> lst = new List<AssociatesViewModel>();
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                try
                {
                    lst = objAssociatesBusinessModel.GetAllAssociateDetails(CurrentUser.SiteId, "", "", 0, 10, true, "ASC", _associateService);
                    if (lst.Count > 0)
                    {
                        ViewBag.Total = lst.FirstOrDefault().Total;
                        ViewBag.CurrentPageCount = defaultFetchCount;
                    }
                    else
                    {
                        ViewBag.Total = 0;
                        ViewBag.CurrentPageCount = 0;
                    }
                    //ViewBag.Total = lst.FirstOrDefault().Total;
                    //ViewBag.CurrentPageCount = 10;
                    //ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Associates Index", ex);
                }
                return View("Index", lst);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;

        }

        public ActionResult Preview(Guid associateGuid, string contactPerson)
        {
            List<UserViewModel> list = new List<UserViewModel>();
            try
            {
                CurrentUser.SetUserViewModuleType(UserViewModuleType.Employee);
                list = objUserBusinessModel.GetUserListDetails1(associateGuid, contactPerson, CurrentUser.SiteId, true, "", "", 0, 5, "ASC", _userService);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Associate - Preview", ex);
            }
            return Json(new { status = true, strString = "success", emplst = list }, JsonRequestBehavior.AllowGet);
        }


        public JsonResult DownloadExcel(Guid associateGuid, string contactPerson)
        {
            List<UserViewModel> list = new List<UserViewModel>();
            try
            {
                CurrentUser.SetUserViewModuleType(UserViewModuleType.Employee);
                //Default value of records is true since we are loading active records on page load
                list = objUserBusinessModel.GetUserListDetails1(associateGuid,contactPerson, CurrentUser.SiteId, true, "", "", 0, 5, "ASC", _userService);

                DataTable dt = new DataTable("Test");

                dt.Columns.Add("EmployeeCode");
                dt.Columns.Add("UserFullName");
                dt.Columns.Add("Email");
                dt.Columns.Add("Qualification");
                dt.Columns.Add("ContactNumber");
                dt.Columns.Add("Country");
                dt.Columns.Add("Address");


                foreach (var ls in list)
                {
                    var row = dt.NewRow();

                    row["EmployeeCode"] = ls.EmployeeCode;
                    row["UserFullName"] = ls.UserFullName;
                    row["Email"] = ls.EmailId;
                    row["Qualification"] = ls.Qualification;
                    row["ContactNumber"] = ls.EmpContactNumber;
                    row["Country"] = ls.CountryName;
                    row["Address"] = ls.Address;
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
                errorLogObj.LogError("Associate-DownloadExcel", ex);
            }

            return null;

        }
        public ActionResult AddAssociate()
        {
            try
            {
                AssociatesViewModel objAssociateViewModel = new AssociatesViewModel();
                AssociatesBusinessModel objAssociateBusinessModel = new AssociatesBusinessModel();

                objAssociateViewModel = objAssociateBusinessModel.GetAssociateDetailsToAdd(CurrentUser.SiteId, _associateService);
                return PartialView("_AddAssociate", objAssociateViewModel);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Add Client", ex);
            }
            return null;
        }

        [HttpPost]
        public ActionResult CreateAssociate(AssociatesViewModel objAVM)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.AssociatesCreate, CurrentUser.RoleId.FirstOrDefault()))
            {
                var isSuccess = false;
           // if (ModelState.IsValid)
            {
                try
                {
                    objAVM.CreteadBy = CurrentUser.UserId;
                    objAVM.SiteId = CurrentUser.SiteId;

                    if (!objAssociatesBusinessModel.ValidateAssociate(objAVM, _associateService))
                    {
                        var cId = objAssociatesBusinessModel.CreateAssociate(objAVM, _associateService);
                        isSuccess = true;
                        return Json(new { status = isSuccess, message = "", clientId = cId }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { status = isSuccess, message = "duplicate", clientId = 0 }, JsonRequestBehavior.AllowGet);
                    }
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("CreateAssociate", ex);
                }
            }
            return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return View("UnAuthorized");
            }

        }

        public ActionResult EditAssociate(Guid associateGuid)
        {
            AssociatesDetailsModel objAssociateDetailsModel = new AssociatesDetailsModel();
            var isSuccess = false;
            try
            {
                objAssociateDetailsModel = objAssociatesBusinessModel.GetAssociateDetailsToEdit(associateGuid, CurrentUser.SiteId, _associateService);
                return PartialView("_EditAssociate", objAssociateDetailsModel);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Edit Associate", ex);
            }

            return Json(new { message = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult UpdateAssociate1(AssociatesDetailsModel objAVM)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.AssociatesEdit, CurrentUser.RoleId.FirstOrDefault()))
            {
                var isSuccess = false;
            var response = "";
            try
            {
                objAVM.ModifiedBy = CurrentUser.UserId;
                objAVM.SiteId = CurrentUser.SiteId;
                //  if (!objAssociatesBusinessModel.ValidateAssociate(objAVM, _associateService))
                {
                    var cId = objAssociatesBusinessModel.UpdateAssociateDetails(objAVM, _associateService);
                    isSuccess = true;
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while updating Associate", ex);
                isSuccess = false;
            }

            return Json(new { status = isSuccess, message = response }, JsonRequestBehavior.AllowGet);
           }
            else
            {
                return View("UnAuthorized");
            }
        }

        [HttpPost]
        public ActionResult UpdateAssociateStatus(Guid associateGuid, bool status)
        {
            var isSuccess = false;
            try
            {
                var cId = objAssociatesBusinessModel.UpdateAssociateStatus(associateGuid, status, CurrentUser.UserId, _associateService);
                isSuccess = true;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while deleting Associate", ex);
                isSuccess = false;
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetAssociatesList(int pageCount = 0, string strSearch = "", string alphaSearch = "", bool activeStatus = true, string sortingOrder = "ASC")
        {
            List<AssociatesViewModel> list = new List<AssociatesViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            //if (pageCount < 0)
            //    pageCount = 0;
            try
            {
            list = objAssociatesBusinessModel.GetAllAssociateDetails(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, sortingOrder, _associateService);

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
                return PartialView("_AssociatesDirectory", list);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("GetAssociatesList", ex);
            }
            return null; 
        }

    }
}