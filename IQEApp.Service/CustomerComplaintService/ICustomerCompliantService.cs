using Dapper;
using IQEApp.Domain.CustomerComplaintDomain;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Data;
using System.Linq;
using System;
using IQEApp.Domain.ControlNumberDomain;

namespace IQEApp.Service.CustomerComplaintService
{
    public interface ICustomerComplaintService
    {
        IEnumerable<CustomerComplaintDomainModel> GetComplaintListBySiteId(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder , string fiYear);
        string SaveComplaintDetails(CustomerComplaintDomainModel objMDM);
        DataSet GetComplaintDetailsToAdd(int loginUserSiteId);

        bool IsComplaintExistsAlready(CustomerComplaintDomainModel objMVM);
        DataSet GetComplaintDetailsToEdit(string ComplaintID, int loggedInUser);

        bool UpdateComplaintDetails(CustomerComplaintDomainModel objMDM);

        CustomerComplaintDomainModel GetComplaintFilesByID(string Id);
    }

    public class CustomerComplaintService : ICustomerComplaintService
    {
        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }

        #region Enquiries

        public IEnumerable<CustomerComplaintDomainModel> GetComplaintListBySiteId(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder , string fiYear)
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
            parameter.Add("@fiYear", fiYear);
            return _con.Query<CustomerComplaintDomainModel>("GetCustomerComplaintListBySiteId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public string SaveComplaintDetails(CustomerComplaintDomainModel objCCDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            // parameter.Add("@ComplaintID"               , objCCDM.ComplaintID );
            parameter.Add("@ComplaintIdentifictionNo", objCCDM.ComplaintIdentifictionNo);
            parameter.Add("@ContactPerson", objCCDM.ContactPerson);
            //parameter.Add("@ComplaintTypeId"           , objCCDM.ComplaintTypeId );
            parameter.Add("@ComplaintFullDescrption", objCCDM.ComplaintFullDescrption);
            parameter.Add("@ComplaintReceivedDate", objCCDM.ComplaintReceivedDate);
            // parameter.Add("@IssueDate"                 , objCCDM.IssueDate );
            //parameter.Add("@IssueNo"                   , objCCDM.IssueNo );
            parameter.Add("@CustomerName", objCCDM.CustomerName);
            parameter.Add("@Unit", objCCDM.Unit);
            parameter.Add("@POWO_Number", objCCDM.POWO_Number);
            parameter.Add("@EquipmentOfferedQty", objCCDM.EquipmentOfferedQty);
            parameter.Add("@EquipmentNameQty_Complaint", objCCDM.EquipmentNameQty_Complaint);
            parameter.Add("@ComplaintModeId", objCCDM.ComplaintModeId);
            parameter.Add("@ComplaintRootCause", objCCDM.ComplaintRootCause);

            // parameter.Add("@ResponsiblePartyId"          , objCCDM.ResponsiblePartyId );
            // parameter.Add("@ComplaintRootCause"        , objCCDM.ComplaintRootCause );
            //parameter.Add("@ProposedCorrectiveAction"  , objCCDM.ProposedCorrectiveAction );
            parameter.Add("@CorrectiveActionBy", objCCDM.CorrectiveActionBy);
            parameter.Add("@ComplaintStatusId", objCCDM.ComplaintStatusId);
            parameter.Add("@ClosingDate", objCCDM.ClosingDate);
            parameter.Add("@FileName", objCCDM.FileName);
            parameter.Add("@FilePath", objCCDM.FilePath);
            parameter.Add("@Remarks", objCCDM.Remarks);
            parameter.Add("@CreatedBy", objCCDM.CreatedBy);
            parameter.Add("@SiteId", objCCDM.SiteId);
            // parameter.Add("@WorkScopeIds", objMDM.WorkScopeName);
            return _con.Query<string>("AddCustomerComplaint", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault().ToString();
        }

        public DataSet GetComplaintDetailsToAdd(int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetComplaintDetailsToAdd", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.Add("@SiteId", SqlDbType.Int).Value = loginUserSiteId;
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool IsComplaintExistsAlready(CustomerComplaintDomainModel objMVM)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@ComplaintID", objMVM.ComplaintID);
            //para.Add("@ManufacturerName", objMDM.ManufacturerName.Trim());
            return _con.Query<bool>("IsComplaintExistsAlready", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet GetComplaintDetailsToEdit(string ComplaintID, int loggedInUser)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetComplaintDetailsToEdit", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ComplaintID", ComplaintID);
            cmd.Parameters.AddWithValue("@LoginUserSiteId", loggedInUser);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool UpdateComplaintDetails(CustomerComplaintDomainModel objCCDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ComplaintID", objCCDM.ComplaintID);
            parameter.Add("@ComplaintIdentifictionNo", objCCDM.ComplaintIdentifictionNo);
            parameter.Add("@ContactPerson", objCCDM.ContactPerson);
            //parameter.Add("@ComplaintTypeId", objCCDM.ComplaintTypeId);
            parameter.Add("@ComplaintFullDescrption", objCCDM.ComplaintFullDescrption);
            parameter.Add("@ComplaintReceivedDate", objCCDM.ComplaintReceivedDate);
            //parameter.Add("@IssueDate", objCCDM.IssueDate);
            //parameter.Add("@IssueNo", objCCDM.IssueNo);
            parameter.Add("@CustomerName", objCCDM.CustomerName);
            parameter.Add("@Unit", objCCDM.Unit);
            parameter.Add("@POWO_Number", objCCDM.POWO_Number);
            parameter.Add("@EquipmentOfferedQty", objCCDM.EquipmentOfferedQty);
            parameter.Add("@EquipmentNameQty_Complaint", objCCDM.EquipmentNameQty_Complaint);
            parameter.Add("@ComplaintModeId", objCCDM.ComplaintModeId);
            //parameter.Add("@ResponsiblePartyId", objCCDM.ResponsiblePartyId);
            parameter.Add("@ComplaintRootCause", objCCDM.ComplaintRootCause);
            //parameter.Add("@ProposedCorrectiveAction", objCCDM.ProposedCorrectiveAction);
            parameter.Add("@CorrectiveActionBy", objCCDM.CorrectiveActionBy);
            parameter.Add("@ComplaintStatusId", objCCDM.ComplaintStatusId);
            parameter.Add("@ClosingDate", objCCDM.ClosingDate);
            parameter.Add("@FileName", objCCDM.FileName);
            parameter.Add("@FilePath", objCCDM.FilePath);
            parameter.Add("@Remarks", objCCDM.Remarks);
            //parameter.Add("@Status"                  , objCCDM.Status);
            parameter.Add("@ModifiedBy", objCCDM.CreatedBy);
            parameter.Add("@SiteId", objCCDM.SiteId);

            //parameter.Add("@ComplaintDate", objMDM.ComplaintDate);
            //parameter.Add("@ClientId", objMDM.ClientId);
            //parameter.Add("@ComplaintDetails", objMDM.ComplaintDetails);
            //parameter.Add("@WorkScope", objMDM.WorkScopeName);
            //parameter.Add("@Qualification", objMDM.Qualification);
            //parameter.Add("@MinExperience", objMDM.MinExperience);
            //parameter.Add("@DesiredCompetance", objMDM.DesiredCompetance);
            //parameter.Add("@Quantity", objMDM.Quantity);
            //parameter.Add("@Duration", objMDM.Duration);
            // parameter.Add("@SiteId", objMDM.SiteId);
            return _con.Query<bool>("UpdateComplaintDetailsByComplaintID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UpdateComplaintStatus(CustomerComplaintDomainModel objEDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ComplaintID", objEDM.ComplaintID);
            //  parameter.Add("@Status", objEDM.IsComplaintActive);
            parameter.Add("@ModifiedBy", objEDM.CreatedBy);
            return _con.Query<bool>("UpdateComplaintStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public CustomerComplaintDomainModel GetComplaintFilesByID(string ComplaintID)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ComplaintID", ComplaintID);
            //parameter.Add("@SectionId", SId);
            return _con.Query<CustomerComplaintDomainModel>("GetComplaintFilesByID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        //public bool UploadQuotationByComplaintID(CustomerComplaintDomainModel objEDM)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@ComplaintID", objEDM.ComplaintID);
        //    //parameter.Add("@QuotationNo", objEDM.QuotationNo);
        //    //parameter.Add("@QuotationDate", objEDM.QuotationDate);
        //    //parameter.Add("@FileName", objEDM.FileName);
        //    //parameter.Add("@FilePath", objEDM.FilePath);
        //    parameter.Add("@ModifiedBy", objEDM.CreatedBy);
        //    return _con.Query<bool>("UploadQuotationByComplaintID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        //}

        //public bool SubmitComplaintStatus(CustomerComplaintDomainModel objEDM)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@ComplaintID", objEDM.ComplaintID);
        //    //parameter.Add("@Status", objEDM.SubmitStatus);
        //    //parameter.Add("@Remarks", objEDM.Remarks);
        //    parameter.Add("@ModifiedBy", objEDM.CreatedBy);
        //    return _con.Query<bool>("SubmitComplaintStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        //}
        #endregion Enquiries


    }
}
