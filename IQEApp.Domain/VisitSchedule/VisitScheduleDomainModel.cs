using IQEApp.Domain.CommonDomain;
using IQEApp.Domain.PurchaseOrderDomain;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IQEApp.Domain.VisitSchedule
{
    public class VisitScheduleDomainModel : BaseDomainModel
    {
        public int VisitTypeId { get; set; }
        public int VisitId { get; set; }
        public string VisitSeqId { get; set; }

        public int ClientId { get; set; }

        public DateTime? ScheduleDate { get; set; }

        public DateTime? ScheduleDate1 { get; set; }
        public DateTime? RFIScheduleDate { get; set; }

        public DateTime? VisitDate { get; set; }

        public bool? ClientConfirmation { get; set; }
        public bool? ManufacturerConfirmation { get; set; }
        public string ScheduleComments { get; set; }
        public string UserIds { get; set; }
        public int VisitStatusId { get; set; }
        public string VisitStatusName { get; set; }
        public Guid VisitGuid { get; set; }
        public int CountryId { get; set; }
        public int StateId { get; set; }
        public string StateName { get; set; }
        public string InspectionActivity { get; set; }
        public string InspectionActivity1 { get; set; }
        public string InspectorName { get; set; }
        public string VisitLocation { get; set; }
        public List<string> VisitLocations { get; set; }
        public string InspReportNo { get; set; }
        public string Employment { get; set; }
        public string InvoiceNo { get; set; }

        public string FileName { get; set; }
        public string FilePath { get; set; }

        public DateTime InvoiceDate { get; set; }

        public int SaleValue { get; set; }

        public decimal CostValue { get; set; }

        public decimal GP { get; set; }
        public List<PONumberItemsDomainModel> LstPurchaseOrderItems { get; set; }

    }
}
