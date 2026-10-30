using Dapper;
using IQEApp.Domain.PaymentDomain;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace IQEApp.Service.PaymentService
{
    public interface IPaymentService
    {
        DataSet GetPaymentDetailsAgainstInvoice(int InvoiceId, int siteId);
        void CreatePayment(PaymentDomainModel objPaymentDomainModel);
        IEnumerable<PaymentDomainModel> FetchPaymentDetails(int InvoiceId, int siteId);
    }
    public class PaymentService : IPaymentService
    {
        #region DbConnection
        private SqlConnection _con;
        string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
        private void Connection()
        {

            _con = new SqlConnection(constring);
        }
        #endregion
        public DataSet GetPaymentDetailsAgainstInvoice(int InvoiceId, int siteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetPaymentDetailsAgainstInvoice", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@InvoiceId", InvoiceId);
            cmd.Parameters.AddWithValue("@SiteId", siteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public void CreatePayment(PaymentDomainModel objPaymentDomainModel)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", objPaymentDomainModel.SiteId);
            parameter.Add("@LoginUserId", objPaymentDomainModel.LoginUserId);
            parameter.Add("@PaymentDate", objPaymentDomainModel.PaymentDate);
            parameter.Add("@Amount", objPaymentDomainModel.Amount);
            parameter.Add("@PaymentModeId", objPaymentDomainModel.PaymentModeId);
            parameter.Add("@ReceiptNumber", objPaymentDomainModel.ReceiptNumber);
            parameter.Add("@ChallanNumber", objPaymentDomainModel.ChallanNumber);
            parameter.Add("@PaymentComments", objPaymentDomainModel.PaymentComments);
            parameter.Add("@InvoiceId", objPaymentDomainModel.InvoiceId);
            parameter.Add("@IsCreditNote", objPaymentDomainModel.IsCreditNote);
            _con.Query("CreatePayment", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<PaymentDomainModel> FetchPaymentDetails(int InvoiceId, int siteId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@InvoiceId", InvoiceId);
            parameter.Add("@SiteId", siteId);
            return _con.Query<PaymentDomainModel>("FetchPaymentDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
    }
}
