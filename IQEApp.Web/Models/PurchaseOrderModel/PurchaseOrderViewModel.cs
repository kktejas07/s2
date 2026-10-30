using AutoMapper;
using DocumentFormat.OpenXml.EMMA;
using IQEApp.Core.Extensions;
using IQEApp.Domain.ControlNumberDomain;
using IQEApp.Domain.ManufacturerDomain;
using IQEApp.Domain.PurchaseOrderDomain;
using IQEApp.Domain.UserDomain;
using IQEApp.Service.CommonService;
using IQEApp.Service.ControlNumberService;
using IQEApp.Service.ManufacturerService;
using IQEApp.Service.PurchaseOrder;
using IQEApp.Service.UserService;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.UserModel;
using IQEApp.Web.Utils;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using static Antlr.Runtime.Tree.TreeWizard;

namespace IQEApp.Web.Models.PurchaseOrderModel
{
    public class PurchaseOrderViewModel : BaseViewModel
    {
        public int POId { get; set; }
        public string PurchaseId { get; set; }
        public int PONId { get; set; }
        public Guid POGuid { get; set; }
        [DisplayName("P.O. Number")]
        [Required]
        [StringLength(30, ErrorMessage = "The value cannot exceed 30 characters. ")]
        public string PONumber { get; set; }
        [Required]
        [DisplayName("P.O. Date")]
        public DateTime? PoDate { get; set; }
        public int SiteId { get; set; }
        [DisplayName("P.O. Comments")]
        public string POComments { get; set; }
        [Required]
        public int ClientId { get; set; }
        [Required]
        public int ClientUnitId { get; set; }
        [Required]
        public int ManufacturerId { get; set; }

        public string ManufacturerIds { get; set; }

        public List<int> LstManufacturerIds { get; set; }

        [Required]
        public int ManufacturerUnitId { get; set; }
        public string ManufacturerUnitIds { get; set; }
        [Required]
        public List<int> LstManufacturerUnitIds { get; set; }
        [DisplayName("Customer Name")]
        public string ClientName { get; set; }
        public string ManufacturerName { get; set; }
        public string ClientUnitName { get; set; }
        public string ManufacturerUnitName { get; set; }
        public bool IsPOActive { get; set; }
        public int LoggedInUser { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int TotalItems { get; set; }
        public int Total { get; set; }
        public int PageCount { get; set; }

        public string ControlNo { get; set; }

        public string SONumber { get; set; }
        public string ControlNoSONo { get; set; }
        public List<PurchaseOrderViewModel> LstPurchaseOrderList { get; set; }
        public List<PurchaseOrderItemsViewModel> LstPurchaseOrderItems { get; set; }
        public List<PurchaseOrderNumbersViewModel> LstPurchaseOrderNumbers { get; set; }
        
    }

    public class PurchaseOrderDetailsModel : PurchaseOrderViewModel
    {
        public int? StateId { get; set; }
        public string StateName { get; set; }
        public List<UserViewModel> LstUsers { get; set; }
        public List<UserViewModel> LstUsers1 { get; set; }
        public List<ClientViewModel> LstClients { get; set; }
        public List<ManufacturerViewModel> LstManufacturers { get; set; }
        public List<ClientUnitsViewModel> LstClientUnits { get; set; }
        public List<ManufacturerUnitsViewModel> LstManufacturerUnits { get; set; }

        public List<CommonModel.CountryModel> LstCountries { get; set; }
        public List<CommonModel.StateModel> LstStates { get; set; }

        [DisplayName("Control No.")]

        public List<ControlNumberDetailsModel> LstControlNumber { get; set; }
        //public List<ControlNumber1> LstControlNumber1 { get; set; }
        public ClientViewModel ClientDetails { get; set; }
        public ManufacturerViewModel ManufacturerDetails { get; set; }
        public ClientUnitsViewModel ClientUnitDetails { get; set; }
        public ManufacturerUnitsViewModel ManufacturerUnitDetails { get; set; }

        public List<PurchaseOrderItemsViewModel> LstSelectedPurchaseOrderItems { get; set; }

        //public List<CommonModel.VisitLocations> LstVisitLocations { get; set; }
        public List<CommonModel.ManufacturerLocationMapping> LstManufacturerLocationMappings { get; set; }

        public List<LocationSectionRequestModel> LstLocationSectionRequests { get; set; }

    }
    public class PONumberDetailDTO
    {
        public int PONID { get; set; }
        public int ManufacturerId { get; set; }
    }

    public class LocationSectionRequestModel
    {
        public int? SelectedCountryId { get; set; }
        public int? StateId { get; set; }
        public string StateName { get; set; }
        public int? UserId { get; set; }

