using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Service.EnquiryService;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Linq;
using System.Transactions;
using System.Web;

namespace IQEApp.Web.Models.EnquiryModel
{
    public class EnquiryViewModel : BaseViewModel
    {
        public int EID { get; set; }

        [DisplayName("Enquiry No")]
        public string EnquiryID { get; set; }

        [Required]
        public int EnquiryCategoryId { get; set; }
        public string EnquiryCategoryName { get; set; }
        [DisplayName("Customer ID")]
        [Required]
        //[Range(1, 1000)]
        public int ClientId { get; set; }

        [Required]
        [DisplayName("Customer Name")]
        [StringLength(80, ErrorMessage = "Enter Less than 80 characters")]
        public string ClientName { get; set; }

        [DisplayName("Enquiry Date")]
        [Required(ErrorMessage = "Enquiry Date is required.")]
        public DateTime? EnquiryDate { get; set; }


        //public int Total { get; set; }

        public DateTime? CreatedDate { get; set; }
        public int CreatedBy { get; set; }

        public bool IsEnquiryActive { get; set; }
        //public List<int> LstWorkScopeIds { get; set; }

        [Required(ErrorMessage = "Please Enter Quotation No.")]
        [DisplayName("Quotation No")]
        public string QuotationNo { get; set; }
        [Required]
        [DisplayName("Quotation Date")]
        public DateTime? QuotationDate { get; set; }

        public string RevisionNo { get; set; }

        public int FileId { get; set; }
        [Required(ErrorMessage = "Please select file.")]
        [RegularExpression(@"([a-zA-Z0-9\s_\\.\-:])+(.pdf|.doc)$", ErrorMessage = "Only Pdf doc files allowed.")]
        public string FileName { get; set; }

        public string PhysicalFileName { get; set; } // for Backup files downloading
        public string FilePath { get; set; }

        [DisplayName("Upload File")]
        public HttpPostedFileBase[] UploadFile { get; set; }
        public bool QuotationStatusFlag { get; set; }
        public string SubmitStatus { get; set; }
        public string ProposalOwner { get; set; }

        public List<EnquiryCategoryModel> LstEnquiryCategoryModel { get;set;}
         public List<EnquiryViewModel> LstEnquiryViewModel { get; set; } = new List<EnquiryViewModel>();

    }

    public class EnquiryCategoryModel
    {
        public int Id { get; set; }
        public int EID { get; set; }   // FK
        public int SNo { get; set; }
        [DisplayName("Item Description")]
        public string Details { get; set; }
        public string Scope { get; set; }
        public string Position { get; set; }
        [DisplayName("UOM")]
        public int? UOMId { get; set; }
        public string UOMName { get; set; }
        public string OtherUOM { get; set; }
        // public string UOM { get; set; }
        public int Qty { get; set; }
        public string ApplicableCodeStandards { get; set; }
        public string Qualification { get; set; }
        public string Competance { get; set; }
        public string Experience { get; set; }
        public string Duration { get; set; }
        public int Attendees { get; set; }
        public string ResponseTime { get; set; }
        [Required]
        public string Location { get; set; }
        public string Remarks { get; set; }
        public string Budget { get; set; }
        public string Food { get; set; }
        public string LocalConveyance { get; set; }
        public string MobDeMob { get; set; }
        public string OvertimeCharges { get; set; }
        public int CreatedBy { get; set; }
    }

   
    public class EnquiryListViewModel
    {
        public IEnumerable<EnquiryViewModel> Enquiries { get; set; }
        public EnquiryStatusCountModel StatusCounts { get; set; }
    }
    public class EnquirySaveResult
    {
        public int EID { get; set; }
        public string EnquiryNo { get; set; }
    }

    public class EnquiryCategories
    {
        public int ID { get; set; }
        public string Name { get; set; }
        public string Code { get; set; } 
    }
    public class EnquiryStatusCountModel
    {
        public int ID { get; set; }
        public string Name { get; set; }

