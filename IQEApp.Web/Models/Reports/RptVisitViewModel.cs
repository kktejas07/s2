using System;

namespace IQEApp.Web.Models.Reports
{
    public class RptVisitViewModel
    {
        public int VEMId { get; set; }
        public int VisitId { get; set; }
        public DateTime ScheduleDate { get; set; }
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public int VisitStatus { get; set; }
        public string VisitStatusName { get; set; }
        public int UserId { get; set; }
        public string InspectorName { get; set; }
        public string InspectorCode { get; set; }
        public string InspReportNumber { get; set; }
    }

    public class RptVisitExpensesModel
    {
        public int VisitId { get; set; }
        public int VEMId { get; set; }
        public DateTime ScheduleDate { get; set; }
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public int VisitStatus { get; set; }
        public string VisitStatusName { get; set; }
        public int UserId { get; set; }
        public string InspectorName { get; set; }
        public string InspectorCode { get; set; }
        public string InspReportNumber { get; set; }
        public int TotalExpenseAmount { get; set; }
    }
}