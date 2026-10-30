using IQEApp.Service.ControlNumberService;
using IQEApp.Service.ServiceOrder;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.UserModel;
using IQEApp.Web.Models.VisitProcessing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers
{
    public class OperationsController : BaseController
    {
        private readonly ControlNumberService _controlNumberService;
        private readonly IServiceOrderService _serviceOrderService;

        ControlNumberBusinessModel objBusinessModel = new ControlNumberBusinessModel();
        public OperationsController()
        {
            _controlNumberService = new ControlNumberService();
            _serviceOrderService = new ServiceOrderService();
        }
        // GET: Operations
        public ActionResult Index(DirectorySearchQueryModel searchQueryModel)
        {
            return null;
        }

        public ActionResult ScheduleVisit(DirectorySearchQueryModel searchQueryModel)
        {
            // ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();

            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsScheduleVisit, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<ControlNumberViewModel> lstControlNumbersList = new List<ControlNumberViewModel>();
                searchQueryModel.SiteId = CurrentUser.SiteId;
                if (string.IsNullOrEmpty(searchQueryModel.StrSearch))
                    searchQueryModel.StrSearch = "";
                if (string.IsNullOrEmpty(searchQueryModel.AlphaSearch))
                    searchQueryModel.AlphaSearch = "";
                try
                {
                    var lstControlNumbersList1 = objBusinessModel.GetControlNumberDetails(searchQueryModel, _controlNumberService);
                    ViewBag.Total = lstControlNumbersList.Count > 0 ? lstControlNumbersList.FirstOrDefault().Total : 0;
                    searchQueryModel.PageCount += searchQueryModel.FetchCount;
                    ViewBag.CurrentPageCount = searchQueryModel.PageCount;
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("fetching control numbers", ex);
                }
                return View(lstControlNumbersList);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;

            //ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();
            //try
            //{
            //    ////controlNumberGuid == null ? Guid.Empty : (object)controlNumberGuid;
            //    //if ((!controlNumberGuid.HasValue) && (string.IsNullOrEmpty(controlNumber)))
            //    //{
            //    //    model.ControlNumberDetails = new ControlNumberViewModel();
            //    //    model.LstUsers = new List<UserViewModel>();

            //    //}
            //    //else
            //    //{
            //    //    try
            //    //    {
            //    //        model = objBusinessModel.GetVisitDetails(controlNumberGuid, controlNumber, CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
            //    //        model.LstUsers = new List<UserViewModel>();
            //    //    }
            //    //    catch (Exception e)
            //    //    {
            //    //        Console.WriteLine(e);
            //    //        throw;
            //    //    }

            //    //    if (controlNumberGuid.HasValue)
            //    //    {
            //    //        ViewBag.ShowControlNumberSearch = false;
            //    //        return View("~/Views/VisitProcessing/ScheduleVisit.cshtml", model);
            //    //    }
            //    //    return PartialView("~/Views/VisitProcessing/_ControlNumberDetails.cshtml", model);
            //    //}

            //}
            //catch (Exception ex)
            //{
            //    // Console.log(ex.StackTrace);
            //}
            //return View();

        }

        public ActionResult ScheduleVisitDetails(Guid? controlNumberGuid, string controlNumber)
        {
            ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();
            //controlNumberGuid == null ? Guid.Empty : (object)controlNumberGuid;
            if ((!controlNumberGuid.HasValue) && (string.IsNullOrEmpty(controlNumber)))
            {
                model.ControlNumberDetails = new ControlNumberViewModel();
                model.LstUsers = new List<UserViewModel>();

            }
            else
            {
                try
                {
                    model = objBusinessModel.GetVisitDetails(controlNumberGuid, controlNumber, CurrentUser.UserId, CurrentUser.SiteId, _controlNumberService);
                    model.LstUsers = new List<UserViewModel>();
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                    throw;
                }

                if (controlNumberGuid.HasValue)
                {
                    ViewBag.ShowControlNumberSearch = false;
                    return View("~/Views/Operations/ScheduleVisitDetails.cshtml", model);
                }
                return PartialView("~/Views/Operations/_ControlNumberDetails.cshtml", model);
            }
            return View("~/Views/Operations/ScheduleVisitDetails.cshtml", model);
        }
    }
}