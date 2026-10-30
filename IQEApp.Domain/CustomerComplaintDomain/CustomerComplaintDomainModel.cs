using IQEApp.Domain.CommonDomain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IQEApp.Domain.CustomerComplaintDomain
{
    public class CustomerComplaintDomainModel : BaseDomainModel
    {
        public string ComplaintID { get; set; }
        public string ContactPerson { get; set; }
        public string ComplaintIdentifictionNo { get; set; }
        //  public string ComplaintTitle { get; set; }
        public string ComplaintFullDescrption { get; set; }
        public DateTime? ComplaintReceivedDate { get; set; }
        public DateTime? IssueDate { get; set; }
        public string IssueNo { get; set; }
        public string CustomerName { get; set; }
        public string Unit { get; set; }
        // public string DocumentNo { get; set; }
        public string POWO_Number { get; set; }
        public string EquipmentOfferedQty { get; set; }
        public string EquipmentNameQty_Complaint { get; set; }
        public int ComplaintModeId { get; set; }
        public int ComplaintStatusId { get; set; }
        public int ResponsiblePartyId { get; set; }
        public int ComplaintTypeId { get; set; }
        public string ComplaintRootCause { get; set; }
        public string ProposedCorrectiveAction { get; set; }
        public string CorrectiveActionBy { get; set; }
        public string ComplaintStatusName { get; set; }
        public string Remarks { get; set; }
        public bool IsComplaintActive { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public DateTime? ClosingDate { get; set; }
        public int CreatedBy { get; set; }
    }
}
