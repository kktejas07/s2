using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
//using System.Security.Principal;

namespace IQEApp.Web.Models.CommonModels
{
    public class CustomPrincipalModel
    {
        public string UserPrefixTitle { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string UserFullName { get; set; }
        public string EmailId { get; set; }
        public string LoginName { get; set; }
        public int UserId { get; set; }
        public int SiteId { get; set; }
        public Guid UserGuid { get; set; }
        public string SiteName { get; set; }
        public string SiteLogo { get; set; }
        public List<string> UserRoles { get; set; }
        public List<int> RoleId { get; set; }
        //  public List<int> LstRoleId { get; set; }
        public string ProfileImageLink { get; set; }
        public bool IsAdmin
        {
            get
            {
                return (RoleId.Contains((int)IQEApp.Web.Models.CommonModels.UserRoles.SuperAdmin) ||
                        RoleId.Contains((int)IQEApp.Web.Models.CommonModels.UserRoles.Admin));
            }
        }
    }
    public class CustomPrincipal : IPrincipal
    {
        public IIdentity Identity { get; private set; }
        public bool IsInRole(string role)
        {
            return UserRoles.Any(userRole => userRole.Equals(role, StringComparison.CurrentCultureIgnoreCase));
        }

        public bool IsInRole(int roleId)
        {
            try
            {
                return RoleId.Contains(roleId);
            }
            catch (Exception)
            {
                return false;
            }
        }

        public CustomPrincipal()
        {
            UserViewModuleType = UserViewModuleType.None;
        }

        public CustomPrincipal(string loginName)
        {
            Identity = new GenericIdentity(loginName);
            UserViewModuleType = UserViewModuleType.None;
        }

        public string UserPrefixTitle { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string UserFullName { get; set; }
        public List<string> UserRoles { get; set; }
        public List<int> RoleId { get; set; }
        // public List<int> LstRoleId { get; set; }
        public UserViewModuleType UserViewModuleType { get; private set; }
        public int UserId { get; set; }
        public string EmailId { get; set; }
        public string LoginName { get; set; }
        public int SiteId { get; set; }
        public Guid UserGuid { get; set; }
        public string SiteName { get; set; }
        public bool RememberMe { get; set; }
        public string ProfileImageLink { get; set; }
        public bool IsAdmin
        {
            get
            {
                if (RoleId != null)
                    return (RoleId.Contains((int)CommonModels.UserRoles.SuperAdmin) || RoleId.Contains((int)CommonModels.UserRoles.Admin));
                else
                    return false;
            }
        }
        public void SetUserViewModuleType(UserViewModuleType type)
        {
            UserViewModuleType = type;
        }
        public UserViewModuleType GetUserViewModuleType()
        {
            return UserViewModuleType;
        }

        public bool CanShowSubMenu()
        {
            return !(UserViewModuleType == UserViewModuleType.Administrator ||
                     //UserViewModuleType == UserViewModuleType.SecurityGroups ||
                     UserViewModuleType == UserViewModuleType.None);
        }
        //public string Encode64(string data)
        // {
        //     try
        //     {
        //         byte[] encData_byte = new byte[data.Length];
        //         encData_byte = System.Text.Encoding.UTF8.GetBytes(data);
        //         string encodedData = Convert.ToBase64String(encData_byte);
        //         return encodedData;
        //     }
        //     catch (Exception e)
        //     {
        //         throw new Exception("Error in base64Encode" + e.Message);
        //     }
        // }

        // public string Decode64(string sData)
        // {
        //     //return Encoding.UTF8.GetString(Convert.FromBase64String(sData));

        //     // byte[] b = Convert.FromBase64String(sData);

        //     //string  strOriginal = System.Text.Encoding.UTF8.GetString(b);
        //     //return strOriginal;

        //     System.Text.UTF8Encoding encoder = new System.Text.UTF8Encoding();
        //     System.Text.Decoder utf8Decode = encoder.GetDecoder();
        //     string str = null;
        //     int val = sData.Length;
        //     int rem = val % 4;
        //     if (rem > 0)
        //         str = appendVal((4 - rem), sData);
        //     else
        //         str = sData;
        //     byte[] b = Convert.FromBase64String(str);
        //     string strOriginal = System.Text.Encoding.UTF8.GetString(b);
        //     return strOriginal;
        // }
        // public string appendVal(int count, string srcVal)
        // {
        //     //   StringBuilder strBld = new StringBuilder();
        //     for (int i = 0; i < count; i++)
        //     {
        //         srcVal = srcVal + "=";
        //     }
        //     return srcVal;
        // }

    }

    public enum UserViewModuleType
    {
        Home,
        Administrator,
        Employee,
        None
    }

    public enum UserRoles
    {
        SuperAdmin = 1,
        Admin = 2,
        EmployeeRole = 3,
        CoordinatorRole = 4,
        QualityCheckRole = 5,
        FinanceRole = 6,
    }

}