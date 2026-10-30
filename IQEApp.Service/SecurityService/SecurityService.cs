using Dapper;
using DocumentFormat.OpenXml.Drawing.Spreadsheet;
using IQEApp.Domain.SecurityDomain;
using MoreLinq;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.SecurityService
{
    public interface ISecurityService
    {
        IEnumerable<SecurityDomainModel> FetchScreenFeatureMapping();
        IEnumerable<SecurityDomainModel> FetchScreenFeatureMapping1(int? parentNode);
        IEnumerable<SecurityDomainModel> FetchScreenFeatureMappingByRoleId(int RoleId);
        void SaveRoleFeatureMapping(int RoleId, string ScnFeatId);

      //  DataTable PopulateMenuDataTable();
    }

    public class SecurityService : ISecurityService
    {
        private SqlConnection con;
        private SqlDataAdapter da;
        private DataTable dt;
        private void connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            con = new SqlConnection(constring);
        }
        public IEnumerable<SecurityDomainModel> FetchScreenFeatureMapping()
        {
            connection();
            return con.Query<SecurityDomainModel>("FetchScreenFeatureMapping2", null, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<SecurityDomainModel> FetchScreenFeatureMapping1(int? parentNode)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@parentNode", parentNode);
            return con.Query<SecurityDomainModel>("FetchScreenFeatureMapping1", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        //public DataTable PopulateMenuDataTable()
        //{
        //    DataTable DOM ;

        //    //string sql = @"SELECT MenuID, ParentMenuID, MenuName, NavUrL  FROM SiteMenu";
            
        //    //con.Open();

        //    //da = new SqlDataAdapter(sql, con);
        //    //da.SelectCommand.CommandTimeout = 10000;

        //    //dt = new DataTable();
        //    //da.Fill(dt);

        //    //if (con.State == ConnectionState.Open)
        //    //{
        //    //    con.Close();
        //    //}
        //    //con.Dispose();

        //    int parentNode = 1;
        //    connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@parentNode", parentNode);
        //    DOM = con.Query<SecurityDomainModel>("FetchScreenFeatureMapping2", parameter, null, true, 0, commandType: CommandType.StoredProcedure).ToDataTable();

        //    //DOM = GetDOMTreeView(dt);

        //    return DOM;
        //}
       
        public IEnumerable<SecurityDomainModel> FetchScreenFeatureMappingByRoleId(int RoleId)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@RoleId", RoleId);
            return con.Query<SecurityDomainModel>("FetchScreenFeatureMappingByRoleId2", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public void SaveRoleFeatureMapping(int RoleId, string ScnFeatId)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@RoleId", RoleId);
            parameter.Add("@ScnFeatId", ScnFeatId);
            con.Query("SaveRoleFeatureMapping1", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
    }
}