        public int WonCount { get; set; }
        public int LostCount { get; set; }
        public int PendingCount { get; set; }
        public int DeclinedCount { get; set; }
        public int DenyCount { get; set; }
        public int TotalCount { get; set; }

        public decimal WonPercentage { get; set; }
        public decimal LostPercentage { get; set; }
        public decimal PendingPercentage { get; set; }
        public decimal DeclinedPercentage { get; set; }
        public decimal DenyPercentage { get; set; }

    }
    public class EnquiryDetailsModel : EnquiryViewModel
    {
        public List<EnquiryCategories> LstEnquiryCategories { get; set; }
        //public List<CommonModel.StateModel> LstStates { get; set; }
        //public List<CommonModel.CountryModel> LstCountries { get; set; }
        //public List<CommonModel.WorkScopeModel> LstWorkScope { get; set; }

        public List<ClientViewModel> LstClients { get; set; }
        public List<CommonModel.UnitOfMeasurment> LstUOM { get; set; }
        //public List<EnquiryCategoryModel> LstEnquiryCategoryModel { get; set; } 
    }

    public class DocumentRevisionViewModel
    {
        public List<EnquiryViewModel> ActiveFiles { get; set; }
        public List<EnquiryViewModel> SupersededFiles { get; set; }
    }

    public class EnquiryBusinessModel
    {
        public List<EnquiryViewModel> LstEnquiryViewModel { get; set; }
        #region Enquiry
        public List<EnquiryViewModel> GetEnquiryListBySiteId(int loginUserSiteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, IEnquiryService enquiryService)
        {
            var enquiryDetails = enquiryService.GetEnquiryListBySiteId(loginUserSiteId, strSearch, alphaChar, offset, fetch, activeStatus, sortingOrder);
            Mapper.CreateMap<EnquiryDomainModel, EnquiryViewModel>();
            LstEnquiryViewModel = enquiryDetails.Select(Mapper.Map<EnquiryDomainModel, EnquiryViewModel>).ToList();
            return LstEnquiryViewModel;
        }

        //public EnquiryDetailsModel GetEnquiryListBySiteId1(int loginUserSiteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, IEnquiryService enquiryService)
        //{
        //    var dsEnquiryDetails = enquiryService.GetEnquiryListBySiteId1(loginUserSiteId, strSearch, alphaChar, offset, fetch, activeStatus, sortingOrder);
        //    EnquiryDetailsModel objEnquiryDetailsModel = new EnquiryDetailsModel();
        //    List<EnquiryViewModel> enquiryDetails = dsEnquiryDetails.Tables[0].DataTableToList<EnquiryViewModel>();
        //    objEnquiryDetailsModel.LstEnquiryStatus = dsEnquiryDetails.Tables[1].DataTableToList<CommonModel.EnquiryStatusCount>();

        //    return objEnquiryDetailsModel;
        //}

        public (IEnumerable<EnquiryViewModel> Enquiries, EnquiryStatusCountModel StatusCounts) GetEnquiryData(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus,string status, string sortingOrder, string fiYear, IEnquiryService enquiryService)
        {
            var ds = enquiryService.GetEnquiryListBySiteId1(siteId, strSearch, alphaChar, offset, fetch, activeStatus,status, sortingOrder, fiYear);

            List<EnquiryViewModel> lstEnquiryViewModel = ds.Tables[0].DataTableToList<EnquiryViewModel>();
            if (ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0)
            {
                var categoryList = ds.Tables[1].DataTableToList<EnquiryCategoryModel>();

                // Group categories by EnquiryID and attach
                foreach (var enquiry in lstEnquiryViewModel)
                {
                    enquiry.LstEnquiryCategoryModel = categoryList.Where(cc => cc.EID == enquiry.EID)
                        .ToList();
                }
            }
            EnquiryStatusCountModel c= ds.Tables[2].DataTableToList<EnquiryStatusCountModel>().FirstOrDefault();

            return (lstEnquiryViewModel, c);
    }

