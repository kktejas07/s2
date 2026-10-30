using IQEApp.Domain.CommonDomain;
using System;

namespace IQEApp.Domain.PaymentDomain
{
    public class PaymentDomainModel : BaseDomainModel
    {
        public int PaymentId { get; set; }
        public int InvoiceId { get; set; }
        public int PaymentModeId { get; set; }
        public string PaymentModeName { get; set; }
        public string ReceiptNumber { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentComments { get; set; }
        public string ChallanNumber { get; set; }
        public decimal? Amount { get; set; }
        public bool IsCreditNote { get; set; }
    }
}
