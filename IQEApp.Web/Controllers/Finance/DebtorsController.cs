using IQEApp.Service.ClientService;
using IQEApp.Service.DebtorService;
using IQEApp.Service.SecurityService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.DebtorModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Finance
{
    public class DebtorsController : BaseController
    {
        private readonly IDebtorsService _debtorService;
        private readonly IClientService _clientService;
        private readonly ISecurityService _securityService;

        DebtorBusinessModel objDebtorBusinessModel = new DebtorBusinessModel();
        ClientBusinessModel objClientBusinessModel = new ClientBusinessModel();
        public DebtorsController()
        {
            _clientService = new ClientService();
            _debtorService = new DebtorService();
            _securityService = new SecurityService();
            //SingletonScreenFeatureMapping.SetScreenFeatureMapping(CurrentUser.RoleId.FirstOrDefault(), _securityService);
        }
        // GET: Debtors
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.MenuFinance, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<DebtorViewModel> lst = new List<DebtorViewModel>();
                try
                {
                    lst = objDebtorBusinessModel.GetAllClientDetails(CurrentUser.SiteId, "", "", 0, 10, true, "ASC", _debtorService);
                    // ViewBag.Total = lst.FirstOrDefault().Total;
                    ViewBag.CurrentPageCount = 10;
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("Add Client", ex);
                }
                return View("Index", lst);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        public ActionResult GetDebtorsDetails(int pageCount = 0)
        {
            List<DebtorViewModel> model = new List<DebtorViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            try
            {
                model = objDebtorBusinessModel.GetDebtorDetails(_debtorService);
            }
            catch (Exception ex)
            {
                // errorLogObj.LogError("Error occured while fetching client units by clientId: ");
            }

            return PartialView("_DebtorsList", model);

        }
    }
}