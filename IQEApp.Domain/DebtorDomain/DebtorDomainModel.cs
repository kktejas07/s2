using System;

namespace IQEApp.Domain.DebtorDomain
{
    public class DebtorDomainModel
    {
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public int ClientUnitId { get; set; }
        public Guid ClientUnitGuid { get; set; }
        public string ClientUnitName { get; set; }
        public double TotalDue { get; set; }
        public double TotalCredit { get; set; }
        public double Upto30 { get; set; }
        public double Upto60 { get; set; }
        public double Upto90 { get; set; }
        public double Upto180 { get; set; }
        public double Upto365 { get; set; }
        public double Above1Year { get; set; }
    }
}
