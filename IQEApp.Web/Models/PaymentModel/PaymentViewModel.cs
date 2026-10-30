using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.PaymentDomain;
using IQEApp.Service.PaymentService;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.InvoiceModel;
using IQEApp.Web.Models.MasteModel;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace IQEApp.Web.Models.PaymentModel
{
    public class PaymentViewModel : BaseViewModel
    {
        public int PaymentId { get; set; }
        public int InvoiceId { get; set; }
        [Required]
        [Display(Name = "Payment Mode")]
        public int PaymentModeId { get; set; }
        public string PaymentModeName { get; set; }
        [Display(Name = "Receipt Number")]
        public string ReceiptNumber { get; set; }
        [Required]
        [Display(Name = "Payment Date")]
        public DateTime PaymentDate { get; set; }
        [Display(Name = "Payment Comments")]
        public string PaymentComments { get; set; }
        [Display(Name = "Challan Number")]
        public string ChallanNumber { get; set; }

        [Required]
        [Display(Name = "Amount")]
        public decimal? Amount { get; set; }

        [Display(Name = "Credit Note")]
        public bool IsCreditNote { get; set; }

        //Hari
        [Required]
        [Display(Name = "TDS")]
        public decimal? TDS { get; set; }
        public decimal? TDSPercent { get; set; }

        [Display(Name = "Balance")]
        public decimal? Balance { get; set; }



    }

    public class PaymentDetailsViewModel : PaymentViewModel
    {
        public List<InvoiceViewModel> LstInvoiceViewModel { get; set; }
        public List<MasterViewModel> lstMasterViewModel { get; set; }
        public List<PaymentViewModel> LstPaymentViewModel { get; set; }
    }
    public class PaymentBusinessModel
    {
        public List<PaymentViewModel> LstPaymentListViewModel { get; set; }
        public PaymentDetailsViewModel GetPaymentDetailsAgainstInvoice(int InvoiceId, int SiteId, IPaymentService _paymentService)
        {
            var paymentDetails = _paymentService.GetPaymentDetailsAgainstInvoice(InvoiceId, SiteId);
            PaymentDetailsViewModel objPaymentDetailsViewModel = new PaymentDetailsViewModel();
            objPaymentDetailsViewModel.LstInvoiceViewModel = paymentDetails.Tables[0].DataTableToList<InvoiceViewModel>();
            objPaymentDetailsViewModel.LstPaymentViewModel = paymentDetails.Tables[1].DataTableToList<PaymentViewModel>();
            return objPaymentDetailsViewModel;
        }

        public void CreatePayment(PaymentDetailsViewModel objPaymentDetailsViewMode, IPaymentService _paymentService)
        {
            Mapper.CreateMap<PaymentDetailsViewModel, PaymentDomainModel>();
            PaymentDomainModel objPaymentDomainModel = Mapper.Map<PaymentDetailsViewModel, PaymentDomainModel>(objPaymentDetailsViewMode);
            _paymentService.CreatePayment(objPaymentDomainModel);
        }
        public List<PaymentViewModel> FetchPaymentDetails(int InvoiceId, int SiteId, IPaymentService _paymentService)
        {
            var paymentDetails = _paymentService.FetchPaymentDetails(InvoiceId, SiteId);
            Mapper.CreateMap<PaymentDomainModel, PaymentViewModel>();
            LstPaymentListViewModel = paymentDetails.Select(Mapper.Map<PaymentDomainModel, PaymentViewModel>).ToList();
            return LstPaymentListViewModel;
        }
    }
}