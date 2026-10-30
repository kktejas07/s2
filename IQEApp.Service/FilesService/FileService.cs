using Dapper;
using IQEApp.Domain.FilesDomain;
using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.FilesService
{
    public interface IFileService
    {
        FileDomain GetFileDetailsByGUID(Guid Id, int SId);
    }

    public class FileService : IFileService
    {
        #region DbConnection
        private SqlConnection _con;
        string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
        private void Connection()
        {

            _con = new SqlConnection(constring);
        }
        #endregion
        public FileDomain GetFileDetailsByGUID(Guid Id, int SId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@GUId", Id);
            parameter.Add("@SectionId", SId);
            return _con.Query<FileDomain>("GetFileDetailsByGUID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
    }
}
