using Dapper;
using DocumentFormat.OpenXml.Bibliography;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml.Wordprocessing;
using IQEApp.Domain.CompetanceDomain;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Domain.PurchaseOrderDomain;
using IQEApp.Domain.VisitProcessing;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Runtime.InteropServices.ComTypes;
using Newtonsoft.Json;

namespace IQEApp.Service.VisitProcessing
{
    public interface IVisitProcessingService
    {
        #region ScheduleVist
        int ScheduleNewVisit(ScheduleVisitDomainModel model);

        int UpdateScheduleVisit(ScheduleVisitDomainModel model);

        int AddScheduleVisitSelectedPOItems(PurchaseOrderItemsDomainModel model);
        int ReCreateScheduleVisitSelectedPOItems(PurchaseOrderItemsDomainModel model, bool flag);
        DataSet GetScheduledVisitsList(int loginUserId, int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder,string fIYear, string month);

        
        IEnumerable<ScheduleVisitDomainModel> GetFilteredVisits(List<GridFilterDomainModel> filters, int pageCount, int fetchCount , string fiYear, string month);
        (IEnumerable<ScheduleVisitDomainModel>, ScheduleVisitStatusDomainModel, TotalsDomainModel) GetScheduleVisitFilters(List<GridFilterDomainModel> filters, int loginUserId, int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fIYear, string month);

        IEnumerable<ScheduleVisitDomainModel> ScheduleVisitFilters(string ColumnName, string FilterType, string FilterValue, int pageCount, int fetchCount);
        IEnumerable<ScheduleVisitDomainModel> PreviewScheduledVisit(int loginUserId, Guid? controlnumber);
        IEnumerable<InspRepoNoDomainModel> GetInspRepoNoByPurchaseId(string purchaseId);
        DataSet GetVisitDetailsToEdit(Guid visitGuid, int loginUserId, int siteId);
        DataSet ViewVisitDetailsByGuid(Guid visitGuid, int loginUserId, int siteId);
        bool UpdateVisitDetails(ScheduleVisitDomainModel model);
        ScheduleVisitDomainModel GetVisitEmpUploadFileDetailsByID(string VisitId, string fileName);
        IEnumerable<PONumberItemsDomainModel> GetVisitPODetailsByVisitId(int visitID);
        
        #endregion

        bool AcceptVisitSchedule(int visitId, int LoginUserId);

        #region VisitProcessing
        DataSet GetScheduledVisitDetailsToProcess(Guid visitGuid);
        bool CaptureVisitEnggVisitDetails(VisitProcessingDomainModel model);

        bool UploadVisitEngineerSupportDocs(int VEMID, string FileName, string fileLink, double? FileSize, int sectionId, int siteId, int LoginUserId);
        bool DeleteVisitSupportDocFromDB(int fileId);
        bool AddTravelExpense(int VEMID, int TravelTypeId, DateTime FromDate, DateTime ToDate, int TravelKM, int Expenses);
        bool DeleteTravelExpense(string[] ExpenseIds);
        DataSet GetEnggCapturedVisitDetailsToEdit(Guid visitGuid, int VEMId);
        bool UpdateCaptureVisitEnggVisitDetails(VisitProcessingDomainModel model);
        DataSet EditVisitScheduleByVID(int VisitId,List<int> PONID, int POID);
        #endregion

        #region QualityCheck

        DataSet GetVisitDetailsToQualityCheck(Guid visitGuid);
        bool UpdateQualityCheckStatus(int visitId, string qualityHeadComments, bool approvalStatus, int LoginUserId);

        #endregion

        #region FinanceApproval

        bool UpdateFinanceApprovalStatus(int visitId, string financeApproverComments, bool approvalStatus, int LoginUserId);

        #endregion

        IEnumerable<ScheduleVisitDomainModel> GetLogSheetDetailsDownload(int siteId, DateTime Startdate, DateTime Enddate);
        IEnumerable<PONumberItemsDomainModel> GetVisitPODetailsByVisitIds(List<int> visitIds);
       // IEnumerable<InspRepoNoDomainModel> GetInspRepoNoByPurchaseIds(List<string> purchaseIds);