        public EnquiryDetailsModel GetEnquiryDetailsToAdd(int loginUserSiteId, IEnquiryService enquiryService)
        {
            var dsEnquiryDetails = enquiryService.GetEnquiryDetailsToAdd(loginUserSiteId);
            EnquiryDetailsModel objEnquiryDetailsModel = new EnquiryDetailsModel();
            //// objEnquiryDetailsModel.LstWorkScope = new List<CommonModel.WorkScopeModel>();
            objEnquiryDetailsModel.LstEnquiryCategories = dsEnquiryDetails.Tables[0].DataTableToList<EnquiryCategories>();
            ////objEnquiryDetailsModel.LstWorkScope = dsEnquiryDetails.Tables[1].DataTableToList<CommonModel.WorkScopeModel>();
            objEnquiryDetailsModel.LstClients = dsEnquiryDetails.Tables[2].DataTableToList<ClientViewModel>();
            objEnquiryDetailsModel.LstUOM = dsEnquiryDetails.Tables[3].DataTableToList<CommonModel.UnitOfMeasurment>();
           // objEnquiryDetailsModel.LstEnquiryCategoryModel = new List<EnquiryCategoryModel>();
            return objEnquiryDetailsModel;
        }

        public EnquiryViewModel GetEnquiryQuatationDetailsToAdd(int loginUserSiteId, IEnquiryService enquiryService)
        {
            var dsEnquiryDetails = enquiryService.GetEnquiryDetailsToAdd(loginUserSiteId);
            EnquiryViewModel objEnquiryDetailsModel = new EnquiryViewModel();
            // objEnquiryDetailsModel.LstWorkScope = new List<CommonModel.WorkScopeModel>();
          //  objEnquiryDetailsModel.LstWorkScope = dsEnquiryDetails.Tables[0].DataTableToList<CommonModel.WorkScopeModel>();
            return objEnquiryDetailsModel;
        }
        public string SaveEnquiryDetails(EnquiryDetailsModel obj, IEnquiryService enquiryService)
        {
            string enquiryId = "0";

            if (obj == null)
                return enquiryId;

                // Configure mapping once (better move these to AutoMapper Profile)
                Mapper.CreateMap<EnquiryDetailsModel, EnquiryDomainModel>();
                Mapper.CreateMap<EnquiryCategoryModel, EnquiryCategoryDomainModel>();

                // Map main enquiry
                var data = Mapper.Map<EnquiryDetailsModel, EnquiryDomainModel>(obj);

                using (var transcope = new TransactionScope(TransactionScopeOption.Required,
                    new TransactionOptions { IsolationLevel = System.Transactions.IsolationLevel.ReadCommitted }))
                {
                // Save main enquiry
                   var saveResult = enquiryService.SaveEnquiryDetails(data);
                if (saveResult != null && saveResult.EID > 0 && obj.LstEnquiryCategoryModel != null && obj.LstEnquiryCategoryModel.Count > 0)
                {
                        enquiryId = saveResult.EnquiryNo;

                        bool flag = false;
                        foreach (var item in obj.LstEnquiryCategoryModel)
                        {
                            // Map to domain model
                            var categoryDomain = Mapper.Map<EnquiryCategoryModel, EnquiryCategoryDomainModel>(item);
                            categoryDomain.EID = saveResult.EID;

                            // Save category
                           bool result = enquiryService.SaveEnquiryCategoryDetail(categoryDomain, flag);
                           if (result == false)
                            {
                                 transcope.Dispose();
                                 enquiryId = "0";
                                 return enquiryId;
                            }
                        }
                }

                    // Commit transaction
                    transcope.Complete();
                }

            return enquiryId;
        }

        public bool IsEnquiryExists(EnquiryViewModel obj, IEnquiryService enquiryService)
        {
            Mapper.CreateMap<EnquiryViewModel, EnquiryDomainModel>();
            EnquiryDomainModel objEnquiryDomainModel = Mapper.Map<EnquiryViewModel, EnquiryDomainModel>(obj);
            return enquiryService.IsEnquiryExistsAlready(objEnquiryDomainModel);
        }

