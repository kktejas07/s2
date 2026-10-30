using IQEApp.Service.CommonService;
using IQEApp.Service.ControlNumberService;
using IQEApp.Service.PurchaseOrder;
using IQEApp.Service.ServiceOrder;
using IQEApp.Service.UserService;
using IQEApp.Service.VisitProcessing;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.ServiceOrderModel;
using IQEApp.Web.Models.UserModel;
using IQEApp.Web.Models.VisitProcessing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Transactions;
using System.Web.Mvc;
using System.Threading.Tasks;
using System.Web.Services.Description;
using System.IO;

namespace IQEApp.Web.Controllers
{
    public class Operations1Controller : BaseController
    {

        private readonly ControlNumberService _controlNumberService;
        private readonly IServiceOrderService _serviceOrderService;
        private readonly VisitProcessingService _visitProcessingService;
        private readonly ICommonDetailService _commonDetailService;
        private readonly IUserService _userService;
        private readonly IPurchaseOrderService _purchaseOrderService;

        ScheduleVisitBusinessModel objScheduleVisitBusinessModel = new ScheduleVisitBusinessModel();
        ControlNumberBusinessModel objControlNumberBusinessModel = new ControlNumberBusinessModel();
        CommonDetailsBusinessModel objCommonDetailsBusinessModel = new CommonDetailsBusinessModel();
        PurchaseOrderBusinessModel objPurchaseOrderBusinessModel = new PurchaseOrderBusinessModel();
        // GET: Operations1
        public Operations1Controller()
        {
            _controlNumberService = new ControlNumberService();
            _serviceOrderService = new ServiceOrderService();
            _visitProcessingService = new VisitProcessingService();
            _commonDetailService = new CommonDetailService();
            _userService = new UserService();
            _purchaseOrderService = new PurchaseOrderService();
        }

        public ActionResult Index()
        {
            ControlNumberDetailsModel model = new ControlNumberDetailsModel();
            model = objControlNumberBusinessModel.GetClientDetails(CurrentUser.SiteId, _controlNumberService);
            model.LstClientUnits = new List<ClientUnitsViewModel>();
            model.LstControlNumbers = new List<ControlNumberViewModel>();
            model.LstManufacturerUnitDetails = new List<ManufacturerUnitsViewModel>();
            model.LstServiceOrdersList = new List<ServiceOrderViewModel>();
            model.LstPurchaseOrderNumbers = new List<PurchaseOrderNumbersViewModel>();
            //ViewBag.Manufacturers = new SelectList(GetManufacturers(), "Value", "Text");
            //ViewBag.PONumbers = new SelectList(GetPONumbers(), "Value", "Text");
            //ViewBag.Locations = new SelectList(GetLocations(), "Value", "Text");
            // return PartialView("_ClientDetails", model);
            return View(model);
        }


