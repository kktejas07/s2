using System;

namespace IQEApp.Domain.ReportDomain
{
    public class ReportsDomainModel
    {
    }
    public class ReportFiltersDomainModel
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public int EngineerId { get; set; }
        public string EngineerName { get; set; }
        public int Status { get; set; }
    }
}
