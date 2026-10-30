using System;
using System.ComponentModel;

namespace IQEApp.Web.Models.CommonModels
{
    public class TravelExpensesModel
    {
        public int ExpenseId { get; set; }
        public int VEMId { get; set; }
        public int TravelTypeId { get; set; }
        [DisplayName("Expense Type")]
        public string TravelType { get; set; }
        [DisplayName("From Date")]
        public DateTime FromDate { get; set; }
        [DisplayName("To Date")]
        public DateTime ToDate { get; set; }
        [DisplayName("Travel KM")]
        public int TravelKM { get; set; }
        [DisplayName("Expenses")]
        public int Expenses { get; set; }
    }
}