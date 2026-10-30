using IQEApp.Service.MasterService;
using IQEApp.Service.SecurityService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.Security;
using IQEApp.Web.Utils;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Security
{
    //[CustomAuthorize(Roles = "Super Admin Role")]
    public class SecurityController : BaseController
    {
        private readonly IMasterService _masterService;
        private readonly ISecurityService _securityService;
        SecurityViewModel objSecurityViewModel = new SecurityViewModel();

        public SecurityController()
        {
            _masterService = new MasterService();
            _securityService = new SecurityService();
        }
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.MenuSecurity, CurrentUser.RoleId.FirstOrDefault()))
            {
                SecurityBusinessModel objSecurityBusinessModel = new SecurityBusinessModel();
                SecurityDetails objSecurityDetails = new SecurityDetails();
                objSecurityDetails = objSecurityBusinessModel.FetchRoleDetails(CurrentUser.SiteId, _masterService);
                return View("Security", objSecurityDetails);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        public ActionResult FetchRoleBasedScreenFeatureMapping(int RoleId)
        {
            SecurityBusinessModel objSecurityBusinessModel = new SecurityBusinessModel();
            SecurityDetails objSecurityDetails = new SecurityDetails();
            
            objSecurityDetails = objSecurityBusinessModel.FetchRoleBasedScreenFeatureMapping1(RoleId,  _securityService);
            return PartialView("_SecurityFeatureView", objSecurityDetails);
            
        }


        public ActionResult GetChildNodes(int RoleId,int? ChildNode)
        {
            SecurityBusinessModel objSecurityBusinessModel = new SecurityBusinessModel();
            SecurityDetails objSecurityDetails = new SecurityDetails();
            
            objSecurityDetails = objSecurityBusinessModel.FetchRoleBasedScreenFeatureMapping(RoleId, ChildNode, _securityService);
            objSecurityDetails.ChildId = ChildNode;
            return  PartialView("_ChildNodeSearch", objSecurityDetails);
        }

        public ActionResult GetSubChildNodes(int RoleId,int SubChildNodeId)
        {
            SecurityBusinessModel objSecurityBusinessModel = new SecurityBusinessModel();
            SecurityDetails objSecurityDetails = new SecurityDetails();
            objSecurityDetails = objSecurityBusinessModel.FetchRoleBasedScreenFeatureMapping(RoleId, SubChildNodeId, _securityService);
            return PartialView("_SubChildNodeSearch", objSecurityDetails);
        }
        public ActionResult SaveRoleFeatureMapping(int RoleId, int[] ScnFeatId)
        {
            ConvertExtensions objConvertExtensions = new ConvertExtensions();
            if (ScnFeatId == null)
            {
                _securityService.SaveRoleFeatureMapping(RoleId, "-1"); // passing -1 values since there are no values to save, this -1 will be validated in DB
            }
            else
            {
                _securityService.SaveRoleFeatureMapping(RoleId, objConvertExtensions.ConvertListToString(ScnFeatId.ToList()));
            }
            SecurityBusinessModel objSecurityBusinessModel = new SecurityBusinessModel();
            SecurityDetails objSecurityDetails = new SecurityDetails();
            objSecurityDetails = objSecurityBusinessModel.FetchRoleBasedScreenFeatureMapping(CurrentUser.RoleId.FirstOrDefault(),RoleId, _securityService);

            return PartialView("_SecurityFeatureView", objSecurityDetails);
        }
    }
}