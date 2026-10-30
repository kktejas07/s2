using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.CustomerComplaintDomain;
using IQEApp.Service.CustomerComplaintService;
using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using IQEApp.Web.Utils;
using System.ComponentModel.DataAnnotations;
using System.Web;
using IQEApp.Domain.ControlNumberDomain;
using IQEApp.Service.ControlNumberService;
using IQEApp.Web.Models.ControlNumberModel;

namespace IQEApp.Web.Models.CustomerComplaintModel
{
    public class CustomerComplaintViewModel : BaseViewModel
    {

        public string ComplaintID { get; set; }
        [DisplayName("Complaint Identifiction No")]
        [Required]
        public string ComplaintIdentifictionNo { get; set; }
        // public string ComplaintTitle { get; set; }

        [DisplayName("Descrption of Complaint")]
        [Required]
        public string ComplaintFullDescrption { get; set; }
        [DisplayFormat(DataFormatString = "{0:d}")]
        public DateTime? ComplaintReceivedDate { get; set; }
        //public DateTime IssueDate { get; set; }
        //public string IssueNo { get; set; }

        [DisplayName("Customer Name")]
        [Required]
        public string CustomerName { get; set; }

        [DisplayName("Contact Person")]
        [Required]
        public string ContactPerson { get; set; }
        [DisplayName("Unit / Proj")]
        public string Unit { get; set; }
        // public string DocumentNo { get; set; }
        [DisplayName("Supplier PO No")]
        public string POWO_Number { get; set; }

        [Required]
        [DisplayName("Job / Tag No")]
        public string EquipmentOfferedQty { get; set; }

        [DisplayName("Equipment Name")]
        [Required]
        public string EquipmentNameQty_Complaint { get; set; }

        [DisplayName("Responsible Party")]
        public int ResponsiblePartyId { get; set; }

        [Required]
        //public int ComplaintTypeId { get; set; }
        public int ComplaintModeId { get; set; }

        public List<CommonModel.ComplaintResponsable> LstResponsable { get; set; }

        public List<CommonModel.ComplaintType> LstComplaintType { get; set; }

        public List<CommonModel.ComplaintMode> LstComplaintMode { get; set; }

        public List<CommonModel.ComplaintAppealStatus> LstComplaintAppealStatus { get; set; }


        // public List<string> ResponsibleParty { get; set; }

        [DisplayName("Root Cause Analysis")]
        public string ComplaintRootCause { get; set; }

        [DisplayName("Corrective Action Taken")]
        public string ProposedCorrectiveAction { get; set; }

        [DisplayName("Corrective Action By")]
        public string CorrectiveActionBy { get; set; }
        [DisplayName("Complaint Appeal Status")]
        public string ComplaintStatusName { get; set; }

        public int ComplaintStatusId { get; set; }

        [Required(ErrorMessage = "Please select file.")]
        [RegularExpression(@"([a-zA-Z0-9\s_\\.\-:])+(.pdf|.doc)$", ErrorMessage = "Only Pdf doc files allowed.")]
        public string FileName { get; set; }

        public string FilePath { get; set; }
        public HttpPostedFileBase UploadFile { get; set; }
        public string Remarks { get; set; }
        public bool IsComplaintActive { get; set; }

        [DisplayFormat(DataFormatString = "{0:d}")]
        public DateTime? ClosingDate { get; set; }
        public int CreatedBy { get; set; }

    }


    public class CustomerComplaintBusinessModel
    {
        public List<CustomerComplaintViewModel> LstComplaintViewModel { get; set; }
        #region Complaint
        public List<CustomerComplaintViewModel> GetCustomerComplaintListBySiteId(int loginUserSiteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fiYear, ICustomerComplaintService ComplaintService)
        {
            var ComplaintDetails = ComplaintService.GetComplaintListBySiteId(loginUserSiteId, strSearch, alphaChar, offset, fetch, activeStatus, sortingOrder, fiYear);
            Mapper.CreateMap<CustomerComplaintDomainModel, CustomerComplaintViewModel>();
            LstComplaintViewModel = ComplaintDetails.Select(Mapper.Map<CustomerComplaintDomainModel, CustomerComplaintViewModel>).ToList();
            return LstComplaintViewModel;
        }

        public CustomerComplaintViewModel GetComplaintDetailsToAdd(int loginUserSiteId, ICustomerComplaintService ComplaintService)
        {
            var dsComplaintView = ComplaintService.GetComplaintDetailsToAdd(loginUserSiteId);
            CustomerComplaintViewModel objComplaintDetailsModel = new CustomerComplaintViewModel();
            //objComplaintDetailsModel.LstResponsable = dsComplaintView.Tables[0].DataTableToList<CommonModel.ComplaintResponsable>();
            // objComplaintDetailsModel.LstComplaintType = dsComplaintView.Tables[1].DataTableToList<CommonModel.ComplaintType>();
            objComplaintDetailsModel.LstComplaintMode = dsComplaintView.Tables[0].DataTableToList<CommonModel.ComplaintMode>();
            objComplaintDetailsModel.LstComplaintAppealStatus = dsComplaintView.Tables[1].DataTableToList<CommonModel.ComplaintAppealStatus>();
            return objComplaintDetailsModel;
        }

