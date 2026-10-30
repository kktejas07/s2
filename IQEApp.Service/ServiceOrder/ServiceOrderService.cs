using Dapper;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Domain.PurchaseOrderDomain;
using IQEApp.Domain.ServiceOrderDomain;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.ServiceOrder
{
    public interface IServiceOrderService
    {
        IEnumerable<ServiceOrderDomainModel> GetServiceOrders(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder);
        DataSet GetServiceOrderDetailsToAdd(int loginUserSiteId);
        IEnumerable<PurchaseOrderDomainModel> GetPODetailsByClientUnitId(int ClientUnitId, int siteId, string ManufacturerUnitIds);
        bool IsServiceOrderExistsAlready(int SOID, string serviceOrderNumber, int siteId);
        int SaveNewServiceOrder(ServiceOrderDomainModel model);
        int SaveServiceOrderCNo(ServiceOrderDomainModel model);
        bool ServiceOrderUploadedFilesBySOID(ServiceOrderDomainModel objSODM, bool Flag);

        bool RemoveServiceOrderFileBySOID(ServiceOrderDomainModel objSODM);

        bool UpdateSOFilesBySOID(ServiceOrderDomainModel objSODM);
        DataSet GetServiceOrderDetailsToEdit(Guid serviceOrderGuid, int loginUserSiteId);
        bool UpdateServiceOrder(ServiceOrderDomainModel model);
        bool UpdateServiceOrderStatus(Guid serviceOrderGuid, int LoginUserId, bool status);
    }
    public class ServiceOrderService : IServiceOrderService
    {
        #region DBConnection
        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }
        #endregion

        #region ServiceOrders

        public IEnumerable<ServiceOrderDomainModel> GetServiceOrders(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
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
            return _con.Query<ServiceOrderDomainModel>("GetServiceOrdersBySiteId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
        public DataSet GetServiceOrderDetailsToAdd(int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetServiceOrderDetailsToAdd", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public IEnumerable<PurchaseOrderDomainModel> GetPODetailsByClientUnitId(int ClientUnitId, int siteId, string ManufacturerUnitIds)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@ClientUnitId", ClientUnitId);
            para.Add("@SiteId", siteId);
            //para.Add("@ManufacturerUnitId", ManufacturerUnitId);
            para.Add("@ManufacturerUnitIds", ManufacturerUnitIds);
            return _con.Query<PurchaseOrderDomainModel>("GetPODetailsByClientUnitId", para, null, true, 0, CommandType.StoredProcedure).ToList();
        }
        public bool IsServiceOrderExistsAlready(int SOID, string serviceOrderNumber, int siteId)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@SOId", SOID);
            para.Add("@SONumber", serviceOrderNumber);
            para.Add("@SiteId", siteId);
            return _con.Query<bool>("IsServiceOrderExistsAlready", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }

        public int SaveNewServiceOrder(ServiceOrderDomainModel model)
        {
            var parameter = new DynamicParameters();
            parameter.Add("@ClientId", model.ClientId);
            if (model.LOISOType == 1)
            {
                parameter.Add("@LOINumber", model.LOINumber);
            }
            else if (model.LOISOType == 2)
            {
                parameter.Add("@SONumber", model.SONumber);
            }
            parameter.Add("@SODate", model.SODate);
            parameter.Add("@SOType", model.SOType);
            if (model.SOType == 3)
            {
                parameter.Add("@OtherSOType", model.OtherSOType);
            }
            parameter.Add("@LOISOType", model.LOISOType);
            parameter.Add("@SiteId", model.SiteId);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            parameter.Add("@SODueDate", model.SODueDate);
            parameter.Add("@Amount", model.Amount);
            //parameter.Add("@POIDs", model.POIDs);
            parameter.Add("@SOComments", model.SOComments);
            parameter.Add("@ProjectNumber", model.ProjectNumber);
            parameter.Add("@ProjectName", model.ProjectName);
            parameter.Add("@LoggedInUser", model.LoginUserId);
            parameter.Add("@EID", model.EID);
            parameter.Add("@CurrencyId", model.CurrencyId);
            //parameter.Add("@EnquiryIdRefernce", model.EnquiryIdRefernce);
            //parameter.Add("@FileName", model.FileName);
            //parameter.Add("@FilePath", model.FilePath);
            //parameter.Add("@ManufacturerId", model.ManufacturerId);
            //parameter.Add("@ManufacturerUnitId", model.ManufacturerUnitId);
            //parameter.Add("@ManufacturerUnitIds", model.ManufacturerUnitIds);
            return _con.Query<int>("SaveServiceOrder", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public int SaveServiceOrderCNo(ServiceOrderDomainModel model)
        {
            var parameter = new DynamicParameters();
            parameter.Add("@ClientId", model.ClientId);
            if (model.LOISOType == 1)
            {
                parameter.Add("@LOINumber", model.LOINumber);
            }
            else if (model.LOISOType == 2)
            {
                parameter.Add("@SONumber", model.SONumber);
            }
            if (model.SOType == 3)
            {
                parameter.Add("@OtherSOType", model.OtherSOType);
            }
            parameter.Add("@SODate", model.SODate);
            parameter.Add("@SOType", model.SOType);
            parameter.Add("@LOISOType", model.LOISOType);
            parameter.Add("@SiteId", model.SiteId);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            parameter.Add("@SODueDate", model.SODueDate);
            parameter.Add("@Amount", model.Amount);
            parameter.Add("@POIDs", model.POIDs);
            parameter.Add("@SOComments", model.SOComments);
            parameter.Add("@ProjectNumber", model.ProjectNumber);
            parameter.Add("@ProjectName", model.ProjectName);
            parameter.Add("@LoggedInUser", model.LoginUserId);
            parameter.Add("@EID", model.EID);
            parameter.Add("@CurrencyId", model.CurrencyId);
            parameter.Add("@ControlID", model.ControlId);
            //parameter.Add("@EnquiryIdRefernce", model.EnquiryIdRefernce);
        //    parameter.Add("@FileName", model.FileName);
          //  parameter.Add("@FilePath", model.FilePath);
            //parameter.Add("@ManufacturerId", model.ManufacturerId);
            //parameter.Add("@ManufacturerUnitId", model.ManufacturerUnitId);
            //parameter.Add("@ManufacturerUnitIds", model.ManufacturerUnitIds);
            return _con.Query<int>("SaveServiceOrderCNo", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool ServiceOrderUploadedFilesBySOID(ServiceOrderDomainModel objSODM, bool Flag)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SOID", objSODM.SOId);
            // parameter.Add("@QuotationNo", objEDM.QuotationNo);
            // parameter.Add("@QuotationDate", objEDM.QuotationDate);
            parameter.Add("@FileName", objSODM.FileName);
            parameter.Add("@FilePath", objSODM.FilePath);
            parameter.Add("@CreatedBy",objSODM.CreatedBy);
            parameter.Add("@Flag", Flag);
            return _con.Query<bool>("ServiceOrderUploadedFilesBySOID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool RemoveServiceOrderFileBySOID(ServiceOrderDomainModel objSODM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SOID", objSODM.SOId);
            parameter.Add("@FileName", objSODM.FileName);
            return _con.Query<bool>("RemoveServiceOrderFileBySOID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        

        public bool UpdateSOFilesBySOID(ServiceOrderDomainModel objSODM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SOID", objSODM.SOId);
            // parameter.Add("@QuotationNo", objEDM.QuotationNo);
            // parameter.Add("@QuotationDate", objEDM.QuotationDate);
            parameter.Add("@FileName", objSODM.FileName);
            parameter.Add("@FilePath", objSODM.FilePath);
            parameter.Add("@CreatedBy", objSODM.CreatedBy);
            return _con.Query<bool>("UpdateSOFilesBySOID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet GetServiceOrderDetailsToEdit(Guid serviceOrderGuid, int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetServiceOrderDetailsToEdit1", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ServiceOrderGuid", serviceOrderGuid);
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool UpdateServiceOrder(ServiceOrderDomainModel model)
        {
            var parameter = new DynamicParameters();
            parameter.Add("@ClientId", model.ClientId);
            parameter.Add("@ServiceOrderGuid", model.ServiceOrderGuid);
            if (model.LOISOType == 1)
            {
                parameter.Add("@LOINumber", model.LOINumber);
            }
            else if (model.LOISOType == 2)
            {
                parameter.Add("@SONumber", model.SONumber);
            }

            parameter.Add("@SODate", model.SODate);
            parameter.Add("@SOType", model.SOType);
            if (model.SOType == 3)
            {
                parameter.Add("@OtherSOType", model.OtherSOType);
            }
            parameter.Add("@LOISOType", model.LOISOType);
            parameter.Add("@SiteId", model.SiteId);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            parameter.Add("@SODueDate", model.SODueDate);
            parameter.Add("@CurrencyId", model.CurrencyId);
            parameter.Add("@Amount", model.Amount);
            //parameter.Add("@PONumber", model.PONumber);
           // parameter.Add("@POIDs", model.POIDs);
            parameter.Add("@SOComments", model.SOComments);
            parameter.Add("@ProjectNumber", model.ProjectNumber);
            parameter.Add("@ProjectName", model.ProjectName);
            parameter.Add("@LoggedInUser", model.LoginUserId);
            //parameter.Add("@ManufacturerUnitIds", model.ManufacturerUnitIds);
            return _con.Query<bool>("UpdateServiceOrder", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UpdateServiceOrderStatus(Guid serviceOrderGuid, int LoginUserId, bool status)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ServiceOrderGuid", serviceOrderGuid);
            parameter.Add("@LoggedInUser", LoginUserId);
            parameter.Add("@IsSOActive", status);
            return _con.Query<bool>("UpdateServiceOrderStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        #endregion
    }
}
