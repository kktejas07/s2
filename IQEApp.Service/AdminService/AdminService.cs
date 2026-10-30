using Dapper;
using IQEApp.Domain.AdminDomain;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace IQEApp.Service.AdminService
{
    public interface IAdminService
    {
        IEnumerable<AdminDomainModel> GetAllCounts(int siteId);
    }

    public class AdminService : IAdminService
    {
        private SqlConnection _con;
        private void Connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(constring);
        }
        public IEnumerable<AdminDomainModel> GetAllCounts(int siteId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            return _con.Query<AdminDomainModel>("GetAllCounts", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
    }
}
