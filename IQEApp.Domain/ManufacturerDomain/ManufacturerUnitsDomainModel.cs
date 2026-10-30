using System;

namespace IQEApp.Domain.ManufacturerDomain
{
    public class ManufacturerUnitsDomainModel
    {
        public int ManufacturerUnitId { get; set; }
        public string ManufacturerUnitName { get; set; }
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }
        public Guid ManufacturerUnitGuid { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public int MFUnitStateId { get; set; }
        public string MFUnitStateName { get; set; }
        public int MFUnitCountryId { get; set; }
        public string MFUnitCountryName { get; set; }
        public string ContactPersonName { get; set; }
        public string ContactPersonDesignation { get; set; }
        public string ManufacturerUnitEmailId { get; set; }
        public int LoggedInUser { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsManufacturerUnitActive { get; set; }
    }
}
