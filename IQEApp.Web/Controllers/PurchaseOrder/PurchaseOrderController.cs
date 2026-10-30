using DocumentFormat.OpenXml.EMMA;
using IQEApp.Service.ClientService;
using IQEApp.Service.ManufacturerService;
using IQEApp.Service.PurchaseOrder;
using IQEApp.Service.ControlNumberService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.ControlNumberModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.PurchaseOrder
{
    //[CustomAuthorize(Roles = "Super Admin Role, Admin Role, Coordinator Role, Finance Role")]
    public class PurchaseOrderController : BaseController
    {
        private readonly IPurchaseOrderService _purchaseOrderService;
        private readonly IClientService _clientService;
        private readonly IManufacturerService _manufacturerService;
        private readonly ControlNumberService _controlNumberService;

        PurchaseOrderBusinessModel objPO = new PurchaseOrderBusinessModel();
        ClientBusinessModel objClientBusinessModel = new ClientBusinessModel();
        ManufacturerBusinessModel objManufacturerBusinessModel = new ManufacturerBusinessModel();
        ControlNumberBusinessModel objControlNumberBusinessModel = new ControlNumberBusinessModel();

        public PurchaseOrderController()
        {
            _purchaseOrderService = new PurchaseOrderService();
            _clientService = new ClientService();
            _manufacturerService = new ManufacturerService();
            _controlNumberService = new ControlNumberService();
        }
        //
        // GET: /PurchaseOrder/
        public ActionResult PurchaseOrders()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsPurchaseOrders, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<PurchaseOrderViewModel> lstModel = new List<PurchaseOrderViewModel>();
                try
                {
                    lstModel = objPO.GetPurchaseOrders(CurrentUser.SiteId, "", "", 0, 10, true, "DESC","","", _purchaseOrderService);
                    ViewBag.Total = lstModel.Any() ? lstModel.FirstOrDefault().Total : 0;
                    ViewBag.CurrentPageCount = 10;
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("error occured while fetching purchase orders", ex);
                }
                return View("PurchaseOrdersDetails", lstModel);
               }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        #region PurchseOrders

        public ActionResult NewPurchaseOrder()
        {
            PurchaseOrderDetailsModel model = new PurchaseOrderDetailsModel();
            model = objPO.GetPurchaseOrderDetailsToAdd(CurrentUser.SiteId, _purchaseOrderService);
            model.LstClients = new List<ClientViewModel>();
            model.LstClientUnits = new List<ClientUnitsViewModel>();
           // model.LstManufacturers = new List<ManufacturerViewModel>();
            model.LstManufacturerUnits = new List<ManufacturerUnitsViewModel>();
            model.LstPurchaseOrderNumbers = new List<PurchaseOrderNumbersViewModel>();
            return PartialView("_AddNewPO", model);
        }


        public ActionResult GetClientDetailsByControlNo(string controlNumber)
        {
            var clientUnits = objClientBusinessModel.GetClientDetailsByControlNo(controlNumber, 1, true, _clientService);
            return Json(clientUnits, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetManufacturersList()
        {
            var manufacturers = objManufacturerBusinessModel.GetManufacturersList(1, _manufacturerService);
            return Json(manufacturers, JsonRequestBehavior.AllowGet);
        }
        public ActionResult GetClientUnitsByClientId(int ClientId)
        {
            var clientUnits = objClientBusinessModel.GetClientUnitsByClientId(ClientId, 0, -1, _clientService);
            return Json(clientUnits, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetClientUnitsByClientName(string clientName)
        {
            var clientUnits = objClientBusinessModel.GetClientUnitsByClientName(clientName, 0, -1, _clientService);
            return Json(clientUnits, JsonRequestBehavior.AllowGet);
        }
        public ActionResult GetManufacturerUnitsByManufacturerId(int manufacturerId)
        {
            var manufacturerUnits = objManufacturerBusinessModel.GetManufacturerUnitsListByManufacturer(manufacturerId, _manufacturerService);
            return Json(manufacturerUnits, JsonRequestBehavior.AllowGet);
        }
        public ActionResult GetManufacturerUnitsByManufacturerIdForPO(int manufacturerId)
        {
            var manufacturerUnits = objManufacturerBusinessModel.GetManufacturerUnitsListByManufacturer(manufacturerId, _manufacturerService);
            return PartialView("_manufacturerUnitdetailsforpo", manufacturerUnits);
            //return Json(manufacturerUnits, JsonRequestBehavior.AllowGet);
        }
        public ActionResult GetManufacturerUnitsByForPO(string manufacturerIds)
        {
            var manufacturerUnits = objManufacturerBusinessModel.GetManufacturerUnitsListByManufacturerList(manufacturerIds, CurrentUser.UserId, _manufacturerService);
            return PartialView("_manufacturerUnitdetailsforpo", manufacturerUnits);
            //return Json(manufacturerUnits, JsonRequestBehavior.AllowGet);
        }
        [HttpPost]
        public ActionResult SavePurchaseOrder1(PurchaseOrderDetailsModel model)
        {
            var isSuccess = false;
            var msg = "";
            var POId = 0;
            var poNumberDetailsList = new List<PONumberDetailDTO>();

            try
            {
                model.SiteId = CurrentUser.SiteId;
                model.LoggedInUser = CurrentUser.UserId;

                // Ensure client mapping is present: if missing, try to resolve from ControlNo
                if ((model.ClientId == 0 || model.ClientUnitId == 0) && !string.IsNullOrEmpty(model.ControlNo))
                {
                    try
                    {
                        var visitInfo = objControlNumberBusinessModel.GetVisitDetails(null, model.ControlNo, CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
                        if (visitInfo != null && visitInfo.ControlNumberDetails != null)
                        {
                            if (model.ClientId == 0)
                                model.ClientId = visitInfo.ControlNumberDetails.ClientId;
                            if (model.ClientUnitId == 0 && visitInfo.ClientUnitDetails != null)
                                model.ClientUnitId = visitInfo.ClientUnitDetails.ClientUnitId;
                        }
                    }
                    catch (Exception ex)
                    {
                        errorLogObj.LogInfo("Failed to resolve client mapping from ControlNo while saving PO: " + ex.Message);
                    }
                }

                bool flag = true;

                foreach (var obj in model.LstPurchaseOrderNumbers)
                {
                    if (!string.IsNullOrWhiteSpace(obj.PONumber))
                    {
                        bool isDuplicate = _purchaseOrderService.IsPurchaseOrderExistsAlready(model.POId, obj.PONumber, obj.ManufacturerId, model.ControlNo, model.ClientId, model.ClientUnitId);

                        if (isDuplicate)
                        {
                            flag = false;
                            msg = "Duplicate PO Number exists for the same Client, Control and Manufacturer.";
                            break;
                        }
                    }
                }


                if (flag)
                {
                    PurchaseOrderNumbersViewModel model1 = new PurchaseOrderNumbersViewModel();
                    // call your business logic
                    var result = objPO.CreateNewPO(model, model1, _purchaseOrderService);

                    POId = result.POId;
                    poNumberDetailsList = result.Item2.Select(t => new PONumberDetailDTO
                    {
                        PONID = t.Item1,
                        ManufacturerId = t.Item2
                    }).ToList();

                    isSuccess = true;
                }
            }
            catch (Exception ex)
            {
                msg = "error";
                errorLogObj.LogError("Error occurred while saving new purchase order", ex);
            }

            return Json(new
            {
                status = isSuccess,
                message = msg,
                PurchaseOrderId = POId,
                PONumberDetailsList = poNumberDetailsList
            }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetManufacturerDetails(int manufacturerId)
        {
            PurchaseOrderBusinessModel objPurchaseOrderBusinessModel = new PurchaseOrderBusinessModel();
            PurchaseOrderNumbersViewModel model = new PurchaseOrderNumbersViewModel();
            model = objPurchaseOrderBusinessModel.GetManufacturerDetails(manufacturerId, _purchaseOrderService);
            return PartialView("~/Views/PurchaseOrder/_AddPONumber.cshtml", model);
        }

        public ActionResult GetManufacturerDetailsToEditPONumbers(int manufacturerId, int POId, int PONId)
        {
            PurchaseOrderBusinessModel objPurchaseOrderBusinessModel = new PurchaseOrderBusinessModel();
            PurchaseOrderNumbersViewModel model = new PurchaseOrderNumbersViewModel();
            model = objPurchaseOrderBusinessModel.GetManufacturerDetailsToEditPONumbers(manufacturerId, POId, _purchaseOrderService);
            //model.PONId = PONId;
            return PartialView("~/Views/PurchaseOrder/_EditPONumber.cshtml", model);
        }


        public ActionResult GetManufacturerDetailsToEditPONumbers1(int manufacturerId, int PONId)
        {
            PurchaseOrderBusinessModel objPurchaseOrderBusinessModel = new PurchaseOrderBusinessModel();
            PurchaseOrderNumbersViewModel model = new PurchaseOrderNumbersViewModel();
            model = objPurchaseOrderBusinessModel.GetManufacturerDetails(manufacturerId, _purchaseOrderService);
            if (model.PONGuid == null || model.PONGuid == Guid.Empty)
                model.PONGuid = Guid.NewGuid();
            ViewBag.AddNewManufacturer = 1;
            //model.PONId = PONId;
            return PartialView("~/Views/PurchaseOrder/_EditPONumber.cshtml", model);
        }

    
        public ActionResult GetPurchaseOrders1(int pageCount = 0, string strSearch = "", string alphaSearch = "", bool activeStatus = true, string sortingOrder = "DESC" , string fiYear="", string searchColumn = "")
        {
            List<PurchaseOrderViewModel> lstModel = new List<PurchaseOrderViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            try
            {
                lstModel = objPO.GetPurchaseOrders(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, sortingOrder, fiYear, searchColumn,_purchaseOrderService);
                ViewBag.Total = lstModel.Any() ? lstModel.FirstOrDefault().Total : 0;
                pageCount += defaultFetchCount;
                ViewBag.CurrentPageCount = pageCount;
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error occured while fetching purchase orders", ex);
            }
            return PartialView("_PurchaseOrdersList", lstModel);
        }

        public ActionResult GetPurchaseOrders(int pageCount = 0, string strSearch = "", string alphaSearch = "", bool activeStatus = true, string sortingOrder = "DESC", string fiYear = "", string searchColumn = "")
        {
            List<PurchaseOrderViewModel> lstModel = new List<PurchaseOrderViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            int totalCount = 0;
            int currentPageCount = 0;

            try
            {
                lstModel = objPO.GetPurchaseOrders(CurrentUser.SiteId, strSearch, alphaSearch, pageCount, defaultFetchCount, activeStatus, sortingOrder, fiYear, searchColumn, _purchaseOrderService);
                ViewBag.Total= totalCount = lstModel.Any() ? lstModel.FirstOrDefault().Total : 0;
                pageCount += defaultFetchCount;
                currentPageCount = pageCount;

                string htmlString = RenderPartialViewToString(this, "_PurchaseOrdersList", lstModel);

                return Json(new
                {
                    success = true,
                    html = htmlString,
                    totalCount = totalCount,
                    currentPageCount = currentPageCount
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occurred while fetching purchase orders", ex);
                return Json(new { success = false, message = "Error occurred." }, JsonRequestBehavior.AllowGet);
            }
        }

        public static string RenderPartialViewToString(Controller controller, string viewName, object model)
        {
            controller.ViewData.Model = model;
            using (var sw = new StringWriter())
            {
                var viewResult = ViewEngines.Engines.FindPartialView(controller.ControllerContext, viewName);
                var viewContext = new ViewContext(controller.ControllerContext, viewResult.View, controller.ViewData, controller.TempData, sw);
                viewResult.View.Render(viewContext, sw);
                return sw.GetStringBuilder().ToString();
            }
        }


        public ActionResult EditPurchaseOrder(Guid purchaseOrderGuid, string ControlNoSONo, int POId,bool IsReadonly)
        {
            PurchaseOrderDetailsModel model = new PurchaseOrderDetailsModel();
            try
            {
                model = objPO.GetPurchaseOrderDetailsToEdit(purchaseOrderGuid, ControlNoSONo,CurrentUser.SiteId, _purchaseOrderService);
                model.POId = POId;
            }
            catch (Exception ex)
            {
                errorLogObj.LogInfo("");
            }
            ViewBag.IsManufacturerReadonly = IsReadonly;
            return PartialView("_EditPurchaseOrder", model);
        }


        public ActionResult UpdatePurchaseOrder(PurchaseOrderViewModel model, bool IsReadonly)
        {
            var isSuccess = false;
            var message = "";
            string returnedPONumber = "";
            int manufacturerId = 0;

            try
            {
                model.SiteId = CurrentUser.SiteId;
                model.LoggedInUser = CurrentUser.UserId;

                // If client mapping missing on update, attempt to resolve using ControlNo
                if ((model.ClientId == 0 || model.ClientUnitId == 0) && !string.IsNullOrEmpty(model.ControlNo))
                {
                    try
                    {
                        var visitInfo = objControlNumberBusinessModel.GetVisitDetails(null, model.ControlNo, CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
                        if (visitInfo != null && visitInfo.ControlNumberDetails != null)
                        {
                            if (model.ClientId == 0)
                                model.ClientId = visitInfo.ControlNumberDetails.ClientId;
                            if (model.ClientUnitId == 0 && visitInfo.ClientUnitDetails != null)
                                model.ClientUnitId = visitInfo.ClientUnitDetails.ClientUnitId;
                        }
                    }
                    catch (Exception ex)
                    {
                        errorLogObj.LogInfo("Failed to resolve client mapping from ControlNo while updating PO: " + ex.Message);
                    }
                }

                if (model.LstPurchaseOrderNumbers != null)
                {
                    foreach (var obj in model.LstPurchaseOrderNumbers)
                    {
                        if (_purchaseOrderService.IsPurchaseOrderExistsAlready1(model.POId, obj.ManufacturerId, obj.PONGuid))
                        {
                            var result = objPO.UpdatePurchaseOrderNumbers(obj, model.ControlNoSONo, model.ClientId, model.ClientUnitId, model.POId, IsReadonly, _purchaseOrderService);

                            isSuccess = result?.Success ?? false;
                            returnedPONumber = result?.ReturnedPONumber;
                            message = "update";
                        }
                        else
                        {
                            var poNumber = objPO.AddNewPONumbersToExistingPOID(obj, model.POId, _purchaseOrderService);
                            message = "insert";
                            manufacturerId = obj.ManufacturerId;
                            returnedPONumber = poNumber.ToString();
                            isSuccess = true;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                message = "error";
                errorLogObj.LogError("error occured while saving new purchase order", ex);
            }

            return Json(new
            {
                status = isSuccess,
                message = message,
                PONumber = returnedPONumber,
                manufacturerId = manufacturerId,
                PurchaseOrderId = model.POId
            }, JsonRequestBehavior.AllowGet);
        }
        public ActionResult UpdatePurchaseOrderStatus(PurchaseOrderViewModel model)
        {
            var isSuccess = false;
            var message = "";
            try
            {
                isSuccess = objPO.UpdatePurchaseOrderStatus(model, _purchaseOrderService);
            }
            catch (Exception ex)
            {
                message = "error";
                errorLogObj.LogError("error occured while saving new purchase order", ex);
            }
            return Json(new { status = isSuccess, message = message, PurchaseOrderId = 0 }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetPurchaseOrderDetailsById(int PoId, bool IsVisitScheduleScreen = false)
        {
            PurchaseOrderViewModel model = new PurchaseOrderViewModel();
            try
            {
                model = objPO.GetPurchaseOrderDetailsById(PoId, CurrentUser.SiteId, _purchaseOrderService);
            }
            catch (Exception ex)
            {
                errorLogObj.LogInfo("");
            }

            //if (IsVisitScheduleScreen)
            //{
            //    return PartialView("~/Views/Common/_PODetailsForVisitScheduling.cshtml", model);
            //}
            return PartialView("~/Views/ServiceOrder/_PurchaseOrderDetails.cshtml", model);
        }

        //public ActionResult GetPurchaseOrderDetailsById1(int PONId, bool IsVisitScheduleScreen = false)
        //{
        //    PurchaseOrderDetailsModel model = new PurchaseOrderDetailsModel();
        //    try
        //    {
        //        model = objPO.GetPurchaseOrderDetailsById(PONId, CurrentUser.SiteId, _purchaseOrderService);
        //    }
        //    catch (Exception ex)
        //    {
        //        errorLogObj.LogInfo("");
        //    }

        //    if (IsVisitScheduleScreen)
        //    {
        //        return PartialView("~/Views/Common/_PODetailsForVisitScheduling.cshtml", model);
        //    }
        //    return PartialView("~/Views/ServiceOrder/_PurchaseOrderDetails.cshtml", model);
        //}
        #endregion

        #region Items

        public ActionResult GetItemsByPurchaseOrder(int poId)
        {
            List<PurchaseOrderItemsViewModel> List = new List<PurchaseOrderItemsViewModel>();
            try
            {
                List = objPO.GetPurchaseOrderItems(poId, CurrentUser.UserId, _purchaseOrderService);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error occured while adding purchase order item", ex);
            }

            return PartialView("_PurchaseOrderItems", List);
        }

        public ActionResult GetItemDetailsToAdd(int poId, int ponId,  string PONumber)
        {
            PurchaseOrderItemsViewModel model = new PurchaseOrderItemsViewModel();
           

            //List<PurchaseOrderNumbersViewModel> List = new List<PurchaseOrderNumbersViewModel>();
            try
            {
                model = objPO.GetPurchaseOrderNumbers(poId, ponId, PONumber, _purchaseOrderService);
                //  List = objPO.GetPurchaseOrderNumbers(poId, PONumber, _purchaseOrderService);
                model.POId = poId;
               // model.PONId = List.FirstOrDefault().PONId;
                model.PONumber = PONumber;

                return PartialView("_AddNewPOItem1", model);
            }
            catch(Exception ex)
            {
                errorLogObj.LogError("error occured while adding purchase order item", ex);
            }
            return null;
            
        }

        public ActionResult GetItemDetailsToEdit(Guid purchaseOrderGuid)
        {
            PurchaseOrderItemsViewModel model = new PurchaseOrderItemsViewModel();
            //model.POId = poId;
            //model.PONumber = PONumber;


            //PurchaseOrderItemsViewModel model = new PurchaseOrderItemsViewModel();
            try
            {
                model = objPO.GetPOItemDetailsToEdit1(purchaseOrderGuid, CurrentUser.SiteId, _purchaseOrderService);
                if (model.UOMID != 4)
                {
                    model.UOMOthers = "";
                }
                //model.POId = POId;
            }
            catch (Exception ex)
            {
                errorLogObj.LogInfo("");
            }


            return PartialView("_EditPOItem", model);


        }

        public ActionResult AddPurchaseOrderItem(PurchaseOrderItemsViewModel model)
        {
            var isSuccess = false;
            try
            {
                //model.LoggedInUser = CurrentUser.UserId;
                isSuccess = objPO.AddPurchaseOrderItem(model, _purchaseOrderService);

            }
            catch (Exception ex)
            {
                isSuccess = false;
                errorLogObj.LogError("error occured while adding purchase order item", ex);
            }

            return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult AddPurchaseOrderItem1(PurchaseOrderItemsViewModel model)
        {
            var isSuccess = false;
            try
            {
                //model.LoggedInUser = CurrentUser.UserId;
                isSuccess = objPO.AddPurchaseOrderItem(model, _purchaseOrderService);

            }
            catch (Exception ex)
            {
                isSuccess = false;
                errorLogObj.LogError("error occured while adding purchase order item", ex);
            }

            return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult UpdatePurchaseOrderItem(PurchaseOrderItemsViewModel model)
        {
            var isSuccess = false;
            try
            {
                //model.LoggedInUser = CurrentUser.UserId;
                isSuccess = objPO.UpdatePurchaseOrderItem(model, _purchaseOrderService);

            }
            catch (Exception ex)
            {
                isSuccess = false;
                errorLogObj.LogError("error occured while adding purchase order item", ex);
            }

            return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        }
        public ActionResult DeletePurchaseOrderNumber(int PONId)
        {
            var isSuccess = false;
            try
            {
                //model.LoggedInUser = CurrentUser.UserId;
                isSuccess = objPO.DeletePurchaseOrderNumber(PONId, _purchaseOrderService);

            }
            catch (Exception ex)
            {
                isSuccess = false;
                errorLogObj.LogError("error occured while deleting purchase order item", ex);
            }

            return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        }
        public ActionResult DeletePurchaseOrderItem(Guid purchaseOrderGuid)
        {
            var isSuccess = false;
            try
            {
                //model.LoggedInUser = CurrentUser.UserId;
                isSuccess = objPO.DeletePurchaseOrderItem(purchaseOrderGuid, _purchaseOrderService);

            }
            catch (Exception ex)
            {
                isSuccess = false;
                errorLogObj.LogError("error occured while deleting purchase order item", ex);
            }

            return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
        }

        public JsonResult GetMatchingPONumbers(string query)
        {
            List<PurchaseOrderNumbersViewModel> List = new List<PurchaseOrderNumbersViewModel>();
            try
            {
                // Assuming you have a method to search PO numbers from the database
                List = objPO.GetMatchingPONumbers(query, _purchaseOrderService);
                return Json(List, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("error occured while adding purchase order item", ex);
            }
            return null;

        }

       
        #endregion
    }
}