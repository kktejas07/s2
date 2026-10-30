using Dapper;
using IQEApp.Domain.ControlNumberDomain;
using IQEApp.Domain.EnquiryDomain;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using static ClosedXML.Excel.XLPredefinedFormat;

namespace IQEApp.Service.EnquiryService
{
    public interface IEnquiryService
    {
        IEnumerable<EnquiryDomainModel> GetEnquiryListBySiteId(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder);
        //IEnumerable<ManufacturerDomainModel> GetManufacturersSearchList(int siteId, string strSearch, int offset, int fetch);
        DataSet GetEnquiryListBySiteId1(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus,string status, string sortingOrder, string fiYear);
        DataSet GetEnquiryQuotationsRevisionsFiles(int eId, int loggedInUser);
       // (IEnumerable<EnquiryDomainModel> Enquiries, EnquiryStatusDomainModel StatusCounts) GetEnquiryListBySiteId11(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder);
        bool IsEnquiryExistsAlready(EnquiryDomainModel objMDM);
        IEnumerable<EnquiryDomainModel> GetEnquiryQuotationBackupFiles(int Eid);
        DataSet GetEnquiryDetailsToAdd(int loginUserSiteId);
        EnquirySaveResult SaveEnquiryDetails(EnquiryDomainModel objMDM);

        bool SaveEnquiryCategoryDetail(EnquiryCategoryDomainModel objECM, bool flag);
        bool UpdateEnquiryDetails(EnquiryDomainModel objMDM);

        bool UploadQuotationByEnquiryID(EnquiryDomainModel objEDM);

        bool UploadQuotationFilesByEnquiryID(EnquiryDomainModel objEDM,bool flag);

        EnquiryDomainModel GetEnquiryQuotationFileDetailsByID(string EnquiryID, int? fileId, bool backupFile);
        bool UpdateEnquiryStatus(EnquiryDomainModel objMUDM);
        DataSet GetEnquiryDetailsToEdit(int eId, int loggedInUser);

        bool SubmitEnquiryStatus(EnquiryDomainModel objEDM);
    }

    public class EnquiryService : IEnquiryService
    {
        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }

        #region Enquiries

        public IEnumerable<EnquiryDomainModel> GetEnquiryListBySiteId(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
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
            return _con.Query<EnquiryDomainModel>("GetEnquiryListBySiteId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        
        //public (IEnumerable<EnquiryDomainModel> Enquiries, EnquiryStatusDomainModel StatusCounts) GetEnquiryListBySiteId11(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@SiteId", siteId);
        //    parameter.Add("@strSearch", strSearch);
        //    parameter.Add("@alphaChar", alphaChar);
        //    parameter.Add("@Offset", offset);
        //    parameter.Add("@Fetch", fetch);
        //    parameter.Add("@ActiveStatus", activeStatus);
        //    parameter.Add("@SortingOrder", sortingOrder);

        //    using (var multi = _con.QueryMultiple("GetEnquiryListBySiteId", parameter, commandType: CommandType.StoredProcedure))
        //    {
        //        var enquiries = multi.Read<EnquiryDomainModel>().ToList();

        //        var statusCounts = multi.ReadSingle<EnquiryStatusDomainModel>();

        //        return (enquiries, statusCounts);
        //    }
        //}

        public DataSet GetEnquiryListBySiteId1(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string status, string sortingOrder, string fiYear)
        {
            using (SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString))
            using (SqlCommand cmd = new SqlCommand("GetEnquiryListWithCategories", con))
            using (SqlDataAdapter da = new SqlDataAdapter(cmd))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                // Add parameters
                cmd.Parameters.AddWithValue("@SiteId", siteId);
                cmd.Parameters.AddWithValue("@strSearch", strSearch);
                cmd.Parameters.AddWithValue("@alphaChar", alphaChar);
                cmd.Parameters.AddWithValue("@Offset", offset);
                cmd.Parameters.AddWithValue("@Fetch", fetch);
                cmd.Parameters.AddWithValue("@ActiveStatus", activeStatus);
                cmd.Parameters.AddWithValue("@Status", status);
                cmd.Parameters.AddWithValue("@SortingOrder", sortingOrder);
                cmd.Parameters.AddWithValue("@fiYear", fiYear);
                DataSet ds = new DataSet();
                da.Fill(ds);

                return ds;
            }
        }


