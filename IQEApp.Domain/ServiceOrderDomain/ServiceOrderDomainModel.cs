using IQEApp.Domain.CommonDomain;
using System;
using System.Collections.Generic;

namespace IQEApp.Domain.ServiceOrderDomain
{
    public class ServiceOrderDomainModel : BaseDomainModel
    {
        public int SOId { get; set; }
        public int ControlId { get; set; }

        public string ControlNo { get; set; }
        public Guid ServiceOrderGuid { get; set; }

        public int LOISOType { get; set; }

        public string LOINumber { get; set; }
        public string SONumber { get; set; }

        public int SOType { get; set; }
        public string OtherSOType { get; set; }
        public string ServiceOrderTypeName { get; set; }
        public DateTime? SODate { get; set; }
        public DateTime? SODueDate { get; set; }
        public int ClientId { get; set; }
        public int ClientUnitId { get; set; }
        public string ClientName { get; set; }
        public string ClientUnitName { get; set; }
        public int ManufacturerId { get; set; }
        public List<int> LstManufacturerIds { get; set; }
        public int ManufacturerUnitId { get; set; }
        public List<int> LstManufacturerUnitIds { get; set; }
        public string ManufacturerUnitIds { get; set; }
        public string ManufacturerName { get; set; }
        public string ManufacturerUnitName { get; set; }
        public int POID { get; set; }
        public string PONumber { get; set; }
        public string POIDs { get; set; }
        public List<int> LstPOIDs { get; set; }
        public string SOComments { get; set; }

        public int CurrencyId { get; set; }
        public string Amount { get; set; }
        public int Total { get; set; }
        public bool IsSOActive { get; set; }
        public string ContactPersonName { get; set; }
        public string ContactPersonDesignation { get; set; }
        public string ProjectNumber { get; set; }
        public string ProjectName { get; set; }
        public int EID { get; set; }
        public string EnquiryIdRefernce { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public int CreatedBy { get; set; }
        public int ModifiedBy { get; set; }

    }
}
