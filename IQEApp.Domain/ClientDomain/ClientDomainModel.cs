using System;

namespace IQEApp.Domain.ClientDomain
{
    public class ClientDomainModel
    {
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public Guid ClientGuid { get; set; }
        public int SiteId { get; set; }
        public int IndustryTypeId { get; set; }
        public string IndustryTypeName { get; set; }
        public int? AnnualRevenue { get; set; }
        public int LoggedInUser { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int TotalClientUnits { get; set; }
        public int Total { get; set; }
        public int PageCount { get; set; }
        public bool IsClientActive { get; set; }

    }
}
