using IQEApp.Service.MasterService;
using IQEApp.Service.PaymentService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.MasteModel;
using IQEApp.Web.Models.PaymentModel;
using System;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Payment
{
    //[CustomAuthorize(Roles = "Super Admin Role, Finance Role")]
    public class PaymentController : BaseController
    {
        private readonly PaymentService _paymentService;
        private readonly MasterService _masterService;
        PaymentBusinessModel objPaymentBusinessModel = new PaymentBusinessModel();
        public PaymentController()
        {
            _paymentService = new PaymentService();
            _masterService = new MasterService();
        }
        // GET: /Payment/
        public ActionResult Index(int invoiceId)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.MenuFinance, CurrentUser.RoleId.FirstOrDefault())) // if user has invoice permission then only payments can be performed, so we have give invoice security
            {
                PaymentDetailsViewModel objPaymentDetailsViewModel = new PaymentDetailsViewModel();
                objPaymentDetailsViewModel = objPaymentBusinessModel.GetPaymentDetailsAgainstInvoice(invoiceId, CurrentUser.SiteId, _paymentService);
                objPaymentDetailsViewModel.InvoiceId = invoiceId;
                objPaymentDetailsViewModel.SiteId = CurrentUser.SiteId;
                TempData["InvoiceTotalAmount"] = objPaymentDetailsViewModel.LstInvoiceViewModel.Select(x => x.TotalAmount);
                ViewBag.Total = objPaymentDetailsViewModel.LstPaymentViewModel.Sum(x => x.Amount);
                return View("PaymentDetails", objPaymentDetailsViewModel);
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        public ActionResult AddPayment(int invoiceId)
        {
            PaymentDetailsViewModel objPaymentDetailsViewModel = new PaymentDetailsViewModel();
            MasterBusinessModel objMasterBusinessModel = new MasterBusinessModel();
            objMasterBusinessModel.GetMastersDetails(CurrentUser.SiteId, 3, "Payment+Modes", true, _masterService);
            objPaymentDetailsViewModel.lstMasterViewModel = objMasterBusinessModel.lstMasterViewModel.ToList();
            objPaymentDetailsViewModel.SiteId = CurrentUser.SiteId;
            objPaymentDetailsViewModel.InvoiceId = invoiceId;
            //  ViewBag.Amount = amount;
            return PartialView("_AddPayment", objPaymentDetailsViewModel);
        }

        public ActionResult CreatePayment(PaymentDetailsViewModel objPaymentDetailsViewModel)
        {
            var isSuccess = false;
            string message = null;
            try
            {
                objPaymentDetailsViewModel.SiteId = CurrentUser.SiteId;
                objPaymentDetailsViewModel.LoginUserId = CurrentUser.UserId;
                objPaymentBusinessModel.CreatePayment(objPaymentDetailsViewModel, _paymentService);
                isSuccess = true;
                return Json(new { status = isSuccess, message = "Success" }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("CreateUser", ex);
            }
            return Json(new { status = isSuccess, message = "Add Payment Failed" }, JsonRequestBehavior.AllowGet);
        }
        //currently we are not using thins actionresult where as we are using the SP
        public ActionResult FetchPaymentDetails(int invoiceId)
        {
            PaymentDetailsViewModel objPaymentDetailsViewModel = new PaymentDetailsViewModel();
            objPaymentDetailsViewModel.LstPaymentViewModel = objPaymentBusinessModel.FetchPaymentDetails(invoiceId, CurrentUser.SiteId, _paymentService);
            objPaymentDetailsViewModel.InvoiceId = invoiceId;
            objPaymentDetailsViewModel.SiteId = CurrentUser.SiteId;
            ViewBag.Total = objPaymentDetailsViewModel.LstPaymentViewModel.Sum(x => x.Amount);
            return View("_paymentsList", objPaymentDetailsViewModel.LstPaymentViewModel);
        }
    }
}