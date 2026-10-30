using ClosedXML.Excel;
using DocumentFormat.OpenXml.EMMA;
using IQEApp.Service.CompetanceService;
using IQEApp.Service.SecurityService;
using IQEApp.Service.UserService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.CompetanceModel;
//using WebIndiaApp.Domain.UserDomain;
using IQEApp.Web.Models.UserModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Transactions;
using System.Web;
using System.Web.Mvc;
using System.Web.Services.Description;
using System.Globalization;
using MoreLinq;
namespace IQEApp.Web.Controllers
{
    //   [CustomAuthorize(Roles = "Super Admin Role, Admin Role, Technician Role, Coordinator Role, Quality Check Role, Finance Role")]
    public class UserController : BaseController
    {
        private readonly IUserService _userService;
        private readonly ISecurityService _securityService;
        UserBusinessModel objUserBusinessModel = new UserBusinessModel();
        private readonly ICompetanceService _competanceService;
        CompetanceBusinessModel objCompetanceBusinessModel = new CompetanceBusinessModel();

        public UserController()
        {
            _userService = new UserService();
            _securityService = new SecurityService();
            _competanceService = new CompetanceService();
            //SingletonScreenFeatureMapping.SetScreenFeatureMapping(CurrentUser.RoleId.FirstOrDefault(), _securityService);
        }
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.MenuAdmin, CurrentUser.RoleId.FirstOrDefault()))
            {
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                try
                {
                    List<UserViewModel> list = new List<UserViewModel>();
                    CurrentUser.SetUserViewModuleType(UserViewModuleType.Employee);
                    //Default value of records is true since we are loading active records on page load
                    list = objUserBusinessModel.GetUserListDetails(CurrentUser.SiteId, true,false, "", "", "", 0, defaultFetchCount, "", _userService);

                    if (list.Count > 0)
                    {
                        ViewBag.Total = list.FirstOrDefault().Total;
                        ViewBag.UserType = CurrentUser.UserRoles[0];
                        ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
                        ViewBag.CurrentPageCount = 10;
                    }
                    else
                    {
                        ViewBag.Total = 0;
                        ViewBag.CurrentPageCount = 10;
                    }
                    return View("UserDetails", list);
                }
                catch (Exception ex)
                {
                    errorLogObj.LogError("User - Index", ex);
                }
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        //private void ReassignSequence(List<UserViewModel> users, string type)
        //{
        //    for (int i = 0; i < users.Count; i++)
        //    {
        //        users[i].EmployeeCode = $"IQE/{type}/{(i + 1).ToString("D3")}";
        //    }
        //}
        [Authorize]
        public ActionResult DownloadFile(string userId, string FileName)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.EnquiryEdit, CurrentUser.RoleId.FirstOrDefault()))
            {

                bool retVal = true;
                //string fileContainerPath = ConfigurationManager.AppSettings["storagePath"];
                UserViewModel fileInfo = new UserViewModel();
                //ControlNumberBusinessModel objFiles = new ControlNumberBusinessModel();
                fileInfo = objUserBusinessModel.GetUserResumeByID(_userService, userId, FileName);
                if (!string.IsNullOrEmpty(fileInfo.FileName))
                {
                    string DownloadFileName = System.IO.Path.GetFileName(fileInfo.FilePath);
                    var DownloadFileData = System.IO.File.ReadAllBytes(fileInfo.FilePath);

                    //System.IO.Path.GetFileName(fileInfo.FileName);
                    Response.Clear();
                    Response.Buffer = true;
                    Response.Charset = "";
                    Response.Cache.SetCacheability(HttpCacheability.NoCache);
                    Response.ContentType = "application/*";
                    Response.AppendHeader("Content-Disposition", "attachment; filename=" + DownloadFileName);
                    Response.BinaryWrite(DownloadFileData);
                    Response.Flush();
                    Response.End();

                }

            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }
        public ActionResult UserList(string UserType, bool isUserActive,bool isSecondment, int pageCount = 0, string strSearch = "", string alphaSearch = "", string sortingOrder = "", int? CountryId=0)
        {
            if (UserType == null)
                UserType = "";
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            List<UserViewModel> list = new List<UserViewModel>();
            List<CompetanceViewModel> list1 = new List<CompetanceViewModel>();
            try
            {
                if (UserType == "Competance" || UserType == "Competance1" )
                {
                    list1 = objCompetanceBusinessModel.GetCompetanceListDetails(CurrentUser.SiteId, isUserActive, UserType, strSearch, alphaSearch, pageCount, defaultFetchCount, sortingOrder, CountryId, _competanceService);
                    if (list1.Count > 0)
                    {
                        ViewBag.Total = list1.FirstOrDefault().Total;
                        ViewBag.UserType = CurrentUser.UserRoles[0];
                        pageCount += defaultFetchCount;
                        ViewBag.CurrentPageCount = pageCount;
                    }

                    else
                    {
                        ViewBag.Total = 0;
                        ViewBag.CurrentPageCount = 0;
                    }
                    return PartialView("_CompetanceDetails1", list1);
                }
                else
                {
                    list = objUserBusinessModel.GetUserListDetails(CurrentUser.SiteId, isUserActive, isSecondment, UserType, strSearch, alphaSearch, pageCount, defaultFetchCount, sortingOrder, _userService);
                
                    if (list.Count > 0)
                    {
                        ViewBag.Total = list.FirstOrDefault().Total;
                        ViewBag.UserType = CurrentUser.UserRoles[0];
                        pageCount += defaultFetchCount;
                        ViewBag.CurrentPageCount = pageCount;
                    }
                    else
                    {
                        ViewBag.Total = 0;
                        ViewBag.CurrentPageCount = 0;
                    }
                    return PartialView("_UserDirectory", list);
                }
                
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("UserList", ex);
            }
            return null;
        }

        public ActionResult UserTypeList(string UserType, int pageCount = 0, string strSearch = "", string alphaSearch = "", string sortingOrder = "ASC")
        {
            bool isUserActive=true, isSecondment=false;
            if (UserType == "InActive")
            { 
             isUserActive = false;

           }
            if (UserType == "Secondment")
            {
                isSecondment = true;
            }

            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            List<UserViewModel> list = new List<UserViewModel>();
            try
            {
                list = objUserBusinessModel.GetUserListDetails(CurrentUser.SiteId, isUserActive, isSecondment, UserType, strSearch, alphaSearch, pageCount, defaultFetchCount, sortingOrder, _userService);
                if (list.Count > 0)
                {
                    ViewBag.Total = list.FirstOrDefault().Total;
                    ViewBag.UserType = CurrentUser.UserRoles[0];
                    pageCount += defaultFetchCount;
                    ViewBag.CurrentPageCount = pageCount;
                }
                else
                {
                    ViewBag.Total = 0;
                    ViewBag.CurrentPageCount = 0;
                }
                return PartialView("_UserDirectory", list);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("UserList", ex);
            }
            return null;
        }
        public ActionResult AddUser()
        {
            try
            {
                UserDetailsModel objUserDetailsViewModel = new UserDetailsModel();
                UserBusinessModel objUserBusinessModel = new UserBusinessModel();
                //To fetch all the values to fill drop down
                objUserDetailsViewModel = objUserBusinessModel.GetEmployeeDetailsToAdd(CurrentUser.SiteId, _userService);
                objUserDetailsViewModel.SiteId = CurrentUser.SiteId;
                objUserDetailsViewModel.LstAssociates = new List<CommonModel.AssociateModel>();
                objUserDetailsViewModel.LstAssociateContactPerson = new List<CommonModel.AssoicateContactPersonModel>();
                return PartialView("_AddUser", objUserDetailsViewModel);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("AddUser", ex);
            }
            return null;
        }

        [HttpPost]
        public ActionResult CreateUser1(UserViewModel objUserViewModel, HttpPostedFileBase filePhoto, List<HttpPostedFileBase> files)
        {
            var isSuccess = false;
            int UserId=0;
            string message = null;
            try
            {
                if (objUserViewModel.LoginName == null)
                    objUserViewModel.LoginName = "";

                int userVal = 0;
                if (objUserViewModel != null && objUserViewModel.UserTypeId != 3)
                {
                    userVal = objUserBusinessModel.CheckUserExistsOrNot(objUserViewModel, _userService);
                }
                if (objUserViewModel.SkillSetIds == null || !objUserViewModel.SkillSetIds.Contains(9))
                {
                    objUserViewModel.OtherProfessional = "";
                }
                if (userVal == 0)
                {
                    objUserViewModel.SiteId = CurrentUser.SiteId;
                    objUserViewModel.LoginUserId = CurrentUser.UserId;
                   // objUserBusinessModel.CreateUser(objUserViewModel, _userService);
                    //isSuccess = true;


                    using (TransactionScope Transcope = new TransactionScope())
                    {
                        try
                        {
                            if (objUserViewModel.UserImageGUID != null) //&& objUserViewModel.UploadPhoto.ContentLength > 0
                            {
                                objUserViewModel.UserImagePath = Path.Combine(ConfigurationManager.AppSettings["UserProfilesImages"], objUserViewModel.UserImageGUID);
                            }
                            UserId = objUserBusinessModel.CreateUser(objUserViewModel, _userService);
                            if (UserId > 0)
                                isSuccess = true;

                            //if (UserId >0 && objUserViewModel.UploadResume != null)
                            //{
                            //    objUserViewModel.UserId = UserId;
                            //    foreach (var file in objUserViewModel.UploadResume)
                            //    {
                            //        var Flag = false;
                            //        if (file.ContentLength > 0)
                            //        {
                            //            objUserViewModel.FileName = Path.GetFileName(file.FileName);
                            //            objUserViewModel.FilePath = Url.Content(Path.Combine(ConfigurationManager.AppSettings["UserProfilesPath"], file.FileName));
                            //            isSuccess = objUserBusinessModel.UploadedResumeByUserID(objUserViewModel, Flag, _userService);
                            //            Flag = true;
                            //            if (isSuccess)
                            //                file.SaveAs(objUserViewModel.FilePath);
                            //        }
                            //    }
                            //}
                            Transcope.Complete();
                            Transcope.Dispose();
                        }
                        catch (TransactionException ex)
                        {
                            Transcope.Dispose();

                        }

                    }



                    return Json(new { status = isSuccess, message = "Sucess" }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    message = "LoginName already exists";
                    return Json(new { status = isSuccess, message = message }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("CreateUser", ex);
            }
            return Json(new { status = isSuccess, message = "Fail" }, JsonRequestBehavior.AllowGet);
        }

        //UserViewModel objUserViewModel, HttpPostedFileBase fileImage, List<HttpPostedFileBase> UploadResume, List<string> ExistingFiles,
        //           List<string> ExistingValidityDates, List<string> NewCredentials,    List<string> NewValidityDates, List<string> RemovedFiles
        [HttpPost]
        public ActionResult CreateUser(UserViewModel objUserViewModel, HttpPostedFileBase filePhoto, List<HttpPostedFileBase> NewCredentials, List<string> NewValidityDates)
        {
            var isSuccess = false;
            int UserId = 0;
            string message = null;

            try
            {
                if (string.IsNullOrWhiteSpace(objUserViewModel.LoginName))
                    objUserViewModel.LoginName = "";

                int userVal = 0;
                if (objUserViewModel != null && objUserViewModel.UserTypeId != 3)
                {
                    userVal = objUserBusinessModel.CheckUserExistsOrNot(objUserViewModel, _userService);
                }

                if (objUserViewModel.SkillSetIds == null || !objUserViewModel.SkillSetIds.Contains(9))
                {
                    objUserViewModel.OtherProfessional = "";
                }

                if (userVal == 0)
                {
                    objUserViewModel.SiteId = CurrentUser.SiteId;
                    objUserViewModel.LoginUserId = CurrentUser.UserId;

                    using (TransactionScope Transcope = new TransactionScope())
                    {
                        try
                        {
                            if (!string.IsNullOrWhiteSpace(objUserViewModel.UserImageGUID) && objUserViewModel.UserImageGUID != "0")
                            {
                                objUserViewModel.UserImagePath = Path.Combine(ConfigurationManager.AppSettings["UserProfilesImages"], objUserViewModel.UserImageGUID);
                            }

                            UserId = objUserBusinessModel.CreateUser(objUserViewModel, _userService);
                            if (UserId > 0)
                                isSuccess = true;

                            if (UserId > 0 && NewCredentials != null && NewCredentials.Count > 0)
                            {
                                objUserViewModel.UserId = UserId;
                                var Flag = false;
                                for (int i = 0; i < NewCredentials.Count; i++)
                                {
                                    var file = NewCredentials[i]; // Now correctly handling file uploads
                                    

                                    if (file != null && file.ContentLength > 0)
                                    {
                                        objUserViewModel.FileName = Path.GetFileName(file.FileName);
                                        //string uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}"; // Ensure unique file name
                                        objUserViewModel.FilePath = Path.Combine(ConfigurationManager.AppSettings["UserProfilesPath"], objUserViewModel.FileName);

                                        // Assign validity date if available
                                        if (NewValidityDates != null && i < NewValidityDates.Count)
                                        {
                                            string dateString = NewValidityDates[i]?.Trim();
                                            if (!string.IsNullOrEmpty(dateString) && dateString != ",,")
                                            {
                                                if (DateTime.TryParseExact(dateString, "dd-MM-yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDate))
                                                {
                                                    objUserViewModel.Validity = parsedDate;
                                                }
                                                else
                                                {
                                                    objUserViewModel.Validity = null; // Handle invalid date formats
                                                }
                                            }
                                            else
                                            {
                                                objUserViewModel.Validity = null;
                                            }
                                        }

                                        // Save file details in DB
                                        isSuccess = objUserBusinessModel.UploadedResumeByUserID(objUserViewModel, Flag, _userService);
                                        Flag = true; // Update flag after first save attempt

                                        // Save file to server
                                        string savePath = objUserViewModel.FilePath;
                                        file.SaveAs(savePath);
                                    }
                                }
                            }

                            Transcope.Complete();
                        }
                        catch (TransactionException ex)
                        {
                            errorLogObj.LogError("CreateUser - TransactionException", ex);
                        }
                    }

                    return Json(new { status = isSuccess, message = "Success" }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    message = "LoginName already exists";
                    return Json(new { status = isSuccess, message = message }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("CreateUser", ex);
            }

            return Json(new { status = isSuccess, message = "Fail" }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult EditUser(Guid userGuid)
        {
            try
            {
                UserDetailsModel objUserDetailsViewModel = new UserDetailsModel();
                UserBusinessModel objUserBusinessModel = new UserBusinessModel();
                //To fetch all the values to fill drop down
                objUserDetailsViewModel = objUserBusinessModel.GetEmployeeDetailsToEdit(userGuid, CurrentUser.SiteId, _userService);

                 objUserDetailsViewModel.SiteId = CurrentUser.SiteId;


                //objUserDetailsViewModel.LstAssociates = new List<CommonModel.AssociateModel>();
                if (objUserDetailsViewModel.IsEmpannlementflag == false)
                {
                    ViewBag.Empannlementflag = false;
                    objUserDetailsViewModel.LstCurrencyType = new List<CommonModel.CurrencyTypeModel>();
                }
                else if (objUserDetailsViewModel.IsEmpannlementflag == true)
                    ViewBag.Empannlementflag = true;

                return PartialView("_EditUser", objUserDetailsViewModel);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("EditUser", ex);
            }
            return null;
        }
        public ActionResult GetUserImage(int userId)
        {
            var userImage = _userService.GetUserDetailsByUserId(userId); // Replace with your service call to fetch image data
            if (userImage != null && (userImage.UserImagePath != null && userImage.UserImagePath != ""))
            {
                return File(userImage.UserImagePath, "image/jpeg");
                //return File(userImage.UserImage, userImage.ContentType); // For binary data stored in DB
                                                                         // OR
                                                                         // return File(userImage.FilePath, "image/jpeg"); // For file path stored in DB
            }
            return null;
        }

    [HttpPost]
    public ActionResult UpdateUser(UserViewModel objUserViewModel,  HttpPostedFileBase fileImage, List<HttpPostedFileBase> UploadResume, List<string> ExistingFiles,
                   List<string> ExistingValidityDates,    List<string> NewCredentials,    List<string> NewValidityDates,    List<string> RemovedFiles)
        {
            var isSuccess = false;
            var isfileSuccess = false;
            try
            {
                int userVal = 0;
                string message = null;

                if (objUserViewModel != null && objUserViewModel.UserTypeId != 3)
                {
                    userVal = objUserBusinessModel.CheckUserExistsOrNot(objUserViewModel, _userService);
                }

                if (userVal == 0)
                {
                    bool empanelmentFlag = objUserViewModel.IsEmpannlementflag;
                    objUserViewModel.LoginUserId = CurrentUser.UserId;

                    // Set User Image Path
                    objUserViewModel.UserImagePath =  (!string.IsNullOrEmpty(objUserViewModel.UserImageGUID) && objUserViewModel.UserImageGUID != "0")
                                                     ? Path.Combine(ConfigurationManager.AppSettings["UserProfilesImages"], objUserViewModel.UserImageGUID) : "";


                    // Clear 'OtherProfessional' if skill not selected
                    if (objUserViewModel.SkillSetIds == null || !objUserViewModel.SkillSetIds.Contains(9))
                    {
                        objUserViewModel.OtherProfessional = "";
                    }

                    isSuccess = objUserBusinessModel.UpdateUser(objUserViewModel, empanelmentFlag, _userService);

                    if (isSuccess)
                    {
                        using (TransactionScope tranScope = new TransactionScope())
                        {
                            try
                            {
                                string backupPath = ConfigurationManager.AppSettings["UserProfilesBackUpPath"];
                                string userProfilesPath = ConfigurationManager.AppSettings["UserProfilesPath"];

                                // Step 1: Remove old files and move them to backup
                                if (RemovedFiles != null && RemovedFiles.Count > 0)
                                {
                                    foreach (var fileToRemove in RemovedFiles)
                                    {
                                        string trimmedFile = fileToRemove.Trim();
                                        string oldPath = Path.Combine(userProfilesPath, trimmedFile);
                                        string newPath = Path.Combine(backupPath, trimmedFile);

                                        if (System.IO.File.Exists(oldPath))
                                        {
                                            if (!Directory.Exists(backupPath))
                                            {
                                                Directory.CreateDirectory(backupPath);
                                            }

                                            string backupFile = Path.Combine(backupPath, Path.GetFileName(newPath));

                                            if (System.IO.File.Exists(newPath))
                                            {
                                                System.IO.File.Delete(newPath);  // Delete before replacing
                                            }

                                            System.IO.File.Move(oldPath, newPath);
                                        }


                                    }
                                }

                                // Step 2: Merge Existing and New files into a Dictionary
                                Dictionary<string, string> allUploadedFiles = new Dictionary<string, string>();

                                // Ensure ExistingFiles and ExistingValidityDates are not null
                                ExistingFiles = ExistingFiles ?? new List<string>();
                                ExistingValidityDates = ExistingValidityDates ?? new List<string>();

                                for (int i = 0; i < ExistingFiles.Count; i++)
                                {
                                    string fileName = ExistingFiles[i];
                                    string validityDate = (i < ExistingValidityDates.Count) ? ExistingValidityDates[i] : "";

                                    if (!string.IsNullOrEmpty(fileName))
                                    {
                                        allUploadedFiles[fileName] = validityDate;
                                    }
                                }
                                // Ensure lists are initialized
                                NewCredentials = NewCredentials ?? new List<string>();
                                NewValidityDates = NewValidityDates ?? new List<string>();


                                List<string> validityDates = (Request.Form.GetValues("NewValidityDates") ?? new string[] { })
                                                    .Reverse() // Reverse to remove from end
                                                    .SkipWhile(string.IsNullOrWhiteSpace) // Remove empty values from the end
                                                    .Reverse() // Restore original order
                                                    .ToList();

                                for (int i = 0; i < Request.Files.Count; i++)
                                {
                                    var file = Request.Files[i];

                                    if (file?.ContentLength > 0)
                                    {
                                        string newFileName = Path.GetFileName(file.FileName);
                                        string newFilePath = Path.Combine(userProfilesPath, newFileName);
                                        file.SaveAs(newFilePath);

                                        // Assign corresponding validity date if available
                                        string validityDate = i < validityDates.Count ? validityDates[i] : "";

                                        allUploadedFiles[newFileName] = validityDate;

                                        //Console.WriteLine($"File Processed: {newFileName}, Validity: {validityDate}");
                                    }
                                }

                                // Step 4: Save all files (new & existing) into DB
                                bool flag = false;
                                foreach (var entry in allUploadedFiles)
                                {
                                    objUserViewModel.FileName = entry.Key;
                                    //objUserViewModel.Validity = !string.IsNullOrEmpty(entry.Value) ? Convert.ToDateTime(entry.Value) : (DateTime?)null;
                                    objUserViewModel.FilePath = Path.Combine(userProfilesPath, entry.Key);
                                    string dateString = entry.Value?.Trim(); // Ensure no leading/trailing spaces

                                    if (string.IsNullOrEmpty(dateString) || dateString == ",,")
                                    {
                                        objUserViewModel.Validity = null;
                                    }
                                    else
                                    {
                                        DateTime parsedDate;
                                        if (DateTime.TryParseExact(dateString, "dd-MM-yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedDate))
                                        {
                                            objUserViewModel.Validity = parsedDate;
                                        }
                                        else
                                        {
                                            objUserViewModel.Validity = null; // Handle invalid date formats
                                        }
                                    }

                                    isfileSuccess = objUserBusinessModel.UpdateUserResumeByUserID(objUserViewModel, flag, _userService);
                                    flag = true;
                                }

                                tranScope.Complete();
                            }
                            catch (Exception ex)
                            {
                                errorLogObj.LogError("UpdateUser (Transaction)", ex);
                                return Json(new { status = false, message = "Transaction failed." }, JsonRequestBehavior.AllowGet);
                            }
                        }

                        return Json(new { status = true, message = "User updated successfully." }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { status = false, message = "Update failed." }, JsonRequestBehavior.AllowGet);
                    }
                }
                else
                {
                    message = "Login Name already exists.";
                    return Json(new { status = false, message = message }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("UpdateUser", ex);
                return Json(new { status = false, message = "An error occurred." }, JsonRequestBehavior.AllowGet);
            }
        }

        private void RemoveTrailingEmptyValues(List<string> list)
        {
            for (int i = list.Count - 1; i >= 0; i--)
            {
                if (string.IsNullOrWhiteSpace(list[i]))
                {
                    list.RemoveAt(i);
                }
                else
                {
                    break; // Stop removing when a non-empty value is found
                }
            }
        }
        [HttpPost] 

        public ActionResult UpdateUser12(UserViewModel objUserViewModel, HttpPostedFileBase fileImage, List<HttpPostedFileBase> UploadResume, List<string> ExistingFiles, List<string> ExistingValidityDates,   List<string> NewCredentials,List<string> NewValidityDates, string RemovedFiles )
        
        {
            var isSuccess = false;
            var isfileSuccess = false;
            try
            {
                int userVal = 0;
                string message = null;

                if (objUserViewModel != null && objUserViewModel.UserTypeId != 3)
                {
                    userVal = objUserBusinessModel.CheckUserExistsOrNot(objUserViewModel, _userService);
                }

                if (userVal == 0)
                {
                    bool empanelmentFlag = objUserViewModel.IsEmpannlementflag;
                    objUserViewModel.LoginUserId = CurrentUser.UserId;

                    // Set User Image Path
                    objUserViewModel.UserImagePath = !string.IsNullOrEmpty(objUserViewModel.UserImageGUID)
                        ? Path.Combine(ConfigurationManager.AppSettings["UserProfilesImages"], objUserViewModel.UserImageGUID)
                        : "";

                    // Clear 'OtherProfessional' if skill not selected
                    if (objUserViewModel.SkillSetIds == null || !objUserViewModel.SkillSetIds.Contains(9))
                    {
                        objUserViewModel.OtherProfessional = "";
                    }

                    isSuccess = objUserBusinessModel.UpdateUser(objUserViewModel, empanelmentFlag, _userService);

                    if (isSuccess)
                    {
                        using (TransactionScope tranScope = new TransactionScope())
                        {
                            try
                            {
                                string backupPath = ConfigurationManager.AppSettings["UserProfilesBackUpPath"];
                                string userProfilesPath = ConfigurationManager.AppSettings["UserProfilesPath"];

                                // Move removed files to backup directory
                                if (!string.IsNullOrEmpty(RemovedFiles))
                                {
                                    var filesToRemove = RemovedFiles.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                                    foreach (var fileToRemove in filesToRemove)
                                    {
                                        string oldPath = Path.Combine(userProfilesPath, fileToRemove.Trim());
                                        string newPath = Path.Combine(backupPath, fileToRemove.Trim());

                                        if (System.IO.File.Exists(oldPath))
                                        {
                                            if (!Directory.Exists(backupPath))
                                            {
                                                Directory.CreateDirectory(backupPath);
                                            }
                                            System.IO.File.Move(oldPath, newPath);
                                        }
                                    }
                                }

                                // Handle File Uploads
                                // Ensure ExistingFiles and ExistingValidityDates are not null
                                ExistingFiles = ExistingFiles ?? new List<string>();
                                ExistingValidityDates = ExistingValidityDates ?? new List<string>();

                                // Create a dictionary to store filename -> validity date
                                Dictionary<string, string> allUploadedFiles = new Dictionary<string, string>();

                                // Ensure both lists are of equal length
                                int count = Math.Max(ExistingFiles.Count, ExistingValidityDates.Count);

                                for (int i = 0; i < count; i++)
                                {
                                    string fileName = (i < ExistingFiles.Count) ? ExistingFiles[i] : "";
                                    string validityDate = (i < ExistingValidityDates.Count) ? ExistingValidityDates[i] : "";

                                    if (!string.IsNullOrEmpty(fileName))
                                    {
                                        allUploadedFiles[fileName] = validityDate; // Store file and validity date
                                    }
                                }

                                // Handle new file uploads
                                foreach (string fileKey in Request.Files)
                                {
                                    var file = Request.Files[fileKey];
                                    if (file != null && file.ContentLength > 0)
                                    {
                                        string newFileName = Path.GetFileName(file.FileName);
                                        string newFilePath = Path.Combine(userProfilesPath, newFileName);
                                        file.SaveAs(newFilePath); // Save file

                                        // Get validity date for this file (if available)
                                        string validityDate = Request.Form[$"Validity_{fileKey}"] ?? ""; // Assuming input name follows a pattern

                                        allUploadedFiles[newFileName] = validityDate; // Add new file to dictionary
                                    }
                                }

                                // Assign dictionary values to the model
                                List<CVDocumentViewModel> userFiles = allUploadedFiles.Select(kvp => new CVDocumentViewModel
                                {
                                    FileName = kvp.Key,
                                    Validity = kvp.Value,
                                    FilePath = Path.Combine(userProfilesPath, kvp.Key)
                                }).ToList();
                                // Save All Uploaded Files in DB
                                foreach (var entry in allUploadedFiles)
                                {
                                    objUserViewModel.FileName = entry.Key;  // File Name
                                    objUserViewModel.Validity = !string.IsNullOrEmpty(entry.Value) ? Convert.ToDateTime(entry.Value) : (DateTime?)null;   // Corresponding Validity Date
                                    objUserViewModel.FilePath = Path.Combine(userProfilesPath, entry.Key);


                                    isfileSuccess = objUserBusinessModel.UpdateUserResumeByUserID(objUserViewModel, false, _userService);
                                }

                                tranScope.Complete();
                            }
                            catch (Exception ex)
                            {
                                errorLogObj.LogError("UpdateUser (Transaction)", ex);
                                return Json(new { status = false, message = "Transaction failed." }, JsonRequestBehavior.AllowGet);
                            }
                        }

                        return Json(new { status = true, message = "User updated successfully." }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { status = false, message = "Update failed." }, JsonRequestBehavior.AllowGet);
                    }
                }
                else
                {
                    message = "Login Name already exists.";
                    return Json(new { status = false, message = message }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("UpdateUser", ex);
                return Json(new { status = false, message = "An error occurred." }, JsonRequestBehavior.AllowGet);
            }
        }
        
        [HttpPost]
        public ActionResult UpdateUser1(UserViewModel objUserViewModel, List<string> ExistingFiles, string RemovedFiles)
        {
            //try
            //{
            //objUserViewModel.ExistingFiles = ExistingFiles;
            //objUserViewModel.CVValidityDates = CVValidityDates;

           // Dictionary<string, DateTime?> CVValidityDates = new Dictionary<string, DateTime?>();
            var isSuccess = false;
            var isfileSuccess = false;
            try
            {
                int userVal = 0;
                string message = null;

                if (objUserViewModel != null && objUserViewModel.UserTypeId != 3)
                {
                    userVal = objUserBusinessModel.CheckUserExistsOrNot(objUserViewModel, _userService);
                }

                if (userVal == 0)
                {
                    bool empanelmentFlag = objUserViewModel.IsEmpannlementflag;
                    objUserViewModel.LoginUserId = CurrentUser.UserId;

                    // Set User Image Path
                    objUserViewModel.UserImagePath = !string.IsNullOrEmpty(objUserViewModel.UserImageGUID)
                        ? Path.Combine(ConfigurationManager.AppSettings["UserProfilesImages"], objUserViewModel.UserImageGUID)
                        : "";

                    // Clear 'OtherProfessional' if skill not selected
                    if (objUserViewModel.SkillSetIds == null || !objUserViewModel.SkillSetIds.Contains(9))
                    {
                        objUserViewModel.OtherProfessional = "";
                    }

                    isSuccess = objUserBusinessModel.UpdateUser(objUserViewModel, empanelmentFlag, _userService);

                    if (isSuccess)
                    {
                        using (TransactionScope tranScope = new TransactionScope())
                        {
                            try
                            {
                                string backupPath = ConfigurationManager.AppSettings["UserProfilesBackUpPath"];
                                string userProfilesPath = ConfigurationManager.AppSettings["UserProfilesPath"];

                                // Move removed files to backup directory

                                //foreach (var removedFile in RemovedFiles)
                                //{
                                //    var fileToRemove = user.CVDocuments.FirstOrDefault(d => d.FileName == removedFile);
                                //    if (fileToRemove != null)
                                //    {
                                //        user.CVDocuments.Remove(fileToRemove);
                                //    }
                                //}
                                //if (!string.IsNullOrEmpty(RemovedFiles))
                                //{
                                //    var filesToRemove = RemovedFiles.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                                //    foreach (var fileToRemove in filesToRemove)
                                //    {
                                //        string oldPath = Path.Combine(userProfilesPath, fileToRemove.Trim());
                                //        string newPath = Path.Combine(backupPath, fileToRemove.Trim());

                                //        if (System.IO.File.Exists(oldPath))
                                //        {
                                //            if (!Directory.Exists(backupPath))
                                //            {
                                //                Directory.CreateDirectory(backupPath);
                                //            }
                                //            System.IO.File.Move(oldPath, newPath);
                                //        }
                                //    }
                                //}

                                // Handle File Uploads
                              //  List<string> allUploadedFiles = ExistingFiles ?? new List<string>();

                                //foreach (string fileKey in Request.Files)
                                //{
                                //    var file = Request.Files[fileKey];
                                //    if (file != null && file.ContentLength > 0)
                                //    {
                                //        string newFileName = Path.GetFileName(file.FileName);
                                //        string newFilePath = Path.Combine(userProfilesPath, newFileName);

                                //        allUploadedFiles.Add(newFileName);
                                //        file.SaveAs(newFilePath);
                                //    }
                                //}

                                // Save All Uploaded Files & Validity Dates in DB
                                //foreach (var uploadedFile in allUploadedFiles)
                                //{
                                //    objUserViewModel.FileName = uploadedFile;
                                //    objUserViewModel.FilePath = Path.Combine(userProfilesPath, uploadedFile);

                                //    // Retrieve validity date from dictionary (if exists)
                                //    objUserViewModel.CVValidityDates.TryGetValue(uploadedFile, out DateTime? validityDate);

                                //    //isfileSuccess = objUserBusinessModel.UpdateUserResumeByUserID(objUserViewModel, validityDate, _userService);
                                //}

                                tranScope.Complete();
                            }
                            catch (Exception ex)
                            {
                                errorLogObj.LogError("UpdateUser (Transaction)", ex);
                                return Json(new { status = false, message = "Transaction failed." }, JsonRequestBehavior.AllowGet);
                            }
                        }

                        return Json(new { status = true, message = "User updated successfully." }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { status = false, message = "Update failed." }, JsonRequestBehavior.AllowGet);
                    }
                }
                else
                {
                    message = "Login Name already exists.";
                    return Json(new { status = false, message = message }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("UpdateUser", ex);
                return Json(new { status = false, message = "An error occurred." }, JsonRequestBehavior.AllowGet);
            }
        }


        [HttpPost]
        public ActionResult UpdateUserStatus(Guid userGuid, bool statusId, string remarks=null)
        {
            try
            {
                _userService.UpdateUserStatus(userGuid, statusId, remarks, CurrentUser.UserId);
                return PartialView("_UserDirectory", objUserBusinessModel.GetUserListDetails(CurrentUser.SiteId, true,false, "", "", "", 0, 10, "ASC", _userService));
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("InactivateUser", ex);
            }
            return null;
        }


        [HttpPost]
        public ActionResult UpdateCompetanceStatus(string employeeCode, bool status, string UserType, string remarks = null)
        {
            var isSuccess = false;
            try
            {
              ////  int CountryId = 0;
              //  if (UserType == "Competance1")
              //      CountryId = 1;

               isSuccess= _userService.UpdateCompetanceStatus(employeeCode, status, remarks, CurrentUser.UserId);

               // GetCompetanceListDetails(CurrentUser.SiteId, isUserActive, UserType, strSearch, alphaSearch, pageCount, defaultFetchCount, sortingOrder, CountryId, _competanceService);
               // return PartialView("_CompetanceDetails1", objCompetanceBusinessModel.GetCompetanceListDetails(CurrentUser.SiteId, true, UserType, "", "", 0, 10, "", CountryId, _competanceService));
                return Json(new { status = isSuccess, message = "" }, JsonRequestBehavior.AllowGet);
            }
               
            catch (Exception ex)
            {
                errorLogObj.LogError("UpdateUser", ex);
            }
            return Json(new { status = isSuccess}, JsonRequestBehavior.AllowGet);
        }

        public ActionResult ViewProfile(Guid userGuid)
        {
            UserDetailsModel objUserDetailsViewModel = new UserDetailsModel();
            UserBusinessModel objUserBusinessModel = new UserBusinessModel();
            objUserDetailsViewModel = objUserBusinessModel.GetEmployeeDetailsToEdit(userGuid, CurrentUser.SiteId, _userService);
            objUserDetailsViewModel.SiteId = CurrentUser.SiteId;
            return View("UserProfile", objUserDetailsViewModel);
        }

        public ActionResult EditProfile(Guid userGuid)
        {
            try
            {
                UserDetailsModel objUserDetailsViewModel = new UserDetailsModel();
                UserBusinessModel objUserBusinessModel = new UserBusinessModel();
                //To fetch all the values to fill drop down
                objUserDetailsViewModel = objUserBusinessModel.GetEmployeeDetailsToEdit(userGuid, CurrentUser.SiteId, _userService);
                objUserDetailsViewModel.SiteId = CurrentUser.SiteId;
                return View("EditProfile", objUserDetailsViewModel);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Edit Profile", ex);
            }
            return null;
        }

       
        public ActionResult AddEmpannelment(string EmployeeCode, Guid userGuid)
        {
            CompetanceViewModel objCompetanceViewModel = new CompetanceViewModel();
            UserDetailsModel objUserDetailsViewModel = new UserDetailsModel();

            //To fetch all the values to fill drop down
            objUserDetailsViewModel = objUserBusinessModel.GetEmpannelmentDetailsToAdd(CurrentUser.SiteId, _userService);
            ViewBag.EmployeeCode = EmployeeCode;
            ViewBag.UserGuid = userGuid;
            // objUserDetailsViewModel.LstCurrencyType = new List<CommonModel.CurrencyTypeModel>();
            return PartialView("_AddEmpannelment", objUserDetailsViewModel);
        }

        [HttpPost]
        public ActionResult CreateEmpannelment(UserViewModel objUserViewModel)
        {
            var isSuccess = false;
            try
            {
                objUserViewModel.LoginUserId = CurrentUser.UserId;
                objUserBusinessModel.AddEmpannelmentUser(objUserViewModel, _userService);
                isSuccess = true;
                return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("UpdateUser", ex);
            }
            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult CompetanceDetails(bool isUserActive = true, int pageCount = 0, string strSearch = "", string alphaSearch = "", string sortingOrder = "ASC" )
        {
            //int pageCount = 0;
            // bool UserActive = true;
            //ViewData["Competance"] = "Competance";
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            List<CompetanceViewModel> list = new List<CompetanceViewModel>();
            try
            {
                //  (CurrentUser.SiteId, isUserActive, UserType, strSearch, alphaSearch, pageCount, defaultFetchCount, sortingOrder, _userService);

                //list = objCompetanceBusinessModel.GetCompetanceMatrixDetailsDownload(CurrentUser.SiteId, UserActive, _competanceService);
                 list = objCompetanceBusinessModel.GetCompetanceListBySiteId(CurrentUser.SiteId, isUserActive, "", alphaSearch, 0, defaultFetchCount, sortingOrder, null, _competanceService);
                if (list.Count > 0)
                {
                    ViewBag.Total = list.FirstOrDefault().Total;
                    pageCount += defaultFetchCount;
                    ViewBag.CurrentPageCount = pageCount;
                }
                else
                {
                    ViewBag.Total = 0;
                    ViewBag.CurrentPageCount = 0;
                }
                return PartialView("_CompetanceDetails1", list);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Get Competance list by site id", ex);
            }
            return null;

        }

        public ActionResult CompetanceDetails1(bool isUserActive = true, int pageCount = 0, string strSearch = "", string alphaSearch = "", string sortingOrder = "ASC")
        {
            //int pageCount = 0;
            // bool UserActive = true;
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            List<CompetanceViewModel> list = new List<CompetanceViewModel>();
            try
            {
               // ViewData["Competance"] = "Competance1";
                //  (CurrentUser.SiteId, isUserActive, UserType, strSearch, alphaSearch, pageCount, defaultFetchCount, sortingOrder, _userService);

                //list = objCompetanceBusinessModel.GetCompetanceMatrixDetailsDownload(CurrentUser.SiteId, UserActive, _competanceService);
                list = objCompetanceBusinessModel.GetCompetanceListBySiteId(CurrentUser.SiteId, isUserActive, strSearch, alphaSearch, 0, defaultFetchCount, sortingOrder,1, _competanceService);
                if (list.Count > 0)
                {
                    ViewBag.Total = list.FirstOrDefault().Total;
                    pageCount += defaultFetchCount;
                    ViewBag.CurrentPageCount = pageCount;
                }
                else
                {
                    ViewBag.Total = 0;
                    ViewBag.CurrentPageCount = 0;
                }
                return PartialView("_CompetanceDetails1", list);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Get Competance list by site id", ex);
            }
            return null;

        }

        public JsonResult DownloadCompetance(int? countryId)
        {
            int pageCount = 0;
            bool UserActive = true;
            var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
            List<CompetanceViewModel> list = new List<CompetanceViewModel>();
            try
            {
                //  (CurrentUser.SiteId, isUserActive, UserType, strSearch, alphaSearch, pageCount, defaultFetchCount, sortingOrder, _userService);

                list = objCompetanceBusinessModel.GetCompetanceMatrixDetailsDownload(CurrentUser.SiteId, UserActive, countryId,  _competanceService);

                using (XLWorkbook workbook = new XLWorkbook())
                {
                    var worksheet = countryId == 1 ? workbook.Worksheets.Add("Competance-India") : workbook.Worksheets.Add("Competance-WWI");
                    var headerBackgroundColor = XLColor.LightGray; // Background color for headers

                    int row = 1;
                    int col = 1;

                    // Function to apply consistent header styles
                    void ApplyHeaderStyle(IXLCell cell, bool rotate = false, int colWidth = 10, int rowHeight = 70)
                    {
                        cell.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                        cell.Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        if (rotate) cell.Style.Alignment.SetTextRotation(90);
                        cell.Style.Font.SetBold(true);
                        cell.Style.Font.FontSize = 9; // Set font size to 10
                        cell.Style.Alignment.WrapText = true;
                        cell.Style.Fill.SetBackgroundColor(headerBackgroundColor); // Background color
                        worksheet.Column(cell.Address.ColumnNumber).Width = colWidth;
                        worksheet.Row(cell.Address.RowNumber).Height = rowHeight;
                        worksheet.Range("A1:AX3").Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                        worksheet.Range("A1:AX3").Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                    }

                    // --- Horizontal Headers ---
                    worksheet.Cell(row, col).Value = "Employee Code";
                    worksheet.Range(row, col, row + 2, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col),colWidth:10, rowHeight: 70);
                    col++;

                    worksheet.Cell(row, col).Value = "Inspector Name";
                    worksheet.Range(row, col, row + 2, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), colWidth: 10, rowHeight: 70);
                    col++;

                    worksheet.Cell(row, col).Value = "Educational Qualification";
                    worksheet.Range(row, col, row + 2, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), colWidth: 10, rowHeight: 70);
                    col++;

                    worksheet.Cell(row, col).Value = "Professional Qualification";
                    worksheet.Range(row, col, row + 2, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), colWidth: 10, rowHeight: 70);
                    col++;

                    worksheet.Cell(row, col).Value = "Experience (Yrs)";
                    worksheet.Range(row, col, row + 2, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5);
                    col++;

                    worksheet.Cell(row, col).Value = "Location";
                    worksheet.Range(row, col, row + 2, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rowHeight: 70);
                    col++;


                    // --- Mechanical Section Header ---
                    worksheet.Cell(row, col).Value = "Mechanical";
                    worksheet.Range(row, col, row, col + 20).Merge(); // Adjusted colspan for Mechanical section
                    ApplyHeaderStyle(worksheet.Cell(row, col), colWidth: 20, rowHeight: 30);
                    row++; // Move down for sub-headers

                    // Sub-Headers for Mechanical
                    string[] mechanicalSubHeaders = { "Materials", "Welding", "NDE", "Line Pipe Inspection", "Fabricated Piping",
                                      "Valves / Actuators", "Fittings", "Gaskets", "Coatings / Painting",
                                      "Steel Structures Fabrication", "Pressure Vessels", "Heat Exchangers",
                                      "Boilers", "Tanks", "Skid Packages" };

                    foreach (var subHeader in mechanicalSubHeaders)
                    {
                        worksheet.Cell(row, col).Value = subHeader;
                        worksheet.Range(row, col, row + 1, col).Merge();
                        ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight:50);
                        col++;
                    }
                    row = 2;
                    // --- Rotating Equipment Section Header ---
                    worksheet.Cell(row, col).Value = "Rotating Equipment";
                    worksheet.Range(row, col, row, col + 3).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rowHeight: 20);
                    row++;

                    string[] rotatingEquipmentSubHeaders = { "Pumps", "Compressors", "Turbines", "Gears" };
                    foreach (var subHeader in rotatingEquipmentSubHeaders)
                    {
                        worksheet.Cell(row, col).Value = subHeader;
                        worksheet.Range(row, col, row, col).Merge();
                        ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                        col++;
                    }
                    row--;
                    // --- HVAC Section (Correct Order after Rotating Equipment) ---
                    worksheet.Cell(row, col).Value = "HVAC";
                    worksheet.Range(row, col, row + 1, col).Merge(); // Merge across rows for HVAC
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                    col++;

                    // --- Lifting Equipment Section (Correct Order after HVAC) ---
                    worksheet.Cell(row, col).Value = "Lifting Equipment";
                    worksheet.Range(row, col, row + 1, col).Merge(); // Merge across rows for Lifting Equipment
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                    col++;

                    row = 1;
                    // --- Electrical Section Header ---
                    worksheet.Cell(row, col).Value = "Electrical";
                    worksheet.Range(row, col, row, col + 19).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rowHeight: 30);
                    row++;

                    string[] electricalSubHeaders = { "Generators", "Motors", "Switchboards - PMCCs / MCCs / Dist. Boards"};

                    foreach (var subHeader in electricalSubHeaders)
                    {
                        worksheet.Cell(row, col).Value = subHeader;
                        worksheet.Range(row, col, row + 1, col).Merge();
                        ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                        col++;
                    }
                    row = 2;
                    // --- Rotating Equipment Section Header ---
                    worksheet.Cell(row, col).Value = "Transformers";
                    worksheet.Range(row, col, row, col + 2).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rowHeight: 30);
                    row++;

                    string[] transformersSubHeaders = { "Power", "Distribution", "Instrument Transformers CTs / CVTs / PTs" };
                    foreach (var subHeader in transformersSubHeaders)
                    {
                        worksheet.Cell(row, col).Value = subHeader;
                        worksheet.Range(row, col, row, col).Merge();
                        ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                        col++;
                    }
                    row = 2;
                    // --- Rotating Equipment Section Header ---
                    worksheet.Cell(row, col).Value = "Switchgears Switchyard / Substation";
                    worksheet.Range(row, col, row, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rowHeight: 30);
                    row++;

                    string[] switchgearsSubHeaders = { "Circuit Breakers / Isolators / Lightning Arresters" };
                    foreach (var subHeader in switchgearsSubHeaders)
                    {
                        worksheet.Cell(row, col).Value = subHeader;
                        worksheet.Range(row, col, row, col).Merge();
                        ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 10, rowHeight: 60);
                        col++;
                    }
                    row = 2;
                    // --- Rotating Equipment Section Header ---
                    worksheet.Cell(row, col).Value = "Cables / Conductors";
                    worksheet.Range(row, col, row, col + 1).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rowHeight: 30);
                    row++;

                    string[] cablesSubHeaders = { "Power & Control", "Signal" };
                    foreach (var subHeader in cablesSubHeaders)
                    {
                        worksheet.Cell(row, col).Value = subHeader;
                        worksheet.Range(row, col, row, col).Merge();
                        ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                        col++;
                    }
                    row--;
                    // --- HVAC Section (Correct Order after Rotating Equipment) ---
                    worksheet.Cell(row, col).Value = "AC-DC Drives";
                    worksheet.Range(row, col, row + 1, col).Merge(); // Merge across rows for HVAC
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                    col++;

                    // --- Lifting Equipment Section (Correct Order after HVAC) ---
                    worksheet.Cell(row, col).Value = "Battery Chargers / UPS";
                    worksheet.Range(row, col, row + 1, col).Merge(); // Merge across rows for Lifting Equipment
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                    col++;
                    // --- Control Systems Header ---
                    worksheet.Cell(row, col).Value = "Battery Cells / Banks";
                    worksheet.Range(row, col, row+1, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                    col++; 

                    worksheet.Cell(row, col).Value = "Capacitors";
                    worksheet.Range(row, col, row+1, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                    col++; 

                    worksheet.Cell(row, col).Value = "Ex - Equipment(Hazardous Area Equip)";
                    worksheet.Range(row, col, row+1, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                    col++;

                    worksheet.Cell(row, col).Value = "DG Sets ";
                    worksheet.Range(row, col, row+1, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                    col++;
                    worksheet.Cell(row, col).Value = "Solar PV Modules";
                    worksheet.Range(row, col, row+1, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5, rowHeight: 60);
                    col++;
                    
                    row = 2;
                    // --- Rotating Equipment Section Header ---
                    worksheet.Cell(row, col).Value = "Control Systems";
                    worksheet.Range(row, col, row, col + 1).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rowHeight: 20);
                    row++;

                    string[] controlSystemsSubHeaders = { "Field Instruments", "DCS / PLC / SCADA" };
                    foreach (var subHeader in controlSystemsSubHeaders)
                    {
                        worksheet.Cell(row, col).Value = subHeader;
                        worksheet.Range(row, col, row, col).Merge();
                        ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 10, rowHeight: 60);
                        col++;
                    }

                    row = 2;
                    worksheet.Cell(row, col).Value = "E & I Verification Work";
                    worksheet.Range(row, col, row, col + 1).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rowHeight: 60);
                    row++;

                    string[] eiVerificationSubHeaders = { "Onshore", "Offshore" };
                    foreach (var subHeader in eiVerificationSubHeaders)
                    {
                        worksheet.Cell(row, col).Value = subHeader;
                        worksheet.Range(row, col, row, col).Merge();
                        ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 10, rowHeight: 60);
                        col++;
                    }

                    //col++;
                    row = 1;
                    worksheet.Cell(row, col).Value = "Civil & Infrastructure";
                    worksheet.Range(row, col, row + 2, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5);

                    col++;

                    // --- Others and Remarks ---
                    worksheet.Cell(row, col).Value = "Others";
                    worksheet.Range(row, col, row + 2, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5);
                    col++;

                    worksheet.Cell(row, col).Value = "Remarks";
                    worksheet.Range(row, col, row + 2, col).Merge();
                    ApplyHeaderStyle(worksheet.Cell(row, col), rotate: true, colWidth: 5);

                    // --- Populate Data Rows ---
                    row = 4; // Data rows start from row 4
                    col = 1;

                    foreach (var item in list)
                    {
                        worksheet.Cell(row, col).Value = item.EmployeeCode;
                        worksheet.Cell(row, col + 1).Value = item.UserFullName;
                        worksheet.Cell(row, col + 2).Value = item.Qualification;
                        worksheet.Cell(row, col + 3).Value = item.ProfCourses;
                        worksheet.Cell(row, col + 4).Value = item.Experience;
                        worksheet.Cell(row, col + 5).Value = item.CityName;

                        worksheet.Cell(row, col + 6).SetValue(item.Materials ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 7).SetValue(item.Welding ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 8).SetValue(item.NDE ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 9).SetValue(item.Line_Pipe_Inspection ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 10).SetValue(item.Fabricated_Piping ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 11).SetValue(item.Valves_Actuators ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 12).SetValue(item.Fittings ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 13).SetValue(item.Gaskets ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 14).SetValue(item.Coatings_Painting ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 15).SetValue(item.Steel_Structures_Fabrication ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 16).SetValue(item.Pressure_Vessels ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 17).SetValue(item.Heat_Exchangers ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 18).SetValue(item.Boilers ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 19).SetValue(item.Tanks ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 20).SetValue(item.Skid_Packages ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 21).SetValue(item.Rotating_Equipment_Pumps ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 22).SetValue(item.Rotating_Equipment_Compressors ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 23).SetValue(item.Rotating_Equipment_Turbines ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 24).SetValue(item.Rotating_Equipment_Gears ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 25).SetValue(item.HVAC ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 26).SetValue(item.Lifting_Equipment ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 27).SetValue(item.Generators ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 28).SetValue(item.Motors ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 29).SetValue(item.Switchboards_PMCCs_MCCs_Dist_Boards ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 30).SetValue(item.Power ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 31).SetValue(item.Distribution ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 32).SetValue(item.Instrument_Transformers_CTs_CVTs_PTs ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 33).SetValue(item.Circuit_Breakers_Isolators_Lightning_Arresters ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 34).SetValue(item.Power_Control ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 35).SetValue(item.Signal ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 36).SetValue(item.AC_DC_Drives ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 37).SetValue(item.Battery_Chargers_UPS ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 38).SetValue(item.Battery_Cells_Banks ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 39).SetValue(item.Capacitors ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 40).SetValue(item.Ex_Equipmnent_Hazardous_Area_Equip ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 41).SetValue(item.DG_Sets ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 42).SetValue(item.Solar_PV_Modules ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 43).SetValue(item.Field_Instruments ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 44).SetValue(item.DCS_PLC_SCADA ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 45).SetValue(item.Onshore ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 46).SetValue(item.Offshore ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 47).SetValue(item.Civil_Infrastructure ? "X" : "").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        worksheet.Cell(row, col + 48).Value = item.OthersText;
                        //worksheet.Cell(row, col + 49).Value = item. ? "X" : "";

                        // Continue for all other fields similarly...

                        row++;
                    }


                    // Save to a memory stream and return as base64
                    using (MemoryStream stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        return Json(Convert.ToBase64String(stream.ToArray()), JsonRequestBehavior.AllowGet);
                    }
                }


            }
            catch (Exception ex)
            {
                errorLogObj.LogError("User - Index", ex);
            }

            return null;

        }

        public ActionResult AddCompetance(Guid userGuid)
        {
            CompetanceViewModel objCompetanceViewModel = new CompetanceViewModel();
            UserDetailsModel objUserDetailsViewModel = new UserDetailsModel();

            //To fetch all the values to fill drop down
            objUserDetailsViewModel = objUserBusinessModel.GetEmployeeDetailsToEdit(userGuid, CurrentUser.SiteId, _userService);
            ViewBag.EmployeeCode = objUserDetailsViewModel.EmployeeCode;
            ViewBag.UserFullName = objUserDetailsViewModel.UserFullName;
            objCompetanceViewModel = objCompetanceBusinessModel.GetCompetanceDetailsToAdd(CurrentUser.SiteId, _competanceService);
            return PartialView("_AddCompetance", objCompetanceViewModel);
        }

        [HttpPost]
        public ActionResult CreateCompetance(CompetanceViewModel objCVM)
        {
            var isSuccess = false;
            try
            {
                objCVM.SiteId = CurrentUser.SiteId;
                if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.HumanResourceCreate, CurrentUser.RoleId.FirstOrDefault()))
                {
                    objCVM.CreatedBy = CurrentUser.RoleId.FirstOrDefault();
                    var cId = objCompetanceBusinessModel.SaveCompetanceDetails(objCVM, _competanceService);

                    if (cId == 1)
                    {
                        isSuccess = true;
                        return Json(new { status = isSuccess, message = "Success", competanceId = cId }, JsonRequestBehavior.AllowGet);
                    }
                    else if (cId == -1)
                    {
                        isSuccess = false;
                        return Json(new { status = isSuccess, message = "Competance already existed for this user. Please Check in Competance Matrix.", competanceId = cId }, JsonRequestBehavior.AllowGet);
                    }
                    else if (cId == -2)
                    {
                        isSuccess = false;
                        return Json(new { status = isSuccess, message = "Invalid User Name.", competanceId = cId }, JsonRequestBehavior.AllowGet);
                    }

                }
                else
                {
                    return Json(new { status = isSuccess, message = "duplicate" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Error occured while saving manufacturer " + ex, ex);
                isSuccess = false;
            }
            return Json(new { status = isSuccess, message = "error" }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult EditCompetance(string empCode)
        {
            try
            {
               ViewBag.EmployeeCode = empCode;
               CompetanceViewModel objCompetanceViewModel = new CompetanceViewModel();
               objCompetanceViewModel = objCompetanceBusinessModel.GetCompetanceDetailsToEdit(CurrentUser.SiteId, empCode, _competanceService);
               return PartialView("_EditCompetance", objCompetanceViewModel);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("EditUser", ex);
            }
            return null;
        }

        [HttpPost]
        public ActionResult UpdateCompetance(CompetanceViewModel objCompetanceViewModel)
        {
            var isSuccess = false;
            try
            {
                if(objCompetanceViewModel.Others == false)
                    objCompetanceViewModel.OthersText = "";
                objCompetanceViewModel.SiteId = CurrentUser.SiteId;
                var flag = objCompetanceBusinessModel.UpdateCompetanceDetails(objCompetanceViewModel, _competanceService);
                if (flag == 1)
                {
                    isSuccess = true;
                    return Json(new { status = isSuccess, message = "Success", competanceId = flag }, JsonRequestBehavior.AllowGet);
                }
                else if (flag == -1)
                {
                    isSuccess = false;
                    return Json(new { status = isSuccess, message = "There is an Error while Updating the Competance for this user. Please Check in Competance Matrix.", competanceId = flag }, JsonRequestBehavior.AllowGet);
                }
                else if (flag == -2)
                {
                    isSuccess = false;
                    return Json(new { status = isSuccess, message = "Invalid User Name.", competanceId = flag }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("UpdateUser", ex);
            }
            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }
        [HttpPost]

        public ActionResult AssociateDeatails()
        {
            var associateList = objUserBusinessModel.GetAssociateDetailsToAdd(CurrentUser.SiteId, _userService);
            return Json(associateList, JsonRequestBehavior.AllowGet);
        }

        
         public ActionResult AssociateContactPersonDeatails(string AssociateName)
        {
            var associateContactPerson = objUserBusinessModel.GetAssociateContactPersonDetailsToAdd(CurrentUser.SiteId, AssociateName, _userService);
            return Json(associateContactPerson, JsonRequestBehavior.AllowGet);
        }


        //public ActionResult GetUserSearchList(bool isUserActive, int pageCount = 0, string strSearch = "")
        //{
        //    List<UserViewModel> list = new List<UserViewModel>();
        //    var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
        //    try
        //    {
        //        list = objUserBusinessModel.GetUserSearchList(CurrentUser.SiteId,isUserActive, strSearch, pageCount, defaultFetchCount, _userService);
        //        ViewBag.Total = list.FirstOrDefault().Total;
        //        pageCount += defaultFetchCount;
        //        ViewBag.CurrentPageCount = pageCount;
        //    }
        //    catch (Exception ex)
        //    {
        //        errorLogObj.LogError("Get User Search List", ex);
        //    }
        //    return PartialView("_UserDirectory", list);
        //}
        //public ActionResult GetUserSearchList(bool isUserActive, int pageCount = 0, string strSearch = "")
        //{
        //    List<UserViewModel> list = new List<UserViewModel>();
        //    var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
        //    try
        //    {
        //        list = objUserBusinessModel.GetUserSearchList(CurrentUser.SiteId,isUserActive, strSearch, pageCount, defaultFetchCount, _userService);
        //        ViewBag.Total = list.FirstOrDefault().Total;
        //        pageCount += defaultFetchCount;
        //        ViewBag.CurrentPageCount = pageCount;
        //    }
        //    catch (Exception ex)
        //    {
        //        errorLogObj.LogError("Get Client Search List", ex);
        //    }
        //    return PartialView("_UserDirectory", list);
        //}

        public ActionResult GetUserDetailsByUserId(int userId)
        {
            UserViewModel model = new UserViewModel();
            model = objUserBusinessModel.GetUserDetailsByUserId(userId, _userService);
            return PartialView("~/Views/VisitProcessing/_UserDetails.cshtml", model);
        }
        public ActionResult GetStateListByCountryId(int countryId, string countryName)
        {
            List<CommonModel.StateModel> stateList = new List<CommonModel.StateModel>();
            stateList = objUserBusinessModel.GetStateListByCountyId(countryId, countryName, _userService).ToList();
            return Json(stateList, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetUsersListByStateId(int stateId, string stateName)
        {
            List<UserViewModel> users = new List<UserViewModel>();
            users = objUserBusinessModel.GetUserDetailsByStateId(stateId, stateName, _userService).ToList();
            return Json(users, JsonRequestBehavior.AllowGet);
        }

        public JsonResult GetInspectorsByCountry(int countryId)
        {
            List<UserViewModel> users = new List<UserViewModel>();
            users = objUserBusinessModel.GetInspectorsByCountry(countryId, _userService).ToList();
            return Json(users, JsonRequestBehavior.AllowGet);
        }
    }
}