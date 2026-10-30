using Dapper;
using IQEApp.Domain.ClientDomain;
using IQEApp.Domain.ControlNumberDomain;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.ClientService
{
    public interface IClientService
    {
        #region Client
        IEnumerable<ClientUnitsDomainModel> GetClientDetailsByControlNo1(string ControlNo, int SiteId, bool ActiveStatus);

        IEnumerable<ClientDomainModel> GetAllClientDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder);
        //IEnumerable<ClientDomainModel> GetClientSearchList(int siteId, string strSearch, int offset, int fetch);
        DataSet GetClientDetailsToAdd(int loginUserSiteId);
        bool IsClientAlreadyExists(ClientDomainModel objClientDomainModel);
        int CreateClient(ClientDomainModel objClientDomainModel);
        DataSet GetClientDetailsToEdit(Guid clientGuid, int loginUserSiteId);
        bool UpdateClientDetails(ClientDomainModel objClientDomainModel);
        bool UpdateClientStatus(Guid clientGuid, bool status, int loggedInUser);
        #endregion

        #region ClientUnits
        IEnumerable<ClientUnitsDomainModel> GetClientUnitsByClientId(int clientId, int offset, int fetch);

        IEnumerable<ClientUnitsDomainModel> GetClientDetailsByControlNo(string ControlNo, int SiteId, bool ActiveStatus);

        IEnumerable<ControlNumberDomainModel> GetControlNumbersByClientUnitId(int clientUnitId);
        IEnumerable<ClientUnitsDomainModel> GetClientUnitsByClientName(string clientName, int offset, int fetch);
        DataSet GetClientUnitDetailsToAdd();
        bool IsClientUnitAlreadyExists(ClientUnitsDomainModel objClientUnitsDomainModel);
        int AddClientUnit(ClientUnitsDomainModel objClientUnitsDomainModel);
        DataSet GetClientUnitDetailsToEdit(Guid clientUnitGuid);
        bool UpdateClientUnitDetails(ClientUnitsDomainModel objClientUnitsDomainModel);
        bool InactivateClientUnit(Guid clientUnitGuid, int loggedInUser);
        ClientUnitsDomainModel GetClientUnitByUnitId(int unitId);
        #endregion


    }
    public class ClientService : IClientService
    {
        private SqlConnection _con;
        private void Connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(constring);
        }
        public IEnumerable<ClientDomainModel> GetAllClientDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
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
            return _con.Query<ClientDomainModel>("GetAllClientDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        //public IEnumerable<ClientDomainModel> GetClientSearchList(int siteId, string strSearch, int offset, int fetch)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@SiteId", siteId);
        //    parameter.Add("@strSearch", strSearch);
        //    parameter.Add("@Offset", offset);
        //    parameter.Add("@Fetch", fetch);
        //    return _con.Query<ClientDomainModel>("GetClientSearchList", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        //}
        public DataSet GetClientDetailsToAdd(int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetClientDetailsToAdd", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@LoginUserSiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public IEnumerable<ControlNumberDomainModel> GetControlNumbersByClientUnitId(int clientUnitId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientUnitId", clientUnitId);
            return _con.Query<ControlNumberDomainModel>("GetControlNumbersByClientUnitId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public bool IsClientAlreadyExists(ClientDomainModel objClientDomainModel)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@ClientId", objClientDomainModel.ClientId);
            para.Add("@ClientName", objClientDomainModel.ClientName.Trim());
            return _con.Query<bool>("IsClientExistsAlready", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }
        public int CreateClient(ClientDomainModel objClientDomainModel)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientName", objClientDomainModel.ClientName.Trim());
            parameter.Add("@SiteId", objClientDomainModel.SiteId);
            parameter.Add("@IndustryTypeId", objClientDomainModel.IndustryTypeId);
            parameter.Add("@AnnualRevenue", objClientDomainModel.AnnualRevenue);
            parameter.Add("@CreatedBy", objClientDomainModel.CreatedBy);
            return _con.Query<int>("SaveClientDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet GetClientDetailsToEdit(Guid clientGuid, int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetClientDetailsToEdit", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ClientGuid", clientGuid);
            cmd.Parameters.AddWithValue("@LoginUserSiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public bool UpdateClientDetails(ClientDomainModel objClientDomainModel)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientId", objClientDomainModel.ClientId);
            parameter.Add("@ClientName", objClientDomainModel.ClientName.Trim());
            //parameter.Add("@SiteId", objClientDomainModel.SiteId);
            parameter.Add("@IndustryTypeId", objClientDomainModel.IndustryTypeId);
            parameter.Add("@AnnualRevenue", objClientDomainModel.AnnualRevenue);
            parameter.Add("@LoggedInUser", objClientDomainModel.LoggedInUser);
            return _con.Query<bool>("UpdateClientDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UpdateClientStatus(Guid clientGuid, bool status, int loggedInUser)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientGuid", clientGuid);
            parameter.Add("@Status", status);
            parameter.Add("@LoggedInUser", loggedInUser);
            return _con.Query<bool>("UpdateClientStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public IEnumerable<ClientUnitsDomainModel> GetClientUnitsByClientId(int clientId, int offset, int fetch)
        {
            Connection();
            var parameters = new DynamicParameters();
            parameters.Add("@ClientId", clientId);
            parameters.Add("@Offset", offset);
            parameters.Add("@Fetch", fetch);
            return _con.Query<ClientUnitsDomainModel>("GetClientUnitsByClientId", parameters, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<ClientUnitsDomainModel> GetClientDetailsByControlNo(string ControlNo, int SiteId, bool ActiveStatus)
        {
            Connection();
            var parameters = new DynamicParameters();
            parameters.Add("@ControlNo", ControlNo);
            parameters.Add("@SiteId", SiteId);
            parameters.Add("@ActiveStatus", ActiveStatus);
            return _con.Query<ClientUnitsDomainModel>("GetClientDetailsByControlNumber", parameters, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public IEnumerable<ClientUnitsDomainModel> GetClientDetailsByControlNo1(string ControlNo, int SiteId, bool ActiveStatus)
        {
            Connection();
            var parameters = new DynamicParameters();
            parameters.Add("@ControlNo", ControlNo);
            parameters.Add("@SiteId", SiteId);
            parameters.Add("@ActiveStatus", ActiveStatus);
            return _con.Query<ClientUnitsDomainModel>("GetClientDetailsByControlNumber1", parameters, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<ClientUnitsDomainModel> GetClientUnitsByClientName(string clientName, int offset, int fetch)
        {
            Connection();
            var parameters = new DynamicParameters();
            parameters.Add("@ClientName", clientName);
            parameters.Add("@Offset", offset);
            parameters.Add("@Fetch", fetch);
            return _con.Query<ClientUnitsDomainModel>("GetClientUnitsByClientName", parameters, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public DataSet GetClientUnitDetailsToAdd()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetClientUnitDetailsToAdd", con);
            cmd.CommandType = CommandType.StoredProcedure;
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool IsClientUnitAlreadyExists(ClientUnitsDomainModel objClientUnitsDomainModel)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@UnitId", objClientUnitsDomainModel.ClientUnitId);
            para.Add("@UnitName", objClientUnitsDomainModel.ClientUnitName.Trim());
            para.Add("@ClientId", objClientUnitsDomainModel.ClientId);
            return _con.Query<bool>("IsClientUnitExistsAlready", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }
        public int AddClientUnit(ClientUnitsDomainModel objClientUnitsDomainModel)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientId", objClientUnitsDomainModel.ClientId);
            parameter.Add("@ClientUnitName", objClientUnitsDomainModel.ClientUnitName);
            parameter.Add("@PhoneNumber", objClientUnitsDomainModel.PhoneNumber);
            parameter.Add("@Address", objClientUnitsDomainModel.Address);
            parameter.Add("@City", objClientUnitsDomainModel.City);
            parameter.Add("@StateId", objClientUnitsDomainModel.StateId == 0 ? null : (object)objClientUnitsDomainModel.StateId);
            parameter.Add("@CountryId", objClientUnitsDomainModel.CountryId == 0 ? null : (object)objClientUnitsDomainModel.CountryId);
            parameter.Add("@ContactPersonName", objClientUnitsDomainModel.ContactPersonName);
            parameter.Add("@ContactPersonDesignation", objClientUnitsDomainModel.ContactPersonDesignation);
            parameter.Add("@ClientUnitEmailId", objClientUnitsDomainModel.ClientUnitEmailId);
            parameter.Add("@GSTNo", objClientUnitsDomainModel.GSTNo);
            parameter.Add("@SGST", objClientUnitsDomainModel.SGST == null ? 0 : (object)objClientUnitsDomainModel.SGST);
            parameter.Add("@CGST", objClientUnitsDomainModel.CGST == null ? 0 : (object)objClientUnitsDomainModel.CGST);
            parameter.Add("@IGST", objClientUnitsDomainModel.IGST == null ? 0 : (object)objClientUnitsDomainModel.IGST);
            parameter.Add("@IsSEZ", objClientUnitsDomainModel.IsSEZ);
            parameter.Add("@IsOverseas", objClientUnitsDomainModel.IsOverseas);
            parameter.Add("@CreatedBy", objClientUnitsDomainModel.CreatedBy);
            return _con.Query<int>("AddClientUnit", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet GetClientUnitDetailsToEdit(Guid clientUnitGuid)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetClientUnitDetailsToEdit", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ClientUnitGuid", clientUnitGuid);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool UpdateClientUnitDetails(ClientUnitsDomainModel objClientUnitsDomainModel)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientUnitGUID", objClientUnitsDomainModel.ClientUnitGuid);
            parameter.Add("@ClientUnitName", objClientUnitsDomainModel.ClientUnitName);
            parameter.Add("@PhoneNumber", objClientUnitsDomainModel.PhoneNumber);
            parameter.Add("@Address", objClientUnitsDomainModel.Address);
            parameter.Add("@City", objClientUnitsDomainModel.City);
            parameter.Add("@StateId", objClientUnitsDomainModel.StateId == 0 ? null : (object)objClientUnitsDomainModel.StateId);
            parameter.Add("@CountryId", objClientUnitsDomainModel.CountryId == 0 ? null : (object)objClientUnitsDomainModel.CountryId);
            parameter.Add("@ContactPersonName", objClientUnitsDomainModel.ContactPersonName);
            parameter.Add("@ContactPersonDesignation", objClientUnitsDomainModel.ContactPersonDesignation);
            parameter.Add("@ClientUnitEmailId", objClientUnitsDomainModel.ClientUnitEmailId);
            parameter.Add("@GSTNo", objClientUnitsDomainModel.GSTNo);
            parameter.Add("@SGST", objClientUnitsDomainModel.SGST == null ? 0 : (object)objClientUnitsDomainModel.SGST);
            parameter.Add("@CGST", objClientUnitsDomainModel.CGST == null ? 0 : (object)objClientUnitsDomainModel.CGST);
            parameter.Add("@IGST", objClientUnitsDomainModel.IGST == null ? 0 : (object)objClientUnitsDomainModel.IGST);
            parameter.Add("@IsSEZ", objClientUnitsDomainModel.IsSEZ);
            parameter.Add("@IsOverseas", objClientUnitsDomainModel.IsOverseas);
            parameter.Add("@LoggedInUser", objClientUnitsDomainModel.LoggedInUser);
            return _con.Query<bool>("UpdateClientUnit", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool InactivateClientUnit(Guid clientUnitGuid, int loggedInUser)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientUnitGUID", clientUnitGuid);
            parameter.Add("@LoggedInUser", loggedInUser);
            return _con.Query<bool>("InactivateClientUnit", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public ClientUnitsDomainModel GetClientUnitByUnitId(int unitId)
        {
            Connection();

            var parameter = new DynamicParameters();
            parameter.Add("@UnitId", unitId);

            return _con.Query<ClientUnitsDomainModel>("GetClientUnitDetailsByUnitId", parameter,commandType: CommandType.StoredProcedure).SingleOrDefault();

            //return result ?? new ClientUnitsDomainModel();
        }

    }
}
