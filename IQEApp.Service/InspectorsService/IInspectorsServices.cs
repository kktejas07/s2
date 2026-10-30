using Dapper;
using IQEApp.Domain.AssociateDomain;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Domain.InspectorDomain;
using IQEApp.Service.AssociatesService;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IQEApp.Service.InspectorsService
{
    public interface IInspectorsServices
    {
        IEnumerable<InspectorRateDomainModel> GetAllInspectorsDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder);
        IEnumerable<InspectorRateDomainModel> GetInspectorUploadedBackupFiles (int InspectorId);
        bool IsInspectorAlreadyExists(InspectorRateDomainModel objInspectorDomainModel);
        int SaveUpdateInspector(InspectorRateDomainModel model, bool Flag);
        bool SaveInspectorDocument(InspectorRateDomainModel model, bool Flag);
        bool DeleteInspector(int inspectorId, string remarks, int userId);
        DataSet GetInspectorRevisionsFiles(int inspId, int loggedInUser);
        InspectorRateDomainModel GetInspectorFileDetailsByID(int InspectorId, int? FileID, bool backupFile);
    }

    public class InspectorsServices : IInspectorsServices
    {
        private SqlConnection _con;
        private void Connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(constring);
        }

        public IEnumerable<InspectorRateDomainModel> GetAllInspectorsDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@strSearch", strSearch);
            parameter.Add("@alphaChar", alphaChar);
            parameter.Add("@Offset", offset);
            parameter.Add("@Fetch", fetch);
            parameter.Add("@isActive", activeStatus);
            parameter.Add("@SortingOrder", sortingOrder);
            return _con.Query<InspectorRateDomainModel>("GetAllInspectorsDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<InspectorRateDomainModel> GetInspectorUploadedBackupFiles(int InspectorId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InspectorId", InspectorId);
            return _con.Query<InspectorRateDomainModel>("GetInspectorUploadedBackupFiles", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public bool IsInspectorAlreadyExists(InspectorRateDomainModel objInspectorDomainModel)
        {

            Connection();
            var para = new DynamicParameters();
            para.Add("@Name", objInspectorDomainModel.Name);
            para.Add("@Discipline", objInspectorDomainModel.Discipline.Trim());
            para.Add("@City", objInspectorDomainModel.City.Trim());
            para.Add("@Country", objInspectorDomainModel.Country.Trim());
            para.Add("@EmailId", objInspectorDomainModel.EmailId.Trim());
            para.Add("@ContactNumber", objInspectorDomainModel.ContactNumber.Trim());
            return _con.Query<bool>("IsInspectorAlreadyExists", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }

        public int SaveUpdateInspector (InspectorRateDomainModel model, bool Flag)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InspectorId", model.InspectorId);
            parameter.Add("@Name", model.Name);
            parameter.Add("@Discipline", model.Discipline);
            parameter.Add("@City", model.City);
            parameter.Add("@State", model.State);
            parameter.Add("@Country", model.Country);
            parameter.Add("@Source", model.Source);
            parameter.Add("@EmailId", model.EmailId);
            parameter.Add("@ContactNumber", model.ContactNumber);
            parameter.Add("@Currency", model.Currency);
            parameter.Add("@InspectionFeePerHour", model.InspectionFeePerHour);
            parameter.Add("@InspectionFeePerDay", model.InspectionFeePerDay);
            parameter.Add("@TravelChargesPerHour", model.TravelChargesPerHour);
            parameter.Add("@TravelChargesLumsum", model.TravelChargesLumsum);
            parameter.Add("@MileagePerKm", model.MileagePerKm);
            parameter.Add("@MileageBeyond50Km", model.MileageBeyond50Km);
            parameter.Add("@OtherCharges", model.OtherCharges);
            parameter.Add("@Remarks", model.Remarks);
            parameter.Add("@CreatedBy", model.CreteadBy);
            parameter.Add("@Flag", Flag);

            // Execute and get return result (1 for success, -1 for duplicate, etc.)
            return _con.Query<int>("SaveUpdateInspector", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool SaveInspectorDocument(InspectorRateDomainModel model, bool Flag)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InspectorId", model.InspectorId);
            parameter.Add("@FileName", model.FileName);
            parameter.Add("@FilePath", model.FilePath);
            parameter.Add("@CreatedBy", model.CreteadBy);
            parameter.Add("@Flag", Flag);

            // Execute and get return result (1 for success, -1 for duplicate, etc.)
            return _con.Query<bool>("SaveInspectorDocument", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet GetInspectorRevisionsFiles(int inspId, int loggedInUser)
        {
            using (SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString))
            using (SqlCommand cmd = new SqlCommand("GetInspectorRevisionsFiles", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@InspectorId", inspId);
                cmd.Parameters.AddWithValue("@SiteId", loggedInUser);

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);
                return ds;
            }
        }

        public bool DeleteInspector(int inspectorId, string remarks, int userId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InspectorId", inspectorId);
            parameter.Add("@Remarks", remarks);
            parameter.Add("@ModifiedBy", userId);
            return _con.Query<bool>("DeleteInspector", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public InspectorRateDomainModel GetInspectorFileDetailsByID(int InspectorId, int? FileID, bool backupFile)
        {
            Connection();
            var parameter = new DynamicParameters();
            //parameter.Add("@InspectorId", InspectorId);
            parameter.Add("@FileID", FileID);
            parameter.Add("@backupFile", backupFile);
            return _con.Query<InspectorRateDomainModel>("GetInspectorFileDetailsByID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
    }
}
