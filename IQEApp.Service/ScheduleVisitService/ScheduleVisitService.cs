using System;
using System.Collections.Generic;
using IQEApp.Domain.ScheduleVisitDomain;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IQEApp.Service.ControlNumberService;
using System.Configuration;
using System.Data.SqlClient;

namespace IQEApp.Service.ScheduleVisitService
{
    public interface IScheduleVisitService
    {

    }

    public class ScheduleVisitService : IScheduleVisitService
    {
        #region DBConnection

        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }
        #endregion
    }
}
