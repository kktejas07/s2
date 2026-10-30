using Dapper;
using IQEApp.Domain.ReportDomain;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.ReportService
{
    public interface IReportService
    {
        DataSet GetVisitFiltersData();
        IEnumerable<RptVisitDomainModel> GetVisitDetailsForReport(ReportFiltersDomainModel model);
        IEnumerable<RptVisitExpensesDomainModel> GetVisitExpensesForReport(ReportFiltersDomainModel model);
    }

    public class ReportService : IReportService
    {
        #region DBConnection
        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }
        #endregion

        public DataSet GetVisitFiltersData()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetVisitFiltersData", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public IEnumerable<RptVisitDomainModel> GetVisitDetailsForReport(ReportFiltersDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientId", model.ClientId);
            parameter.Add("@UserId", model.EngineerId);
            parameter.Add("@FromDate", model.FromDate);
            parameter.Add("@ToDate", model.ToDate);
            parameter.Add("@VisitStatus", model.Status);
            return _con.Query<RptVisitDomainModel>("GetVisitsForReport", parameter, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }

        public IEnumerable<RptVisitExpensesDomainModel> GetVisitExpensesForReport(ReportFiltersDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@FromDate", model.FromDate);
            parameter.Add("@ToDate", model.ToDate);
            return _con.Query<RptVisitExpensesDomainModel>("GetVisitsExpensesForReport", parameter, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }
    }
}
