 using System.Collections.Generic;

namespace IQEApp.Web.Models.InvoiceModel
{
    public class InvoiceConsolidateDetailsModel
    {
        public int InvoiceConsolidateId { get; set; }
        public int InvoiceId { get; set; }
        public int SNo { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
        public int UOM { get; set; }
        public decimal Rate { get; set; }
        public decimal Amount { get; set; }
        public int CurrentVersion { get; set; }
    }

    public class InvoiceConsolidateViewModel
    {
        public InvoiceViewModel InvoiceDetails { get; set; }
        public List<InvoiceConsolidateDetailsModel> LstInvoiceConsolidateDetails { get; set; }
    }
}