        public string VisitLocationsJson { get; set; }  // ✅ required for multiple visit locations
        public List<string> Manufacturers { get; set; } // ✅ required for mapping
    }


    public class PONumberItemsViewModel
    {
        public int POID { get; set; }
        public string PurchaseID { get; set; }

        public int PONID { get; set; }
        public string PONumber { get; set; }
        public DateTime? PODate { get; set; }
        public int ControlID { get; set; }
        public string ControlNo { get; set; }
        public int ClientUnitId { get; set; }
        public string ClientUnitName { get; set; }
        public int SOId { get; set; }
        public string SONumber { get; set; }
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }
        public string LocationDetails { get; set; }
        public string ContactNo { get; set; }
        public int POItemId { get; set; }
        public string POItemNo { get; set; }
        public string Description { get; set; }
        public int Quantity { get; set; }
        public int UOMId { get; set; }
        public string UOMName { get; set; }
        public int NumberOfVisits { get; set; }
        public string Remarks { get; set; }
        public string InspectionActivity { get; set; }
        public decimal? Cost { get; set; }

        public int? VisitId { get; set; }
        public int? VisitPId { get; set; }
        public string InspReportNo { get; set; }
    }

    public class UpdatePOResultModel
    {
        public string ReturnedPONumber { get; set; }
        public bool Success { get; set; }
    }

    public class PurchaseOrderBusinessModel
    {
        #region PurchaseOrder
        public List<PurchaseOrderViewModel> LstPurchaseOrders { get; set; }

        public List<PurchaseOrderNumbersViewModel> LstPurchaseOrderNumbers { get; set; }
        public PurchaseOrderDetailsModel GetPurchaseOrderDetailsToAdd(int loginUserSiteId, IPurchaseOrderService purchaseOrderService)
        {
            var dsPoDetails = purchaseOrderService.GetPurchaseOrderDetailsToAdd(loginUserSiteId);
            PurchaseOrderDetailsModel objClientDetailsModel = new PurchaseOrderDetailsModel();
            //objClientDetailsModel.LstClients = dsPoDetails.Tables[0].DataTableToList<ClientViewModel>();
            objClientDetailsModel.LstManufacturers = dsPoDetails.Tables[1].DataTableToList<ManufacturerViewModel>();
            objClientDetailsModel.LstControlNumber = dsPoDetails.Tables[2].DataTableToList<ControlNumberDetailsModel>();
            return objClientDetailsModel;
        }

        public PurchaseOrderNumbersViewModel GetManufacturerDetails(int manufacturerId, IPurchaseOrderService purchaseOrderService)
        {
            PurchaseOrderNumbersViewModel model = new PurchaseOrderNumbersViewModel();
            var manufactrerDetails = purchaseOrderService.GetManufacturerDetails(manufacturerId);
            Mapper.CreateMap<PurchaseOrderDomainModel, PurchaseOrderNumbersViewModel>();
            model = Mapper.Map<PurchaseOrderDomainModel, PurchaseOrderNumbersViewModel>(manufactrerDetails);
            return model;
        }
        public PurchaseOrderNumbersViewModel GetManufacturerDetailsToEditPONumbers(int manufacturerId, int POId, IPurchaseOrderService purchaseOrderService)
        {
            PurchaseOrderNumbersViewModel model = new PurchaseOrderNumbersViewModel();
            var manufactrerDetails = purchaseOrderService.GetManufacturerDetailsToEditPONumbers(manufacturerId, POId);
            Mapper.CreateMap<PurchaseOrderNumbersDomainModel, PurchaseOrderNumbersViewModel>();
            model = Mapper.Map<PurchaseOrderNumbersDomainModel, PurchaseOrderNumbersViewModel>(manufactrerDetails);
            return model;
        }

