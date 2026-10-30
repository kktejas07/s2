using Dapper;
using IQEApp.Domain.ManufacturerDomain;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.ManufacturerService
{
    public interface IManufacturerService
    {
        #region Manufacturer
        IEnumerable<ManufacturerDomainModel> GetManufacturersListBySiteId(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder);
        //IEnumerable<ManufacturerDomainModel> GetManufacturersSearchList(int siteId, string strSearch, int offset, int fetch);
        bool IsManufacturerExistsAlready(ManufacturerDomainModel objMDM);
        DataSet GetManufacturerDetailsToAdd();
        int SaveManufacturerDetails(ManufacturerDomainModel objMDM);
        DataSet GetManufacturerDetailsToEdit(Guid manufacturerGuid, int loggedInUser);
        bool UpdateManufacturerDetails(ManufacturerDomainModel objMDM);
        bool UpdateManufacturerStatus(ManufacturerDomainModel objMDM);

        #endregion

        #region ManufacturerUnits
        DataSet GetManufacturerUnitDetailsToAdd();
        bool IsManufacturerUnitExistsAlready(ManufacturerUnitsDomainModel objMUDM);
        int SaveManufacturerUnitDetails(ManufacturerUnitsDomainModel objMUDM);
        IEnumerable<ManufacturerUnitsDomainModel> GetManufacturerUnitsListByManufacturer(int manufacturerId);
        IEnumerable<ManufacturerUnitsDomainModel> GetManufacturerUnitsListByManufacturerList(string manufacturerIds, int LoggedInUser);
        DataSet GetManufacturerUnitDetailsToEdit(Guid manufacturerUnitGuid, int loggedInUser);
        bool UpdateManufacturerUnitDetails(ManufacturerUnitsDomainModel objMUDM);
        bool UpdateManufacturerUnitStatus(ManufacturerUnitsDomainModel objMUDM);
        ManufacturerUnitsDomainModel GetManufacturerUnitDetailsByUnitId(int unitId);
        IEnumerable<ManufacturerDomainModel> GetManufacturersList(int SiteId);

        #endregion
    }
    public class ManufacturerService : IManufacturerService
    {
        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }

        #region Manufacturer

        public IEnumerable<ManufacturerDomainModel> GetManufacturersListBySiteId(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@strSearch", strSearch);
            parameter.Add("@alphaChar", alphaChar);
            parameter.Add("@Offset", offset);
            parameter.Add("@Fetch", fetch);
            parameter.Add("@ActiveStatus", activeStatus);
            parameter.Add("@SortingOrder", sortingOrder);
            return _con.Query<ManufacturerDomainModel>("GetManufacturersListBySiteId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<ManufacturerDomainModel> GetManufacturersList(int SiteId)
        {
            Connection();
            var parameters = new DynamicParameters();
            parameters.Add("@SiteId", SiteId);
            return _con.Query<ManufacturerDomainModel>("GetManufacturersList", parameters, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        //public IEnumerable<ManufacturerDomainModel> GetManufacturersSearchList(int siteId, string strSearch, int offset, int fetch)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@SiteId", siteId);
        //    parameter.Add("@strSearch", strSearch);
        //    parameter.Add("@Offset", offset);
        //    parameter.Add("@Fetch", fetch);
        //    return _con.Query<ManufacturerDomainModel>("GetManufacturersSearchList", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        //}
        public bool IsManufacturerExistsAlready(ManufacturerDomainModel objMDM)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@ManufacturerId", objMDM.ManufacturerId);
            para.Add("@ManufacturerName", objMDM.ManufacturerName.Trim());
            return _con.Query<bool>("IsManufacturerExistsAlready", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }
        public DataSet GetManufacturerDetailsToAdd()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetManufacturerDetailsToAdd", con);
            cmd.CommandType = CommandType.StoredProcedure;
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public int SaveManufacturerDetails(ManufacturerDomainModel objMDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerName", objMDM.ManufacturerName.Trim());
            parameter.Add("@ContactNumber", objMDM.ContactNumber);
            parameter.Add("@City", objMDM.City);
            parameter.Add("@StateId", objMDM.StateId == 0 ? null : (object)objMDM.StateId);
            parameter.Add("@CountryId", objMDM.CountryId == 0 ? null : (object)objMDM.CountryId);
            parameter.Add("@SiteId", objMDM.SiteId);
            parameter.Add("@ManufacturerUnitNameFlag", objMDM.ManufacturerUnitNameFlag);
            parameter.Add("@LoggedInUser", objMDM.LoggedInUser);
            parameter.Add("@IsSEZ", objMDM.IsSEZ);
            parameter.Add("@IsOverseas",objMDM.IsOverseas);
            parameter.Add("@GSTNo",objMDM.GSTNo);
            parameter.Add("@SGST",objMDM.SGST);
            parameter.Add("@CGST",objMDM.CGST);
            parameter.Add("@IGST", objMDM.IGST);

            return _con.Query<int>("SaveManufacturerDetails1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public DataSet GetManufacturerDetailsToEdit(Guid manufacturerGuid, int loggedInUser)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetManufacturerDetailsToEdit", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ManufacturerGuid", manufacturerGuid);
            cmd.Parameters.AddWithValue("@LoginUserSiteId", loggedInUser);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool UpdateManufacturerDetails(ManufacturerDomainModel objMDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerGuid", objMDM.ManufacturerGuid);
            parameter.Add("@ManufacturerName", objMDM.ManufacturerName.Trim());
            parameter.Add("@ContactNumber", objMDM.ContactNumber);
            parameter.Add("@City", objMDM.City);
            parameter.Add("@StateId", objMDM.StateId == 0 ? null : (object)objMDM.StateId);
            parameter.Add("@CountryId", objMDM.CountryId == 0 ? null : (object)objMDM.CountryId);
            parameter.Add("@ManufacturerUnitNameFlag", objMDM.ManufacturerUnitNameFlag);
            parameter.Add("@LoggedInUser", objMDM.LoggedInUser);
            parameter.Add("@IsSEZ", objMDM.IsSEZ);
            parameter.Add("@IsOverseas", objMDM.IsOverseas);
            parameter.Add("@GSTNo", objMDM.GSTNo);
            parameter.Add("@SGST", objMDM.SGST);
            parameter.Add("@CGST", objMDM.CGST);
            parameter.Add("@IGST", objMDM.IGST);
            return _con.Query<bool>("UpdateManufacturerDetails1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UpdateManufacturerStatus(ManufacturerDomainModel objMDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerGuid", objMDM.ManufacturerGuid);
            parameter.Add("@Status", objMDM.IsManufacturerActive);
            parameter.Add("@LoggedInUser", objMDM.LoggedInUser);
            return _con.Query<bool>("UpdateManufacturerStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        #endregion

        #region ManufacturerUnits

        public DataSet GetManufacturerUnitDetailsToAdd()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetManufacturerUnitDetailsToAdd", con);
            cmd.CommandType = CommandType.StoredProcedure;
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool IsManufacturerUnitExistsAlready(ManufacturerUnitsDomainModel objMUDM)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@UnitId", objMUDM.ManufacturerUnitId);
            para.Add("@UnitName", objMUDM.ManufacturerUnitName.Trim());
            return _con.Query<bool>("IsManufacturerUnitExistsAlready", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }
        public int SaveManufacturerUnitDetails(ManufacturerUnitsDomainModel objMUDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerId", objMUDM.ManufacturerId);
            parameter.Add("@UnitName", objMUDM.ManufacturerUnitName.Trim());
            parameter.Add("@PhoneNumber", objMUDM.PhoneNumber);
            parameter.Add("@Address", objMUDM.Address);
            parameter.Add("@City", objMUDM.City);
            parameter.Add("@StateId", objMUDM.MFUnitStateId == 0 ? null : (object)objMUDM.MFUnitStateId);
            parameter.Add("@CountryId", objMUDM.MFUnitCountryId == 0 ? null : (object)objMUDM.MFUnitCountryId);
            parameter.Add("@ContactPersonName", objMUDM.ContactPersonName);
            parameter.Add("@ContactPersonDesignation", objMUDM.ContactPersonDesignation);
            parameter.Add("@ManufacturerUnitEmailId", objMUDM.ManufacturerUnitEmailId);
            parameter.Add("@LoggedInUser", objMUDM.LoggedInUser);
            return _con.Query<int>("SaveManufacturerUnits", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public IEnumerable<ManufacturerUnitsDomainModel> GetManufacturerUnitsListByManufacturer(int manufacturerId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerId", manufacturerId);
            parameter.Add("@LoggedInUser", manufacturerId);
            return _con.Query<ManufacturerUnitsDomainModel>("GetManufacturerUnitsByManufacturerId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<ManufacturerUnitsDomainModel> GetManufacturerUnitsListByManufacturerList(string manufacturerIds, int LoggedInUser)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerIds", manufacturerIds);
            parameter.Add("@LoggedInUser", LoggedInUser);
            return _con.Query<ManufacturerUnitsDomainModel>("GetManufacturerUnitsByManufacturerIds", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public DataSet GetManufacturerUnitDetailsToEdit(Guid manufacturerUnitGuid, int loggedInUser)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetManufacturerUnitDetailsToEdit", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ManufacturerUnitGuid", manufacturerUnitGuid);
            cmd.Parameters.AddWithValue("@LoggedInUser", loggedInUser);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool UpdateManufacturerUnitDetails(ManufacturerUnitsDomainModel objMUDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerUnitGuid", objMUDM.ManufacturerUnitGuid);
            parameter.Add("@UnitName", objMUDM.ManufacturerUnitName.Trim());
            parameter.Add("@PhoneNumber", objMUDM.PhoneNumber);
            parameter.Add("@Address", objMUDM.Address);
            parameter.Add("@City", objMUDM.City);
            parameter.Add("@StateId", objMUDM.MFUnitStateId == 0 ? null : (object)objMUDM.MFUnitStateId);
            parameter.Add("@CountryId", objMUDM.MFUnitCountryId == 0 ? null : (object)objMUDM.MFUnitCountryId);
            parameter.Add("@ContactPersonName", objMUDM.ContactPersonName);
            parameter.Add("@ContactPersonDesignation", objMUDM.ContactPersonDesignation);
            parameter.Add("@ManufacturerUnitEmailId", objMUDM.ManufacturerUnitEmailId);
            parameter.Add("@LoggedInUser", objMUDM.LoggedInUser);
            return _con.Query<bool>("UpdateManufacturerUnit", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool UpdateManufacturerUnitStatus(ManufacturerUnitsDomainModel objMUDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerUnitGuid", objMUDM.ManufacturerUnitGuid);
            parameter.Add("@Status", objMUDM.IsManufacturerUnitActive);
            parameter.Add("@LoggedInUser", objMUDM.LoggedInUser);
            return _con.Query<bool>("UpdateManufacturerUnitStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public ManufacturerUnitsDomainModel GetManufacturerUnitDetailsByUnitId(int unitId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@UnitId", unitId);
            return _con.Query<ManufacturerUnitsDomainModel>("GetManufacturerUnitDetailsByUnitId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        #endregion
    }
}
