using IQEApp.Core.Extensions;
using IQEApp.Service.LoginService;
using IQEApp.Service.SecurityService;
using IQEApp.Service.UserService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.LoginModel;
using IQEApp.Web.Models.UserModel;
using IQEApp.Web.Services;
using Microsoft.AspNet.Identity;
using Newtonsoft.Json;
using System;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace IQEApp.Web.Controllers.Login
{
    public class LoginController : BaseController
    {
        private readonly ILoginService _loginService;
        private readonly IUserService _userService;
        private readonly ISecurityService _securityService;
        LoginBusinessModel objLoginBusinessModel = new LoginBusinessModel();

        public LoginController()
        {
            _loginService = new LoginService();
            _userService = new UserService();
            _securityService = new SecurityService();
        }
        public ActionResult Index()
        {
            return null;
        }
        [AllowAnonymous]
        public ActionResult Logon()
        {
            return View("LoginPage");
        }
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult ValidateUserLogin(LoginViewModel loginModel, string returnUrl)
        {
            //loginModel.LoginName = "superadmin";
            //loginModel.LoginPassword = "Admin@123";
            try
            {
                //if (ModelState.IsValid)
                {
                    //get the user details based on login Name
                    var loginStatus = objLoginBusinessModel.ValidateLoginUserInfo(loginModel, _loginService);
                    if (loginStatus.ValidationStatus == LoginValidationStatuses.LoginSuccess)
                    {
                        // validation of user pwd, user active,  etc...
                        var user = _userService.GetUserDetailsByGUID(loginStatus.UserGuid).GroupBy(i => i.UserId)
                            .Select(i => new
                            {
                                FirstName = i.Select(j => j.FirstName).FirstOrDefault(),
                                LastName = i.Select(j => j.LastName).FirstOrDefault(),
                                UserFullName = i.Select(j => j.UserFullName).FirstOrDefault(),
                                UserId = i.Select(j => j.UserId).FirstOrDefault(),
                                EmailId = i.Select(j => j.EmailId).FirstOrDefault(),
                                LoginName = i.Select(j => j.LoginName).FirstOrDefault(),
                                UserGuid = i.Select(j => j.UserGuid).FirstOrDefault(),
                                SiteId = i.Select(j => j.SiteId).FirstOrDefault(),
                                SiteName = i.Select(j => j.SiteName).FirstOrDefault(),
                                SiteLogo = i.Select(j => j.SiteLogo).FirstOrDefault(),
                                RoleId = i.Select(j => j.RoleId).FirstOrDefault(),
                                RoleName = i.Select(j => j.RoleName).FirstOrDefault(),
                                IsPasswordUpdate = i.Select(j => j.IsPasswordUpdate).FirstOrDefault(),
                                UserImageGUID = i.Select(j => j.UserImageGUID).FirstOrDefault()
                            })
                            .FirstOrDefault();
                        int[] lstRoleIds = new[] { user.RoleId };
                        string[] lstRoleNames = new[] { user.RoleName };
                        var serializeModel = new CustomPrincipalModel
                        {
                            FirstName = user.FirstName,
                            LastName = user.LastName,
                            UserFullName = user.UserFullName,
                            UserId = user.UserId,
                            EmailId = user.EmailId,
                            LoginName = user.LoginName,
                            UserGuid = user.UserGuid,
                            SiteId = user.SiteId,
                            SiteName = user.SiteName,
                            SiteLogo = user.SiteLogo,
                            RoleId = lstRoleIds.OfType<int>().ToList(),
                            UserRoles = lstRoleNames.OfType<string>().ToList(),
                            ProfileImageLink = user.UserImageGUID
                        };
                        WriteCookie(serializeModel, serializeModel.LoginName);
                        SingletonScreenFeatureMapping.ClearScreenFeatureMapping();
                        SingletonScreenFeatureMapping.SetScreenFeatureMapping(user.RoleId);

                        if (!user.IsPasswordUpdate)
                        {
                            return RedirectToAction("ChangePassword", "Login", new { isInitialLogin = true, UserGuid = user.UserGuid, LoginName = user.LoginName });
                        }
                        return RedirectToLocal(returnUrl, serializeModel);
                    }
                    else
                    {
                        ViewBag.Message = loginStatus.ValidationMsg;
                    }
                }
                return View("LoginPage");
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Validate User Login", ex);
                return View("DBError");
            }
            return null;
        }
        private ActionResult RedirectToLocal(string returnUrl, CustomPrincipalModel customPrincipal)
        {
            if (Url.IsLocalUrl(returnUrl) && returnUrl.IndexOf("logout") < 0)
            {
                return Redirect(returnUrl);
            }
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            //if (customPrincipal.RoleId.Contains((int)UserRoles.SuperAdminRole) ||
            //    customPrincipal.RoleId.Contains((int)UserRoles.AdminRole))
            //{
            //    return RedirectToAction("Index", "Admin");
            //}
            //else
            {
                return RedirectToAction("Index", "Admin");
            }
            return null;

        }
        private static void WriteCookie<T>(T serializeModel, string loginName)
        {
            var userData = JsonConvert.SerializeObject(serializeModel);
            var ticket = new FormsAuthenticationTicket(1, loginName,
                DateTime.Now, DateTime.Now.AddMinutes(15),
                true, userData);
            var hashedTicket = FormsAuthentication.Encrypt(ticket);

            var cookie = new HttpCookie(FormsAuthentication.FormsCookieName, hashedTicket);
            System.Web.HttpContext.Current.Response.Cookies.Add(cookie);

        }

        [AllowAnonymous]
        public ActionResult SessionExpired()
        {
            return View();
        }
        [AllowAnonymous]
        public ActionResult RedirectToLogin()
        {
            return PartialView("_RedirectToLogin");
        }
        public ActionResult LogOut()
        {
            objWISession.RemoveAllSession();
            Session.Abandon();
            FormsAuthentication.SignOut();
            return RedirectToAction("LogOn", "Login");
        }

        public ActionResult ForgotPassword()
        {
            UserViewModel objUserViewModel = new UserViewModel();
            return View("ForgotPassword", objUserViewModel);
        }

        public ActionResult ProcessForgotPassword(LoginViewModel objLoginViewModel)
        {
            var isSuccess = false;
            string message = null;
            try
            {
                var loginStatus = objLoginBusinessModel.ValidateLoginNameExists(objLoginViewModel, _loginService);
                if (loginStatus.Any())
                {
                    EmailViewModel objEmailViewModel = new EmailViewModel();
                    EmailProcessing objEmailProcessing = new EmailProcessing();
                    objEmailViewModel.SenderEmailId = ConfigurationManager.AppSettings["SupportEmail"];
                    objEmailViewModel.ReceiverEmailId = loginStatus.FirstOrDefault().EmailId;
                    objEmailViewModel.SenderName = "IQE Admin";
                    objEmailViewModel.ReceiverName = loginStatus.FirstOrDefault().UserFullName;
                    objEmailViewModel.SectionType = SectionType.ForgotPassword;
                    objEmailViewModel.ReceiverId = loginStatus.FirstOrDefault().UserId;
                    objEmailViewModel.SectionId = 6; // value hard coded from mstSection table
                    var AutoGenerateUserEmailPwd = ConfigurationManager.AppSettings["AutoGenerateUserEmailPwd"];
                    PasswordHasher hasher = new PasswordHasher();
                    UserViewModel objUserViewModel = new UserViewModel();
                    objUserViewModel.NewPassword = "admin@123";
                    if (AutoGenerateUserEmailPwd.ToUpper() == "TRUE")
                    {
                        objUserViewModel.NewPassword = PasswordExtension.GenerateNewPassword();
                    }
                    objEmailViewModel.NewPassword = objUserViewModel.NewPassword;
                    isSuccess = objEmailProcessing.EmailFormating(objEmailViewModel);

                    if (isSuccess)
                    {
                        //Save the email template into DB
                        objEmailViewModel.LoginUserId = loginStatus.FirstOrDefault().UserId;
                        objLoginBusinessModel.SaveProcessedEmails(objEmailViewModel, _loginService);
                        //update pwd in database and change status of firstime login
                        objUserViewModel.NewPassword = hasher.HashPassword(objUserViewModel.NewPassword);
                        objUserViewModel.LoginUserId = CurrentUser?.UserId ?? loginStatus.FirstOrDefault().UserId;
                        objUserViewModel.UserGuid = loginStatus.FirstOrDefault().UserGuid;
                        objUserViewModel.IsPasswordUpdate = false;
                        objLoginBusinessModel.UpdatePassword(objUserViewModel, _loginService);
                        //IsPasswordUpdate marked as false since user need to change the pwd after receiving email.
                        message = "Password reset instructions sent successfully.";
                    }
                    else
                    {
                        message = "Failed to send email. Password reset was not applied.";
                    }
                    return Json(new { status = isSuccess, message = message }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    message = "LoginName does not exists";
                    return Json(new { status = isSuccess, message = message }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Process Forgot Password", ex);
            }
            return Json(new { status = isSuccess, message = "Unable to process Email" }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult ChangePassword(bool isInitialLogin, Guid UserGuid, string LoginName)
        {
            UserViewModel objUserViewModel = new UserViewModel();
            return View("ChangePassword", objUserViewModel);
        }

        public ActionResult ProcessChangePassword(UserViewModel objUserViewModel)
        {
            var isSuccess = false;
            try
            {

                bool pwdStatus = objLoginBusinessModel.ValidatePassword(objUserViewModel, _loginService);
                if (pwdStatus)
                {
                    PasswordHasher hasher = new PasswordHasher();
                    isSuccess = true;
                    objUserViewModel.LoginUserId = CurrentUser.UserId;
                    objUserViewModel.IsPasswordUpdate = true;
                    objUserViewModel.NewPassword = hasher.HashPassword(objUserViewModel.NewPassword);
                    objLoginBusinessModel.UpdatePassword(objUserViewModel, _loginService);
                    //IsPasswordUpdate marked as true since user has change the pwd.
                    return Json(new { status = isSuccess, message = "change password sucess" }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { status = isSuccess, message = "Password incorrect" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Process Change Password", ex);
            }

            return Json(new { status = isSuccess, message = "Unable to change password" }, JsonRequestBehavior.AllowGet);

        }
        //public ActionResult LoginWithEmailIdOrLoginName (string loginType )
        //{
        //    LoginViewModel objlogiLoginViewModel = new LoginViewModel();
        //    if (loginType == "EmailId")
        //    {
        //        return PartialView("_LoginWithEmailId", objlogiLoginViewModel);
        //    }
        //    else if (loginType == "LoginName")
        //    {
        //        return PartialView("_LoginWithLoginName", objlogiLoginViewModel);
        //    }

        //    return null;
        //}
    }
}