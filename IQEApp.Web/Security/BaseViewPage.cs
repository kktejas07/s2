using IQEApp.Web.Models.CommonModels;
using System.Web.Mvc;

namespace IQEApp.Web.Security
{
    public abstract class BaseViewPage : WebViewPage
    {
        public virtual new CustomPrincipal User
        {
            get
            {
                var cp = base.User as CustomPrincipal;
                return cp;
            }
        }
    }
    public abstract class BaseViewPage<TModel> : WebViewPage<TModel>
    {
        public virtual new CustomPrincipal User
        {
            get
            {
                var cp = base.User as CustomPrincipal ?? new CustomPrincipal
                {
                    SiteId = 1
                };
                return cp;
            }
        }
    }
}