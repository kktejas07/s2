using Common.Logging;
using IQEApp.Core;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ErrorLog;
using System;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace IQEApp.Web.Controllers.Common
{
    public class BaseController : Controller
    {
        protected WISession objWISession = new WISession();

        protected ErrorLogViewModel errorLogObj;


        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            //HttpSessionStateBase session = filterContext.HttpContext.Session;
            //Controller controller = filterContext.Controller as Controller;

            //if (controller != null)
            //{
            //    if (session != null && session["authstatus"] == null)
            //    {
            //        filterContext.Result =
            //               new RedirectToRouteResult(
            //                   new RouteValueDictionary{{ "controller", "Login" },
            //                              { "action", "Logon" }
            //                               });
            //    }
            //}

            //base.OnActionExecuting(filterContext);

            //var request = filterContext.RequestContext.HttpContext;

            //errorLogObj = new ErrorLogViewModel
            //{
            //    currentUser = CurrentUser,
            //    log = LogManager.GetLogger(filterContext.Controller.GetType()),
            //    request = Request
            //};


            //Do the default OnActionExecuting first.
            base.OnActionExecuting(filterContext);

            //The request variable will allow you to see information on the current request.
            var request = filterContext.RequestContext.HttpContext;

            errorLogObj = new ErrorLogViewModel
            {
                currentUser = CurrentUser,
                log = LogManager.GetLogger(filterContext.Controller.GetType()),
                request = Request
            };
        }
        protected override void OnException(ExceptionContext filterContext)
        {
            base.OnException(filterContext);

            if (filterContext.Exception != null)
            {
                log4net.ThreadContext.Properties["IsUnhandled"] = true;
                if (errorLogObj != null)
                {
                    errorLogObj.LogError("OnException", filterContext.Exception);
                }
            }
        }

        public ActionResult LogoutIfUserNotLoggedin()
        {
            if (!IsLoggedIn())
            {
                return PartialView("_RedirectToLogin");
            }
            return null;
        }
        public ActionResult RedirectIfUserNotLoggedin()
        {
            if (!IsLoggedIn())
            {
                return RedirectToAction("Logon", "Login");
            }
            return null;
        }
        public CustomPrincipal CurrentUser
        {
            get { return HttpContext.User as CustomPrincipal; }
        }

        public bool IsLoggedIn()
        {
            var iqeAuthCookie = Request.Cookies[System.Web.Security.FormsAuthentication.FormsCookieName];
            if (iqeAuthCookie != null)
            {
                var iqeAuthTicket = System.Web.Security.FormsAuthentication.Decrypt(iqeAuthCookie.Value);
                if (iqeAuthTicket != null)
                {
                    var serializeModel = Newtonsoft.Json.JsonConvert.DeserializeObject<CustomPrincipalModel>(iqeAuthTicket.UserData);
                    return true;
                }
                else
                {
                    return false;
                }
            }
            else
            {
                return false;
            }
        }
        public string IpAddress
        {
            get
            {
                var ipAddress = Request.ServerVariables["HTTP_X_FORWARDED_FOR"];
                if (string.IsNullOrEmpty(ipAddress))
                {
                    ipAddress = Request.ServerVariables["REMOTE_ADDR"];
                }
                return ipAddress;
            }
        }

        protected virtual void OnResultExecuting()
        {
            ViewBag.Session = null;
        }

        protected int AdminIdUserId
        {
            get
            {
                if (Session["UserId"] != null & Convert.ToString(Session["UserId"]) != string.Empty)
                {
                    return Convert.ToInt32(Session["UserId"]);
                }
                if (Session["AdminId"] != null)
                {
                    return Convert.ToInt32(Session["AdminId"]);
                }
                return 0;
            }

        }

        protected int AdminId
        {
            get
            {
                return Session["AdminId"] != null && Session["AdminId"].ToString() != ""
                ? Convert.ToInt32(Session["AdminId"])
                : 0;
            }

        }

        protected int UserId
        {
            get
            {
                return CurrentUser.UserId;
            }
        }


        public new RedirectToRouteResult RedirectToAction(string action, string controller)
        {
            return base.RedirectToAction(action, controller);
        }
    }
}