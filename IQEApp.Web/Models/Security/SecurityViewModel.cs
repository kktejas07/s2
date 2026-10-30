using AutoMapper;
using IQEApp.Domain.MasterDomain;
using IQEApp.Domain.SecurityDomain;
using IQEApp.Service.MasterService;
using IQEApp.Service.SecurityService;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.MasteModel;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Linq;

namespace IQEApp.Web.Models.Security
{
    public class SecurityViewModel : BaseViewModel
    {
        [Display(Name = "Role Name")]
        [Required(ErrorMessage = "This field required")]
        public int RoleId { get; set; }
        public int ScreenId { get; set; }
        public string ScreenName { get; set; }
        public int FeatureId { get; set; }
        public string FeatureName { get; set; }
        public int ScnFetMapId { get; set; }
        public bool Status { get; set; }
        public bool IsSelected { get; set; }

        public int ParentId { get; set; }
        public string ParentName { get; set; }
        public int? ChildId { get; set; }
        public string ChildName { get; set; }

        //public int MenuNumber { get; set; }
        //public int ParentNumber { get; set; }
        //public string MenuName { get; set; }
        //public string Uri { get; set; }
        //public string Icon { get; set; }
    }
    //public class TreeViewNode
    //{
    //    public string id { get; set; }
    //    public string parent { get; set; }
    //    public string text { get; set; }
    //}

    public class SecurityDetails : SecurityViewModel
    {

        public List<SecurityViewModel> LstSecurityViewModels { get; set; }
        public List<MasterViewModel> LstRoleList { get; set; }
    }
    public class SecurityBusinessModel
    {
        public SecurityDetails FetchRoleDetails(int siteId, IMasterService _masterService)
        {
            SecurityDetails objSecDet = new SecurityDetails();
            var roleDetails = _masterService.GetMastersDetails(siteId, 1, true); // sectionId is 1, in mstSection roles values is 1.  Status = true
            Mapper.CreateMap<MasterDomainModel, MasterViewModel>();
            objSecDet.LstRoleList = roleDetails.Select(Mapper.Map<MasterDomainModel, MasterViewModel>).ToList();
            return objSecDet;
        }

        public SecurityDetails FetchRoleBasedScreenFeatureMapping1(int RoleId, ISecurityService _securityService)
        {
            SecurityDetails objSecDet = new SecurityDetails();
            //Fetch all screen feature mappings
            // var secDetails = _securityService.FetchScreenFeatureMapping();
            
            var secDetails = _securityService.FetchScreenFeatureMapping1(1);
            Mapper.CreateMap<SecurityDomainModel, SecurityViewModel>();
            objSecDet.LstSecurityViewModels = secDetails.Select(Mapper.Map<SecurityDomainModel, SecurityViewModel>).ToList();
            //Fetch assigned screen feature mappings based on Role
            var roleSecDetails = _securityService.FetchScreenFeatureMappingByRoleId(RoleId);

            foreach (var itmAllSFM in objSecDet.LstSecurityViewModels)
            {
                foreach (var itmRoleSFM in roleSecDetails)
                {
                        if (itmRoleSFM.ScnFetMapId == itmAllSFM.ScnFetMapId)
                        {
                            itmAllSFM.IsSelected = true;
                        }
                }
            }

            return objSecDet;
        }

        public SecurityDetails FetchRoleBasedScreenFeatureMapping(int RoleId, int? ParentNode, ISecurityService _securityService)
        {
            SecurityDetails objSecDet = new SecurityDetails();
            //Fetch all screen feature mappings
            // var secDetails = _securityService.FetchScreenFeatureMapping();
            var secDetails = _securityService.FetchScreenFeatureMapping1(ParentNode);
            Mapper.CreateMap<SecurityDomainModel, SecurityViewModel>();
            objSecDet.LstSecurityViewModels = secDetails.Select(Mapper.Map<SecurityDomainModel, SecurityViewModel>).ToList();
            //Fetch assigned screen feature mappings based on Role
            var roleSecDetails = _securityService.FetchScreenFeatureMappingByRoleId(RoleId);

            foreach (var itmAllSFM in objSecDet.LstSecurityViewModels)
            {
                foreach (var itmRoleSFM in roleSecDetails)
                {
                    if (ParentNode >= 8 && ParentNode <= 83)
                    {
                        if (itmRoleSFM.ScnFetMapId == itmAllSFM.FeatureId)
                        {
                            itmAllSFM.IsSelected = true;
                        }
                    }

                    else
                    {
                        if (itmRoleSFM.ScnFetMapId == itmAllSFM.ScnFetMapId)
                        {
                            itmAllSFM.IsSelected = true;
                        }
                    }
                }
            }

            return objSecDet;
        }
        public List<SecurityViewModel> FetchRoleBasedScreenFeatureMappingByRoleId(int RoleId, ISecurityService _securityService)
        {
            List<SecurityViewModel> LstSecFetMapId = new List<SecurityViewModel>();
            //Fetch assigned screen feature mappings based on Role
            var roleSecDetails = _securityService.FetchScreenFeatureMappingByRoleId(RoleId);
            Mapper.CreateMap<SecurityDomainModel, SecurityViewModel>();
            LstSecFetMapId = roleSecDetails.Select(Mapper.Map<SecurityDomainModel, SecurityViewModel>).ToList();
            return LstSecFetMapId;
        }

    }
}