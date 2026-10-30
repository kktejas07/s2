using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.UserModel;
using System;
using System.Collections.Generic;

namespace IQEApp.Web.Models.Reports
{
    public class ReportsViewModel
    {

    }

    public class ReportFiltersViewModel : BaseViewModel
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public int EngineerId { get; set; }
        public string EngineerName { get; set; }
        public int Status { get; set; }
        public List<ClientViewModel> LstClients { get; set; }
        public List<UserViewModel> LstEngineers { get; set; }
    }
}