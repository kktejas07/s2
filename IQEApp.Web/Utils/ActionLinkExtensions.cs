using System;
using System.Configuration;
using System.Net;
using System.Web.Mvc;


namespace IQEApp.Web.Utils
{
    public static class ActionLinkExtensions
    {
        public static MvcHtmlString ProfileLink(this HtmlHelper helper, String profileFriendlyURL, string fullName)
        {
            return MvcHtmlString.Create("<a href = '/Profile/" + profileFriendlyURL + "' title='" + fullName + "' data-toggle='tooltip'>" + fullName + "</a>");
        }
        public static MvcHtmlString ProfileLink(this HtmlHelper helper, String profileFriendlyURL, string prefixTitle, String firstName, String lastname)
        {
            return MvcHtmlString.Create("<a href = '/Profile/" + profileFriendlyURL + "' title='" + prefixTitle + " " + firstName + " " + lastname + "' data-toggle='tooltip'>" + prefixTitle + " " + firstName + " " + lastname + "</a>");
        }
        public static MvcHtmlString GetCompleteImageUrl(this HtmlHelper helper, string url, int siteid)
        {
            var finalUrl = string.Empty;
            MvcHtmlString MVCStr;
            string imageDataURL = string.Empty;
            if (url != null)
            {
                if (!url.Contains("site"))
                {
                    finalUrl = ConfigurationManager.AppSettings["UserProfilesImages"] + "site-" + siteid + "\\" + url;
                }
                else
                {
                    finalUrl = url;
                }

                if (url != "")
                {
                    try
                    {
                        WebClient myClient = new WebClient();
                        byte[] bytes = myClient.DownloadData(finalUrl);
                        string imageBase64Data = Convert.ToBase64String(bytes);
                        imageDataURL = string.Format("data:image/png;base64,{0}", imageBase64Data);
                        MVCStr = new MvcHtmlString(imageDataURL);
                        return MVCStr;
                    }
                    catch (Exception ex)
                    {
                        return MvcHtmlString.Create(finalUrl);
                    }
                }
            }
            return MvcHtmlString.Create(finalUrl);
        }
        public static string ShortString(this HtmlHelper helper, string str, int length)
        {
            if (string.IsNullOrWhiteSpace(str)) return "";
            var subStr = str.Length > length ? str.Substring(0, length) + "..." : str;
            return subStr;
        }
    }
}