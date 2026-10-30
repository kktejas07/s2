using AutoMapper;
using IQEApp.Domain.CommonDomain;
using IQEApp.Domain.LoginDomain;
using IQEApp.Domain.UserDomain;
using IQEApp.Service.LoginService;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.UserModel;
using Microsoft.AspNet.Identity;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace IQEApp.Web.Models.LoginModel
{
    public class LoginViewModel : BaseViewModel
    {
        [Required]
        [Display(Name = "Login name")]
        [StringLength(50, ErrorMessage = "Enter Less than 50 characters")]
        public string LoginName { get; set; }
        [Required]
        [DataType(DataType.Password)]
        [Display(Name = "Password")]
        [StringLength(30, ErrorMessage = "Enter Less than 30 characters")]
        public string LoginPassword { get; set; }
        //public int UserId { get; set; }
        //public short SiteId { get; set; }
        public string EmailId { get; set; }
        public string ValidationMsg { get; set; }
        public LoginValidationStatuses ValidationStatus { get; set; }
        public bool IsUserActive { get; set; }
        public int RoleId { get; set; }
        public string UserFullName { get; set; }

        public bool IsRoleActive { get; set; }
    }

    public class LoginBusinessModel
    {

        public List<LoginViewModel> lstLoginViewModel { get; set; }

        public string checkUsername(LoginViewModel loginModel, ILoginService _loginService)
        {
            Mapper.CreateMap<LoginViewModel, LoginDomainModel>();
            LoginDomainModel LDMDetails = Mapper.Map<LoginViewModel, LoginDomainModel>(loginModel);
            // int rVal = _loginService.checkUsername(LDMDetails);
            return _loginService.checkUserLogin(LDMDetails);
        }
        public LoginViewModel ValidateLoginUserInfo(LoginViewModel loginModel, ILoginService _loginService)
        {
            PasswordHasher hasher = new PasswordHasher();
            LoginViewModel objLoginViewModel = new LoginViewModel();
            var loginUserInfo = _loginService.ValidateLoginUserInfo(loginModel.LoginName);
            Mapper.CreateMap<LoginDomainModel, LoginViewModel>();
            lstLoginViewModel = loginUserInfo.Select(Mapper.Map<LoginDomainModel, LoginViewModel>).ToList();
            if (lstLoginViewModel.Any())
            {
                if (hasher.VerifyHashedPassword(loginUserInfo.FirstOrDefault().LoginPassword, loginModel.LoginPassword) == PasswordVerificationResult.Failed)
                {
                    lstLoginViewModel.FirstOrDefault().ValidationStatus = LoginValidationStatuses.InvalidCredentials;
                    lstLoginViewModel.FirstOrDefault().ValidationMsg = "Login name or Password is Incorrect.";
                    return lstLoginViewModel.FirstOrDefault();
                }
                else if (!loginUserInfo.FirstOrDefault().IsUserActive)
                {
                    lstLoginViewModel.FirstOrDefault().ValidationStatus = LoginValidationStatuses.UserBlocked;
                    lstLoginViewModel.FirstOrDefault().ValidationMsg = "Login user is Blocked.";
                    return lstLoginViewModel.FirstOrDefault();
                }
                else if (!loginUserInfo.FirstOrDefault().IsRoleActive)
                {
                    lstLoginViewModel.FirstOrDefault().ValidationStatus = LoginValidationStatuses.RoleBlocked;
                    lstLoginViewModel.FirstOrDefault().ValidationMsg = "Role Disabled for Assigned User.";
                    return lstLoginViewModel.FirstOrDefault();
                }

                else
                {
                    lstLoginViewModel.FirstOrDefault().ValidationStatus = LoginValidationStatuses.LoginSuccess;
                    lstLoginViewModel.FirstOrDefault().ValidationMsg = "Login Success.";
                    return lstLoginViewModel.FirstOrDefault();
                }
            }
            else
            {
                objLoginViewModel.ValidationStatus = LoginValidationStatuses.InvalidCredentials;
                objLoginViewModel.ValidationMsg = "Login name or Password are Incorrect.";
                return objLoginViewModel;
            }

            return lstLoginViewModel.FirstOrDefault();
        }

        public List<LoginViewModel> ValidateLoginNameExists(LoginViewModel loginModel, ILoginService _loginService)
        {
            var loginUserInfo = _loginService.ValidateLoginUserInfo(loginModel.LoginName);
            Mapper.CreateMap<LoginDomainModel, LoginViewModel>();
            lstLoginViewModel = loginUserInfo.Select(Mapper.Map<LoginDomainModel, LoginViewModel>).ToList();
            return lstLoginViewModel;
        }

        public void SaveProcessedEmails(EmailViewModel objEmailViewModel, ILoginService _loginService)
        {
            Mapper.CreateMap<EmailViewModel, EmailDomainModel>();
            EmailDomainModel objEmailDomainModel = Mapper.Map<EmailViewModel, EmailDomainModel>(objEmailViewModel);
            _loginService.SaveProcessedEmails(objEmailDomainModel);
        }
        public void UpdatePassword(UserViewModel objUserViewModel, ILoginService _loginService)
        {
            Mapper.CreateMap<UserViewModel, UserDomainModel>();
            UserDomainModel objUserDomainModel = Mapper.Map<UserViewModel, UserDomainModel>(objUserViewModel);
            _loginService.UpdatePassword(objUserDomainModel);
        }

        public bool ValidatePassword(UserViewModel objUserViewModel, ILoginService _loginService)
        {
            var IsSuccess = false;
            PasswordHasher hasher = new PasswordHasher();
            var loginUserInfo = _loginService.ValidateLoginUserInfo(objUserViewModel.LoginName);
            if (loginUserInfo.Any())
            {
                if (hasher.VerifyHashedPassword(loginUserInfo.FirstOrDefault().LoginPassword, objUserViewModel.OldPassword) == PasswordVerificationResult.Success)
                {
                    IsSuccess = true;
                }
            }

            return IsSuccess;
        }
    }
    public enum LoginValidationStatuses
    {
        LoginSuccess,
        InvalidCredentials,
        UserBlocked,
        RoleBlocked,
        UserSuspended,
        UserOnLeave,
        LoginFail
    }
}