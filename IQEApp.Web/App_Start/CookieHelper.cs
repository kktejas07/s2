using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace IQEApp.Web.App_Start
{
    public static class CookieHelper
    {
        public static void SetCookie(HttpResponseBase response, string cookieName, string value)
        {
            var cookie = new HttpCookie(cookieName, value)
            {
                HttpOnly = true,
                Secure = true // Ensure the cookie is only sent over HTTPS
            };

            response.Cookies.Add(cookie);

            // Manually set the SameSite attribute
            response.Headers.Add("Set-Cookie", $"{cookieName}={value}; path=/; SameSite=None; Secure; HttpOnly");
        }
    }

}