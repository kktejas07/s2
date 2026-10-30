using IQEApp.Domain.CommonDomain;
using IQEApp.Domain.ServiceOrderDomain;
using System;

namespace IQEApp.Domain.ControlNumberDomain
{
    public class ControlNumberDomainModel : BaseDomainModel 
    {
        public int ControlId { get; set; }
        public Guid ControlNumberGuid { get; set; }
        public string ControlNo { get; set; }
        public string ControlNumberComments { get; set; }
        public string EquipmentName { get; set; }
        public int SOId { get; set; }
        public Guid ServiceOrderGuid { get; set; }
        public int POId { get; set; }
        public int PONId { get; set; }
        public int LOISOTypeId { get; set; }
        public string LOINumber { get; set; }
        public string SONumber { get; set; }
        public DateTime? SODate { get; set; }
        public DateTime? SODueDate { get; set; }
        public string ControlNoSONo { get; set; }
        public string ClientName { get; set; }
        public string ClientUnitName { get; set; }
        public int ManufacturerId { get; set; }
        public int ManufacturerUnitId { get; set; }
        public string ManufacturerName { get; set; }
        public string ManufacturerUnitName { get; set; }
        public bool IsCNActive { get; set; }
        public int Total { get; set; }
        public int ControlStatusId { get; set; }
        public string ControlStatusName { get; set; }
        public int ClientId { get; set; }
        public int ClientUnitId { get; set; }
        public int SOType { get; set; }
        public string SOTypeName { get; set; }

        public string CurrencySymbol { get; set; }
        public string Amount { get; set; }
        //public string EnquiryIdRefernce { get; set; }
        public int EID { get; set; }
        public string EnquiryId { get; set; }

        public string FileId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public string EnquiryDetails { get; set; }
        public string Location { get; set; }
        public string WorkScopeName { get; set; }
        public int CreatedBy { get; set; }

        // New flag to force creation of SO in the current financial year instead of reusing next FY SO
        public bool CreateInCurrentFy { get; set; }

    }
}
