using Dapper;
using IQEApp.Domain.CommonDomain;
using IQEApp.Domain.ServiceOrderDomain;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.CommonService
{
    public interface ICommonDetailService
    {
        DataSet ViewCommonDetails(Guid visitGuid, Guid controlNumberGuid, int serviceOrderId, int LoggedInUser);
        DataSet LoadCommonDetailsForViewVisit(Guid visitGuid, Guid controlNumberGuid, int serviceOrderId, int LoggedInUser);
        List<CommonDomainModel.StateDomainModel> GetStateListByCountryId(int countryId);
        List<ServiceOrderDomainModel> GetServiceOrderDetailsByClientDetails(int clientId, int clientUnitId);
        DataSet GetPODetailsForScheduleVisit(int manufacturerUnitId, int ServiceOrderId);

     //   DataSet GetPONumbersForScheduleVisit(int ControlNo, int manufacturerId);
    }

    public class CommonDetailService : ICommonDetailService
    {
        #region DbConnection

        private SqlConnection _con;
        string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();

        private void Connection()
        {

            _con = new SqlConnection(constring);
        }

        #endregion

        public DataSet ViewCommonDetails(Guid visitGuid, Guid controlNumberGuid, int serviceOrderId, int LoggedInUser)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("ViewCommonDetails", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@VisitGuid", visitGuid);
            cmd.Parameters.AddWithValue("@controlNumberGuid", controlNumberGuid);
            cmd.Parameters.AddWithValue("@ServiceOrderId", serviceOrderId);
            cmd.Parameters.AddWithValue("@LoggedInUser", LoggedInUser);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public DataSet LoadCommonDetailsForViewVisit(Guid visitGuid, Guid controlNumberGuid, int serviceOrderId, int LoggedInUser)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("LoadCommonDetailsForViewVisit", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@VisitGuid", visitGuid);
            cmd.Parameters.AddWithValue("@controlNumberGuid", controlNumberGuid);
            cmd.Parameters.AddWithValue("@ServiceOrderId", serviceOrderId);
            cmd.Parameters.AddWithValue("@LoggedInUser", LoggedInUser);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public List<CommonDomainModel.StateDomainModel> GetStateListByCountryId(int countryId)
        {

            Connection();
            var parameters = new DynamicParameters();
            parameters.Add("@CountryId", countryId);
            return _con.Query<CommonDomainModel.StateDomainModel>("GetStateDetailsByCountryId", parameters, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }

        public List<ServiceOrderDomainModel> GetServiceOrderDetailsByClientDetails(int clientId, int clientUnitId)
        {
            Connection();
            var parameters = new DynamicParameters();
            parameters.Add("@ClientId", clientId);
            parameters.Add("@ClientUnitId", clientUnitId);
            return _con.Query<ServiceOrderDomainModel>("GetServiceOrderDetailsByClientDetails", parameters, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }

        public DataSet GetPODetailsForScheduleVisit(int manufacturerUnitId, int serviceOrderId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetPurchaseOrdersForVisitScheduling", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ManufacturerUnitId", manufacturerUnitId);
            cmd.Parameters.AddWithValue("@ServiceOrderId", serviceOrderId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }


        //public DataSet GetPONumbersForScheduleVisit(int ControlNo, int manufacturerId)
        //{
        //    SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
        //    SqlCommand cmd = new SqlCommand();
        //    SqlDataAdapter da = new SqlDataAdapter();
        //    DataSet ds = new DataSet();
        //    cmd = new SqlCommand("GetPONumbersForScheduleVisit", con);
        //  //  cmd = new SqlCommand("GetPurchaseOrdersForVisitScheduling1", con);
        //    cmd.CommandType = CommandType.StoredProcedure;
        //    //if you have parameters.
        //    cmd.Parameters.AddWithValue("@ManufacturerId", manufacturerId);
        //    cmd.Parameters.AddWithValue("@ControlNo", ControlNo);
        //    da = new SqlDataAdapter(cmd);
        //    da.Fill(ds);
        //    return ds;
        //}
    }
}
