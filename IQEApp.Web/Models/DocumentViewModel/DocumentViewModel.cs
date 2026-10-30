using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.DocumentDomain;
using IQEApp.Service.DocumentService;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.UserModel;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace IQEApp.Web.Models.DocumentViewModel
{
    public class DocumentViewModel : BaseViewModel
    {

        public int DocumentId { get; set; }

        [DisplayName("Category")]
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }

        [DisplayName("Document Name")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 Characters")]
        public string DocumentName { get; set; }

        [DisplayName("Document Number")]
        public string DocumentNumber { get; set; }

        [DisplayName("Issue No")]
        public string IssueNo { get; set; }
        [DisplayName("Issue Date")]
        public DateTime? IssueDate { get; set; }
        [DisplayName("Revision No")]
        public string RevisionNo { get; set; }
        [DisplayName("Revision Date")]
        public DateTime? RevisionDate { get; set; }

        public string Responsibility { get; set; }
        [DisplayName("Retention Period")]
        public string RetentionPeriod { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }

        [DisplayName("Upload File")]
        public HttpPostedFileBase[] UploadFile { get; set; }
        public int Total { get; set; }
        // public int RevisionNo { get; set; }

        // public DateTime UploadedDate { get; set; }
        public List<CommonModel.DocumentType> LstDocumentType { get; set; }
        public List<CommonModel.Category> LstCategory { get; set; }

        public List<DocumentViewModel> lstDocumentViewModels { get; set; }

        public Guid DocumentGuid { get; set; }
        //[Required]
        //[DisplayName("Title")]
        //public int DocumentTypeId { get; set; }

        //public string DocumentType { get; set; }

        //[DisplayName("Description")]
        //[StringLength(1000, ErrorMessage = "Enter Less than 1000 Characters")]
        //public string DocumentDescription { get; set; }
        //public double? DocumentFileSize { get; set; }

        public DateTime? CreatedDate { get; set; }

    }

    public class DocumentBusinessModel
    {
        public List<DocumentViewModel> LstDocumentViewModel { get; set; }
        public List<DocumentViewModel> GetDocumentsListBySiteId(int loginUserSiteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string level, IDocumentService _documentService)
        {
            var documentDetails = _documentService.GetDocumentsListBySiteId(loginUserSiteId, strSearch, alphaChar, offset, fetch, activeStatus, sortingOrder, level);
            Mapper.CreateMap<DocumentDomainModel, DocumentViewModel>();
            LstDocumentViewModel = documentDetails.Select(Mapper.Map<DocumentDomainModel, DocumentViewModel>).ToList();
            return LstDocumentViewModel;
        }

        public DocumentViewModel GetDocumentDetailsToAdd(int loginUserSiteId, IDocumentService _documentService)
        {
            var dsDocumentDetails = _documentService.GetDocumentDetailsToAdd(loginUserSiteId);
            DocumentViewModel objDocumentViewModel = new DocumentViewModel();
            objDocumentViewModel.LstCategory = dsDocumentDetails.Tables[0].DataTableToList<CommonModel.Category>();
            //objDocumentViewModel.LstDocumentType = dsDocumentDetails.Tables[1].DataTableToList<CommonModel.DocumentType>();
            return objDocumentViewModel;
        }
        public int SaveDocumentDetails(DocumentViewModel objDocumentViewModel, IDocumentService _documentService)
        {
            Mapper.CreateMap<DocumentViewModel, DocumentDomainModel>();
            DocumentDomainModel objDocumentDomainModel = Mapper.Map<DocumentViewModel, DocumentDomainModel>(objDocumentViewModel);
            var DocId = _documentService.SaveDocumentDetails(objDocumentDomainModel);
            return DocId;
        }

        public bool DocumentUploadedByDocId(DocumentViewModel objDVM, bool Flag, IDocumentService _documentService)
        {
            Mapper.CreateMap<DocumentViewModel, DocumentDomainModel>();
            DocumentDomainModel objDocumentDomainModel = Mapper.Map<DocumentViewModel, DocumentDomainModel>(objDVM);
            var isSuccess = _documentService.DocumentUploadedByDocId(objDocumentDomainModel, Flag);
            return isSuccess;
        }
        public DocumentViewModel GetDocumnetFilesByID(int docId, string fileName, bool backupFile, int loginUserSiteId, IDocumentService _documentService)
        {
            DocumentViewModel files = new DocumentViewModel();
            var filesInfo = _documentService.GetDocumentFilesByID(docId, fileName, backupFile, loginUserSiteId);
            Mapper.CreateMap<DocumentDomainModel, DocumentViewModel>();
            files = Mapper.Map<DocumentDomainModel, DocumentViewModel>(filesInfo);
            return files;
        }
        public DocumentViewModel GetDocumentDetailsToEdit(int documentId, int loginUserSiteId, IDocumentService _documentService)
        {
            var dsDocumentDetails = _documentService.GetDocumentDetailsToEdit(documentId, loginUserSiteId);

            if (dsDocumentDetails == null || dsDocumentDetails.Tables.Count == 0 || dsDocumentDetails.Tables[0].Rows.Count == 0)
            {
                return new DocumentViewModel();
            }

            var docDetails = dsDocumentDetails.Tables[0].DataTableToList<DocumentViewModel>().FirstOrDefault();

            if (docDetails == null)
            {
                return new DocumentViewModel();
            }

            docDetails.LstCategory = dsDocumentDetails.Tables.Count > 1
                ? dsDocumentDetails.Tables[1].DataTableToList<CommonModel.Category>()
                : new List<CommonModel.Category>();

            docDetails.lstDocumentViewModels = dsDocumentDetails.Tables.Count > 2
                ? dsDocumentDetails.Tables[2].DataTableToList<DocumentViewModel>()
                : new List<DocumentViewModel>();

            return docDetails;
        }

        public string GetLastRevisionNo(int documentId, IDocumentService _documentService)
        {
            return  _documentService.GetLastRevisionNo(documentId);

        }
        public DocumentViewModel GetDocumentDetailsToEdit1(int documentId, int loginUserSiteId, IDocumentService _documentService)
        {

            var dsDocumentDetails = _documentService.GetDocumentDetailsToEdit(documentId, loginUserSiteId);
            DocumentViewModel objDocumentViewModel = new DocumentViewModel();
            var docDetails = dsDocumentDetails.Tables[0].DataTableToList<DocumentViewModel>().FirstOrDefault();

            objDocumentViewModel.DocumentId = docDetails.DocumentId;
            objDocumentViewModel.CategoryId = docDetails.CategoryId;
            objDocumentViewModel.CategoryName = docDetails.CategoryName;
            objDocumentViewModel.DocumentName = docDetails.DocumentName;
            objDocumentViewModel.DocumentNumber = docDetails.DocumentNumber;
            objDocumentViewModel.IssueNo = docDetails.IssueNo;
            objDocumentViewModel.IssueDate = docDetails.IssueDate;
            objDocumentViewModel.RevisionNo = docDetails.RevisionNo;
            objDocumentViewModel.RevisionDate = docDetails.RevisionDate;
            objDocumentViewModel.Responsibility = docDetails.Responsibility;
            objDocumentViewModel.RetentionPeriod = docDetails.RetentionPeriod;
            objDocumentViewModel.FileName = docDetails.FileName;
            objDocumentViewModel.FilePath = docDetails.FilePath;
            objDocumentViewModel.LstCategory = dsDocumentDetails.Tables[1].DataTableToList<CommonModel.Category>();
            //objDocumentViewModel.LstDocumentType = dsDocumentDetails.Tables[2].DataTableToList<CommonModel.DocumentType>();

            return objDocumentViewModel;

        }

        public int UpdateDocumentsByDocId(DocumentViewModel objDocumentViewModel, IDocumentService _documentService)
        {
            Mapper.CreateMap<DocumentViewModel, DocumentDomainModel>();
            DocumentDomainModel objDocumentDomainModel = Mapper.Map<DocumentViewModel, DocumentDomainModel>(objDocumentViewModel);
            var docID = _documentService.UpdateDocumentsByDocId(objDocumentDomainModel);
            return docID;
        }
        public List<DocumentViewModel> DocumentsBackupFilesByDocId(int userId, IDocumentService _documentService)
        {
            var docDetails = _documentService.DocumentsBackupFilesByDocId(userId);
            Mapper.CreateMap<DocumentDomainModel, DocumentViewModel>();
            LstDocumentViewModel = docDetails.Select(Mapper.Map<DocumentDomainModel, DocumentViewModel>).ToList();
            return LstDocumentViewModel;
        }

        public void UpdateBackupFileName(int documentId, string newFileName, string filepath, IDocumentService _documentService)
        {
            //Mapper.CreateMap<DocumentViewModel, DocumentDomainModel>();
            //DocumentDomainModel objDocumentDomainModel = Mapper.Map<DocumentViewModel, DocumentDomainModel>(documentId);
            var docID = _documentService.UpdateBackupFileName(documentId, newFileName, filepath);
            //return docID;
        }
    }
}