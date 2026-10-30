namespace IQEApp.Domain.CommonDomain
{
    public class EmailDomainModel : BaseDomainModel
    {
        public string SenderName { get; set; }
        public string SenderEmailId { get; set; }
        public int ReceiverId { get; set; }
        public string ReceiverName { get; set; }
        public string ReceiverEmailId { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
        public string BaseUri { get; set; }
        public string BaseLeftUri { get; set; }
        public string Description { get; set; }
        public int SectionId { get; set; }
    }
}
