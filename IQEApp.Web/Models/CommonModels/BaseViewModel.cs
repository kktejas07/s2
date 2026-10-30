using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace IQEApp.Web.Models.CommonModels
{
    public class BaseViewModel
    {
        public int UserId { get; set; }
        public Guid UserGuid { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public string SiteLogo { get; set; }
        public int LoginUserId { get; set; }
        [Display(Name = "DD-MM-YYYY")]
        public int DateFormat { get; set; }
        public int Total { get; set; }
    }

    public class BankDetailsViewModel
    {
        [DisplayName("Bank A/c No.")]
        public int BankAcc { get; set; }

        [DisplayName("Bank Name")]
        public string BankName { get; set; }

        [DisplayName("IFSC Code")]
        public string IFSCCode { get; set; }
        [DisplayName("Bank Address")]
        public string Branch { get; set; }

        [DisplayName("SWift Code")]
        public string SwiftCode { get; set; }

        [DisplayName("IBAN Number")]
        public string IBANNumber { get; set; }

        [DisplayName("Beneficiary Name")]
        public string BeneficiaryName { get; set; }

        [DisplayName("PAN Number")]
        public string PAN { get; set; }

        [DisplayName("Aadhar Number")]
        public int Aadhar { get; set; }

    }
}