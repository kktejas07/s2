using System;
using System.Collections.Generic;
using System.ComponentModel;

namespace IQEApp.Domain.EnquiryDomain
{
    public class EnquiryDomainModel
    {
        public int EID { get; set; }
        public string EnquiryID { get; set; }
        public int EnquiryCategoryId { get; set; }
        public string EnquiryCategoryName { get; set; }
        public DateTime? EnquiryDate { get; set; }
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public int CreatedBy { get; set; }
        public int SiteId { get; set; }

        public int Total { get; set; }
        public bool IsEnquiryActive { get; set; }

        // public List<string> WorkScopeList { get; set; }

//        public List<int> LstWorkScopeIds { get; set; }
        public string QuotationNo { get; set; }
        public DateTime? QuotationDate { get; set; }
        public string UploadFile { get; set; }
        public string FileName { get; set; }
        public string PhysicalFileName { get; set; } // for Backup files downloading
        public string FilePath { get; set; }
        public bool QuotationStatusFlag { get; set; }
        public string SubmitStatus { get; set; }
        public string ProposalOwner { get; set; }
  
        public string EnquiryType { get; set; }

        public List<EnquiryCategoryDomainModel> LstEnquiryCategoryModel { get; set; }

    }

    public class EnquiryStatusCountDomainModel
    {
        public int ID { get; set; }
        public string Name { get; set; }

        public int WonCount { get; set; }
        public int LostCount { get; set; }
        public int PendingCount { get; set; }
        public int DeclinedCount { get; set; }
        public int TotalCount { get; set; }

        public decimal WonPercentage { get; set; }
        public decimal LostPercentage { get; set; }
        public decimal PendingPercentage { get; set; }
        public decimal DeclinedPercentage { get; set; }

    }

    public class EnquiryCategoryDomainModel
    {
        public int Id { get; set; }
        public int EID { get; set; }   // FK
        public int SNo { get; set; }
        public string Details { get; set; }
        public string Scope { get; set; }
        public string Position { get; set; }
        public int? UOMId { get; set; }
        public string UOMName { get; set; }
        public string OtherUOM { get; set; }

        //1,2 & 4
        public int Qty { get; set; }
        //1
        public string ApplicableCodeStandards { get; set; }

        //2 & 4
        public string Qualification { get; set; }
        //2 & 4
        public string Competance { get; set; }
        //2 & 4 
        public string Experience { get; set; }
        //2 ,3 & 4
        public string Duration { get; set; }
        //3
        public int Attendees { get; set; }
        public string ResponseTime { get; set; }
        public string Location { get; set; }
        public string Remarks { get; set; }
        public string Budget { get; set; }
        public string Food { get; set; }
        public string LocalConveyance { get; set; }
        public string MobDeMob { get; set; }
        public string OvertimeCharges { get; set; }
        
        public int CreatedBy { get; set; }
    }

    public class EnquirySaveResult
    {
        public int EID { get; set; }
        public string EnquiryNo { get; set; }
    }

}
