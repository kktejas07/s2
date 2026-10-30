namespace IQEApp.Web.Models.CommonModels
{
    public class EmailViewModel : BaseViewModel
    {
        public string SenderName { get; set; }
        public string SenderEmailId { get; set; }
        public int ReceiverId { get; set; }
        public string ReceiverName { get; set; }
        public string ReceiverEmailId { get; set; }
        public SectionType SectionType { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
        public string BaseUri { get; set; }
        public string BaseLeftUri { get; set; }
        public string Description { get; set; }
        public string NewPassword { get; set; }
        public int SectionId { get; set; }
    }

    public enum SectionType
    {
        ForgotPassword = 1
    }
}