using System;
using System.Collections.Generic;

namespace IQEApp.Domain.PurchaseOrderDomain
{
    public class PurchaseOrderDomainModel
    {
        public int POId { get; set; }
        public string PurchaseId { get; set; }
        public int PONId { get; set; }
        public Guid POGuid { get; set; }
        public string PONumber { get; set; }
        public DateTime? PoDate { get; set; }
        public int SiteId { get; set; }
        public string POComments { get; set; }
        public int ClientId { get; set; }
        public int ClientUnitId { get; set; }
        public int ManufacturerId { get; set; }
        public int ManufacturerUnitId { get; set; }
        public string ManufacturerUnitIds { get; set; }
        public List<int> LstManufacturerUnitIds { get; set; }
        public string ClientName { get; set; }
        public string ManufacturerName { get; set; }
        public string ClientUnitName { get; set; }
        public string ManufacturerUnitName { get; set; }
        public bool IsPOActive { get; set; }
        public int LoggedInUser { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int TotalItems { get; set; }
        public int Total { get; set; }
        public int PageCount { get; set; }
        public string ControlNo { get; set; }
        public string ControlNoSONo { get; set; }
    }
}
