using ClosedXML.Report;
using Dapper;
using DocumentFormat.OpenXml.Office.Word;
using IQEApp.Domain.ControlNumberDomain;
using IQEApp.Domain.FilesDomain;
using IQEApp.Domain.HomeDomain;
using IQEApp.Domain.ServiceOrderDomain;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.ControlNumberService
{
    public interface IControlNumberService
    {
        DataSet GetControlNumberDetailsToAdd(int loginUserSiteId);

        DataSet GetControlNumberDetails(int loginUserSiteId);
        DataSet GetClientDetails(int loginUserSiteId);
        DataSet GetServiceOrderDetailsForControlNumber(int serviceOrderId, int loginUserId, int loginUserSiteId);
        int GenerateControlNumber(ControlNumberDomainModel model);
        DataSet GetControlNumberDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fiYear);

        IEnumerable<ControlNumberDomainModel> GetControlNumbersByClientUnitId(int clientUnitId, int offset, int fetch);
        IEnumerable<ControlNumberDomainModel> GetControlNumbersByManufacturerId(int manufacturerId);
        DataSet GetSONumbersByControlId(int controlId, int offset, int fetch);
        
        IEnumerable<ControlNumberDomainModel> GetManufactureDetailsByControlNo(int controlNo, int offset, int fetch);

        IEnumerable<ControlNumberDomainModel> GetServiceOrderFilesBackup(int SoId);

        DataSet GetControlNumberDetailsToUpdate(Guid controlNumberGuid, int loginUserId, int loginUserSiteId);
        bool UpdateControlNumber(ControlNumberDomainModel model);

        bool UpdateSOFilesBySOID(ControlNumberDomainModel objSODM,bool flag);
        
        bool UpdateControlNumberActiveStatus(Guid controlNumberGuid, int loginUserId, bool status);

        DataSet GetControlNumberToUpdateLOISONumber(Guid @ControlNumberGuid, int loginUserSiteId);
        bool UpdateLatestSONumber(ControlNumberDomainModel objIRDM);
        #region ScheduleVisit

        DataSet GetScheduledVisitDetailsByControlNo(Guid? controlNumberGuid, string controlNumber, int loginUserId, int loginUserSiteId);

        #endregion
        DataSet GetControlNumCumPreviousVisitDetails(int soId);

        ControlNumberDomainModel GetSOFileDetailsByGUID(Guid Id, string FileName, int FileId);

    }
    public class ControlNumberService : IControlNumberService
    {
        #region DBConnection

        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }
        #endregion

        #region ControlNumber

        public DataSet GetClientDetails(int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetClientManufacturerDetails", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public DataSet GetControlNumberDetails(int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetControlNumberDetails1", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public DataSet GetControlNumberDetailsToAdd(int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetControlNumberDetailsToAdd", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public DataSet GetServiceOrderDetailsForControlNumber(int serviceOrderId, int loginUserId, int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetServiceOrderDetailsForControlNumber", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ServiceOrderId", serviceOrderId);
            cmd.Parameters.AddWithValue("@LoggedInUser", loginUserId);
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public int GenerateControlNumber(ControlNumberDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SOID", model.SOId);
            parameter.Add("@EquipmentName", model.EquipmentName);
            parameter.Add("@ControlNumberComments", model.ControlNumberComments);
            parameter.Add("@SiteId", model.SiteId);
            parameter.Add("@LoggedInUser", model.LoginUserId);
            return _con.Query<int>("GenerateControlNumber", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet GetControlNumberDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder , string fiYear)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetControlNumberDetails_New11", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@SiteId", siteId);
            cmd.Parameters.AddWithValue("@strSearch", strSearch);
            cmd.Parameters.AddWithValue("@alphaChar", alphaChar);
            cmd.Parameters.AddWithValue("@Offset", offset);
            cmd.Parameters.AddWithValue("@Fetch", fetch);
            cmd.Parameters.AddWithValue("@ActiveStatus", activeStatus);
            cmd.Parameters.AddWithValue("@SortingOrder", sortingOrder);
            cmd.Parameters.AddWithValue("@FiYear", fiYear);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;

            //return _con.Query<ControlNumberDomainModel>("GetControlNumberDetails_New1", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<ControlNumberDomainModel> GetControlNumbersByClientUnitId(int clientUnitId, int offset, int fetch)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientUnitId", clientUnitId);
            return _con.Query<ControlNumberDomainModel>("GetControlNumbersByClientUnitId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public IEnumerable<ControlNumberDomainModel> GetControlNumbersByManufacturerId(int manufacturerId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerId", manufacturerId);
            return _con.Query<ControlNumberDomainModel>("GetControlNumbersByManufacturerId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        
        public DataSet GetSONumbersByControlId(int controlId, int loginUserId, int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetSONumbersByControlId", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@controlId", controlId);
            //cmd.Parameters.AddWithValue("@LoggedInUser", loginUserId);
            //cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
            
        }
        

        public IEnumerable<ControlNumberDomainModel> GetManufactureDetailsByControlNo(int controlNo, int offset, int fetch)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ControlNo", controlNo);
            return _con.Query<ControlNumberDomainModel>("GetManufactureDetailsByControlNo", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<ControlNumberDomainModel> GetServiceOrderFilesBackup(int SoId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SoId", SoId);
            return _con.Query<ControlNumberDomainModel>("GetServiceOrderFilesBackup", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        

        public DataSet GetControlNumberDetailsToUpdate(Guid controlNumberGuid, int loginUserId, int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetControlNumberDetailsToUpdate", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ControlNumberGuid", controlNumberGuid);
            cmd.Parameters.AddWithValue("@LoggedInUser", loginUserId);
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool UpdateControlNumber(ControlNumberDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ControlNumberGuid", model.ControlNumberGuid);
            parameter.Add("@SOID", model.SOId);
            parameter.Add("@EquipmentName", model.EquipmentName);
            parameter.Add("@ControlNumberComments", model.ControlNumberComments);
            parameter.Add("@SiteId", model.SiteId);
            parameter.Add("@LoggedInUser", model.LoginUserId);
            return _con.Query<bool>("UpdateControlNumber", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool UpdateControlNumberActiveStatus(Guid controlNumberGuid, int loginUserId, bool status)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ControlNumberGuid", controlNumberGuid);
            parameter.Add("@Status", status);
            parameter.Add("@LoggedInUser", loginUserId);
            return _con.Query<bool>("UpdateControlNumberStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet GetControlNumberToUpdateLOISONumber(Guid @ControlNumberGuid, int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetControlNumberToUpdateLOISONumber", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.Add("@ControlNumberGuid", SqlDbType.UniqueIdentifier).Value = ControlNumberGuid;
            cmd.Parameters.Add("@SiteId", SqlDbType.Int).Value = loginUserSiteId;
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }


        public bool UpdateLatestSONumber (ControlNumberDomainModel objCNDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ControlNumberGuid", objCNDM.ControlNumberGuid);
            parameter.Add("@LoggedInUser", objCNDM.LoginUserId);
            parameter.Add("@LOISOTypeId", objCNDM.LOISOTypeId);
            parameter.Add("@LOINumber", objCNDM.LOINumber);
            parameter.Add("@SONumber", objCNDM.SONumber);
            parameter.Add("@SODate", objCNDM.SODate);
            parameter.Add("@CreateInCurrentFy", objCNDM.CreateInCurrentFy);
            //parameter.Add("@FileName", objCNDM.FileName);
            //parameter.Add("@FilePath", objCNDM.FilePath);
            return _con.Query<bool>("UpdateLatestSONumber", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UpdateSOFilesBySOID(ControlNumberDomainModel objCNDM, bool flag)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SOID", objCNDM.SOId);
            // parameter.Add("@QuotationNo", objEDM.QuotationNo);
            // parameter.Add("@QuotationDate", objEDM.QuotationDate);
            parameter.Add("@FileName", objCNDM.FileName);
            parameter.Add("@FilePath", objCNDM.FilePath);
            parameter.Add("@CreatedBy", objCNDM.LoginUserId);
            parameter.Add("@Flag", flag);
            return _con.Query<bool>("UpdateSOFilesBySOID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        #endregion
        #region scheduleVisit

        public DataSet GetScheduledVisitDetailsByControlNo(Guid? controlNumberGuid, string controlNumber, int loginUserId, int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetScheduledVisitDetailsByControlNo", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ControlNumberGuid", controlNumberGuid == null ? Guid.Empty : controlNumberGuid);
            cmd.Parameters.AddWithValue("@ControlNumber", controlNumber ?? string.Empty);
            cmd.Parameters.AddWithValue("@LoggedInUser", loginUserId);
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        #endregion
        public DataSet GetControlNumCumPreviousVisitDetails(int soId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetControlNoCumVisitDetailsByServiceOrder", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@SOID", soId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public ControlNumberDomainModel GetSOFileDetailsByGUID (Guid Id,string FileName, int FileId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@GUId", Id);
            parameter.Add("@FileName", FileName);
            parameter.Add("@FileId", FileId);
            return _con.Query<ControlNumberDomainModel>("GetSOFileDetailsByGUID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
    }

}
