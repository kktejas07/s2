using System;

namespace IQEApp.Web.Models
{
    public class RemoteFileInfo : IDisposable
    {
        public string Guid;
        public string FileName;
        public long Length;
        public Int32 SectionId;
        public string Title;
        public string Description;
        public string Data;
        public System.IO.Stream FileByteStream;
        public Int32 userId;
        public Int32 contentId;
        public Int32 ApprovalStatus;
        public string NewTemplateId;
        public string OldTemplateId;
        public string SectionName;
        public Int32 IsAdminContent;
        public Int32 FolderId;
        public Int32 ForumId;
        public Int32 PostId;
        public Int32 NetworkId;
        public void Dispose()
        {
            if (FileByteStream == null) return;
            FileByteStream.Close();
            FileByteStream = null;
        }
    }
}