using IQEApp.Service.ControlNumberService;
using IQEApp.Service.PurchaseOrder;
using IQEApp.Service.UserService;
using IQEApp.Service.VisitProcessing;
using IQEApp.Service.VisitScheduleService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.UserModel;
using IQEApp.Web.Models.VisitProcessing;
using IQEApp.Web.Models.VisitSchedule;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Transactions;
using System.Web.Mvc;
using static Antlr.Runtime.Tree.TreeWizard;

namespace IQEApp.Web.Controllers.VisitSchedule
{
    public class VisitScheduleController : BaseController
    {

        private readonly IPurchaseOrderService _purchaseOrderService;
        private readonly ControlNumberService _controlNumberService;
        private readonly VisitScheduleService _visitScheduleService;
        private readonly IUserService _userService;

        ControlNumberBusinessModel objControlNumberBusinessModel = new ControlNumberBusinessModel();
        PurchaseOrderBusinessModel objPO = new PurchaseOrderBusinessModel();
        VisitScheduleBusinessModel objVSBusinessModel = new VisitScheduleBusinessModel();
        public VisitScheduleController()
        {
            _controlNumberService = new ControlNumberService();
            _purchaseOrderService = new PurchaseOrderService();
            _visitScheduleService = new VisitScheduleService();
            _userService = new UserService();
        }
        // GET: ScheduleVisit
        public ActionResult Index()
        {
            ControlNumberDetailsModel model = new ControlNumberDetailsModel();
            model = objControlNumberBusinessModel.GetClientDetails(CurrentUser.SiteId, _controlNumberService);
            return View(model);
        }

