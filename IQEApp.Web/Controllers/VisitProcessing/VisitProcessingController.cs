using ClosedXML.Excel;
using DocumentFormat.OpenXml.EMMA;
using IQEApp.Service.HomeService;
using IQEApp.Service.VisitProcessing;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.EnquiryModel;
using IQEApp.Web.Models.HomeModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.UserModel;
using IQEApp.Web.Models.VisitProcessing;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.VisitProcessing
{
    //[CustomAuthorize(Roles = "Super Admin Role, Admin Role, Technician Role, Coordinator Role, Quality Check Role, Finance Role")]
    public class VisitProcessingController : BaseController
    {
        private readonly VisitProcessingService _visitProcessingService;
        private readonly IHomeService _homeService;

        ScheduleVisitBusinessModel objScheduleVisitBusinessModel = new ScheduleVisitBusinessModel();
        VisitProcessingBusinessModel objVisitProcessingBusinessModel = new VisitProcessingBusinessModel();
        public VisitProcessingController()
        {
            _visitProcessingService = new VisitProcessingService();
            _homeService = new HomeService();
        }
        //Vis
        //
        // GET: /VisitProcessing/
        public ActionResult ScheduleVisitList1(DirectorySearchQueryModel model, bool isPartialLoad = false)
        {
            // Check if the user has permission to perform the operation
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsScheduleVisit, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<ScheduleVisitModel> objList = new List<ScheduleVisitModel>();

                model.SiteId = CurrentUser.SiteId;
                model.FetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                if (string.IsNullOrEmpty(model.StrSearch))
                    model.StrSearch = "";
                if (string.IsNullOrEmpty(model.AlphaSearch))
                    model.AlphaSearch = "";

                try
                {
                    // Set up the ViewBag properties
                    ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
                    ViewBag.CurrentPageCount = model.PageCount;
                    ViewBag.Total = 0; // Initially, you can set Total to 0

                    // Return an empty list for the initial load
                    if (isPartialLoad)
                    {
                        return PartialView("_ScheduledVisitsList", objList);
                    }

                    // Prepare the view model with empty data on initial load
                    var model1 = new ScheduleVisitListViewModel
                    {
                        ScheduleVisit = objList,
                        StatusCounts =  new ScheduleVisitStatusModel { ActiveCount = 0,ActivePercentage=0, CancelledCount = 0,CancelledPercentage=0 ,ClosedCount=0,ClosedPercentage=0, TotalCount = 0 }  // You can initialize it with empty data
                    };

                    return View("ScheduledVisitList", model1);
                }
                catch (Exception e)
                {
                    errorLogObj.LogError("schedule visits fetch error" + e, e);
                    throw;
                }
            }
            else
            {
                return View("UnAuthorized");
            }
        }

        public ActionResult LogSheet()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsScheduleVisit, CurrentUser.RoleId.FirstOrDefault()))
            {
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                List<ScheduleVisitModel> objList = new List<ScheduleVisitModel>();
                
                try
                {
                    var (scheduleVisits, statusCounts, totals) = objScheduleVisitBusinessModel.GetScheduledVisitList(CurrentUser.UserId, CurrentUser.SiteId, "","", 0, defaultFetchCount, true, "Desc", "","", _visitProcessingService);
                     var model1 = new ScheduleVisitListViewModel
                    {
                        ScheduleVisit = scheduleVisits,
                        StatusCounts = statusCounts,
                        Totals = totals
                     };
                   
                    ViewBag.CurrentPageCount = defaultFetchCount;
                    ViewBag.Total = scheduleVisits.Any() ? scheduleVisits.FirstOrDefault().Total : 0;
                    ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
                    return View("ScheduledVisitList", model1);
                }
                catch (Exception e)
                {
                    errorLogObj.LogError("schedule visits fetch error" + e, e);
                    throw;
                }
            }
            else
            {
                return View("UnAuthorized");
            }
        }

       // [HttpPost]
        public JsonResult GetFilteredVisits(GridFilterRequest request)
        {
            try
            {
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                var result = objScheduleVisitBusinessModel.GetFilteredVisits(request, _visitProcessingService);

                ViewBag.CurrentPageCount = defaultFetchCount;
                ViewBag.Total = (result != null && result.Any()) ? result.First().Total : 0;
                ViewBag.RoleId = CurrentUser.RoleId?.FirstOrDefault();

                return Json(new
                {
                    success = true,
                    data = result ?? new List<ScheduleVisitModel>() // or appropriate type
                }, JsonRequestBehavior.AllowGet);

            }
            catch (Exception ex)
            {
                // Optional: log the exception
                return Json(new
                {
                    success = false,
                    message = "An error occurred while filtering data."
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetInspRepoNoByPurchaseId(string purchaseId)
        {
            var data = objScheduleVisitBusinessModel.GetInspRepoNoByPurchaseId(purchaseId, _visitProcessingService);
            return Json(new { data }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult GetScheduleVisitFilters(GridFilterRequest request)
        {
            try
            {
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);

                // Call business layer
                var (scheduleVisits, statusCounts, totals) = objScheduleVisitBusinessModel.GetScheduleVisitFilters(request,CurrentUser.UserId,CurrentUser.SiteId, request.Status, "",  request.PageCount,request.FetchCount,true, request.SortingOrder, request.FiYear  ,request.Month ,_visitProcessingService);

                var model = new ScheduleVisitListViewModel
                {
                    ScheduleVisit = scheduleVisits,
                    StatusCounts = statusCounts,
                    Totals =totals
                };

                ViewBag.CurrentPageCount = request.PageCount;
                ViewBag.Total = scheduleVisits.Any() ? scheduleVisits.First().Total : 0;
                ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();

                return Json(new
                {
                    success = true,
                    data = model.ScheduleVisit,
                    statusCounts = model.StatusCounts,
                    totals = model.Totals,
                    totalCount = ViewBag.Total
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception)
            {
                return Json(new
                {
                    success = false,
                    message = "An error occurred while filtering data."
                }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetVisitPODetailsByVisitId(int visitId)
        {
            try {

            var podetailsList = objScheduleVisitBusinessModel.GetVisitPODetailsByVisitId(visitId, _visitProcessingService);
            return Json(new
            {
                success = true,
                data = podetailsList ?? new List<PONumberItemsViewModel>() // or appropriate type
            }, JsonRequestBehavior.AllowGet);
        }
            catch (Exception ex)
            {
                // Optional: log the exception
                return Json(new
                {
                    success = false,
                    message = "An error occurred while filtering data."
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult ScheduleVisitFilters(string column, string filterType, string value, int pageCount, int fetchCount)
        {
            try
            {
                var defaultFetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);

                var scheduleVisit1 = objScheduleVisitBusinessModel.ScheduleVisitFilters(column, filterType, value, pageCount, fetchCount, _visitProcessingService);

                ViewBag.CurrentPageCount = defaultFetchCount;
                ViewBag.Total = (scheduleVisit1 != null && scheduleVisit1.Any()) ? scheduleVisit1.First().Total : 0;
                ViewBag.RoleId = CurrentUser.RoleId?.FirstOrDefault();

                return Json(new
                {
                    success = true,
                    data = scheduleVisit1 ?? new List<ScheduleVisitModel>() // or appropriate type
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                // Optional: log the exception
                return Json(new
                {
                    success = false,
                    message = "An error occurred while filtering data."
                }, JsonRequestBehavior.AllowGet);
            }
        }


        public JsonResult ScheduleVisitList(DirectorySearchQueryModel model, bool isPartialLoad = false)
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsScheduleVisit, CurrentUser.RoleId.FirstOrDefault()))
            {
                List<ScheduleVisitModel> objList = new List<ScheduleVisitModel>();
                model.SiteId = CurrentUser.SiteId;
                model.FetchCount = Convert.ToInt32(ConfigurationManager.AppSettings["DefaultPageSize"]);
                if (model.FIYear == null)
                    model.FIYear = "";
                if (model.Month == null)
                    model.Month = "";
                if (string.IsNullOrEmpty(model.StrSearch))
                    model.StrSearch = "";
                if (string.IsNullOrEmpty(model.AlphaSearch))
                    model.AlphaSearch = "";
                try
                {
                    var (scheduleVisit1, statusCounts, totals) = objScheduleVisitBusinessModel.GetScheduledVisitList(CurrentUser.UserId, CurrentUser.SiteId, model.StrSearch, model.AlphaSearch, model.PageCount, model.FetchCount, model.ActiveStatus, model.SortingOrder, model.FIYear, model.Month, _visitProcessingService);

                    // Prepare the view model
                    var model1 = new ScheduleVisitListViewModel
                    {
                        ScheduleVisit = scheduleVisit1,
                        StatusCounts = statusCounts,
                        Totals = totals
                    };
                    ViewBag.Total = scheduleVisit1.Any() ? scheduleVisit1.FirstOrDefault().Total : 0;
                    //ViewBag.Total = scheduleVisit1.FirstOrDefault().Total > 0 ? scheduleVisit1.FirstOrDefault().Total : 0;
                    //model.PageCount += model.FetchCount;
                    ViewBag.CurrentPageCount = model.PageCount;
                    ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
                  //  if (isPartialLoad)
                    {
                        return Json(new { success = true, data = model1 }, JsonRequestBehavior.AllowGet);
                       // return PartialView("_ScheduleVisit2", model1.ScheduleVisit);
                    }
                   // return View("ScheduledVisitList", model1);
                }
                catch (Exception e)
                {
                    errorLogObj.LogError("schedule visits fetch error" + e, e);
                    throw;
                }
            }
            return Json(new { success = false, data = "" }, JsonRequestBehavior.AllowGet);
            //else
            //{
            //    return View("UnAuthorized");
            //}
        }
        //[HttpPost]
        //public JsonResult LoadVisits()
        //{
        //    var draw = Request.Form["draw"];
        //    var start = Convert.ToInt32(Request.Form["start"]);
        //    var length = Convert.ToInt32(Request.Form["length"]);
        //    var searchValue = Request.Form["search[value]"];
        //    var fiYear = Request.Form["search[value]"];
        //   // ViewBag.RoleId = CurrentUser.RoleId.FirstOrDefault();
        //    var roleId = Convert.ToInt32(Request.Form["roleId"]);
        //    int pageCount = (start / length) + 1;
        //    int fetchCount = length;

        //    string alphaSearch = ""; // optional
        //    bool activeStatus = true; // or use from custom column filter
        //    string sortingOrder = ""; // handle sorting logic if needed

        //    var (scheduleVisitList, statusCounts) = objScheduleVisitBusinessModel.GetScheduledVisitList(
        //        CurrentUser.UserId,
        //        CurrentUser.SiteId,
        //        searchValue,
        //        alphaSearch,
        //        10,
        //        10,
        //        activeStatus,
        //        sortingOrder,
        //        fiYear
        //        _visitProcessingService
        //    );

        //    var data = scheduleVisitList.Select(v => new
        //    {
        //        v.VisitSeqId,
        //        v.ControlNo,
        //        VisitDate = v.VisitDate?.ToString("dd/MM/yyyy"),
        //        v.ClientName,
        //        v.ClientUnitName,
        //        v.ManufacturerName,
        //        v.PONumber,
        //        PODate = v.PODate != DateTime.MinValue ? v.PODate.ToString("dd/MM/yyyy") : "",
        //        v.Equipment,
        //        v.QuantityWithUOM,
        //        v.InspectionActivity,
        //        v.InspectorName,
        //        v.InspReportNo,
        //        FileLink = !string.IsNullOrEmpty(v.FileName)
        //            ? $"<i class='bi bi-folder-fill text-warning vr-file-link' style='cursor:pointer;font-size:1.2rem;' title='View Files' data-visit-id='{v.VisitSeqId}' data-files='{v.FileName}'></i>"
        //            : "",
        //        ScheduleComments = !string.IsNullOrEmpty(v.ScheduleComments)
        //            ? (v.ScheduleComments.Length > 30 ? v.ScheduleComments.Substring(0, 30) + "..." : v.ScheduleComments)
        //            : "",
        //        v.InvoiceNo,
        //        InvoiceDate = v.InvoiceDate != DateTime.MinValue ? v.InvoiceDate.ToString("dd/MM/yyyy") : "",
        //        SaleValue = v.SaleValue.ToString("N2"),
        //        CostValue = v.CostValue.ToString("N2"),
        //        GP = v.GP.ToString("N2")
        //    }).ToList();

        //    return Json(new
        //    {
        //        draw = draw,
        //        recordsTotal = statusCounts.TotalCount,
        //        recordsFiltered = statusCounts.TotalCount,
        //        data = data
        //    }, JsonRequestBehavior.AllowGet);
        //}

        [Authorize]
        public ActionResult DownloadFile(string VisitSeqId, string FileName)
        {
            if (CurrentUser == null || CurrentUser.UserId <= 0)
            {
                return View("UnAuthorized");
            }

            int roleId = CurrentUser.RoleId.FirstOrDefault();
            bool canDownload = CurrentUser.IsAdmin ||
                SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.Download, roleId) ||
                SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ScheduleVisitEdit, roleId) ||
                SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.OperationsScheduleVisit, roleId) ||
                roleId == (int)UserRoles.EmployeeRole;

            if (canDownload)
            {
                ScheduleVisitModel fileInfo = objScheduleVisitBusinessModel.GetVisitEmpUploadFileDetailsByID(_visitProcessingService, VisitSeqId, FileName);
                if (fileInfo != null && !string.IsNullOrEmpty(fileInfo.FilePath) && System.IO.File.Exists(fileInfo.FilePath))
                {
                    string downloadFileName = !string.IsNullOrEmpty(fileInfo.FileName)
                        ? fileInfo.FileName
                        : System.IO.Path.GetFileName(fileInfo.FilePath);
                    var downloadFileData = System.IO.File.ReadAllBytes(fileInfo.FilePath);

                    Response.Clear();
                    Response.Buffer = true;
                    Response.Charset = "";
                    Response.Cache.SetCacheability(HttpCacheability.NoCache);
                    Response.ContentType = "application/octet-stream";
                    Response.AppendHeader("Content-Disposition", "attachment; filename=\"" + downloadFileName + "\"");
                    Response.BinaryWrite(downloadFileData);
                    Response.Flush();
                    Response.End();
                }
                else
                {
                    return HttpNotFound("File not found");
                }
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }
        public ActionResult ScheduleNewVisit(ScheduleVisitModel model)
        {
            var isSuccess = false;
            model.LoginUserId = CurrentUser.UserId;
            model.SiteId = CurrentUser.SiteId;
            var VisitId = 0;
            try
            {
               // VisitId = objScheduleVisitBusinessModel.ScheduleNewVisit(model, _visitProcessingService);
                isSuccess = true;
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured on scheduling new visit" + e, e);
                throw;
            }

            return Json(new { retStatus = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult EditVisitDetails(Guid visitGuid)
        {
            ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();
            try
            {
                model = objScheduleVisitBusinessModel.GetVisitDetailsToEdit(visitGuid, CurrentUser.UserId, CurrentUser.SiteId, _visitProcessingService);
                if (model.LstUsersGrid == null)
                {
                    model.LstUsersGrid = new List<UserViewModel>();
                }
                else
                {
                    StringBuilder builder = new StringBuilder();
                    // Loop through all values.
                    foreach (var user in model.LstUsersGrid)
                    {
                        // Append string to StringBuilder.
                        builder.Append(user.UserId).Append(",");
                    }
                    // Get string from StringBuilder.
                    model.UserIds = builder.ToString();
                }
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured on editing  visit details" + e, e);
                throw;
            }

            return View("EditScheduledVisit", model);
        }
        public ActionResult ViewVisitDetails(Guid visitGuid)
        {
            ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();
            try
            {
                model = objScheduleVisitBusinessModel.ViewVisitDetailsByGuid(visitGuid, CurrentUser.UserId, CurrentUser.SiteId, _visitProcessingService);
                if (model.LstUsersGrid == null)
                {
                    model.LstUsersGrid = new List<UserViewModel>();
                }
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured on editing  visit details" + e, e);
                throw;
            }

            return View("ViewScheduledVisit", model);
        }
        public ActionResult UpdateVisitDetails(ScheduleVisitModel model)
        {
            var isSuccess = false;
            model.LoginUserId = CurrentUser.UserId;
            model.SiteId = CurrentUser.SiteId;
            var VisitId = 0;
            try
            {
                isSuccess = objScheduleVisitBusinessModel.UpdateVisitDetails(model, _visitProcessingService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured on updating  visit details" + e, e);
                throw;
            }

            return Json(new { retStatus = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        // POST: Reassign a visit to a different control number and record history
        [HttpPost]
        public JsonResult ReassignVisitControlNumber(int visitId, int toControlId, string reason)
        {
            bool isSuccess = false;
            try
            {
                // Permission check - require Schedule Visit permission (coordinator / admin etc.)
                if (!SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.ScheduleVisitEdit, CurrentUser.RoleId.FirstOrDefault()))
                {
                    return Json(new { status = false, message = "Unauthorized" }, JsonRequestBehavior.AllowGet);
                }

                // changedBy is current user
                int changedBy = CurrentUser.UserId;

                isSuccess = objScheduleVisitBusinessModel.ReassignVisitControlNumber(visitId, toControlId, changedBy, reason, _visitProcessingService);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError($"Error in ReassignVisitControlNumber: {ex}", ex);
                isSuccess = false;
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }
        #region AcceptVisitSchedule

        public ActionResult AcceptVisitSchedule(int visitId)
        {
            bool isSuccess = false;
            HomeBusinessModel objHomeBusinessModel = new HomeBusinessModel();
            List<HomeViewModel> model = new List<HomeViewModel>();
            try
            {
                isSuccess = objVisitProcessingBusinessModel.AcceptVisitSchedule(visitId, CurrentUser.UserId, _visitProcessingService);
                if (isSuccess)
                {
                    model = objHomeBusinessModel.GetMyScheduledVisits(1, CurrentUser.SiteId, CurrentUser.UserId, _homeService);
                    return PartialView("~/Views/Home/_ViewMySchedules.cshtml", model);
                }
            }
            catch (Exception e)
            {
                errorLogObj.LogError("error occured while accepting visit schedule" + e, e);
                throw;
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }
        #endregion

        #region VisitProcessing

        public ActionResult VisitProcessing(Guid visitGuid, int VEMID)
        {
            VisitProcessingDetailsModel model = new VisitProcessingDetailsModel();
            try
            {
                //model.ManufacturerDetails = new ManufacturerViewModel();
                model = objVisitProcessingBusinessModel.GetScheduledVisitDetailsToProcess(visitGuid, _visitProcessingService);

                model.VEM_ID = VEMID;
            }
            catch (Exception e)
            {
                errorLogObj.LogError("schedule visits fetch error" + e, e);
                throw;
            }
            return View("VisitProcessing", model);
        }

        public ActionResult SaveVisitEngineerVisitDetails(VisitProcessingModel model)
        {
            model.LoginUserId = CurrentUser.UserId;
            model.SiteId = CurrentUser.SiteId;
            var isSuccess = false;
            try
            {
                if (model.TravelDocsList == null)
                {
                    model.TravelDocsList = new List<FileViewModel>();
                }
                if (model.TechnicalDocsList == null)
                {
                    model.TechnicalDocsList = new List<FileViewModel>();
                }

                if (model.TravelExpenses == null)
                {
                    model.TravelExpenses = new List<TravelExpensesModel>();
                }
                isSuccess = objVisitProcessingBusinessModel.CaptureVisitEnggVisitDetails(model, _visitProcessingService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("schedule visits fetch error" + e, e);
                throw;
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetCapturedVisitDetailsToEdit(Guid visitGuid, int VEMID)
        {
            VisitProcessingDetailsModel model = new VisitProcessingDetailsModel();
            try
            {
                //model.ManufacturerDetails = new ManufacturerViewModel();
                model = objVisitProcessingBusinessModel.GetEnggCapturedVisitDetailsToEdit(visitGuid, VEMID, _visitProcessingService);

                model.VEM_ID = VEMID;
            }
            catch (Exception e)
            {
                errorLogObj.LogError("schedule visits fetch error" + e, e);
                throw;
            }
            return View("EditEnggCapturedVisitDetails", model);
        }

        public ActionResult UpdateCapturedVisitDetails(VisitProcessingModel model)
        {
            model.LoginUserId = CurrentUser.UserId;
            model.SiteId = CurrentUser.SiteId;
            var isSuccess = false;
            try
            {
                if (model.TravelDocsList == null)
                {
                    model.TravelDocsList = new List<FileViewModel>();
                }
                if (model.TechnicalDocsList == null)
                {
                    model.TechnicalDocsList = new List<FileViewModel>();
                }

                if (model.TravelExpenses == null)
                {
                    model.TravelExpenses = new List<TravelExpensesModel>();
                }

                if (model.RemovedSupportDocs == null)
                    model.RemovedSupportDocs = new List<FileViewModel>();
                isSuccess = objVisitProcessingBusinessModel.UpdateCapturedVisitDetails(model, _visitProcessingService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("schedule visits fetch error" + e, e);
                throw;
            }
            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }
        #endregion

        #region QualityCheck

        public ActionResult GetVisitDetailsToQualityCheck(Guid visitGuid)
        {
            VisitProcessingDetailsModel model = new VisitProcessingDetailsModel();
            try
            {
                model = objVisitProcessingBusinessModel.GetVisitDetailsToQualityCheck(visitGuid, _visitProcessingService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("visit details for quality check error" + e, e);
                throw;
            }
            return View("~/Views/QualityCheck/QualityCheck.cshtml", model);
        }

        public ActionResult ApproveQualityCheck(VisitProcessingModel model)
        {
            bool isSuccess = false;
            try
            {
                isSuccess = objVisitProcessingBusinessModel.UpdateQualityCheckStatus(model.VisitId, model.QualityHeadComments, true, CurrentUser.UserId, _visitProcessingService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("visit details for quality check error" + e, e);
                throw;
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }
        #endregion

        #region FinanceApprove
        public ActionResult GetVisitDetailsToFinanceApproval(Guid visitGuid)
        {
            VisitProcessingDetailsModel model = new VisitProcessingDetailsModel();
            try
            {
                model = objVisitProcessingBusinessModel.GetVisitDetailsToQualityCheck(visitGuid, _visitProcessingService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("visit details for quality check error" + e, e);
                throw;
            }
            return View("~/Views/FinanceApproval/FinanceApproval.cshtml", model);
        }

        public ActionResult ApproveRejectFinance(VisitProcessingModel model)
        {
            bool isSuccess = false;
            try
            {
                isSuccess = objVisitProcessingBusinessModel.UpdateFinanceApprovalStatus(model.VisitId, model.FinanceApproverComments, true, CurrentUser.UserId, _visitProcessingService);
            }
            catch (Exception e)
            {
                errorLogObj.LogError("visit details for quality check error" + e, e);
                throw;
            }

            return Json(new { status = isSuccess }, JsonRequestBehavior.AllowGet);
        }


        #endregion
        private string ConvertFilterQueryStringToJson(string filters)
        {
            if (string.IsNullOrWhiteSpace(filters)) return null;

            var parsed = HttpUtility.ParseQueryString(filters);

            var dict = new Dictionary<string, (string type, string value)>();

            foreach (string key in parsed.Keys)
            {
                if (string.IsNullOrEmpty(key)) continue;

                var start = key.IndexOf('[');
                var end = key.IndexOf(']');

                if (start >= 0 && end > start)
                {
                    var column = key.Substring(start + 1, end - start - 1);
                    var prop = key.Substring(end + 2);

                    if (!dict.ContainsKey(column))
                        dict[column] = (null, null);

                    var current = dict[column];

                    if (prop == "type") current.type = parsed[key];
                    if (prop == "value") current.value = parsed[key];

                    dict[column] = current;
                }
            }

            var result = dict
                .Where(d => !string.IsNullOrEmpty(d.Value.value))
                .Select(d => new
                {
                    ColumnName = d.Key,
                    FilterType = string.IsNullOrEmpty(d.Value.type) ? "contains" : d.Value.type,
                    FilterValue = d.Value.value
                })
                .ToList();

            return result.Any() ? JsonConvert.SerializeObject(result) : null;
        }
        public ActionResult DownloadLog(DateTime Startdate, DateTime Enddate, string filters = null, bool flat = false)
        {
            try
            {
                // =========================================
                // FILTER CONVERSION
                // =========================================
                var jsonFilters = ConvertFilterQueryStringToJson(filters);

                // =========================================
                // GET RAW DATA
                // =========================================
                var rawData = objVisitProcessingBusinessModel
                    .GetLogSheetDetailsDownload1(
                        CurrentUser.SiteId,
                        Startdate,
                        Enddate,
                        jsonFilters,
                        _visitProcessingService)
                    .ToList();

                // =========================================
                // DETAILED MODE DATA
                // =========================================
                var parentList = rawData
                    .GroupBy(x => x.VisitId)
                    .Select(g => g.First())
                    .ToList();

                var parentIds = parentList
                    .Select(x => x.VisitId)
                    .Distinct()
                    .ToList();

                var allChildren = objScheduleVisitBusinessModel
                    .GetVisitPODetailsByVisitIds(parentIds, _visitProcessingService)
                    .ToList();

                // =========================================
                // BUILD EXCEL
                // =========================================
                using (XLWorkbook wb = new XLWorkbook())
                {
                    var ws = wb.Worksheets.Add("LogSheet");

                    int row = 1;
                    int counter = 1;
                    bool isAdmin = CurrentUser.RoleId.FirstOrDefault() == 1;

                    // =====================================================
                    // ✅ FLAT FORMAT (ONE ROW PER PO)
                    // =====================================================
                    if (flat)
                    {
                        var headers = new[]
                        {
                    "S.No",
                    "Visit ID",
                    "C No",
                    "Insp Date",
                    "Customer Name",
                    "Unit/Proj",
                    "Supplier",
                    "Location",
                    "PO Number",
                    "PO Date",
                    "Inspector",
                    "VR",
                    "Remarks"
                };

                        for (int i = 0; i < headers.Length; i++)
                        {
                            ws.Cell(row, i + 1).Value = headers[i];
                        }

                        ws.Range(row, 1, row, headers.Length).Style.Font.Bold = true;
                        ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.LightGray;

                        row++;

                        // =========================================
                        // ✅ EXPLODE VISIT → PO ROWS
                        // =========================================
                        foreach (var parent in parentList)
                        {
                            var childList = allChildren
                                .Where(x => x.VisitId == parent.VisitId)
                                .ToList();

                            // NO CHILD → STILL SHOW PARENT
                            if (!childList.Any())
                            {
                                ws.Cell(row, 1).Value = counter++;
                                ws.Cell(row, 2).Value = parent.VisitSeqId;
                                ws.Cell(row, 3).Value = parent.ControlNo;
                                ws.Cell(row, 4).Value = parent.VisitDate?.ToString("dd/MM/yyyy");
                                ws.Cell(row, 5).Value = parent.ClientName;
                                ws.Cell(row, 6).Value = parent.ClientUnitName;
                                ws.Cell(row, 7).Value = parent.ManufacturerName;
                                ws.Cell(row, 11).Value = parent.InspectorName;
                                ws.Cell(row, 12).Value = parent.InspReportNo;
                                ws.Cell(row, 13).Value = parent.ScheduleComments;

                                row++;
                            }
                            else
                            {
                                // ✅ ONE ROW PER PO
                                foreach (var child in childList)
                                {
                                    ws.Cell(row, 1).Value = counter++;
                                    ws.Cell(row, 2).Value = parent.VisitSeqId;
                                    ws.Cell(row, 3).Value = child.ControlNo;
                                    ws.Cell(row, 4).Value = parent.VisitDate?.ToString("dd/MM/yyyy");
                                    ws.Cell(row, 5).Value = parent.ClientName;
                                    ws.Cell(row, 6).Value = child.ClientUnitName;
                                    ws.Cell(row, 7).Value = child.ManufacturerName;
                                    ws.Cell(row, 8).Value = child.LocationDetails;
                                    ws.Cell(row, 9).Value = child.PONumber;
                                    ws.Cell(row, 10).Value = child.PODate?.ToString("dd/MM/yyyy");
                                    ws.Cell(row, 11).Value = parent.InspectorName;
                                    ws.Cell(row, 12).Value = child.InspReportNo;
                                    ws.Cell(row, 13).Value = parent.ScheduleComments;

                                    row++;
                                }
                            }
                        }

                        // =========================================
                        // STYLING
                        // =========================================
                        ws.Cells().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

                        for (int c = 1; c <= headers.Length; c++)
                        {
                            ws.Column(c).AdjustToContents();
                        }

                        using (MemoryStream stream = new MemoryStream())
                        {
                            wb.SaveAs(stream);
                            stream.Position = 0;

                            Response.Cookies.Add(new HttpCookie("fileDownload", "true")
                            {
                                Path = "/"
                            });

                            return File(
                                stream.ToArray(),
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                "LogSheet_Flat.xlsx"
                            );
                        }
                    }

                    // =====================================================
                    // ✅ DETAILED FORMAT (ORIGINAL)
                    // =====================================================
                    foreach (var parent in parentList)
                    {
                        // HEADER
                        ws.Cell(row, 1).Value = "S.No";
                        ws.Cell(row, 2).Value = "Visit ID";
                        ws.Cell(row, 3).Value = "C No";
                        ws.Cell(row, 4).Value = "Insp Date";
                        ws.Cell(row, 5).Value = "Customer Name";
                        ws.Cell(row, 6).Value = "Unit/Proj";
                        ws.Cell(row, 7).Value = "Supplier";
                        ws.Cell(row, 8).Value = "Equipment";
                        ws.Cell(row, 9).Value = "Inspector";
                        ws.Cell(row, 10).Value = "VR";
                        ws.Cell(row, 11).Value = "Reviewed By";
                        ws.Cell(row, 12).Value = "Comments";

                        if (isAdmin)
                        {
                            ws.Cell(row, 13).Value = "Invoice No";
                            ws.Cell(row, 14).Value = "Inv Date";
                            ws.Cell(row, 15).Value = "Sale";
                            ws.Cell(row, 16).Value = "Cost";
                            ws.Cell(row, 17).Value = "GP";
                        }

                        ws.Range(row, 1, row, isAdmin ? 17 : 12).Style.Font.Bold = true;
                        ws.Range(row, 1, row, isAdmin ? 17 : 12).Style.Fill.BackgroundColor = XLColor.LightGray;

                        row++;

                        // PARENT DATA
                        ws.Cell(row, 1).Value = counter++;
                        ws.Cell(row, 2).Value = parent.VisitSeqId;
                        ws.Cell(row, 3).Value = parent.ControlNo;
                        ws.Cell(row, 4).Value = parent.VisitDate?.ToString("dd/MM/yyyy");
                        ws.Cell(row, 5).Value = parent.ClientName;
                        ws.Cell(row, 6).Value = parent.ClientUnitName;
                        ws.Cell(row, 7).Value = parent.ManufacturerName + "/" + parent.ManufacturerUnitName;
                        ws.Cell(row, 8).Value = parent.Equipment;
                        ws.Cell(row, 9).Value = parent.InspectorName;
                        ws.Cell(row, 10).Value = parent.InspReportNo;
                        ws.Cell(row, 11).Value = parent.QualityDoneByName;
                        ws.Cell(row, 12).Value = parent.ScheduleComments;

                        if (isAdmin)
                        {
                            ws.Cell(row, 13).Value = parent.InvoiceNo;
                            ws.Cell(row, 14).Value = parent.InvoiceDate.ToString("dd/MM/yyyy");
                            ws.Cell(row, 15).Value = parent.SaleValue;
                            ws.Cell(row, 16).Value = parent.CostValue;
                            ws.Cell(row, 17).Value = parent.GP;
                        }

                        row++;

                        // CHILD DATA
                        var childList = allChildren
                            .Where(x => x.VisitId == parent.VisitId)
                            .ToList();

                        if (childList.Any())
                        {
                            ws.Cell(row, 2).Value = "PO Number";
                            ws.Cell(row, 3).Value = "PO Date";
                            ws.Cell(row, 4).Value = "File No";
                            ws.Cell(row, 5).Value = "Item No";
                            ws.Cell(row, 6).Value = "Control No";
                            ws.Cell(row, 7).Value = "Customer Unit";
                            ws.Cell(row, 8).Value = "SO No";
                            ws.Cell(row, 9).Value = "Manufacturer";
                            ws.Cell(row, 10).Value = "Location";
                            ws.Cell(row, 11).Value = "Contact No";
                            ws.Cell(row, 12).Value = "Description";
                            ws.Cell(row, 13).Value = "Qty";
                            ws.Cell(row, 14).Value = "UOM";
                            ws.Cell(row, 15).Value = "Insp Activity";
                            ws.Cell(row, 16).Value = "Cost";

                            ws.Range(row, 2, row, 15).Style.Font.Bold = true;
                            ws.Range(row, 2, row, 15).Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");

                            row++;

                            foreach (var child in childList)
                            {
                                ws.Cell(row, 2).Value = child.PONumber;
                                ws.Cell(row, 3).Value = child.PODate?.ToString("dd/MM/yyyy");
                                ws.Cell(row, 4).Value = child.PurchaseID;
                                ws.Cell(row, 5).Value = child.POItemNo;
                                ws.Cell(row, 6).Value = child.ControlNo;
                                ws.Cell(row, 7).Value = child.ClientUnitName;
                                ws.Cell(row, 8).Value = child.SONumber;
                                ws.Cell(row, 9).Value = child.ManufacturerName;
                                ws.Cell(row, 10).Value = child.LocationDetails;
                                ws.Cell(row, 11).Value = child.ContactNo;
                                ws.Cell(row, 12).Value = child.Description;
                                ws.Cell(row, 13).Value = child.Quantity;
                                ws.Cell(row, 14).Value = child.UOMName;
                                ws.Cell(row, 15).Value = child.InspectionActivity;

                                if (isAdmin)
                                {
                                    ws.Cell(row, 16).Value = child.Cost;
                                }

                                row++;
                            }
                        }

                        row++;
                    }

                    // COLUMN WIDTHS
                    ws.Columns().AdjustToContents();

                    using (MemoryStream stream = new MemoryStream())
                    {
                        wb.SaveAs(stream);
                        stream.Position = 0;

                        Response.Cookies.Add(new HttpCookie("fileDownload", "true")
                        {
                            Path = "/"
                        });

                        return File(
                            stream.ToArray(),
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "LogSheet.xlsx"
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Visit Processing", ex);
                return new HttpStatusCodeResult(500, "Download failed");
            }
        }

        public ActionResult DownloadLog121(DateTime Startdate, DateTime Enddate, string filters = null, bool flat = false)
        {
            try
            {
                // =========================================
                // ✅ FIX: CONVERT QUERY STRING → JSON
                // =========================================
                var jsonFilters = ConvertFilterQueryStringToJson(filters);

                // =========================================
                // GET DATA
                // =========================================
                var parentList = objVisitProcessingBusinessModel
                    .GetLogSheetDetailsDownload1(
                        CurrentUser.SiteId,
                        Startdate,
                        Enddate,
                        jsonFilters,
                        _visitProcessingService)
                    .GroupBy(x => x.VisitId)
                    .Select(g => g.First())
                    .ToList();

                var parentIds = parentList.Select(x => x.VisitId).ToList();

                var allChildren = flat
                    ? new List<PONumberItemsViewModel>()
                    : objScheduleVisitBusinessModel
                        .GetVisitPODetailsByVisitIds(parentIds, _visitProcessingService)
                        .ToList();

                // =========================================
                // BUILD EXCEL (YOUR STYLE APPLIED)
                // =========================================
                using (XLWorkbook wb = new XLWorkbook())
                {
                    var ws = wb.Worksheets.Add("LogSheet");

                    int row = 1;
                    int counter = 1;
                    bool isAdmin = CurrentUser.RoleId.FirstOrDefault() == 1;

                    // =====================================
                    // ✅ FLAT FORMAT
                    // =====================================
                    if (flat)
                    {
                        var headers = new[]
                        {
                    "S.No","Visit ID","C No","Insp Date","Customer Name",
                    "Unit/Proj","Supplier","Location","PO Number","PO Date",
                    "Inspector","VR","Remarks"
                };

                        for (int i = 0; i < headers.Length; i++)
                            ws.Cell(row, i + 1).Value = headers[i];

                        ws.Range(row, 1, row, headers.Length).Style.Font.Bold = true;
                        ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.LightGray;

                        row++;

                        foreach (var item in parentList ?? Enumerable.Empty<ScheduleVisitModel>())
                        {
                            ws.Cell(row, 1).Value = counter++;
                            ws.Cell(row, 2).Value = item.VisitSeqId;
                            ws.Cell(row, 3).Value = item.ControlNo;
                            ws.Cell(row, 4).Value = item.VisitDate?.ToString("dd/MM/yyyy");
                            ws.Cell(row, 5).Value = item.ClientName;
                            ws.Cell(row, 6).Value = item.ClientUnitName;
                            ws.Cell(row, 7).Value = item.ManufacturerName;
                            ws.Cell(row, 8).Value = item.VisitLocation;
                            ws.Cell(row, 9).Value = item.PONumber;
                            ws.Cell(row, 10).Value = item.PODate;
                            ws.Cell(row, 11).Value = item.InspectorName;
                            ws.Cell(row, 12).Value = item.InspReportNo;
                            ws.Cell(row, 13).Value = item.ScheduleComments;

                            row++;
                        }

                        // Adjust columns
                        ws.Cells().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                        for (int c = 1; c <= headers.Length; c++)
                            ws.Column(c).AdjustToContents();

                        using (MemoryStream stream = new MemoryStream())
                        {
                            wb.SaveAs(stream);
                            stream.Position = 0;

                            Response.Cookies.Add(new HttpCookie("fileDownload", "true") { Path = "/" });

                            return File(stream.ToArray(),
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                "LogSheet_Flat.xlsx");
                        }
                    }

                    // =====================================
                    // ✅ DETAILED FORMAT (PARENT + CHILD)
                    // =====================================
                    foreach (var parent in parentList)
                    {
                        // HEADER
                        ws.Cell(row, 1).Value = "S.No";
                        ws.Cell(row, 2).Value = "Visit ID";
                        ws.Cell(row, 3).Value = "C No";
                        ws.Cell(row, 4).Value = "Insp Date";
                        ws.Cell(row, 5).Value = "Customer Name";
                        ws.Cell(row, 6).Value = "Unit/Proj";
                        ws.Cell(row, 7).Value = "Supplier";
                        ws.Cell(row, 8).Value = "Equipment";
                        ws.Cell(row, 9).Value = "Inspector";
                        ws.Cell(row, 10).Value = "VR";
                        ws.Cell(row, 11).Value = "Reviewed By";
                        ws.Cell(row, 12).Value = "Comments";

                        if (isAdmin)
                        {
                            ws.Cell(row, 13).Value = "Invoice No";
                            ws.Cell(row, 14).Value = "Inv Date";
                            ws.Cell(row, 15).Value = "Sale";
                            ws.Cell(row, 16).Value = "Cost";
                            ws.Cell(row, 17).Value = "GP";
                        }

                        ws.Range(row, 1, row, isAdmin ? 17 : 12).Style.Font.Bold = true;
                        ws.Range(row, 1, row, isAdmin ? 17 : 12).Style.Fill.BackgroundColor = XLColor.LightGray;

                        row++;

                        // PARENT DATA
                        ws.Cell(row, 1).Value = counter++;
                        ws.Cell(row, 2).Value = parent.VisitSeqId;
                        ws.Cell(row, 3).Value = parent.ControlNo;
                        ws.Cell(row, 4).Value = parent.VisitDate?.ToString("dd/MM/yyyy");
                        ws.Cell(row, 5).Value = parent.ClientName;
                        ws.Cell(row, 6).Value = parent.ClientUnitName;
                        ws.Cell(row, 7).Value = parent.ManufacturerName + "/" + parent.ManufacturerUnitName;
                        ws.Cell(row, 8).Value = parent.Equipment;
                        ws.Cell(row, 9).Value = parent.InspectorName;
                        ws.Cell(row, 10).Value = parent.InspReportNo;
                        ws.Cell(row, 11).Value = parent.QualityDoneByName;
                        ws.Cell(row, 12).Value = parent.ScheduleComments;

                        if (isAdmin)
                        {
                            ws.Cell(row, 13).Value = parent.InvoiceNo;
                            ws.Cell(row, 14).Value = parent.InvoiceDate.ToString("dd/MM/yyyy");
                            ws.Cell(row, 15).Value = parent.SaleValue;
                            ws.Cell(row, 16).Value = parent.CostValue;
                            ws.Cell(row, 17).Value = parent.GP;
                        }

                        row++;

                        // CHILD DATA
                        var childList = allChildren
                            .Where(x => x.VisitId == parent.VisitId)
                            .ToList();

                        if (childList.Any())
                        {
                            ws.Cell(row, 2).Value = "PO Number";
                            ws.Cell(row, 3).Value = "PO Date";
                            ws.Cell(row, 4).Value = "File No";
                            ws.Cell(row, 5).Value = "Item No";
                            ws.Cell(row, 6).Value = "Control No";
                            ws.Cell(row, 7).Value = "Customer Unit";
                            ws.Cell(row, 8).Value = "SO No";
                            ws.Cell(row, 9).Value = "Manufacturer";
                            ws.Cell(row, 10).Value = "Location";
                            ws.Cell(row, 11).Value = "Contact No";
                            ws.Cell(row, 12).Value = "Description";
                            ws.Cell(row, 13).Value = "Qty";
                            ws.Cell(row, 14).Value = "UOM";
                            ws.Cell(row, 15).Value = "Insp Activity";
                            ws.Cell(row, 16).Value = "Cost";

                            ws.Range(row, 2, row, 16).Style.Font.Bold = true;
                            ws.Range(row, 2, row, 16).Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");

                            row++;

                            foreach (var child in childList)
                            {
                                ws.Cell(row, 2).Value = child.PONumber;
                                ws.Cell(row, 3).Value = child.PODate?.ToString("dd/MM/yyyy");
                                ws.Cell(row, 4).Value = child.PurchaseID;
                                ws.Cell(row, 5).Value = child.POItemNo;
                                ws.Cell(row, 6).Value = child.ControlNo;
                                ws.Cell(row, 7).Value = child.ClientUnitName;
                                ws.Cell(row, 8).Value = child.SONumber;
                                ws.Cell(row, 9).Value = child.ManufacturerName;
                                ws.Cell(row, 10).Value = child.LocationDetails;
                                ws.Cell(row, 11).Value = child.ContactNo;
                                ws.Cell(row, 12).Value = child.Description;
                                ws.Cell(row, 13).Value = child.Quantity;
                                ws.Cell(row, 14).Value = child.UOMName;
                                ws.Cell(row, 15).Value = child.InspectionActivity;

                                if (isAdmin)
                                {
                                    ws.Cell(row, 16).Value = child.Cost;
                                }

                                row++;
                            }
                        }

                        row++;
                    }

                    // =====================================
                    // ALIGNMENT + WIDTH FIX
                    // =====================================

                    ws.Cells().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

                    ws.Column(15).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
                    ws.Column(16).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
                    ws.Column(17).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                    ws.Column(1).Width = 6;
                    ws.Column(2).Width = 14;
                    ws.Column(3).Width = 12;
                    ws.Column(4).Width = 12;
                    ws.Column(5).Width = 22;
                    ws.Column(6).Width = 18;
                    ws.Column(7).Width = 25;
                    ws.Column(8).Width = 20;
                    ws.Column(9).Width = 18;
                    ws.Column(10).Width = 18;
                    ws.Column(11).Width = 18;
                    ws.Column(12).Width = 35;
                    ws.Column(13).Width = 15;
                    ws.Column(14).Width = 10;
                    ws.Column(15).Width = 14;
                    ws.Column(16).Width = 14;
                    ws.Column(17).Width = 14;

                    using (MemoryStream stream = new MemoryStream())
                    {
                        wb.SaveAs(stream);
                        stream.Position = 0;

                        Response.Cookies.Add(new HttpCookie("fileDownload", "true") { Path = "/" });

                        return File(
                            stream.ToArray(),
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "LogSheet.xlsx"
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Visit Processing", ex);
                return new HttpStatusCodeResult(500, "Download failed");
            }
        }
        public ActionResult DownloadLog12(DateTime Startdate, DateTime Enddate, string filters = null, bool flat = false)
        {
            try
            {
                // ============================
                // GET DATA (DATE + FILTERS FROM SP)
                // ============================
                // ✅ CONVERT FILTERS → JSON
                var jsonFilters = ConvertFilterQueryStringToJson(filters);

                var parentList = objVisitProcessingBusinessModel
                    .GetLogSheetDetailsDownload1(
                        CurrentUser.SiteId,
                        Startdate,
                        Enddate,
                        jsonFilters,   // ✅ FIXED
                        _visitProcessingService)
                    .GroupBy(x => x.VisitId)
                    .Select(g => g.First())
                    .ToList();



                var parentIds = parentList.Select(x => x.VisitId).ToList();

                var allChildren = flat
                    ? new List<PONumberItemsViewModel>()
                    : objScheduleVisitBusinessModel
                        .GetVisitPODetailsByVisitIds(parentIds, _visitProcessingService)
                        .ToList();

                // ============================
                // FLAT FORMAT
                // ============================
                if (flat)
                {
                    using (var wb = new XLWorkbook())
                    {
                        var ws = wb.Worksheets.Add("LogSheet");

                        int row = 1, counter = 1;

                        ws.Cell(row, 1).Value = "S.No";
                        ws.Cell(row, 2).Value = "Visit ID";
                        ws.Cell(row, 3).Value = "C No";
                        ws.Cell(row, 4).Value = "Insp Date";
                        ws.Cell(row, 5).Value = "Customer Name";

                        ws.Range(row, 1, row, 5).Style.Font.Bold = true;
                        ws.Range(row, 1, row, 5).Style.Fill.BackgroundColor = XLColor.LightGray;

                        row++;

                        foreach (var item in parentList)
                        {
                            ws.Cell(row, 1).Value = counter++;
                            ws.Cell(row, 2).Value = item.VisitSeqId;
                            ws.Cell(row, 3).Value = item.ControlNo;
                            ws.Cell(row, 4).Value = item.VisitDate?.ToString("dd/MM/yyyy");
                            ws.Cell(row, 5).Value = item.ClientName;
                            row++;
                        }

                        using (var stream = new MemoryStream())
                        {
                            wb.SaveAs(stream);
                            stream.Position = 0;

                            Response.Cookies.Add(new HttpCookie("fileDownload", "true") { Path = "/" });

                            return File(
                                stream.ToArray(),
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                "LogSheet_Flat.xlsx"
                            );
                        }
                    }
                }

                // ============================
                // ORIGINAL FORMAT (UNCHANGED)
                // ============================
                using (var wb = new XLWorkbook())
                {
                    var ws = wb.Worksheets.Add("LogSheet");

                    int row = 1, counter = 1;
                    bool isAdmin = CurrentUser.RoleId.FirstOrDefault() == 1;

                    foreach (var parent in parentList)
                    {
                        // ======================
                        // HEADER
                        // ======================
                        ws.Cell(row, 1).Value = "S.No";
                        ws.Cell(row, 2).Value = "Visit ID";
                        ws.Cell(row, 3).Value = "C No";
                        ws.Cell(row, 4).Value = "Insp Date";
                        ws.Cell(row, 5).Value = "Customer Name";
                        ws.Cell(row, 6).Value = "Unit/Proj";
                        ws.Cell(row, 7).Value = "Supplier";
                        ws.Cell(row, 8).Value = "Equipment";
                        ws.Cell(row, 9).Value = "Inspector";
                        ws.Cell(row, 10).Value = "VR";
                        ws.Cell(row, 11).Value = "Reviewed By";
                        ws.Cell(row, 12).Value = "Comments";

                        if (isAdmin)
                        {
                            ws.Cell(row, 13).Value = "Invoice No";
                            ws.Cell(row, 14).Value = "Inv Date";
                            ws.Cell(row, 15).Value = "Sale";
                            ws.Cell(row, 16).Value = "Cost";
                            ws.Cell(row, 17).Value = "GP";
                        }

                        ws.Range(row, 1, row, isAdmin ? 17 : 12).Style.Font.Bold = true;
                        ws.Range(row, 1, row, isAdmin ? 17 : 12).Style.Fill.BackgroundColor = XLColor.LightGray;

                        row++;

                        // ======================
                        // PARENT DATA
                        // ======================
                        ws.Cell(row, 1).Value = counter++;
                        ws.Cell(row, 2).Value = parent.VisitSeqId;
                        ws.Cell(row, 3).Value = parent.ControlNo;
                        ws.Cell(row, 4).Value = parent.VisitDate?.ToString("dd/MM/yyyy");
                        ws.Cell(row, 5).Value = parent.ClientName;
                        ws.Cell(row, 6).Value = parent.ClientUnitName;
                        ws.Cell(row, 7).Value = parent.ManufacturerName + "/" + parent.ManufacturerUnitName;
                        ws.Cell(row, 8).Value = parent.Equipment;
                        ws.Cell(row, 9).Value = parent.InspectorName;
                        ws.Cell(row, 10).Value = parent.InspReportNo;
                        ws.Cell(row, 11).Value = parent.QualityDoneByName;
                        ws.Cell(row, 12).Value = parent.ScheduleComments;

                        if (isAdmin)
                        {
                            ws.Cell(row, 13).Value = parent.InvoiceNo;
                            ws.Cell(row, 14).Value = parent.InvoiceDate.ToString("dd/MM/yyyy");
                            ws.Cell(row, 15).Value = parent.SaleValue;
                            ws.Cell(row, 16).Value = parent.CostValue;
                            ws.Cell(row, 17).Value = parent.GP;
                        }

                        row++;

                        // ======================
                        // CHILD DATA
                        // ======================
                        var childList = allChildren.Where(x => x.VisitId == parent.VisitId).ToList();

                        if (childList.Any())
                        {
                            ws.Cell(row, 2).Value = "PO Number";
                            ws.Cell(row, 3).Value = "PO Date";
                            ws.Cell(row, 4).Value = "File No";
                            ws.Cell(row, 5).Value = "Item No";
                            ws.Cell(row, 6).Value = "Control No";
                            ws.Cell(row, 7).Value = "Customer Unit";
                            ws.Cell(row, 8).Value = "SO No";
                            ws.Cell(row, 9).Value = "Manufacturer";
                            ws.Cell(row, 10).Value = "Location";
                            ws.Cell(row, 11).Value = "Contact No";
                            ws.Cell(row, 12).Value = "Description";
                            ws.Cell(row, 13).Value = "Qty";
                            ws.Cell(row, 14).Value = "UOM";
                            ws.Cell(row, 15).Value = "Insp Activity";
                            ws.Cell(row, 16).Value = "Cost";

                            ws.Range(row, 2, row, 16).Style.Font.Bold = true;
                            ws.Range(row, 2, row, 16).Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");

                            row++;

                            foreach (var child in childList)
                            {
                                ws.Cell(row, 2).Value = child.PONumber;
                                ws.Cell(row, 3).Value = child.PODate?.ToString("dd/MM/yyyy");
                                ws.Cell(row, 4).Value = child.PurchaseID;
                                ws.Cell(row, 5).Value = child.POItemNo;
                                ws.Cell(row, 6).Value = child.ControlNo;
                                ws.Cell(row, 7).Value = child.ClientUnitName;
                                ws.Cell(row, 8).Value = child.SONumber;
                                ws.Cell(row, 9).Value = child.ManufacturerName;
                                ws.Cell(row, 10).Value = child.LocationDetails;
                                ws.Cell(row, 11).Value = child.ContactNo;
                                ws.Cell(row, 12).Value = child.Description;
                                ws.Cell(row, 13).Value = child.Quantity;
                                ws.Cell(row, 14).Value = child.UOMName;
                                ws.Cell(row, 15).Value = child.InspectionActivity;

                                if (isAdmin)
                                {
                                    ws.Cell(row, 16).Value = child.Cost;
                                }

                                row++;
                            }
                        }

                        row++;
                    }

                    using (var stream = new MemoryStream())
                    {
                        wb.SaveAs(stream);
                        stream.Position = 0;

                        Response.Cookies.Add(new HttpCookie("fileDownload", "true") { Path = "/" });

                        return File(
                            stream.ToArray(),
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "LogSheet.xlsx"
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Visit Processing", ex);
                return new HttpStatusCodeResult(500, "Download failed");
            }
        }
        public ActionResult DownloadLog11(DateTime Startdate, DateTime Enddate, string filters = null, bool flat = false)
        {
            try
            {
                IEnumerable<ScheduleVisitModel> parentList = null;
                List<ScheduleVisitModel> parentListFlat = new List<ScheduleVisitModel>();
                List<PONumberItemsViewModel> allChildren = new List<PONumberItemsViewModel>();

                // If filters string is provided, parse it and fetch the filtered visit list from business layer
                if (!string.IsNullOrEmpty(filters))
                {
                    try
                    {
                        var qs = HttpUtility.ParseQueryString(filters);
                        var dict = new Dictionary<string, (string type, string value)>();
                        foreach (string key in qs.Keys)
                        {
                            if (string.IsNullOrEmpty(key)) continue;
                            // key like filters[Column].type or filters[Column].value
                            var k = key;
                            var start = k.IndexOf('[');
                            var end = k.IndexOf(']');
                            if (start >= 0 && end > start)
                            {
                                var col = k.Substring(start + 1, end - start - 1);
                                var prop = k.Substring(end + 2); // .type or .value
                                if (!dict.ContainsKey(col)) dict[col] = (null, null);
                                var cur = dict[col];
                                if (prop.StartsWith("type")) cur.type = qs[key];
                                if (prop.StartsWith("value")) cur.value = qs[key];
                                dict[col] = cur;
                            }
                        }

                        var filtersList = dict.Select(d => new GridFilter
                        {
                            Column = d.Key,
                            FilterType = d.Value.type,
                            Value = d.Value.value
                        }).ToList();

                        var request = new GridFilterRequest
                        {
                            Filters = filtersList,
                            PageCount = 0,
                            FetchCount = int.MaxValue,
                        };

                        var (scheduleVisits, statusCounts, totals) = objScheduleVisitBusinessModel.GetScheduleVisitFilters(request, CurrentUser.UserId, CurrentUser.SiteId, "", "", request.PageCount, request.FetchCount, true, "", request.FiYear, request.Month, _visitProcessingService);

                        parentList = scheduleVisits ?? Enumerable.Empty<ScheduleVisitModel>();

                        // For flattened data we don't need child items. For parent/child format we still need child details for selected parents.
                        var parentIds = parentList.Select(x => x.VisitId).ToList();
                        if (!flat && parentIds.Any())
                        {
                            allChildren = objScheduleVisitBusinessModel.GetVisitPODetailsByVisitIds(parentIds, _visitProcessingService).ToList();
                        }
                    }
                    catch
                    {
                        // If parsing fails fall back to date range based fetch
                        parentList = objVisitProcessingBusinessModel.GetLogSheetDetailsDownload(CurrentUser.SiteId, Startdate, Enddate, _visitProcessingService).GroupBy(x => x.VisitId).Select(g => g.First()).ToList();
                        var parentIds = parentList.Select(x => x.VisitId).ToList();
                        allChildren = objScheduleVisitBusinessModel.GetVisitPODetailsByVisitIds(parentIds, _visitProcessingService).ToList();
                    }
                }
                else
                {
                    // No filters -> existing behaviour based on date range
                    parentList = objVisitProcessingBusinessModel.GetLogSheetDetailsDownload(CurrentUser.SiteId, Startdate, Enddate, _visitProcessingService).GroupBy(x => x.VisitId).Select(g => g.First()).ToList();
                    var parentIds = parentList.Select(x => x.VisitId).ToList();
                    allChildren = objScheduleVisitBusinessModel.GetVisitPODetailsByVisitIds(parentIds, _visitProcessingService).ToList();
                }

                // Build Excel
                using (XLWorkbook wb = new XLWorkbook())
                {
                    var ws = wb.Worksheets.Add("LogSheet");

                    int row = 1;
                    int counter = 1;
                    bool isAdmin = CurrentUser.RoleId.FirstOrDefault() == 1;

                    if (flat)
                    {
                        // Flat format headers
                        var headers = new[] { "S.No", "Visit ID", "C No", "Insp Date", "Customer Name", "Unit/Proj", "Supplier", "Location", "PO Number", "PO Date", "Inspector", "VR", "Remarks" };
                        for (int i = 0; i < headers.Length; i++) ws.Cell(row, i + 1).Value = headers[i];
                        ws.Range(row, 1, row, headers.Length).Style.Font.Bold = true;
                        ws.Range(row, 1, row, headers.Length).Style.Fill.BackgroundColor = XLColor.LightGray;
                        row++;

                        foreach (var item in parentList ?? Enumerable.Empty<ScheduleVisitModel>())
                        {
                            ws.Cell(row, 1).Value = counter++;
                            ws.Cell(row, 2).Value = item.VisitSeqId;
                            ws.Cell(row, 3).Value = item.ControlNo;
                            ws.Cell(row, 4).Value = item.VisitDate?.ToString("dd/MM/yyyy");
                            ws.Cell(row, 5).Value = item.ClientName;
                            ws.Cell(row, 6).Value = item.ClientUnitName;
                            ws.Cell(row, 7).Value = item.ManufacturerName;
                            ws.Cell(row, 8).Value = item.VisitLocation;
                            ws.Cell(row, 9).Value = item.PONumber;
                            ws.Cell(row, 10).Value = item.PODate;
                            ws.Cell(row, 11).Value = item.InspectorName;
                            ws.Cell(row, 12).Value = item.InspReportNo;
                            ws.Cell(row, 13).Value = item.ScheduleComments;

                            row++;
                        }

                        // Adjust columns
                        ws.Cells().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                        for (int c = 1; c <= headers.Length; c++)
                            ws.Column(c).AdjustToContents();

                        using (MemoryStream stream = new MemoryStream())
                        {
                            wb.SaveAs(stream);
                            stream.Position = 0;

                            Response.Cookies.Add(new HttpCookie("fileDownload", "true") { Path = "/" });

                            return File(stream.ToArray(),
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                "LogSheet_Flat.xlsx");
                        }
                    }

                    // Existing parent / child format (unchanged)
                    foreach (var parent in parentList)
                    {
                        // ======================
                        // HEADER
                        // ======================
                        ws.Cell(row, 1).Value = "S.No";
                        ws.Cell(row, 2).Value = "Visit ID";
                        ws.Cell(row, 3).Value = "C No";
                        ws.Cell(row, 4).Value = "Insp Date";
                        ws.Cell(row, 5).Value = "Customer Name";
                        ws.Cell(row, 6).Value = "Unit/Proj";
                        ws.Cell(row, 7).Value = "Supplier";
                        ws.Cell(row, 8).Value = "Equipment";
                        ws.Cell(row, 9).Value = "Inspector";
                        ws.Cell(row, 10).Value = "VR";
                        ws.Cell(row, 11).Value = "Reviewed By";
                        ws.Cell(row, 12).Value = "Comments";

                        if (isAdmin)
                        {
                            ws.Cell(row, 13).Value = "Invoice No";
                            ws.Cell(row, 14).Value = "Inv Date";
                            ws.Cell(row, 15).Value = "Sale";
                            ws.Cell(row, 16).Value = "Cost";
                            ws.Cell(row, 17).Value = "GP";
                        }

                        ws.Range(row, 1, row, isAdmin ? 17 : 12).Style.Font.Bold = true;
                        ws.Range(row, 1, row, isAdmin ? 17 : 12).Style.Fill.BackgroundColor = XLColor.LightGray;

                        row++;

                        // PARENT DATA
                        ws.Cell(row, 1).Value = counter++;
                        ws.Cell(row, 2).Value = parent.VisitSeqId;
                        ws.Cell(row, 3).Value = parent.ControlNo;
                        ws.Cell(row, 4).Value = parent.VisitDate?.ToString("dd/MM/yyyy");
                        ws.Cell(row, 5).Value = parent.ClientName;
                        ws.Cell(row, 6).Value = parent.ClientUnitName;
                        ws.Cell(row, 7).Value = parent.ManufacturerName + "/" + parent.ManufacturerUnitName;
                        ws.Cell(row, 8).Value = parent.Equipment;
                        ws.Cell(row, 9).Value = parent.InspectorName;
                        ws.Cell(row, 10).Value = parent.InspReportNo;
                        ws.Cell(row, 11).Value = parent.QualityDoneByName;
                        ws.Cell(row, 12).Value = parent.ScheduleComments;

                        if (isAdmin)
                        {
                            ws.Cell(row, 13).Value = parent.InvoiceNo;
                            ws.Cell(row, 14).Value = parent.InvoiceDate.ToString("dd/MM/yyyy");
                            ws.Cell(row, 15).Value = parent.SaleValue;
                            ws.Cell(row, 16).Value = parent.CostValue;
                            ws.Cell(row, 17).Value = parent.GP;
                        }

                        row++;

                        // CHILD DATA
                        var childList = allChildren.Where(x => x.VisitId == parent.VisitId).ToList();

                        if (childList.Any())
                        {
                            ws.Cell(row, 2).Value = "PO Number";
                            ws.Cell(row, 3).Value = "PO Date";
                            ws.Cell(row, 4).Value = "File No";
                            ws.Cell(row, 5).Value = "Item No";
                            ws.Cell(row, 6).Value = "Control No";
                            ws.Cell(row, 7).Value = "Customer Unit";
                            ws.Cell(row, 8).Value = "SO No";
                            ws.Cell(row, 9).Value = "Manufacturer";
                            ws.Cell(row, 10).Value = "Location";
                            ws.Cell(row, 11).Value = "Contact No";
                            ws.Cell(row, 12).Value = "Description";
                            ws.Cell(row, 13).Value = "Qty";
                            ws.Cell(row, 14).Value = "UOM";
                            ws.Cell(row, 15).Value = "Insp Activity";
                            ws.Cell(row, 16).Value = "Cost";

                            ws.Range(row, 2, row, 16).Style.Font.Bold = true;
                            ws.Range(row, 2, row, 16).Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");

                            row++;

                            foreach (var child in childList)
                            {
                                ws.Cell(row, 2).Value = child.PONumber;
                                ws.Cell(row, 3).Value = child.PODate?.ToString("dd/MM/yyyy");
                                ws.Cell(row, 4).Value = child.PurchaseID;
                                ws.Cell(row, 5).Value = child.POItemNo;
                                ws.Cell(row, 6).Value = child.ControlNo;
                                ws.Cell(row, 7).Value = child.ClientUnitName;
                                ws.Cell(row, 8).Value = child.SONumber;
                                ws.Cell(row, 9).Value = child.ManufacturerName;
                                ws.Cell(row, 10).Value = child.LocationDetails;
                                ws.Cell(row, 11).Value = child.ContactNo;
                                ws.Cell(row, 12).Value = child.Description;
                                ws.Cell(row, 13).Value = child.Quantity;
                                ws.Cell(row, 14).Value = child.UOMName;
                                ws.Cell(row, 15).Value = child.InspectionActivity;

                                if (isAdmin)
                                {
                                    ws.Cell(row, 16).Value = child.Cost;
                                }

                                row++;
                            }
                        }

                        row++;
                    }

                    // ===========================
                    // ALIGNMENT SETTINGS
                    // ===========================

                    ws.Cells().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

                    ws.Column(15).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
                    ws.Column(16).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
                    ws.Column(17).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                    // ===========================
                    // FIX COLUMN WIDTHS
                    // ===========================

                    ws.Column(1).Width = 6;
                    ws.Column(2).Width = 14;
                    ws.Column(3).Width = 12;
                    ws.Column(4).Width = 12;
                    ws.Column(5).Width = 22;
                    ws.Column(6).Width = 18;
                    ws.Column(7).Width = 25;
                    ws.Column(8).Width = 20;
                    ws.Column(9).Width = 18;
                    ws.Column(10).Width = 18;
                    ws.Column(11).Width = 18;
                    ws.Column(12).Width = 35;
                    ws.Column(13).Width = 15;
                    ws.Column(14).Width = 10;
                    ws.Column(15).Width = 14;
                    ws.Column(16).Width = 14;
                    ws.Column(17).Width = 14;

                    using (MemoryStream stream = new MemoryStream())
                    {
                        wb.SaveAs(stream);
                        stream.Position = 0;

                        Response.Cookies.Add(new HttpCookie("fileDownload", "true") { Path = "/" });

                        return File(
                            stream.ToArray(),
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "LogSheet.xlsx"
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("Visit Processing", ex);
                return new HttpStatusCodeResult(500, "Download failed");
            }
        }
    }
}