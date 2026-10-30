using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.ClientDomain;
using IQEApp.Service.ClientService;
using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace IQEApp.Web.Models.ClientModel
{
    public class ClientViewModel
    {
        public int ClientId { get; set; }

        [Required]
        [DisplayName("Customer Name")]
        [StringLength(80, ErrorMessage = "Enter Less than 80 characters")]
        public string ClientName { get; set; }

        public Guid ClientGuid { get; set; }
        [Required]
        public int SiteId { get; set; }

        [Required(ErrorMessage = "Industry Type Required")]
        public int IndustryTypeId { get; set; }

        [DisplayName("Industry Type")]
        public string IndustryTypeName { get; set; }

        [DisplayName("Annual Revenue")]
        public int? AnnualRevenue { get; set; }
        public int LoggedInUser { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int TotalClientUnits { get; set; }
        public ClientUnitsViewModel ClientUnit { get; set; }
        public List<ClientUnitsViewModel> LstClientUnits { get; set; }
        public int Total { get; set; }
        public int PageCount { get; set; }
        public bool IsClientActive { get; set; }
    }

    public class ClientDetailsModel : ClientViewModel
    {
        public List<CommonModel.IndustryTypeModel> LstIndustryTypes { get; set; }
    }
    public class ClientBusinessModel
    {
        public List<ClientViewModel> lstClientViewModel { get; set; }
        public List<ClientUnitsViewModel> lstClientUnitsViewModel { get; set; }
        public List<ClientViewModel> GetAllClientDetails(int siteId, string strSearch, string alphaChar, int offsetIndex, int fetchCount, bool activeStatus, string sortingOrder, IClientService clientService)
        {
            var clientDetails = clientService.GetAllClientDetails(siteId, strSearch, alphaChar, offsetIndex, fetchCount, activeStatus, sortingOrder);
            Mapper.CreateMap<ClientDomainModel, ClientViewModel>();
            lstClientViewModel = clientDetails.Select(Mapper.Map<ClientDomainModel, ClientViewModel>).ToList();
            return lstClientViewModel;
        }
        //public List<ClientViewModel> GetClientSearchList(int siteId, string strSearch,int offsetIndex, int fetchCount, IClientService clientService)
        //{
        //    var clientDetails = clientService.GetClientSearchList(siteId, strSearch, offsetIndex, fetchCount);
        //    Mapper.CreateMap<ClientDomainModel, ClientViewModel>();
        //    lstClientViewModel = clientDetails.Select(Mapper.Map<ClientDomainModel, ClientViewModel>).ToList();
        //    return lstClientViewModel;
        //}
        public ClientDetailsModel GetClientDetailsToAdd(int loginUserSiteId, IClientService clientService)
        {
            var dsClientDetails = clientService.GetClientDetailsToAdd(loginUserSiteId);
            ClientDetailsModel objClientDetailsModel = new ClientDetailsModel();
            objClientDetailsModel.LstIndustryTypes = dsClientDetails.Tables[0].DataTableToList<CommonModel.IndustryTypeModel>();
            return objClientDetailsModel;
        }
        public bool ValidateClient(ClientViewModel objClientViewModel, IClientService clientService)
        {
            Mapper.CreateMap<ClientViewModel, ClientDomainModel>();
            ClientDomainModel objClientDomainModel = Mapper.Map<ClientViewModel, ClientDomainModel>(objClientViewModel);
            return clientService.IsClientAlreadyExists(objClientDomainModel);
        }
        public int CreateClient(ClientViewModel objClientViewModel, IClientService clientService)
        {
            Mapper.CreateMap<ClientViewModel, ClientDomainModel>();
            ClientDomainModel objClientDomainModel = Mapper.Map<ClientViewModel, ClientDomainModel>(objClientViewModel);
            var ClientId = clientService.CreateClient(objClientDomainModel);
            return ClientId;
        }

        public ClientDetailsModel GetClientDetailsToEdit(Guid clientGuid, int loginUserSiteId, IClientService clientService)
        {
            var dsClientDetails = clientService.GetClientDetailsToEdit(clientGuid, loginUserSiteId);
            ClientDetailsModel objClientDetailsModel = new ClientDetailsModel();
            var clientDetails = dsClientDetails.Tables[0].DataTableToList<ClientViewModel>();
            objClientDetailsModel.ClientId = clientDetails.FirstOrDefault().ClientId;
            objClientDetailsModel.ClientName = clientDetails.FirstOrDefault().ClientName;
            objClientDetailsModel.IndustryTypeId = clientDetails.FirstOrDefault().IndustryTypeId;
            objClientDetailsModel.AnnualRevenue = clientDetails.FirstOrDefault().AnnualRevenue;
            objClientDetailsModel.LstIndustryTypes = dsClientDetails.Tables[1].DataTableToList<CommonModel.IndustryTypeModel>();
            return objClientDetailsModel;
        }

        public bool UpdateClientDetails(ClientViewModel objClientViewModel, IClientService clientService)
        {
            Mapper.CreateMap<ClientViewModel, ClientDomainModel>();
            ClientDomainModel objClientDomainModel = Mapper.Map<ClientViewModel, ClientDomainModel>(objClientViewModel);
            var success = clientService.UpdateClientDetails(objClientDomainModel);
            return success;
        }
        public bool UpdateClientStatus(Guid clientGuid, bool status, int loggedInUser, IClientService clientService)
        {
            var success = clientService.UpdateClientStatus(clientGuid, status, loggedInUser);
            return success;
        }
        public ClientUnitsDetailsModel GetClientUnitToAdd(IClientService clientService)
        {
            var dsClientDetails = clientService.GetClientUnitDetailsToAdd();
            ClientUnitsDetailsModel objClientUnitsDetailsModel = new ClientUnitsDetailsModel();
            objClientUnitsDetailsModel.LstStates = new List<CommonModel.StateModel>();
            objClientUnitsDetailsModel.LstCountries = dsClientDetails.Tables[0].DataTableToList<CommonModel.CountryModel>();
            return objClientUnitsDetailsModel;
        }
        public bool ValidateClientUnit(ClientUnitsViewModel objCUVM, IClientService clientService)
        {
            Mapper.CreateMap<ClientUnitsViewModel, ClientUnitsDomainModel>();
            ClientUnitsDomainModel objClientUnitDomainModel = Mapper.Map<ClientUnitsViewModel, ClientUnitsDomainModel>(objCUVM);
            return clientService.IsClientUnitAlreadyExists(objClientUnitDomainModel);
        }
        public int AddClientUnit(ClientUnitsViewModel objCUVM, IClientService clientService)
        {
            Mapper.CreateMap<ClientUnitsViewModel, ClientUnitsDomainModel>();
            ClientUnitsDomainModel obj = Mapper.Map<ClientUnitsViewModel, ClientUnitsDomainModel>(objCUVM);
            var clientUnitId = clientService.AddClientUnit(obj);
            return clientUnitId;
        }
        public List<ClientUnitsViewModel> GetClientUnitsByClientId(int clientId, int offsetIndex, int fetchCount, IClientService clientService)
        {
            var clientsUnits = clientService.GetClientUnitsByClientId(clientId, offsetIndex, fetchCount);
            Mapper.CreateMap<ClientUnitsDomainModel, ClientUnitsViewModel>();
            lstClientUnitsViewModel = clientsUnits.Select(Mapper.Map<ClientUnitsDomainModel, ClientUnitsViewModel>).ToList();
            return lstClientUnitsViewModel;
        }

        public List<ClientUnitsViewModel> GetClientDetailsByControlNo(string ControlNo, int SiteId, bool Active, IClientService clientService)
        {
            var clientsUnits = clientService.GetClientDetailsByControlNo(ControlNo, SiteId, Active);
            Mapper.CreateMap<ClientUnitsDomainModel, ClientUnitsViewModel>();
            lstClientUnitsViewModel = clientsUnits.Select(Mapper.Map<ClientUnitsDomainModel, ClientUnitsViewModel>).ToList();
            return lstClientUnitsViewModel;
        }

        public List<ClientUnitsViewModel> GetManufacturersList(string ControlNo, int SiteId, bool Active, IClientService clientService)
        {
            var clientsUnits = clientService.GetClientDetailsByControlNo(ControlNo, SiteId, Active);
            Mapper.CreateMap<ClientUnitsDomainModel, ClientUnitsViewModel>();
            lstClientUnitsViewModel = clientsUnits.Select(Mapper.Map<ClientUnitsDomainModel, ClientUnitsViewModel>).ToList();
            return lstClientUnitsViewModel;
        }
        public List<ClientUnitsViewModel> GetClientUnitsByClientName(string clientName, int offsetIndex, int fetchCount, IClientService clientService)
        {
            var clientsUnits = clientService.GetClientUnitsByClientName(clientName, offsetIndex, fetchCount);
            Mapper.CreateMap<ClientUnitsDomainModel, ClientUnitsViewModel>();
            lstClientUnitsViewModel = clientsUnits.Select(Mapper.Map<ClientUnitsDomainModel, ClientUnitsViewModel>).ToList();
            return lstClientUnitsViewModel;
        }

        public ClientUnitsDetailsModel GetClientUnitToEdit(Guid clientUnitGuid, IClientService clientService)
        {
            var dsClientUnitDetails = clientService.GetClientUnitDetailsToEdit(clientUnitGuid);
            ClientUnitsDetailsModel objClientUnitsDetailsModel = new ClientUnitsDetailsModel();
            var clientDetails = dsClientUnitDetails.Tables[0].DataTableToList<ClientUnitsViewModel>();
            objClientUnitsDetailsModel.ClientUnitId = clientDetails.FirstOrDefault().ClientUnitId;
            objClientUnitsDetailsModel.ClientId = clientDetails.FirstOrDefault().ClientId;
            objClientUnitsDetailsModel.ClientUnitGuid = clientDetails.FirstOrDefault().ClientUnitGuid;
            objClientUnitsDetailsModel.ClientUnitName = clientDetails.FirstOrDefault().ClientUnitName;
            objClientUnitsDetailsModel.ClientUnitEmailId = clientDetails.FirstOrDefault().ClientUnitEmailId;
            objClientUnitsDetailsModel.ContactPersonName = clientDetails.FirstOrDefault().ContactPersonName;
            objClientUnitsDetailsModel.ContactPersonDesignation = clientDetails.FirstOrDefault().ContactPersonDesignation;
            objClientUnitsDetailsModel.GSTNo = clientDetails.FirstOrDefault().GSTNo;
            objClientUnitsDetailsModel.SGST = clientDetails.FirstOrDefault().SGST;
            objClientUnitsDetailsModel.CGST = clientDetails.FirstOrDefault().CGST;
            objClientUnitsDetailsModel.IGST = clientDetails.FirstOrDefault().IGST;
            objClientUnitsDetailsModel.StateId = clientDetails.FirstOrDefault().StateId;
            objClientUnitsDetailsModel.CountryId = clientDetails.FirstOrDefault().CountryId;
            objClientUnitsDetailsModel.Address = clientDetails.FirstOrDefault().Address;
            objClientUnitsDetailsModel.City = clientDetails.FirstOrDefault().City;
            objClientUnitsDetailsModel.PhoneNumber = clientDetails.FirstOrDefault().PhoneNumber;
            objClientUnitsDetailsModel.IsSEZ = clientDetails.FirstOrDefault().IsSEZ;
            objClientUnitsDetailsModel.IsOverseas = clientDetails.FirstOrDefault().IsOverseas;
            objClientUnitsDetailsModel.LstStates = dsClientUnitDetails.Tables[1].DataTableToList<CommonModel.StateModel>();
            objClientUnitsDetailsModel.LstCountries = dsClientUnitDetails.Tables[2].DataTableToList<CommonModel.CountryModel>();
            return objClientUnitsDetailsModel;
        }

        public bool UpdateClientUnitDetails(ClientUnitsViewModel objCUVM, IClientService clientService)
        {
            Mapper.CreateMap<ClientUnitsViewModel, ClientUnitsDomainModel>();
            ClientUnitsDomainModel objClientUnitsDomainModel = Mapper.Map<ClientUnitsViewModel, ClientUnitsDomainModel>(objCUVM);
            var success = clientService.UpdateClientUnitDetails(objClientUnitsDomainModel);
            return success;
        }
        public bool InactivateClientUnit(Guid clientUnitGuid, int loggedInUser, IClientService clientService)
        {
            var success = clientService.InactivateClientUnit(clientUnitGuid, loggedInUser);
            return success;
        }

        public ClientUnitsViewModel GetClientUnitDetailsByUnitId(int unitId, IClientService clientService)
        {
            ClientUnitsViewModel model = new ClientUnitsViewModel();
            var clientsUnits = clientService.GetClientUnitByUnitId(unitId);
            Mapper.CreateMap<ClientUnitsDomainModel, ClientUnitsViewModel>();
            model = Mapper.Map<ClientUnitsDomainModel, ClientUnitsViewModel>(clientsUnits);
            return model;
        }
    }
}