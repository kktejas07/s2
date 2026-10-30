using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Domain.InspectorDomain;
using IQEApp.Service.EnquiryService;
using IQEApp.Service.InspectorsService;
using IQEApp.Web.Models.EnquiryModel;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Linq;
using System.Web;


namespace IQEApp.Web.Models.Data
{
    public class InspectorRateViewModel
    {
        public int InspectorId { get; set; }
        public string Name { get; set; }
        public string Discipline { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Country { get; set; }
        public string Source { get; set; }

        public string EmailId { get; set; }
        public string ContactNumber { get; set; }
        public string Currency { get; set; }

        // Charges
        public decimal InspectionFeePerHour { get; set; }
        public decimal InspectionFeePerDay { get; set; }
        public decimal TravelChargesPerHour { get; set; }
        public decimal TravelChargesLumsum { get; set; }
        public decimal MileagePerKm { get; set; }
        public decimal MileageBeyond50Km { get; set; }
        public string OtherCharges { get; set; }
        public string Remarks { get; set; }
        public int SiteId { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int Total { get; set; }

        public int FileId { get; set; }
        [Required(ErrorMessage = "Please select file.")]
        [RegularExpression(@"([a-zA-Z0-9\s_\\.\-:])+(.pdf|.doc)$", ErrorMessage = "Only Pdf doc files allowed.")]
        public string FileName { get; set; }

        public string PhysicalFileName { get; set; } // for Backup files downloading
        public string FilePath { get; set; }
        public string RevisionNo  { get; set; } 

        [DisplayName("Upload File")]
        public HttpPostedFileBase[] UploadFile { get; set; }
        //public List<HttpPostedFileBase> UploadedFiles { get; set; } 

        // Optional: store already uploaded files for edit view
        //public List<InspectorDocumentViewModel> ExistingDocuments { get; set; }
        public List<InspectorRateViewModel> LstInspectorRateViewModel { get; set; } = new List<InspectorRateViewModel>();

    }
    public class InspectorDocumentViewModel
    {
        public int DocumentId { get; set; }
        public int InspectorId { get; set; }
        public string FileName { get; set; }          // Original name
        public string FilePath { get; set; }          // Physical or virtual path
        public string PhysicalFileName { get; set; } // for Backup files downloading
        public string UploadedBy { get; set; }
        public DateTime UploadedDate { get; set; }
    }

    public class InspectorDocumentRevisionViewModel
    {
        public List<InspectorRateViewModel> ActiveFiles { get; set; }
        public List<InspectorRateViewModel> SupersededFiles { get; set; }
    }


    public class InspectorsBusinessModel
    {
        public List<InspectorRateViewModel> lstInspectorRateViewModel; //{ get; set; }
        public List<InspectorRateViewModel> GetAllInspectorsDetails(int siteId, string strSearch, string alphaChar, int offsetIndex, int fetchCount, bool activeStatus, string sortingOrder, IInspectorsServices AssociateService)
        {
            var AssociateDetails = AssociateService.GetAllInspectorsDetails(siteId, strSearch, alphaChar, offsetIndex, fetchCount, activeStatus, sortingOrder);
            Mapper.CreateMap<InspectorRateDomainModel, InspectorRateViewModel>();
            lstInspectorRateViewModel = AssociateDetails.Select(Mapper.Map<InspectorRateDomainModel, InspectorRateViewModel>).ToList();

            return lstInspectorRateViewModel;
        }

        public List<InspectorRateViewModel> GetInspectorUploadedBackupFiles(int InspectorId, IInspectorsServices inspectorService)
        {
            var enquiryDetails = inspectorService.GetInspectorUploadedBackupFiles(InspectorId);
            Mapper.CreateMap<InspectorRateDomainModel, InspectorRateViewModel>();
            lstInspectorRateViewModel = enquiryDetails.Select(Mapper.Map<InspectorRateDomainModel, InspectorRateViewModel>).ToList();
            return lstInspectorRateViewModel;
        }
        public InspectorRateViewModel GetInspectorFileDetailsByID(IInspectorsServices inspectorService, int InspectorId, int? fileId, bool backupFile)
        {
            InspectorRateViewModel files = new InspectorRateViewModel();
            var filesInfo = inspectorService.GetInspectorFileDetailsByID(InspectorId, fileId, backupFile);
            Mapper.CreateMap<InspectorRateDomainModel, InspectorRateViewModel>();
            files = Mapper.Map<InspectorRateDomainModel, InspectorRateViewModel>(filesInfo);
            return files;
        }

        public bool ValidateInspector(InspectorRateViewModel objInspectorViewModel, IInspectorsServices InspectorService)
        {
            Mapper.CreateMap<InspectorRateViewModel, InspectorRateDomainModel>();
            InspectorRateDomainModel objInspectorDomainModel = Mapper.Map<InspectorRateViewModel, InspectorRateDomainModel>(objInspectorViewModel);
            return InspectorService.IsInspectorAlreadyExists(objInspectorDomainModel);
        }

        public int SaveUpdateInspector(InspectorRateViewModel objInspectorViewModel, bool flag, IInspectorsServices InspectorService)
        {
            Mapper.CreateMap<InspectorRateViewModel, InspectorRateDomainModel>();
            InspectorRateDomainModel objInspectorDomainModel = Mapper.Map<InspectorRateViewModel, InspectorRateDomainModel>(objInspectorViewModel);
            var InspectorId = InspectorService.SaveUpdateInspector(objInspectorDomainModel, flag);
            return InspectorId;
        }
        public bool SaveInspectorDocument(InspectorRateViewModel objInspectorViewModel, bool flag,IInspectorsServices InspectorService)
        {
            Mapper.CreateMap<InspectorRateViewModel, InspectorRateDomainModel>();
            InspectorRateDomainModel objInspectorDomainModel = Mapper.Map<InspectorRateViewModel, InspectorRateDomainModel>(objInspectorViewModel);
            var InspectorId = InspectorService.SaveInspectorDocument(objInspectorDomainModel,flag);
            return InspectorId;
        }

        public InspectorDocumentRevisionViewModel GetInspectorRevisionsFiles(int inspId, int loginUserSiteId, IInspectorsServices InspectorService)
        {
            var dsDocumentDetails = InspectorService.GetInspectorRevisionsFiles(inspId, loginUserSiteId);

            if (dsDocumentDetails == null || dsDocumentDetails.Tables.Count == 0)
                return null;

            var activeFiles = dsDocumentDetails.Tables[0].DataTableToList<InspectorRateViewModel>();
            var supersededFiles = dsDocumentDetails.Tables.Count > 1
                ? dsDocumentDetails.Tables[1].DataTableToList<InspectorRateViewModel>() : new List<InspectorRateViewModel>();

            return new InspectorDocumentRevisionViewModel
            {
                ActiveFiles = activeFiles,
                SupersededFiles = supersededFiles
            };
        }

        public bool DeleteInspector(int inspectorId,string remarks, int userId, IInspectorsServices InspectorService)
        {
            return InspectorService.DeleteInspector(inspectorId, remarks, userId);
        }

    }
}