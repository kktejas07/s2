using IQEApp.Service.AdminService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.AdminModel;
using IQEApp.Web.Models.CommonModels;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Administration
{
    //[CustomAuthorize(Roles = "Super Admin Role, Admin Role, Technician Role, Coordinator Role, Quality Check Role, Finance Role")]
    public class AdminController : BaseController
    {
        private readonly IAdminService _adminService;

        public AdminController()
        {
            _adminService = new AdminService();
        }
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.MenuHome, CurrentUser.RoleId.FirstOrDefault()))
            {
                AdminBusinessModel objAdminBusinessModel = new AdminBusinessModel();
                objAdminBusinessModel.GetAllCounts(CurrentUser.SiteId, _adminService);
                return View("Admin", objAdminBusinessModel);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }
    }
}