        public (int POId, List<Tuple<int, int>>) CreateNewPO( PurchaseOrderViewModel POVM, PurchaseOrderNumbersViewModel PONVM,  IPurchaseOrderService purchaseOrderService)
        {
            Mapper.CreateMap<PurchaseOrderViewModel, PurchaseOrderDomainModel>();
            var data = Mapper.Map<PurchaseOrderViewModel, PurchaseOrderDomainModel>(POVM);

            ConvertExtensions objConvExt = new ConvertExtensions();
            data.ManufacturerUnitIds = objConvExt.ConvertListToString(data.LstManufacturerUnitIds);
            data.PoDate = DateTime.Now;

            var POId = purchaseOrderService.AddNewPO(data);

            // Initialize the list properly
            var poNumberDetailsList = new List<Tuple<int, int>>();

            if (POId > 0 && POVM.LstPurchaseOrderNumbers != null && POVM.LstPurchaseOrderNumbers.Any())
            {
                foreach (var obj in POVM.LstPurchaseOrderNumbers)
                {
                    Mapper.CreateMap<PurchaseOrderNumbersViewModel, PurchaseOrderDomainModel>();
                    var data1 = Mapper.Map<PurchaseOrderNumbersViewModel, PurchaseOrderDomainModel>(obj);
                    data1.POId = POId;

                    // Returns Tuple<int, int> => (PONID, ManufacturerId)
                    var poResult = purchaseOrderService.AddNewPONumbers(data1);

                    if (poResult != null && poResult.Item1 > 0)
                    {
                        poNumberDetailsList.Add(new Tuple<int, int>(poResult.Item1, poResult.Item2));
                    }
                }
            }

            // Return the main POID and the list of PONumber details
            return new ValueTuple<int, List<Tuple<int, int>>>(POId, poNumberDetailsList);
        }

        //public bool ValidatePurchaseOrder(int POId, string PONumber, IPurchaseOrderService purchaseOrderService)
        //{
        //    var status = purchaseOrderService.IsPurchaseOrderExistsAlready(POId, PONumber);
        //    return status;
        //}

        public List<PurchaseOrderViewModel> GetPurchaseOrders(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fiYear, string searchColumn, IPurchaseOrderService purchaseOrderService)
        {
            var orders = purchaseOrderService.GetPurchaseOrders(siteId, strSearch, alphaChar, offset, fetch, activeStatus, sortingOrder, fiYear, searchColumn);
            Mapper.CreateMap<PurchaseOrderDomainModel, PurchaseOrderViewModel>();
            LstPurchaseOrders = orders.Select(Mapper.Map<PurchaseOrderDomainModel, PurchaseOrderViewModel>).ToList();
            return LstPurchaseOrders;
        }


        public List<PurchaseOrderNumbersViewModel> GetPONumbersByManufacturerId(string ControlNo, int ManufacturerId, IPurchaseOrderService purchaseOrderService)
        {
            var purchaseorderNumbers = purchaseOrderService.GetPONumbersByManufacturerId(ControlNo, ManufacturerId);
            Mapper.CreateMap<PurchaseOrderNumbersDomainModel, PurchaseOrderNumbersViewModel>();
            LstPurchaseOrderNumbers  = purchaseorderNumbers.Select(Mapper.Map<PurchaseOrderNumbersDomainModel, PurchaseOrderNumbersViewModel>).ToList();
            return LstPurchaseOrderNumbers;
        }


        public PurchaseOrderDetailsModel GetPurchaseOrderDetailsToEdit(Guid purchaseOrderGuid, string ControlNoSONo, int loginUserSiteId, IPurchaseOrderService purchaseOrderService)
        {
            var dsPoDetails = purchaseOrderService.GetPurchaseOrderDetailsToEdit(purchaseOrderGuid, ControlNoSONo, loginUserSiteId);
            PurchaseOrderDetailsModel objPurchaseOrderModel = new PurchaseOrderDetailsModel();

            var purchaseOrder = dsPoDetails.Tables[0].DataTableToList<ControlNumberDetailsModel>().FirstOrDefault();
            if (purchaseOrder != null) 
            { 
            objPurchaseOrderModel.POId = purchaseOrder.POId;
            objPurchaseOrderModel.POGuid = purchaseOrderGuid;
            objPurchaseOrderModel.PONId = purchaseOrder.PONId;
            objPurchaseOrderModel.ClientId = purchaseOrder.ClientId;
            objPurchaseOrderModel.ClientUnitId = purchaseOrder.ClientUnitId;
            objPurchaseOrderModel.ControlNo = purchaseOrder.ControlNo;
            objPurchaseOrderModel.ManufacturerId = purchaseOrder.ManufacturerId;
            ////objClientDetailsModel.ManufacturerUnitId = purchaseOrder.ManufacturerUnitId;
            //objClientDetailsModel.POComments = purchaseOrder.POComments;
            objPurchaseOrderModel.ControlNoSONo = purchaseOrder.ControlNoSONo;
            objPurchaseOrderModel.SONumber = purchaseOrder.SONumber;

            }
            objPurchaseOrderModel.LstControlNumber = dsPoDetails.Tables[2].DataTableToList<ControlNumberDetailsModel>();
           // objClientDetailsModel.LstControlNumber = dsPoDetails.Tables[0].DataTableToList<ControlNumberDetailsModel>();
            objPurchaseOrderModel.LstClients = dsPoDetails.Tables[0].DataTableToList<ClientViewModel>();
            objPurchaseOrderModel.LstClientUnits = dsPoDetails.Tables[0].DataTableToList<ClientUnitsViewModel>();
            //objClientDetailsModel.LstClientUnits = dsPoDetails.Tables[1].DataTableToList<ClientUnitsViewModel>();

            List<int> lstus = new List<int>();
            foreach (var unit in dsPoDetails.Tables[0].DataTableToList<ManufacturerViewModel>())
            {

                lstus.Add(unit.ManufacturerId);
                //objClientDetailsModel.LstManufacturerIds.Add(unit.ManufacturerUnitId);
            }
            objPurchaseOrderModel.LstManufacturerIds = lstus;

            objPurchaseOrderModel.LstManufacturers = dsPoDetails.Tables[1].DataTableToList<ManufacturerViewModel>();

            return objPurchaseOrderModel;
        }

