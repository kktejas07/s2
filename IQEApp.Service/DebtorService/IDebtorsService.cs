using Dapper;
using IQEApp.Domain.DebtorDomain;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace IQEApp.Service.DebtorService
{
    public interface IDebtorsService
    {
        IEnumerable<DebtorDomainModel> GetAllClientDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder);
        IEnumerable<DebtorDomainModel> GetDebtorDetails();
    }

    public class DebtorService : IDebtorsService
    {
        private SqlConnection _con;
        private void Connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(constring);
        }
        public IEnumerable<DebtorDomainModel> GetAllClientDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
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
            return _con.Query<DebtorDomainModel>("GetAllClientDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public IEnumerable<DebtorDomainModel> GetDebtorDetails()
        {
            Connection();
            var parameter = new DynamicParameters();
            //parameter.Add("@ClientId", clientId);
            return _con.Query<DebtorDomainModel>("GetDebtorsList", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
    }
}
