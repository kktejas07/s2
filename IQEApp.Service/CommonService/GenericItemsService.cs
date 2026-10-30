using System.Data.SqlClient;

namespace IQEApp.Service.CommonService
{
    public interface IGenericItemsService
    {
        //IEnumerable<luGenderDomain> LuGenderGet(short? id);
        //IEnumerable<luEmailCampaignDomain> LuEmailCampaignGet();
        //IEnumerable<luProfileTypeDomain> LuProfileTypeGet();
        void RolesGet();
        //IEnumerable<luUserRegSecurityDomain> UserRegSecurityDomainGet();
        //IEnumerable<HeaderFooterDomain> HeaderGet(int? siteId);
        //IEnumerable<SiteProfileSectionDomain> SiteProfileSectionsGet(int? siteId);
        //IEnumerable<ProfileSectionHelpDomain> ProfileSectionHelpGet();
        //IEnumerable<SiteDomain> SiteGet();
        int ErrorLogI(int errorID, string objectName, string dBName, string details, byte logType);
    }

    public class GenericItemsService : IGenericItemsService
    {

        public int ErrorLogI(int errorID, string objectName, string dBName, string details, byte logType)
        {

            var pErrorID = new SqlParameter("@ErrorID", errorID);
            var pObjectName = new SqlParameter("@ObjectName", objectName);
            var pDBName = new SqlParameter("@DBName", dBName);
            var pDetails = new SqlParameter("@Details", details);
            var pLogType = new SqlParameter("@LogType", logType);
            return 1;
        }

        public void RolesGet()
        {

        }
    }
}