        //public CustomerComplaintViewModel GetComplaintQuatationDetailsToAdd(int loginUserSiteId, ICustomerComplaintService ComplaintService)
        //{
        //    var dsComplaintDetails = ComplaintService.GetComplaintDetailsToAdd(loginUserSiteId);
        //    CustomerComplaintViewModel objComplaintDetailsModel = new CustomerComplaintViewModel();
        //    // objComplaintDetailsModel.LstWorkScope = new List<CommonModel.WorkScopeModel>();
        //    //  objComplaintDetailsModel.LstWorkScope = dsComplaintDetails.Tables[0].DataTableToList<CommonModel.WorkScopeModel>();
        //    return objComplaintDetailsModel;
        //}
        public string SaveComplaintDetails(CustomerComplaintViewModel obj, ICustomerComplaintService ComplaintService)
        {
            Mapper.CreateMap<CustomerComplaintViewModel, CustomerComplaintDomainModel>();
            var data = Mapper.Map<CustomerComplaintViewModel, CustomerComplaintDomainModel>(obj);
            //ConvertExtensions objConvExt = new ConvertExtensions();
            CustomerComplaintDomainModel objComplaintDomainModel = Mapper.Map<CustomerComplaintViewModel, CustomerComplaintDomainModel>(obj);
            var ComplaintId = ComplaintService.SaveComplaintDetails(data);
            return ComplaintId;
        }

        //public bool IsComplaintExists(ComplaintViewModel obj, IComplaintService ComplaintService)
        //{
        //    Mapper.CreateMap<ComplaintViewModel, ComplaintDomainModel>();
        //    ComplaintDomainModel objComplaintDomainModel = Mapper.Map<ComplaintViewModel, ComplaintDomainModel>(obj);
        //    return ComplaintService.IsComplaintExistsAlready(objComplaintDomainModel);
        //}

        public CustomerComplaintViewModel GetComplaintDetailsToEdit(string ComplaintID, int loginUserSiteId, ICustomerComplaintService ComplaintService)
        {
            var dsComplaintDetails = ComplaintService.GetComplaintDetailsToEdit(ComplaintID, loginUserSiteId);
            CustomerComplaintViewModel objComplaintDetailsModel = new CustomerComplaintViewModel();
            var ComplaintDetails = dsComplaintDetails.Tables[0].DataTableToList<CustomerComplaintViewModel>().FirstOrDefault();
            //objComplaintDetailsModel.ComplaintID = ComplaintDetails.ComplaintID;
            //objComplaintDetailsModel.IssueDate = ComplaintDetails.IssueDate;
            //objComplaintDetailsModel.ComplaintReceivedDate = ComplaintDetails.ComplaintReceivedDate;
            //objComplaintDetailsModel.ComplaintFullDescrption = ComplaintDetails.ComplaintFullDescrption;
            //objComplaintDetailsModel.ComplaintTitle = ComplaintDetails.ComplaintTitle;
            //objComplaintDetailsModel.ComplaintIdentifictionNo = ComplaintDetails.ComplaintIdentifictionNo;
            //objComplaintDetailsModel.ComplaintAppealStatus = ComplaintDetails.ComplaintAppealStatus;
            //objComplaintDetailsModel.ComplaintRootCause = ComplaintDetails.ComplaintRootCause;
            //objComplaintDetailsModel.CorrectiveActionBy = ComplaintDetails.CorrectiveActionBy;
            //objComplaintDetailsModel.DocumentNo = ComplaintDetails.DocumentNo;

            objComplaintDetailsModel.ComplaintIdentifictionNo = ComplaintDetails.ComplaintIdentifictionNo;
            objComplaintDetailsModel.ContactPerson = ComplaintDetails.ContactPerson;
            objComplaintDetailsModel.ComplaintModeId = ComplaintDetails.ComplaintModeId;
            objComplaintDetailsModel.ComplaintStatusId = ComplaintDetails.ComplaintStatusId;
            objComplaintDetailsModel.ComplaintFullDescrption = ComplaintDetails.ComplaintFullDescrption;
            objComplaintDetailsModel.ComplaintReceivedDate = ComplaintDetails.ComplaintReceivedDate;
            //objComplaintDetailsModel.IssueDate = ComplaintDetails.IssueDate;
            //objComplaintDetailsModel.IssueNo = ComplaintDetails.IssueNo;
            objComplaintDetailsModel.CustomerName = ComplaintDetails.CustomerName;
            objComplaintDetailsModel.Unit = ComplaintDetails.Unit;
            objComplaintDetailsModel.POWO_Number = ComplaintDetails.POWO_Number;
            objComplaintDetailsModel.EquipmentOfferedQty = ComplaintDetails.EquipmentOfferedQty;
            objComplaintDetailsModel.EquipmentNameQty_Complaint = ComplaintDetails.EquipmentNameQty_Complaint;
            objComplaintDetailsModel.ResponsiblePartyId = ComplaintDetails.ResponsiblePartyId;
            objComplaintDetailsModel.ComplaintRootCause = ComplaintDetails.ComplaintRootCause;
            objComplaintDetailsModel.ProposedCorrectiveAction = ComplaintDetails.ProposedCorrectiveAction;
            objComplaintDetailsModel.CorrectiveActionBy = ComplaintDetails.CorrectiveActionBy;
            objComplaintDetailsModel.ComplaintStatusName = ComplaintDetails.ComplaintStatusName;
            objComplaintDetailsModel.FileName = ComplaintDetails.FileName;
            objComplaintDetailsModel.FilePath = ComplaintDetails.FilePath;
            objComplaintDetailsModel.Remarks = ComplaintDetails.Remarks;
            objComplaintDetailsModel.IsComplaintActive = ComplaintDetails.IsComplaintActive;
            objComplaintDetailsModel.ClosingDate = ComplaintDetails.ClosingDate;

            //objComplaintDetailsModel.LstResponsable = dsComplaintDetails.Tables[1].DataTableToList<CommonModel.ComplaintResponsable>();
            //objComplaintDetailsModel.LstComplaintType = dsComplaintDetails.Tables[2].DataTableToList<CommonModel.ComplaintType>();
            objComplaintDetailsModel.LstComplaintMode = dsComplaintDetails.Tables[1].DataTableToList<CommonModel.ComplaintMode>();
            objComplaintDetailsModel.LstComplaintAppealStatus = dsComplaintDetails.Tables[2].DataTableToList<CommonModel.ComplaintAppealStatus>();

            return objComplaintDetailsModel;
        }

