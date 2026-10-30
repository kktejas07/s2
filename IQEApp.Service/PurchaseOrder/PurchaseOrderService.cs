using Dapper;
using DocumentFormat.OpenXml.Drawing.Diagrams;
using IQEApp.Domain.CommonDomain;
using IQEApp.Domain.ControlNumberDomain;
using IQEApp.Domain.ManufacturerDomain;
using IQEApp.Domain.PurchaseOrderDomain;
using IQEApp.Domain.UserDomain;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Security.Cryptography;

namespace IQEApp.Service.PurchaseOrder
{
    public interface IPurchaseOrderService
    {
        #region PurchaseOrders
        DataSet GetPurchaseOrderDetailsToAdd(int loginUserSiteId);
        PurchaseOrderDomainModel GetManufacturerDetails(int manufacturerId);

        PurchaseOrderNumbersDomainModel GetManufacturerDetailsToEditPONumbers(int manufacturerId, int POId);
       // IEnumerable<PurchaseOrderNumbersDomainModel> GetManufacturerDetailsToEditPONumbers(int manufacturerId,int POId);
        int AddNewPO(PurchaseOrderDomainModel model);

        Tuple<int, int> AddNewPONumbers(PurchaseOrderDomainModel model);
        int AddNewPONumbersToExistingPOID(PurchaseOrderNumbersDomainModel model);
        bool IsPurchaseOrderExistsAlready(int poId, string poNumber, int manufacturerId, string controlId, int clientId, int clientUnitId);
        bool IsPurchaseOrderExistsAlready1(int POId,int ManufacturerId, Guid PONGuid);
        IEnumerable<PurchaseOrderDomainModel> GetPurchaseOrders(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fiYear,string searchColumn);
        
        IEnumerable<PurchaseOrderNumbersDomainModel> GetPONumbersByManufacturerId(string controlNo, int manufacturerId);

        //  IEnumerable<PurchaseOrderNumbersDomainModel> GetPONumbersByManufacturerId(int controlNo, int manufacturerId);
        DataSet GetPurchaseOrderDetailsToEdit(Guid PurchaseOrderGuid, string ControlNoSONo, int loginUserSiteId);
        bool UpdatePurchaseOrder(PurchaseOrderDomainModel model);

        UpdatePOResultDomainModel UpdatePurchaseOrderNumbers(PurchaseOrderNumbersDomainModel model, bool IsReadonly);
        bool UpdatePurchaseOrderStatus(PurchaseOrderDomainModel model);
        DataSet GetPurchaseOrderDetailsById(int PoId, int siteId);

        DataSet GetPurchaseOrderDetailsById1(List<int> PONIds, int siteId);
        DataSet GetPurchaseOrderDetailsByIds(List<int> PONIds, int siteId, int VisitId);

        #endregion

        #region Items

        IEnumerable<PurchaseOrderItemsDomainModel> GetPurchaseOrderItems(int poId, int loggedInUser);

        //IEnumerable<PurchaseOrderNumbersDomainModel> GetPurchaseOrderNumber(int poId, string PONumber);
        DataSet GetPurchaseOrderNumber(int poId, int PONID, string PONumber);
        List<PurchaseOrderNumbersDomainModel> GetMatchingPONumbers(string PONumber);

        List<PurchaseOrderNumbersDomainModel> GetMatchingPONumbers1(int ClientId, string PONumber);
        //IEnumerable<PurchaseOrderItemsDomainModel> GetPOItemDetailsToEdit(int poId, string PONumber);
        DataSet GetPOItemDetailsToEdit(int manufacturerId, string PONumber, int loginUserSiteId);
        DataSet GetPOItemDetailsToEdit1(Guid purchaseOrderGuid, int loginUserSiteId);
        bool AddPurchaseItem(PurchaseOrderItemsDomainModel model);

        bool UpdatePurchaseOrderItem(PurchaseOrderItemsDomainModel model);
        bool DeletePurchaseOrderNumbr(int PONId);
        bool DeletePurchaseOrderItem(Guid purchaseOrderGuid);
        List<PONumberItemsDomainModel> GetAllPONumbersByClient(int clientId);
        List<PONumberItemsDomainModel> GetAllPONumbersByManufacturer(int manufacturerId);
        List<PONumberItemsDomainModel> GetMappedPONumbersByVisitId(int visitId, string SOIDs, string POItemIds);
       // List<CommonDomainModel.CountryDomainModel> GetCountries();
        DataSet GetCountryStateUserDetails(int? CountryId, int? StateId, int? UserId);
        #endregion
    }
    public class PurchaseOrderService : IPurchaseOrderService
    {
        #region PurchaseOrders



