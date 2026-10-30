using System;

namespace IQEApp.Domain.CommonDomain
{
    public class BaseDomainModel
    {
        public int UserId { get; set; }
        public Guid UserGuid { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public string SiteLogo { get; set; }
        public int LoginUserId { get; set; }
        public int Total { get; set; }
    }
}
