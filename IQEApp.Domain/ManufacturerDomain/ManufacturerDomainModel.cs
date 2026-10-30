using System;

namespace IQEApp.Domain.ManufacturerDomain
{
    public class ManufacturerDomainModel
    {
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }
        public Guid ManufacturerGuid { get; set; }
        public string ContactNumber { get; set; }
        public string City { get; set; }
        public int StateId { get; set; }
        public string StateName { get; set; }
        public int CountryId { get; set; }
        public string CountryName { get; set; }
        public int SiteId { get; set; }
        public int LoggedInUser { get; set; }
        public bool IsManufacturerActive { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int TotalUnits { get; set; }
        public int Total { get; set; }
        public int ManufacturerUnitNameFlagId { get; set; }
        public string ManufacturerUnitNameFlagName { get; set; }
        public int ManufacturerUnitNameFlag { get; set; }

        public bool IsSEZ { get; set; }
        public bool IsOverseas { get; set; }
        public string GSTNo { get; set; }
        public string SGST { get; set; }
        public string CGST { get; set; }
        public string IGST { get; set; }

    }
}
