using AutoMapper;
using IQEApp.Domain.AdminDomain;
using IQEApp.Service.AdminService;
using IQEApp.Web.Models.CommonModels;
using System.Collections.Generic;
using System.Linq;

namespace IQEApp.Web.Models.AdminModel
{
    public class AdminViewModel : BaseViewModel
    {
        public string Name { get; set; }
        public int TotalCount { get; set; }
    }

    public class AdminBusinessModel
    {
        public List<AdminViewModel> LstAdminViewModel { get; set; }
        public List<AdminViewModel> GetAllCounts(int siteId, IAdminService adminService)
        {
            var clientDetails = adminService.GetAllCounts(siteId);
            Mapper.CreateMap<AdminDomainModel, AdminViewModel>();
            LstAdminViewModel = clientDetails.Select(Mapper.Map<AdminDomainModel, AdminViewModel>).ToList();
            return LstAdminViewModel;
        }
    }
}