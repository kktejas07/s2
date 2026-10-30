using IQEApp.Domain.CommonDomain;
using System;
using System.Collections.Generic;
using System.ComponentModel;

namespace IQEApp.Domain.HomeDomain
{
    public class HomeDomainModel : BaseDomainModel
    {
        public int VisitId { get; set; }
        public int VisitPId { get; set; }
        public string VisitSeqId { get; set; }
        public string SONumber { get; set; }
        public int POID { get; set; }
        public int PONID { get; set; }
        public string PONumber { get; set; }
        //public DateTime PODate { get; set; }
        public string PODate { get; set; }
        public DateTime? ScheduleDate { get; set; }
        public DateTime? VisitDate { get; set; }
        public string ScheduleComments { get; set; }
        public string ControlNo { get; set; }
        public string ControlNumberComments { get; set; }
        public Guid ControlNumberGuid { get; set; }
        public string ClientName { get; set; }
        public string ClientUnitName { get; set; }
        public string ClientAddress { get; set; }
        public string ClientState { get; set; }
        public string ClientCountry { get; set; }
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }
        public string SubManufacturerDetails { get; set; }
        
        public string ManufacturerUnitName { get; set; }
        public string ManufacturerAddress { get; set; }
        public string ManufacturerState { get; set; }
        public string ManufacturerCountry { get; set; }
        public int VEM_ID { get; set; }
        public Guid VisitGuid { get; set; }
        public int VisitStatusId { get; set; }
        public string VisitStatusName { get; set; }
        public bool IsClaimInitiated { get; set; }
        public string UserFullName { get; set; }
        public string InspReportNo { get; set; }
        public DateTime? InspReportDate { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public bool InspReportStatus { get; set; }
        public bool QulalityCheck { get; set; }
        public DateTime QulalityCheckSubmitDate { get; set; }
        public int QualityCheckDoneBy { get; set; }
        public DateTime ReportSubmittedClientDate { get; set; }
        public bool ReportSubmittedClientStatus { get; set; }
        public string Comments { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string VisitLocation { get; set; }

        // NEW: holds the VisitSeqId of the visit that already has reports (e.g. "25V101")
        public string ReferenceVisitSeqId { get; set; }

        public double CostValue { get; set; }
        public int CountryId { get; set; }
        public int StateId { get; set; }
        public string StateName { get; set; }

        public int ProspectiveCount { get; set; }
        public string PONIds { get; set; }

        // ISO 9001:2026 & ISO/IEC 17020:2026 Compliance Metadata
        public string StandardReference { get; set; } = "ISO 9001:2026 & ISO/IEC 17020:2026";
        public string EnvironmentalSiteCondition { get; set; }
        public bool ImpartialityDeclared { get; set; } = true;
    }
    public class VisitsSummaryDomainModel
    {
        public int VisitStatusId { get; set; }
        public string VisitStatus { get; set; }
        public int VisitCount { get; set; }
    }

    public class InspectionReportDomainModel 
    {
        public string BaseInspReportNo { get; set; }
        public string InspReportNo { get; set; }
        public DateTime InspReportDate { get; set; }
        public int PONId { get; set; }
        public int POItemId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public bool InspReportStatus { get; set; }
        public bool QulalityCheck { get; set; }
        public int VisitId { get; set; }
        public DateTime VisitedFrom { get; set; }
        public DateTime VisitedTo { get; set; }
        public int ModifiedBy { get; set; }
        public int CreatedBy { get; set; }
        public int LoginUserId { get; set; }
        public string StandardReference { get; set; } = "ISO 9001:2026 & ISO/IEC 17020:2026";
        public string EnvironmentalSiteCondition { get; set; }
        public bool ImpartialityDeclared { get; set; } = true;
        public List<POInspectionDomainItem> LstPONumbers { get; set; }
    }

    public class POInspectionDomainItem
    {
        public int PONId { get; set; }

        public string PONumber { get; set; }

        public string InspReportNo { get; set; }

        public DateTime VisitedFrom { get; set; }
        public DateTime VisitedTo { get; set; }
        public List<string> FileNames { get; set; } = new List<string>(); // Manual binding required
    }


}