        //public DataSet GetEnquiryListBySiteId1(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
        //{
        //    SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
        //    SqlCommand cmd = new SqlCommand();
        //    SqlDataAdapter da = new SqlDataAdapter();
        //    DataSet ds = new DataSet();
        //    cmd = new SqlCommand("GetEnquiryListBySiteId", con);
        //    cmd.CommandType = CommandType.StoredProcedure;
        //    //if you have parameters.
        //    cmd.Parameters.AddWithValue("@SiteId", siteId);
        //    cmd.Parameters.AddWithValue("@strSearch", strSearch);
        //    cmd.Parameters.AddWithValue("@alphaChar", alphaChar);
        //    cmd.Parameters.AddWithValue("@Offset", offset);
        //    cmd.Parameters.AddWithValue("@Fetch", fetch);
        //    cmd.Parameters.AddWithValue("@ActiveStatus", activeStatus);
        //    cmd.Parameters.AddWithValue("@SortingOrder", sortingOrder);
        //    da = new SqlDataAdapter(cmd);
        //    da.Fill(ds);
        //    return ds;
        //}

        public EnquirySaveResult SaveEnquiryDetails(EnquiryDomainModel objEDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EnquiryCategoryId", objEDM.EnquiryCategoryId);
            parameter.Add("@ClientId", objEDM.ClientId);
            parameter.Add("@EnquiryDate", objEDM.EnquiryDate);
            parameter.Add("@SiteId", objEDM.SiteId);
            parameter.Add("@CreatedBy", objEDM.CreatedBy);

            // QuerySingle will map resultset (EID, EnquiryNo) directly into EnquirySaveResult
            var result = _con.QuerySingle<EnquirySaveResult>(
                "AddEnquiry11",
                parameter,
                commandType: CommandType.StoredProcedure);

            return result;
        }


