using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.ClientDomain;
using IQEApp.Domain.CommonDomain;
using IQEApp.Domain.ControlNumberDomain;
using IQEApp.Domain.ServiceOrderDomain;
using IQEApp.Service.ClientService;
using IQEApp.Service.CommonService;
using IQEApp.Service.ControlNumberService;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.ServiceOrderModel;
using System;
using System.Collections.Generic;
using System.Linq;

namespace IQEApp.Web.Models.CommonModels
{
    public class CommonModel
    {
        public class CountryModel
        {
            public int CountryId { get; set; }
            public string CountryName { get; set; }
        }

        public class StateModel
        {
            public int StateId { get; set; }
            public string StateName { get; set; }
            public int CountryId { get; set; }
        }

        public class UserTitleModel
        {
            public int TitleId { get; set; }
            public string TitleName { get; set; }
        }

        public class EmployeeTypeModel
        {
            public int EmployeeTypeId { get; set; }
            public string EmployeeTypeName { get; set; }
        }

        public class SkillSetModel
        {
            public int SkillSetId { get; set; }
            public string SkillSetName { get; set; }
        }

        public class EmployeeRolesModel
        {
            public int RoleId { get; set; }
            public string RoleName { get; set; }
        }

        public class DesignationModel
        {
            public int DesignationId { get; set; }
            public string DesignationName { get; set; }
        }

        public class AssociateModel
        {
           // public int AssociateId { get; set; }
            public string AssociateName { get; set; }
        }

        public class AssoicateContactPersonModel
        {
            public string ContactPerson { get; set; }

        }

        public class IndustryTypeModel
        {
            public int IndustryTypeId { get; set; }
            public string IndustryTypeName { get; set; }

        }

        public class ServiceOrderType
        {
            public int ServiceOrderTypeId { get; set; }
            public string ServiceOrderTypeName { get; set; }

        }

        public class LOISOType
        {
            public int LOISOTypeId { get; set; }
            public string LOISOTypeName { get; set; }

        }

        public class CurrencyTypeModel
        {
            public int CurrencyId { get; set; }
            public string CurrencyName { get; set; }
        }
        public class DocumentType
        {
            public int DocumentTypeId { get; set; }
            public string DocumentTypeName { get; set; }

        }
        public class Category
        {
            public int CategoryId { get; set; }
            public string CategoryName { get; set; }

        }

        public class InvoiceTemplateType
        {
            public int InvoiceTemplateId { get; set; }
            public string InvoiceTemplateName { get; set; }
        }

        public class ManufacturerUnitName
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public bool Flag { get; set; }
        }

        public class WorkScopeModel
        {
            public int WorkScopeId { get; set; }
            public string WorkScopeName { get; set; }
        }

        public class ComplaintResponsable
        {
            public int Id { get; set; }
            public string Name { get; set; }
        }

        public class ComplaintType
        {
            public int Id { get; set; }
            public string Name { get; set; }
        }

        public class ComplaintMode
        {
            public int ComplaintModeID { get; set; }
            public string ComplaintModeName { get; set; }
        }

        public class ComplaintAppealStatus
        {
            public int ComplaintStatusID { get; set; }
            public string ComplaintStatusName { get; set; }
        }
        public class UnitOfMeasurment
        {
            public int UOMId { get; set; }
            public string UOMName { get; set; }

        }
        public class PONumbers
        {
            public int PONId { get; set; }
            public string PONumber { get; set; }

        }
        public class EmployeeBasicDetails
        {
            public int TitleId { get; set; }
            public string TitleName { get; set; }
            public string UserFullName { get; set; }
            public string LoginName { get; set; }
            public int CountryId { get; set; }
            public string CountryName { get; set; }
            public int StateId { get; set; }
            public string StateName { get; set; }
            public string CityName { get; set; }
            public string Qualification { get; set; }
            public string Experience { get; set; }
            public string EmployeeCode { get; set; }

        }
        public class VisitLocations
        {
            public int VisitId { get; set; }
            public string LocationName { get; set; }
        }

