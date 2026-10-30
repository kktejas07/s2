using System;

namespace IQEApp.Domain.ClientDomain
{
    public class ClientUnitsDomainModel
    {
        public int ClientUnitId { get; set; }
        public string ClientUnitName { get; set; }
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public Guid ClientUnitGuid { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public int? StateId { get; set; }
        public int? CountryId { get; set; }
        public string ContactPersonName { get; set; }
        public string ContactPersonDesignation { get; set; }
        public string ClientUnitEmailId { get; set; }
        public string GSTNo { get; set; }
        public string SGST { get; set; }
        public string CGST { get; set; }
        public string IGST { get; set; }
        //public string Taxation { get; set; }
        public int LoggedInUser { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int Total { get; set; }
        public bool IsSEZ { get; set; }
        public bool IsOverseas { get; set; }

        public int SOID { get; set; }
        public string SONumber { get; set; }

        public int ControlNo { get; set; }

    }
}
