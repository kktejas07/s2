using System;
using Dapper;
namespace IQEApp.Domain.PurchaseOrderDomain
{
    public class PurchaseOrderItemsDomainModel
    {
        public int POItemId { get; set; }
        public Guid POItemGuid { get; set; }
        public string POItemNo { get; set; }
        public int? Quantity { get; set; }
        public string Description { get; set; }
        public int? NumberOfVisits { get; set; }
        public int POId { get; set; }
        public int PONId { get; set; }
        public int? VisitId { get; set; }
        public int? VisitPId { get; set; }
        public string PONumber { get; set; }
        public string Remarks { get; set; }
        public string InspectionActivity { get; set; }
        public int UOMID { get; set; }
        public string UOMName { get; set; }
        public string UOMOthers { get; set; }

    }

    public class UpdatePOResultDomainModel
    {
        public string ReturnedPONumber { get; set; }
        public bool Success { get; set; }
    }

    public class PurchaseOrderNumbersDomainModel
    {
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }

        public string PurchaseID { get; set; }
        public int PONId { get; set; }
        public Guid PONGuid { get; set; }
        public string PONumber { get; set; }
        public DateTime PoDate { get; set; }
        public int POId { get; set; }

        public string ControlNo { get; set; }
        public int ControlID { get; set; }
        public int SOID { get; set; }
        public string SONumber { get; set; }
        public int ClientID { get; set; }
        public string ClientName { get; set; }
        public int ClientUnitId { get; set; }
        public string ClientUnitName { get; set; }
    }

    public class PONumberItemsDomainModel
    {
        public int POID { get; set; }
        public string PurchaseID { get; set; }

        public int PONID { get; set; }
        public string PONumber { get; set; }
        public DateTime? PODate { get; set; }
        public int ControlID { get; set; }
        public string ControlNo { get; set; }
        public int ClientUnitId { get; set; }
        public string ClientUnitName { get; set; }
        public int SOId { get; set; }
        public string SONumber { get; set; }
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }
        public string LocationDetails { get; set; }
        public string ContactNo { get; set; }

        public int POItemId { get; set; }
        public string POItemNo { get; set; }
        public string Description { get; set; }
        public string Quantity { get; set; }
        public int UOMId { get; set; }
        public string UOMName { get; set; }
        public int NumberOfVisits { get; set; }
        public string Remarks { get; set; }
        public string InspectionActivity { get; set; }
        public decimal? Cost { get; set; }

        public int? VisitId { get; set; }
        public int? VisitPId { get; set; }
        public int LoginUserId { get; set; }
        public string InspReportNo { get; set; }
    }

}
