using Dapper;
using IQEApp.Domain.PurchaseOrderDomain;
using IQEApp.Domain.VisitSchedule;
using IQEApp.Service.VisitProcessing;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static iTextSharp.text.pdf.PdfStructTreeController;

namespace IQEApp.Service.VisitScheduleService
{
    public interface IVisitScheduleService
    {
        int VisitScheduleSave(VisitScheduleDomainModel model, out string type);

        int AddVisitScheduleSelectedPOItems(PONumberItemsDomainModel model);
        DataSet EditVisitScheduleByVisitID(int VisitId);
        int VisitScheduleUpdate(VisitScheduleDomainModel model);
        int ReCreateVisitScheduleSelectedPOItems(PONumberItemsDomainModel model, bool flag);
        int SaveManufacturerVisitLocation(int visitId, int ManufacturerId, string LocationName, bool IsSubManufacturer, string SubManufacturerDetails, string contactNo, decimal? Cost, int LoginUserId, bool flag, string type);
    }

    public class VisitScheduleService : IVisitScheduleService
    {
        #region DbConnection
        private SqlConnection _con;
        string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
        private void Connection()
        {

            _con = new SqlConnection(constring);
        }
        #endregion

        public int VisitScheduleSave(VisitScheduleDomainModel model, out string returnType)
        {
            Connection();


            var parameter = new DynamicParameters();
            parameter.Add("@VisitTypeId", model.VisitTypeId);
            parameter.Add("@ClientId", model.ClientId);
            parameter.Add("@CountryId", model.CountryId);
            parameter.Add("@StateId", model.StateId);
            parameter.Add("@StateName", model.StateName);
            parameter.Add("@VisitLocation", model.VisitLocation);
            parameter.Add("@RFIScheduleDate", model.RFIScheduleDate);
            parameter.Add("@ScheduleDate", model.ScheduleDate);
            parameter.Add("@VisitDate", model.VisitDate);
            parameter.Add("@ScheduleComments", model.ScheduleComments);
            parameter.Add("@ClientConfirmation", model.ClientConfirmation);
            parameter.Add("@ManufacturerConfirmation", model.ManufacturerConfirmation);
           
            parameter.Add("@UserIds", model.UserIds);
            parameter.Add("@LoggedInUser", model.LoginUserId);
           
            parameter.Add("@ReturnType", dbType: DbType.String, size: 20, direction: ParameterDirection.Output);

            int id = _con.Query<int>("VisitScheduleSave2", parameter, commandType: CommandType.StoredProcedure)
                         .SingleOrDefault();

            returnType = parameter.Get<string>("@ReturnType");

            return id;
        }

