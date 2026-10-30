using IQEApp.Service.ClientService;
using IQEApp.Service.CommonService;
using IQEApp.Service.ControlNumberService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.ServiceOrderModel;
using System;
using System.Collections.Generic;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers
{
    public class CommonController : BaseController
    {
        private readonly ICommonDetailService _commonDetailService;
        private readonly IClientService _clientService;
        private readonly IControlNumberService _controlNumberService;
        CommonDetailsBusinessModel objCommonDetailsBusinessModel = new CommonDetailsBusinessModel();
        public CommonController()
        {
            _commonDetailService = new CommonDetailService();
            _clientService = new ClientService();
            _controlNumberService=  new ControlNumberService();
        }
        //
        // GET: /Common/
        public ActionResult LoadSubMenu()
        {
            return PartialView("_SubMenu");
        }

        public ActionResult LoadCommonDetails(string visitGuid, string controlNumberGuid, int ServiceOrderId)
        {
            var vstGuid = new Guid(); var cnGuid = new Guid();

            //  Guid? guid = Guid.Empty;
            if (visitGuid == "")
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
            if (objCommonDetailsViewModel.LstPurchaseOrderItems.Count > 0)
            {
                ViewBag.IsBlockEquipmentItem = true;
            }
            return PartialView("_CommonDetails", objCommonDetailsViewModel);
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
            ViewBag.EditMode = false;
            return PartialView("_CommonDetailsForScheduleVisit", objCommonDetailsViewModel);
        }


        public ActionResult GetControlNumbersByClientUnitId(int clientUnitId)
        {
            var controlNumbers = objCommonDetailsBusinessModel.GetControlNumbersByClientUnitId(clientUnitId, 0, -1, _controlNumberService);
            return Json(controlNumbers, JsonRequestBehavior.AllowGet);
        }
        public ActionResult GetControlNumbersByManufacturerId(int manufacturerId)
        {
            var controlNumbers = objCommonDetailsBusinessModel.GetControlNumbersByManufacturerId(manufacturerId, 0, -1, _controlNumberService);
            return Json(controlNumbers, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetSONumbersByControlId11(int controlNumber)
        {
            var SONumbers = objCommonDetailsBusinessModel.GetSONumbersByControlId(controlNumber, 0, -1, _controlNumberService);
            return Json(SONumbers, JsonRequestBehavior.AllowGet);
        }
        [HttpPost]
        public ActionResult GetSONumbersByControlId(int controlNumber)
        {
            var soNumbers = objCommonDetailsBusinessModel
                .GetSONumbersByControlId(controlNumber, 0, -1, _controlNumberService);

            return Json(new
            {
                LstServiceOrdersList = soNumbers
            }, JsonRequestBehavior.AllowGet);
        }
        public ActionResult GetClientDetailsByControlNo(string controlNumber)
        {
            var clientUnits = objCommonDetailsBusinessModel.GetClientDetailsByControlNo(controlNumber, 1, true, _clientService);
            return Json(clientUnits, JsonRequestBehavior.AllowGet);
        }
        public ActionResult GetClientDetailsByControlNo1(string controlNumber)
        {
            var clientUnits = objCommonDetailsBusinessModel.GetClientDetailsByControlNo1(controlNumber, 1, true, _clientService);
            return Json(clientUnits, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetPODetailsForScheduleVisit(int manufacturerUnitId, int ServiceOrderId)
        {
            CommonDetailsViewModel objCommonDetailsViewModel = new CommonDetailsViewModel();
            objCommonDetailsViewModel = objCommonDetailsBusinessModel.GetPODetailsForScheduleVisit(manufacturerUnitId, ServiceOrderId, _commonDetailService);
            objCommonDetailsViewModel.PurchaseOrderDetails = new PurchaseOrderViewModel();
            return PartialView("_POListForSelection", objCommonDetailsViewModel);
        }
        public ActionResult LoadCommonDetailsForVisit(string visitGuid, string controlNumberGuid, int ServiceOrderId)
        {
            var vstGuid = new Guid(); var cnGuid = new Guid();

            //  Guid? guid = Guid.Empty;
            if (visitGuid == "")
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
            objCommonDetailsViewModel = objCommonDetailsBusinessModel.LoadCommonDetailsForViewVisit(vstGuid, cnGuid, ServiceOrderId, CurrentUser.UserId, _commonDetailService);
            if (objCommonDetailsViewModel.LstPurchaseOrderItems.Count > 0)
            {
                ViewBag.IsBlockEquipmentItem = true;
            }
            return PartialView("_CommonDetailsForViewVisit", objCommonDetailsViewModel);
        }
        public ActionResult GetStateDetailsByCountryId(int countryId)
        {
            List<CommonModel.StateModel> stateList = new List<CommonModel.StateModel>();
            try
            {
                stateList = objCommonDetailsBusinessModel.GetStateListByCountryId(countryId, _commonDetailService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("fetching visit list for invoice", e);
            }

            return Json(stateList, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetServiceOrderDetailsByClientDetailsJson(int clientId, int clientUnitId)
        {
            List<ServiceOrderViewModel> objServiceOrderList = new List<ServiceOrderViewModel>();
            try
            {
                objServiceOrderList = objCommonDetailsBusinessModel.GetServiceOrderDetailsByClientDetails(clientId, clientUnitId, _commonDetailService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("fetching service order  list for invoice", e);
            }

            return Json(objServiceOrderList, JsonRequestBehavior.AllowGet);
        }
    }
}