        public bool UpdateComplaintDetails(CustomerComplaintViewModel obj, ICustomerComplaintService ComplaintService)
        {
            Mapper.CreateMap<CustomerComplaintViewModel, CustomerComplaintDomainModel>();
            CustomerComplaintDomainModel objComplaintDomainModel = Mapper.Map<CustomerComplaintViewModel, CustomerComplaintDomainModel>(obj);
            ConvertExtensions objConvExt = new ConvertExtensions();
            //objComplaintDomainModel.WorkScopeName = objConvExt.ConvertListToString(objComplaintDomainModel.LstWorkScopeIds);
            var isSuccess = ComplaintService.UpdateComplaintDetails(objComplaintDomainModel);
            return isSuccess;
        }

        public CustomerComplaintViewModel GetComplaintFilesByID(string Id, ICustomerComplaintService customerComplaintservice)
        {
            CustomerComplaintViewModel files = new CustomerComplaintViewModel();
            var filesInfo = customerComplaintservice.GetComplaintFilesByID(Id);
            Mapper.CreateMap<CustomerComplaintDomainModel, CustomerComplaintViewModel>();
            files = Mapper.Map<CustomerComplaintDomainModel, CustomerComplaintViewModel>(filesInfo);
            return files;
        }
        //public bool UpdateComplaintStatus(ComplaintViewModel obj, IComplaintService ComplaintService)
        //{
        //    Mapper.CreateMap<ComplaintViewModel, ComplaintDomainModel>();
        //    ComplaintDomainModel objComplaintDomainModel = Mapper.Map<ComplaintViewModel, ComplaintDomainModel>(obj);
        //    var status = ComplaintService.UpdateComplaintStatus(objComplaintDomainModel);
        //    return status;
        //}

        //public bool UploadQuotationByComplaintID(ComplaintViewModel obj, IComplaintService ComplaintService)
        //{
        //    Mapper.CreateMap<ComplaintViewModel, ComplaintDomainModel>();
        //    ComplaintDomainModel objComplaintDomainModel = Mapper.Map<ComplaintViewModel, ComplaintDomainModel>(obj);
        //    var isSuccess = ComplaintService.UploadQuotationByComplaintID(objComplaintDomainModel);
        //    return isSuccess;
        //}

        //public bool SubmitComplaintStatus(ComplaintViewModel obj, IComplaintService ComplaintService)
        //{
        //    Mapper.CreateMap<ComplaintViewModel, ComplaintDomainModel>();
        //    ComplaintDomainModel objComplaintDomainModel = Mapper.Map<ComplaintViewModel, ComplaintDomainModel>(obj);
        //    var status = ComplaintService.SubmitComplaintStatus(objComplaintDomainModel);
        //    return status;
        //}
        #endregion Complaint

    }
}