using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(IQEApp.Web.Startup))]
namespace IQEApp.Web
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
