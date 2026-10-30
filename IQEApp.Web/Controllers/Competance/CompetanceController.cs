using IQEApp.Service.CompetanceService;
using IQEApp.Service.SecurityService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.CompetanceModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Competance
{
    public class CompetanceController : BaseController
    {
        private readonly ICompetanceService _competanceService;
        private readonly ISecurityService _securityService;
        CompetanceBusinessModel objCompetanceBusinessModel = new CompetanceBusinessModel();
        public CompetanceController()
        {
            _competanceService = new CompetanceService();
            _securityService = new SecurityService();
            //SingletonScreenFeatureMapping.SetScreenFeatureMapping(CurrentUser.RoleId.FirstOrDefault(), _securityService);
        }

        // GET: Enquires
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.MenuOperations, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<CompetanceViewModel> list = new List<CompetanceViewModel>();
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                try
                {
                 //   list = objCompetanceBusinessModel.GetCompetanceListBySiteId(CurrentUser.SiteId, _competanceService);

                    if (list.Count > 0)
                    {
                        ViewBag.CurrentPageCount = defaultFetchCount;
                    }
                    else
                    {
                        ViewBag.Total = 0;
                        ViewBag.CurrentPageCount = 0;
                    }
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Get Competance list by site id", ex);
                }

                //  return View();
                return View("Index", list);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;

        }

        public ActionResult AddCompetance()
        {
            CompetanceViewModel objCompetanceViewModel = new CompetanceViewModel();

            //To fetch all the values to fill drop down
            objCompetanceViewModel = objCompetanceBusinessModel.GetCompetanceDetailsToAdd(CurrentUser.SiteId, _competanceService);
            return PartialView("_AddCompetance", objCompetanceViewModel);
        }

        [HttpPost]
        public ActionResult CreateCompetance(CompetanceViewModel objCVM)
        {
            var isSuccess = false;
            try
            {
                objCVM.SiteId = CurrentUser.SiteId;
                if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.HumanResourceCreate, CurrentUser.RoleId.FirstOrDefault()))
                {
                    objCVM.CreatedBy = CurrentUser.RoleId.FirstOrDefault();
                    var cId = objCompetanceBusinessModel.SaveCompetanceDetails(objCVM, _competanceService);

                    if (cId == 1)
                    {
                        isSuccess = true;
                        return Json(new { status = isSuccess, message = "Success", competanceId = cId }, JsonRequestBehavior.AllowGet);
                    }
                    else if (cId == -1)
                    {
                        isSuccess = false;
                        return Json(new { status = isSuccess, message = "Competance already existed for this user. Please Check in Competance Matrix.", competanceId = cId }, JsonRequestBehavior.AllowGet);
                    }
                    else if (cId == -2)
                    {
                        isSuccess = false;
                        return Json(new { status = isSuccess, message = "Invalid User Name.", competanceId = cId }, JsonRequestBehavior.AllowGet);
                    }

                }
                else
                {
                    return Json(new { status = isSuccess, message = "duplicate" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while saving manufacturer " + ex, ex);
                isSuccess = false;
            }
            return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
        }


    }
}