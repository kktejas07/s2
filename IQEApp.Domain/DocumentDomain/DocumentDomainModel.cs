using IQEApp.Domain.CommonDomain;
using System;

namespace IQEApp.Domain.DocumentDomain
{
    public class DocumentDomainModel : BaseDomainModel
    {
        public int DocumentId { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }

        public string DocumentName { get; set; }

        public string DocumentNumber { get; set; }

        public string IssueNo { get; set; }
        public DateTime? IssueDate { get; set; }
        public string RevisionNo { get; set; }
        public DateTime? RevisionDate { get; set; }

        public string Responsibility { get; set; }
        public string RetentionPeriod { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public int CreatedBy { get; set; }

        public Guid DocumentGuid { get; set; }
//        public int DocumentTypeId { get; set; }
  //      public string DocumentType { get; set; }
   //     public string DocumentDescription { get; set; }
    //    public double? DocumentFileSize { get; set; }
       
        public int Total { get; set; }
        public DateTime UploadedDate { get; set; }
        //public DateTime UploadFile { get; set; }
    }
}