        public List<EnquiryViewModel> GetEnquiryQuotationBackupFiles(int EId, IEnquiryService enquiryService)
        {

            var enquiryDetails = enquiryService.GetEnquiryQuotationBackupFiles(EId);
            Mapper.CreateMap<EnquiryDomainModel, EnquiryViewModel>();
            LstEnquiryViewModel = enquiryDetails.Select(Mapper.Map<EnquiryDomainModel, EnquiryViewModel>).ToList();
            return LstEnquiryViewModel;
        }

        public DocumentRevisionViewModel GetEnquiryQuotationsRevisionsFiles(int eId, int loginUserSiteId, IEnquiryService enquiryService)
        {
            var dsDocumentDetails = enquiryService.GetEnquiryQuotationsRevisionsFiles(eId, loginUserSiteId);

            if (dsDocumentDetails == null || dsDocumentDetails.Tables.Count == 0)
                return null;

            var activeFiles = dsDocumentDetails.Tables[0].DataTableToList<EnquiryViewModel>();
            var supersededFiles = dsDocumentDetails.Tables.Count > 1
                ? dsDocumentDetails.Tables[1].DataTableToList<EnquiryViewModel>()
                : new List<EnquiryViewModel>();

            return new DocumentRevisionViewModel
            {
                ActiveFiles = activeFiles,
                SupersededFiles = supersededFiles
            };
        }
       
        public EnquiryViewModel GetEnquiryQuotationsRevisionsFiles1(int eId, int loginUserSiteId, IEnquiryService enquiryService)
        {
            var dsDocumentDetails = enquiryService.GetEnquiryQuotationsRevisionsFiles(eId, loginUserSiteId);

            if (dsDocumentDetails == null || dsDocumentDetails.Tables.Count == 0)
                return null;

            // Table 0 → Latest Revision (Active)
            var latest = dsDocumentDetails.Tables[0].DataTableToList<EnquiryViewModel>().FirstOrDefault();
            if (latest == null)
                return null;

            // Table 1 → Older Revisions (History)
            var oldRevisions = dsDocumentDetails.Tables.Count > 1
                ? dsDocumentDetails.Tables[1].DataTableToList<EnquiryViewModel>()
                : new List<EnquiryViewModel>();

            latest.LstEnquiryViewModel = oldRevisions; // attach old revisions
            return latest;
        }

        public EnquiryDetailsModel GetEnquiryDetailsToEdit(int EID, int loginUserSiteId, IEnquiryService enquiryService)
        {
            var dsEnquiryDetails = enquiryService.GetEnquiryDetailsToEdit(EID, loginUserSiteId);
            EnquiryDetailsModel objEnquiryDetailsModel = new EnquiryDetailsModel();
            var enquiryDetails = dsEnquiryDetails.Tables[0].DataTableToList<EnquiryViewModel>().FirstOrDefault();
            objEnquiryDetailsModel.EnquiryCategoryId = enquiryDetails.EnquiryCategoryId;
            objEnquiryDetailsModel.EnquiryCategoryName = enquiryDetails.EnquiryCategoryName;
            objEnquiryDetailsModel.EID = enquiryDetails.EID;
            objEnquiryDetailsModel.EnquiryID = enquiryDetails.EnquiryID;
            objEnquiryDetailsModel.ClientId = enquiryDetails.ClientId;
            objEnquiryDetailsModel.ClientName = enquiryDetails.ClientName;
            objEnquiryDetailsModel.EnquiryDate = enquiryDetails.EnquiryDate;

            objEnquiryDetailsModel.LstEnquiryCategoryModel = dsEnquiryDetails.Tables[1].DataTableToList<EnquiryCategoryModel>();
            objEnquiryDetailsModel.LstEnquiryCategories = dsEnquiryDetails.Tables[2].DataTableToList<EnquiryCategories>();
            
           
            objEnquiryDetailsModel.LstClients = dsEnquiryDetails.Tables[3].DataTableToList<ClientViewModel>();
            objEnquiryDetailsModel.LstUOM = dsEnquiryDetails.Tables[4].DataTableToList<CommonModel.UnitOfMeasurment>();

            return objEnquiryDetailsModel;
        }

