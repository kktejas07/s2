using IQEApp.Web.Models.LoginModel;
using IQEApp.Web.Models.UserModel;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Common
{
    //[CustomAuthorize(Roles = "Super Admin Role, Admin Role, Technician Role, Coordinator Role, Quality Check Role, Finance Role")]
    public class SettingsController : BaseController
    {
        //
        // GET: /Settings/
        public ActionResult Index()
        {
            return View("SettingsPage");
        }

        public ActionResult GetSettingsDetails(int stSectionId)
        {
            if (stSectionId == (int)SettingsDataType.ChangePassword)
            {
                UserViewModel objUserViewModel = new UserViewModel();
                objUserViewModel.UserGuid = CurrentUser.UserGuid;
                objUserViewModel.LoginName = CurrentUser.LoginName;
                return PartialView("_ChangePassword", objUserViewModel);
            }
            return null;
        }
    }
}