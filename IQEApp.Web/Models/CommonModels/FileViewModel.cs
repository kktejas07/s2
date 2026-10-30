using AutoMapper;
using IQEApp.Domain.FilesDomain;
using IQEApp.Service.FilesService;
using Microsoft.WindowsAzure.Storage;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Threading.Tasks;

namespace IQEApp.Web.Models.CommonModels
{
    public class FileViewModel : BaseViewModel
    {
        public int FileId { get; set; }

        //FileTitle is original name of the file
        public string FileTitle { get; set; }

        //File link is the name of file which is saved in azure
        public string FileLink { get; set; }
        /// <summary>
        ///FileGuid is the unique id stored in db
        /// </summary>
        public Guid FileGUID { get; set; }
        public double? FileSize { get; set; }
        public int SectionId { get; set; }
        public int GenericId { get; set; }
    }

    public class FileBusinessModel
    {
        public IList<FileViewModel> LstFilesDetails { get; private set; }
        public FileViewModel GetFileDetailsByGUID(IFileService service, Guid Id, int SId)
        {
            FileViewModel files = new FileViewModel();
            var filesInfo = service.GetFileDetailsByGUID(Id, SId);
            Mapper.CreateMap<FileDomain, FileViewModel>();
            files = Mapper.Map<FileDomain, FileViewModel>(filesInfo);
            return files;
        }
        public bool DeleteFileFromAzure(string fileName, int siteId)
        {
            var isDeleted = true;
            if (fileName != null)
            {
                string deleteDataFromAzure = ConfigurationManager.AppSettings["DeleteDataFromAzure"];
                if (deleteDataFromAzure.ToUpper() == "TRUE")
                {
                    try
                    {
                        var storageAccount = CloudStorageAccount.Parse(ConfigurationManager.AppSettings["UserProfilesImages"]);
                        var blobClient = storageAccount.CreateCloudBlobClient();
                        string contName = "site-" + siteId;
                        var container = blobClient.GetContainerReference(contName);

                        if (container.Exists())
                        {
                            fileName = Path.GetFileName(fileName);
                            var blockBlob = container.GetBlockBlobReference(fileName);
                            blockBlob.DeleteIfExists();
                        }

                    }
                    catch (Exception ex)
                    {
                        isDeleted = false;
                    }
                }
            }

            return isDeleted;
        }
        public bool DeleteFileFromAzure(string fileName, string contName)
        {
            //if (siteId == 0)
            //{
            //    siteId = 
            //}
            var isDeleted = true;
            if (fileName != null)
            {
                string deleteDataFromAzure = ConfigurationManager.AppSettings["DeleteDataFromAzure"];
                if (deleteDataFromAzure.ToUpper() == "TRUE")
                {
                    try
                    {
                        var storageAccount = CloudStorageAccount.Parse(ConfigurationManager.AppSettings["UserProfilesImages"]);
                        var blobClient = storageAccount.CreateCloudBlobClient();
                        //string contName = "site-" + siteId;
                        var container = blobClient.GetContainerReference(contName);

                        if (container.Exists())
                        {
                            fileName = Path.GetFileName(fileName);
                            var blockBlob = container.GetBlockBlobReference(fileName);
                            blockBlob.DeleteIfExists();
                        }

                    }
                    catch (Exception ex)
                    {
                        isDeleted = false;
                    }
                }
            }

            return isDeleted;
        }
        public async Task<bool> DeleteFilesFromAzureAsync(string[] fileNames, int siteId)
        {

            if (fileNames != null)
            {
                foreach (var filename in fileNames)
                {
                    this.DeleteFileFromAzure(filename, siteId);
                }
            }
            return true;
        }
    }
}