using Dapper;
using IQEApp.Domain.CreditorDomain;
//using IQEApp.Service.CreditorService;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IQEApp.Service.CreditorService
{

    public interface ICreditorService
    {
        IEnumerable<CreditorDomainModel> GetAllClientDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder);
        IEnumerable<CreditorDomainModel> GetCreditorDetails();
    }

    public class CreditorService : ICreditorService
    {
        private SqlConnection _con;
        private void Connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(constring);
        }
        public IEnumerable<CreditorDomainModel> GetAllClientDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@strSearch", strSearch);
            parameter.Add("@alphaChar", alphaChar);
            parameter.Add("@Offset", offset);
            parameter.Add("@Fetch", fetch);
            parameter.Add("@ActvieStatus", activeStatus);
            parameter.Add("@SortingOrder", sortingOrder);
            return _con.Query<CreditorDomainModel>("GetAllClientDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public IEnumerable<CreditorDomainModel> GetCreditorDetails()
        {
            Connection();
            var parameter = new DynamicParameters();
            //parameter.Add("@ClientId", clientId);
            return _con.Query<CreditorDomainModel>("GetCreditorsList", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
    }
}
