using IQEApp.Domain.CommonDomain;

namespace IQEApp.Domain.MasterDomain
{
    public class MasterDomainModel : BaseDomainModel
    {
        public int MasterId { get; set; }
        public string MasterName { get; set; }
        public int SectionId { get; set; }
        public string DisplayText { get; set; }
        public bool MasterStatus { get; set; }
    }
}