        public int AddVisitScheduleSelectedPOItems(PONumberItemsDomainModel model)
        {
            Connection();
            var parameter = new DynamicParameters();

            parameter.Add("@POID", model.POID);
           // parameter.Add("@PurchaseID", model.PurchaseID);
            parameter.Add("@PONID", model.PONID);
            parameter.Add("@ControlID", model.ControlID);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            parameter.Add("@SOId", model.SOId);
            parameter.Add("@ManufacturerId", model.ManufacturerId);
            parameter.Add("@POItemId", model.POItemId);
            parameter.Add("@POItemNo", model.POItemNo);
            parameter.Add("@Description", model.Description);
            parameter.Add("@Quantity", model.Quantity);
            parameter.Add("@UOMID", model.UOMId);
            parameter.Add("@NumberOfVisits", model.NumberOfVisits);
            parameter.Add("@Remarks", model.Remarks);
            parameter.Add("@InspectionActivity", model.InspectionActivity);
            parameter.Add("@CreatedBy", model.LoginUserId);
            parameter.Add("@CreatedDate", DateTime.Now);
            parameter.Add("@VisitId", model.VisitId);
            parameter.Add("@VisitPId", model.VisitPId);


            
            return _con.Query<int>("AddVisitScheduleSelectedPOItems1", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public DataSet EditVisitScheduleByVisitID(int VisitId)
        {

            SqlConnection con = new SqlConnection(constring);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("EditVisitScheduleByVisitID", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@VisitId", VisitId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public int VisitScheduleUpdate(VisitScheduleDomainModel model)
        {
            Connection();


            var parameter = new DynamicParameters();
            parameter.Add("@VisitId", model.VisitId);
            parameter.Add("@ClientId", model.ClientId);
            parameter.Add("@CountryId", model.CountryId);
            parameter.Add("@StateId", model.StateId);
            parameter.Add("@StateName", model.StateName);
            parameter.Add("@VisitLocation", model.VisitLocation);
            parameter.Add("@RFIScheduleDate", model.RFIScheduleDate);
            parameter.Add("@ScheduleDate", model.ScheduleDate);
            parameter.Add("@VisitDate", model.VisitDate);
            parameter.Add("@ScheduleComments", model.ScheduleComments);
            parameter.Add("@ClientConfirmation", model.ClientConfirmation);
            parameter.Add("@ManufacturerConfirmation", model.ManufacturerConfirmation);

            parameter.Add("@UserIds", model.UserIds);
            parameter.Add("@LoggedInUser", model.LoginUserId);

            return _con.Query<int>("UpdateVisitSchedule", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public int ReCreateVisitScheduleSelectedPOItems(PONumberItemsDomainModel model, bool flag)
        {
            Connection();
            var parameter = new DynamicParameters();

            parameter.Add("@POID", model.POID);
            // parameter.Add("@PurchaseID", model.PurchaseID);
            parameter.Add("@PONID", model.PONID);
            parameter.Add("@ControlID", model.ControlID);
            parameter.Add("@ClientUnitId", model.ClientUnitId);
            parameter.Add("@SOId", model.SOId);
            parameter.Add("@ManufacturerId", model.ManufacturerId);
            parameter.Add("@POItemId", model.POItemId);
            parameter.Add("@POItemNo", model.POItemNo);
            parameter.Add("@Description", model.Description);
            parameter.Add("@Quantity", model.Quantity);
            parameter.Add("@UOMID", model.UOMId);
            parameter.Add("@NumberOfVisits", model.NumberOfVisits);
            parameter.Add("@Remarks", model.Remarks);
            parameter.Add("@InspectionActivity", model.InspectionActivity);
            parameter.Add("@CreatedBy", model.LoginUserId);
            parameter.Add("@CreatedDate", DateTime.Now);
            parameter.Add("@VisitId", model.VisitId);
            parameter.Add("@VisitPId", model.VisitPId);

            parameter.Add("@Flag", flag);

            return _con.Query<int>("ReCreateVisitScheduleSelectedPOItems", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public int SaveManufacturerVisitLocation(int visitId, int ManufacturerId, string LocationName, bool IsSubManufacturer, string SubManufacturerDetails, string ContactNo,decimal? Cost, int LoginUserId, bool flag, string type)
        {
            Connection();

            if (visitId > 0)
            {
                var parameters = new DynamicParameters();
                if (type == "VisitPId")
                {
                    parameters.Add("@VisitPId", visitId);
                    parameters.Add("@VisitId", null);
                }
                else
                {
                    parameters.Add("@VisitId", visitId);
                    parameters.Add("@VisitPId", null);
                }

                  //  parameters.Add("@VisitId", visitId);
                    parameters.Add("@ManufacturerId", ManufacturerId);
                    parameters.Add("@LocationDetails", LocationName);
                    parameters.Add("@IsSubManufacturer", IsSubManufacturer);
                    parameters.Add("@SubManufacturerDetails", SubManufacturerDetails);
                    parameters.Add("@ContactNo", ContactNo);
                    parameters.Add("@Cost", Cost);
                    parameters.Add("@LoggedInUser", LoginUserId);
                    parameters.Add("@Flag", flag);
                     _con.Query<int>("SaveManufacturerVisitLocation2", parameters, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
                
                return 1;
            }
            return 0;
        }

    }
}
