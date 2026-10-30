using IQEApp.Domain.CommonDomain;

namespace IQEApp.Domain.SecurityDomain
{
    public class SecurityDomainModel : BaseDomainModel
    {
        public int RoleId { get; set; }
        public int ScreenId { get; set; }
        public string ScreenName { get; set; }
        public int FeatureId { get; set; }
        public string FeatureName { get; set; }
        public int ScnFetMapId { get; set; }
        public bool Status { get; set; }

        public int ParentId { get; set; }
        public string ParentName { get; set; }
        public int ChildId { get; set; }
        public string ChildName { get; set; }

        //public int MenuNumber { get; set; }
        //public int ParentNumber { get; set; }
        //public string MenuName { get; set; }
        //public string Uri { get; set; }
        //public string Icon { get; set; }
    }
}
