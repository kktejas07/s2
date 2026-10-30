using System;

namespace IQEApp.Domain.LoginDomain
{
    public class LoginDomainModel
    {
        public int UserId { get; set; }
        public short SiteId { get; set; }
        public string EmailId { get; set; }
        public string LoginName { get; set; }
        public string LoginPassword { get; set; }
        public string ValidationMsg { get; set; }
        public Guid UserGuid { get; set; }
        public bool IsUserActive { get; set; }
        public int RoleId { get; set; }
        public string UserFullName { get; set; }
        public bool IsRoleActive { get; set; }
    }
}
