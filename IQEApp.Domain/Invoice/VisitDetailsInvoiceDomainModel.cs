using System;

namespace IQEApp.Domain.Invoice
{
    public class VisitDetailsInvoiceDomainModel
    {
        public int InvoiceVisitId { get; set; }
        public int InvoiceId { get; set; }
        public int VisitId { get; set; }
        public int VEMId { get; set; }
        public string ManufacturerName { get; set; }
        public string VisitContactName { get; set; }
        public string VisitContactAddress { get; set; }
        public string VisitLocation { get; set; }
        public string PONumber { get; set; }
        public DateTime PODate { get; set; }
        public int ClientId { get; set; }
        public int ClientUnitId { get; set; }
        public DateTime VisitDate { get; set; }
        public int VisitPrice { get; set; }
        public string InspectorCode { get; set; }
        public string InspReportNo { get; set; }
        public string InspectorName { get; set; }
        public int Distance { get; set; }
        public DateTime TimeIn { get; set; }
        public DateTime TimeOut { get; set; }
        public string TotalHrs { get; set; }
        public int MileageCost { get; set; }
        public int FoodAllowance { get; set; }
        //public int ModeOfTransport { get; set; }
        public int TravelFare { get; set; }
        public int Hotel { get; set; }
        public int ServiceCharge { get; set; }
        public int OtherExpenses { get; set; }
        public int Total { get; set; }
        public string Remarks { get; set; }
    }
}
