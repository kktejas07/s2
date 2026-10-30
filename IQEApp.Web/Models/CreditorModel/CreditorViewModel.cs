using AutoMapper;
using IQEApp.Domain.CreditorDomain;
using IQEApp.Service.CreditorService;
using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using System.Linq;
using System.Web;

namespace IQEApp.Web.Models.CreditorModel
{
    public class CreditorViewModel
    {
        public int ClientId { get; set; }

        [Required]
        [DisplayName("Customer Name")]
        [StringLength(80, ErrorMessage = "Enter Less than 80 characters")]
        public string ClientName { get; set; }

        public string ClientUnitName { get; set; }

        public Guid ClientGuid { get; set; }
        //    public ClientUnitsViewModel ClientUnit { get; set; }
        //   public List<ClientUnitsViewModel> LstClientUnits { get; set; }
        public double TotalDue { get; set; }

        public double TotalCredit { get; set; }

        [DisplayName("0-30 Days")]
        public double Upto30 { get; set; }

        [DisplayName("31-60 Days")]
        public double Upto60 { get; set; }
        [DisplayName("61-90 Days")]
        public double Upto90 { get; set; }
        [DisplayName("91-180 Days")]
        public double Upto180 { get; set; }
        [DisplayName("181-365 Days")]
        public double Upto365 { get; set; }
        [DisplayName("1Year Above")]
        public double Above1Year { get; set; }

    }
    public class CreditorDetailsModel : CreditorViewModel
    {
        public List<CommonModel.IndustryTypeModel> LstIndustryTypes { get; set; }
    }
    public class CreditorBusinessModel
    {
        public List<CreditorViewModel> lstCreditorViewModel { get; set; }
        //    public List<ClientUnitsViewModel> lstClientUnitsViewModel { get; set; }
        public List<CreditorViewModel> GetAllClientDetails(int siteId, string strSearch, string alphaChar, int offsetIndex, int fetchCount, bool activeStatus, string sortingOrder, ICreditorService CreditorsService)
        {
            var clientDetails = CreditorsService.GetAllClientDetails(siteId, strSearch, alphaChar, offsetIndex, fetchCount, activeStatus, sortingOrder);
            Mapper.CreateMap<CreditorDomainModel, CreditorViewModel>();
            lstCreditorViewModel = clientDetails.Select(Mapper.Map<CreditorDomainModel, CreditorViewModel>).ToList();
            return lstCreditorViewModel;
        }

        public List<CreditorViewModel> GetCreditorDetails(ICreditorService CreditorService)
        {
            var Creditors = CreditorService.GetCreditorDetails();
            Mapper.CreateMap<CreditorDomainModel, CreditorViewModel>();
            lstCreditorViewModel = Creditors.Select(Mapper.Map<CreditorDomainModel, CreditorViewModel>).ToList();
            return lstCreditorViewModel;
        }
    }
}