        public PurchaseOrderItemsViewModel GetPOItemDetailsToEdit(int manufacturerId, string PONumber, int loginUserSiteId, IPurchaseOrderService purchaseOrderService)
        {
            var dsPoItemDetails = purchaseOrderService.GetPOItemDetailsToEdit(manufacturerId, PONumber, loginUserSiteId);
            PurchaseOrderItemsViewModel objPurchaseOrderItemsViewModel = new PurchaseOrderItemsViewModel();

            var purchaseOrder = dsPoItemDetails.Tables[0].DataTableToList<PurchaseOrderItemsViewModel>().FirstOrDefault();
            objPurchaseOrderItemsViewModel.PONumber = purchaseOrder.PONumber;
            objPurchaseOrderItemsViewModel.POItemId = purchaseOrder.POItemId;
            objPurchaseOrderItemsViewModel.POItemNo = purchaseOrder.POItemNo;
            objPurchaseOrderItemsViewModel.Description = purchaseOrder.Description;
            objPurchaseOrderItemsViewModel.Quantity = purchaseOrder.Quantity;
            objPurchaseOrderItemsViewModel.NumberOfVisits = purchaseOrder.NumberOfVisits;
            objPurchaseOrderItemsViewModel.Remarks = purchaseOrder.Remarks;
            return objPurchaseOrderItemsViewModel;

        }
        public PurchaseOrderItemsViewModel GetPOItemDetailsToEdit1(Guid purchaseOrderGuid, int loginUserSiteId, IPurchaseOrderService purchaseOrderService)
        {
            var dsPoItemDetails = purchaseOrderService.GetPOItemDetailsToEdit1(purchaseOrderGuid, loginUserSiteId);
            PurchaseOrderItemsViewModel objPurchaseOrderItemsViewModel = new PurchaseOrderItemsViewModel();

            var purchaseOrder = dsPoItemDetails.Tables[0].DataTableToList<PurchaseOrderItemsViewModel>().FirstOrDefault();
            objPurchaseOrderItemsViewModel.PONumber = purchaseOrder.PONumber;
            objPurchaseOrderItemsViewModel.POItemId = purchaseOrder.POItemId;
            objPurchaseOrderItemsViewModel.POItemNo = purchaseOrder.POItemNo;
            objPurchaseOrderItemsViewModel.Description = purchaseOrder.Description;
            objPurchaseOrderItemsViewModel.Quantity = purchaseOrder.Quantity;
            objPurchaseOrderItemsViewModel.UOMID = purchaseOrder.UOMID;
            objPurchaseOrderItemsViewModel.UOMName = purchaseOrder.UOMName;
            objPurchaseOrderItemsViewModel.UOMOthers = purchaseOrder.UOMOthers;
            objPurchaseOrderItemsViewModel.NumberOfVisits = purchaseOrder.NumberOfVisits;
            objPurchaseOrderItemsViewModel.Remarks = purchaseOrder.Remarks;
            objPurchaseOrderItemsViewModel.LstUOM = dsPoItemDetails.Tables[1].DataTableToList<CommonModel.UnitOfMeasurment>();
            return objPurchaseOrderItemsViewModel;

        }


        public bool UpdatePurchaseOrder(PurchaseOrderViewModel POVM, IPurchaseOrderService purchaseOrderService)
        {
            Mapper.CreateMap<PurchaseOrderViewModel, PurchaseOrderDomainModel>();
            var data = Mapper.Map<PurchaseOrderViewModel, PurchaseOrderDomainModel>(POVM);
            var status = purchaseOrderService.UpdatePurchaseOrder(data);
            return status;
        }

