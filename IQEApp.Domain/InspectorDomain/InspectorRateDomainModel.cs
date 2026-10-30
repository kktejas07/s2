using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IQEApp.Domain.InspectorDomain
{
    public class InspectorRateDomainModel
    {
        public int InspectorId { get; set; }
        public string Name { get; set; }
        public string Discipline { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Country { get; set; }
        public string Source { get; set; }
        public string EmailId { get; set; }
        public string ContactNumber { get; set; }
        public string Currency { get; set; }

        // Charges
        public decimal? InspectionFeePerHour { get; set; }
        public decimal? InspectionFeePerDay { get; set; }
        public decimal? TravelChargesPerHour { get; set; }
        public decimal? TravelChargesLumsum { get; set; }
        public decimal? MileagePerKm { get; set; }
        public decimal? MileageBeyond50Km { get; set; }
        public string OtherCharges { get; set; }
        public string Remarks { get; set; }

        // File Upload
        //public string Upload { get; set; }               // Stored filename (GUID-based name)
        //public string UploadOriginalName { get; set; }   // Original file name for display/download
        //public long? UploadFileSize { get; set; }        // File size (optional)
        //public string UploadFileType { get; set; }       // File extension/type (optional)

        public string UploadFile { get; set; }
        public string FileName { get; set; }
        public string PhysicalFileName { get; set; } // for Backup files downloading
        public string FilePath { get; set; }

        // System Fields
        public int SiteId { get; set; }
        public int CreteadBy { get; set; }
        public DateTime? CreatedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? Total { get; set; }

        // UI helper flag (not mapped to DB)
        public bool IsNew { get; set; }
        //public List<InspectorDocumentDomainModel> ExistingDocuments { get; set; } = new List<InspectorDocumentDomainModel>();

    }
    public class InspectorDocumentDomainModel
    {
        public int DocumentId { get; set; }
        public int InspectorId { get; set; }
        public string FileName { get; set; }          // Original name
        public string FilePath { get; set; }          // Physical or virtual path
        public string PhysicalFileName { get; set; } // for Backup files downloading
        public string UploadedBy { get; set; }
        public DateTime UploadedDate { get; set; }
    }
}