        public JsonResult GetAllPONumbersByClient(int clientId)
        {
            List<PONumberItemsViewModel> List = new List<PONumberItemsViewModel>();
            try
            {
                List = objPO.GetAllPONumbersByClient(clientId, _purchaseOrderService);
                return Json(List, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error occured while adding purchase order item", ex);
            }
            return null;

        }
        
        public JsonResult GetAllPONumbersByManufacturer(int manufacturerId)
        {
            List<PONumberItemsViewModel> List = new List<PONumberItemsViewModel>();
            try
            {
                List = objPO.GetAllPONumbersByManufacturer(manufacturerId, _purchaseOrderService);
                return Json(List, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error occured while adding purchase order item", ex);
            }
            return null;

        }

        public JsonResult GetMappedPONumbersByVisitId(int visitId, string SOIDs, string POItemIds)
        {
            List<PONumberItemsViewModel> List = new List<PONumberItemsViewModel>();
            try
            {
                List = objPO.GetMappedPONumbersByVisitId(visitId, SOIDs, POItemIds, _purchaseOrderService);
                return Json(List, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error occured while adding purchase order item", ex);
            }
            return null;

        }



        public JsonResult GetMatchingPONumbers1(int ClientId,string PONumber)
        {
            List<PurchaseOrderNumbersViewModel> List = new List<PurchaseOrderNumbersViewModel>();
            try
            {
                List = objPO.GetMatchingPONumbers1(ClientId, PONumber, _purchaseOrderService);
                return Json(List, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error occured while adding purchase order item", ex);
            }
            return null;

        }

        public ActionResult GetCountryStateUserDetails(int? selectedCountryId = null, int? stateId = null, string stateName = null, int? userId = null, string visitLocation = null, string visitLocationsJson = null)
        {
            var model = new PurchaseOrderDetailsModel();

            try
            {
                model = objPO.GetCountryStateUserDetails(selectedCountryId, stateId, userId, _purchaseOrderService);
                ViewBag.SelectedCountryId = selectedCountryId ?? -1;
                model.StateId = stateId;
                model.StateName = stateName;
                if (userId != null)
                    model.UserId = (int)userId;
            }

            catch (Exception ex)
            {
                errorLogObj.LogInfo(ex.Message);
                return Json(new { success = false, message = "An error occurred while fetching the purchase order details." }, JsonRequestBehavior.AllowGet);
            }

            return PartialView("_LocationSelection", model);
        }

        public ActionResult GetManufacturerLocationSection( int manufacturerId, string manufacturerName, string locationDetails=null,bool isSubManufacturer =false, string subManufacturerDetails=null, string contactNo=null, decimal? cost=0)
        {
            var model = new PurchaseOrderDetailsModel();

            try
            {
                model.LstManufacturerLocationMappings = new List<CommonModel.ManufacturerLocationMapping>
                {
                  new CommonModel.ManufacturerLocationMapping
                  {
                    ManufacturerName = manufacturerName,
                    ManufacturerId = manufacturerId,
                    LocationDetails = locationDetails,
                    IsSubManufacturer =isSubManufacturer,
                    SubManufacturerDetails= subManufacturerDetails,
                    ContactNo=contactNo,  
                    Cost=cost
                  }       
                };

                return PartialView("_ManufacturerMappingSection", model);
            }
            catch (Exception ex)
            {
                errorLogObj.LogInfo(ex.Message);
                return Json(new { success = false, message = "Failed to load mapping section." });
            }
        }


        public ActionResult GetUserDetailsByUserId(int userId)
        {
            UserBusinessModel objUserBusinessModel = new UserBusinessModel();
            UserViewModel model = new UserViewModel();
            model = objUserBusinessModel.GetUserDetailsByUserId(userId, _userService);
            return PartialView("~/Views/Operations1/_UserDetails.cshtml", model);
        }
        public ActionResult VisitDatesConfirmation(bool? editFlag,int? visitId=null, DateTime? RfiScheduleDate = null, DateTime? ScheduleDate = null, DateTime? VisitDate = null, String ScheduleComments=null, bool? ClientConf= null, bool? ManuConf =null)
        {
            VisitScheduleDetailsModel model = new VisitScheduleDetailsModel();

            if(visitId!=null)
            model.VisitId = (int)visitId;
            
            model.RFIScheduleDate = RfiScheduleDate;
            model.ScheduleDate = ScheduleDate;
            model.VisitDate = VisitDate;
            model.ScheduleComments = ScheduleComments;
            model.ClientConfirmation = ClientConf??false;
            model.ManufacturerConfirmation = ManuConf?? false;


            ViewBag.EditFlag = editFlag;
            return PartialView("_VisitDatesConfirmation", model);

        }

        [HttpPost]
        public ActionResult VisitScheduleSave(VisitScheduleDetailsModel model)
        {
            var isSuccess = false;
            var isProspective = false;
            string messageflag = "";
            model.LoginUserId = CurrentUser.UserId;
            model.SiteId = CurrentUser.SiteId;
            var VisitId = 0;

            try
            {
                // If client mapping missing, try to resolve from ControlNo via control business model
                if (model.ClientId == 0)
                {
                    var controlNo = Request.Form["ControlNo"] ?? Request.Params["ControlNo"];
                    if (!string.IsNullOrEmpty(Convert.ToString(controlNo)))
                    {
                        try
                        {
                            var visitInfo = objControlNumberBusinessModel.GetVisitDetails(null, Convert.ToString(controlNo), CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
                            if (visitInfo != null && visitInfo.ControlNumberDetailsModel != null)
                            {
                                if (model.ClientId == 0)
                                    model.ClientId = visitInfo.ControlNumberDetailsModel.ClientId;
                            }
                        }
                        catch (Exception ex)
                        {
                            errorLogObj.LogInfo("Failed to resolve client mapping from ControlNo: " + ex.Message);
                        }
                    }
                }

                using (TransactionScope Transcope = new TransactionScope())
                {
                    try
                    {
                        VisitId = objVSBusinessModel.VisitScheduleSave(model, _visitScheduleService);

                        if (VisitId == -1)
                        {
                            isSuccess = false;
                            messageflag = "Duplicate";
                        }
                        else if (VisitId > 0)
                        {
                            isSuccess = true;
                            messageflag = "Success";
                        }

                        if (model.VisitDate > DateTime.Today.AddDays(1))
                            isProspective = true;

                        Transcope.Complete();
                    }
                    catch (TransactionException ex)
                    {
                        // Optional: log ex
                    }
                }

                return Json(new { status = isSuccess, isProspective, message = messageflag }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occurred on scheduling new visit: " + e, e);
                return Json(new { status = false, message = "Fail" }, JsonRequestBehavior.AllowGet);
            }
        }


        public ActionResult EditVisitScheduleByVID(int VisitId)
        {
            try
            {
                // Fetch the full visit details for editing
                VisitScheduleDetailsModel model = objVSBusinessModel.EditVisitScheduleByVID(VisitId, _visitScheduleService);

                model.VisitId = VisitId;
                // Resolve state ID from state name if necessary
                if (model.LstStates != null && model.LstStates.Any())
                {
                    if (model.StateId == 0 && !string.IsNullOrEmpty(model.StateName))
                    {
                        var matchedState = model.LstStates
                            .FirstOrDefault(s => s.StateName.Equals(model.StateName, StringComparison.OrdinalIgnoreCase));
                        if (matchedState != null)
                        {
                            model.StateId = matchedState.StateId;
                        }
                    }

                    ViewBag.States = new SelectList(model.LstStates, "StateId", "StateName", model.StateId);
                }
                else
                {
                    ViewBag.States = new SelectList(Enumerable.Empty<object>(), "StateName", "StateName", model.StateName);
                }

                return View("EditVisitSchedule", model);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("Edit schedule visits fetch error: " + e.Message, e);
                throw;
            }
        }

        [HttpPost]
        public ActionResult VisitScheduleUpdate(VisitScheduleDetailsModel model)
        {
            var isSuccess = false;
            var isProspective = false;
            string messageflag = "";
            model.LoginUserId = CurrentUser.UserId;
            model.SiteId = CurrentUser.SiteId;
            var VisitId = 0;

            try
            {
                // If client mapping missing on update, try resolve from ControlNo
                if (model.ClientId == 0)
                {
                    var controlNo = Request.Form["ControlNo"] ?? Request.Params["ControlNo"];
                    if (!string.IsNullOrEmpty(Convert.ToString(controlNo)))
                    {
                        try
                        {
                            var visitInfo = objControlNumberBusinessModel.GetVisitDetails(null, Convert.ToString(controlNo), CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
                            if (visitInfo != null && visitInfo.ControlNumberDetailsModel != null)
                            {
                                if (model.ClientId == 0)
                                    model.ClientId = visitInfo.ControlNumberDetailsModel.ClientId;
                            }
                        }
                        catch (Exception ex)
                        {
                            errorLogObj.LogInfo("Failed to resolve client mapping from ControlNo on update: " + ex.Message);
                        }
                    }
                }

                using (TransactionScope Transcope = new TransactionScope())
                {
                    try
                    {
                        VisitId = objVSBusinessModel.VisitScheduleUpdate(model, _visitScheduleService);

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

        // New: Resolve client mapping by ControlNo for UI consumption
        public JsonResult GetClientMappingByControlNo(string controlNo)
        {
            try
            {
                if (string.IsNullOrEmpty(controlNo))
                    return Json(new { success = false }, JsonRequestBehavior.AllowGet);

                var visitInfo = objControlNumberBusinessModel.GetVisitDetails(null, controlNo, CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
                if (visitInfo != null && visitInfo.ControlNumberDetailsModel != null)
                {
                    return Json(new
                    {
                        success = true,
                        clientId = visitInfo.ControlNumberDetailsModel.ClientId,
                        clientUnitId = visitInfo.ControlNumberDetailsModel.ClientUnitId,
                        soId = visitInfo.ControlNumberDetailsModel.SOId
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("GetClientMappingByControlNo error: " + ex.Message, ex);
            }

            return Json(new { success = false }, JsonRequestBehavior.AllowGet);
        }

    }
}