        //public bool UpdatePurchaseOrderNumbers1(PurchaseOrderNumbersViewModel POVM, string ControlNo, int ClientId, int ClientUnitId ,int POId, bool IsReadonly, IPurchaseOrderService purchaseOrderService)
        //{
        //    Mapper.CreateMap<PurchaseOrderNumbersViewModel, PurchaseOrderNumbersDomainModel>();
        //    var data = Mapper.Map<PurchaseOrderNumbersViewModel, PurchaseOrderNumbersDomainModel>(POVM);
        //    data.POId = POId;
        //    data.ControlNo = ControlNo;
        //    data.ClientID = ClientId;
        //    data.ClientUnitId = ClientUnitId;
        //    var status = purchaseOrderService.UpdatePurchaseOrderNumbers(data, IsReadonly);
        //    return status;
        //}

        public UpdatePOResultModel UpdatePurchaseOrderNumbers(PurchaseOrderNumbersViewModel POVM, string ControlNo, int ClientId, int ClientUnitId, int POId, bool IsReadonly, IPurchaseOrderService purchaseOrderService)
        {
            Mapper.CreateMap<PurchaseOrderNumbersViewModel, PurchaseOrderNumbersDomainModel>();
            var data = Mapper.Map<PurchaseOrderNumbersViewModel, PurchaseOrderNumbersDomainModel>(POVM);
            data.POId = POId;
            data.ControlNo = ControlNo;
            data.ClientID = ClientId;
            data.ClientUnitId = ClientUnitId;

            UpdatePOResultModel model = new UpdatePOResultModel();
            var updatePurchaseOrder =   purchaseOrderService.UpdatePurchaseOrderNumbers(data, IsReadonly);
            Mapper.CreateMap<UpdatePOResultDomainModel, UpdatePOResultModel>();
            model = Mapper.Map<UpdatePOResultDomainModel, UpdatePOResultModel>(updatePurchaseOrder);
            return model;
        }


        public int AddNewPONumbersToExistingPOID(PurchaseOrderNumbersViewModel POVM,int POId, IPurchaseOrderService purchaseOrderService)
        {
            Mapper.CreateMap<PurchaseOrderNumbersViewModel, PurchaseOrderNumbersDomainModel>();
            var data = Mapper.Map<PurchaseOrderNumbersViewModel, PurchaseOrderNumbersDomainModel>(POVM);
            data.POId = POId;
            var status = purchaseOrderService.AddNewPONumbersToExistingPOID(data);
            return status;
        }
        public bool UpdatePurchaseOrderStatus(PurchaseOrderViewModel POVM, IPurchaseOrderService purchaseOrderService)
        {
            Mapper.CreateMap<PurchaseOrderViewModel, PurchaseOrderDomainModel>();
            var data = Mapper.Map<PurchaseOrderViewModel, PurchaseOrderDomainModel>(POVM);
            var status = purchaseOrderService.UpdatePurchaseOrderStatus(data);
            return status;
        }

        public PurchaseOrderDetailsModel GetPurchaseOrderDetailsById(int PoId, int siteId, IPurchaseOrderService purchaseOrderService)
        {
            PurchaseOrderDetailsModel model = new PurchaseOrderDetailsModel();
            var details = purchaseOrderService.GetPurchaseOrderDetailsById(PoId, siteId);
            if (PoId > 0)
            {
                var purchaseOrderDetails = details.Tables[0].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault();
                if (purchaseOrderDetails != null)
                {
                    model.PONumber = purchaseOrderDetails.PONumber;
                    model.PONId = purchaseOrderDetails.PONId;
                    model.PoDate = purchaseOrderDetails.PoDate;
                    model.POComments = purchaseOrderDetails.POComments;
                    model.LstPurchaseOrderItems = details.Tables[1].DataTableToList<PurchaseOrderItemsViewModel>().ToList();
                    //model.LstManufacturerUnits  = details.Tables[2].DataTableToList<ManufacturerUnitsViewModel>().ToList();
                    model.LstCountries = details.Tables[2].DataTableToList<CommonModel.CountryModel>();
                   // model.LstStates = details.Tables[2].DataTableToList<CommonModel.StateModel>();
                    model.LstStates = new List<CommonModel.StateModel>().ToList();
                    model.LstUsers = new List<UserViewModel>().ToList();
                }
            }
            return model;
        }

