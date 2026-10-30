using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.UserDomain;
using IQEApp.Service.UserService;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Utils;
using Microsoft.AspNet.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;
using static IQEApp.Domain.CommonDomain.CommonDomainModel;
using static IQEApp.Web.Models.CommonModels.CommonModel;

namespace IQEApp.Web.Models.UserModel
{
    public class UserViewModel : BaseViewModel
    {
        [Display(Name = "Title")]
        public int TitleId { get; set; }
        public string TitleName { get; set; }
        [Display(Name = "User Name")]
        public string UserFullName { get; set; }
        [Required]
        [Display(Name = "First name")]
        [StringLength(50, ErrorMessage = "Enter Less than 50 characters")]
        [RegularExpression(@"^[ a-zA-Z]+$", ErrorMessage = "Enter alphabet Only")]
        //[RegularExpression(@"^[a-zA-Z]+[ a-zA-Z]*$", ErrorMessage = "Use Alphabet Only")]
        public string FirstName { get; set; }
        [DisplayName("Last Name")]
        [StringLength(50, ErrorMessage = "Enter Less than 50 characters")]
        [RegularExpression(@"^[ a-zA-Z]+$", ErrorMessage = "Enter alphabet Only")]
        public string LastName { get; set; }
        [Required]
        [StringLength(256, ErrorMessage = "Enter Less than 256 characters")]
        [RegularExpression(@"^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$", ErrorMessage = "Invalid Email Format")]
        [Display(Name = "Email Id")]
        public string EmailId { get; set; }
        [Required]
        [Display(Name = "Login Name")]
        [StringLength(50, ErrorMessage = "Enter Less than 50 characters")]
        public string LoginName { get; set; }
        public string LoginPassword { get; set; }
        [Required]
        [Display(Name = "Password")]
        [StringLength(30, ErrorMessage = "Enter Less than 30 characters")]
        [DataType(DataType.Password)]
        public string OldPassword { get; set; }
        [Required]
        [Display(Name = "New Password")]
        [StringLength(30, ErrorMessage = "Enter Less than 30 characters")]
        [DataType(DataType.Password)]
        public string NewPassword { get; set; }
        [Required]
        [Display(Name = "Confirm Password")]
        [StringLength(30, ErrorMessage = "Enter Less than 30 characters")]
        [DataType(DataType.Password)]
        [Compare("NewPassword", ErrorMessage = "Password and Confirmation Password must match.")]
        public string ConfirmPassword { get; set; }
        [Required]
        [Display(Name = "Employee Role")]
        public int RoleId { get; set; }
        public string RoleName { get; set; }
        //should not be greater than current date validation
       // [Required]
        [Display(Name = "Date of birth")]
        //[DataType(DataType.DateTime)]
        //[DisplayFormat(DataFormatString = "{0:MM-dd-yyyy}")]
        //  [DisplayFormat(DataFormatString = "{0:d}")] 
        public DateTime? DOB { get; set; }

