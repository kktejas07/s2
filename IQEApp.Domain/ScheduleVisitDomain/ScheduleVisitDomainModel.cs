using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IQEApp.Domain.ScheduleVisitDomain
{
    public class ScheduleVisitDomainModel
    {
        public int VisitId { get; set; }
        public int ControlId { get; set; }
        public string ControlNo { get; set; }
        public DateTime? ScheduleDate { get; set; }
        public DateTime? RFIScheduleDate { get; set; }
        public DateTime? VisitDate { get; set; }
        public bool ClientConfirmation { get; set; }
        public bool ManufacturerConfirmation { get; set; }
        public string ScheduleComments { get; set; }
        public string UserIds { get; set; }
        public int VisitStatusId { get; set; }
        public string VisitStatusName { get; set; }
        public Guid VisitGuid { get; set; }
        public string ClientName { get; set; }
        public string ClientUnitName { get; set; }
        public string QualityHeadComments { get; set; }
        public string QualityDoneByName { get; set; }
        public DateTime QualityDoneOn { get; set; }
        public string FinanceApproverComments { get; set; }
        public string FinanceApprovedByName { get; set; }
        public DateTime FinanceApprovedOn { get; set; }
        public int POID { get; set; }
        public int ManufacturerUnitId { get; set; }
        public string ManufacturerUnitName { get; set; }
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }
    }
}
