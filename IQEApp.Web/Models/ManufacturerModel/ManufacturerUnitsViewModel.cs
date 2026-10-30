using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace IQEApp.Web.Models.ManufacturerModel
{
    public class ManufacturerUnitsViewModel
    {
        public int ManufacturerUnitId { get; set; }
       
        [DisplayName("Supplier Name")]
        public string ManufacturerName { get; set; }
        [Required]
        [DisplayName("Manufacturer Unit Name")]
        [StringLength(256, ErrorMessage = "Enter Less than 100 characters")]
        public string ManufacturerUnitName { get; set; }
        [Required]
        public int ManufacturerId { get; set; }
        public Guid ManufacturerUnitGuid { get; set; }

        [DisplayName("Phone Number")]
        //[StringLength(10, ErrorMessage = "Enter Less than 10 characters")]
        [RegularExpression(@"^([0-9]{10})$", ErrorMessage = "Please Enter Valid Mobile Number.")]
        public string PhoneNumber { get; set; }

        [DisplayName("Address")]
        [StringLength(1000, ErrorMessage = "Enter Less than 250 characters")]
        public string Address { get; set; }

        [DisplayName("City")]
        [StringLength(150, ErrorMessage = "Enter Less than 150 characters")]
        public string City { get; set; }

        [DisplayName("State")]
        public int MFUnitStateId { get; set; }
        public string MFUnitStateName { get; set; }
        [DisplayName("Country")]
        public int MFUnitCountryId { get; set; }
        public string MFUnitCountryName { get; set; }
        [DisplayName("Contact Name")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        [RegularExpression(@"^[ a-zA-Z]+$", ErrorMessage = "Enter alphabet Only")]
        public string ContactPersonName { get; set; }

        [DisplayName("Designation")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        public string ContactPersonDesignation { get; set; }

        [DisplayName("Unit Email Id")]
        [StringLength(150, ErrorMessage = "Enter Less than 150 characters")]
        [RegularExpression(@"^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$", ErrorMessage = "Invalid Email Format")]
        public string ManufacturerUnitEmailId { get; set; }
        public int LoggedInUser { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsManufacturerUnitActive { get; set; }

    }

    public class ManufacturerUnitsDetailsModel : ManufacturerUnitsViewModel
    {
        public List<CommonModel.StateModel> LstStates { get; set; }
        public List<CommonModel.CountryModel> LstCountries { get; set; }
    }
}