        //public DateTime EnquiryDate { get; set; }
        [Required]
        [Display(Name = "Designation")]
        public int DesignationId { get; set; }
        public string DesignationName { get; set; }
        [Display(Name = "Address")]
        [StringLength(200, ErrorMessage = "Enter Less than 200 characters")]
        public string Address { get; set; }
        [Display(Name = "Country")]
        public int CountryId { get; set; }
        public string CountryName { get; set; }
        [Display(Name = "State")]
        [Required]
        public int StateId { get; set; }
        public string StateName { get; set; }
        [Display(Name = "City")]
        [Required]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        public string CityName { get; set; }
        [Display(Name = "Certificate")]
        [StringLength(1000, ErrorMessage = "Enter Less than 1000 characters")]
        public string Certifications { get; set; }
        [Display(Name = "Edu Qualification")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        public string Qualification { get; set; }

        [Display(Name = "Discipline")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        public string ProfQualification { get; set; }
        [Display(Name = "Experience")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        public string Experience { get; set; }
        [Display(Name = "Skill Sets")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        public string SkillSets { get; set; }
        public List<int> SkillSetIds { get; set; }
        public string OtherProfessional { get; set; }
        public string UserImageGUID { get; set; }
        public double? UserImageFileSize { get; set; }
        public string UserImage { get; set; }
        public string UserImagePath { get; set; }
        public HttpPostedFileBase UploadPhoto { get; set; }

        [Required]
        [Display(Name = "Employee Type")]
        public int UserTypeId { get; set; }
        public string UserTypeName { get; set; }
        public bool IsUserActive { get; set; }
        public bool IsPasswordUpdate { get; set; }
        [Display(Name = "Contact Number")]
        //[StringLength(10, ErrorMessage = "Enter Less than 10 numbers")]
        //[RegularExpression(@"^((\\+|00)(\\d{1,3})[\\s-]?)? (\\d{10})$/", ErrorMessage = "Please Enter Valid Mobile Number.")]

        [RegularExpression(@"^\+?[1-9]\d{1,14}$", ErrorMessage = "Please Enter a Valid Mobile Number.")]
        public string EmpContactNumber { get; set; }

        [Required(ErrorMessage = "Please select file.")]
        [RegularExpression(@"([a-zA-Z0-9\s_\\.\-:])+(.pdf|.doc)$", ErrorMessage = "Only Pdf doc files allowed.")]
        public string FileName { get; set; }

        public string FilePath { get; set; }

        //[Display(Name = "Upload Credentials")]
        //public HttpPostedFileBase[] UploadResume { get; set; }
        //public HttpPostedFileBase[] ExistingResume { get; set; }
        public int Total { get; set; }
        [Display(Name = "Employee Code")]
        [StringLength(15, ErrorMessage = "Enter Less than 15 characters")]
        public string EmployeeCode { get; set; }

        public bool IsSecondment { get; set; }

        public string EmployeeCode1 { get; set; }
        [Display(Name = "Inspector Stamp No")]
        [StringLength(15, ErrorMessage = "Enter Less than 15 characters")]
        public string InspectorCode { get; set; }

        [Display(Name = "Associate")]
        public int AssociateId { get; set; }
        public string AssociateName { get; set; }
        public string ContactPerson { get; set; }
        public string ESI { get; set; }
        public string PF { get; set; }
        public string PA { get; set; }

        //[Required]
        [RegularExpression(@"^\d{1,15}$",ErrorMessage="Please Enter a valid Bank Acc No.")]
        [DisplayName("Bank A/c No.")]
        public string BankAcc { get; set; }

        [Display(Name = "IFSC Code")]
        public string IFSCCode { get; set; }
        public string Branch { get; set; }

        [DisplayName("PAN Number")]
        public string PAN { get; set; }

        [DisplayName("Aadhar Number")]
        public string Aadhar { get; set; }

        public string Medical { get; set; }
        public bool CompentenceActive { get; set; }

        public bool IsEmpannlementflag { get; set; }

        [DisplayName("Cost/Hr")]
        public decimal CostPerHour { get; set; }

        [DisplayName("'Mileage/ Km")]
        public decimal MilageInKm { get; set; }

        [DisplayName("All Inclusive")]
        public decimal AllInclusive { get; set; }
        public string CurrencySymbol { get; set; }
        //public string AllInclusive { get; set; }

        // public string Currency { get; set; }

        [DisplayName("Currency")]
        public int CurrencyId { get; set; }
        public string CurrencyName { get; set; }

        public string Remarks { get; set; }

        // public List<CVDocumentViewModel> CVDocuments { get; set; } = new List<CVDocumentViewModel>();
        public DateTime? Validity { get; set; }
        public Dictionary<HttpPostedFileBase[], DateTime?> CVValidity { get; set; } = new Dictionary<HttpPostedFileBase[], DateTime?>(); // Stores file name & its validity date
        public string FileNameWithValidity { get; set; }
    }

    public class CVDocumentViewModel
    {
      //  public HttpPostedFileBase[] ExistingFiles { get; set; }
      public string FileName { get; set; }

        public string FilePath { get; set; }
        public string Validity { get; set; } // Nullable because some may not have a date
    }
    public class UserDetailsModel : UserViewModel
    {
        public List<CommonModel.UserTitleModel> LstUserTitles { get; set; }
        public List<CommonModel.StateModel> LstStates { get; set; }
        public List<CommonModel.CountryModel> LstCountry { get; set; }
        public List<CommonModel.EmployeeTypeModel> LstEmployeeType { get; set; }
        public List<CommonModel.SkillSetModel> LstSkillSet { get; set; }
        public List<CommonModel.EmployeeRolesModel> LstEmployeeRoles { get; set; }
        public List<CommonModel.DesignationModel> LstDesignations { get; set; }

        public List<CommonModel.AssociateModel> LstAssociates { get; set; }

        public List<CommonModel.AssoicateContactPersonModel> LstAssociateContactPerson { get; set; }

        public List<CommonModel.CurrencyTypeModel> LstCurrencyType { get; set; }

       // public List<CVModel> ExistingCVs { get; set; } = new List<CVModel>();
        public List<HttpPostedFileBase> NewFiles { get; set; }
        public List<DateTime?> NewValidityDates { get; set; }

        public List<CVDocumentViewModel> lstCVDocumentViewModel { get; set; }


    }
    public class UserBusinessModel
    {
        public List<UserViewModel> lstUserViewModel { get; set; }
        ConvertExtensions objConvExt = new ConvertExtensions();
        public List<UserViewModel> GetUserListDetails(int siteId, bool isActive,bool isSecondment, string UserType, string strSearch, string alphaChar, int offsetIndex, int fetchCount, string sortingOrder, IUserService _userService)
        {
            var userDetails = _userService.GetUserListDetails(siteId, isActive, isSecondment, UserType, strSearch, alphaChar, offsetIndex, fetchCount, sortingOrder);
            Mapper.CreateMap<UserDomainModel, UserViewModel>();
            lstUserViewModel = userDetails.Select(Mapper.Map<UserDomainModel, UserViewModel>).ToList();
           // lstUserViewModel= lstUserViewModel.Where(u => u.LoginName != "SuperAdmin").OrderBy(u => u.UserId).ToList();
            return lstUserViewModel;
        }

        public List<UserViewModel> GetUserResumeBackupFiles(int userId, IUserService userService)
        {
            var userDetails = userService.GetUserResumeBackupFiles(userId);
            Mapper.CreateMap<UserDomainModel, UserViewModel>();
            lstUserViewModel = userDetails.Select(Mapper.Map<UserDomainModel, UserViewModel>).ToList();
            return lstUserViewModel;
        }

        public bool RemoveResumesByUserId(UserViewModel objuserVM, IUserService userService)
        {
            Mapper.CreateMap<UserViewModel, UserDomainModel>();
            UserDomainModel objUserDomainModel = Mapper.Map<UserViewModel, UserDomainModel>(objuserVM);
            var isSuccess = userService.RemoveResumesByUserId(objUserDomainModel);
            return isSuccess;
        }

        public bool UpdateUserResumeByUserID(UserViewModel model, bool flag, IUserService userService)
        {
            Mapper.CreateMap<UserViewModel, UserDomainModel>();
            UserDomainModel objUserDomainModel = Mapper.Map<UserViewModel, UserDomainModel>(model);
            var isSuccess = userService.UpdateUserResumeByUserID(objUserDomainModel, flag);
            return isSuccess;
        }
        public List<UserViewModel> GetUserListDetails1(Guid Associateguid, string contactPerson, int siteId, bool isActive, string strSearch, string alphaChar, int offsetIndex, int fetchCount, string sortingOrder, IUserService _userService)
        {
            var userDetails = _userService.GetUserListDetails1(Associateguid, contactPerson, siteId, isActive, strSearch, alphaChar, offsetIndex, fetchCount, sortingOrder);
            Mapper.CreateMap<UserDomainModel, UserViewModel>();
            lstUserViewModel = userDetails.Select(Mapper.Map<UserDomainModel, UserViewModel>).ToList();
            return lstUserViewModel;
        }
        //public List<UserViewModel> GetUserSearchList(int siteId, bool isActive, string strSearch, int offsetIndex, int fetchCount, IUserService _userService)
        //{
        //    var userDetails = _userService.GetUserSearchList(siteId, isActive, strSearch, offsetIndex, fetchCount);
        //    Mapper.CreateMap<UserDomainModel, UserViewModel>();
        //    lstUserViewModel = userDetails.Select(Mapper.Map<UserDomainModel, UserViewModel>).ToList();
        //    return lstUserViewModel;
        //}

        public UserViewModel GetUserResumeByID(IUserService  userService, string userId, string fileName)
        {
            UserViewModel files = new UserViewModel();
            var filesInfo = userService.GetUserResumeByID(userId, fileName);
            Mapper.CreateMap<UserDomainModel, UserViewModel>();
            files = Mapper.Map<UserDomainModel, UserViewModel>(filesInfo);
            return files;
        }
        public int CreateUser(UserViewModel objUserViewModel, IUserService _userService)
        {
            var AutoGenerateUserEmailPwd = System.Configuration.ConfigurationManager.AppSettings["AutoGenerateUserEmailPwd"];
            PasswordHasher hasher = new PasswordHasher();
            objUserViewModel.LoginPassword = "12345";
            if (AutoGenerateUserEmailPwd.ToUpper() == "TRUE")
            {
                objUserViewModel.LoginPassword = PasswordExtension.GenerateNewPassword();
            }
            objUserViewModel.LoginPassword = hasher.HashPassword(objUserViewModel.LoginPassword);
            if (objUserViewModel.SkillSetIds != null)
            {
                objUserViewModel.SkillSets = objConvExt.ConvertListToString(objUserViewModel.SkillSetIds);
            }
            else
            {
                objUserViewModel.SkillSets = "";
            }
            Mapper.CreateMap<UserViewModel, UserDomainModel>();
            UserDomainModel objUserDomainModel = Mapper.Map<UserViewModel, UserDomainModel>(objUserViewModel);
            // Generate Employee Code
            string strCode = string.Empty;
            if (objUserDomainModel.UserTypeId == 1)
            {
                strCode = "IQE/P/";
            }
            if (objUserDomainModel.UserTypeId == 2)
            {
                strCode = "IQE/C/";
            }
            if (objUserDomainModel.UserTypeId == 3)
            {
                strCode = "IQE/A/";
                objUserDomainModel.RoleId = 3;
                objUserDomainModel.DesignationId = 2;
            }
            objUserDomainModel.EmployeeCode = strCode;
           return _userService.CreateUser(objUserDomainModel);
        }

        public bool UploadedResumeByUserID(UserViewModel objUDM, bool Flag, IUserService userService)
        {
            Mapper.CreateMap<UserViewModel, UserDomainModel>();
            UserDomainModel objUserService = Mapper.Map<UserViewModel, UserDomainModel>(objUDM);
            var isSuccess = userService.UploadResumeByUserID(objUserService, Flag);
            return isSuccess;
        }
        public List<UserViewModel> GetUserDetailsByGUID(Guid userGuid, IUserService _userService)
        {
            var userDetails = _userService.GetUserDetailsByGUID(userGuid);
            Mapper.CreateMap<UserDomainModel, UserViewModel>();
            lstUserViewModel = userDetails.Select(Mapper.Map<UserDomainModel, UserViewModel>).ToList();
            return lstUserViewModel;
        }
        public UserViewModel GetUserDetailsByUserId(int userId, IUserService _userService)
        {
            UserViewModel model = new UserViewModel();
            var userDetails = _userService.GetUserDetailsByUserId(userId);
            Mapper.CreateMap<UserDomainModel, UserViewModel>();
            model = Mapper.Map<UserDomainModel, UserViewModel>(userDetails);
            return model;
        }
        public IEnumerable<CommonModel.StateModel> GetStateListByCountyId(int countryId, string countryName, IUserService _userService)
        {
            List<CommonModel.StateModel> model = new List<CommonModel.StateModel>();
            var userDetails = _userService.GetStateListByCountyId(countryId, countryName);
            Mapper.CreateMap<StateDomainModel, StateModel>();
            model = userDetails.Select(Mapper.Map<StateDomainModel, StateModel>).ToList();
            return model;
        }
        public IEnumerable<UserViewModel> GetUserDetailsByStateId(int stateId,string stateName, IUserService _userService)
        {
            List<UserViewModel> model = new List<UserViewModel>();
            var userDetails = _userService.GetUserDetailsByStateId(stateId, stateName);
            Mapper.CreateMap<UserDomainModel, UserViewModel>();
            model = userDetails.Select(Mapper.Map<UserDomainModel, UserViewModel>).ToList();
            return model;
        }
        public IEnumerable<UserViewModel> GetInspectorsByCountry(int countryId , IUserService _userService)
        {
            List<UserViewModel> model = new List<UserViewModel>();
            var userDetails = _userService.GetInspectorsByCountry(countryId);
            Mapper.CreateMap<UserDomainModel, UserViewModel>();
            model = userDetails.Select(Mapper.Map<UserDomainModel, UserViewModel>).ToList();
            return model;
        }
        public bool UpdateUser(UserViewModel objUserViewModel, bool emplannelment, IUserService _userService)
        {
            objUserViewModel.SkillSets = objConvExt.ConvertListToString(objUserViewModel.SkillSetIds);
            Mapper.CreateMap<UserViewModel, UserDomainModel>();
            UserDomainModel objUserDomainModel = Mapper.Map<UserViewModel, UserDomainModel>(objUserViewModel);
           return _userService.UpdateUser(objUserDomainModel, emplannelment);
        }

        public void AddEmpannelmentUser(UserViewModel objUserViewModel, IUserService _userService)
        {
            objUserViewModel.SkillSets = objConvExt.ConvertListToString(objUserViewModel.SkillSetIds);
            Mapper.CreateMap<UserViewModel, UserDomainModel>();
            UserDomainModel objUserDomainModel = Mapper.Map<UserViewModel, UserDomainModel>(objUserViewModel);
            _userService.AddEmpannlementUser(objUserDomainModel);
        }
        public UserDetailsModel GetEmployeeDetailsToAdd(int loginUserSiteId, IUserService _userService)
        {
            var dsEmployeeDetails = _userService.GetEmployeeDetailsToAdd(loginUserSiteId);
            UserDetailsModel objUserDetailsModel = new UserDetailsModel();
            objUserDetailsModel.LstUserTitles = dsEmployeeDetails.Tables[0].DataTableToList<CommonModel.UserTitleModel>().OrderBy(m => m.TitleName).ToList();
            objUserDetailsModel.LstCountry = dsEmployeeDetails.Tables[1].DataTableToList<CommonModel.CountryModel>().OrderBy(m => m.CountryId).ToList();
            //objUserDetailsModel.LstStates = dsEmployeeDetails.Tables[1].DataTableToList<CommonModel.StateModel>();
            objUserDetailsModel.LstEmployeeType = dsEmployeeDetails.Tables[2].DataTableToList<CommonModel.EmployeeTypeModel>().OrderBy(m => m.EmployeeTypeName).ToList();
            objUserDetailsModel.LstSkillSet = dsEmployeeDetails.Tables[3].DataTableToList<CommonModel.SkillSetModel>().OrderBy(m => m.SkillSetName).ToList();
            objUserDetailsModel.LstEmployeeRoles = dsEmployeeDetails.Tables[4].DataTableToList<CommonModel.EmployeeRolesModel>().OrderBy(m => m.RoleName).ToList();
            objUserDetailsModel.LstDesignations = dsEmployeeDetails.Tables[5].DataTableToList<CommonModel.DesignationModel>().OrderBy(m => m.DesignationName).ToList();
            return objUserDetailsModel;
        }

        public UserDetailsModel GetAssociateDetailsToAdd(int loginUserSiteId, IUserService _userService)
        {
            var dsEmployeeDetails = _userService.GetAssociateDetailsToAdd(loginUserSiteId);
            UserDetailsModel objUserDetailsModel = new UserDetailsModel();
            objUserDetailsModel.LstAssociates = dsEmployeeDetails.Tables[0].DataTableToList<CommonModel.AssociateModel>().OrderBy(m => m.AssociateName).Distinct().ToList();
            return objUserDetailsModel;
        }

        public UserDetailsModel GetAssociateContactPersonDetailsToAdd(int loginUserSiteId, string associateName, IUserService _userService)
        {
            var dsEmployeeDetails = _userService.GetAssociateContactPersonDetailsToAdd(loginUserSiteId, associateName);
            UserDetailsModel objUserDetailsModel = new UserDetailsModel();
            objUserDetailsModel.LstAssociateContactPerson = dsEmployeeDetails.Tables[0].DataTableToList<CommonModel.AssoicateContactPersonModel>().OrderBy(m => m.ContactPerson).Distinct().ToList();
            return objUserDetailsModel;
        }
        public UserDetailsModel GetEmployeeDetailsToEdit(Guid UserGUId, int loginUserSiteId, IUserService _userService)
        {
            var dsEmployeeDetails = _userService.GetEmployeeDetailsToEdit(UserGUId, loginUserSiteId);
            UserDetailsModel objUserDetailsModel = new UserDetailsModel();
            var empDetails = dsEmployeeDetails.Tables[0].DataTableToList<UserViewModel>();
            objUserDetailsModel.SiteId = loginUserSiteId;
            objUserDetailsModel.UserId = empDetails.FirstOrDefault().UserId;
            objUserDetailsModel.UserGuid = empDetails.FirstOrDefault().UserGuid;
            objUserDetailsModel.EmployeeCode = empDetails.FirstOrDefault().EmployeeCode;
            objUserDetailsModel.UserFullName = empDetails.FirstOrDefault().UserFullName;
            objUserDetailsModel.TitleId = empDetails.FirstOrDefault().TitleId;
            objUserDetailsModel.TitleName = empDetails.FirstOrDefault().TitleName;
            objUserDetailsModel.FirstName = empDetails.FirstOrDefault().FirstName;
            objUserDetailsModel.LastName = empDetails.FirstOrDefault().LastName;
            objUserDetailsModel.DOB = empDetails.FirstOrDefault().DOB;
            objUserDetailsModel.EmailId = empDetails.FirstOrDefault().EmailId;
            objUserDetailsModel.LoginName = empDetails.FirstOrDefault().LoginName;
            objUserDetailsModel.DesignationId = empDetails.FirstOrDefault().DesignationId;
            objUserDetailsModel.DesignationName = empDetails.FirstOrDefault().DesignationName;
            objUserDetailsModel.CountryId = empDetails.FirstOrDefault().CountryId;
            objUserDetailsModel.StateId = empDetails.FirstOrDefault().StateId;
            objUserDetailsModel.StateName = empDetails.FirstOrDefault().StateName;
            objUserDetailsModel.CityName = empDetails.FirstOrDefault().CityName;
            objUserDetailsModel.Address = empDetails.FirstOrDefault().Address;
            objUserDetailsModel.UserImageGUID = empDetails.FirstOrDefault().UserImageGUID;
            objUserDetailsModel.UserImage = empDetails.FirstOrDefault().UserImageGUID == null ? "" : ActionLinkExtensions.GetCompleteImageUrl(null, empDetails.FirstOrDefault().UserImageGUID, loginUserSiteId).ToString();
            objUserDetailsModel.UserImageFileSize = empDetails.FirstOrDefault().UserImageFileSize;
            objUserDetailsModel.UserTypeId = empDetails.FirstOrDefault().UserTypeId;
            objUserDetailsModel.UserTypeName = empDetails.FirstOrDefault().UserTypeName;
            objUserDetailsModel.RoleId = empDetails.FirstOrDefault().RoleId;
            objUserDetailsModel.RoleName = empDetails.FirstOrDefault().RoleName;
            objUserDetailsModel.SiteId = empDetails.FirstOrDefault().SiteId;
            objUserDetailsModel.SiteName = empDetails.FirstOrDefault().SiteName;
            objUserDetailsModel.SiteLogo = empDetails.FirstOrDefault().SiteLogo;
            objUserDetailsModel.Certifications = empDetails.FirstOrDefault().Certifications;
            objUserDetailsModel.Qualification = empDetails.FirstOrDefault().Qualification;
            objUserDetailsModel.ProfQualification = empDetails.FirstOrDefault().ProfQualification;
            objUserDetailsModel.Experience = empDetails.FirstOrDefault().Experience;
            objUserDetailsModel.EmpContactNumber = empDetails.FirstOrDefault().EmpContactNumber;
            objUserDetailsModel.SkillSets = empDetails.FirstOrDefault().SkillSets;
            objUserDetailsModel.OtherProfessional=empDetails.FirstOrDefault().OtherProfessional;
            objUserDetailsModel.IsUserActive = empDetails.FirstOrDefault().IsUserActive;
            objUserDetailsModel.EmployeeCode = empDetails.FirstOrDefault().EmployeeCode;
            objUserDetailsModel.EmployeeCode1 = empDetails.FirstOrDefault().EmployeeCode1;
            objUserDetailsModel.InspectorCode = empDetails.FirstOrDefault().InspectorCode;
            objUserDetailsModel.AssociateId = empDetails.FirstOrDefault().AssociateId;
            objUserDetailsModel.AssociateName = empDetails.FirstOrDefault().AssociateName;
            objUserDetailsModel.ContactPerson = empDetails.FirstOrDefault().ContactPerson;
            objUserDetailsModel.ESI = empDetails.FirstOrDefault().ESI;
            objUserDetailsModel.PF = empDetails.FirstOrDefault().PF;
            objUserDetailsModel.PA = empDetails.FirstOrDefault().PA;
            objUserDetailsModel.Medical = empDetails.FirstOrDefault().Medical;
            objUserDetailsModel.UserImage = empDetails.FirstOrDefault().UserImage;
            objUserDetailsModel.UserImagePath = empDetails.FirstOrDefault().UserImagePath;
            objUserDetailsModel.FileName =  empDetails.FirstOrDefault().FileName;
            objUserDetailsModel.FilePath =     empDetails.FirstOrDefault().FilePath;
            objUserDetailsModel.Validity = empDetails.FirstOrDefault().Validity;
            objUserDetailsModel.BankAcc = empDetails.FirstOrDefault().BankAcc;
            objUserDetailsModel.IFSCCode = empDetails.FirstOrDefault().IFSCCode;
            objUserDetailsModel.Branch = empDetails.FirstOrDefault().Branch;
            objUserDetailsModel.PAN = empDetails.FirstOrDefault().PAN;
            objUserDetailsModel.Aadhar = empDetails.FirstOrDefault().Aadhar;
            objUserDetailsModel.Remarks = empDetails.FirstOrDefault().Remarks;
            objUserDetailsModel.FileNameWithValidity = empDetails.FirstOrDefault().FileNameWithValidity;
            objUserDetailsModel.IsSecondment = empDetails.FirstOrDefault().IsSecondment;

            if ((empDetails.FirstOrDefault().SkillSets != "") && (empDetails.FirstOrDefault().SkillSets != null))
            {
                objUserDetailsModel.SkillSetIds = objConvExt.ConvertStringToList(empDetails.FirstOrDefault().SkillSets);
            }

            objUserDetailsModel.LstUserTitles = dsEmployeeDetails.Tables[1].DataTableToList<CommonModel.UserTitleModel>().OrderBy(m => m.TitleName).ToList();
            objUserDetailsModel.LstCountry = dsEmployeeDetails.Tables[2].DataTableToList<CommonModel.CountryModel>().OrderBy(m => m.CountryId).ToList();
            objUserDetailsModel.LstStates = dsEmployeeDetails.Tables[9].DataTableToList<CommonModel.StateModel>();
            objUserDetailsModel.LstEmployeeType = dsEmployeeDetails.Tables[3].DataTableToList<CommonModel.EmployeeTypeModel>().OrderBy(m => m.EmployeeTypeName).ToList();
            objUserDetailsModel.LstSkillSet = dsEmployeeDetails.Tables[4].DataTableToList<CommonModel.SkillSetModel>().OrderBy(m => m.SkillSetName).ToList();
            objUserDetailsModel.LstEmployeeRoles = dsEmployeeDetails.Tables[5].DataTableToList<CommonModel.EmployeeRolesModel>().OrderBy(m => m.RoleName).ToList();
            objUserDetailsModel.LstDesignations = dsEmployeeDetails.Tables[6].DataTableToList<CommonModel.DesignationModel>().OrderBy(m => m.DesignationName).ToList();
            objUserDetailsModel.LstAssociates = dsEmployeeDetails.Tables[7].DataTableToList<CommonModel.AssociateModel>().OrderBy(m => m.AssociateName).ToList();
            objUserDetailsModel.LstAssociateContactPerson = dsEmployeeDetails.Tables[10].DataTableToList<CommonModel.AssoicateContactPersonModel>().OrderBy(m => m.ContactPerson).ToList();

            if (empDetails.FirstOrDefault().IsEmpannlementflag)
            {
                objUserDetailsModel.IsEmpannlementflag = empDetails.FirstOrDefault().IsEmpannlementflag;
                objUserDetailsModel.CostPerHour = empDetails.FirstOrDefault().CostPerHour;
                objUserDetailsModel.MilageInKm = empDetails.FirstOrDefault().MilageInKm;
                objUserDetailsModel.AllInclusive = empDetails.FirstOrDefault().AllInclusive;
                objUserDetailsModel.CurrencyId = empDetails.FirstOrDefault().CurrencyId;
                objUserDetailsModel.LstCurrencyType = dsEmployeeDetails.Tables[8].DataTableToList<CommonModel.CurrencyTypeModel>().OrderBy(m => m.CurrencyId).ToList();
            }
            return objUserDetailsModel;
        }
        public int CheckUserExistsOrNot(UserViewModel userModel, IUserService _userService)
        {
            Mapper.CreateMap<UserViewModel, UserDomainModel>();
            UserDomainModel UDMDetails = Mapper.Map<UserViewModel, UserDomainModel>(userModel);
            return _userService.CheckUserExistsOrNot(UDMDetails);
        }


        public UserDetailsModel GetEmpannelmentDetailsToAdd(int loginUserSiteId, IUserService _userService)
        {
            var dsEmployeeDetails = _userService.GetEmpannelmentDetailsToAdd(loginUserSiteId);
            UserDetailsModel objUserDetailsModel = new UserDetailsModel();
            objUserDetailsModel.LstCurrencyType = dsEmployeeDetails.Tables[0].DataTableToList<CommonModel.CurrencyTypeModel>().OrderBy(m => m.CurrencyId).ToList();
            return objUserDetailsModel;
        }
    }
}