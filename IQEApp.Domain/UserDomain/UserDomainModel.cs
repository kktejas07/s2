using IQEApp.Domain.CommonDomain;
using System;

namespace IQEApp.Domain.UserDomain
{
    public class UserDomainModel : BaseDomainModel
    {
        public int TitleId { get; set; }
        public string TitleName { get; set; }
        public string UserFullName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string EmailId { get; set; }
        public string LoginName { get; set; }
        public string LoginPassword { get; set; }
        public string NewPassword { get; set; }
        public int RoleId { get; set; }
        public string RoleName { get; set; }
        public DateTime? DOB { get; set; }
        public int DesignationId { get; set; }
        public string DesignationName { get; set; }
        public string Address { get; set; }
        public int CountryId { get; set; }
        public string CountryName { get; set; }
        public int StateId { get; set; }
        public string StateName { get; set; }
        public string CityName { get; set; }
        public string Certifications { get; set; }
        public string Qualification { get; set; }
        public string ProfQualification { get; set; }
        public string Experience { get; set; }
        public string SkillSets { get; set; }
        public string OtherProfessional { get; set; }
        public string UserImage { get; set; }
        public string UserImagePath { get; set; }
        public string UserImageGUID { get; set; }
        public double? UserImageFileSize { get; set; }
        public int UserTypeId { get; set; }
        public string UserTypeName { get; set; }
        public bool IsUserActive { get; set; }
        public bool IsPasswordUpdate { get; set; }
        public string EmpContactNumber { get; set; }
        public int Total { get; set; }
        public string EmployeeCode { get; set; }
        public bool IsSecondment { get; set; }
        public string InspectorCode { get; set; }
        public int AssociateId { get; set; }
        public string AssociateName { get; set; }
        public string ContactPerson { get; set; }
        public string ESI { get; set; }
        public string PF { get; set; }
        public string PA { get; set; }

        public string BankAcc { get; set; }
        public string IFSCCode { get; set; }
        public string Branch { get; set; }
        public string PAN { get; set; }
        public string Aadhar { get; set; }

        public string Medical { get; set; }
        public bool CompentenceActive { get; set; }
        public bool IsEmpannlementflag { get; set; }
        public decimal CostPerHour { get; set; }
        public decimal MilageInKm { get; set; }
        public decimal AllInclusive { get; set; }
        public string CurrencySymbol { get; set; }
        // public string AllInclusive { get; set; }
        public int CurrencyId { get; set; }
        public string CurrencyName { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? Validity { get; set; }
        public string FileNameWithValidity { get; set; }
    }
}
