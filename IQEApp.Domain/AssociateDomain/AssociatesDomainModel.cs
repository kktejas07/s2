using IQEApp.Domain.CommonDomain;
using System;



namespace IQEApp.Domain.AssociateDomain
{
    public class AssociatesDomainModel 
    {
        public int AssociateId { get; set; }
        public string AssociateName { get; set; }
        public Guid AssociateGuid { get; set; }
        public string Address { get; set; }
        public int StateId { get; set; }
        public string StateName { get; set; }
        public int CountryId { get; set; }
        public string CountryName { get; set; }
        public string ContactNumber1 { get; set; }
        public string ContactNumber2 { get; set; }
        public string WebSite { get; set; }
        public string Email { get; set; }
        public int SiteId { get; set; }
        public int CreteadBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsAssociateActive { get; set; }
        public string ContactPerson { get; set; }
        public string Currency { get; set; }
        public string Designation { get; set; }
        public int MilageInKM { get; set; }
        public int Cost { get; set; }
        public int BankAcc { get; set; }
        public string BankName { get; set; }
        public string IFSCCode { get; set; }
        public string Branch { get; set; }
        public string SwiftCode { get; set; }
        public string IBANNumber { get; set; }
        public string BeneficiaryName { get; set; }
        public string PAN { get; set; }
        public int Aadhar { get; set; }
        public int Total { get; set; }

    }
}
