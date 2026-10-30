using IQEApp.Service.Cache;
using IQEApp.Web.App_Start;
using IQEApp.Web.Models.CommonModels;
using Microsoft.Practices.Unity;
using Newtonsoft.Json;
using System;
using System.Configuration;
using System.Globalization;
using System.Net;
using System.Threading;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using System.Web.Security;


namespace IQEApp.Web
{
    public class MvcApplication : System.Web.HttpApplication
    {
        public static IUnityContainer Container;
        protected void Application_Start()
        {
            //Container = Bootstrapper.Initialise();
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
            AuthConfig.RegisterAuth();
            DataAnnotationsModelValidatorProvider.AddImplicitRequiredAttributeForValueTypes = false;

            // Container = Bootstrapper.Initialise();
            AutoMapperConfiguration.Configure();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            //var factory = new UnityValidatorFactory(Container);
            //FluentValidationModelValidatorProvider.Configure();

            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12; // added for VS Web Performance testing
            //InitGlobalCache(Container);
        }
        private static void InitGlobalCache(IUnityContainer container)
        {
            container.Resolve<IRolesCacheRepository>().Get(1);
        }

        private CustomPrincipal GetCustomPrincipal()
        {
            var iqeAuthCookie = Request.Cookies[FormsAuthentication.FormsCookieName];
            if (iqeAuthCookie == null) return null;
            var iqeAuthTicket = FormsAuthentication.Decrypt(iqeAuthCookie.Value);
            try
            {

                var serializeModel = JsonConvert.DeserializeObject<CustomPrincipalModel>(iqeAuthTicket.UserData);
                //TODO : add campaignid
                var newUser = new CustomPrincipal(iqeAuthTicket.Name)
                {
                    UserId = serializeModel.UserId,
                    EmailId = serializeModel.EmailId,
                    SiteId = serializeModel.SiteId,
                    SiteName = serializeModel.SiteName,
                    RoleId = serializeModel.RoleId,
                    UserGuid = serializeModel.UserGuid,
                    UserRoles = serializeModel.UserRoles,
                    LoginName = serializeModel.LoginName,
                    UserFullName = serializeModel.UserFullName,
                    ProfileImageLink = serializeModel.ProfileImageLink
                };
                //SingletonScreenFeatureMapping.SetScreenFeatureMapping(newUser.RoleId.FirstOrDefault(), _securityService);
                return newUser;
            }
            catch (Exception ex)
            {
                // ErrorLog.ErrorLogI(ex.ToString(), "GetCustomPrincipal");
            }
            return null;
        }
        protected void Application_PostAuthenticateRequest(object sender, EventArgs e)
        {
            var setting = ConfigurationManager.AppSettings.Get("timeout");
            var timeout = setting != null ? Int32.Parse(setting) : 120;

            var serializeModel = GetCustomPrincipal();
            if (serializeModel == null)
                return;
            HttpContext.Current.User = serializeModel;
            //TODO : add campaignid
            var customPrincipal = new CustomPrincipalModel
            {
                UserId = serializeModel.UserId,
                EmailId = serializeModel.EmailId,
                SiteId = serializeModel.SiteId,
                SiteName = serializeModel.SiteName,
                RoleId = serializeModel.RoleId,
                UserGuid = serializeModel.UserGuid,
                UserRoles = serializeModel.UserRoles,
                LoginName = serializeModel.LoginName,
                UserFullName = serializeModel.UserFullName,
                ProfileImageLink = serializeModel.ProfileImageLink
            };
            var userData = JsonConvert.SerializeObject(customPrincipal);
            var iqeAuthTicket = new FormsAuthenticationTicket(
                     1,
                    serializeModel.LoginName,
                     DateTime.Now,
                     DateTime.Now.AddMinutes(timeout),
                     serializeModel.RememberMe,
                     userData);

            var encTicket = FormsAuthentication.Encrypt(iqeAuthTicket);
            var faCookie = new HttpCookie(FormsAuthentication.FormsCookieName, encTicket);
            Response.Cookies.Add(faCookie);
        }

        void Application_BeginRequest(object source, EventArgs e)
        {
            CultureInfo newCulture = new CultureInfo("en-GB"); // Forces dd/MM/yyyy
            Thread.CurrentThread.CurrentCulture = newCulture;
            Thread.CurrentThread.CurrentUICulture = newCulture;
        }
    }
}
