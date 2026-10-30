using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using System.Linq;
using System.Web;
using AutoMapper;
using IQEApp.Service.ScheduleVisitService;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.ServiceOrderModel;
using IQEApp.Web.Models.UserModel;
using IQEApp.Service.ControlNumberService;

namespace IQEApp.Web.Models.ScheduleVisitModel
{
    public class ScheduleVisitModel : BaseViewModel
    {
        public int VisitId { get; set; }
        [Required]
       
        public int ControlId { get; set; }
        [DisplayName("Control Number")]
        public string ControlNo { get; set; }
        [Required]
        [DisplayName("Schedule Date")]
        public DateTime? ScheduleDate { get; set; }

        [DisplayName("RFI Schedule Date")]
        public DateTime? RFIScheduleDate { get; set; }

        [DisplayName("Customer Confirmation")]
        public bool ClientConfirmation { get; set; }
        [DisplayName("Manufacturer Confirmation")]
        public bool ManufacturerConfirmation { get; set; }
        [DisplayName("Schedule Comments")]
        public string ScheduleComments { get; set; }
        public string UserIds { get; set; }
        public int VisitStatusId { get; set; }
        public string VisitStatusName { get; set; }
        public Guid VisitGuid { get; set; }
        public string ClientName { get; set; }
        public string ClientUnitName { get; set; }
        public string QualityHeadComments { get; set; }
        public string QualityDoneByName { get; set; }
        public DateTime QualityDoneOn { get; set; }
        public string FinanceApproverComments { get; set; }
        public string FinanceApprovedByName { get; set; }
        public DateTime FinanceApprovedOn { get; set; }
        public int POID { get; set; }
        public int ManufacturerUnitId { get; set; }
        public string ManufacturerUnitName { get; set; }
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }
    }

    public class ScheduleVisitDetailsModel : ScheduleVisitModel
    {
        public ControlNumberViewModel ControlNumberDetails { get; set; }
        public List<UserViewModel> LstUsers { get; set; }
        public List<UserViewModel> LstUsersGrid { get; set; }
      //  public List<VisitProcessingModel> LstVisitProcessing { get; set; }
        public ClientUnitsViewModel ClientUnitDetails { get; set; }
        public ManufacturerUnitsViewModel ManufacturerUnitDetails { get; set; }
        public List<ManufacturerUnitsViewModel> LstManufacturerUnitDetails { get; set; }
        public PurchaseOrderViewModel PurchaseOrderDetails { get; set; }
        public ServiceOrderViewModel ServiceOrderDetails { get; set; }
        public List<PurchaseOrderViewModel> LstPurchaseOrderDetails { get; set; }
        public List<PurchaseOrderItemsViewModel> LstPurchaseOrderItems { get; set; }
        public List<CommonModel.StateModel> LstStates { get; set; }
        public List<ManufacturerUnitsViewModel> LstManufacturerUnits { get; set; }
    }
    public class ScheduleVisitBusinessModel
    {
        public List<ScheduleVisitModel> LstVisitsList { get; set; }
        public int ScheduleNewVisit(ScheduleVisitModel model, IScheduleVisitService visitProcessingService)
        {
            //Mapper.CreateMap<ScheduleVisitModel, ScheduleVisitDomainModel>();
            //var newVisitDetails = Mapper.Map<ScheduleVisitModel, ScheduleVisitDomainModel>(model);
            var VisitId = 0;// visitProcessingService.ScheduleNewVisit(newVisitDetails);
            return VisitId;
        }

        public ScheduleVisitDetailsModel GetVisitDetails(Guid? controlNumberGuid, string controlNumber, int loginUserId, int loginUserSiteId, IControlNumberService controlNumberService)
        {
            var visitDetails = controlNumberService.GetScheduledVisitDetailsByControlNo(controlNumberGuid, controlNumber, loginUserId, loginUserSiteId);
            ScheduleVisitDetailsModel obj = new ScheduleVisitDetailsModel();
            //obj.ControlNumberDetails = visitDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            ////obj.LstUsers = visitDetails.Tables[1].DataTableToList<UserViewModel>();
            //obj.ClientUnitDetails = visitDetails.Tables[2].DataTableToList<ClientUnitsViewModel>().FirstOrDefault();
            //obj.ManufacturerUnitDetails = visitDetails.Tables[3].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault();
            //obj.LstManufacturerUnitDetails = visitDetails.Tables[3].DataTableToList<ManufacturerUnitsViewModel>().ToList();
            //obj.PurchaseOrderDetails = visitDetails.Tables[4].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault();
            //obj.ServiceOrderDetails = visitDetails.Tables[5].DataTableToList<ServiceOrderViewModel>().FirstOrDefault();
            //obj.LstPurchaseOrderItems = visitDetails.Tables[6].DataTableToList<PurchaseOrderItemsViewModel>().ToList();
            //obj.LstStates = visitDetails.Tables[7].DataTableToList<CommonModel.StateModel>().ToList();
            return obj;
        }
        //public List<ScheduleVisitModel> GetScheduledVisitList(int loginUserId, int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, IVisitProcessingService visitProcessingService)
        //{
        //    var visitList = visitProcessingService.GetScheduledVisitsList(loginUserId, siteId, strSearch, alphaChar, offset, fetch, activeStatus, sortingOrder);
        //    Mapper.CreateMap<ScheduleVisitDomainModel, ScheduleVisitModel>();
        //    LstVisitsList = visitList.Select(Mapper.Map<ScheduleVisitDomainModel, ScheduleVisitModel>).ToList();
        //    return LstVisitsList;
        //}

        //public List<ScheduleVisitModel> PreviewScheduledVisit(int loginUserId, Guid? controlNumberGuid, IVisitProcessingService visitProcessingService)
        //{
        //    var visitList = visitProcessingService.PreviewScheduledVisit(loginUserId, controlNumberGuid);
        //    Mapper.CreateMap<ScheduleVisitDomainModel, ScheduleVisitModel>();
        //    LstVisitsList = visitList.Select(Mapper.Map<ScheduleVisitDomainModel, ScheduleVisitModel>).ToList();
        //    return LstVisitsList;
        //}
        //public ScheduleVisitDetailsModel GetVisitDetailsToEdit(Guid visitIdGuid, int loginUserId, int siteId, IVisitProcessingService visitProcessingService)
        //{
        //    var visitDetails = visitProcessingService.GetVisitDetailsToEdit(visitIdGuid, loginUserId, siteId);
        //    ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();
        //    model.ControlNumberDetails = visitDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
        //    model.LstUsers = visitDetails.Tables[1].DataTableToList<UserViewModel>();
        //    model.LstUsersGrid = visitDetails.Tables[2].DataTableToList<UserViewModel>();
        //    var visit = visitDetails.Tables[3].DataTableToList<ScheduleVisitModel>().FirstOrDefault();
        //    model.VisitId = visit.VisitId;
        //    model.VisitGuid = visit.VisitGuid;
        //    model.ScheduleDate = visit.ScheduleDate;
        //    model.ClientConfirmation = visit.ClientConfirmation;
        //    model.ManufacturerConfirmation = visit.ManufacturerConfirmation;
        //    model.ScheduleComments = visit.ScheduleComments;
        //    model.POID = visit.POID;
        //    model.ClientUnitDetails = visitDetails.Tables[4].DataTableToList<ClientUnitsViewModel>().FirstOrDefault();
        //    model.ManufacturerUnitDetails = visitDetails.Tables[5].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault();
        //    model.PurchaseOrderDetails = visitDetails.Tables[6].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault();
        //    model.ServiceOrderDetails = visitDetails.Tables[7].DataTableToList<ServiceOrderViewModel>().FirstOrDefault();
        //    // model.LstPurchaseOrderItems = visitDetails.Tables[8].DataTableToList<PurchaseOrderItemsViewModel>().ToList();
        //    model.LstStates = visitDetails.Tables[8].DataTableToList<CommonModel.StateModel>().ToList() ?? new List<CommonModel.StateModel>(); ;
        //    return model;
        //}
        //public ScheduleVisitDetailsModel ViewVisitDetailsByGuid(Guid visitIdGuid, int loginUserId, int siteId, IVisitProcessingService visitProcessingService)
        //{
        //    var visitDetails = visitProcessingService.ViewVisitDetailsByGuid(visitIdGuid, loginUserId, siteId);
        //    ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();
        //    model.ControlNumberDetails = visitDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
        //    // model.LstUsers = visitDetails.Tables[1].DataTableToList<UserViewModel>();
        //    model.LstVisitProcessing = new List<VisitProcessingModel>();
        //    List<FileViewModel> lstFileDocs = visitDetails.Tables[3].DataTableToList<FileViewModel>().ToList();
        //    List<TravelExpensesModel> lstVisitExpenses = visitDetails.Tables[4].DataTableToList<TravelExpensesModel>().ToList();
        //    foreach (var employeeVisit in visitDetails.Tables[1].DataTableToList<VisitProcessingModel>())
        //    {
        //        employeeVisit.TechnicalDocsList = lstFileDocs.Where(m => (m.SectionId == 11) && (m.GenericId == employeeVisit.VEM_ID)).ToList();
        //        employeeVisit.TravelDocsList = lstFileDocs.Where(m => (m.SectionId == 12) && (m.GenericId == employeeVisit.VEM_ID)).ToList();
        //        employeeVisit.TravelExpenses = lstVisitExpenses.Where(e => e.VEMId == employeeVisit.VEM_ID).ToList();
        //        model.LstVisitProcessing.Add(employeeVisit);
        //    }
        //    var visit = visitDetails.Tables[2].DataTableToList<ScheduleVisitModel>().FirstOrDefault();
        //    model.VisitId = visit.VisitId;
        //    model.VisitGuid = visit.VisitGuid;
        //    model.ScheduleDate = visit.ScheduleDate;
        //    model.ClientConfirmation = visit.ClientConfirmation;
        //    model.ManufacturerConfirmation = visit.ManufacturerConfirmation;
        //    model.ScheduleComments = visit.ScheduleComments;
        //    model.QualityHeadComments = visit.QualityHeadComments;
        //    model.QualityDoneByName = visit.QualityDoneByName;
        //    model.QualityDoneOn = visit.QualityDoneOn;
        //    model.FinanceApproverComments = visit.FinanceApproverComments;
        //    model.FinanceApprovedByName = visit.FinanceApprovedByName;
        //    model.FinanceApprovedOn = visit.FinanceApprovedOn;
        //    model.VisitStatusName = visit.VisitStatusName;
        //    model.VisitStatusId = visit.VisitStatusId;
        //    //model.ClientUnitDetails = visitDetails.Tables[3].DataTableToList<ClientUnitsViewModel>().FirstOrDefault();
        //    //model.ManufacturerUnitDetails = visitDetails.Tables[4].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault();
        //    //model.PurchaseOrderDetails = visitDetails.Tables[5].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault();
        //    //model.ServiceOrderDetails = visitDetails.Tables[6].DataTableToList<ServiceOrderViewModel>().FirstOrDefault();

        //    return model;
        //}
        //public bool UpdateVisitDetails(ScheduleVisitModel model, IVisitProcessingService visitProcessingService)
        //{
        //    Mapper.CreateMap<ScheduleVisitModel, ScheduleVisitDomainModel>();
        //    var newVisitDetails = Mapper.Map<ScheduleVisitModel, ScheduleVisitDomainModel>(model);
        //    var retStatus = visitProcessingService.UpdateVisitDetails(newVisitDetails);
        //    return retStatus;
        //}
    }
}