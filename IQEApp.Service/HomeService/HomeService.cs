using Dapper;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Domain.HomeDomain;
using IQEApp.Domain.VisitProcessing;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.HomeService
{
    public interface IHomeService
    {
        List<HomeDomainModel> GetMyScheduledVisits(int statusId, int siteId, int loginUserId);
        HomeDomainModel GetFileDetailsByVisitId(int VisitId, string fileName);

        List<HomeDomainModel> GetSelectDateScheduledVisitsList(int siteId, DateTime today, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder);
        (List<HomeDomainModel> Data, int ProspectiveCount) GetCancelledVisits(int siteId, DateTime today, string strSearch, string alphaChar, int offset, int fetch, int VisitStatusId, string sortingOrder);

        List<HomeDomainModel> GetProspectiveVisits(int siteId, DateTime today, string strSearch, string alphaChar, int offset, int fetch, string sortingOrder);
       
        bool SubmitQualityCheckDateByVisitID(HomeDomainModel obj);

        bool UpdateInspectionDateByVisitID(HomeDomainModel obj);
        bool OnHoldCancalledInspectionVisit(HomeDomainModel obj);
        bool ReportSubmitToClientDateByVisitID(HomeDomainModel obj);
        bool IsInspReportNumberExitsAlready(string InspReportNo);
        bool UpdateCommentsByVisitID(HomeDomainModel obj);
        bool InActivateProspective(int visitPId, int loggedInUser);
        bool SubmitInspectorNameByVisitID(HomeDomainModel obj);

        decimal UpdateCostValueByVisitID(HomeDomainModel obj);
        List<VisitsSummaryDomainModel> GetMyVisitsSummary(int loginUserId);
        List<InspectionReportDomainModel> GetInspectionReportFiles(int VisitId);
        List<InspectionReportDomainModel> GetInspectionReportBackupFiles(int VisitId);
        bool UploadInspectionReportByVisitID(InspectionReportDomainModel objEDM, bool flag);
        bool UpdateInspectionReportByVisitID(int VisitId, DateTime? InspReportDate ,int LoginUserId);

        ScheduleVisitDomainModel GetProspectiveByVisitPId(int VisitPId);
        int SaveScheduleVisitByProspective(ScheduleVisitDomainModel model, int VisitPId);

        DataSet UploadIRDocumentsToAdd_Edit(int VisitId, bool Revised);

        // NEW: close visit by referencing another visit sequence id that already has reports
        (bool Success, string Message) CloseVisitWithReference(HomeDomainModel obj);
    }
    public class HomeService : IHomeService
    {
        #region DBConnection

        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }
        #endregion

        public List<HomeDomainModel> GetMyScheduledVisits(int statusId, int siteId, int loginUserId)
        {
            Connection();
            var param = new DynamicParameters();
            param.Add("@statusId", statusId);
            param.Add("@SiteId", siteId);
            param.Add("@loginUserId", loginUserId);
            return _con.Query<HomeDomainModel>("GetMyScheduledVisits", param, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }

        public HomeDomainModel GetFileDetailsByVisitId(int VisitId, string fileName)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", VisitId);
            parameter.Add("@FileName", fileName.Trim());
            //parameter.Add("@SectionId", SId);
            return _con.Query<HomeDomainModel>("GetFileDetailsByVisitId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public List<HomeDomainModel> GetSelectDateScheduledVisitsList(int siteId, DateTime today, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
        {
            Connection();
            var param = new DynamicParameters();
            param.Add("@SiteId", siteId);
            param.Add("@strSearch", strSearch);
            param.Add("@alphaChar", alphaChar);
            param.Add("@Offset", offset);
            param.Add("@Fetch", fetch);
            param.Add("@ActvieStatus", activeStatus);
            param.Add("@SortingOrder", sortingOrder);
            param.Add("@Today", today);
            return _con.Query<HomeDomainModel>("GetOpenCallsVisitsList1", param, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }
        public (List<HomeDomainModel> Data, int ProspectiveCount) GetCancelledVisits(int siteId, DateTime today, string strSearch, string alphaChar, int offset, int fetch, int VisitStatusId, string sortingOrder)
        {
            Connection();
            var param = new DynamicParameters();

            param.Add("@Offset", offset);
            param.Add("@Fetch", fetch);
            param.Add("@VisitStatusId", VisitStatusId);
            param.Add("@SortingOrder", sortingOrder);

            using (var multi = _con.QueryMultiple("GetAbrotiveCancelledInactiveCalls", param, commandType: CommandType.StoredProcedure))
            {
                var list = multi.Read<HomeDomainModel>().ToList();
                var prospectiveCount = multi.ReadFirst<int>();
                return (list, prospectiveCount);
            }
        }

        public List<HomeDomainModel> GetProspectiveVisits(int siteId, DateTime today, string strSearch, string alphaChar, int offset, int fetch,  string sortingOrder)
        {
            Connection();
            var param = new DynamicParameters();
            param.Add("@Offset", offset);
            param.Add("@Fetch", fetch);
            param.Add("@SortingOrder", sortingOrder);
            // param.Add("@Today", today);
            return _con.Query<HomeDomainModel>("GetProspectiveVisitSchedule1", param, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }

        public ScheduleVisitDomainModel GetProspectiveByVisitPId(int VisitPId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitPId", VisitPId);
            return _con.Query<ScheduleVisitDomainModel>("GetProspectiveByVisitPId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public List<VisitsSummaryDomainModel> GetMyVisitsSummary(int loginUserId)
        {
            Connection();
            var param = new DynamicParameters();
            param.Add("@loginUserId", loginUserId);
            return _con.Query<VisitsSummaryDomainModel>("GetMyVisitsSummary", param, null, true, 0, commandType: CommandType.StoredProcedure).ToList();

        }

        public bool IsInspReportNumberExitsAlready(string InspReportNo)
        {
            Connection();
            var para = new DynamicParameters();
          //  para.Add("@SiteId", siteId);
           // para.Add("@SectionId", sectionId);
            para.Add("@InspReportNo", InspReportNo);
          //  para.Add("@MasterName", masterName);
            return _con.Query<bool>("IsInspReportNumberExitsAlready", para, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public List<InspectionReportDomainModel> GetInspectionReportFiles(int VisitId) 
        {
            Connection();
            var param = new DynamicParameters();
            param.Add("@VisitId", VisitId);
            return _con.Query<InspectionReportDomainModel>("GetInspectionReportFiles", param, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }

        public List<InspectionReportDomainModel> GetInspectionReportBackupFiles(int VisitId)
        {
            Connection();
            var param = new DynamicParameters();
            param.Add("@VisitId", VisitId);
            return _con.Query<InspectionReportDomainModel>("GetInspectionReportBackupFiles", param, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }
        public bool UpdateInspectionReportByVisitID(int VisitId,DateTime? InspReportDate , int LoginUserId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", VisitId);
            parameter.Add("@InspReportDate", InspReportDate);
            parameter.Add("@ModifiedBy", LoginUserId);
            return _con.Query<bool>("UpdateInspectionReportByVisitID1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UploadInspectionReportByVisitID(InspectionReportDomainModel objIRDM, bool flag)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", objIRDM.VisitId);
            parameter.Add("@Flag", flag);
            parameter.Add("@PONID", objIRDM.PONId);
            parameter.Add("@POItemId", objIRDM.POItemId);
            parameter.Add("@InspReportNo", objIRDM.InspReportNo);
            parameter.Add("@VisitedFrom", objIRDM.VisitedFrom == Convert.ToDateTime("01/01/0001") ? Convert.ToDateTime("01/01/1900") : objIRDM.VisitedFrom);
            parameter.Add("@VisitedTo", objIRDM.VisitedTo == Convert.ToDateTime("01/01/0001") ? Convert.ToDateTime("01/01/1900") : objIRDM.VisitedTo);
            parameter.Add("@UploadInspReportFileName", objIRDM.FileName);
            parameter.Add("@UploadInspReportFilePath", objIRDM.FilePath);
            int userId = objIRDM.CreatedBy > 0 ? objIRDM.CreatedBy : (objIRDM.ModifiedBy > 0 ? objIRDM.ModifiedBy : objIRDM.LoginUserId);
            parameter.Add("@CreatedBy", userId);
            parameter.Add("@ModifiedBy", userId);
            return _con.Query<bool>("UploadInspectionReportByVisitID1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool SubmitQualityCheckDateByVisitID(HomeDomainModel obj)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", obj.VisitId);
            parameter.Add("@QulalityCheck", obj.QulalityCheck);
            parameter.Add("@QulalityCheckSubmitDate", obj.QulalityCheckSubmitDate);
            parameter.Add("@QualityCheckDoneBy", obj.QualityCheckDoneBy);
            parameter.Add("@ModifiedBy", obj.ModifiedBy);
            return _con.Query<bool>("SubmitQualityCheckDateVisitID1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UpdateInspectionDateByVisitID(HomeDomainModel obj)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", obj.VisitId);
            parameter.Add("@ScheduleDate", obj.ScheduleDate);
            parameter.Add("@ModifiedBy", obj.ModifiedBy);
            return _con.Query<bool>("UpdateInspectionDateByVisitID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool InActivateProspective(int visitPId, int loggedInUser)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@visitPId", visitPId);
            parameter.Add("@LoggedInUser", loggedInUser);
            return _con.Query<bool>("InActivateProspective", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool OnHoldCancalledInspectionVisit(HomeDomainModel obj)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", obj.VisitId);
            parameter.Add("@VisitStatusId", obj.VisitStatusId);
            parameter.Add("@Comments", obj.Comments);
            parameter.Add("@ModifiedBy", obj.ModifiedBy);
            return _con.Query<bool>("OnHoldCancalledInspectionVisit", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        // NEW: implementation that closes visit by storing reference to another visit that has reports
        public (bool Success, string Message) CloseVisitWithReference(HomeDomainModel obj)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", obj.VisitId);
            parameter.Add("@ReferenceVisitSeqId", obj.ReferenceVisitSeqId ?? string.Empty);
            parameter.Add("@Comments", obj.Comments ?? string.Empty);
            parameter.Add("@ModifiedBy", obj.ModifiedBy);
            // NOTE: implement stored procedure CloseVisitWithReference in DB to perform the business logic

            var res = _con.QueryFirstOrDefault("CloseVisitWithReference", parameter, null, commandType: CommandType.StoredProcedure);
            if (res == null)
                return (false, "No response from database");

            try
            {
                bool success = false;
                string message = string.Empty;

                // Dapper dynamic result, properties may be capitalized
                var dict = res as IDictionary<string, object>;
                if (dict != null)
                {
                    if (dict.ContainsKey("Success")) success = Convert.ToBoolean(dict["Success"]);
                    if (dict.ContainsKey("Message")) message = dict["Message"]?.ToString();
                }
                else
                {
                    // try dynamic access
                    success = Convert.ToBoolean(res.Success);
                    message = res.Message;
                }

                return (success, message);
            }
            catch (Exception ex)
            {
                return (false, ex.Message);
            }
        }

        public bool ReportSubmitToClientDateByVisitID(HomeDomainModel obj)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", obj.VisitId);
            parameter.Add("@ReportSubmittedClientDate", obj.ReportSubmittedClientDate);
            parameter.Add("@ModifiedBy", obj.ModifiedBy);
            return _con.Query<bool>("ReportSubmitToClientDateByVisitID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        

        public bool UpdateCommentsByVisitID(HomeDomainModel obj)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", obj.VisitId);
            parameter.Add("@Comments", obj.Comments);
            parameter.Add("@ModifiedBy", obj.ModifiedBy);
            return _con.Query<bool>("UpdateCommentsByVisitID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool SubmitInspectorNameByVisitID(HomeDomainModel obj)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", obj.VisitId);
            parameter.Add("@UserId", obj.UserId);
            parameter.Add("@ModifiedBy", obj.ModifiedBy);
            return _con.Query<bool>("SubmitInspectorNameByVisitID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        

        public decimal UpdateCostValueByVisitID(HomeDomainModel obj)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", obj.VisitId);
            parameter.Add("@ManufacturerId", obj.ManufacturerId);
            parameter.Add("@CostValue", obj.CostValue);
            parameter.Add("@ModifiedBy", obj.ModifiedBy);
            return _con.Query<decimal>("UpdateCostValueByVisitID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public int SaveScheduleVisitByProspective(ScheduleVisitDomainModel model, int VisitPId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientId", model.ClientId);
            parameter.Add("@CountryId", model.CountryId);
            parameter.Add("@StateId", model.StateId);
            parameter.Add("@StateName", model.StateName);
            parameter.Add("@VisitLocation", model.VisitLocation);
            parameter.Add("@RFIScheduleDate", model.RFIScheduleDate);
            parameter.Add("@ScheduleDate", model.ScheduleDate);
            parameter.Add("@VisitDate", model.VisitDate);
            parameter.Add("@ScheduleComments", model.ScheduleComments);
            parameter.Add("@ClientConfirmation", model.ClientConfirmation);
            parameter.Add("@ManufacturerConfirmation", model.ManufacturerConfirmation);
            parameter.Add("@UserIds", model.UserIds);
            parameter.Add("@LoggedInUser", model.LoginUserId);
            parameter.Add("@VisitPId", VisitPId);
            return _con.Query<int>("SaveScheduleVisitByProspective", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet UploadIRDocumentsToAdd_Edit(int VisitId, bool Revised)
        {

            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("UploadIRDocumentsToAdd_Edit", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@VisitId", VisitId);
            cmd.Parameters.AddWithValue("@Revised", Revised);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;

        }
    }

}
