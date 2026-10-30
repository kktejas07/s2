using IQEApp.Domain.CommonDomain;
using IQEApp.Domain.PurchaseOrderDomain;
using System;
using System.Collections.Generic;

namespace IQEApp.Domain.VisitProcessing
{
    public class ScheduleVisitDomainModel : BaseDomainModel
    {
        public int VisitId { get; set; }
        public string VisitSeqId { get; set; }
        public int ControlId { get; set; }
        public string ControlNo { get; set; }
        public int SOID { get; set; }
        public DateTime? ScheduleDate { get; set; }
        public DateTime? ScheduleDate1 { get; set; }
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
        public int PONID { get; set; }
        public string PONumber { get; set; }
        public string PODate { get; set; }
        public int ManufacturerUnitId { get; set; }
        public string ManufacturerUnitName { get; set; }
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }
        public string Equipment { get; set; }
        public int Quantity { get; set; }

        public string QuantityWithUOM { get; set; }
        public string InspectionActivity { get; set; }
        public string InspectorName { get; set; }

        public string VisitLocation { get; set; }
        public string Employment { get; set; }

        public string InspReportNo { get; set; }

        public string InvoiceNo { get; set; }

        public string FileName { get; set; }
        public string FilePath { get; set; }

        public DateTime? InvoiceDate { get; set; }

        //public double TotalAmount { get; set; }

        //public double GrandTotalAmount { get; set; }
        public int SaleValue { get; set; }

        public decimal CostValue { get; set; }

        public decimal GP { get; set; }

        public string UOM { get; set; }
        public int StateId { get; set; }
        public string StateName { get; set; }
        public int CountryId { get; set; }
        public List<PurchaseOrderItemsDomainModel> LstPurchaseOrderItems { get; set; }

        public string PONIds { get; set; }

        public int ClientId { get; set; }
        public int ClientUnitId { get; set; }


    }

    public class GridFilterDomainModel
    {
        public string Column { get; set; }
        public string FilterType { get; set; } // e.g., "Contains", "Equals"
        public string Value { get; set; }
    }
    public class ScheduleVisitStatusDomainModel
    {
        public int ID { get; set; }
        public string Name { get; set; }

        public int ActiveCount { get; set; }
        public int ClosedCount { get; set; }
        public int CancelledCount { get; set; }
        public int OnHoldCount { get; set; }
        public int ProspectiveCount { get; set; }
        public int TotalCount { get; set; }

        public decimal ActivePercentage { get; set; }
        public decimal ClosedPercentage { get; set; }
        public decimal CancelledPercentage { get; set; }
        public decimal OnHoldPercentage { get; set; }
        public decimal ProspectivePercentage { get; set; }
        }

       public class TotalsDomainModel
       {
        public decimal TotalSaleValue { get; set; }
        public decimal TotalCostValue { get; set; }
        public decimal TotalGPValue { get; set; }

       }
    
      public class InspRepoNoDomainModel
      {
        public string PONumber { get; set; }
        public string VisitSeqId { get; set; }
        public DateTime VisitDate { get; set; }
        public string ManufacturerName { get; set; }
        public string LocationDetails { get; set; }
        public string InspReportNo { get; set; }
     }

}
