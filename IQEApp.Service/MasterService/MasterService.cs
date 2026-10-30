using Dapper;
using IQEApp.Domain.MasterDomain;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.MasterService
{
    public interface IMasterService
    {
        IEnumerable<MasterDomainModel> GetMastersDetails(int siteId, int sectionId, bool status);
        IEnumerable<MasterDomainModel> GetMasterDetailsById(int siteId, int sectionId, int masterId);
        bool IsMasterRecordExitsAlready(int sectionId, int siteId, int masterId, string masterName);
        void CreateMaster(MasterDomainModel objMasterDomainModel);
        void UpdateMaster(MasterDomainModel objMasterDomainModel);
        void DeleteOrUndoMasterDetails(int sectionId, int masterId, bool status, int loginUserId);
    }

    public class MasterService : IMasterService
    {
        private SqlConnection con;
        private void connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            con = new SqlConnection(constring);
        }
        public IEnumerable<MasterDomainModel> GetMastersDetails(int siteId, int sectionId, bool status)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@SectionId", sectionId);
            parameter.Add("@Status", status);
            return con.Query<MasterDomainModel>("GetMastersDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<MasterDomainModel> GetMasterDetailsById(int siteId, int sectionId, int masterId)
        {
            connection();
            var para = new DynamicParameters();
            para.Add("@SiteId", siteId);
            para.Add("@SectionId", sectionId);
            para.Add("@MasterId", masterId);
            return con.Query<MasterDomainModel>("GetMasterDetailsById", para, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public bool IsMasterRecordExitsAlready(int sectionId, int siteId, int masterId, string masterName)
        {
            connection();
            var para = new DynamicParameters();
            para.Add("@SiteId", siteId);
            para.Add("@SectionId", sectionId);
            para.Add("@MasterId", masterId);
            para.Add("@MasterName", masterName);
            return con.Query<bool>("IsMasterRecordExitsAlready", para, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public void CreateMaster(MasterDomainModel objMasterDomainModel)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", objMasterDomainModel.SiteId);
            parameter.Add("@SectionId", objMasterDomainModel.SectionId);
            parameter.Add("@MasterName", objMasterDomainModel.MasterName);
            parameter.Add("@LoginUserId", objMasterDomainModel.LoginUserId);
            con.Query("CreateMaster", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public void UpdateMaster(MasterDomainModel objMasterDomainModel)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SectionId", objMasterDomainModel.SectionId);
            parameter.Add("@MasterId", objMasterDomainModel.MasterId);
            parameter.Add("@MasterName", objMasterDomainModel.MasterName);
            parameter.Add("@LoginUserId", objMasterDomainModel.LoginUserId);
            con.Query("UpdateMaster", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public void DeleteOrUndoMasterDetails(int sectionId, int masterId, bool status, int loginUserId)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SectionId", sectionId);
            parameter.Add("@MasterId", masterId);
            parameter.Add("@Status", status);
            parameter.Add("@LoginUserId", loginUserId);
            con.Query("DeleteOrUndoMaster", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
    }
}