        public bool SaveEnquiryCategoryDetail(EnquiryCategoryDomainModel objECM, bool flag)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EID", objECM.EID);
            parameter.Add("@SNo", objECM.SNo);
            parameter.Add("@Details", objECM.Details);
            parameter.Add("@Scope", objECM.Scope);
            parameter.Add("@Position", objECM.Position);
            parameter.Add("@UOMId", objECM.UOMId);
            parameter.Add("@Qty", objECM.Qty);
            parameter.Add("@ApplicableCodeStandards", objECM.ApplicableCodeStandards);
            parameter.Add("@Qualification", objECM.Qualification);
            parameter.Add("@Competance", objECM.Competance);
            parameter.Add("@Experience", objECM.Experience);
            parameter.Add("@Duration", objECM.Duration);
            parameter.Add("@Attendees", objECM.Attendees);
            parameter.Add("@ResponseTime", objECM.ResponseTime);
            parameter.Add("@Location", objECM.Location);
            parameter.Add("@Remarks", objECM.Remarks);
            parameter.Add("@Budget", objECM.Budget);
            parameter.Add("@Food", objECM.Food);
            parameter.Add("@LocalConveyance", objECM.LocalConveyance);
            parameter.Add("@MobDeMob", objECM.MobDeMob);
            parameter.Add("@OvertimeCharges", objECM.OvertimeCharges);
            parameter.Add("@OtherUOM", objECM.OtherUOM);
            parameter.Add("@Flag", flag);
            parameter.Add("@CreatedBy", objECM.CreatedBy);
            return _con.Query<bool>("SaveEnquiryCategoryDetail", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public DataSet GetEnquiryDetailsToAdd(int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetEnquiryDetailsToAdd1", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.Add("@SiteId", SqlDbType.Int).Value = loginUserSiteId;
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool IsEnquiryExistsAlready(EnquiryDomainModel objMVM)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@EnquiryID", objMVM.EnquiryID);
            //para.Add("@ManufacturerName", objMDM.ManufacturerName.Trim());
            return _con.Query<bool>("IsEnquiryExistsAlready1", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }
        public IEnumerable<EnquiryDomainModel> GetEnquiryQuotationBackupFiles(int EId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EId", EId);
            return _con.Query<EnquiryDomainModel>("GetEnquiryQuotationBackupFiles", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public DataSet GetEnquiryDetailsToEdit(int EID, int loggedInUser)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetEnquiryDetailsToEdit11", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@EID", EID);
            cmd.Parameters.AddWithValue("@LoginUserSiteId", loggedInUser);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool UpdateEnquiryDetails(EnquiryDomainModel objEDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EID", objEDM.EID);
            parameter.Add("@ClientId", objEDM.ClientId);
            parameter.Add("@EnquiryDate", objEDM.EnquiryDate);
            parameter.Add("@EnquiryCategoryId", objEDM.EnquiryCategoryId);
            parameter.Add("@SiteId", objEDM.SiteId);
            parameter.Add("@ModifiedBy", objEDM.CreatedBy);
            return _con.Query<bool>("UpdateEnquiryDetailsByEID1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UpdateEnquiryStatus(EnquiryDomainModel objEDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EnquiryID", objEDM.EnquiryID);
            parameter.Add("@Status", objEDM.IsEnquiryActive);
            parameter.Add("@ModifiedBy", objEDM.CreatedBy);
            return _con.Query<bool>("UpdateEnquiryStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UploadQuotationByEnquiryID(EnquiryDomainModel objEDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EnquiryID", objEDM.EnquiryID);
            parameter.Add("@QuotationNo", objEDM.QuotationNo);
            parameter.Add("@QuotationDate", objEDM.QuotationDate);
            //parameter.Add("@FileName", objEDM.FileName);
            //parameter.Add("@FilePath", objEDM.FilePath);
            parameter.Add("@ModifiedBy", objEDM.CreatedBy);
            return _con.Query<bool>("UploadQuotationByEnquiryID1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UploadQuotationFilesByEnquiryID(EnquiryDomainModel objEDM, bool flag)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EnquiryID", objEDM.EnquiryID);
            parameter.Add("@QuotationNo", objEDM.QuotationNo);
           // parameter.Add("@QuotationDate", objEDM.QuotationDate);
            parameter.Add("@FileName", objEDM.FileName);
            parameter.Add("@FilePath", objEDM.FilePath);
            parameter.Add("@CreatedBy", objEDM.CreatedBy);
            parameter.Add("@Flag", flag);
            return _con.Query<bool>("UploadQuotationFilesByEnquiryID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public EnquiryDomainModel GetEnquiryQuotationFileDetailsByID(string EnquiryID, int? FileID, bool backupFile)
        {
            Connection();
            var parameter = new DynamicParameters();
           // parameter.Add("@EnquiryID", EnquiryID);
            parameter.Add("@FileID", FileID);
            parameter.Add("@backupFile", backupFile);
            return _con.Query<EnquiryDomainModel>("GetEnquiryQuotationFileDetailsByID1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public DataSet GetEnquiryQuotationsRevisionsFiles(int eId, int loggedInUser)
        {
            using (SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString))
            using (SqlCommand cmd = new SqlCommand("GetEnquiryQuotationsFiles1", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@EId", eId);
                cmd.Parameters.AddWithValue("@SiteId", loggedInUser);

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds;
            }
        }

        public bool SubmitEnquiryStatus(EnquiryDomainModel objEDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EnquiryID", objEDM.EnquiryID);
            parameter.Add("@Status", objEDM.SubmitStatus);
            //parameter.Add("@Remarks", objEDM.Remarks);
            parameter.Add("@ModifiedBy", objEDM.CreatedBy);
            return _con.Query<bool>("SubmitEnquiryStatus1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        #endregion Enquiries
    }
}