        public PurchaseOrderDetailsModel GetPurchaseOrderDetailsById1(List<int> PONIds, int siteId, IPurchaseOrderService purchaseOrderService)
        {
            PurchaseOrderDetailsModel model = new PurchaseOrderDetailsModel();
            var details = purchaseOrderService.GetPurchaseOrderDetailsById1(PONIds, siteId);
            if (PONIds.Count > 0)
            {
                var purchaseOrderDetails = details.Tables[0].DataTableToList<PurchaseOrderViewModel>();
                if (purchaseOrderDetails.Any())
                {
                    //model.PONumber = purchaseOrderDetails.PONumber;
                    //model.PONId = purchaseOrderDetails.PONId;
                    //model.PoDate = purchaseOrderDetails.PoDate;
                    //model.POComments = purchaseOrderDetails.POComments;

                    model.LstPurchaseOrderList = purchaseOrderDetails;
                    model.LstPurchaseOrderItems = details.Tables[1].DataTableToList<PurchaseOrderItemsViewModel>().ToList();
                    //model.LstManufacturerUnits  = details.Tables[2].DataTableToList<ManufacturerUnitsViewModel>().ToList();
                    model.LstCountries = details.Tables[2].DataTableToList<CommonModel.CountryModel>();
                    // model.LstStates = details.Tables[2].DataTableToList<CommonModel.StateModel>();
                    model.LstStates = new List<CommonModel.StateModel>().ToList();
                    model.LstUsers = new List<UserViewModel>().ToList();
        //            model.LstSelectedPurchaseOrderItems = details.Tables[3].DataTableToList<PurchaseOrderItemsViewModel>().ToList();

                    //foreach (var item in model.LstPurchaseOrderItems)
                    //{
                    //    var selectedItem = model.LstSelectedPurchaseOrderItems.FirstOrDefault(s => s.POItemNo == item.POItemNo && s.POItemId == item.POItemId);
                    //    if (selectedItem != null)
                    //    {
                    //        // Update fields with values from LstSelectedPurchaseOrderItems
                    //        item.Remarks = selectedItem.Remarks;
                    //        item.InspectionActivity = selectedItem.InspectionActivity;
                    //        item.Description = selectedItem.Description;
                    //        item.Quantity = selectedItem.Quantity;
                    //        item.NumberOfVisits = selectedItem.NumberOfVisits;

                    //        //item.IsChecked = true; // Mark as selected
                    //    }
                    //    else
                    //    {
                    //        // item.IsChecked = false; // Mark as not selected
                    //    }
                    //}

                }
            }
            return model;
        }


        public PurchaseOrderDetailsModel GetCountryStateUserDetails(int? countryId, int? StateId, int? UserId,IPurchaseOrderService purchaseOrderService)
        {
            var model = new PurchaseOrderDetailsModel();

            var details = purchaseOrderService.GetCountryStateUserDetails(countryId, StateId, UserId);
            if (details != null)
            {
                model.LstCountries = details.Tables[0].DataTableToList<CommonModel.CountryModel>();
                model.LstStates = details.Tables[1].DataTableToList<CommonModel.StateModel>();
                model.LstUsers = details.Tables[2].DataTableToList<UserViewModel>();
                model.LstUsers1 = details.Tables[3].DataTableToList<UserViewModel>();
            }
            return model;
        }


        public PurchaseOrderDetailsModel GetPurchaseOrderDetailsByIds(List<int> PONIds, int siteId, int VisitId, IPurchaseOrderService purchaseOrderService)
        {
            PurchaseOrderDetailsModel model = new PurchaseOrderDetailsModel();
            var details = purchaseOrderService.GetPurchaseOrderDetailsByIds(PONIds, siteId, VisitId);
            if (PONIds.Count > 0)
            {
                var purchaseOrderDetails = details.Tables[0].DataTableToList<PurchaseOrderViewModel>();
                if (purchaseOrderDetails.Any())
                {
                    //model.PONumber = purchaseOrderDetails.PONumber;
                    //model.PONId = purchaseOrderDetails.PONId;
                    //model.PoDate = purchaseOrderDetails.PoDate;
                    //model.POComments = purchaseOrderDetails.POComments;

                    model.LstPurchaseOrderList = purchaseOrderDetails;
                    model.LstPurchaseOrderItems = details.Tables[1].DataTableToList<PurchaseOrderItemsViewModel>().ToList();
                    //model.LstManufacturerUnits  = details.Tables[2].DataTableToList<ManufacturerUnitsViewModel>().ToList();
                    //model.LstCountries = details.Tables[2].DataTableToList<CommonModel.CountryModel>();
                    //// model.LstStates = details.Tables[2].DataTableToList<CommonModel.StateModel>();
                    //model.LstStates = new List<CommonModel.StateModel>().ToList();
                    //model.LstUsers = new List<UserViewModel>().ToList();
                    model.LstSelectedPurchaseOrderItems = details.Tables[3].DataTableToList<PurchaseOrderItemsViewModel>().ToList();

                    foreach (var item in model.LstPurchaseOrderItems)
                    {
                        var selectedItem = model.LstSelectedPurchaseOrderItems.FirstOrDefault(s => s.POItemNo == item.POItemNo && s.PONId == item.PONId);
                        if (selectedItem != null)
                        {
                            // Update fields with values from LstSelectedPurchaseOrderItems
                            item.Remarks = selectedItem.Remarks;
                            item.InspectionActivity = selectedItem.InspectionActivity;
                            item.Description = selectedItem.Description;
                            item.Quantity = selectedItem.Quantity;
                            item.NumberOfVisits = selectedItem.NumberOfVisits;

                            //item.IsChecked = true; // Mark as selected
                        }
                        else
                        {
                            // item.IsChecked = false; // Mark as not selected
                        }
                    }

                }
            }
            return model;
        }
        #endregion

