using AutoMapper;
using IQEApp.Core.Extensions;
//using IQEApp.Domain.CompetanceDomain;
using IQEApp.Domain.VisitProcessing;
//using IQEApp.Service.CompetanceService;
using IQEApp.Service.VisitProcessing;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
//using IQEApp.Web.Models.CompetanceModel;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace IQEApp.Web.Models.VisitProcessing
{
    public class VisitProcessingModel : BaseViewModel
    {
        public int VEM_ID { get; set; }
        [DisplayName("Visit No")]
        public int VisitId { get; set; }
        [Display(Name = "User Name")]
        public string UserFullName { get; set; }
        [Required]
        [Display(Name = "Visit From")]
        public DateTime VisitedFrom { get; set; }
        [Required]
        [Display(Name = "Visit To")]
        public DateTime VisitedTo { get; set; }
        [Required]
        [Display(Name = "Visit Comments")]
        public string VisitComments { get; set; }
        [Required]
        [Display(Name = "Inspect Report Number")]
        public string InspReportNumber { get; set; }

        //[Display(Name = "Travel Distance (K.M.)")]
        //public int? TravelKm { get; set; }
        //[Display(Name = "Travel Expenses")]
        //public int? TravelExpense { get; set; }
        //[Display(Name = "Other Expenses")]
        //public int? OtherExpense { get; set; }
        public int VisitProcessStatus { get; set; }
        public List<FileViewModel> TechnicalDocsList { get; set; }
        public List<FileViewModel> TravelDocsList { get; set; }
        [Required]
        [StringLength(1000, ErrorMessage = "Enter Less than 1000 characters")]
        [Display(Name = "Quality Head Comments")]
        public string QualityHeadComments { get; set; }
        public int QualityDoneBy { get; set; }
        public DateTime QualityDoneOn { get; set; }
        [Required]
        [StringLength(1000, ErrorMessage = "Enter Less than 1000 characters")]
        [Display(Name = "Finance Approval Comments")]
        public string FinanceApproverComments { get; set; }
        public int FinanceApprovedBy { get; set; }
        public DateTime FinanceApprovedOn { get; set; }
        //public string VisitStatusName { get; set; }
        public string EmployeeCode { get; set; }
        public string InspectorCode { get; set; }
        public List<TravelExpensesModel> TravelExpenses { get; set; }
        //Below parameter is to delete the expenses which are saved previously in the edit section
        public string[] RemovedExpenseIds { get; set; }
        /// <summary>
        /// Below parameter is to store and send data to server to delete the files from db and azure as user requested to
        /// </summary>
        public List<FileViewModel> RemovedSupportDocs { get; set; }

    }

    public class VisitProcessingDetailsModel : VisitProcessingModel
    {
        public ClientViewModel ClientDetails { get; set; }
        public ManufacturerViewModel ManufacturerDetails { get; set; }
        public ScheduleVisitModel ScheduleDetails { get; set; }
        public ControlNumberViewModel ControlNumberDetails { get; set; }
        public List<VisitProcessingModel> LstVisitProcessingDetails { get; set; }
        public ClientUnitsViewModel ClientUnitDetails { get; set; }
        public ManufacturerUnitsViewModel ManufacturerUnitsDetails { get; set; }
        public PurchaseOrderViewModel PurchaseOrderDetails { get; set; }
        public List<PurchaseOrderItemsViewModel> LstPurchaseOrderItems { get; set; }
        public List<TravelTypesModel> LstTravelTypes { get; set; }
    }

    public class VisitProcessingBusinessModel
    {
        public List<ScheduleVisitModel> LstScheduleVisitDomainModel { get; set; }
        public VisitProcessingDetailsModel GetScheduledVisitDetailsToProcess(Guid visitGuid, IVisitProcessingService visitProcessingService)
        {
            var visitDetails = visitProcessingService.GetScheduledVisitDetailsToProcess(visitGuid);
            VisitProcessingDetailsModel model = new VisitProcessingDetailsModel();
            model.ScheduleDetails = visitDetails.Tables[0].DataTableToList<ScheduleVisitModel>().FirstOrDefault();
            model.ControlNumberDetails = visitDetails.Tables[1].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            model.ManufacturerDetails = visitDetails.Tables[4].DataTableToList<ManufacturerViewModel>().FirstOrDefault() ?? new ManufacturerViewModel();
            model.ClientDetails = visitDetails.Tables[5].DataTableToList<ClientViewModel>().FirstOrDefault();
            model.ClientUnitDetails = visitDetails.Tables[6].DataTableToList<ClientUnitsViewModel>().FirstOrDefault() ?? new ClientUnitsViewModel();
            model.ManufacturerUnitsDetails = visitDetails.Tables[7].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault() ?? new ManufacturerUnitsViewModel();
            model.LstTravelTypes = visitDetails.Tables[8].DataTableToList<TravelTypesModel>() ?? new List<TravelTypesModel>();
            return model;
        }
        public bool CaptureVisitEnggVisitDetails(VisitProcessingModel model, IVisitProcessingService visitProcessingService)
        {
            if (model.TechnicalDocsList.Any())
            {
                foreach (var doc in model.TechnicalDocsList)
                {
                    var retStatus = visitProcessingService.UploadVisitEngineerSupportDocs(model.VEM_ID, doc.FileTitle, doc.FileLink, doc.FileSize, 11, model.SiteId, model.LoginUserId);
                }
            }

            if (model.TravelDocsList.Any())
            {
                foreach (var doc in model.TravelDocsList)
                {
                    var retStatus = visitProcessingService.UploadVisitEngineerSupportDocs(model.VEM_ID, doc.FileTitle, doc.FileLink, doc.FileSize, 12, model.SiteId, model.LoginUserId);
                }
            }

            if (model.TravelExpenses.Any())
            {
                foreach (var expense in model.TravelExpenses)
                {
                    var retStatus = visitProcessingService.AddTravelExpense(model.VEM_ID, expense.TravelTypeId, expense.FromDate, expense.ToDate, expense.TravelKM, expense.Expenses);
                }
            }
            Mapper.CreateMap<VisitProcessingModel, VisitProcessingDomainModel>();
            var details = Mapper.Map<VisitProcessingModel, VisitProcessingDomainModel>(model);
            var status = visitProcessingService.CaptureVisitEnggVisitDetails(details);
            return status;
        }

        public bool UpdateCapturedVisitDetails(VisitProcessingModel model, IVisitProcessingService visitProcessingService)
        {
            if (model.TechnicalDocsList.Any())
            {
                foreach (var doc in model.TechnicalDocsList)
                {
                    var retStatus = visitProcessingService.UploadVisitEngineerSupportDocs(model.VEM_ID, doc.FileTitle, doc.FileLink, doc.FileSize, 11, model.SiteId, model.LoginUserId);
                }
            }

            if (model.TravelDocsList.Any())
            {
                foreach (var doc in model.TravelDocsList)
                {
                    var retStatus = visitProcessingService.UploadVisitEngineerSupportDocs(model.VEM_ID, doc.FileTitle, doc.FileLink, doc.FileSize, 12, model.SiteId, model.LoginUserId);
                }
            }

            if (model.TravelExpenses.Any())
            {
                foreach (var expense in model.TravelExpenses)
                {
                    var retStatus = visitProcessingService.AddTravelExpense(model.VEM_ID, expense.TravelTypeId, expense.FromDate, expense.ToDate, expense.TravelKM, expense.Expenses);
                }
            }

            if (model.RemovedExpenseIds.Any())
            {
                var retStatus = visitProcessingService.DeleteTravelExpense(model.RemovedExpenseIds);
            }

            if (model.RemovedSupportDocs.Any())
            {
                foreach (var supportDoc in model.RemovedSupportDocs)
                {
                    var retStatus = visitProcessingService.DeleteVisitSupportDocFromDB(supportDoc.FileId);
                    if (retStatus)
                    {
                        var fileDeleteStatus = new FileBusinessModel().DeleteFileFromAzure(supportDoc.FileLink, model.SiteId);
                    }
                }
            }
            Mapper.CreateMap<VisitProcessingModel, VisitProcessingDomainModel>();
            var details = Mapper.Map<VisitProcessingModel, VisitProcessingDomainModel>(model);
            var status = visitProcessingService.UpdateCaptureVisitEnggVisitDetails(details);
            return status;
        }
        public bool AcceptVisitSchedule(int visitId, int loginUserId, IVisitProcessingService visitProcessingService)
        {
            var status = visitProcessingService.AcceptVisitSchedule(visitId, loginUserId);
            return status;
        }
        public VisitProcessingDetailsModel GetEnggCapturedVisitDetailsToEdit(Guid visitGuid, int VEMId, IVisitProcessingService visitProcessingService)
        {
            var visitDetails = visitProcessingService.GetEnggCapturedVisitDetailsToEdit(visitGuid, VEMId);
            VisitProcessingDetailsModel model = new VisitProcessingDetailsModel();
            model.ScheduleDetails = visitDetails.Tables[0].DataTableToList<ScheduleVisitModel>().FirstOrDefault();
            model.ControlNumberDetails = visitDetails.Tables[1].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            model.PurchaseOrderDetails = visitDetails.Tables[3].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault() ?? new PurchaseOrderViewModel();
            model.ManufacturerDetails = visitDetails.Tables[4].DataTableToList<ManufacturerViewModel>().FirstOrDefault() ?? new ManufacturerViewModel();
            model.ClientDetails = visitDetails.Tables[5].DataTableToList<ClientViewModel>().FirstOrDefault();
            var capturedVisitDetails = visitDetails.Tables[6].DataTableToList<VisitProcessingModel>().FirstOrDefault();
            model.VEM_ID = capturedVisitDetails.VEM_ID;
            model.VisitComments = capturedVisitDetails.VisitComments;
            model.InspReportNumber = capturedVisitDetails.InspReportNumber;
            model.VisitedFrom = capturedVisitDetails.VisitedFrom;
            model.VisitedTo = capturedVisitDetails.VisitedTo;
            List<FileViewModel> lstFileDocs = visitDetails.Tables[7].DataTableToList<FileViewModel>().ToList();
            model.TechnicalDocsList = lstFileDocs.Where(m => (m.SectionId == 11)).ToList();
            model.TravelDocsList = lstFileDocs.Where(m => (m.SectionId == 12)).ToList();
            model.ClientUnitDetails = visitDetails.Tables[8].DataTableToList<ClientUnitsViewModel>().FirstOrDefault() ?? new ClientUnitsViewModel();
            model.ManufacturerUnitsDetails = visitDetails.Tables[9].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault() ?? new ManufacturerUnitsViewModel();
            model.LstPurchaseOrderItems = visitDetails.Tables[10].DataTableToList<PurchaseOrderItemsViewModel>().ToList() ?? new List<PurchaseOrderItemsViewModel>();
            model.VisitId = model.ScheduleDetails.VisitId;
            model.LstTravelTypes = visitDetails.Tables[11].DataTableToList<TravelTypesModel>() ?? new List<TravelTypesModel>();
            model.TravelExpenses = visitDetails.Tables[12].DataTableToList<TravelExpensesModel>() ?? new List<TravelExpensesModel>();
            return model;
        }
        #region QualityCheck

        public VisitProcessingDetailsModel GetVisitDetailsToQualityCheck(Guid visitGuid, IVisitProcessingService visitProcessingService)
        {
            var visitDetails = visitProcessingService.GetVisitDetailsToQualityCheck(visitGuid);
            VisitProcessingDetailsModel model = new VisitProcessingDetailsModel();
            model.ScheduleDetails = visitDetails.Tables[0].DataTableToList<ScheduleVisitModel>().FirstOrDefault();
            //model.ControlNumberDetails = visitDetails.Tables[1].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            //model.PurchaseOrderDetails = visitDetails.Tables[3].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault() ?? new PurchaseOrderViewModel();
            //model.ManufacturerDetails = visitDetails.Tables[4].DataTableToList<ManufacturerViewModel>().FirstOrDefault() ?? new ManufacturerViewModel();
            //model.ClientDetails = visitDetails.Tables[5].DataTableToList<ClientViewModel>().FirstOrDefault();
            model.LstVisitProcessingDetails = new List<VisitProcessingModel>();
            List<FileViewModel> lstFileDocs = new List<FileViewModel>();
            List<TravelExpensesModel> lstVisitExpenses = visitDetails.Tables[5].DataTableToList<TravelExpensesModel>().ToList();
            lstFileDocs = visitDetails.Tables[2].DataTableToList<FileViewModel>().ToList();
            foreach (var employeeVisit in visitDetails.Tables[1].DataTableToList<VisitProcessingModel>().ToList())
            {
                employeeVisit.TechnicalDocsList = lstFileDocs.Where(m => (m.SectionId == 11) && (m.GenericId == employeeVisit.VEM_ID)).ToList();
                employeeVisit.TravelDocsList = lstFileDocs.Where(m => (m.SectionId == 12) && (m.GenericId == employeeVisit.VEM_ID)).ToList();
                employeeVisit.TravelExpenses = lstVisitExpenses.Where(e => e.VEMId == employeeVisit.VEM_ID).ToList();
                model.LstVisitProcessingDetails.Add(employeeVisit);
            }
            model.ClientUnitDetails = visitDetails.Tables[3].DataTableToList<ClientUnitsViewModel>().FirstOrDefault() ?? new ClientUnitsViewModel();
            //model.ManufacturerUnitsDetails = visitDetails.Tables[9].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault() ?? new ManufacturerUnitsViewModel();
            model.LstPurchaseOrderItems = visitDetails.Tables[4].DataTableToList<PurchaseOrderItemsViewModel>().ToList() ?? new List<PurchaseOrderItemsViewModel>();
            //model.VEM_ID = visitEmpDetails.VEM_ID;
            model.VisitId = model.ScheduleDetails.VisitId;
            //model.UserId = visitEmpDetails.UserId;
            //model.VisitedFrom = visitEmpDetails.VisitedFrom;
            //model.VisitedTo = visitEmpDetails.VisitedTo;
            //model.VisitComments = visitEmpDetails.VisitComments;
            return model;
        }

        public bool UpdateQualityCheckStatus(int visitId, string qualityHeadComments, bool qualityCheckStatus, int loginUserId, IVisitProcessingService visitProcessingService)
        {
            var retStatus = visitProcessingService.UpdateQualityCheckStatus(visitId, qualityHeadComments, qualityCheckStatus, loginUserId);
            return retStatus;
        }

        #endregion

        #region FinanceApproval

        public bool UpdateFinanceApprovalStatus(int visitId, string financeApproverComments, bool approvalStatus, int loginUserId, IVisitProcessingService visitProcessingService)
        {
            var retStatus = visitProcessingService.UpdateFinanceApprovalStatus(visitId, financeApproverComments, approvalStatus, loginUserId);
            return retStatus;
        }
        public VisitProcessingDetailsModel GetVisitDetailsToFinanceApprove(Guid visitGuid, IVisitProcessingService visitProcessingService)
        {
            var visitDetails = visitProcessingService.GetVisitDetailsToQualityCheck(visitGuid);
            VisitProcessingDetailsModel model = new VisitProcessingDetailsModel();
            model.ScheduleDetails = visitDetails.Tables[0].DataTableToList<ScheduleVisitModel>().FirstOrDefault();
            model.ControlNumberDetails = visitDetails.Tables[1].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            model.PurchaseOrderDetails = visitDetails.Tables[3].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault() ?? new PurchaseOrderViewModel();
            model.ManufacturerDetails = visitDetails.Tables[4].DataTableToList<ManufacturerViewModel>().FirstOrDefault() ?? new ManufacturerViewModel();
            model.ClientDetails = visitDetails.Tables[5].DataTableToList<ClientViewModel>().FirstOrDefault();
            model.LstVisitProcessingDetails = new List<VisitProcessingModel>();
            List<FileViewModel> lstFileDocs = new List<FileViewModel>();
            lstFileDocs = visitDetails.Tables[7].DataTableToList<FileViewModel>().ToList();
            foreach (var employeeVisit in visitDetails.Tables[6].DataTableToList<VisitProcessingModel>().ToList())
            {
                employeeVisit.TechnicalDocsList = lstFileDocs.Where(m => (m.SectionId == 11) && (m.GenericId == employeeVisit.VEM_ID)).ToList();
                employeeVisit.TravelDocsList = lstFileDocs.Where(m => (m.SectionId == 12) && (m.GenericId == employeeVisit.VEM_ID)).ToList();
                model.LstVisitProcessingDetails.Add(employeeVisit);
            }
            model.ClientUnitDetails = visitDetails.Tables[8].DataTableToList<ClientUnitsViewModel>().FirstOrDefault() ?? new ClientUnitsViewModel();
            model.ManufacturerUnitsDetails = visitDetails.Tables[9].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault() ?? new ManufacturerUnitsViewModel();
            model.LstPurchaseOrderItems = visitDetails.Tables[10].DataTableToList<PurchaseOrderItemsViewModel>().ToList() ?? new List<PurchaseOrderItemsViewModel>();
            model.VisitId = model.ScheduleDetails.VisitId;
            return model;
        }
        public List<ScheduleVisitModel> GetLogSheetDetailsDownload(int loginUserSiteId, DateTime Startdate, DateTime Enddate,  IVisitProcessingService visitProcessingService)
        {

            //var competanceDetails = visitProcessingService.GetLogSheetDetailsDownload(loginUserSiteId, UserActive);
            //Mapper.CreateMap<CompetanceDomainModel, CompetanceViewModel>();
            //LstVisitProcessingDetails = competanceDetails.Select(Mapper.Map<CompetanceDomainModel, CompetanceViewModel>).ToList();
            //return LstCompetanceViewModel;


            //List<VisitProcessingModel> LstVisitProcessingDetails = new List<VisitProcessingModel>();
            var visitProcessingDetails = visitProcessingService.GetLogSheetDetailsDownload(loginUserSiteId, Startdate, Enddate);
            Mapper.CreateMap<ScheduleVisitDomainModel, ScheduleVisitModel>();
            LstScheduleVisitDomainModel = visitProcessingDetails.Select(Mapper.Map<ScheduleVisitDomainModel, ScheduleVisitModel>).ToList();
            return LstScheduleVisitDomainModel;
        }
        public List<ScheduleVisitModel> GetLogSheetDetailsDownload1(int siteId, DateTime startdate, DateTime enddate, string filters, IVisitProcessingService service)
        {
            var data = service.GetLogSheetDetailsDownload1(siteId, startdate, enddate, filters);

            Mapper.CreateMap<ScheduleVisitDomainModel, ScheduleVisitModel>();

            return data
                .Select(Mapper.Map<ScheduleVisitDomainModel, ScheduleVisitModel>)
                .ToList();
        }
        #endregion
    }
}