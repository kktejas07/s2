using AutoMapper;
using IQEApp.Domain.MasterDomain;
using IQEApp.Service.MasterService;
using IQEApp.Web.Models.CommonModels;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace IQEApp.Web.Models.MasteModel
{
    public class MasterViewModel : BaseViewModel
    {
        public int MasterId { get; set; }
        [Display(Name = "Name")]
        [StringLength(100, ErrorMessage = "Enter Less than 100 characters")]
        [Required(ErrorMessage = "This field required")]
        public string MasterName { get; set; }
        public int SectionId { get; set; }
        public int counter { get; set; }
        public string DisplayText { get; set; }
        public bool MasterStatus { get; set; }
    }


    public class MasterBusinessModel
    {
        // public string DisplayText { get; set; }
        public List<MasterViewModel> lstMasterViewModel { get; set; }
        public MasterViewModel objMasterViewModel { get; set; }
        public void GetMastersDetails(int siteId, int sectionId, string sectionName, bool status, IMasterService _masterService)
        {
            MasterViewModel objMstVM = new MasterViewModel();
            var masterDetails = _masterService.GetMastersDetails(siteId, sectionId, status);
            Mapper.CreateMap<MasterDomainModel, MasterViewModel>();
            lstMasterViewModel = masterDetails.Select(Mapper.Map<MasterDomainModel, MasterViewModel>).ToList();
            // Roles are not given in master since they have security, while loading pages
            objMstVM.DisplayText = sectionName;
            objMstVM.SectionId = sectionId;
            objMstVM.SiteId = siteId;
            objMasterViewModel = objMstVM;
        }

        public bool IsMasterRecordExitsAlready(int siteId, int sectionId, int masterId, string masterName, IMasterService _masterService)
        {
            var retStatus = _masterService.IsMasterRecordExitsAlready(sectionId, siteId, masterId, masterName);
            return retStatus;
        }
        public void CreateMaster(MasterViewModel objUserViewModel, IMasterService _masterService)
        {
            Mapper.CreateMap<MasterViewModel, MasterDomainModel>();
            MasterDomainModel objMasterDomainModel = Mapper.Map<MasterViewModel, MasterDomainModel>(objUserViewModel);
            _masterService.CreateMaster(objMasterDomainModel);
        }

        public MasterViewModel GetMasterDetailsById(int siteId, int sectionId, int masterId, string sectionName, IMasterService _masterService)
        {
            var mstDetails = _masterService.GetMasterDetailsById(siteId, sectionId, masterId);
            Mapper.CreateMap<MasterDomainModel, MasterViewModel>();
            objMasterViewModel = mstDetails.Select(Mapper.Map<MasterDomainModel, MasterViewModel>).ToList().FirstOrDefault();
            objMasterViewModel.DisplayText = sectionName;
            objMasterViewModel.SectionId = sectionId;
            objMasterViewModel.SiteId = siteId;
            return objMasterViewModel;
        }
        public void UpdateMaster(MasterViewModel objUserViewModel, IMasterService _masterService)
        {
            Mapper.CreateMap<MasterViewModel, MasterDomainModel>();
            MasterDomainModel objMasterDomainModel = Mapper.Map<MasterViewModel, MasterDomainModel>(objUserViewModel);
            _masterService.UpdateMaster(objMasterDomainModel);
        }
    }

    //values refer to mstSection table
    public enum MasterDataType
    {
        Roles=1,
        Designations = 2,
        PaymentModes = 3,
        SkillSets = 8,
        IndustryTypes = 9,
        DocumentType = 13
    }
}