        public class ManufacturerLocationMapping
        {
            public int VisitId { get; set; }
            public int ManufacturerId { get; set; }
            public string ManufacturerName { get; set; }
            public string LocationDetails { get; set; }
            public bool IsSubManufacturer { get; set; }
            public string SubManufacturerDetails { get; set; }
            public string ContactNo { get; set; }
            public decimal? Cost { get; set; }
        }
    }

    public class CommonDetailsViewModel
    {
        public ControlNumberViewModel ControlNumberDetails { get; set; }
        //public List<VisitProcessingModel> LstVisitProcessing { get; set; }
        public ClientUnitsViewModel ClientUnitDetails { get; set; }


        public ManufacturerUnitsViewModel ManufacturerUnitDetails { get; set; }
        public List<ManufacturerUnitsViewModel> LstManufacturerUnitDetails { get; set; }
        public PurchaseOrderViewModel PurchaseOrderDetails { get; set; }
        public List<PurchaseOrderViewModel> LstPurchaseOrderDetails { get; set; }
   //     public List<PurchaseOrderNumbersViewModel> LstPurchaseOrderNumbers { get; set; }
        public ServiceOrderViewModel ServiceOrderDetails { get; set; }
        public List<PurchaseOrderItemsViewModel> LstPurchaseOrderItems { get; set; }
        public List<CommonModel.StateModel> LstStates { get; set; }
    }

    public class CommonDetailsBusinessModel
    {
        public List<ClientUnitsViewModel> lstClientUnitDetails { get; set; }
        public List<ControlNumberViewModel> LstControlNumbers { get; set; }
        public CommonDetailsViewModel ViewCommonDetails(Guid visitGuid, Guid controlNumberGuid, int ServiceOrderId,
            int LoggedInUser, ICommonDetailService _commonDetailService)
        {
            var commomDetails = _commonDetailService.ViewCommonDetails(visitGuid, controlNumberGuid, ServiceOrderId, LoggedInUser);
            CommonDetailsViewModel model = new CommonDetailsViewModel();
            model.ControlNumberDetails = commomDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            model.ClientUnitDetails = commomDetails.Tables[1].DataTableToList<ClientUnitsViewModel>().FirstOrDefault();
            //model.ManufacturerUnitDetails =
            //    commomDetails.Tables[2].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault();
            model.LstManufacturerUnitDetails = commomDetails.Tables[2].DataTableToList<ManufacturerUnitsViewModel>();
            List<PurchaseOrderViewModel> lstPO = commomDetails.Tables[3].DataTableToList<PurchaseOrderViewModel>();
            model.ServiceOrderDetails = commomDetails.Tables[4].DataTableToList<ServiceOrderViewModel>().FirstOrDefault();
            model.LstPurchaseOrderItems = commomDetails.Tables[5].DataTableToList<PurchaseOrderItemsViewModel>();
            model.LstPurchaseOrderDetails = new List<PurchaseOrderViewModel>();
            foreach (var purchaseOrder in lstPO)
            {
                purchaseOrder.LstPurchaseOrderItems = model.LstPurchaseOrderItems.Where(i => i.POId == purchaseOrder.POId).ToList();
                model.LstPurchaseOrderDetails.Add(purchaseOrder);
            }
            return model;
        }
        public CommonDetailsViewModel LoadCommonDetailsForViewVisit(Guid visitGuid, Guid controlNumberGuid, int ServiceOrderId,
            int LoggedInUser, ICommonDetailService _commonDetailService)
        {
            var commomDetails = _commonDetailService.LoadCommonDetailsForViewVisit(visitGuid, controlNumberGuid, ServiceOrderId, LoggedInUser);
            CommonDetailsViewModel model = new CommonDetailsViewModel();
            model.ControlNumberDetails = commomDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            model.ClientUnitDetails = commomDetails.Tables[1].DataTableToList<ClientUnitsViewModel>().FirstOrDefault();
            model.ManufacturerUnitDetails = commomDetails.Tables[2].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault();
            model.ServiceOrderDetails = commomDetails.Tables[3].DataTableToList<ServiceOrderViewModel>().FirstOrDefault();
            model.PurchaseOrderDetails = commomDetails.Tables[4].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault();
            model.LstPurchaseOrderItems = commomDetails.Tables[5].DataTableToList<PurchaseOrderItemsViewModel>();
            //model.LstPurchaseOrderDetails = new List<PurchaseOrderViewModel>();
            //foreach (var purchaseOrder in lstPO)
            //{
            //    purchaseOrder.LstPurchaseOrderItems = model.LstPurchaseOrderItems.Where(i => i.POId == purchaseOrder.POId).ToList();
            //    model.LstPurchaseOrderDetails.Add(purchaseOrder);
            //}
            //Below list only used scheduled visit edit mode
            model.LstPurchaseOrderDetails = commomDetails.Tables[6].DataTableToList<PurchaseOrderViewModel>();
            return model;
        }
        public List<CommonModel.StateModel> GetStateListByCountryId(int countryId, ICommonDetailService commonDetailService)
        {
            List<CommonModel.StateModel> model = new List<CommonModel.StateModel>();
            var stateDetails = commonDetailService.GetStateListByCountryId(countryId);
            Mapper.CreateMap<CommonDomainModel.StateDomainModel, CommonModel.StateModel>();
            model = stateDetails.Select(Mapper.Map<CommonDomainModel.StateDomainModel, CommonModel.StateModel>).OrderBy(m => m.StateName).ToList();
            return model;
        }

        public List<ServiceOrderViewModel> GetServiceOrderDetailsByClientDetails(int clientId, int clientUnitId, ICommonDetailService commonDetailService)
        {
            List<ServiceOrderViewModel> model = new List<ServiceOrderViewModel>();
            var listItems = commonDetailService.GetServiceOrderDetailsByClientDetails(clientId, clientUnitId);
            Mapper.CreateMap<ServiceOrderDomainModel, ServiceOrderViewModel>();
            model = listItems.Select(Mapper.Map<ServiceOrderDomainModel, ServiceOrderViewModel>).ToList();
            return model;
        }

        public List<ControlNumberViewModel> GetControlNumbersByClientUnitId(int clientUnitId, int offsetIndex, int fetchCount, IControlNumberService controlNumberService)
        {
            var controlNumberDetails = controlNumberService.GetControlNumbersByClientUnitId(clientUnitId, offsetIndex, fetchCount);
            Mapper.CreateMap<ControlNumberDomainModel, ControlNumberViewModel>();
            LstControlNumbers = controlNumberDetails.Select(Mapper.Map<ControlNumberDomainModel, ControlNumberViewModel>).ToList();
            return LstControlNumbers;
        }
        public List<ControlNumberViewModel> GetControlNumbersByManufacturerId(int manufacturerId, int offsetIndex, int fetchCount, IControlNumberService controlNumberService)
        {
            var controlNumberDetails = controlNumberService.GetControlNumbersByManufacturerId(manufacturerId);
            Mapper.CreateMap<ControlNumberDomainModel, ControlNumberViewModel>();
            LstControlNumbers = controlNumberDetails.Select(Mapper.Map<ControlNumberDomainModel, ControlNumberViewModel>).ToList();
            return LstControlNumbers;
        }
        

        public ControlNumberViewModel GetSONumbersByControlId(int controlId, int offsetIndex, int fetchCount, IControlNumberService controlNumberService)
        {
            ControlNumberDetailsModel objDetailsModel = new ControlNumberDetailsModel();
            var controlNumberDetails = controlNumberService.GetSONumbersByControlId(controlId, offsetIndex, fetchCount);
            Mapper.CreateMap<ControlNumberDomainModel, ControlNumberViewModel>();
            objDetailsModel.LstServiceOrdersList = controlNumberDetails.Tables[0].DataTableToList<ServiceOrderViewModel>();
            //objDetailsModel.LstServiceOrdersList = controlNumberDetails.Select(Mapper.Map<ControlNumberDomainModel, ControlNumberViewModel>).ToList();
            return objDetailsModel;
        }
        public List<ClientUnitsViewModel> GetClientDetailsByControlNo(string ControlNo, int SiteId, bool Active, IClientService clientService)
        {
            var clientsUnits = clientService.GetClientDetailsByControlNo(ControlNo, SiteId, Active);
            Mapper.CreateMap<ClientUnitsDomainModel, ClientUnitsViewModel>();
            lstClientUnitDetails = clientsUnits.Select(Mapper.Map<ClientUnitsDomainModel, ClientUnitsViewModel>).ToList();
            return lstClientUnitDetails;
        }
        public List<ClientUnitsViewModel> GetClientDetailsByControlNo1(string ControlNo, int SiteId, bool Active, IClientService clientService)
        {
            var clientsUnits = clientService.GetClientDetailsByControlNo1(ControlNo, SiteId, Active);
            Mapper.CreateMap<ClientUnitsDomainModel, ClientUnitsViewModel>();
            lstClientUnitDetails = clientsUnits.Select(Mapper.Map<ClientUnitsDomainModel, ClientUnitsViewModel>).ToList();
            return lstClientUnitDetails;
        }

        public CommonDetailsViewModel GetPODetailsForScheduleVisit(int manufacturerUnitId, int ServiceOrderId, ICommonDetailService _commonDetailService)
        {
            var commomDetails = _commonDetailService.GetPODetailsForScheduleVisit(manufacturerUnitId, ServiceOrderId);
            CommonDetailsViewModel model = new CommonDetailsViewModel();
            List<PurchaseOrderViewModel> lstPO = commomDetails.Tables[0].DataTableToList<PurchaseOrderViewModel>();
            model.LstPurchaseOrderItems = commomDetails.Tables[1].DataTableToList<PurchaseOrderItemsViewModel>();
            model.LstPurchaseOrderDetails = new List<PurchaseOrderViewModel>();
            foreach (var purchaseOrder in lstPO)
            {
                purchaseOrder.LstPurchaseOrderItems = model.LstPurchaseOrderItems.Where(i => i.POId == purchaseOrder.POId).ToList();
                model.LstPurchaseOrderDetails.Add(purchaseOrder);
            }
            return model;
        }

     }
}