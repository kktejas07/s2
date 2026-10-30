using AutoMapper;
using Azure.Storage.Blobs.Models;
using DocumentFormat.OpenXml.Bibliography;
using DocumentFormat.OpenXml.Drawing;
using IQEApp.Core.Extensions;
using IQEApp.Domain.ClientDomain;
using IQEApp.Domain.ControlNumberDomain;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Domain.FilesDomain;
using IQEApp.Domain.ServiceOrderDomain;
using IQEApp.Service.ClientService;
using IQEApp.Service.ControlNumberService;
using IQEApp.Service.EnquiryService;
using IQEApp.Service.FilesService;
using IQEApp.Service.ServiceOrder;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.EnquiryModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.ServiceOrderModel;
using IQEApp.Web.Models.VisitProcessing;
using Microsoft.Owin.Security;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.IO.Packaging;
using System.Linq;
using System.Web;

namespace IQEApp.Web.Models.ControlNumberModel
{
    public class ControlNumberViewModel : BaseViewModel
    {
        public int VisitTypeId { get; set; }
        public int ControlId { get; set; }
        public Guid ControlNumberGuid { get; set; }

        [DisplayName("Control No.")]
        public string ControlNo { get; set; }

        [DisplayName("Control Number Comments"), StringLength(1000, ErrorMessage = "Enter Less than 1000 characters ")]
        public string ControlNumberComments { get; set; }
        [DisplayName("Equipment Name"), StringLength(200, ErrorMessage = "Enter Less than 200 characters")]
        public string EquipmentName { get; set; }
        [Required]
        [DisplayName("Service Order")]
        public int SOId { get; set; }
        public Guid ServiceOrderGuid { get; set; }
        public int POId { get; set; }
        public int PONId { get; set; }
        public List<int> PONIds { get; set; }

        [DisplayName("LOI SO Type")]
        public int LOISOTypeId { get; set; }

        [DisplayName("LOI/Others")]
        public string LOINumber { get; set; }

        [DisplayName("SO Number")]
        public string SONumber { get; set; }
        public DateTime? SODate { get; set; }
        public DateTime? SODueDate { get; set; }
        public string ControlNoSONo { get; set; }
        public string ClientName { get; set; }
        public string ClientUnitName { get; set; }
        public int ManufacturerId { get; set; }
        public int ManufacturerUnitId { get; set; }

        public string ManufacturerName { get; set; }
        public string ManufacturerUnitName { get; set; }
        public bool IsCNActive { get; set; }
        public int Total { get; set; }
        public int ControlStatusId { get; set; }
        public string ControlStatusName { get; set; }

        [DisplayName("Customer Name")]
        [Required]
        public int ClientId { get; set; }
        [DisplayName("Customer Unit Name")]
        [Required]
        public int ClientUnitId { get; set; }
        public int SOType { get; set; }

        public string SOTypeName { get; set; }

        public string CurrencySymbol { get; set; }
        public string Amount { get; set; }
        //public string EnquiryIdRefernce { get; set; }

        public int EID { get; set; }
        public string EnquiryId { get; set; }

        public string FileId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }

        [DisplayName("Upload File")]
        public HttpPostedFileBase[] UploadFile { get; set; }

        //public HttpPostedFileBase[] BackFile { get; set; }

        //public string EnquiryDetails { get; set; }
        //public string Location { get; set; }
        //public string WorkScopeName { get; set; }
        public int CreatedBy { get; set; }

        public List<EnquiryCategoryModel> LstEnquiryCategoryModel { get; set; }

