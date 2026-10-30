using Common.Logging;
using IQEApp.Web.Models.CommonModels;
using System;
using System.Web;

namespace IQEApp.Web.Models.ErrorLog
{
    public class ErrorLogViewModel
    {
        public HttpRequestBase request { get; set; }
        public CustomPrincipal currentUser { get; set; }
        public ILog log { get; set; }

        public void LogInfo(string msg)
        {
            if (log != null)
            {
                log4net.ThreadContext.Properties["IsUnhandled"] = (log4net.ThreadContext.Properties["IsUnhandled"] != null && log4net.ThreadContext.Properties["IsUnhandled"].Equals(true));
                log.Info(GetErrorMsgObj(msg));
                // log.Error(GetErrorMsgObj(msg));
            }
        }
        public void LogError(string msg, Exception exception)
        {
            if (log != null)
            {
                log4net.ThreadContext.Properties["IsUnhandled"] = (log4net.ThreadContext.Properties["IsUnhandled"] != null && log4net.ThreadContext.Properties["IsUnhandled"].Equals(true));

                log.Error(GetErrorMsgObj(msg), exception);
            }
        }

        private object GetErrorMsgObj(string msg)
        {
            return new
            {
                userid = currentUser == null ? 0 : currentUser.UserId,
                path = request == null ? "" : (request.Url == null ? "" : request.Url.PathAndQuery),
                UserHostName = request == null ? null : request.UserHostName,
                UserAgent = request == null ? null : request.UserAgent,
                ipaddress = request == null ? null : request.UserHostAddress,
                form = request == null ? null : request.Form,
                OriginalString = request == null ? null : request.Url.OriginalString,
                RawUrl = request == null ? null : request.RawUrl,
                QueryString = request == null ? null : request.QueryString,
                UrlReferrer = request == null ? null : request.UrlReferrer,
                HttpMethod = request == null ? null : request.HttpMethod,
                msg = msg

            };
        }
    }
}