using IQEApp.Domain.CommonDomain;
using System;

namespace IQEApp.Domain.VisitProcessing
{
    public class VisitProcessingDomainModel : BaseDomainModel
    {
        public int VEM_ID { get; set; }
        public int VisitId { get; set; }
        public string UserFullName { get; set; }
        public DateTime? VisitedFrom { get; set; }
        public DateTime? VisitedTo { get; set; }
        public string VisitComments { get; set; }
        public string InspReportNumber { get; set; }
        public int TravelKm { get; set; }
        public int TravelExpense { get; set; }
        public int OtherExpense { get; set; }
        public int VisitProcessStatus { get; set; }
        public string QualityHeadComments { get; set; }
        public int QualityDoneBy { get; set; }
        public DateTime QualityDoneOn { get; set; }
        public string FinanceApproverComments { get; set; }
        public int FinanceApprovedBy { get; set; }
        public DateTime FinanceApprovedOn { get; set; }
        public string VisitStatusName { get; set; }
        public string EmployeeCode { get; set; }
        public string InspectorCode { get; set; }
    }
}
