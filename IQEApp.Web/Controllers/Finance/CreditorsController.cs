using IQEApp.Service.ClientService;
using IQEApp.Service.CreditorService;
using IQEApp.Service.SecurityService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.CreditorModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Finance
{
    public class CreditorsController : BaseController
    {
        private readonly ICreditorService _CreditorService;
        private readonly IClientService _clientService;
        private readonly ISecurityService _securityService;

        CreditorBusinessModel objCreditorBusinessModel = new CreditorBusinessModel();
        ClientBusinessModel objClientBusinessModel = new ClientBusinessModel();
        public CreditorsController()
        {
            _clientService = new ClientService();
            _CreditorService = new CreditorService();
            _securityService = new SecurityService();
            //SingletonScreenFeatureMapping.SetScreenFeatureMapping(CurrentUser.RoleId.FirstOrDefault(), _securityService);
        }
        // GET: Creditors
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.MenuFinance, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<CreditorViewModel> lst = new List<CreditorViewModel>();
                try
                {
                    lst = objCreditorBusinessModel.GetAllClientDetails(CurrentUser.SiteId, "", "", 0, 10, true, "ASC", _CreditorService);
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

        public ActionResult GetCreditorsDetails(int pageCount = 0)
        {
            List<CreditorViewModel> model = new List<CreditorViewModel>();
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            try
            {
                model = objCreditorBusinessModel.GetCreditorDetails(_CreditorService);
            }
            catch (Exception ex)
            {
                // errorLogObj.LogError("Error occured while fetching client units by clientId: ");
            }

            return PartialView("_CreditorsList", model);

        }
    }
}