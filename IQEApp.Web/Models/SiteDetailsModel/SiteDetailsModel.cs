namespace IQEApp.Web.Models.SiteDetailsModel
{
    public class SiteDetailsModel
    {
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public string SiteDescription { get; set; }
        public bool IsSiteActive { get; set; }
        public string SiteLogo { get; set; }
    }
}