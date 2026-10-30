using AutoMapper;
using IQEApp.Domain.DebtorDomain;
using IQEApp.Service.DebtorService;
using IQEApp.Web.Models.CommonModels;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace IQEApp.Web.Models.DebtorModel
{
    public class DebtorViewModel
    {
        public int ClientId { get; set; }

        [Required]
        [DisplayName("Customer Name")]
        [StringLength(80, ErrorMessage = "Enter Less than 80 characters")]
        public string ClientName { get; set; }
        [DisplayName("Unit Name")]
        public string ClientUnitName { get; set; }

        public Guid ClientGuid { get; set; }
        //    public ClientUnitsViewModel ClientUnit { get; set; }
        //   public List<ClientUnitsViewModel> LstClientUnits { get; set; }
        public double TotalDue { get; set; }

        public double TotalDebt { get; set; }

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
    public class DebtorDetailsModel : DebtorViewModel
    {
        public List<CommonModel.IndustryTypeModel> LstIndustryTypes { get; set; }
    }
    public class DebtorBusinessModel
    {
        public List<DebtorViewModel> lstDebtorViewModel { get; set; }
        //    public List<ClientUnitsViewModel> lstClientUnitsViewModel { get; set; }
        public List<DebtorViewModel> GetAllClientDetails(int siteId, string strSearch, string alphaChar, int offsetIndex, int fetchCount, bool activeStatus, string sortingOrder, IDebtorsService debtorsService)
        {
            var clientDetails = debtorsService.GetAllClientDetails(siteId, strSearch, alphaChar, offsetIndex, fetchCount, activeStatus, sortingOrder);
            Mapper.CreateMap<DebtorDomainModel, DebtorViewModel>();
            lstDebtorViewModel = clientDetails.Select(Mapper.Map<DebtorDomainModel, DebtorViewModel>).ToList();
            return lstDebtorViewModel;
        }

        public List<DebtorViewModel> GetDebtorDetails(IDebtorsService debtorsService)
        {
            var debtors = debtorsService.GetDebtorDetails();
            Mapper.CreateMap<DebtorDomainModel, DebtorViewModel>();
            lstDebtorViewModel = debtors.Select(Mapper.Map<DebtorDomainModel, DebtorViewModel>).ToList();
            return lstDebtorViewModel;
        }
    }
}