using IQEApp.Domain.CommonDomain;
using System;

namespace IQEApp.Domain.FilesDomain
{
    public class FileDomain : BaseDomainModel
    {
        public int FileId { get; set; }
        public string FileTitle { get; set; }
        public string FileLink { get; set; }
        public Guid FileGUID { get; set; }
        public double? FileSize { get; set; }
        public int SectionId { get; set; }
        public int GenericId { get; set; }
    }
}
