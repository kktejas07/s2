using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.AssociateDomain;
using IQEApp.Service.AssociatesService;
using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Linq;


namespace IQEApp.Web.Models.AssociatesModel
{
    public class AssociatesViewModel : BankDetailsViewModel
    {
        public int AssociateId { get; set; }
        [Required]
        [DisplayName("Associate Name")]
        public string AssociateName { get; set; }
        public Guid AssociateGuid { get; set; }
        public string Address { get; set; }
        //[RegularExpression(@"^([0-9]{10})$", ErrorMessage = "Please Enter Valid Mobile Number.")]
        public string ContactNumber1 { get; set; }
        public string ContactNumber2 { get; set; }
        [Required]
        [DisplayName("Contact Person")]
        public string ContactPerson { get; set; }

        public int CurrencyId { get; set; }
        public string CurrencyName { get; set; }
        public string Designation { get; set; }
        public string WebSite { get; set; }

        [Required]
        [StringLength(256, ErrorMessage = "Enter Less than 256 characters")]
        [RegularExpression(@"^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$", ErrorMessage = "Invalid Email Format")]
        [Display(Name = "Email Id")]
        public string Email { get; set; }
        public int SiteId { get; set; }
        public int CreteadBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsAssociateActive { get; set; }

        [Required]
        [DisplayName("State")]
        public int StateId { get; set; }

        //[Required]
        public string StateName { get; set; }
        [Required]
        [DisplayName("Country")]
        public int CountryId { get; set; }
        public string CountryName { get; set; }

        [DisplayName("Mileage Per Miles/KMs")]
        public int MilageInKM { get; set; }

        [DisplayName("Cost Per Hour")]
        public int Cost { get; set; }
        public int Total { get; set; }

    }

    public class AssociatesDetailsModel : AssociatesViewModel
    {
        public List<CommonModel.StateModel> LstStates { get; set; }
        public List<CommonModel.CountryModel> LstCountries { get; set; }
        //public List<CommonModel.CurrencyTypeModel> LstCurrencyType { get; set; }
    }

    public class AssociatesBusinessModel
    {
        public List<AssociatesViewModel> lstAssociatesViewModel ; //{ get; set; }
        public List<AssociatesViewModel> GetAllAssociateDetails(int siteId, string strSearch, string alphaChar, int offsetIndex, int fetchCount, bool activeStatus, string sortingOrder, IAssociatesServices AssociateService)
        {
            var AssociateDetails = AssociateService.GetAllAssociateDetails(siteId, strSearch, alphaChar, offsetIndex, fetchCount, activeStatus, sortingOrder);
            Mapper.CreateMap<AssociatesDomainModel, AssociatesViewModel>();
            lstAssociatesViewModel = AssociateDetails.Select(Mapper.Map<AssociatesDomainModel, AssociatesViewModel>).ToList();
           // lstAssociatesViewModel.LstCurrencyType = AssociateDetails.Tables[0].DataTableToList<CommonModel.CurrencyTypeModel>().OrderBy(m => m.CurrencyId).ToList();

            return lstAssociatesViewModel;
        }
        public AssociatesViewModel GetAssociateDetailsToAdd(int loginUserSiteId, IAssociatesServices AssociateService)
        {
            var dsAssociateDetails = AssociateService.GetAssociateDetailsToAdd(loginUserSiteId);
            AssociatesDetailsModel objAssociateDetailsModel = new AssociatesDetailsModel();
            objAssociateDetailsModel.LstStates = dsAssociateDetails.Tables[0].DataTableToList<CommonModel.StateModel>();
            objAssociateDetailsModel.LstCountries = dsAssociateDetails.Tables[1].DataTableToList<CommonModel.CountryModel>();
            return objAssociateDetailsModel;
        }
        public bool ValidateAssociate(AssociatesViewModel objAssociateViewModel, IAssociatesServices AssociateService)
        {
            Mapper.CreateMap<AssociatesViewModel, AssociatesDomainModel>();
            AssociatesDomainModel objAssociateDomainModel = Mapper.Map<AssociatesViewModel, AssociatesDomainModel>(objAssociateViewModel);
            return AssociateService.IsAssociateAlreadyExists(objAssociateDomainModel);
        }
        public int CreateAssociate(AssociatesViewModel objAssociateViewModel, IAssociatesServices AssociateService)
        {
            Mapper.CreateMap<AssociatesViewModel, AssociatesDomainModel>();
            AssociatesDomainModel objAssociateDomainModel = Mapper.Map<AssociatesViewModel, AssociatesDomainModel>(objAssociateViewModel);
            var AssociateId = AssociateService.CreateAssociate(objAssociateDomainModel);
            return AssociateId;
        }

