using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.ManufacturerDomain;
using IQEApp.Service.ManufacturerService;
using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace IQEApp.Web.Models.ManufacturerModel
{
    public class ManufacturerViewModel
    {
        public int ManufacturerId { get; set; }
        [Required]
        [DisplayName("Manufacturer Name")]
        public string ManufacturerName { get; set; }
        public Guid ManufacturerGuid { get; set; }
        [DisplayName("Contact No")]
        [StringLength(10, ErrorMessage = "Enter Less than 10 numbers")]
        [RegularExpression(@"^([0-9]{10})$", ErrorMessage = "Please Enter Valid Contact Number.")]
        public string ContactNumber { get; set; }
        public string City { get; set; }

        [DisplayName("State")]
        public int StateId { get; set; }
        public string StateName { get; set; }
        [DisplayName("Country")]
        public int CountryId { get; set; }
        public string CountryName { get; set; }
        public int SiteId { get; set; }
        public int LoggedInUser { get; set; }
        public bool IsManufacturerActive { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int TotalUnits { get; set; }
        public ManufacturerUnitsViewModel ManufacturerUnit { get; set; }
        public List<ManufacturerViewModel> LstManufacturerUnits { get; set; }
        public int Total { get; set; }

        [DisplayName("Unit Name")]
        public int ManufacturerUnitNameFlagId { get; set; }

        public string ManufacturerUnitNameFlagName { get; set; }

        public int ManufacturerUnitNameFlag { get; set; }

        [DisplayName(" SEZ ")]
        public bool IsSEZ { get; set; }
        [DisplayName(" Overseas ")]
        public bool IsOverseas { get; set; }

        [DisplayName("GST No")]
        [StringLength(15, ErrorMessage = "Enter Less than 15 characters")]
        [RegularExpression(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", ErrorMessage = "Invalid GST Format")]
        public string GSTNo { get; set; }
        [StringLength(10, ErrorMessage = "Enter Less than 10 characters")]
        [DisplayName("SGST (%)")]
        [RegularExpression("^[0-9]*$", ErrorMessage = "SGST must be numeric")]
        public string SGST { get; set; }
        [StringLength(10, ErrorMessage = "Enter Less than 10 characters")]
        [DisplayName("CGST (%)")]
        [RegularExpression("^[0-9]*$", ErrorMessage = "CGST must be numeric")]
        public string CGST { get; set; }
        [StringLength(10, ErrorMessage = "Enter Less than 10 characters")]
        [DisplayName("IGST (%)")]
        [RegularExpression("^[0-9]*$", ErrorMessage = "IGST must be numeric")]
        public string IGST { get; set; }
    }

    public class ManufacturerDetailsModel : ManufacturerViewModel
    {
        public List<CommonModel.StateModel> LstStates { get; set; }
        public List<CommonModel.CountryModel> LstCountries { get; set; }

        public List<CommonModel.ManufacturerUnitName> LstManufacturerUnitName { get; set; }
    }

    public class ManufacturerBusinessModel
    {
        public List<ManufacturerViewModel> LstManufacturerViewModel { get; set; }
        public List<ManufacturerUnitsViewModel> LstManufacturerUnits { get; set; }
        #region Manufacturer
        public List<ManufacturerViewModel> GetManufacturersListBySiteId(int loginUserSiteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, IManufacturerService manufacturerService)
        {
            var manufacturerDetails = manufacturerService.GetManufacturersListBySiteId(loginUserSiteId, strSearch, alphaChar, offset, fetch, activeStatus, sortingOrder);
            Mapper.CreateMap<ManufacturerDomainModel, ManufacturerViewModel>();
            LstManufacturerViewModel = manufacturerDetails.Select(Mapper.Map<ManufacturerDomainModel, ManufacturerViewModel>).ToList();
            return LstManufacturerViewModel;
        }
        //public List<ManufacturerViewModel> GetManufacturersSearchList(int loginUserSiteId, string strSearch, int offset, int fetch, IManufacturerService manufacturerService)
        //{
        //    var manufacturerDetails = manufacturerService.GetManufacturersSearchList(loginUserSiteId, strSearch, offset, fetch);
        //    Mapper.CreateMap<ManufacturerDomainModel, ManufacturerViewModel>();
        //    LstManufacturerViewModel = manufacturerDetails.Select(Mapper.Map<ManufacturerDomainModel, ManufacturerViewModel>).ToList();
        //    return LstManufacturerViewModel;
        //}
        public bool IsManufacturerExists(ManufacturerViewModel obj, IManufacturerService manufacturerService)
        {
            Mapper.CreateMap<ManufacturerViewModel, ManufacturerDomainModel>();
            ManufacturerDomainModel objManufacturerDomainModel = Mapper.Map<ManufacturerViewModel, ManufacturerDomainModel>(obj);
            return manufacturerService.IsManufacturerExistsAlready(objManufacturerDomainModel);
        }
        //public ManufacturerDetailsModel GetClientDetailsToAdd(int loginUserSiteId, IManufacturerService manufacturerService)
        //{
        //    Mapper.CreateMap<ManufacturerViewModel, ManufacturerDomainModel>();
        //    ManufacturerDomainModel objManufacturerDomainModel = Mapper.Map<ManufacturerViewModel, ManufacturerDomainModel>(obj);
        //    return manufacturerService.GetClientDetailsToAdd(objManufacturerDomainModel);
        //}
        public ManufacturerDetailsModel GetManufacturerDetailsToAdd(int loginUserSiteId, IManufacturerService manufacturerService)
        {
            var dsManufacturerDetails = manufacturerService.GetManufacturerDetailsToAdd();
            ManufacturerDetailsModel objManufacturerDetailsModel = new ManufacturerDetailsModel();
            objManufacturerDetailsModel.LstStates = new List<CommonModel.StateModel>();
            objManufacturerDetailsModel.LstCountries = dsManufacturerDetails.Tables[1].DataTableToList<CommonModel.CountryModel>();
            objManufacturerDetailsModel.LstManufacturerUnitName = dsManufacturerDetails.Tables[2].DataTableToList<CommonModel.ManufacturerUnitName>();
            return objManufacturerDetailsModel;
        }
        public int SaveManufacturerDetails(ManufacturerViewModel obj, IManufacturerService manufacturerService)
        {
            Mapper.CreateMap<ManufacturerViewModel, ManufacturerDomainModel>();
            ManufacturerDomainModel objManufacturerDomainModel = Mapper.Map<ManufacturerViewModel, ManufacturerDomainModel>(obj);
            var manufacturerId = manufacturerService.SaveManufacturerDetails(objManufacturerDomainModel);
            return manufacturerId;
        }
        public ManufacturerDetailsModel GetManufacturerDetailsToEdit(Guid manufacturerGuid, int loginUserSiteId, IManufacturerService manufacturerService)
        {
            var dsManufacturerDetails = manufacturerService.GetManufacturerDetailsToEdit(manufacturerGuid, loginUserSiteId);
            ManufacturerDetailsModel objManufacturerDetailsModel = new ManufacturerDetailsModel();
            var manufacturerDetails = dsManufacturerDetails.Tables[0].DataTableToList<ManufacturerViewModel>().FirstOrDefault();
            objManufacturerDetailsModel.ManufacturerId = manufacturerDetails.ManufacturerId;
            objManufacturerDetailsModel.ManufacturerGuid = manufacturerDetails.ManufacturerGuid;
            objManufacturerDetailsModel.ManufacturerName = manufacturerDetails.ManufacturerName;
            objManufacturerDetailsModel.City = manufacturerDetails.City;
            objManufacturerDetailsModel.StateId = manufacturerDetails.StateId;
            objManufacturerDetailsModel.CountryId = manufacturerDetails.CountryId;
            objManufacturerDetailsModel.ContactNumber = manufacturerDetails.ContactNumber;
            objManufacturerDetailsModel.GSTNo = manufacturerDetails.GSTNo;
            objManufacturerDetailsModel.IsSEZ = manufacturerDetails.IsSEZ;
            objManufacturerDetailsModel.IsOverseas = manufacturerDetails.IsOverseas;
            objManufacturerDetailsModel.SGST = manufacturerDetails.SGST;
            objManufacturerDetailsModel.CGST = manufacturerDetails.CGST;
            objManufacturerDetailsModel.IGST = manufacturerDetails.IGST;
            objManufacturerDetailsModel.ManufacturerUnitNameFlag = manufacturerDetails.ManufacturerUnitNameFlag;
            objManufacturerDetailsModel.LstStates = dsManufacturerDetails.Tables[1].DataTableToList<CommonModel.StateModel>();
            objManufacturerDetailsModel.LstCountries = dsManufacturerDetails.Tables[2].DataTableToList<CommonModel.CountryModel>();
            objManufacturerDetailsModel.LstManufacturerUnitName = dsManufacturerDetails.Tables[3].DataTableToList<CommonModel.ManufacturerUnitName>();
            return objManufacturerDetailsModel;
        }
        public bool UpdateManufacturerDetails(ManufacturerViewModel obj, IManufacturerService manufacturerService)
        {
            Mapper.CreateMap<ManufacturerViewModel, ManufacturerDomainModel>();
            ManufacturerDomainModel objManufacturerDomainModel = Mapper.Map<ManufacturerViewModel, ManufacturerDomainModel>(obj);
            var isSuccess = manufacturerService.UpdateManufacturerDetails(objManufacturerDomainModel);
            return isSuccess;
        }
        public bool UpdateManufacturerStatus(ManufacturerViewModel obj, IManufacturerService manufacturerService)
        {
            Mapper.CreateMap<ManufacturerViewModel, ManufacturerDomainModel>();
            ManufacturerDomainModel objManufacturerDomainModel = Mapper.Map<ManufacturerViewModel, ManufacturerDomainModel>(obj);
            var isSuccess = manufacturerService.UpdateManufacturerStatus(objManufacturerDomainModel);
            return isSuccess;
        }
        #endregion

        #region ManufacturingUnit

        public ManufacturerUnitsDetailsModel GetManufacturerUnitDetailsToAdd(IManufacturerService manufacturerService)
        {
            var dsManufacturerDetails = manufacturerService.GetManufacturerUnitDetailsToAdd();
            ManufacturerUnitsDetailsModel objManUnitsDetailsModel = new ManufacturerUnitsDetailsModel();
            objManUnitsDetailsModel.LstStates = new List<CommonModel.StateModel>();
            objManUnitsDetailsModel.LstCountries = dsManufacturerDetails.Tables[1].DataTableToList<CommonModel.CountryModel>();
            return objManUnitsDetailsModel;
        }
        public bool IsManufacturerUnitExists(ManufacturerUnitsViewModel obj, IManufacturerService manufacturerService)
        {
            Mapper.CreateMap<ManufacturerUnitsViewModel, ManufacturerUnitsDomainModel>();
            ManufacturerUnitsDomainModel objManufacturerDomainModel = Mapper.Map<ManufacturerUnitsViewModel, ManufacturerUnitsDomainModel>(obj);
            return manufacturerService.IsManufacturerUnitExistsAlready(objManufacturerDomainModel);
        }
        public int SaveManufacturingUnit(ManufacturerUnitsViewModel objModel, IManufacturerService manufacturerService)
        {
            Mapper.CreateMap<ManufacturerUnitsViewModel, ManufacturerUnitsDomainModel>();
            ManufacturerUnitsDomainModel objManufacturerDomainModel = Mapper.Map<ManufacturerUnitsViewModel, ManufacturerUnitsDomainModel>(objModel);
            var manufacturerUnitId = manufacturerService.SaveManufacturerUnitDetails(objManufacturerDomainModel);
            return manufacturerUnitId;
        }
        public List<ManufacturerUnitsViewModel> GetManufacturerUnitsListByManufacturer(int manufacturerId, IManufacturerService manufacturerService)
        {
            var manufacturerUnitDetails = manufacturerService.GetManufacturerUnitsListByManufacturer(manufacturerId);
            Mapper.CreateMap<ManufacturerUnitsDomainModel, ManufacturerUnitsViewModel>();
            LstManufacturerUnits = manufacturerUnitDetails.Select(Mapper.Map<ManufacturerUnitsDomainModel, ManufacturerUnitsViewModel>).ToList();
            return LstManufacturerUnits;
        }

        public List<ManufacturerViewModel> GetManufacturersList(int SiteId, IManufacturerService manufacturerService)
        {
            var manufacturerDetails = manufacturerService.GetManufacturersList(SiteId);
            Mapper.CreateMap<ManufacturerDomainModel, ManufacturerViewModel>();
            LstManufacturerViewModel = manufacturerDetails.Select(Mapper.Map<ManufacturerDomainModel, ManufacturerViewModel>).ToList();
            return LstManufacturerViewModel;
        }
        public List<ManufacturerUnitsViewModel> GetManufacturerUnitsListByManufacturerList(string manufacturerId, int loggedUserId, IManufacturerService manufacturerService)
        {
            var manufacturerUnitDetails = manufacturerService.GetManufacturerUnitsListByManufacturerList(manufacturerId, loggedUserId);
            Mapper.CreateMap<ManufacturerUnitsDomainModel, ManufacturerUnitsViewModel>();
            LstManufacturerUnits = manufacturerUnitDetails.Select(Mapper.Map<ManufacturerUnitsDomainModel, ManufacturerUnitsViewModel>).ToList();
            return LstManufacturerUnits;
        }
        public ManufacturerUnitsDetailsModel GetManufacturerUnitDetailsToEdit(Guid manufacturerGuid, int loggedUserId, IManufacturerService manufacturerService)
        {
            var dsManufacturerUnitDetails = manufacturerService.GetManufacturerUnitDetailsToEdit(manufacturerGuid, loggedUserId);
            ManufacturerUnitsDetailsModel objManUnitsDetailsModel = new ManufacturerUnitsDetailsModel();
            var unitDetails = dsManufacturerUnitDetails.Tables[0].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault();
            objManUnitsDetailsModel.ManufacturerId = unitDetails.ManufacturerId;
            objManUnitsDetailsModel.ManufacturerUnitName = unitDetails.ManufacturerUnitName;
            objManUnitsDetailsModel.ManufacturerUnitId = unitDetails.ManufacturerUnitId;
            objManUnitsDetailsModel.ManufacturerUnitGuid = unitDetails.ManufacturerUnitGuid;
            objManUnitsDetailsModel.Address = unitDetails.Address;
            objManUnitsDetailsModel.City = unitDetails.City;
            objManUnitsDetailsModel.MFUnitStateId = unitDetails.MFUnitStateId;
            objManUnitsDetailsModel.MFUnitCountryId = unitDetails.MFUnitCountryId;
            objManUnitsDetailsModel.ContactPersonName = unitDetails.ContactPersonName;
            objManUnitsDetailsModel.ContactPersonDesignation = unitDetails.ContactPersonDesignation;
            objManUnitsDetailsModel.PhoneNumber = unitDetails.PhoneNumber;
            objManUnitsDetailsModel.ManufacturerUnitEmailId = unitDetails.ManufacturerUnitEmailId;
            objManUnitsDetailsModel.LstStates = dsManufacturerUnitDetails.Tables[1].DataTableToList<CommonModel.StateModel>();
            objManUnitsDetailsModel.LstCountries = dsManufacturerUnitDetails.Tables[2].DataTableToList<CommonModel.CountryModel>();
            return objManUnitsDetailsModel;
        }
        public bool UpdateManufacturingUnit(ManufacturerUnitsViewModel objModel, IManufacturerService manufacturerService)
        {
            Mapper.CreateMap<ManufacturerUnitsViewModel, ManufacturerUnitsDomainModel>();
            ManufacturerUnitsDomainModel objManufacturerDomainModel = Mapper.Map<ManufacturerUnitsViewModel, ManufacturerUnitsDomainModel>(objModel);
            var status = manufacturerService.UpdateManufacturerUnitDetails(objManufacturerDomainModel);
            return status;
        }
        public bool UpdateManufacturingUnitStatus(ManufacturerUnitsViewModel objModel, IManufacturerService manufacturerService)
        {
            Mapper.CreateMap<ManufacturerUnitsViewModel, ManufacturerUnitsDomainModel>();
            ManufacturerUnitsDomainModel objManufacturerDomainModel = Mapper.Map<ManufacturerUnitsViewModel, ManufacturerUnitsDomainModel>(objModel);
            var status = manufacturerService.UpdateManufacturerUnitStatus(objManufacturerDomainModel);
            return status;
        }

        public ManufacturerUnitsViewModel GetManufacturerUnitDetailsByUnitId(int unitId, IManufacturerService manufacturerService)
        {
            ManufacturerUnitsViewModel model = new ManufacturerUnitsViewModel();
            var units = manufacturerService.GetManufacturerUnitDetailsByUnitId(unitId);
            Mapper.CreateMap<ManufacturerUnitsDomainModel, ManufacturerUnitsViewModel>();
            model = Mapper.Map<ManufacturerUnitsDomainModel, ManufacturerUnitsViewModel>(units);
            return model;
        }
        #endregion
    }
}