        private SqlConnection _con;
        private void Connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(constring);
        }

        public PurchaseOrderDomainModel GetManufacturerDetails(int manufacturerId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerId", manufacturerId);
            return _con.Query<PurchaseOrderDomainModel>("GetManufacturerDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public PurchaseOrderNumbersDomainModel GetManufacturerDetailsToEditPONumbers(int manufacturerId, int POId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@POId", POId);
            parameter.Add("@ManufacturerId", manufacturerId);
            return _con.Query<PurchaseOrderNumbersDomainModel>("GetManufacturerDetailsToEditPONumbers", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        //public IEnumerable<PurchaseOrderNumbersDomainModel> GetManufacturerDetailsToEditPONumbers(int manufacturerId,int POId)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@POId", POId);
        //    parameter.Add("@ManufacturerId", manufacturerId);
        //    return _con.Query<PurchaseOrderNumbersDomainModel>("GetManufacturerDetailsToEditPONumbers", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        //}


        public DataSet GetPurchaseOrderDetailsToAdd(int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetPurchaseOrderDetailsToAdd", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public int AddNewPO(PurchaseOrderDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientId", model.ClientId);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            //parameter.Add("@ManufacturerId", model.ManufacturerId);
            //parameter.Add("@ManufacturerUnitIds", model.ManufacturerUnitIds);
            // parameter.Add("@PONumber", model.PONumber);
            // parameter.Add("@PODate", model.PoDate);
            // parameter.Add("@POComments", model.POComments);
            parameter.Add("@ControlNo", model.ControlNo);
            parameter.Add("@ControlNoSONo", model.ControlNoSONo);
            parameter.Add("@SiteId", model.SiteId);
            parameter.Add("@LoggedInUser", model.LoggedInUser);
            return _con.Query<int>("AddNewPurchaseOrder", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public Tuple<int, int> AddNewPONumbers(PurchaseOrderDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@POID", model.POId);
            parameter.Add("@ManufacturerId", model.ManufacturerId);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@PODate", model.PoDate);
            parameter.Add("@SiteId", model.SiteId);
            parameter.Add("@LoggedInUser", model.LoggedInUser);

            var result = _con.Query<(int PONID, int ManufacturerId)>("AddNewPONumbers1", parameter, commandType: CommandType.StoredProcedure).SingleOrDefault();

            return new Tuple<int, int>(result.Item1, result.Item2);
        }


        public int AddNewPONumbersToExistingPOID(PurchaseOrderNumbersDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@POID", model.POId);
            parameter.Add("@ManufacturerId", model.ManufacturerId);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@PODate", model.PoDate);
            parameter.Add("@SiteId", 1);
            parameter.Add("@LoggedInUser", 1);
            return _con.Query<int>("AddNewPONumbers", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool IsPurchaseOrderExistsAlready(int poId, string poNumber,int manufacturerId, string controlId,  int clientId, int clientUnitId)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@POId", poId);
            para.Add("@PONumber", poNumber);
            para.Add("@ManufacturerId", manufacturerId);
            para.Add("@ControlID", controlId);
            para.Add("@ClientID", clientId);
            para.Add("@ClientUnitId", clientUnitId);
            return _con.Query<bool>("IsPurchaseOrderExistsAlready3",  para, commandType: CommandType.StoredProcedure ).Single();
        }


        public bool IsPurchaseOrderExistsAlready1(int POId, int ManufacturerId, Guid PONGuid)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@POId", POId);
            para.Add("@PONGuid", PONGuid);
            para.Add("@ManufacturerId", ManufacturerId);
            return _con.Query<bool>("IsPurchaseOrderExistsAlready2", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }
        public IEnumerable<PurchaseOrderDomainModel> GetPurchaseOrders(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder, string fiYear, string searchColumn)
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
            parameter.Add("@searchColumn",searchColumn);
            return _con.Query<PurchaseOrderDomainModel>("GetPurchaseOrdersBySiteId2", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }


        public IEnumerable<PurchaseOrderNumbersDomainModel> GetPONumbersByManufacturerId(string controlNo, int manufacturerId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ControlNo", controlNo);
            parameter.Add("@ManufacturerId", manufacturerId);
            return _con.Query<PurchaseOrderNumbersDomainModel>("GetPONumbersByManufacturerId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        //public PurchaseOrderNumbersDomainModel GetPONumbersByManufacturerId(int controlNo, int manufacturerId)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@ControlNo", controlNo);
        //    parameter.Add("@ManufacturerId", manufacturerId);
        //    return _con.Query<PurchaseOrderNumbersDomainModel>("GetPONumbersByManufacturerId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        //}
        //public IEnumerable<PurchaseOrderNumbersDomainModel> GetPONumbersByManufacturerId(int controlNo, int manufacturerId)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@ControlNo", controlNo);
        //    parameter.Add("@ManufacturerId", manufacturerId);
        //    return _con.Query<PurchaseOrderNumbersDomainModel>("GetPONumbersByManufacturerId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        //}
        public DataSet GetPurchaseOrderDetailsToEdit(Guid PurchaseOrderGuid, string ControlNoSONo,int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetPurchaseOrderDetailsToEdit_Latest", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@POGuid", PurchaseOrderGuid);
            cmd.Parameters.AddWithValue("@ControlNoSONo", ControlNoSONo);
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);

            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }


        public bool UpdatePurchaseOrder(PurchaseOrderDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@POGuid", model.POGuid);
            parameter.Add("@ClientId", model.ClientId);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            parameter.Add("@ManufacturerId", model.ManufacturerId);
            //parameter.Add("@ManufacturerUnitId", model.ManufacturerUnitId);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@PODate", model.PoDate);
            parameter.Add("@POComments", model.POComments);
            parameter.Add("@LoggedInUser", model.LoggedInUser);
            return _con.Query<bool>("UpdatePurchaseOrder", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public UpdatePOResultDomainModel UpdatePurchaseOrderNumbers(PurchaseOrderNumbersDomainModel model, bool IsReadonly)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@POID", model.POId);
            parameter.Add("@ControlNo", model.ControlNo);
            parameter.Add("@ClientId", model.ClientID);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            parameter.Add("@ManufacturerId", model.ManufacturerId);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@PODate", model.PoDate);
            parameter.Add("@PONGuid", model.PONGuid);
            parameter.Add("@PONId", model.PONId);
            parameter.Add("@IsReadonly", IsReadonly);

            return _con.Query<UpdatePOResultDomainModel>(
                "UpdatePurchaseOrderNumbers1",
                parameter,
                commandType: CommandType.StoredProcedure
            ).SingleOrDefault();
        }

        //public bool UpdatePurchaseOrderNumbers(PurchaseOrderNumbersDomainModel model, bool IsReadonly)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@POID", model.POId);
        //    parameter.Add("@ControlNo", model.ControlNo);
        //    parameter.Add("@ClientId", model.ClientID);
        //    parameter.Add("@ClientUnitId", model.ClientUnitId);
        //    parameter.Add("@ManufacturerId", model.ManufacturerId);
        //    parameter.Add("@PONumber", model.PONumber);
        //    parameter.Add("@PODate", model.PoDate);
        //    parameter.Add("@PONGuid", model.PONGuid);
        //    parameter.Add("@PONId", model.PONId);
        //    parameter.Add("@IsReadonly", IsReadonly);
        //   // parameter.Add("@LoggedInUser", model.LoggedInUser);
        //    return _con.Query<bool>("UpdatePurchaseOrderNumbers", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        //}
        public bool UpdatePurchaseOrderStatus(PurchaseOrderDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@POGuid", model.POGuid);
            parameter.Add("@Status", model.IsPOActive);
            parameter.Add("@LoggedInUser", model.LoggedInUser);
            return _con.Query<bool>("UpdatePurchaseOrderStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet GetPurchaseOrderDetailsById(int PONId, int siteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetPurchaseOrderDetailsById", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@POID", PONId);
            cmd.Parameters.AddWithValue("@SiteId", siteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public DataSet GetPurchaseOrderDetailsById1(List<int> PONIds, int siteId)
        {
            Connection(); // Ensure _con is properly initialized
            using (SqlCommand cmd = new SqlCommand("GetPurchaseOrderDetailsById1", _con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                // Convert List<int> to DataTable
                DataTable poIdTable = new DataTable();
                poIdTable.Columns.Add("Id", typeof(int));
                foreach (int id in PONIds)
                {
                    poIdTable.Rows.Add(id);
                }

                // Add TVP parameter
                SqlParameter poIdsParam = new SqlParameter("@PONIDs", SqlDbType.Structured)
                {
                    TypeName = "dbo.IntListType",
                    Value = poIdTable
                };
                cmd.Parameters.Add(poIdsParam);

                // Add SiteId parameter
                cmd.Parameters.AddWithValue("@SiteId", siteId);

                // Execute and fill dataset
                using (SqlDataAdapter da = new SqlDataAdapter(cmd))
                {
                    DataSet ds = new DataSet();
                    da.Fill(ds);
                    return ds;
                }
            }
        }
        public DataSet GetPurchaseOrderDetailsByIds(List<int> PONIds, int siteId, int VisitId)
        {
            Connection(); // Ensure _con is properly initialized
            using (SqlCommand cmd = new SqlCommand("GetPurchaseOrderDetailsByIds", _con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                // Convert List<int> to DataTable
                DataTable poIdTable = new DataTable();
                poIdTable.Columns.Add("Id", typeof(int));
                foreach (int id in PONIds)
                {
                    poIdTable.Rows.Add(id);
                }

                // Add TVP parameter
                SqlParameter poIdsParam = new SqlParameter("@PONIDs", SqlDbType.Structured)
                {
                    TypeName = "dbo.IntListType",
                    Value = poIdTable
                };
                cmd.Parameters.Add(poIdsParam);

                // Add SiteId parameter
                cmd.Parameters.AddWithValue("@SiteId", siteId);
                cmd.Parameters.AddWithValue("@VisitId", VisitId);

                // Execute and fill dataset
                using (SqlDataAdapter da = new SqlDataAdapter(cmd))
                {
                    DataSet ds = new DataSet();
                    da.Fill(ds);
                    return ds;
                }
            }
        }

        #endregion

        #region Items
        public IEnumerable<PurchaseOrderItemsDomainModel> GetPurchaseOrderItems(int poId, int loggedInUser)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@POId", poId);
            parameter.Add("@LoggedInUser", loggedInUser);
            var result = _con.Query<PurchaseOrderItemsDomainModel>("GetPurchaseOrderItemsByOrderId", parameter,commandType: CommandType.StoredProcedure).ToList();
            return result;// _con.Query<PurchaseOrderItemsDomainModel>("GetPurchaseOrderItemsByOrderId", parameter,  commandType: CommandType.StoredProcedure);
        }

        public DataSet GetPurchaseOrderNumber(int poId, int  PONID, string PONumber)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetPurchaseOrderNumber1", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@POId", poId);
            cmd.Parameters.AddWithValue("@PONumber", PONumber);
            cmd.Parameters.AddWithValue("@PONID", PONID);

            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        //public IEnumerable<PurchaseOrderNumbersDomainModel> GetPurchaseOrderNumber(int poId, string PONumber)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@POId", poId);
        //    parameter.Add("@PONumber", PONumber);
        //    return _con.Query<PurchaseOrderNumbersDomainModel>("GetPurchaseOrderNumber", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        //}

        public List<PurchaseOrderNumbersDomainModel> GetMatchingPONumbers(string PONumber)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@PONumber", PONumber);
            return _con.Query<PurchaseOrderNumbersDomainModel>("GetMatchingPONumbers", parameter, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }

        public List<PurchaseOrderNumbersDomainModel> GetMatchingPONumbers1(int ClientId, string PONumber)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientId", ClientId);
            parameter.Add("@PONumber", PONumber);
            return _con.Query<PurchaseOrderNumbersDomainModel>("GetMatchingPONumbers1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }


        public DataSet GetPOItemDetailsToEdit(int manufacturerId, string PONumber, int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetPOItemDetailsToEdit", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@ManufacturerId", manufacturerId);
            cmd.Parameters.AddWithValue("@PONumber", PONumber);
            //cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);

            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public DataSet GetPOItemDetailsToEdit1(Guid purchaseOrderGuid, int loginUserSiteId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetPOItemDetailsToEdit1", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@POItemGuid", purchaseOrderGuid);
            //cmd.Parameters.AddWithValue("@PONumber", PONumber);
            //cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);

            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        //public IEnumerable<PurchaseOrderItemsDomainModel> GetPOItemDetailsToEdit(int poId, string PONumber)
        //{
        //    Connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@POId", POId);
        //    parameter.Add("@ManufacturerId", manufacturerId);
        //    return _con.Query<PurchaseOrderItemsDomainModel>("GetManufacturerDetailsToEditPONumbers", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        //} 
        public bool AddPurchaseItem(PurchaseOrderItemsDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@POId", model.POId);
            parameter.Add("@PONId", model.PONId);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@ItemNo", model.POItemNo);
            parameter.Add("@Description", model.Description);
            parameter.Add("@Quantity", model.Quantity == 0 ? null : (object)model.Quantity);
            parameter.Add("@NoOfVisits", model.NumberOfVisits == 0 ? null : (object)model.NumberOfVisits);
            parameter.Add("@Remarks", model.Remarks);
            parameter.Add("@UOMID", model.UOMID == 0 ? null : (object)model.UOMID);
            parameter.Add("@UOMOthers", model.UOMOthers);
            parameter.Add("@LoggedInUser", 1);
            return _con.Query<bool>("AddPurchaseOrderItem", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool UpdatePurchaseOrderItem(PurchaseOrderItemsDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();

            parameter.Add("@POItemId", model.POItemId);
            //parameter.Add("@PONId", model.PONId);
            parameter.Add("@PONumber", model.PONumber);
            parameter.Add("@ItemNo", model.POItemNo);
            parameter.Add("@Description", model.Description);
            parameter.Add("@Quantity", model.Quantity == 0 ? null : (object)model.Quantity);
            parameter.Add("@NoOfVisits", model.NumberOfVisits == 0 ? null : (object)model.NumberOfVisits);
            parameter.Add("@Remarks", model.Remarks);
            parameter.Add("@LoggedInUser", 1);
            parameter.Add("@UOMID",model.UOMID == 0 ? null : (object)model.UOMID);
            parameter.Add("@UOMOthers", model.UOMOthers);
            // parameter.Add("@LoggedInUser", model.LoggedInUser);
            return _con.Query<bool>("UpdatePurchaseOrderItem", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool DeletePurchaseOrderNumbr(int PONId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@PONId", PONId);
            return _con.Query<bool>("DeletePurchaseOrderNumber", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool DeletePurchaseOrderItem(Guid purchaseOrderGuid)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@POItemGuid", purchaseOrderGuid);
            return _con.Query<bool>("DeletePurchaseOrderItem", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public List<PONumberItemsDomainModel> GetAllPONumbersByClient(int clientId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ClientId", clientId);

            return _con.Query<PONumberItemsDomainModel>(
                "GetAllPONumbersByClient_Latest",
                parameter,
                commandType: CommandType.StoredProcedure
            ).ToList();
        }
        public List<PONumberItemsDomainModel> GetAllPONumbersByManufacturer(int manufacturerId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@ManufacturerId", manufacturerId);

            return _con.Query<PONumberItemsDomainModel>(
                "GetAllPONumbersByManufacturer",
                parameter,
                commandType: CommandType.StoredProcedure
            ).ToList();
        }

        public List<PONumberItemsDomainModel> GetMappedPONumbersByVisitId(int visitId, string SOIDs, string POItemIds)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", visitId);
            parameter.Add("@SOIDs", SOIDs);
            parameter.Add("@POItemIds", POItemIds);
            return _con.Query<PONumberItemsDomainModel>(
                "GetMappedPONumbersByVisitId11",
                parameter,
                commandType: CommandType.StoredProcedure
            ).ToList();
        }

        public DataSet GetCountryStateUserDetails(int? CountryId, int? StateId, int? UserId)
        {
            Connection();
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetCountryStateUserDetails", _con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@CountryId", CountryId);
            cmd.Parameters.AddWithValue("@StateId", StateId);
            cmd.Parameters.AddWithValue("@UserId", UserId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        //public List<CommonDomainModel.CountryDomainModel> GetCountries()
        //{
        //    List<CommonDomainModel.CountryDomainModel> countries = new List<CommonDomainModel.CountryDomainModel>();
        //    Connection();

        //    return _con.Query<CommonDomainModel.CountryDomainModel>("GetCountries",commandType: CommandType.StoredProcedure).ToList();
        //    //using (SqlCommand cmd = new SqlCommand("GetCountries", _con))
        //    //{
        //    //    cmd.CommandType = CommandType.StoredProcedure;

        //    //    using (SqlDataReader reader = cmd.ExecuteReader())
        //    //    {
        //    //        while (reader.Read())
        //    //        {
        //    //            countries.Add(new CommonDomainModel.CountryDomainModel
        //    //            {
        //    //                CountryId = Convert.ToInt32(reader["CountryId"]),
        //    //                CountryName = reader["CountryName"].ToString()
        //    //            });
        //    //        }
        //    //    }
        //    //}

        //    //return countries;
        //}


        #endregion
    }
}
