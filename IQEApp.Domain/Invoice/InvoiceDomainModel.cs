using IQEApp.Domain.CommonDomain;
using System;
using System.Collections.Generic;

namespace IQEApp.Domain.Invoice
{
    public class InvoiceDomainModel : BaseDomainModel
    {
        public int InvoiceID { get; set; }
        public Guid InvoiceGuid { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public int? ClientId { get; set; }
        public int? ClientUnitId { get; set; }
        public int SOID { get; set; }
        
        public int ControlID { get; set; }

        public string SONumber { get; set; }
        public DateTime SODate { get; set; }
        public string InvoiceNo { get; set; }
        public string ClientContactName { get; set; }
        public string ClientContactAddress { get; set; }
        public string PONumber { get; set; }
        public DateTime PODate { get; set; }

        public string Encl { get; set; }
        public string Currency { get; set; }
        public string Subject { get; set; }
        public decimal InvoicePrice { get; set; }
        public string EmailId { get; set; }
        public DateTime CourierSendDate { get; set; }
        public DateTime CourierReceiveDate { get; set; }
        public DateTime InvoiceDate { get; set; }
        public int InvoiceTemplateId { get; set; }
        public decimal GrandTotalAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal ExchangeRate { get; set; }
        public string ClientName { get; set; }
        public string ClientUnitName { get; set; }
        public bool IsInvoiceFrozen { get; set; }
        public decimal CGST { get; set; }
        public decimal CGSTPercentage { get; set; }
        public decimal SGST { get; set; }
        public decimal SGSTPercentage { get; set; }
        public decimal IGST { get; set; }
        public decimal IGSTPercentage { get; set; }
        public string ClientGSTNo { get; set; }
        public bool IsSez { get; set; }
        public bool IsOverseas { get; set; }
        public string InvoiceName { get; set; }
        public string InvoiceAzureLink { get; set; }
        public decimal InvoiceSize { get; set; }
        public int InvoiceStatusId { get; set; }
        public string InvoiceStatus { get; set; }
        public int CurrentVersion { get; set; }
        public string StateName { get; set; }
        public bool IsInvoicePrinted { get; set; }
        public decimal MileageCost { get; set; }
        public string CancellationComments { get; set; }
        public int CancelledBy { get; set; }
        public DateTime CancelledDate { get; set; }

        //Hari
        public decimal TDS { get; set; }
        public decimal TDSPercent { get; set; }
        public decimal AmountReceived { get; set; }
        public DateTime AmountReceivedDate { get; set; }
        public string InvoiceType { get; set; } // "Client" or "Manufacturer"

        public int? ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }

        public int? ManufacturerUnitId { get; set; }


    }

    public class InvoiceSummaryDomainModel
    {
        public decimal Grand_TotalAmount { get; set; }
        public decimal Grand_GrandTotalAmount { get; set; }
        public decimal Grand_TDS { get; set; }
        public decimal Grand_AmountReceived { get; set; }
        public decimal Grand_OutstandingAmount { get; set; }
    }

    public class InvoiceDirectoryDomainModel
    {
        public List<InvoiceDomainModel> Invoices { get; set; }
        public InvoiceSummaryDomainModel Summary { get; set; }
    }
}
