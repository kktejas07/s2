namespace IQEApp.Domain.CommonDomain
{
    public class CommonDomainModel
    {

        public class CountryDomainModel
        {
            public int CountryId { get; set; }
            public string CountryName { get; set; }
        }
        public class StateDomainModel
        {
            public int StateId { get; set; }
            public string StateName { get; set; }
            public int CountryId { get; set; }
        }

        public class PONumbers
        {
            public int PONId { get; set; }
            public string PONumber { get; set; }

        }
    }
}
