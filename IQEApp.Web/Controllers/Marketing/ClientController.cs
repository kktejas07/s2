using IQEApp.Service.ClientService;
using IQEApp.Service.SecurityService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Client
{
    //[CustomAuthorize(Roles = "Super Admin Role, Admin Role, Technician Role, Coordinator Role, Quality Check Role, Finance Role")]
    public class Client1Controller : BaseController
    {
        private readonly IClientService _clientService;
        private readonly ISecurityService _securityService;

        public Client1Controller()
        {
            _clientService = new ClientService();
            _securityService = new SecurityService();
            //SingletonScreenFeatureMapping.SetScreenFeatureMapping(CurrentUser.RoleId.FirstOrDefault(), _securityService);
        }
        //
        // GET: /Client/
        ClientBusinessModel objClientBusinessModel = new ClientBusinessModel();
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.SalesClients, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<ClientViewModel> lst = new List<ClientViewModel>();
                try
                {
                    lst = objClientBusinessModel.GetAllClientDetails(CurrentUser.SiteId, "", "", 0, 10, true, "ASC", _clientService);
                    ViewBag.Total = lst.FirstOrDefault().Total;
                    ViewBag.CurrentPageCount = 10;
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Add Client", ex);
                }
                return View("Index", lst);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        #region Client
        public ActionResult GetClientsList(int pageCount = 0, string strSearch = "", string alphaSearch = "", bool activeStatus = true, string sortingOrder = "ASC")
        {
            List<ClientViewModel> list = new List<ClientViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            try
            {
                list = objClientBusinessModel.GetAllClientDetails(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, sortingOrder, _clientService);
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
                errorLogObj.LogError("Add Client", ex);
            }
            return PartialView("_ClientDirectory", list);
        }
        public ActionResult AddClient()
        {
            try
            {
                ClientDetailsModel objClientDetailsModel = new ClientDetailsModel();
                ClientBusinessModel objClientBusinessModel = new ClientBusinessModel();
                //To fetch all the values to fill drop down
                objClientDetailsModel = objClientBusinessModel.GetClientDetailsToAdd(CurrentUser.SiteId, _clientService);
                return PartialView("_AddNewClient", objClientDetailsModel);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Add Client", ex);
            }
            return null;
        }

        public ActionResult CreateClient(ClientViewModel objCVM)
        {
            var isSuccess = false;
            try
            {
                objCVM.CreatedBy = CurrentUser.UserId;
                objCVM.SiteId = CurrentUser.SiteId;
                if (!objClientBusinessModel.ValidateClient(objCVM, _clientService))
                {
                    var cId = objClientBusinessModel.CreateClient(objCVM, _clientService);
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
                errorLogObj.LogError("Add Client", ex);
            }

            return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        }
        public ActionResult EditClient(Guid clientGuid)
        {
            ClientDetailsModel objClientDetailsModel = new ClientDetailsModel();
            var isSuccess = false;
            try
            {
                objClientDetailsModel = objClientBusinessModel.GetClientDetailsToEdit(clientGuid, CurrentUser.SiteId, _clientService);
                return PartialView("_EditClient", objClientDetailsModel);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Add Client", ex);
            }

            return Json(new { message = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult UpdateClient(ClientViewModel objCVM)
        {
            var isSuccess = false;
            var response = "";
            try
            {
                objCVM.LoggedInUser = CurrentUser.UserId;
                objCVM.SiteId = CurrentUser.SiteId;
                if (!objClientBusinessModel.ValidateClient(objCVM, _clientService))
                {
                    var cId = objClientBusinessModel.UpdateClientDetails(objCVM, _clientService);
                    isSuccess = true;
                }
                else
                {
                    response = "duplicate";
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while updating client", ex);
                isSuccess = false;
            }

            return Json(new { status = isSuccess, message = response }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult UpdateClientStatus(Guid clientGuid, bool status)
        {
            var isSuccess = false;
            try
            {
                var cId = objClientBusinessModel.UpdateClientStatus(clientGuid, status, CurrentUser.UserId, _clientService);
                isSuccess = true;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while deleting client", ex);
                isSuccess = false;
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        //public ActionResult GetClientSearchList(int pageCount = 0, string strSearch = "")
        //{
        //    List<ClientViewModel> lst = new List<ClientViewModel>();
        //    var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
        //    try
        //    {
        //        lst = objClientBusinessModel.GetClientSearchList(CurrentUser.SiteId, strSearch, pageCount, defaultFetchCount, _clientService);
        //        ViewBag.Total = lst.FirstOrDefault().Total;
        //        pageCount += defaultFetchCount;
        //        ViewBag.CurrentPageCount = pageCount;
        //    }
        //    catch (Exception ex)
        //    {
        //        errorLogObj.LogError("Get Client Search List", ex);
        //    }
        //    return PartialView("_ClientDirectory", lst);
        //}
        #endregion


        #region ClientUnits

        public ActionResult GetClientUnitsByClientId(int clientId, int pageCount = 0)
        {
            List<ClientUnitsViewModel> model = new List<ClientUnitsViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            try
            {
                //_ClientUnitsList
                model = objClientBusinessModel.GetClientUnitsByClientId(clientId, pageCount, defaultFetchCount, _clientService);
                //ViewBag.Total = model.FirstOrDefault().Total;
                //pageCount += defaultFetchCount;
                //ViewBag.CurrentPageCount = pageCount;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while fetching client units by clientId: " + clientId, ex);
            }

            return PartialView("_ClientUnitsList", model);
        }
        public ActionResult AddClientUnit(int clientId)
        {
            try
            {
                ClientUnitsDetailsModel objCUDM = new ClientUnitsDetailsModel();
                objCUDM = objClientBusinessModel.GetClientUnitToAdd(_clientService);
                objCUDM.ClientId = clientId;
                return PartialView("_AddClientUnits", objCUDM);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while adding Client Unit" + ex, ex);
            }
            return null;
        }

        [HttpPost]
        public ActionResult CreateClientUnit(ClientUnitsViewModel objClientUnitsViewModel)
        {
            var isSuccess = false;
            var msg = "";
            try
            {
                objClientUnitsViewModel.CreatedBy = CurrentUser.UserId;
                if (!objClientBusinessModel.ValidateClientUnit(objClientUnitsViewModel, _clientService))
                {
                    var unitId = objClientBusinessModel.AddClientUnit(objClientUnitsViewModel, _clientService);
                    isSuccess = true;
                    return Json(new { status = isSuccess, message = msg, clientUnitId = unitId }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    msg = "duplicate";
                }
            }
            catch (Exception ex)
            {
                msg = "error";
                errorLogObj.LogError("Error occured while adding Client Unit" + ex, ex);
            }
            return Json(new { status = isSuccess, message = msg }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult EditClientUnit(Guid clientUnitGuid)
        {
            try
            {
                ClientUnitsDetailsModel objCUVM = new ClientUnitsDetailsModel();
                objCUVM = objClientBusinessModel.GetClientUnitToEdit(clientUnitGuid, _clientService);
                return PartialView("_EditClientUnit", objCUVM);
            }
            catch (Exception ex)
            {

                errorLogObj.LogError("Error occured while editing Client Unit" + ex, ex);
            }

            return null;
        }

        public ActionResult UpdateClientUnit(ClientUnitsViewModel objClientUnitsViewModel)
        {
            var isSuccess = false;
            var msg = "";
            try
            {
                objClientUnitsViewModel.LoggedInUser = CurrentUser.UserId;
                if (!objClientBusinessModel.ValidateClientUnit(objClientUnitsViewModel, _clientService))
                {
                    isSuccess = objClientBusinessModel.UpdateClientUnitDetails(objClientUnitsViewModel, _clientService);
                }
                else
                {
                    msg = "duplicate";
                }
                //return PartialView("_EditClientUnit", objClientUnitsViewModel);
            }
            catch (Exception ex)
            {
                msg = "error";
                errorLogObj.LogError("Error occured while updating Client Unit" + ex, ex);
            }
            return Json(new { status = isSuccess, message = msg }, JsonRequestBehavior.AllowGet);
        }
        public ActionResult InactivateClientUnit(Guid clientUnitGuid)
        {
            var isSuccess = false;
            try
            {
                var cId = objClientBusinessModel.InactivateClientUnit(clientUnitGuid, CurrentUser.UserId, _clientService);
                isSuccess = true;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while deleting client", ex);
                isSuccess = false;
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetClientUnitDetailsByUnitId(int unitId)
        {
            ClientUnitsViewModel clientUnitDetails = new ClientUnitsViewModel();
            try
            {
                clientUnitDetails = objClientBusinessModel.GetClientUnitDetailsByUnitId(unitId, _clientService);
                return PartialView("_ViewClientDetails", clientUnitDetails);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while fetching client units by unitId: " + unitId, ex);
            }
            return null;
            //return Json(new { clientUnitDetails }, JsonRequestBehavior.AllowGet);
        }
        #endregion

    }
}