using IQEApp.Domain.CommonDomain;

namespace IQEApp.Domain.AdminDomain
{
    public class AdminDomainModel : BaseDomainModel
    {
        public string Name { get; set; }
        public int TotalCount { get; set; }
    }
}
