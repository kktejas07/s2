using AutoMapper;
using DocumentFormat.OpenXml.Drawing;
using DocumentFormat.OpenXml.EMMA;
using DocumentFormat.OpenXml.Spreadsheet;
using IQEApp.Core.Extensions;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Domain.HomeDomain;
using IQEApp.Domain.VisitProcessing;
using IQEApp.Service.EnquiryService;
using IQEApp.Service.HomeService;
using IQEApp.Service.MasterService;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.EnquiryModel;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.ApplicationServices;

namespace IQEApp.Web.Models.HomeModel
{
    public class HomeViewModel : BaseViewModel
    {
        public int VisitId { get; set; }
        public int VisitPId { get; set; }
        public string VisitSeqId { get; set; }
        public string SONumber { get; set; }
        public int POID { get; set; }
        public int PONID { get; set; }
        public string PONIDs { get; set; }
        public string PONumber { get; set; }
        //public DateTime PODate { get; set; }
        public string PODate { get; set; }
        public DateTime ScheduleDate { get; set; }
        public string ScheduleComments { get; set; }
        public string ControlNo { get; set; }
        public string ControlNumberComments { get; set; }
        public Guid ControlNumberGuid { get; set; }
        public string ClientName { get; set; }
        public string ClientUnitName { get; set; }
        public string ClientAddress { get; set; }
        public string ClientState { get; set; }
        public string ClientCountry { get; set; }
        public int  ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }
        public string SubManufacturerDetails { get; set; }
        public string ManufacturerUnitName { get; set; }
        public string ManufacturerAddress { get; set; }
        public string ManufacturerState { get; set; }
        public string ManufacturerCountry { get; set; }
        public int VEM_ID { get; set; }
        public Guid VisitGuid { get; set; }
        public int VisitStatusId { get; set; }
        public string VisitStatusName { get; set; }
        public bool IsClaimInitiated { get; set; }
        public string UserFullName { get; set; }
        public string InspReportNo { get; set; }
        public DateTime InspReportDate { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public bool InspReportStatus { get; set; }
        public bool QulalityCheck { get; set; }
        public DateTime QulalityCheckSubmitDate { get; set; } 
        public int QualityCheckDoneBy { get; set; }
        public DateTime ReportSubmittedClientDate { get; set; }
        public bool ReportSubmittedClientStatus { get; set; }
        public string Comments { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string VisitLocation { get; set; }
        public int CountryId { get; set; }
        public int StateId { get; set; }
        public string StateName { get; set; }
        public double CostValue { get; set; }
        public List<int> ManufacturerIds { get; set; }

        // NEW: user-typed VisitSeqId that references the visit which already has reports
        public string ReferenceVisitSeqId { get; set; }

        public int ProspectiveCount { get; set; }
        // ISO 9001:2026 & ISO/IEC 17020:2026 Compliance Metadata
        public string StandardReference { get; set; } = "ISO 9001:2026 & ISO/IEC 17020:2026";
        public string EnvironmentalSiteCondition { get; set; }
        public bool ImpartialityDeclared { get; set; } = true;
    }

    public class VisitsSummaryViewModel
    {
        public int VisitStatusId { get; set; }
        public string VisitStatus { get; set; }
        public int VisitCount { get; set; }
    }

    public class InspectionReportViewModel :BaseViewModel
    {
        [DisplayName("Insp Report No")]
        [Required]
        public string InspReportNo { get; set; }
        
        [DisplayName("Insp Report Date")]
        [Required]
        public DateTime? InspReportDate { get; set; }

        [DisplayName("Visited From")]
        public DateTime? VisitedFrom { get; set; }

        [DisplayName("Visited To")]
        public DateTime? VisitedTo { get; set; }

        public int PONId { get; set; }

        public int POItemId { get; set; }
        //[DisplayName("Upload Insp Report FileName")]
        //[Required]
        //public HttpPostedFileBase[] UploadInspReportFileName { get; set; }

        public string FileName { get; set; }
        public string FilePath { get; set; }
        public bool InspReportStatus { get; set; }
        public bool QulalityCheck { get; set; }

        public int VisitId { get; set; }
        [DisplayName("Visit No")]
        public string VisitSeqID { get; set; }
        public int ModifiedBy { get; set; }
        public int CreatedBy { get; set; }

        // ISO 9001:2026 & ISO/IEC 17020:2026 Compliance Metadata
        public string StandardReference { get; set; } = "ISO 9001:2026 & ISO/IEC 17020:2026";
        public string EnvironmentalSiteCondition { get; set; }
        public bool ImpartialityDeclared { get; set; } = true;

        public List<POInspectionItem> LstPONumbers { get; set; }
    }

    public class POInspectionItem
    {
        public int PONId { get; set; }
        public int POItemId { get; set; }

        [DisplayName("PO Number")]
        public string PONumber { get; set; }

        public string BaseInspReportNo { get; set; }
        [DisplayName("Insp Report No")]
        public string InspReportNo { get; set; }

        [DisplayName("Visited From")]
        public DateTime? VisitedFrom { get; set; }

        [DisplayName("Visited To")]
        public DateTime? VisitedTo { get; set; }

        public string FileName { get; set; }

        [DisplayName("Files")]
        public List<HttpPostedFileBase> UploadFiles { get; set; } = new List<HttpPostedFileBase>(); // Manual binding required
        public List<string> ExistingFiles { get; set; }   // ← IMPORTANT
        public string RemovedFiles { get; set; }
    }


    public class InspectionReportPONumberViewModel
    {
        //public List<ScheduleVisitModel> LstScheduleVisitModel { get; set; }
        //public List<VisitProcessingModel> LstVisitProcessingModel { get; set; }
        //public List<ClientUnitsViewModel> LstClientUnitsViewModel { get; set; }
        //public List<ServiceOrderViewModel> LstServiceOrderViewModel { get; set; }
        //public List<ControlNumberViewModel> LstControlNumberViewModel { get; set; }
    }

    public class HomeBusinessModel
    {
        public List<HomeViewModel> LstHomeDetailViewModel { get; set; }
        public List<InspectionReportViewModel> LstInspectionReportViewModel { get; set; }
        public List<VisitsSummaryViewModel> LstVisitsSummaryViewModel { get; set; }
        public List<HomeViewModel> GetMyScheduledVisits(int statusId, int siteId, int loginUserId, IHomeService _home_service)
        {
            var scheduleDetails = _home_service.GetMyScheduledVisits(statusId, siteId, loginUserId);
            Mapper.CreateMap<HomeDomainModel, HomeViewModel>();
            LstHomeDetailViewModel = scheduleDetails.Select(Mapper.Map<HomeDomainModel, HomeViewModel>).ToList();
            return LstHomeDetailViewModel;
        }

        public HomeViewModel GetFileDetailsByVisitId(int VisitId, string fileName, IHomeService homeService)
        {
            HomeViewModel files = new HomeViewModel();
            var filesInfo = homeService.GetFileDetailsByVisitId(VisitId, fileName);
            Mapper.CreateMap<HomeDomainModel, HomeViewModel>();
            files = Mapper.Map<HomeDomainModel, HomeViewModel>(filesInfo);
            return files;
        }

        public int GetProspectiveAndSaveScheduleVisit(int VisitPId, int UserId, IHomeService homeService)
        {
            var obj = homeService.GetProspectiveByVisitPId(VisitPId);
            if (obj.UserIds == null)
                obj.UserIds = "-1";
            obj.LoginUserId = UserId;
            var  VisitId = homeService.SaveScheduleVisitByProspective(obj, VisitPId);

            return VisitId;
        }
        public List<HomeViewModel> GetSelectDateScheduledVisitsList(int siteId, DateTime today, string strSearch, string alphaChar, int offsetIndex, int fetchCount, bool activeStatus, string sortingOrder, IHomeService _home_service)
        {
            var scheduleDetails = _home_service.GetSelectDateScheduledVisitsList(siteId, today, strSearch, alphaChar, offsetIndex, fetchCount, activeStatus, sortingOrder);
            Mapper.CreateMap<HomeDomainModel, HomeViewModel>();
            LstHomeDetailViewModel = scheduleDetails.Select(Mapper.Map<HomeDomainModel, HomeViewModel>).ToList();
            return LstHomeDetailViewModel;
        }

        public (IEnumerable<HomeViewModel> HomeDetailViewModel, int ProspectiveCount) GetCancelledVisits(int siteId, DateTime today, string strSearch, string alphaChar,
                               int offsetIndex, int fetchCount, int activeStatus, string sortingOrder,  IHomeService _home_service)
        {
            var (scheduleDetails, prospectiveCount) = _home_service.GetCancelledVisits(siteId, today, strSearch, alphaChar, offsetIndex, fetchCount, activeStatus, sortingOrder);

            Mapper.CreateMap<HomeDomainModel, HomeViewModel>();
            var resultList = scheduleDetails.Select(Mapper.Map<HomeDomainModel, HomeViewModel>).ToList();

            return (resultList, prospectiveCount);
        }


        public List<HomeViewModel> GetProspectiveVisits(int siteId, DateTime today, string strSearch, string alphaChar, int offsetIndex, int fetchCount, string sortingOrder, IHomeService _home_service)
        {
            var scheduleDetails = _home_service.GetProspectiveVisits(siteId, today, strSearch, alphaChar, offsetIndex, fetchCount,  sortingOrder);
            Mapper.CreateMap<HomeDomainModel, HomeViewModel>();
            LstHomeDetailViewModel = scheduleDetails.Select(Mapper.Map<HomeDomainModel, HomeViewModel>).ToList();
            return LstHomeDetailViewModel;
        }
        public bool SubmitQualityCheckDateByVisitID(HomeViewModel obj,  IHomeService _home_service)
        {
            Mapper.CreateMap<HomeViewModel, HomeDomainModel>();
            HomeDomainModel objInspectionReportDomainModel = Mapper.Map<HomeViewModel, HomeDomainModel>(obj);
            var isSuccess = _home_service.SubmitQualityCheckDateByVisitID(objInspectionReportDomainModel);
            return isSuccess;
                  
        }

        public bool UpdateInspectionDateByVisitID(HomeViewModel obj, IHomeService _home_service)
        {
            Mapper.CreateMap<HomeViewModel, HomeDomainModel>();
            HomeDomainModel objInspectionReportDomainModel = Mapper.Map<HomeViewModel, HomeDomainModel>(obj);
            var isSuccess = _home_service.UpdateInspectionDateByVisitID(objInspectionReportDomainModel);
            return isSuccess;

        }

        public bool InActivateProspective(int visitPId, int loggedInUser, IHomeService _home_service)
        {
            var success = _home_service.InActivateProspective(visitPId, loggedInUser);
            return success;
        }
        public bool OnHoldCancalledInspectionVisit(HomeViewModel obj, IHomeService _home_service)
        {
            Mapper.CreateMap<HomeViewModel, HomeDomainModel>();
            HomeDomainModel objInspectionReportDomainModel = Mapper.Map<HomeViewModel, HomeDomainModel>(obj);
            var isSuccess = _home_service.OnHoldCancalledInspectionVisit(objInspectionReportDomainModel);
            return isSuccess;

        }

        // NEW: close current visit by referencing another visit seq id that already has reports
        public (bool Success, string Message) CloseVisitReferencingVisit(HomeViewModel obj, IHomeService _home_service)
        {
            Mapper.CreateMap<HomeViewModel, HomeDomainModel>();
            HomeDomainModel domain = Mapper.Map<HomeViewModel, HomeDomainModel>(obj);
            // ensure ReferenceVisitSeqId flows to domain
            domain.ReferenceVisitSeqId = obj.ReferenceVisitSeqId;
            var result = _home_service.CloseVisitWithReference(domain);
            // result is (bool Success, string Message)
            return result;
        }

        public bool ReportSubmitToClientDateByVisitID(HomeViewModel obj, IHomeService _home_service)
        {
            Mapper.CreateMap<HomeViewModel, HomeDomainModel>();
            HomeDomainModel objInspectionReportDomainModel = Mapper.Map<HomeViewModel, HomeDomainModel>(obj);
            var isSuccess = _home_service.ReportSubmitToClientDateByVisitID(objInspectionReportDomainModel);
            return isSuccess;

        }

        public bool UpdateCommentsByVisitID(HomeViewModel obj, IHomeService _home_service)
        {
            Mapper.CreateMap<HomeViewModel, HomeDomainModel>();
            HomeDomainModel objInspectionReportDomainModel = Mapper.Map<HomeViewModel, HomeDomainModel>(obj);
            var isSuccess = _home_service.UpdateCommentsByVisitID(objInspectionReportDomainModel);
            return isSuccess;

        }

        public bool SubmitInspectorNameByVisitID(HomeViewModel obj, IHomeService _home_service)
        {
            Mapper.CreateMap<HomeViewModel, HomeDomainModel>();
            HomeDomainModel objInspectionReportDomainModel = Mapper.Map<HomeViewModel, HomeDomainModel>(obj);
            var isSuccess = _home_service.SubmitInspectorNameByVisitID(objInspectionReportDomainModel);
            return isSuccess;

        }

        public decimal UpdateCostValueByVisitID(HomeViewModel obj, IHomeService _home_service)
        {
            Mapper.CreateMap<HomeViewModel, HomeDomainModel>();
            HomeDomainModel objInspectionReportDomainModel = Mapper.Map<HomeViewModel, HomeDomainModel>(obj);
            decimal updatedCost  = _home_service.UpdateCostValueByVisitID(objInspectionReportDomainModel);
            return updatedCost;

        }
        
        public bool IsInspReportNumberExitsAlready(string ReportNo , IHomeService _home_service)
        {
            var retStatus = _home_service.IsInspReportNumberExitsAlready(ReportNo);
            return retStatus;
        }
        public List<InspectionReportViewModel> GetInspectionReportFiles(int VisitId, IHomeService _home_service)
        {
            var enquiryDetails = _home_service.GetInspectionReportFiles(VisitId);
            Mapper.CreateMap<InspectionReportDomainModel, InspectionReportViewModel>();
            LstInspectionReportViewModel = enquiryDetails.Select(Mapper.Map<InspectionReportDomainModel, InspectionReportViewModel>).ToList();
            return LstInspectionReportViewModel;
        }

        public List<InspectionReportViewModel> GetInspectionReportBackupFiles(int EId, IHomeService _home_service)
        {
            var enquiryDetails = _home_service.GetInspectionReportBackupFiles(EId);
            Mapper.CreateMap<InspectionReportDomainModel, InspectionReportViewModel>();
            LstInspectionReportViewModel = enquiryDetails.Select(Mapper.Map<InspectionReportDomainModel, InspectionReportViewModel>).ToList();
            return LstInspectionReportViewModel;
        }

        public InspectionReportViewModel UploadIRDocumentsToAdd_Edit(int VisitId,int siteId, bool revised, IHomeService _home_service)
        {
            InspectionReportViewModel objInspectionReportViewModel = new  InspectionReportViewModel();
            var objHomeViewModel = _home_service.UploadIRDocumentsToAdd_Edit(VisitId , revised);
            Mapper.CreateMap<InspectionReportViewModel, InspectionReportDomainModel>();
            objInspectionReportViewModel.LstPONumbers = objHomeViewModel.Tables[0].DataTableToList<POInspectionItem>();

            foreach (var po in objInspectionReportViewModel.LstPONumbers)
            {
                if (!string.IsNullOrWhiteSpace(po.BaseInspReportNo) &&
                    string.IsNullOrWhiteSpace(po.InspReportNo))
                {
                    // Show base value in UI
                    po.InspReportNo = po.BaseInspReportNo;
                }
            }

            if (revised && objHomeViewModel.Tables.Count > 1 && objHomeViewModel.Tables[1].Rows.Count > 0)
                objInspectionReportViewModel.InspReportDate = objHomeViewModel.Tables[1].Rows[0].Field<DateTime?>("InspReportDate"); 

            //objDetailsModel.LstServiceOrdersList = controlNumberDetails.Select(Mapper.Map<ControlNumberDomainModel, ControlNumberViewModel>).ToList();
            return objInspectionReportViewModel;
        }

        //public InspectionReportViewModel GetInspectionReportFiles(int VisitId, int siteId, IHomeService _home_service)
        //{
        //    InspectionReportViewModel objInspectionReportViewModel = new InspectionReportViewModel();
        //    var objHomeViewModel = _home_service.GetPONumberByVisitId(VisitId);
        //    Mapper.CreateMap<InspectionReportViewModel, InspectionReportDomainModel>();
        //    objInspectionReportViewModel.LstPONumbers = objHomeViewModel.Tables[0].DataTableToList<POInspectionItem>();
        //    //objDetailsModel.LstServiceOrdersList = controlNumberDetails.Select(Mapper.Map<ControlNumberDomainModel, ControlNumberViewModel>).ToList();
        //    return objInspectionReportViewModel;
        //}


        public bool UploadInspectionReportByVisitID(InspectionReportViewModel obj,bool flag, IHomeService homeService)
        {
            Mapper.CreateMap<POInspectionItem, POInspectionDomainItem>()
        .ForMember(dest => dest.FileNames, opt => opt.MapFrom(src =>
            (src.UploadFiles ?? new List<HttpPostedFileBase>())
                .Where(f => f != null && !string.IsNullOrEmpty(f.FileName))
                .Select(f => f.FileName)
                .ToList()
        ));
            Mapper.CreateMap<InspectionReportViewModel, InspectionReportDomainModel>();
            InspectionReportDomainModel objInspectionReportDomainModel = Mapper.Map<InspectionReportViewModel, InspectionReportDomainModel>(obj);
            if (objInspectionReportDomainModel.CreatedBy <= 0)
                objInspectionReportDomainModel.CreatedBy = obj.CreatedBy > 0 ? obj.CreatedBy : (obj.ModifiedBy > 0 ? obj.ModifiedBy : obj.LoginUserId);
            if (objInspectionReportDomainModel.ModifiedBy <= 0)
                objInspectionReportDomainModel.ModifiedBy = obj.ModifiedBy > 0 ? obj.ModifiedBy : (obj.CreatedBy > 0 ? obj.CreatedBy : obj.LoginUserId);
            if (objInspectionReportDomainModel.LoginUserId <= 0)
                objInspectionReportDomainModel.LoginUserId = obj.LoginUserId;

            var isSuccess = homeService.UploadInspectionReportByVisitID(objInspectionReportDomainModel, flag);
            return isSuccess;
        }
        public bool UpdateInspectionReportByVisitID(int VisitId,  DateTime? InspReportDate, int LoginUserId, IHomeService homeService)
        {
           var result = homeService.UpdateInspectionReportByVisitID(VisitId, InspReportDate, LoginUserId );
            return result;
        }

        public List<VisitsSummaryViewModel> GetMyVisitsSummary(int loginUserId, IHomeService _home_service)
        {
            var summaryDetails = _home_service.GetMyVisitsSummary(loginUserId);
            Mapper.CreateMap<VisitsSummaryDomainModel, VisitsSummaryViewModel>();
            LstVisitsSummaryViewModel = summaryDetails.Select(Mapper.Map<VisitsSummaryDomainModel, VisitsSummaryViewModel>).ToList();
            return LstVisitsSummaryViewModel;
        }
    }
}