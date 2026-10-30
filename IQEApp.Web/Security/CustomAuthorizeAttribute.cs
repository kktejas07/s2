using IQEApp.Web.Models.CommonModels;
using System.Configuration;
using System.Globalization;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace IQEApp.Web.Security
{
    public class CustomAuthorizeAttribute : AuthorizeAttribute
    {
        public string UsersConfigKey { get; set; }
        public string RolesConfigKey { get; set; }

        protected virtual CustomPrincipal CurrentUser
        {
            get { return HttpContext.Current.User as CustomPrincipal; }
        }

        public override void OnAuthorization(AuthorizationContext filterContext)
        {
            if (!filterContext.HttpContext.Request.IsAuthenticated)
            {
                filterContext.Result = new RedirectToRouteResult(new RouteValueDictionary(new { controller = "Login", action = "SessionExpired" }));
            }
            else
            {
                var authorizedUsers = ConfigurationManager.AppSettings[UsersConfigKey];
                var authorizedRoles = ConfigurationManager.AppSettings[RolesConfigKey];

                Users = string.IsNullOrEmpty(Users) ? authorizedUsers : Users;
                Roles = string.IsNullOrEmpty(Roles) ? authorizedRoles : Roles;

                bool isAuthorizedUser = false;

                if (!string.IsNullOrEmpty(Roles))
                {
                    foreach (var role in Roles.Split(','))
                    {
                        if (string.IsNullOrEmpty(role)) continue;
                        if (CurrentUser.IsInRole(role.Trim()))
                        {
                            isAuthorizedUser = true;
                        }
                    }
                }

                if (!isAuthorizedUser)
                {
                    filterContext.Result = new RedirectToRouteResult(new RouteValueDictionary(new { controller = "Error", action = "AccessDenied" }));
                }

                if (!string.IsNullOrEmpty(Users))
                {
                    if (!Users.Contains(CurrentUser.UserId.ToString(CultureInfo.InvariantCulture)))
                    {
                        filterContext.Result = new RedirectToRouteResult(new
                             RouteValueDictionary(new { controller = "Error", action = "AccessDenied" }));
                    }
                }
            }

        }
    }
}