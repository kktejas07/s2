using Dapper;
using IQEApp.Domain.ControlNumberDomain;
using IQEApp.Domain.Invoice;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.InvoiceService
{
    public interface IInvoiceService
    {
        DataSet GetDefaultDetailsToGenerateInvoice(int loginUserSiteId);
        InvoiceDirectoryDomainModel GetInvoiceListForDirectory(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fiYear ,string InvoiceType);


        //IEnumerable<InvoiceDomainModel> GetInvoiceListForDirectory(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fiYear);
        DataSet GetVisitsListForInvoice(InvoiceDomainModel model);
        DataSet GetVisitsListForInvoiceEdit(int invoiceId);
        int SaveInvoiceDetails(InvoiceDomainModel model);

        InvoiceDomainModel GetInvoiceDetailsToPreviewOrDownload(Guid InvoiceGuid);

        int SaveAnnexureDetails(VisitDetailsInvoiceDomainModel dataModel);
        IEnumerable<InvoiceConsolidateDomainModel> GetConsolidatedInvoiceDetails(int invoiceId, Guid invoiceGuid);
        void SaveConsolidatedInvoiceDetails(InvoiceConsolidateDomainModel model);
        DataSet GetInvoiceDataToPrint(int invoiceId, int siteId);
        bool updateUnFreezeInvoiceStatus(int InvoiceId);
        bool UpdateInvoiceFileDetails(int invoiceId, string invoiceName, string invoiceAzureLink, decimal invoiceSize, int loggedInUser);
        InvoiceDomainModel GetInvoiceDetailsToPreview(Guid invoiceGuid);
        DataSet GetInvoiceDataToEdit(Guid invoiceGuid, int siteId);
        DataSet GetInvoiceDetailsForEdit(int InvoiceId);
        bool UpdateInvoiceDetails(InvoiceDomainModel model);
        int UpdateAnnexureDetails(VisitDetailsInvoiceDomainModel model);
        IEnumerable<InvoiceConsolidateDomainModel> EditConsolidatedInvoiceDetails(Guid invoiceGuid);
        bool ClearPreviousConsolidatedInvoiceDetailsOnUpdate(int invoiceId);
        void UpdateConsolidatedInvoiceDetails(InvoiceConsolidateDomainModel model);
        bool CancelInvoice(Guid invoiceGuid, int currentUserId, string cancellationComments);
        bool UpdateInvoiceStatus(Guid invoiceGuid, int statusId, int currentUserId);
        IEnumerable<InvoiceDomainModel> GeInvoiceListToDownload(int siteId, DateTime Startdate, DateTime Enddate);
    }

    public class InvoiceService : IInvoiceService
    {
        #region DBConnection

        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }
        #endregion

        //public IEnumerable<InvoiceDomainModel> GetInvoiceListForDirectory(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fiYear)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@SiteId", siteId);
        //    parameter.Add("@strSearch", strSearch);
        //    parameter.Add("@alphaChar", alphaChar);
        //    parameter.Add("@Offset", offset);
        //    parameter.Add("@Fetch", fetch);
        //    parameter.Add("@ActiveStatus", activeStatus);
        //    parameter.Add("@SortingOrder", sortingOrder);
        //    parameter.Add("@FiYear", fiYear);
        //    return _con.Query<InvoiceDomainModel>("GetInvoiceListForDirectory1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        //}

        public InvoiceDirectoryDomainModel GetInvoiceListForDirectory(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fiYear, string InvoiceType)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@strSearch", strSearch);
            parameter.Add("@alphaChar", alphaChar);
            parameter.Add("@Offset", offset);
            parameter.Add("@Fetch", fetch);
            parameter.Add("@ActiveStatus", activeStatus);
            parameter.Add("@SortingOrder", sortingOrder);
            parameter.Add("@FiYear", fiYear);
            parameter.Add("@InvoiceType", InvoiceType);
            using (var multi = _con.QueryMultiple("GetInvoiceListForDirectory2", parameter, commandType: CommandType.StoredProcedure))
            {
                var invoiceList = multi.Read<InvoiceDomainModel>().ToList();
                var summary = multi.Read<InvoiceSummaryDomainModel>().FirstOrDefault();

                return new InvoiceDirectoryDomainModel
                {
                    Invoices = invoiceList,
                    Summary = summary
                };
            }
        }


        public DataSet GetDefaultDetailsToGenerateInvoice(int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetDefaultDetailsToGenerateInvoice", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public DataSet GetVisitsListForInvoice(InvoiceDomainModel model)
        {
            using (SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString))
            {
                SqlCommand cmd = new SqlCommand("GetVisitsListForInvoice2_Latest", con);
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.AddWithValue("@InvoiceType", model.InvoiceType);
                cmd.Parameters.AddWithValue("@ClientId", model.ClientId ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ClientUnitId", model.ClientUnitId ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ManufacturerId", model.ManufacturerId ?? (object)DBNull.Value);
                //cmd.Parameters.AddWithValue("@ManufacturerUnitId", model.ManufacturerUnitId ?? (object)DBNull.Value);

                cmd.Parameters.AddWithValue("@SOID", model.SOID);
                cmd.Parameters.AddWithValue("@FromDate", model.FromDate);
                cmd.Parameters.AddWithValue("@ToDate", model.ToDate);

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);

                return ds;
            }
        }

        public DataSet GetVisitsListForInvoiceEdit(int InvoiceId)
        {
            using (SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString))
            {
                SqlCommand cmd = new SqlCommand("GetVisitsListForInvoiceEdit", con);
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.AddWithValue("@InvoiceId", InvoiceId);
                
                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);

                return ds;
            }
        }



        public int SaveInvoiceDetails(InvoiceDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceId", model.InvoiceID);
            parameter.Add("@ClientId", model.ClientId);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            parameter.Add("@ManufacturerId", model.ManufacturerId);
            parameter.Add("@FromDate", model.FromDate);
            parameter.Add("@ToDate", model.ToDate);
            parameter.Add("@SOID", model.SOID);
            parameter.Add("@InvoicePrice", model.InvoicePrice);
            parameter.Add("@Encl", model.Encl);
            parameter.Add("@InvoiceTemplateId", model.InvoiceTemplateId);
            parameter.Add("@CreatedBy", model.LoginUserId);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@ContactName", model.ClientContactName);
            parameter.Add("@ContactAddress", model.ClientContactAddress);
            parameter.Add("@Currency", model.Currency);
            parameter.Add("@Subject", model.Subject);
            parameter.Add("@ExchangeRate", model.ExchangeRate);
            parameter.Add("@TotalAmount", model.TotalAmount);
            parameter.Add("@IsInvoiceFrozen", model.IsInvoiceFrozen);
            parameter.Add("@CGST", model.CGST);
            parameter.Add("@CGSTPercentage", model.CGSTPercentage);
            parameter.Add("@SGST", model.SGST);
            parameter.Add("@SGSTPercentage", model.SGSTPercentage);
            parameter.Add("@IGST", model.IGST);
            parameter.Add("@IGSTPercentage", model.IGSTPercentage);
            parameter.Add("@GrandTotalAmount", model.GrandTotalAmount);
            parameter.Add("@ClientGSTNo", model.ClientGSTNo);
            parameter.Add("@SiteId", model.SiteId);
            parameter.Add("@IsSez", model.IsSez);
            parameter.Add("@IsOverseas", model.IsOverseas);
            parameter.Add("@MileageCost", model.MileageCost);
            parameter.Add("@InvoiceType", model.InvoiceType);
            parameter.Add("@ControlID", model.ControlID);
            return _con.Query<int>("SaveInvoiceDetails1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public int SaveAnnexureDetails(VisitDetailsInvoiceDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceId", model.InvoiceId);
            parameter.Add("@VisitId", model.VisitId);
            parameter.Add("@VEMId", model.VEMId);
            parameter.Add("@MileageCost", model.MileageCost);
            parameter.Add("@FoodAllowance", model.FoodAllowance);
            //parameter.Add("@ModeOfTransport", model.ModeOfTransport);
            parameter.Add("@TravelFare", model.TravelFare);
            parameter.Add("@Hotel", model.Hotel);
            parameter.Add("@ServiceCharge", model.ServiceCharge);
            parameter.Add("@OtherExpenses", model.OtherExpenses);
            parameter.Add("@Total", model.Total);
            parameter.Add("@Remarks", model.Remarks);
            parameter.Add("@VisitDate", model.VisitDate);
            parameter.Add("@Name", model.VisitContactName);
            parameter.Add("@ManufacturerName", model.ManufacturerName);
            parameter.Add("@Location", model.VisitLocation);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@PODate", model.PODate);
            parameter.Add("@InspectorCode", model.InspectorName);
            parameter.Add("@ReportNo", model.InspReportNo);
            parameter.Add("@Distance", model.Distance);
            parameter.Add("@TimeIn", model.TimeIn);
            parameter.Add("@TimeOut", model.TimeOut);
            parameter.Add("@TotalHrs", model.TotalHrs);
            return _con.Query<int>("SaveAnnexureDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public IEnumerable<InvoiceConsolidateDomainModel> GetConsolidatedInvoiceDetails(int invoiceId, Guid invoiceGuid)
        {
            Connection();
            var parameters = new DynamicParameters();
            parameters.Add("InvoiceId", invoiceId);
            parameters.Add("@InvoiceGuid", invoiceGuid);
            return _con.Query<InvoiceConsolidateDomainModel>("GetConsolidatedInvoiceDetails", parameters, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }

        public void SaveConsolidatedInvoiceDetails(InvoiceConsolidateDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceId", model.InvoiceId);
            parameter.Add("@SNo", model.SNo);
            parameter.Add("@Category", model.Category);
            parameter.Add("@Description", model.Description);
            parameter.Add("@UOM", model.UOM);
            parameter.Add("@Rate", model.Rate);
            parameter.Add("@Amount", model.Amount);
            _con.Query("SaveConsolidatedInvoiceDetails", parameter, null, true, 0, CommandType.StoredProcedure);
        }
        public DataSet GetInvoiceDataToPrint(int invoiceId, int siteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetInvoiceDataToPrint", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@InvoiceId", invoiceId);
            cmd.Parameters.AddWithValue("@SiteId", siteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool updateUnFreezeInvoiceStatus(int InvoiceId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceId", InvoiceId);
            return _con.Query<bool>("updateUnFreezeInvoiceStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();

        }

        public bool UpdateInvoiceFileDetails(int invoiceId, string invoiceName, string invoiceAzureLink, decimal invoiceSize, int loggedInUser)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceId", invoiceId);
            parameter.Add("@InvoiceName", invoiceName);
            parameter.Add("@InvoiceAzureLink", invoiceAzureLink);
            parameter.Add("@InvoiceSize", invoiceSize);
            parameter.Add("@LoggedInUser", loggedInUser);
            return _con.Query<bool>("UpdateInvoiceFileDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public InvoiceDomainModel GetInvoiceDetailsToPreviewOrDownload(Guid InvoiceGuid)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceGuid", InvoiceGuid);
            //parameter.Add("@SectionId", SId);
            return _con.Query<InvoiceDomainModel>("GetInvoiceDetailsToPreviewOrDownload", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public InvoiceDomainModel GetInvoiceDetailsToPreview(Guid invoiceGuid)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceGuid", invoiceGuid);
            return _con.Query<InvoiceDomainModel>("GetInvoiceDetailsToPreviewOrDownload", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet GetInvoiceDataToEdit(Guid invoiceGuid, int siteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetInvoiceDetailsToEdit1", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@InvoiceGuid", invoiceGuid);
            cmd.Parameters.AddWithValue("@SiteId", siteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public DataSet GetInvoiceDetailsForEdit(int InvoiceId)
        {
            using (SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString))
            {
                SqlCommand cmd = new SqlCommand("GetInvoiceDetailsForEdit", con);
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.AddWithValue("@InvoiceId", InvoiceId);

                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                da.Fill(ds);

                return ds;
            }
        }


        public bool UpdateInvoiceDetails(InvoiceDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceId", model.InvoiceID);
            parameter.Add("@InvoiceGuid", model.InvoiceGuid);
            parameter.Add("@ClientId", model.ClientId);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            parameter.Add("@FromDate", model.FromDate);
            parameter.Add("@ToDate", model.ToDate);
            parameter.Add("@InvoiceNo", model.InvoiceNo);
            parameter.Add("@InvoicePrice", model.InvoicePrice);
            //parameter.Add("@EmailId", model.EmailId);
            //parameter.Add("@CourierSendDate", model.CourierSendDate);
            //parameter.Add("@CourierReceiveDate", model.CourierReceiveDate);
            //parameter.Add("@InvoiceDate", model.InvoiceDate);
            parameter.Add("@Encl", model.Encl);
            parameter.Add("@InvoiceTemplateId", model.InvoiceTemplateId);
            parameter.Add("@CreatedBy", model.LoginUserId);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@ContactName", model.ClientContactName);
            parameter.Add("@ContactAddress", model.ClientContactAddress);
            parameter.Add("@Currency", model.Currency);
            parameter.Add("@Subject", model.Subject);
            parameter.Add("@ExchangeRate", model.ExchangeRate);
            parameter.Add("@TotalAmount", model.TotalAmount);
            parameter.Add("@IsInvoiceFrozen", model.IsInvoiceFrozen);
            parameter.Add("@CGST", model.CGST);
            parameter.Add("@CGSTPercentage", model.CGSTPercentage);
            parameter.Add("@SGST", model.SGST);
            parameter.Add("@SGSTPercentage", model.SGSTPercentage);
            parameter.Add("@IGST", model.IGST);
            parameter.Add("@IGSTPercentage", model.IGSTPercentage);
            parameter.Add("@GrandTotalAmount", model.GrandTotalAmount);
            parameter.Add("@ClientGSTNo", model.ClientGSTNo);
            parameter.Add("@SiteId", model.SiteId);
            parameter.Add("@MileageCost", model.MileageCost);
            //parameter.Add("@IsSez", model.IsSez);
            //parameter.Add("@IsOverseas", model.IsOverseas);
            parameter.Add("@MileageCost", model.MileageCost);
            return _con.Query<bool>("UpdateInvoiceDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public int UpdateAnnexureDetails(VisitDetailsInvoiceDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceId", model.InvoiceId);
            parameter.Add("@InvoiceVisitId", model.InvoiceVisitId);
            parameter.Add("@VisitId", model.VisitId);
            parameter.Add("@VEMId", model.VEMId);
            parameter.Add("@MileageCost", model.MileageCost);
            parameter.Add("@FoodAllowance", model.FoodAllowance);
            parameter.Add("@ModeOfTransport", 0);
            parameter.Add("@TravelFare", model.TravelFare);
            parameter.Add("@Hotel", model.Hotel);
            parameter.Add("@ServiceCharge", model.ServiceCharge);
            parameter.Add("@OtherExpenses", model.OtherExpenses);
            parameter.Add("@Total", model.Total);
            parameter.Add("@Remarks", model.Remarks);
            parameter.Add("@VisitDate", model.VisitDate);
            parameter.Add("@Name", model.VisitContactName);
            //parameter.Add("@Name", "");
            parameter.Add("@ManufacturerName", model.ManufacturerName);
            parameter.Add("@Location", model.VisitLocation);
            //parameter.Add("@Location", "");
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@PODate", model.PODate);
            parameter.Add("@InspectorCode", model.InspectorName);
            //parameter.Add("@InspectorCode", model.InspectorCode);
            parameter.Add("@ReportNo", model.InspReportNo);
            parameter.Add("@Distance", model.Distance);
            parameter.Add("@TimeIn", model.TimeIn);
            parameter.Add("@TimeOut", model.TimeOut);
            parameter.Add("@TotalHrs", model.TotalHrs);
            //parameter.Add("@ModeOfTransport", model.ModeOfTransport);

            return _con.Query<int>("UpdateAnnexureDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public IEnumerable<InvoiceConsolidateDomainModel> EditConsolidatedInvoiceDetails(Guid invoiceGuid)
        {
            Connection();
            var parameters = new DynamicParameters();
            //parameters.Add("InvoiceId", invoiceId);
            parameters.Add("@InvoiceGuid", invoiceGuid);
            return _con.Query<InvoiceConsolidateDomainModel>("GetConsolidatedInvoiceDetailsToEdit", parameters, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }
        public bool ClearPreviousConsolidatedInvoiceDetailsOnUpdate(int invoiceId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceId", invoiceId);
            return _con.Query<bool>("ClearPreviousConsolidatedInvoiceDetailsOnUpdate", parameter, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }
        public void UpdateConsolidatedInvoiceDetails(InvoiceConsolidateDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            //parameter.Add("@InvoiceConsolidateId", model.InvoiceConsolidateId);
            parameter.Add("@InvoiceId", model.InvoiceId);
            parameter.Add("@SNo", model.SNo);
            parameter.Add("@Category", model.Category);
            parameter.Add("@Description", model.Description);
            parameter.Add("@UOM", model.UOM);
            parameter.Add("@Rate", model.Rate);
            parameter.Add("@Amount", model.Amount);
            _con.Query("SaveConsolidatedInvoiceDetails", parameter, null, true, 0, CommandType.StoredProcedure);
        }

        public bool CancelInvoice(Guid invoiceGuid, int currentUserId, string cancellationComments)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceGuid", invoiceGuid);
            parameter.Add("@CurrentLoggedInUser", currentUserId);
            parameter.Add("@CancellationComments", cancellationComments);
            return _con.Query<bool>("CancelInvoiceByInvoiceGuid", parameter, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UpdateInvoiceStatus(Guid invoiceGuid, int statusId, int currentUserId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceGuid", invoiceGuid);
            parameter.Add("@StatusId", statusId);
            parameter.Add("@CurrentLoggedInUser", currentUserId);
            return _con.Query<bool>("UpdateInvoiceStatus", parameter, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }

        public IEnumerable<InvoiceDomainModel> GeInvoiceListToDownload(int siteId, DateTime Startdate, DateTime Enddate)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@Startdate", Startdate);
            parameter.Add("@Enddate", Enddate);
            // parameter.Add("@UserActive", UserActive);
            return _con.Query<InvoiceDomainModel>("GeInvoiceListToDownload", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
    }
}