        #region Items

        public List<PurchaseOrderItemsViewModel> LstPurchaseOrderItems { get; set; }
        public List<PurchaseOrderNumbersViewModel> LstPurchaseOrderNumber { get; set; }

        public List<PurchaseOrderItemsViewModel> GetPurchaseOrderItems(int purchaseOrderId, int loginUserId, IPurchaseOrderService purchaseOrderService)
        {
            var purchaseOrderItems = purchaseOrderService.GetPurchaseOrderItems(purchaseOrderId, loginUserId);
            Mapper.CreateMap<PurchaseOrderItemsDomainModel, PurchaseOrderItemsViewModel>();
            LstPurchaseOrderItems = purchaseOrderItems.Select(Mapper.Map<PurchaseOrderItemsDomainModel, PurchaseOrderItemsViewModel>).ToList();
            return LstPurchaseOrderItems;
        }


        public PurchaseOrderItemsViewModel GetPurchaseOrderNumbers(int purchaseOrderId, int PONId,string PONumber, IPurchaseOrderService purchaseOrderService)
        {
            var dsPoItemDetails = purchaseOrderService.GetPurchaseOrderNumber(purchaseOrderId, PONId, PONumber);
            PurchaseOrderItemsViewModel objPurchaseOrderItemsViewModel = new PurchaseOrderItemsViewModel();

            var purchaseOrder = dsPoItemDetails.Tables[0].DataTableToList<PurchaseOrderNumbersDomainModel>().FirstOrDefault();
            objPurchaseOrderItemsViewModel.LstUOM = dsPoItemDetails.Tables[1].DataTableToList<CommonModel.UnitOfMeasurment>();
            objPurchaseOrderItemsViewModel.POId = purchaseOrder.POId;
            objPurchaseOrderItemsViewModel.PONId = purchaseOrder.PONId;
            objPurchaseOrderItemsViewModel.PONumber = purchaseOrder.PONumber;


            return objPurchaseOrderItemsViewModel;

        }

        //public List<PurchaseOrderNumbersViewModel> GetPurchaseOrderNumbers(int purchaseOrderId, string PONumber, IPurchaseOrderService purchaseOrderService)
        //{
        //    var purchaseOrderItems = purchaseOrderService.GetPurchaseOrderNumber(purchaseOrderId, PONumber);
        //    Mapper.CreateMap<PurchaseOrderNumbersDomainModel, PurchaseOrderNumbersViewModel>();
        //    LstPurchaseOrderNumber = purchaseOrderItems.Select(Mapper.Map<PurchaseOrderNumbersDomainModel, PurchaseOrderNumbersViewModel>).ToList();
        //    return LstPurchaseOrderNumber;
        //}
        public bool AddPurchaseOrderItem(PurchaseOrderItemsViewModel model, IPurchaseOrderService purchaseOrderService)
        {
            Mapper.CreateMap<PurchaseOrderItemsViewModel, PurchaseOrderItemsDomainModel>();
            var data = Mapper.Map<PurchaseOrderItemsViewModel, PurchaseOrderItemsDomainModel>(model);
            var status = purchaseOrderService.AddPurchaseItem(data);
            return status;
        }

        public bool UpdatePurchaseOrderItem(PurchaseOrderItemsViewModel model, IPurchaseOrderService purchaseOrderService)
        {
            Mapper.CreateMap<PurchaseOrderItemsViewModel, PurchaseOrderItemsDomainModel>();
            var data = Mapper.Map<PurchaseOrderItemsViewModel, PurchaseOrderItemsDomainModel>(model);
            if (data.UOMID != 4)
                data.UOMOthers = "";
            var status = purchaseOrderService.UpdatePurchaseOrderItem(data);
            return status;
        }

