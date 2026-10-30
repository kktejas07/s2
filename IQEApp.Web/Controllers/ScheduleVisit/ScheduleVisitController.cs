using IQEApp.Service.CommonService;
using IQEApp.Service.ControlNumberService;
using IQEApp.Service.PurchaseOrder;
using IQEApp.Service.ScheduleVisitService;
using IQEApp.Service.UserService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.ScheduleVisitModel;
using IQEApp.Web.Models.UserModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.ScheduleVisit
{
    public class ScheduleVisit1Controller : BaseController
    {
        private readonly IScheduleVisitService _scheduleVisitService;
        private readonly ControlNumberService _controlNumberService;
        private readonly ICommonDetailService _commonDetailService;
        private readonly IPurchaseOrderService _purchaseOrderService;
        private readonly IUserService  _userService;

        // GET: ScheduleVisit

        // Use fully-qualified type to avoid ambiguity between different ScheduleVisitBusinessModel classes
        IQEApp.Web.Models.ScheduleVisitModel.ScheduleVisitBusinessModel objScheduleVisitBusinessModel = new IQEApp.Web.Models.ScheduleVisitModel.ScheduleVisitBusinessModel();
        ControlNumberBusinessModel objControlNumberBusinessModel = new ControlNumberBusinessModel();
        CommonDetailsBusinessModel objCommonDetailsBusinessModel = new CommonDetailsBusinessModel();
        UserBusinessModel objUserBusinessModel = new UserBusinessModel();
        public ScheduleVisit1Controller()
        {
            _scheduleVisitService = new ScheduleVisitService();
            _controlNumberService = new ControlNumberService();
            _commonDetailService =new CommonDetailService();
            _purchaseOrderService = new PurchaseOrderService();
            _userService = new UserService();
        }
        public ActionResult Index()
        {
            // Use ScheduleVisitDetailsModel from ScheduleVisitModel namespace
            var model = new IQEApp.Web.Models.ScheduleVisitModel.ScheduleVisitDetailsModel();
            model.LstManufacturerUnitDetails = new List<ManufacturerUnitsViewModel>();
            model.LstPurchaseOrderItems =  new List<PurchaseOrderItemsViewModel>();
            model.LstPurchaseOrderDetails = new List<PurchaseOrderViewModel>();
            model.LstManufacturerUnits = new List<ManufacturerUnitsViewModel>().ToList();
            model.LstUsers = new List<UserViewModel>().ToList();

            // return PartialView("_ClientDetails", model);
            return View(model);
        }

        //public ActionResult getManufactureDetailsByControlNo(int controlNumber)
        //{
        //    var manufactureDetails = objControlNumberBusinessModel.getManufactureDetailsByControlNo(controlNumber, 0, -1, _controlNumberService);
        //    return Json(manufactureDetails, JsonRequestBehavior.AllowGet);
        //}

        //public ActionResult GetPODetailsForScheduleVisit1(int ControlNo, int ManufacturerId)
        //{
        //  //  CommonDetailsViewModel objCommonDetailsViewModel = new CommonDetailsViewModel();
        //    var purchaseorderDetails = objCommonDetailsBusinessModel.GetPODetailsForScheduleVisit1(ControlNo, ManufacturerId, _commonDetailService);
        //  //  objCommonDetailsViewModel.PurchaseOrderDetails = new PurchaseOrderViewModel();
        //    return Json(purchaseorderDetails, JsonRequestBehavior.AllowGet);
        //  //  return PartialView("_POListForSelection", objCommonDetailsViewModel);
        //}

        public ActionResult GetPurchaseOrderDetailsById(int PoId, bool IsVisitScheduleScreen = false)
        {
            PurchaseOrderBusinessModel objPO = new PurchaseOrderBusinessModel();
            PurchaseOrderDetailsModel model = new PurchaseOrderDetailsModel();
            try
            {
                model = objPO.GetPurchaseOrderDetailsById(PoId, CurrentUser.SiteId, _purchaseOrderService);
                TempData["lstState"] = model.LstManufacturerUnits.ToList();
            }
            catch (Exception ex)
            {
                errorLogObj.LogInfo("");
            }

            if (IsVisitScheduleScreen)
            {
                return PartialView("_PODetailsForVisitScheduling", model);
            }
            return PartialView("~/Views/ServiceOrder/_PurchaseOrderDetails.cshtml", model);
        }

        public ActionResult GetUserDetailsByUserId(int userId)
        {
            UserViewModel model = new UserViewModel();
            model = objUserBusinessModel.GetUserDetailsByUserId(userId, _userService);
            return PartialView("_UserDetails", model);
        }

        public ActionResult ScheduleVisit(Guid? controlNumberGuid, string controlNumber)
        {
            var model = new IQEApp.Web.Models.VisitProcessing.ScheduleVisitDetailsModel();
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
                    // FIX: Use ControlNumber business model to load control / SO / PO details
                    model = objControlNumberBusinessModel.GetVisitDetails(controlNumberGuid, controlNumber, CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
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
                    return View("~/Views/Operations1/ScheduleVisit.cshtml", model);
                }
                return PartialView("~/Views/Operations1/_ControlNumberDetails.cshtml", model);
            }
            return View("~/Views/Operations1/ScheduleVisit.cshtml", model);
        }

    }
}