        public ActionResult GetManufactureDetailsByControlNo(int controlNumber)
        {
            var manufactureDetails = objControlNumberBusinessModel.GetManufactureDetailsByControlNo(controlNumber, 0, -1, _controlNumberService);
            return Json(manufactureDetails, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetPONumbersByManufacturerId(string ControlNo, int ManufacturerId)
        {
            var purchaseorderNumbers = objPurchaseOrderBusinessModel.GetPONumbersByManufacturerId(ControlNo, ManufacturerId, _purchaseOrderService);
            //return PartialView("_POListForSelection", purchaseorderNumbers);
            return Json(purchaseorderNumbers, JsonRequestBehavior.AllowGet);
        }

        //public ActionResult GetPONumbersByManufacturerId(int ControlNo, int ManufacturerId)
        //{

        //    PurchaseOrderNumbersViewModel model = new PurchaseOrderNumbersViewModel();
        //    model = objPurchaseOrderBusinessModel.GetPONumbersByManufacturerId(ControlNo, ManufacturerId, _purchaseOrderService);
        //    return PartialView("_POListForSelection", model);

        //    //PurchaseOrderNumbersViewModel objPurchaseOrderNumberViewModel = new PurchaseOrderNumbersViewModel();
        //    //objPurchaseOrderNumberViewModel = objPurchaseOrderBusinessModel.GetPONumbersByManufacturerId(ControlNo, ManufacturerId, _purchaseOrderService);
        //    ////objPurchaseOrderNumberViewModel.PurchaseOrderDetails = new PurchaseOrderViewModel();
        //    //return PartialView("_POListForSelection", objPurchaseOrderNumberViewModel);

        //    //// PurchaseOrderNumbersViewModel obj = new PurchaseOrderNumbersViewModel();
        //    ////CommonDetailsViewModel objCommonDetailsViewModel = new CommonDetailsViewModel();
        //    //var obj = objPurchaseOrderBusinessModel.GetPONumbersByManufacturerId(ControlNo, ManufacturerId, _purchaseOrderService);
        //    ////objCommonDetailsViewModel.PurchaseOrderDetails = new PurchaseOrderViewModel();
        //    //return PartialView("_POListForSelection", obj);
        //}
        public ActionResult Index1(ControlNoSearchModel searchQueryModel)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.SalesControlNumber, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<ControlNumberViewModel> lstControlNumbersList = new List<ControlNumberViewModel>();
                searchQueryModel.SiteId = CurrentUser.SiteId;
                if (string.IsNullOrEmpty(searchQueryModel.StrSearch))
                    searchQueryModel.StrSearch = "";
                if (string.IsNullOrEmpty(searchQueryModel.AlphaSearch))
                    searchQueryModel.AlphaSearch = "";
                try
                {
                    lstControlNumbersList = objControlNumberBusinessModel.GetControlNumberDetails(searchQueryModel, _controlNumberService);
                    ViewBag.Total = lstControlNumbersList.Count > 0 ? lstControlNumbersList.FirstOrDefault().Total : 0;
                    searchQueryModel.PageCount += searchQueryModel.FetchCount;
                    ViewBag.CurrentPageCount = searchQueryModel.PageCount;
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("fetching control numbers", ex);
                }
                return View(lstControlNumbersList);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        public ActionResult ScheduleVisit(Guid? controlNumberGuid, int controlId, string controlNumber, string PONumber, int SOID, int POID, int PONID, List<int> PONIDs, int ManufacturerId)
        {
            ViewBag.controlId = controlId;
            ViewBag.controlNumber = controlNumber;
            ViewBag.PONumber = PONumber;
            ViewBag.controlNumberGuid = controlNumberGuid;
            ViewBag.SOID = SOID;
            ViewBag.POID = POID;
            ViewBag.PONID = PONID;
            ViewBag.PONIDs = PONIDs;
            ViewBag.ManufacturerId = ManufacturerId;
            ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();

            if (PONumber == "0")
            {
                model.ControlNumberDetails = new ControlNumberViewModel();
                model.LstStates = new List<CommonModel.StateModel>();
                model.LstUsers = new List<UserViewModel>();

            }
            else
            {
                try
                {
                    model = objControlNumberBusinessModel.GetVisitDetails(controlNumberGuid, controlNumber, CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
                    model.LstUsers = new List<UserViewModel>();
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                    throw;
                }

                if (PONumber != "0")
                {
                    ViewBag.ShowControlNumberSearch = false;
                    return View("~/Views/Operations1/ScheduleVisit.cshtml", model);
                }
                // return PartialView("~/Views/Operations1/_ControlNumberDetails.cshtml", model);
            }
            return View("~/Views/Operations1/ScheduleVisit.cshtml", model);
        }

        [HttpPost]
        public ActionResult ScheduleNewVisit(ScheduleVisitDetailsModel model)
        {
            var isSuccess = false;
            var isProspective = false;
            string messageflag = "";
            model.LoginUserId = CurrentUser.UserId;
            model.SiteId = CurrentUser.SiteId;
            var VisitId = 0;

            try
            {
                using (TransactionScope Transcope = new TransactionScope())
                {
                    try
                    {
                        VisitId = objScheduleVisitBusinessModel.ScheduleNewVisit(model, _visitProcessingService);

                        if (VisitId == -1)
                        {
                            isSuccess = false;
                            messageflag = "Duplicate";
                        }
                        if (VisitId > 0)
                        {
                            isSuccess = true;
                            messageflag = "Success";
                        }
                        if (model.VisitDate > DateTime.Today.AddDays(1))
                            isProspective = true;


                        Transcope.Complete();
                        Transcope.Dispose();
                    }
                    catch (TransactionException ex)
                    {
                        Transcope.Dispose();

                    }

                }
                return Json(new { status = isSuccess, isProspective = isProspective, message = messageflag }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured on scheduling new visit" + e, e);
            }
            return Json(new { status = isSuccess, message = "Fail" }, JsonRequestBehavior.AllowGet);

        }

        public ActionResult UpdateScheduleVisit(ScheduleVisitDetailsModel model)
        {
            var isSuccess = false;
            var isProspective = false;
            model.LoginUserId = CurrentUser.UserId;
            model.SiteId = CurrentUser.SiteId;
            var VisitId1 = 0;

            try
            {
                using (TransactionScope Transcope = new TransactionScope())
                {
                    try
                    {
                        VisitId1 = objScheduleVisitBusinessModel.UpdateScheduleVisit(model, _visitProcessingService);
                        if (VisitId1 > 0)
                            isSuccess = true;


                        Transcope.Complete();
                        Transcope.Dispose();
                    }
                    catch (TransactionException ex)
                    {
                        Transcope.Dispose();

                    }

                }
                return Json(new { status = isSuccess, isProspective = isProspective, message = "Sucess" }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured on scheduling new visit" + e, e);
            }
            return Json(new { status = isSuccess, message = "Fail" }, JsonRequestBehavior.AllowGet);

        }
        public ActionResult PreviewScheduleVisit(Guid? controlNumberGuid, bool isPartialLoad = true)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsScheduleVisit, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<ScheduleVisitModel> objList = new List<ScheduleVisitModel>();
                try
                {
                    objList = objScheduleVisitBusinessModel.PreviewScheduledVisit(CurrentUser.UserId, controlNumberGuid, _visitProcessingService);
                    ViewBag.Total = objList.Count > 0 ? objList.FirstOrDefault().Total : 0;
                }
                catch (Exception e)
                {
                    errorLogObj.LogError("schedule visits fetch error" + e, e);
                    throw;
                }

                if (isPartialLoad)
                {
                    return PartialView("_ScheduledVisitsList", objList);
                }
                return View("ScheduledVisitList", objList);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }


        public ActionResult GetUserDetailsByUserId(int userId)
        {
            UserBusinessModel objUserBusinessModel = new UserBusinessModel();
            UserViewModel model = new UserViewModel();
            model = objUserBusinessModel.GetUserDetailsByUserId(userId, _userService);
            return PartialView("~/Views/Operations1/_UserDetails.cshtml", model);
        }
        public ActionResult LoadCommonDetailsForScheduleVisit(string visitGuid, string controlNumberGuid, int ServiceOrderId, bool isEditMode = false)
        {
            var vstGuid = new Guid(); var cnGuid = new Guid();

            //  Guid? guid = Guid.Empty;
            if (visitGuid == "" || visitGuid == "null")
            {
                vstGuid = Guid.Empty;
            }
            else
            {
                vstGuid = new Guid(visitGuid);
            }

            if (controlNumberGuid == "")
            {
                cnGuid = Guid.Empty;
            }
            else
            {
                cnGuid = new Guid(controlNumberGuid);
            }

            CommonDetailsViewModel objCommonDetailsViewModel = new CommonDetailsViewModel();
            objCommonDetailsViewModel = objCommonDetailsBusinessModel.ViewCommonDetails(vstGuid, cnGuid, ServiceOrderId, CurrentUser.UserId, _commonDetailService);
            if (isEditMode)
            {
                objCommonDetailsViewModel = objCommonDetailsBusinessModel.LoadCommonDetailsForViewVisit(vstGuid, cnGuid, ServiceOrderId, CurrentUser.UserId, _commonDetailService);
                return PartialView("_CommonDetailsForEditScheduledVisit", objCommonDetailsViewModel);
            }

            if (objCommonDetailsViewModel.LstPurchaseOrderItems.Count > 0)
            {
                ViewBag.IsBlockEquipmentItem = true;
            }
            else
                ViewBag.IsBlockEquipmentItem = false;
            ViewBag.EditMode = false;
            return PartialView("_CommonDetailsForScheduleVisit", objCommonDetailsViewModel);
        }

        public ActionResult GetPODetailsForScheduleVisit(int manufacturerUnitId, int ServiceOrderId)
        {
            CommonDetailsViewModel objCommonDetailsViewModel = new CommonDetailsViewModel();
            objCommonDetailsViewModel = objCommonDetailsBusinessModel.GetPODetailsForScheduleVisit(manufacturerUnitId, ServiceOrderId, _commonDetailService);
            objCommonDetailsViewModel.PurchaseOrderDetails = new PurchaseOrderViewModel();
            return PartialView("_POListForSelection", objCommonDetailsViewModel);
        }

        private string RenderPartialViewToString(string viewName, object model)
        {
            ViewData.Model = model;
            using (var sw = new StringWriter())
            {
                var viewResult = ViewEngines.Engines.FindPartialView(ControllerContext, viewName);
                var viewContext = new ViewContext(ControllerContext, viewResult.View, ViewData, TempData, sw);
                viewResult.View.Render(viewContext, sw);
                return sw.GetStringBuilder().ToString();
            }
        }

        public ActionResult GetPurchaseOrderDetailsById1(List<int> PONIds, bool IsVisitScheduleScreen = false)
        {
            PurchaseOrderDetailsModel model = new PurchaseOrderDetailsModel();
            try
            {
                model = objPurchaseOrderBusinessModel.GetPurchaseOrderDetailsById1(PONIds, CurrentUser.SiteId, _purchaseOrderService);
            }
            catch (Exception ex)
            {
                errorLogObj.LogInfo(ex.Message); // Log the exception for debugging purposes
                return Json(new { success = false, message = "An error occurred while fetching the purchase order details." }, JsonRequestBehavior.AllowGet);
            }

            if (model.LstPurchaseOrderItems == null || !model.LstPurchaseOrderItems.Any())
            {
                return Json(new { success = false, message = "No purchase order items found for the given ID." }, JsonRequestBehavior.AllowGet);
            }

            if (IsVisitScheduleScreen)
            {
                return PartialView("~/Views/Operations1/_PODetailsForVisitScheduling.cshtml", model);
            }
            return PartialView("~/Views/ServiceOrder/_PurchaseOrderDetails.cshtml", model);
        }


        public ActionResult GetPurchaseOrderDetailsById12(List<int> PONIds, bool IsVisitScheduleScreen = false)
        {
            var model = new PurchaseOrderDetailsModel();

            try
            {
                model = objPurchaseOrderBusinessModel.GetPurchaseOrderDetailsById1(PONIds, CurrentUser.SiteId, _purchaseOrderService);
            }
            catch (Exception ex)
            {
                errorLogObj.LogInfo(ex.Message);
                return Json(new { success = false, message = "An error occurred while fetching the purchase order details." }, JsonRequestBehavior.AllowGet);
            }

            if (model.LstPurchaseOrderItems == null || !model.LstPurchaseOrderItems.Any())
            {
                return Json(new { success = false, message = "No purchase order items found for the given ID." }, JsonRequestBehavior.AllowGet);
            }

            string partialViewPath = IsVisitScheduleScreen
                ? "~/Views/Operations1/_PODetailsForVisitScheduling.cshtml"
                : "~/Views/ServiceOrder/_PurchaseOrderDetails.cshtml";

            string renderedHtml = RenderPartialViewToString(partialViewPath, model);

            return Json(new
            {
                success = true,
                html = renderedHtml,
                LstSelectedPurchaseOrderItems = model.LstSelectedPurchaseOrderItems
            }, JsonRequestBehavior.AllowGet);
        }



        [HttpPost]
        public JsonResult TestPopup()
        {
            var result = "";
            return Json(result, JsonRequestBehavior.AllowGet);
        }



        public ActionResult EditVisitScheduleByVID(int VisitId, string ponId, int POID)
        {
            try
            {
                // Step 1: Fetch the main model
                ScheduleVisitDetailsModel model = objScheduleVisitBusinessModel
                    .EditVisitScheduleByVID(VisitId, ponId, POID, _visitProcessingService);

                // Step 2: Initialize nested ControlNumberDetailsModel
                //model.ControlNumberDetailsModel = objControlNumberBusinessModel
                //    .GetClientDetails(CurrentUser.SiteId, _controlNumberService);

                //// Step 3: Initialize empty lists (to avoid null references)
                //model.ControlNumberDetailsModel.LstClientUnits = new List<ClientUnitsViewModel>();
                //model.ControlNumberDetailsModel.LstControlNumbers = new List<ControlNumberViewModel>();
                //model.ControlNumberDetailsModel.LstManufacturerUnitDetails = new List<ManufacturerUnitsViewModel>();
                //model.ControlNumberDetailsModel.LstServiceOrdersList = new List<ServiceOrderViewModel>();
                //model.ControlNumberDetailsModel.LstPurchaseOrderNumbers = new List<PurchaseOrderNumbersViewModel>();

                // Step 4: Assign PO items if any


                // Step 5: Handle State dropdown
                if (model.LstStates != null && model.LstStates.Any())
                {
                    if (model.StateId == 0 && !string.IsNullOrEmpty(model.StateName))
                    {
                        // Lookup the StateId using StateName if only name is available
                        var matchedState = model.LstStates
                            .FirstOrDefault(s => s.StateName.Equals(model.StateName, StringComparison.OrdinalIgnoreCase));

                        if (matchedState != null)
                        {
                            model.StateId = matchedState.StateId;
                        }
                    }

                    // Create SelectList using the resolved StateId
                    ViewBag.States = new SelectList(model.LstStates, "StateId", "StateName", model.StateId);
                }

                else
                {
                    ViewBag.States = new SelectList(Enumerable.Empty<object>(), "StateName", "StateName");
                }

                // Step 6: Return the view with the full model
                return View("EditScheduleVisit", model);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("Edit schedule visits fetch error: " + e.Message, e);
                throw;
            }
        }

        public ActionResult GetPOItemList(List<int> PONIds, int VisitId)
        {
            var model = new PurchaseOrderDetailsModel();

            try
            {
                model = objPurchaseOrderBusinessModel.GetPurchaseOrderDetailsByIds(PONIds, CurrentUser.SiteId, VisitId, _purchaseOrderService);
                //model.LstPurchaseOrderItems = _poService.GetPOItemListByPONId(PONId);
                // model.LstSelectedPurchaseOrderItems = _poService.GetSelectedPOItems(PONId);

                return Json(new
                {
                    success = true,
                    LstPurchaseOrderItems = model.LstPurchaseOrderItems,
                    LstSelectedPurchaseOrderItems = model.LstSelectedPurchaseOrderItems
                }, JsonRequestBehavior.AllowGet);
            }
            catch(Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                }, JsonRequestBehavior.AllowGet);

            }

        }
    } 
}