        // New flag to request creating SO in current FY even when existing SO is next FY
        public bool CreateInCurrentFy { get; set; }

    }


    public class ControlNumberDetailsModel : ControlNumberViewModel
    {
        public List<ServiceOrderViewModel> LstServiceOrdersList { get; set; }
        public List<PurchaseOrderItemsViewModel> LstPurchaseOrderItems { get; set; }
        public List<PurchaseOrderNumbersViewModel> LstPurchaseOrderNumbers { get; set; }
        public ServiceOrderViewModel ServiceOrderDetails { get; set; }
        public ControlNumberViewModel ControlNumberDetails { get; set; }
        public ClientUnitsViewModel ClientUnitDetails { get; set; }
        public ManufacturerUnitsViewModel ManufacturerUnitDetails { get; set; }
        public List<ManufacturerDetailsModel> LstManufacturer { get; set; }
        public List<ManufacturerUnitsViewModel> LstManufacturerUnitDetails { get; set; }
        public PurchaseOrderViewModel PurchaseOrderDetails { get; set; }

        public ClientViewModel ClientDetails { get; set; }

        public List<ClientViewModel> LstClients { get; set; }
        public List<ClientUnitsViewModel> LstClientUnits { get; set; }

        public List<ControlNumberViewModel> LstControlNumbers { get; set; }

        public List<CommonModel.LOISOType> LstLOISOTypes { get; set; }

    }

    public class ControlNumber1
    {
        public int ControlId { get; set; }
        public Guid ControlNumberGuid { get; set; }

        [DisplayName("Control No.")]
        public string ControlNo { get; set; }

        public int SOId { get; set; }
        public Guid ServiceOrderGuid { get; set; }

    }

    public class ControlNumberBusinessModel
    {
        public List<ControlNumberViewModel> LstControlNumbers { get; set; }
        // List<ControlNumberViewModel> LstSONumbers { get; set; }
        public List<ClientViewModel> LstClients { get; set; }
        public List<ClientUnitsViewModel> LstClientUnits { get; set; }
        public ControlNumberDetailsModel GetControlNumberDetailsToAdd(int loginUserSiteId, IControlNumberService controlNumberService)
        {
            var controlNumberDetails = controlNumberService.GetControlNumberDetailsToAdd(loginUserSiteId);
            ControlNumberDetailsModel objDetailsModel = new ControlNumberDetailsModel();
            objDetailsModel.LstServiceOrdersList = controlNumberDetails.Tables[0].DataTableToList<ServiceOrderViewModel>();
            return objDetailsModel;
        }

        public ControlNumberDetailsModel GetServiceOrderDetailsForControlNumber(int serviceOrderId, int loginUserId, int loginUserSiteId, IControlNumberService controlNumberService)
        {
            var controlNumberDetails = controlNumberService.GetServiceOrderDetailsForControlNumber(serviceOrderId, loginUserId, loginUserSiteId);
            ControlNumberDetailsModel objDetailsModel = new ControlNumberDetailsModel();
            objDetailsModel.ServiceOrderDetails = controlNumberDetails.Tables[0].DataTableToList<ServiceOrderViewModel>().FirstOrDefault();
            objDetailsModel.LstPurchaseOrderItems = controlNumberDetails.Tables[1].DataTableToList<PurchaseOrderItemsViewModel>();
            objDetailsModel.LstServiceOrdersList = controlNumberDetails.Tables[2].DataTableToList<ServiceOrderViewModel>();
            objDetailsModel.ClientUnitDetails = controlNumberDetails.Tables[3].DataTableToList<ClientUnitsViewModel>().FirstOrDefault() ?? new ClientUnitsViewModel();
            objDetailsModel.ManufacturerUnitDetails = controlNumberDetails.Tables[4].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault() ?? new ManufacturerUnitsViewModel();
            objDetailsModel.PurchaseOrderDetails = controlNumberDetails.Tables[5].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault() ?? new PurchaseOrderViewModel();
            return objDetailsModel;
        }
        public int GenerateControlNumber(ControlNumberViewModel model, IControlNumberService controlNumberService)
        {
            Mapper.CreateMap<ControlNumberViewModel, ControlNumberDomainModel>();
            var controlNumberDetails = Mapper.Map<ControlNumberViewModel, ControlNumberDomainModel>(model);
            var controlNumber = controlNumberService.GenerateControlNumber(controlNumberDetails);
            return controlNumber;
        }

        public IEnumerable<ControlNumberViewModel> GetControlNumberDetails(DirectorySearchQueryModel model, IControlNumberService controlNumberService)
        {

            var ds = controlNumberService.GetControlNumberDetails(model.SiteId, model.StrSearch, model.AlphaSearch, model.PageCount, model.FetchCount, model.ActiveStatus, model.SortingOrder, model.FIYear);

            List<ControlNumberViewModel> lstControlNumberViewModel = ds.Tables[0].DataTableToList<ControlNumberViewModel>();
            if (ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0)
            {
                var categoryList = ds.Tables[1].DataTableToList<EnquiryCategoryModel>();

                // Group categories by EnquiryID and attach
                foreach (var enquiry in lstControlNumberViewModel)
                {
                    enquiry.LstEnquiryCategoryModel = categoryList.Where(cc => cc.EID == enquiry.EID)
                        .ToList();
                }
            }

            return lstControlNumberViewModel;

        }

        public List<ControlNumberViewModel> GetServiceOrderFilesBackup(int SoId, IControlNumberService controlNumberService)
        {
            var controlNumberDetails = controlNumberService.GetServiceOrderFilesBackup(SoId);
            Mapper.CreateMap<ControlNumberDomainModel, ControlNumberViewModel>();
            LstControlNumbers = controlNumberDetails.Select(Mapper.Map<ControlNumberDomainModel, ControlNumberViewModel>).ToList();
            return LstControlNumbers;
        }
        public List<ControlNumberViewModel> GetControlNumbersByClientUnitId(int clientUnitId, int offsetIndex, int fetchCount, IControlNumberService controlNumberService)
        {
            var controlNumberDetails = controlNumberService.GetControlNumbersByClientUnitId(clientUnitId, offsetIndex, fetchCount);
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
            LstClientUnits = clientsUnits.Select(Mapper.Map<ClientUnitsDomainModel, ClientUnitsViewModel>).ToList();
            return LstClientUnits;
        }
        public List<ControlNumberViewModel> GetManufactureDetailsByControlNo(int ControlNo, int offsetIndex, int fetchCount, IControlNumberService controlNumberService)
        {
            var controlNumberDetails = controlNumberService.GetManufactureDetailsByControlNo(ControlNo, offsetIndex, fetchCount);
            Mapper.CreateMap<ControlNumberDomainModel, ControlNumberViewModel>();
            LstControlNumbers = controlNumberDetails.Select(Mapper.Map<ControlNumberDomainModel, ControlNumberViewModel>).ToList();
            return LstControlNumbers;
        }

        public List<ControlNumberViewModel> GetControlNumberDetails(ControlNoSearchModel model, IControlNumberService controlNumberService)
        {
            var controlNumberDetails = controlNumberService.GetControlNumberDetails(model.SiteId, model.StrSearch, model.AlphaSearch, model.PageCount, model.FetchCount, model.ActiveStatus, model.SortingOrder, "");
            Mapper.CreateMap<ControlNumberDomainModel, ControlNumberViewModel>();
            //var LstControlNumbers1 = controlNumberDetails.Select(Mapper.Map<ControlNumberDomainModel, ControlNumberViewModel>).ToList();
            return LstControlNumbers;
        }
        public ControlNumberDetailsModel GetControlNumberDetailsToUpdate(Guid controlNumberGuid, int loginUserId, int loginUserSiteId, IControlNumberService controlNumberService)
        {
            var controlNumberDetails = controlNumberService.GetControlNumberDetailsToUpdate(controlNumberGuid, loginUserId, loginUserSiteId);
            ControlNumberDetailsModel objDetailsModel = new ControlNumberDetailsModel();
            var details = controlNumberDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            objDetailsModel.ControlNo = details.ControlNo;
            objDetailsModel.SOId = details.SOId;
            objDetailsModel.SONumber = details.SONumber;
            objDetailsModel.ControlNumberComments = details.ControlNumberComments;
            objDetailsModel.EquipmentName = details.EquipmentName;
            objDetailsModel.ControlId = details.ControlId;
            objDetailsModel.ControlNumberGuid = details.ControlNumberGuid;
            objDetailsModel.ControlNumberDetails = controlNumberDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            //objDetailsModel.ServiceOrderDetails = controlNumberDetails.Tables[1].DataTableToList<ServiceOrderViewModel>().FirstOrDefault();
            objDetailsModel.LstServiceOrdersList = controlNumberDetails.Tables[1].DataTableToList<ServiceOrderViewModel>();
            //objDetailsModel.LstPurchaseOrderItems = controlNumberDetails.Tables[3].DataTableToList<PurchaseOrderItemsViewModel>();
            //objDetailsModel.ClientUnitDetails = controlNumberDetails.Tables[4].DataTableToList<ClientUnitsViewModel>().FirstOrDefault()??new ClientUnitsViewModel();
            //objDetailsModel.ManufacturerUnitDetails = controlNumberDetails.Tables[5].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault() ?? new ManufacturerUnitsViewModel();
            //objDetailsModel.PurchaseOrderDetails = controlNumberDetails.Tables[6].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault() ?? new PurchaseOrderViewModel();
            return objDetailsModel;
        }

        public bool UpdateControlNumber(ControlNumberViewModel model, IControlNumberService controlNumberService)
        {
            Mapper.CreateMap<ControlNumberViewModel, ControlNumberDomainModel>();
            var controlDetails = Mapper.Map<ControlNumberViewModel, ControlNumberDomainModel>(model);
            var retStatus = controlNumberService.UpdateControlNumber(controlDetails);
            return retStatus;
        }

        public bool UpdateLatestSONumber(ControlNumberViewModel model, IControlNumberService controlNumberService)
        {
            Mapper.CreateMap<ControlNumberViewModel, ControlNumberDomainModel>();
            var controlDetails = Mapper.Map<ControlNumberViewModel, ControlNumberDomainModel>(model);
            var status = controlNumberService.UpdateLatestSONumber(controlDetails);
            return status;
        }

        public bool UpdateSOFilesBySOID(ControlNumberViewModel model, bool flag, IControlNumberService controlNumberService)
        {
            Mapper.CreateMap<ControlNumberViewModel, ControlNumberDomainModel>();
            ControlNumberDomainModel objServiceOrderDomainModel = Mapper.Map<ControlNumberViewModel, ControlNumberDomainModel>(model);
            var isSuccess = controlNumberService.UpdateSOFilesBySOID(objServiceOrderDomainModel, flag);
            return isSuccess;
        }
        public bool UpdateControlNumberActiveStatus(Guid controlNumberGuid, int loginUserId, bool CNStatus, IControlNumberService controlNumberService)
        {
            var status = controlNumberService.UpdateControlNumberActiveStatus(controlNumberGuid, loginUserId, CNStatus);
            return status;
        }

        //public bool GetControlNumberDetailsToUpdateLOISONumber(Guid controlNumberGuid, int loginUserId, IControlNumberService controlNumberService)
        //{
        //    var status = controlNumberService.GetControlNumberDetailsToUpdateLOISONumber(controlNumberGuid, loginUserId);
        //    return status;
        //}

        public ControlNumberDetailsModel GetControlNumberToUpdateLOISONumber(Guid controlNumberGuid, int loginUserId, IControlNumberService controlNumberService)
        {
            ControlNumberDetailsModel objControlNumberDetailsModel = new ControlNumberDetailsModel();
            var dsControlNumberDetails = controlNumberService.GetControlNumberToUpdateLOISONumber(controlNumberGuid, loginUserId);
            objControlNumberDetailsModel.ControlNumberDetails = dsControlNumberDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            objControlNumberDetailsModel.LstLOISOTypes = dsControlNumberDetails.Tables[1].DataTableToList<CommonModel.LOISOType>();
            // objEnquiryDetailsModel.LstWorkScope = new List<CommonModel.WorkScopeModel>();
            //  objEnquiryDetailsModel.LstWorkScope = dsEnquiryDetails.Tables[0].DataTableToList<CommonModel.WorkScopeModel>();
            return objControlNumberDetailsModel;
        }


        #region ScheduleVisit

        public ScheduleVisitDetailsModel GetVisitDetails(Guid? controlNumberGuid, string controlNumber, int loginUserId, int loginUserSiteId, IControlNumberService controlNumberService)
        {
            var visitDetails = controlNumberService.GetScheduledVisitDetailsByControlNo(controlNumberGuid, controlNumber, loginUserId, loginUserSiteId);
            ScheduleVisitDetailsModel obj = new ScheduleVisitDetailsModel();
            obj.ControlNumberDetails = visitDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            //obj.LstUsers = visitDetails.Tables[1].DataTableToList<UserViewModel>();
            obj.ClientUnitDetails = visitDetails.Tables[2].DataTableToList<ClientUnitsViewModel>().FirstOrDefault();
            obj.ManufacturerUnitDetails = visitDetails.Tables[3].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault();
            //obj.LstManufacturerUnitDetails = visitDetails.Tables[3].DataTableToList<ManufacturerUnitsViewModel>().ToList();
            obj.PurchaseOrderDetails = visitDetails.Tables[4].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault();
            obj.ServiceOrderDetails = visitDetails.Tables[5].DataTableToList<ServiceOrderViewModel>().FirstOrDefault();
            obj.LstPurchaseOrderItems = visitDetails.Tables[6].DataTableToList<PurchaseOrderItemsViewModel>().ToList();
            obj.LstStates = visitDetails.Tables[7].DataTableToList<CommonModel.StateModel>().ToList();
            return obj;
        }
        #endregion

        public List<VisitProcessing.ScheduleVisitModel> GetControlNumCumPreviousVisitDetails(int soId, IControlNumberService controlNumberService)
        {
            var dataModel = controlNumberService.GetControlNumCumPreviousVisitDetails(soId);
            List<VisitProcessing.ScheduleVisitModel> visitList = dataModel.Tables[1].DataTableToList<VisitProcessing.ScheduleVisitModel>();
            return visitList;
        }

        public ControlNumberDetailsModel GetClientDetails(int loginUserSiteId, IControlNumberService controlNumberService)
        {
            var dsControlNumberDetails = controlNumberService.GetClientDetails(loginUserSiteId);
            ControlNumberDetailsModel obj = new ControlNumberDetailsModel();
            obj.LstClients = dsControlNumberDetails.Tables[0].DataTableToList<ClientViewModel>();
            obj.LstManufacturer = dsControlNumberDetails.Tables[1].DataTableToList<ManufacturerDetailsModel>();
            return obj;
        }


        public ControlNumberDetailsModel GetControlNumberDetails(int loginUserSiteId, IControlNumberService controlNumberService)
        {
            var dsControlNumberDetails = controlNumberService.GetControlNumberDetails(loginUserSiteId);
            ControlNumberDetailsModel obj = new ControlNumberDetailsModel();
            obj.LstControlNumbers = dsControlNumberDetails.Tables[0].DataTableToList<ControlNumberViewModel>();
            //obj.LstClients = dsControlNumberDetails.Tables[0].DataTableToList<ClientViewModel>();
            //obj.LstPONumbers = dsServiceOrderDetails.Tables[2].DataTableToList<PurchaseOrderViewModel>();
            return obj;
        }

        public ControlNumberViewModel GetSOFileDetailsByGUID(Guid Id, string FileName, int FileId, IControlNumberService controlNumberservice)
        {
            ControlNumberViewModel files = new ControlNumberViewModel();
            var filesInfo = controlNumberservice.GetSOFileDetailsByGUID(Id, FileName, FileId);
            Mapper.CreateMap<ControlNumberDomainModel, ControlNumberViewModel>();
            files = Mapper.Map<ControlNumberDomainModel, ControlNumberViewModel>(filesInfo);
            return files;
        }

    }
}