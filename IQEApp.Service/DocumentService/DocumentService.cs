using Dapper;
using DocumentFormat.OpenXml.Office.Word;
using DocumentFormat.OpenXml.Office2010.Word;
using IQEApp.Domain.CustomerComplaintDomain;
using IQEApp.Domain.DocumentDomain;
using IQEApp.Domain.ServiceOrderDomain;
using IQEApp.Domain.UserDomain;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.DocumentService
{
    public interface IDocumentService
    {
        IEnumerable<DocumentDomainModel> GetDocumentsListBySiteId(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string level);
        DataSet GetDocumentDetailsToAdd(int loginUserSiteId);
        string GetLastRevisionNo(int documentID);
        DataSet GetDocumentDetailsToEdit(int documentId, int loggedInUser);
        int SaveDocumentDetails(DocumentDomainModel objDDM);
        int UpdateDocumentsByDocId(DocumentDomainModel obj);
        DocumentDomainModel GetDocumentFilesByID(int documentId, string fileName, bool backupFile, int loggedInUser);
        bool DocumentUploadedByDocId(DocumentDomainModel objSODM, bool Flag);
        IEnumerable<DocumentDomainModel> DocumentsBackupFilesByDocId(int DocumentId);
        int UpdateBackupFileName(int documentId, string newFileName, string filepath);
    }

    public class DocumentService : IDocumentService
    {
        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }
        public IEnumerable<DocumentDomainModel> GetDocumentsListBySiteId(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder , string level)
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
            parameter.Add("@Level", level);
            return _con.Query<DocumentDomainModel>("GetDocumentsListBySiteId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public DataSet GetDocumentDetailsToAdd(int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetDocumentDetailsToAdd", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@loginUserSiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public int SaveDocumentDetails(DocumentDomainModel objDDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@CategoryId", objDDM.CategoryId);
            parameter.Add("@DocumentName",  objDDM.DocumentName.Trim());
            parameter.Add("@DocumentNumber"   ,  objDDM.DocumentNumber.Trim());
            parameter.Add("@IssueNo"          ,  objDDM.IssueNo.Trim());
            parameter.Add("@IssueDate", objDDM.IssueDate);
            //parameter.Add("@RevisionNo", objDDM.RevisionNo);
            parameter.Add("@RevisionDate", objDDM.RevisionDate);
            parameter.Add("@Responsibility"   ,  objDDM.Responsibility.Trim());
            parameter.Add("@RetentionPeriod"  ,  objDDM.RetentionPeriod.Trim());
            //parameter.Add("@FileName", objDDM.DocumentFileName);
            //parameter.Add("@FilePath", objDDM.DocumentFilePath);
            parameter.Add("@SiteId", objDDM.SiteId);
            parameter.Add("@LoggedInUser", objDDM.LoginUserId);
            return _con.Query<int>("SaveDocumentDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool DocumentUploadedByDocId(DocumentDomainModel objDDM, bool Flag)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@DocumentId", objDDM.DocumentId);
            // parameter.Add("@QuotationNo", objEDM.QuotationNo);
            // parameter.Add("@QuotationDate", objEDM.QuotationDate);
            parameter.Add("@FileName", objDDM.FileName);
            parameter.Add("@FilePath", objDDM.FilePath);
            parameter.Add("@CreatedBy", objDDM.CreatedBy);
            parameter.Add("@RevisionNo", objDDM.RevisionNo);
            parameter.Add("@Flag", Flag);
            return _con.Query<bool>("DocumentUploadedByDocId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet GetDocumentDetailsToEdit(int documentId, int loggedInUser)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetDocumentDetailsToEdit1", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@DocumentId", documentId);
            cmd.Parameters.AddWithValue("@SiteId", loggedInUser);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public string GetLastRevisionNo(int documentID)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@documentID", documentID);
            return _con.Query<string>("GetLastRevisionNo", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DocumentDomainModel GetDocumentFilesByID(int documentID,string fileName, bool backupFile, int loggedInUser)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@documentID", documentID);
            parameter.Add("@SiteId", loggedInUser);
            parameter.Add("@fileName", fileName);
            parameter.Add("@backupFile", backupFile);
            return _con.Query<DocumentDomainModel>("GetDocumentFilesByID1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public int UpdateDocumentsByDocId (DocumentDomainModel objDDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@DocumentId", objDDM.DocumentId);
            parameter.Add("@CategoryId", objDDM.CategoryId);
            parameter.Add("@DocumentName", objDDM.DocumentName.Trim());
            parameter.Add("@DocumentNumber", objDDM.DocumentNumber.Trim());
            parameter.Add("@IssueNo", objDDM.IssueNo.Trim());
            parameter.Add("@IssueDate", objDDM.IssueDate);
        //    parameter.Add("@RevisionNo", objDDM.RevisionNo);
            parameter.Add("@RevisionDate", objDDM.RevisionDate);
            parameter.Add("@Responsibility", objDDM.Responsibility.Trim());
            parameter.Add("@RetentionPeriod", objDDM.RetentionPeriod.Trim());
            parameter.Add("@SiteId", objDDM.SiteId);
            parameter.Add("@ModifiedBy", objDDM.LoginUserId);
            return _con.Query<int>("UpdateDocumentsByDocId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public IEnumerable<DocumentDomainModel> DocumentsBackupFilesByDocId(int DocumentId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@DocumentId", DocumentId);
            return _con.Query<DocumentDomainModel>("DocumentsBackupFilesByDocId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public int UpdateBackupFileName(int documentId, string fileName, string filePath)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@DocumentId", documentId);
            parameter.Add("@FileName", fileName.Trim());
            parameter.Add("@FilePath", filePath.Trim());
            return _con.Query<int>("UpdateBackupFileName", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

    }
}