        public bool DeletePurchaseOrderNumber(int PONId, IPurchaseOrderService purchaseOrderService)
        {
            var status = purchaseOrderService.DeletePurchaseOrderNumbr(PONId);
            return status;
        }
        public bool DeletePurchaseOrderItem(Guid purchaseOrderGuid, IPurchaseOrderService purchaseOrderService)
        {
            var status = purchaseOrderService.DeletePurchaseOrderItem(purchaseOrderGuid);
            return status;
        }

        public List<PurchaseOrderNumbersViewModel> GetMatchingPONumbers(string poNumber, IPurchaseOrderService purchaseOrderService)
        {
            var purchaseOrderItems = purchaseOrderService.GetMatchingPONumbers(poNumber);
            Mapper.CreateMap<PurchaseOrderNumbersDomainModel, PurchaseOrderNumbersViewModel>();
            LstPurchaseOrderNumber = purchaseOrderItems.Select(Mapper.Map<PurchaseOrderNumbersDomainModel, PurchaseOrderNumbersViewModel>).ToList();
            return LstPurchaseOrderNumber;
           // var allPONumbers = purchaseOrderService.GetMatchingPONumbers(query);
           // return allPONumbers.Where(po => po.Contains(query)).ToList();
        }
        public List<PONumberItemsViewModel> GetAllPONumbersByClient(int clientId, IPurchaseOrderService purchaseOrderService)
        {
            List<PONumberItemsViewModel> lstPurchaseOrderViewModel1 = new List<PONumberItemsViewModel>();
            var purchaseOrderItems = purchaseOrderService.GetAllPONumbersByClient(clientId);
            Mapper.CreateMap<PONumberItemsDomainModel, PONumberItemsViewModel>();
            lstPurchaseOrderViewModel1 = purchaseOrderItems.Select(Mapper.Map<PONumberItemsDomainModel, PONumberItemsViewModel>).ToList();
            return lstPurchaseOrderViewModel1;

            //return purchaseOrderService.GetAllPONumbersByClient(clientId);
        }
        public List<PONumberItemsViewModel> GetAllPONumbersByManufacturer(int manufactureId, IPurchaseOrderService purchaseOrderService)
        {
            List<PONumberItemsViewModel> lstPurchaseOrderViewModel1 = new List<PONumberItemsViewModel>();
            var purchaseOrderItems = purchaseOrderService.GetAllPONumbersByManufacturer(manufactureId);
            Mapper.CreateMap<PONumberItemsDomainModel, PONumberItemsViewModel>();
            lstPurchaseOrderViewModel1 = purchaseOrderItems.Select(Mapper.Map<PONumberItemsDomainModel, PONumberItemsViewModel>).ToList();
            return lstPurchaseOrderViewModel1;

            //return purchaseOrderService.GetAllPONumbersByClient(clientId);
        }

        public List<PONumberItemsViewModel> GetMappedPONumbersByVisitId(int visitId, string SOIDs, string POItemIds,IPurchaseOrderService purchaseOrderService)
        {
            List<PONumberItemsViewModel> lstPurchaseOrderViewModel1 = new List<PONumberItemsViewModel>();
            var purchaseOrderItems = purchaseOrderService.GetMappedPONumbersByVisitId(visitId, SOIDs, POItemIds);
            Mapper.CreateMap<PONumberItemsDomainModel, PONumberItemsViewModel>();
            lstPurchaseOrderViewModel1 = purchaseOrderItems.Select(Mapper.Map<PONumberItemsDomainModel, PONumberItemsViewModel>).ToList();
            return lstPurchaseOrderViewModel1;

            //return purchaseOrderService.GetAllPONumbersByClient(clientId);
        }

        public List<PurchaseOrderNumbersViewModel> GetMatchingPONumbers1(int ClientId,string poNumber, IPurchaseOrderService purchaseOrderService)
        {
            var purchaseOrderItems = purchaseOrderService.GetMatchingPONumbers1(ClientId,poNumber);
            Mapper.CreateMap<PurchaseOrderNumbersDomainModel, PurchaseOrderNumbersViewModel>();
            LstPurchaseOrderNumber = purchaseOrderItems.Select(Mapper.Map<PurchaseOrderNumbersDomainModel, PurchaseOrderNumbersViewModel>).ToList();
            return LstPurchaseOrderNumber;
            // var allPONumbers = purchaseOrderService.GetMatchingPONumbers(query);
            // return allPONumbers.Where(po => po.Contains(query)).ToList();
        }
        #endregion
    }
}