        public bool UpdateEnquiryDetails(EnquiryDetailsModel obj, IEnquiryService enquiryService)
        {
            Mapper.CreateMap<EnquiryDetailsModel, EnquiryDomainModel>();
            Mapper.CreateMap<EnquiryCategoryModel, EnquiryCategoryDomainModel>();

            var data = Mapper.Map<EnquiryDetailsModel, EnquiryDomainModel>(obj);
            bool result = false;
            using (var transcope = new TransactionScope(TransactionScopeOption.Required, new TransactionOptions { IsolationLevel = System.Transactions.IsolationLevel.ReadCommitted }))
               {
                var saveResult = enquiryService.UpdateEnquiryDetails(data);
                if (saveResult && obj.LstEnquiryCategoryModel != null && obj.LstEnquiryCategoryModel.Count > 0)
                {
                    bool flag = true;
                    foreach (var item in obj.LstEnquiryCategoryModel)
                    {
                        var categoryDomain = Mapper.Map<EnquiryCategoryModel, EnquiryCategoryDomainModel>(item);

                        if(categoryDomain.EID == 0)
                            categoryDomain.EID = obj.LstEnquiryCategoryModel.FirstOrDefault().EID;
                        result = enquiryService.SaveEnquiryCategoryDetail(categoryDomain, flag);
                        flag = false;
                    }
                }
                transcope.Complete();
            }



            //var isSuccess = enquiryService.UpdateEnquiryDetails(objEnquiryDomainModel);
            return result;
        }

        public bool UpdateEnquiryStatus(EnquiryViewModel obj, IEnquiryService enquiryService)
        {
            Mapper.CreateMap<EnquiryViewModel, EnquiryDomainModel>();
            EnquiryDomainModel objEnquiryDomainModel = Mapper.Map<EnquiryViewModel, EnquiryDomainModel>(obj);
            var status = enquiryService.UpdateEnquiryStatus(objEnquiryDomainModel);
            return status;
        }

        public bool UploadQuotationByEnquiryID(EnquiryViewModel obj, IEnquiryService enquiryService)
        {
            Mapper.CreateMap<EnquiryViewModel, EnquiryDomainModel>();
            EnquiryDomainModel objEnquiryDomainModel = Mapper.Map<EnquiryViewModel, EnquiryDomainModel>(obj);
            var isSuccess = enquiryService.UploadQuotationByEnquiryID(objEnquiryDomainModel);
            return isSuccess;
        }

        public bool UploadQuotationFilesByEnquiryID(EnquiryViewModel obj, bool flag,IEnquiryService enquiryService)
        {
            Mapper.CreateMap<EnquiryViewModel, EnquiryDomainModel>();
            EnquiryDomainModel objEnquiryDomainModel = Mapper.Map<EnquiryViewModel, EnquiryDomainModel>(obj);
            var isSuccess = enquiryService.UploadQuotationFilesByEnquiryID(objEnquiryDomainModel, flag);
            return isSuccess;
        }
        public EnquiryViewModel GetEnquiryQuotationFileDetailsByID(IEnquiryService enquiryService, string EnquiryId, int? fileId,bool backupFile)
        {
            EnquiryViewModel files = new EnquiryViewModel();
            var filesInfo = enquiryService.GetEnquiryQuotationFileDetailsByID(EnquiryId,fileId, backupFile);
            Mapper.CreateMap<EnquiryDomainModel, EnquiryViewModel>();
            files = Mapper.Map<EnquiryDomainModel, EnquiryViewModel>(filesInfo);
            return files;
        }
        public bool SubmitEnquiryStatus(EnquiryViewModel obj, IEnquiryService enquiryService)
        {
            Mapper.CreateMap<EnquiryViewModel, EnquiryDomainModel>();
            EnquiryDomainModel objEnquiryDomainModel = Mapper.Map<EnquiryViewModel, EnquiryDomainModel>(obj);
            var status = enquiryService.SubmitEnquiryStatus(objEnquiryDomainModel);
            return status;
        }
        #endregion Enquiry

    }
}