        public AssociatesDetailsModel GetAssociateDetailsToEdit(Guid AssociateGuid, int loginUserSiteId, IAssociatesServices AssociateService)
        {
            var dsAssociateDetails = AssociateService.GetAssociateDetailsToEdit(AssociateGuid, loginUserSiteId);
            AssociatesDetailsModel objAssociateDetailsModel = new AssociatesDetailsModel();
            var AssociateDetails = dsAssociateDetails.Tables[0].DataTableToList<AssociatesViewModel>();
            objAssociateDetailsModel.AssociateId = AssociateDetails.FirstOrDefault().AssociateId;
            objAssociateDetailsModel.AssociateName = AssociateDetails.FirstOrDefault().AssociateName;
            objAssociateDetailsModel.ContactPerson = AssociateDetails.FirstOrDefault().ContactPerson;
            objAssociateDetailsModel.Email = AssociateDetails.FirstOrDefault().Email;
            objAssociateDetailsModel.WebSite = AssociateDetails.FirstOrDefault().WebSite;
            objAssociateDetailsModel.Address = AssociateDetails.FirstOrDefault().Address;
            objAssociateDetailsModel.AssociateGuid = AssociateDetails.FirstOrDefault().AssociateGuid;
            objAssociateDetailsModel.ContactPerson = AssociateDetails.FirstOrDefault().ContactPerson;
            objAssociateDetailsModel.Designation = AssociateDetails.FirstOrDefault().Designation;
            objAssociateDetailsModel.ContactNumber1 = AssociateDetails.FirstOrDefault().ContactNumber1;
            objAssociateDetailsModel.ContactNumber2 = AssociateDetails.FirstOrDefault().ContactNumber2;
            objAssociateDetailsModel.CountryId = AssociateDetails.FirstOrDefault().CountryId;
            objAssociateDetailsModel.StateId = AssociateDetails.FirstOrDefault().StateId;
            objAssociateDetailsModel.StateName = AssociateDetails.FirstOrDefault().StateName;
            objAssociateDetailsModel.Address = AssociateDetails.FirstOrDefault().Address;
            objAssociateDetailsModel.CurrencyName = AssociateDetails.FirstOrDefault().CurrencyName;
            objAssociateDetailsModel.Cost = AssociateDetails.FirstOrDefault().Cost;
            objAssociateDetailsModel.MilageInKM = AssociateDetails.FirstOrDefault().MilageInKM;

            objAssociateDetailsModel.BankAcc = AssociateDetails.FirstOrDefault().BankAcc;
            objAssociateDetailsModel.BankName = AssociateDetails.FirstOrDefault().BankName;
            objAssociateDetailsModel.IFSCCode = AssociateDetails.FirstOrDefault().IFSCCode;
            objAssociateDetailsModel.Branch = AssociateDetails.FirstOrDefault().Branch;
            objAssociateDetailsModel.SwiftCode = AssociateDetails.FirstOrDefault().SwiftCode;
            objAssociateDetailsModel.IBANNumber = AssociateDetails.FirstOrDefault().IBANNumber;
            objAssociateDetailsModel.BeneficiaryName = AssociateDetails.FirstOrDefault().BeneficiaryName;
            objAssociateDetailsModel.PAN = AssociateDetails.FirstOrDefault().PAN;
            objAssociateDetailsModel.Aadhar = AssociateDetails.FirstOrDefault().Aadhar;

            objAssociateDetailsModel.LstStates = dsAssociateDetails.Tables[1].DataTableToList<CommonModel.StateModel>();
            objAssociateDetailsModel.LstCountries = dsAssociateDetails.Tables[2].DataTableToList<CommonModel.CountryModel>();

            return objAssociateDetailsModel;
        }

        public bool UpdateAssociateDetails(AssociatesViewModel objAssociateViewModel, IAssociatesServices AssociateService)
        {
            Mapper.CreateMap<AssociatesViewModel, AssociatesDomainModel>();
            AssociatesDomainModel objAssociateDomainModel = Mapper.Map<AssociatesViewModel, AssociatesDomainModel>(objAssociateViewModel);
            var success = AssociateService.UpdateAssociateDetails(objAssociateDomainModel);
            return success;
        }
        public bool UpdateAssociateStatus(Guid AssociateGuid, bool status, int loggedInUser, IAssociatesServices AssociateService)
        {
            var success = AssociateService.UpdateAssociateStatus(AssociateGuid, status, loggedInUser);
            return success;
        }

    }
}