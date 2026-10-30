using IQEApp.Service.ManufacturerService;
using IQEApp.Service.SecurityService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ManufacturerModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Manufacturer
{
    //[CustomAuthorize(Roles = "Super Admin Role, Admin Role, Technician Role, Coordinator Role, Quality Check Role, Finance Role")]
    public class ManufacturerController : BaseController
    {
        private readonly IManufacturerService _manufacturerService;
        private readonly ISecurityService _securityService;
        ManufacturerBusinessModel objManufacturerBusinessModel = new ManufacturerBusinessModel();
        public ManufacturerController()
        {
            _manufacturerService = new ManufacturerService();
            _securityService = new SecurityService();
            //SingletonScreenFeatureMapping.SetScreenFeatureMapping(CurrentUser.RoleId.FirstOrDefault(), _securityService);
        }
        //
        // GET: /Manufacturer/
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsManufacturers, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<ManufacturerViewModel> list = new List<ManufacturerViewModel>();
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                try
                {
                    list = objManufacturerBusinessModel.GetManufacturersListBySiteId(CurrentUser.SiteId, "", "", 0, defaultFetchCount, true, "ASC", _manufacturerService);
                    if (list.Count > 0)
                    {
                        ViewBag.Total = list.FirstOrDefault().Total;
                        ViewBag.CurrentPageCount = defaultFetchCount;
                    }
                    else
                    {
                        ViewBag.Total = 0;
                        ViewBag.CurrentPageCount = 0;
                    }
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Get manufacturer list by site id", ex);
                }

                return View("ManufacturerDetails", list);
            }
            else
            {
                return View("UnAuthorized");
            }
            // return null;
        }

        #region Manufacturer
        public ActionResult GetManufacturerListBySiteId(int pageCount = 0, string strSearch = "", string alphaSearch = "", bool activeStatus = true, string sortingOrder = "ASC")
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsManufacturers, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<ManufacturerViewModel> list = new List<ManufacturerViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            try
            {
                list = objManufacturerBusinessModel.GetManufacturersListBySiteId(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, sortingOrder, _manufacturerService);
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
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Get manufacturer list by site id", ex);
            }
            return PartialView("_ManufacturerDirectory", list);
            }
            else
            {
                return View("UnAuthorized");
            }

        }
        public ActionResult AddManufacturer()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerCreate, CurrentUser.RoleId.FirstOrDefault()))
            {
                ManufacturerDetailsModel objManufacturerDetailsModel = new ManufacturerDetailsModel();

                //To fetch all the values to fill drop down
                objManufacturerDetailsModel = objManufacturerBusinessModel.GetManufacturerDetailsToAdd(CurrentUser.SiteId, _manufacturerService);
                return PartialView("_AddManufacturer", objManufacturerDetailsModel);
            }
            else
            {
                return View("UnAuthorized");
            }
        }
        [HttpPost]
        public ActionResult CreateManufacturer(ManufacturerViewModel objMVM)
        {
            var isSuccess = false;
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerCreate, CurrentUser.RoleId.FirstOrDefault()))
            {
                try
                {
                    objMVM.SiteId = CurrentUser.SiteId;
                    objMVM.LoggedInUser = CurrentUser.UserId;
                    if (!objManufacturerBusinessModel.IsManufacturerExists(objMVM, _manufacturerService))
                    {
                        var mId = objManufacturerBusinessModel.SaveManufacturerDetails(objMVM, _manufacturerService);
                        isSuccess = true;
                        return Json(new { status = isSuccess, message = "", manufacturerId = mId },
                            JsonRequestBehavior.AllowGet);
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

        public ActionResult EditManufacturer(Guid manufacturerGuid)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerEdit, CurrentUser.RoleId.FirstOrDefault()))
            {
                ManufacturerDetailsModel objMDM = new ManufacturerDetailsModel();
                var isSuccess = false;
                try
                {
                    objMDM = objManufacturerBusinessModel.GetManufacturerDetailsToEdit(manufacturerGuid, CurrentUser.SiteId, _manufacturerService);
                    if (objMDM.ManufacturerUnitNameFlag == 1)
                        objMDM.LstManufacturerUnitName.RemoveAll(x => x.Id == 2);
                    return PartialView("_EditManufacturer", objMDM);
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("error occured while fetching information to edit manufacturer", ex);
                }

                return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return View("UnAuthorized");
            }

        }
        [HttpPost]
        public ActionResult UpdateManufacturer(ManufacturerViewModel objMvm)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerEdit, CurrentUser.RoleId.FirstOrDefault()))
            {
                var isSuccess = false;
                try
                {
                    objMvm.SiteId = CurrentUser.SiteId;
                    objMvm.LoggedInUser = CurrentUser.UserId;
                    if (!objManufacturerBusinessModel.IsManufacturerExists(objMvm, _manufacturerService))
                    {
                        isSuccess = objManufacturerBusinessModel.UpdateManufacturerDetails(objMvm, _manufacturerService);
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
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
            else
            {

                return View("UnAuthorized");
            }
        }
        [HttpPost]
        public ActionResult UpdateManufacturerStatus(ManufacturerViewModel objMvm)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerEdit, CurrentUser.RoleId.FirstOrDefault()))
            {
                var isSuccess = false;
                try
                {
                    objMvm.SiteId = CurrentUser.SiteId;
                    objMvm.LoggedInUser = CurrentUser.UserId;
                    isSuccess = objManufacturerBusinessModel.UpdateManufacturerStatus(objMvm, _manufacturerService);
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

        //public ActionResult GetManufacturerSearchList(int pageCount = 0, string strSearch = "")
        //{
        //    List<ManufacturerViewModel> list = new List<ManufacturerViewModel>();
        //    var defaultFetchCount = 10;
        //    try
        //    {
        //        list = objManufacturerBusinessModel.GetManufacturersSearchList(CurrentUser.SiteId, strSearch, pageCount, defaultFetchCount, _manufacturerService);
        //        if (list.Count > 0)
        //        {
        //            ViewBag.Total = list.FirstOrDefault().Total;
        //            pageCount += defaultFetchCount;
        //            ViewBag.CurrentPageCount = pageCount;
        //        }
        //        else
        //        {
        //            ViewBag.Total = 0;
        //            ViewBag.CurrentPageCount = 0;
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        errorLogObj.LogError("Get manufacturer list by site id", ex);
        //    }
        //    return PartialView("_ManufacturerDirectory", list);

        //}
        #endregion

        #region ManufacturerUnit

        public ActionResult AddManufacturingUnit(int manufacturerId)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerCreate, CurrentUser.RoleId.FirstOrDefault()))
            {

                try
                {
                    ManufacturerUnitsDetailsModel obj = new ManufacturerUnitsDetailsModel();
                    obj = objManufacturerBusinessModel.GetManufacturerUnitDetailsToAdd(_manufacturerService);
                    obj.ManufacturerId = manufacturerId;
                    return PartialView("_AddManufacturerUnit", obj);
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while fetching details to add man unit " + ex, ex);
                }
                return Json(new { status = "error" }, JsonRequestBehavior.AllowGet);

            }
            else
            {

                return View("UnAuthorized");
            }
        }

        public ActionResult AddManufacturingNoUnit(int manufacturerId, string manufacturerName, int CountryId = 0, int StateId = 0, string City = "")
        {

            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerCreate, CurrentUser.RoleId.FirstOrDefault()))
            {
                try
                {
                    ManufacturerUnitsDetailsModel obj = new ManufacturerUnitsDetailsModel();
                    obj = objManufacturerBusinessModel.GetManufacturerUnitDetailsToAdd(_manufacturerService);
                    obj.ManufacturerUnitName = manufacturerName;
                    obj.MFUnitCountryId = CountryId;
                    obj.MFUnitStateId = StateId;
                    obj.City = City;
                    // ViewBag.manufacturerName = manufacturerName;
                    obj.ManufacturerId = manufacturerId;
                    return PartialView("_AddManufacturerNoUnit", obj);
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while fetching details to add man unit " + ex, ex);
                }
                return Json(new { status = "error" }, JsonRequestBehavior.AllowGet);
            }
            else
            {

                return View("UnAuthorized");
            }
        }

        [HttpPost]
        public ActionResult SaveManufacturingUnit(ManufacturerUnitsViewModel objMUVM)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerCreate, CurrentUser.RoleId.FirstOrDefault()))
            {
                var isSuccess = false;
                var msg = "";
                try
                {
                    objMUVM.LoggedInUser = CurrentUser.UserId;
                    if (!objManufacturerBusinessModel.IsManufacturerUnitExists(objMUVM, _manufacturerService))
                    {
                        if (objMUVM.ManufacturerUnitName == null)
                            objMUVM.ManufacturerUnitName = ViewBag.manufacturerName;
                        var unitId = objManufacturerBusinessModel.SaveManufacturingUnit(objMUVM, _manufacturerService);
                        isSuccess = true;
                    }
                    else
                    {
                        msg = "duplicate";
                    }
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while saving man unit " + ex, ex);
                    isSuccess = false;
                    msg = "error";
                }
                return Json(new { status = isSuccess, message = msg }, JsonRequestBehavior.AllowGet);
            }
            else
            {

                return View("UnAuthorized");
            }
        }

        public ActionResult GetManufacturingUnitsByManufacturer(int manufacturerId)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsManufacturers, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<ManufacturerUnitsViewModel> lst = new List<ManufacturerUnitsViewModel>();
                try
                {
                    lst = objManufacturerBusinessModel.GetManufacturerUnitsListByManufacturer(manufacturerId, _manufacturerService);
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while saving man unit " + ex, ex);
                }
                return PartialView("_ManufacturerUnitsList", lst);
            }
            else
            {

                return View("UnAuthorized");
            }
        }

        [HttpPost]
        public ActionResult EditManufacturingUnitDetails(Guid ManufacturerUnitGuid, string ManufacturerUnitNameFlag)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerEdit, CurrentUser.RoleId.FirstOrDefault()))
            {
                ManufacturerUnitsDetailsModel obj = new ManufacturerUnitsDetailsModel();
                try
                {

                    obj = objManufacturerBusinessModel.GetManufacturerUnitDetailsToEdit(ManufacturerUnitGuid, CurrentUser.UserId, _manufacturerService);
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while fetching man unit details to edit" + ex, ex);
                }
                if (ManufacturerUnitNameFlag == "1")
                    return PartialView("_EditManufacturerUnitDetails", obj);
                else
                    return PartialView("_EditManufacturerNoUnitDetails", obj);
            }
            else
            {

                return View("UnAuthorized");
            }
        }

        [HttpPost]
        public ActionResult EditManufacturingNoUnitDetails(Guid ManufacturerUnitGuid, string ManufacturerUnitNameFlag, string CountryId, string StateId, string City)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerEdit, CurrentUser.RoleId.FirstOrDefault()))
            {

                ManufacturerUnitsDetailsModel obj = new ManufacturerUnitsDetailsModel();
                try
                {

                    obj = objManufacturerBusinessModel.GetManufacturerUnitDetailsToEdit(ManufacturerUnitGuid, CurrentUser.UserId, _manufacturerService);
                    obj.MFUnitCountryId = Convert.ToInt32(CountryId);
                    obj.MFUnitStateId = Convert.ToInt32(StateId);
                    obj.City = City;
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while fetching man unit details to edit" + ex, ex);
                }
                if (ManufacturerUnitNameFlag == "1")
                    return PartialView("_EditManufacturerUnitDetails", obj);
                else
                    return PartialView("_EditManufacturerNoUnitDetails", obj);
            }
            else
            {

                return View("UnAuthorized");
            }
        }
        [HttpPost]
        public ActionResult UpdateManufacturerUnitDetails(ManufacturerUnitsViewModel objMUVM)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ManufacturerEdit, CurrentUser.RoleId.FirstOrDefault()))
            {

                var isSuccess = false;
            var msg = "";
            try
            {
                objMUVM.LoggedInUser = CurrentUser.UserId;
                if (!objManufacturerBusinessModel.IsManufacturerUnitExists(objMUVM, _manufacturerService))
                {
                    isSuccess = objManufacturerBusinessModel.UpdateManufacturingUnit(objMUVM, _manufacturerService);
                }
                else
                {
                    msg = "duplicate";
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while updating man unit " + ex, ex);
                isSuccess = false;
                msg = "error";
            }
            return Json(new { status = isSuccess, message = msg }, JsonRequestBehavior.AllowGet);
            }
            else
            {

                return View("UnAuthorized");
            }
        }
        public ActionResult UpdateManufacturerUnitStatus(ManufacturerUnitsViewModel objMUVM)
        {
            //if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.MastersActive, CurrentUser.RoleId.FirstOrDefault()))
            //{
                var isSuccess = false;
                var msg = "";
                try
                {
                    objMUVM.LoggedInUser = CurrentUser.UserId;
                    isSuccess = objManufacturerBusinessModel.UpdateManufacturingUnitStatus(objMUVM, _manufacturerService);
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Error occured while updating man unit " + ex, ex);
                    isSuccess = false;
                    msg = "error";
                }
                return Json(new { status = isSuccess, message = msg }, JsonRequestBehavior.AllowGet);
            //}
            //else
            //{

            //    return View("UnAuthorized");
            //}
        }
        public ActionResult GetManufacturerUnitDetailsByUnitId(int unitId)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsManufacturers, CurrentUser.RoleId.FirstOrDefault()))
            {
                ManufacturerUnitsViewModel unitDetails = new ManufacturerUnitsViewModel();
            try
            {
                unitDetails = objManufacturerBusinessModel.GetManufacturerUnitDetailsByUnitId(unitId, _manufacturerService);
                return PartialView("_ViewManufacturerUnitDetails", unitDetails);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while fetching client units by unitId: " + unitId, ex);
            }
            return null;
            }
            else
            {

                return View("UnAuthorized");
    }

    //return Json(new { clientUnitDetails }, JsonRequestBehavior.AllowGet);
    }
        #endregion
    }
}