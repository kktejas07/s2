using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace IQEApp.Web.Models.ClientModel
{
    public class ClientUnitsViewModel
    {
        public int ClientUnitId { get; set; }
        public string ClientName { get; set; }
        [Required]
        [DisplayName("Unit Name")]
        [StringLength(256, ErrorMessage = "Enter Less than 100 characters")]
        public string ClientUnitName { get; set; }
        [Required]
        public int ClientId { get; set; }
        public Guid ClientUnitGuid { get; set; }

        [DisplayName("Phone Number")]
        [StringLength(15, ErrorMessage = "Enter Less than 15 numbers")]
        //[Range(10,10, ErrorMessage = "Phone number should be 10 digits")]
        //[RegularExpression(@"^([0-9])$", ErrorMessage = "Please Enter Valid Mobile Number.")]
        public string PhoneNumber { get; set; }

        [DisplayName("Address")]
        [StringLength(1000, ErrorMessage = "Enter Less than 1000 characters")]
        public string Address { get; set; }

        [DisplayName("City")]
        [StringLength(256, ErrorMessage = "Enter Less than 256 characters")]
        public string City { get; set; }

        [DisplayName("State")]
        public int StateId { get; set; }
        public string StateName { get; set; }
        [DisplayName("Country")]
        public int CountryId { get; set; }
        public string CountryName { get; set; }
        [DisplayName("Contact Name")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        [RegularExpression(@"^[ a-zA-Z]+$", ErrorMessage = "Enter alphabet Only")]
        public string ContactPersonName { get; set; }

        [DisplayName("Designation")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        public string ContactPersonDesignation { get; set; }

        [DisplayName("Unit Email Id")]
        [StringLength(256, ErrorMessage = "Enter Less than 256 characters")]
        [RegularExpression(@"^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$", ErrorMessage = "Invalid Email Format")]
        public string ClientUnitEmailId { get; set; }

        [DisplayName("GST No")]
        [StringLength(15, ErrorMessage = "Enter Less than 15 characters")]
        [RegularExpression(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", ErrorMessage = "Invalid GST Format")]
        public string GSTNo { get; set; }
        [StringLength(10, ErrorMessage = "Enter Less than 10 characters")]
        [DisplayName("SGST (%)")]
        [RegularExpression("^[0-9]*$", ErrorMessage = "SGST must be numeric")]
        public string SGST { get; set; }
        [StringLength(10, ErrorMessage = "Enter Less than 10 characters")]
        [DisplayName("CGST (%)")]
        [RegularExpression("^[0-9]*$", ErrorMessage = "CGST must be numeric")]
        public string CGST { get; set; }
        [StringLength(10, ErrorMessage = "Enter Less than 10 characters")]
        [DisplayName("IGST (%)")]
        [RegularExpression("^[0-9]*$", ErrorMessage = "IGST must be numeric")]
        public string IGST { get; set; }
        //[DisplayName("Taxation")]
        //[StringLength(20, ErrorMessage = "Enter Less than 20 characters")]
        //public string Taxation { get; set; }
        public int LoggedInUser { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int Total { get; set; }
        [DisplayName(" SEZ ")]
        public bool IsSEZ { get; set; }
        [DisplayName(" Overseas ")]
        public bool IsOverseas { get; set; }
        public int SOID { get; set; }
        public string SONumber { get; set; }
        public int ControlId { get; set; }

        public string ControlNo { get; set; }
    }

    public class ClientUnitsDetailsModel : ClientUnitsViewModel
    {
        public List<CommonModel.StateModel> LstStates { get; set; }
        public List<CommonModel.CountryModel> LstCountries { get; set; }
    }
    public class ClientUnitsBusinessModel
    {

    }
}