        IEnumerable<ScheduleVisitDomainModel> GetLogSheetDetailsDownload1(int siteId, DateTime startdate, DateTime enddate, string filters);

        // NEW: Reassign control number for a visit and record history
        bool ReassignVisitControlNumber(int visitId, int toControlId, int changedBy, string reason);
    }

    public class VisitProcessingService : IVisitProcessingService
    {
        #region DbConnection
        private SqlConnection _con;
        string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
        private void Connection()
        {

            _con = new SqlConnection(constring);
        }
        #endregion

        #region ScheduleVist

        public int ScheduleNewVisit(ScheduleVisitDomainModel model)
        {
            Connection();


            var parameter = new DynamicParameters();
            parameter.Add("@ControlId", model.ControlId);
            parameter.Add("@SOId", model.SOID);
            parameter.Add("@ScheduleDate", model.ScheduleDate);
            parameter.Add("@RFIScheduleDate", model.RFIScheduleDate);
            parameter.Add("@VisitDate", model.VisitDate);
            parameter.Add("@ClientConfirmation", model.ClientConfirmation);
            parameter.Add("@ManufacturerConfirmation", model.ManufacturerConfirmation);
            parameter.Add("@ScheduleComments", model.ScheduleComments);
            parameter.Add("@UserIds", model.UserIds);
            parameter.Add("@LoggedInUser", model.LoginUserId);
            parameter.Add("@PONId", model.PONID);
            parameter.Add("@PONIds", model.PONIds);
            parameter.Add("@ManufacturerId", model.ManufacturerId);
            parameter.Add("@VisitLocation", model.VisitLocation);
            parameter.Add("@CountryId", model.CountryId);
            parameter.Add("@StateId", model.StateId);
            parameter.Add("@StateName", model.StateName);
            parameter.Add("@ClientId", model.ClientId);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            return _con.Query<int>("SaveScheduleVisitLatest", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public int UpdateScheduleVisit(ScheduleVisitDomainModel model)
        {
            Connection();


            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", model.VisitId);
            parameter.Add("@ControlId", model.ControlId);
            parameter.Add("@SOId", model.SOID);
            parameter.Add("@ScheduleDate", model.ScheduleDate);
            parameter.Add("@RFIScheduleDate", model.RFIScheduleDate);
            parameter.Add("@VisitDate", model.VisitDate);
            parameter.Add("@ClientConfirmation", model.ClientConfirmation);
            parameter.Add("@ManufacturerConfirmation", model.ManufacturerConfirmation);
            parameter.Add("@ScheduleComments", model.ScheduleComments);
            parameter.Add("@UserIds", model.UserIds);
            parameter.Add("@LoggedInUser", model.LoginUserId);
            parameter.Add("@PONId", model.PONID);
            parameter.Add("@PONIds", model.PONIds);
            parameter.Add("@ManufacturerId", model.ManufacturerId);
            parameter.Add("@VisitLocation", model.VisitLocation);
            parameter.Add("@StateId", model.StateId);
            parameter.Add("@StateName", model.StateName);
            parameter.Add("@CountryId", model.CountryId);
            return _con.Query<int>("UpdateScheduleVisit", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public int AddScheduleVisitSelectedPOItems (PurchaseOrderItemsDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();

            parameter.Add("@PONId", model.PONId);
            parameter.Add("@POItemNo", model.POItemNo);
            parameter.Add("@Quantity", model.Quantity);
            parameter.Add("@Description", model.Description);
            parameter.Add("@NumberOfVisits", model.NumberOfVisits);
            parameter.Add("@CreatedBy", 1);
            parameter.Add("@CreatedDate", DateTime.Now);
            parameter.Add("@Remarks", model.Remarks);
            parameter.Add("@InspectionActivity", model.InspectionActivity);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@POID", model.POId);
            parameter.Add("@VisitId", model.VisitId);
            parameter.Add("@VisitPId", model.VisitPId);

            return _con.Query<int>("AddScheduleVisitSelectedPOItems1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        
        public int ReCreateScheduleVisitSelectedPOItems(PurchaseOrderItemsDomainModel model, bool flag)
        {
            Connection();
            var parameter = new DynamicParameters();

            parameter.Add("@PONId", model.PONId);
            parameter.Add("@POItemNo", model.POItemNo);
            parameter.Add("@Quantity", model.Quantity);
            parameter.Add("@Description", model.Description);
            parameter.Add("@NumberOfVisits", model.NumberOfVisits);
            parameter.Add("@CreatedBy", 1);
            parameter.Add("@CreatedDate", DateTime.Now);
            parameter.Add("@Remarks", model.Remarks);
            parameter.Add("@InspectionActivity", model.InspectionActivity);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@POID", model.POId);
            parameter.Add("@VisitId", model.VisitId);
            parameter.Add("@VisitPId", model.VisitPId);
            parameter.Add("@Flag", flag);

            return _con.Query<int>("ReCreateScheduleVisitSelectedPOItems", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public ScheduleVisitDomainModel GetVisitEmpUploadFileDetailsByID(string VisitId, string fileName)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitSeqId", VisitId);
            parameter.Add("@FileName", fileName.Trim());
            //parameter.Add("@SectionId", SId);
            return _con.Query<ScheduleVisitDomainModel>("GetVisitEmpUploadFileDetailsByID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        
        public DataSet GetScheduledVisitsList(int loginUserId, int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fiYear, string month)
        {
            using (SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString))
            using (SqlCommand cmd = new SqlCommand("GetLogSheetVisitScheduledList2", con))
            using (SqlDataAdapter da = new SqlDataAdapter(cmd))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                // Add parameters
                cmd.Parameters.AddWithValue("@LoggedInUser", loginUserId);
                cmd.Parameters.AddWithValue("@SiteId", siteId);
                cmd.Parameters.AddWithValue("@strSearch", strSearch);
                cmd.Parameters.AddWithValue("@alphaChar", alphaChar);
                cmd.Parameters.AddWithValue("@Offset", offset);
                cmd.Parameters.AddWithValue("@Fetch", fetch);
                cmd.Parameters.AddWithValue("@ActiveStatus", activeStatus);
                cmd.Parameters.AddWithValue("@SortingOrder", sortingOrder);
                cmd.Parameters.AddWithValue("@fiYear", fiYear);
                cmd.Parameters.AddWithValue("@Month", month);
                DataSet ds = new DataSet();
                da.Fill(ds);

                return ds;
            }
        }

        public IEnumerable<ScheduleVisitDomainModel> GetFilteredVisits(List<GridFilterDomainModel> filters, int pageCount, int fetchCount, string fiYear, string month)
        {
            Connection();

            // Create a DataTable to match the TVP structure
            var filterTable = new DataTable();
            filterTable.Columns.Add("ColumnName", typeof(string));
            filterTable.Columns.Add("FilterType", typeof(string));
            filterTable.Columns.Add("FilterValue", typeof(string));


            foreach (var filter in filters)
            {
                filterTable.Rows.Add(filter.Column, filter.FilterType, filter.Value.Trim());
            }

            var parameter = new DynamicParameters();
            parameter.Add("@Filters", filterTable.AsTableValuedParameter("dbo.GridFilterType"));
            parameter.Add("@Offset", pageCount);
            parameter.Add("@Fetch", fetchCount);
            parameter.Add("@FiYear", fiYear);   // NEW
            parameter.Add("@Month", month);     // NEW

            using (var multi = _con.QueryMultiple("ScheduleVisitFilters1", parameter, commandType: CommandType.StoredProcedure))
            {
                var visits = multi.Read<ScheduleVisitDomainModel>().ToList(); // 1st result: paged data
                var total = multi.ReadFirstOrDefault<int>();                  // 2nd result: total count

                // Assign total count to each item (optional, if needed for UI)
                visits.ForEach(v => v.Total = total);

                return visits; // If your method is returning IEnumerable<ScheduleVisitDomainModel>
            }
        }

        public (IEnumerable<ScheduleVisitDomainModel>, ScheduleVisitStatusDomainModel, TotalsDomainModel) GetScheduleVisitFilters(  List<GridFilterDomainModel> filters, int loginUserId,  int siteId, string strSearch, string alphaChar,
            int offset,  int fetch, bool activeStatus,   string sortingOrder, string fIYear,   string month )
        {
            Connection();

            var jsonFilters = JsonConvert.SerializeObject(
                filters.Select(f => new
                {
                    ColumnName = f.Column,
                    FilterType = f.FilterType,
                    FilterValue = f.Value?.Trim()
                })
            );

            var parameter = new DynamicParameters();
            parameter.Add("@Filters", jsonFilters);
            parameter.Add("@LoggedInUser", loginUserId);
            parameter.Add("@SiteId", siteId);
            parameter.Add("@strSearch", strSearch);
            parameter.Add("@alphaChar", alphaChar);
            parameter.Add("@Offset", offset);
            parameter.Add("@Fetch", fetch);
            parameter.Add("@ActiveStatus", activeStatus);
            parameter.Add("@SortingOrder", sortingOrder);
            parameter.Add("@FiYear", fIYear);
            parameter.Add("@Month", month);

            using (var multi = _con.QueryMultiple(
                "GetScheduleVisitFilters1",
                parameter,
                commandType: CommandType.StoredProcedure))
            {
                /* ---------------- Result 1 : Visit List ---------------- */
                var visitList = multi.Read<ScheduleVisitDomainModel>().ToList();

                /* ---------------- Result 2 : Status + Totals (ONE ROW) ---------------- */
                var statRow = multi.Read<dynamic>().FirstOrDefault();

                if (statRow == null)
                {
                    return (visitList, null, null);
                }

                /* ---------------- Map STATUS ---------------- */
                var statusCounts = new ScheduleVisitStatusDomainModel
                {
                    ActiveCount = statRow.ActiveCount ?? 0,
                    ClosedCount = statRow.ClosedCount ?? 0,
                    OnHoldCount = statRow.OnHoldCount ?? 0,
                    CancelledCount = statRow.CancelledCount ?? 0,
                    TotalCount = statRow.TotalCount ?? 0,

                    ActivePercentage = statRow.ActivePercentage ?? 0,
                    ClosedPercentage = statRow.ClosedPercentage ?? 0 ,
                    OnHoldPercentage = statRow.OnHoldPercentage ?? 0,
                    CancelledPercentage = statRow.CancelledPercentage ?? 0
                };

                /* ---------------- Map TOTALS ---------------- */
                var totals = new TotalsDomainModel
                {
                    TotalSaleValue = statRow.TotalSaleValue ?? 0,
                    TotalCostValue = statRow.TotalCostValue ?? 0,
                    TotalGPValue = statRow.TotalGPValue ?? 0
                };

                return (visitList, statusCounts, totals);
            }
        }

        public IEnumerable<InspRepoNoDomainModel> GetInspRepoNoByPurchaseId(string purchaseId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@PurchaseId", purchaseId);
            return _con.Query<InspRepoNoDomainModel>("GetInspRepoNoByPurchaseId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<PONumberItemsDomainModel> GetVisitPODetailsByVisitId(int VisitId )
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", VisitId);
            return _con.Query<PONumberItemsDomainModel>("GetVisitPODetailsByVisitId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public IEnumerable<PONumberItemsDomainModel> GetVisitPODetailsByVisitIds(List<int> visitIds)
        {
            Connection();

            var parameter = new DynamicParameters();
            string ids = string.Join(",", visitIds);
            parameter.Add("@VisitIds", ids);
            return _con.Query<PONumberItemsDomainModel>("GetVisitPODetailsByVisitIds1",parameter,commandType: CommandType.StoredProcedure);
        }
        public IEnumerable<ScheduleVisitDomainModel> ScheduleVisitFilters(string ColumnName, string FilterType, string FilterValue, int pageCount, int fetchCount)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ColumnName", ColumnName);
            parameter.Add("@FilterType", FilterType);
            parameter.Add("@FilterValue", FilterValue);
            parameter.Add("@PageNumber", pageCount);
            parameter.Add("@PageSize", fetchCount);
            return _con.Query<ScheduleVisitDomainModel>("ScheduleVisitFilters", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<ScheduleVisitDomainModel> PreviewScheduledVisit(int loginUserId, Guid? controlNumberGuid)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@LoggedInUser", loginUserId);
            //parameter.Add("@SiteId", siteId);
            parameter.Add("@ControlNumberGuid", controlNumberGuid == null ? Guid.Empty : controlNumberGuid);
            //parameter.Add("@alphaChar", alphaChar);
            //parameter.Add("@Offset", offset);
            //parameter.Add("@Fetch", fetch);
            //parameter.Add("@ActiveStatus", activeStatus);
            //parameter.Add("@SortingOrder", sortingOrder);
            return _con.Query<ScheduleVisitDomainModel>("PreviewScheduledVisit", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public DataSet GetVisitDetailsToEdit(Guid visitGuid, int loginUserId, int siteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetScheduledVisitDetailsByGuid", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@VisitGuid", visitGuid);
            cmd.Parameters.AddWithValue("@LoggedInUser", loginUserId);
            cmd.Parameters.AddWithValue("@SiteId", siteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public DataSet ViewVisitDetailsByGuid(Guid visitGuid, int loginUserId, int siteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("ViewVisitDetailsByGuid", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@VisitGuid", visitGuid);
            cmd.Parameters.AddWithValue("@LoggedInUser", loginUserId);
            cmd.Parameters.AddWithValue("@SiteId", siteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public bool UpdateVisitDetails(ScheduleVisitDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitGuid", model.VisitGuid);
            parameter.Add("@ScheduleDate", model.ScheduleDate);
            parameter.Add("@ClientConfirmation", model.ClientConfirmation);
            parameter.Add("@ManufacturerConfirmation", model.ManufacturerConfirmation);
            parameter.Add("@ScheduleComments", model.ScheduleComments);
            parameter.Add("@UserIds", model.UserIds);
            parameter.Add("@LoggedInUser", model.LoginUserId);
            parameter.Add("@POID", model.POID);
            return _con.Query<bool>("UpdateVisitDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        #endregion
        public bool AcceptVisitSchedule(int visitId, int LoginUserId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", visitId);
            parameter.Add("@loginUserId", LoginUserId);
            return _con.Query<bool>("AcceptVisitSchedule", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        #region VisitProcessing
        public DataSet GetScheduledVisitDetailsToProcess(Guid visitGuid)
        {
            SqlConnection con = new SqlConnection(constring);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetScheduledVisitDetailsToProcess", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@VisitGuid", visitGuid);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public bool CaptureVisitEnggVisitDetails(VisitProcessingDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VEM_ID", model.VEM_ID);
            parameter.Add("@VisitedFrom", model.VisitedFrom);
            parameter.Add("@VisitedTo", model.VisitedTo);
            parameter.Add("@VisitComments", model.VisitComments);
            parameter.Add("@InspReportNumber", model.InspReportNumber);
            parameter.Add("@LoggedInUser", model.LoginUserId);

            var result = _con.Query<bool>("CaptureVisitEnggVisitDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();

            // If capture succeeded and an inspection report number was provided, persist a VisitReportReferences entry
            if (result && !string.IsNullOrWhiteSpace(model.InspReportNumber))
            {
                try
                {
                    var paramRef = new DynamicParameters();
                    paramRef.Add("@VisitId", model.VisitId);
                    paramRef.Add("@VisitGuid", null);
                    paramRef.Add("@InspReportNo", model.InspReportNumber);
                    paramRef.Add("@InternalReference", null);
                    paramRef.Add("@PrimaryControlId", null);
                    paramRef.Add("@SecondaryControlIds", null);
                    paramRef.Add("@PurchaseId", null);
                    paramRef.Add("@CreatedBy", model.LoginUserId);

                    // SaveVisitReportReference returns inserted Id as resultset
                    var inserted = _con.Query<long>("SaveVisitReportReference", paramRef, null, true, 0, commandType: CommandType.StoredProcedure).FirstOrDefault();
                    // ignore inserted id; if 0 treat as non-fatal
                }
                catch
                {
                    // Swallow exception to avoid breaking main flow; in production log this
                }
            }

            return result;
        }

        public bool UploadVisitEngineerSupportDocs(int VEMID, string FileName, string fileLink, double? FileSize, int sectionId, int siteId, int LoginUserId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VEM_ID", VEMID);
            parameter.Add("@FileName", FileName);
            parameter.Add("@FileLink", fileLink);
            parameter.Add("@FileSize", FileSize);
            parameter.Add("@SectionId", sectionId);
            parameter.Add("@SiteId", siteId);
            parameter.Add("@LoggedInUser", LoginUserId);
            return _con.Query<bool>("UploadVisitEngineerSupportDocs", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool DeleteVisitSupportDocFromDB(int fileId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@FileId", fileId);
            return _con.Query<bool>("DeleteVisitSupportDocFromDB", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool AddTravelExpense(int VEMID, int TravelTypeId, DateTime FromDate, DateTime ToDate, int TravelKM, int Expenses)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VEM_ID", VEMID);
            parameter.Add("@TravelTypeId", TravelTypeId);
            parameter.Add("@FromDate", FromDate == Convert.ToDateTime("01/01/0001") ? Convert.ToDateTime("01/01/1900") : FromDate);
            parameter.Add("@ToDate", ToDate == Convert.ToDateTime("01/01/0001") ? Convert.ToDateTime("01/01/1900") : ToDate);
            parameter.Add("@TravelKM", TravelKM);
            parameter.Add("@Expenses", Expenses);
            return _con.Query<bool>("AddTravelExpense", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool DeleteTravelExpense(string[] ExpenseIds)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@RemovedExpenseIds", String.Join(",", ExpenseIds.ToArray()));
            return _con.Query<bool>("DeleteTravelExpensesByExpenseId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public DataSet GetEnggCapturedVisitDetailsToEdit(Guid visitGuid, int VEMId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetEnggCapturedVisitDetailsToEdit", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@VisitGuid", visitGuid);
            cmd.Parameters.AddWithValue("@VEMId", VEMId);
            //cmd.Parameters.AddWithValue("@SiteId", siteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool UpdateCaptureVisitEnggVisitDetails(VisitProcessingDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VEM_ID", model.VEM_ID);
            //parameter.Add("@TravelKM", model.TravelKm);
            //parameter.Add("@TravelExpense", model.TravelExpense);
            //parameter.Add("@OtherExpense", model.OtherExpense);
            parameter.Add("@VisitedFrom", model.VisitedFrom);
            parameter.Add("@VisitedTo", model.VisitedTo);
            parameter.Add("@VisitComments", model.VisitComments);
            parameter.Add("@InspReportNumber", model.InspReportNumber);
            parameter.Add("@LoggedInUser", model.LoginUserId);
            return _con.Query<bool>("UpdateCaptureVisitEnggVisitDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        #endregion

        #region QualityCheck

        public DataSet GetVisitDetailsToQualityCheck(Guid visitGuid)
        {
            SqlConnection con = new SqlConnection(constring);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetVisitDetailsToQualityCheck", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@VisitGuid", visitGuid);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool UpdateQualityCheckStatus(int visitId, string qualityHeadComments, bool approvalStatus, int LoginUserId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", visitId);
            parameter.Add("@QualityCheckComments", qualityHeadComments);
            parameter.Add("@ApproveStatus", approvalStatus);
            parameter.Add("@loginUserId", LoginUserId);
            return _con.Query<bool>("UpdateQualityCheckStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        #endregion

        #region FinanceApproval

        public bool UpdateFinanceApprovalStatus(int visitId, string financeApproverComments, bool approvalStatus, int LoginUserId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", visitId);
            parameter.Add("@FinanceApproverComments", financeApproverComments);
            parameter.Add("@ApproveStatus", approvalStatus);
            parameter.Add("@loginUserId", LoginUserId);
            return _con.Query<bool>("UpdateFinanceApprovalStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        #endregion


        public IEnumerable<ScheduleVisitDomainModel> GetLogSheetDetailsDownload(int siteId, DateTime Startdate, DateTime Enddate)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@Startdate", Startdate);
            parameter.Add("@Enddate", Enddate);
            // parameter.Add("@UserActive", UserActive);
            return _con.Query<ScheduleVisitDomainModel>("GetLogSheetDetailsDownload1", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        //public IEnumerable<InspRepoNoDomainModel> GetInspRepoNoByPurchaseIds(List<string> purchaseIds)
        //{
        //    Connection();
        //    if (purchaseIds == null || !purchaseIds.Any()) return Enumerable.Empty<InspRepoNoDomainModel>();

        //    // Use parameterized IN clause via Dapper
        //    var sql = @"
        //        SELECT DISTINCT PurchaseID, InspReportNo
        //        FROM VisitEmpUploadFiles
        //        WHERE ISNULL(PurchaseID, '') <> ''
        //          AND ISNULL(InspReportNo, '') <> ''
        //          AND PurchaseID IN @PurchaseIds";

        //    return _con.Query<InspRepoNoDomainModel>(sql, new { PurchaseIds = purchaseIds }, commandType: CommandType.Text);
        //}

        public IEnumerable<ScheduleVisitDomainModel> GetLogSheetDetailsDownload1(  int siteId,  DateTime startdate,   DateTime enddate,    string filters)
        {
            Connection();

            var parameter = new DynamicParameters();

            parameter.Add("@SiteId", siteId);
            parameter.Add("@StartDate", startdate);
            parameter.Add("@EndDate", enddate);
            parameter.Add("@Filters", filters); // ✅ THIS IS THE KEY

            return _con.Query<ScheduleVisitDomainModel>(
                "[GetLogSheetDownload2]",
                parameter,
                commandType: CommandType.StoredProcedure
            );
        }

        public DataSet EditVisitScheduleByVID(int VisitId, List<int> PONIds, int POID)
        {
            Connection(); // Ensure _con is properly initialized
            using (SqlCommand cmd = new SqlCommand("EditVisitScheduleByVID", _con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                // Convert List<int> to DataTable
                cmd.Parameters.AddWithValue("@VisitId", VisitId);
                DataTable poIdTable = new DataTable();
                poIdTable.Columns.Add("Id", typeof(int));
                foreach (int id in PONIds)
                {
                    poIdTable.Rows.Add(id);
                }

                // Add TVP parameter
                SqlParameter poIdsParam = new SqlParameter("@PONIds", SqlDbType.Structured)
                {
                    TypeName = "dbo.IntListType",
                    Value = poIdTable
                };
                cmd.Parameters.Add(poIdsParam);

                // Add SiteId parameter
                cmd.Parameters.AddWithValue("@POID", POID);

                // Execute and fill dataset
                using (SqlDataAdapter da = new SqlDataAdapter(cmd))
                {
                    DataSet ds = new DataSet();
                    da.Fill(ds);
                    return ds;
                }
            }
        }

        // Implementation for reassigning a visit to a different control number
        public bool ReassignVisitControlNumber(int visitId, int toControlId, int changedBy, string reason)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", visitId);
            parameter.Add("@ToControlId", toControlId);
            parameter.Add("@ChangedBy", changedBy);
            parameter.Add("@Reason", reason);
            // Stored procedure must handle updating visit.controlid and inserting history
            return _con.Query<bool>("ReassignVisitControlNumber", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        //public DataSet EditVisitScheduleByVID(int VisitId,List<int> PONID, int POID)
        //{
        //    Connection();
        //    SqlCommand cmd = new SqlCommand();
        //    SqlDataAdapter da = new SqlDataAdapter();
        //    DataSet ds = new DataSet();
        //    cmd = new SqlCommand("EditVisitScheduleByVID", _con);
        //    cmd.CommandType = CommandType.StoredProcedure;
        //    cmd.Parameters.AddWithValue("@VisitID", VisitId);
        //    cmd.Parameters.AddWithValue("@PONID", PONID);
        //    cmd.Parameters.AddWithValue("@POID", POID);
        //    da = new SqlDataAdapter(cmd);
        //    da.Fill(ds);

        //    //foreach (DataTable table in ds.Tables)
        //    //{
        //    //    Console.WriteLine($"Table: {table.TableName}, Rows: {table.Rows.Count}");
        //    //}
        //    return ds;
        //    //cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
        //}
    }
}
