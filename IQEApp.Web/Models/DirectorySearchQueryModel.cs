using System;
using System.Configuration;

namespace IQEApp.Web.Models
{
    public class DirectorySearchQueryModel
    {
        public DirectorySearchQueryModel()
        {
            PageCount = 0;
            FetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            StrSearch = string.Empty;
            AlphaSearch = string.Empty;
            ActiveStatus = true;
            SortingOrder = "Desc";
            FIYear = string.Empty;
            Month = string.Empty;
        }
        public int SiteId { get; set; }
        public int PageCount { get; set; }
        public int FetchCount { get; set; }
        public string StrSearch { get; set; }
        public string AlphaSearch { get; set; }
        public bool ActiveStatus { get; set; }
        public string SortingOrder { get; set; }
        public string FIYear { get; set; }
        public string Month { get; set; }
    }
}