namespace IQEApp.Domain.Invoice
{
    public class InvoiceConsolidateDomainModel
    {
        public int InvoiceConsolidateId { get; set; }
        public int InvoiceId { get; set; }
        public int SNo { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
        public int UOM { get; set; }
        public decimal Rate { get; set; }
        public decimal Amount { get; set; }
        public int VersionNumber { get; set; }
    }
}
