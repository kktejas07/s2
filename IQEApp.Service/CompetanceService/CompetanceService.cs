using Dapper;
using IQEApp.Domain.CompetanceDomain;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using static Dapper.SqlMapper;

namespace IQEApp.Service.CompetanceService
{
    public interface ICompetanceService
    {
        IEnumerable<CompetanceDomainModel> GetCompetanceListBySiteId(int siteId, bool isActive, string strSearch, string alphaChar, int offsetIndex, int fetchCount, string sortingOrder, int? countryId);

        IEnumerable<CompetanceDomainModel> GetCompetanceListDetails(int siteId, bool isActive, string UserType, string strSearch, string alphaChar, int offset, int fetch, string sortingOrder, int? countryId);
        IEnumerable<CompetanceDomainModel> GetCompetanceMatrixDetailsDownload(int siteId, bool UserActive, int? CounrtId);
        
        bool IsCompetanceExistsAlready(CompetanceDomainModel objMDM);
        DataSet GetCompetanceDetailsToAdd(int loginUserSiteId);

        DataSet GetCompetanceDetailsToEdit(int loginUserSiteId, string empCode);
        int SaveCompetanceDetails(CompetanceDomainModel objMDM);

        int UpdateCompetanceDetails(CompetanceDomainModel objMDM);

        //DataSet GetCompetanceDetailsToEdit(string enquiryId, int loggedInUser);
    }

    public class CompetanceService : ICompetanceService
    {
        private SqlConnection _con;
        private void Connection()
        {
            string conString = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(conString);
        }

        public IEnumerable<CompetanceDomainModel> GetCompetanceListBySiteId(int siteId,bool isActive, string strSearch, string alphaChar, int offsetIndex, int fetchCount, string sortingOrder, int? countryId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@isActive", isActive);
            parameter.Add("@strSearch", strSearch);
            parameter.Add("@alphaChar", alphaChar);
            parameter.Add("@Offset", offsetIndex);
            parameter.Add("@Fetch", fetchCount);
            parameter.Add("@SortingOrder", sortingOrder);
            parameter.Add("@CountryId", countryId); 
            return _con.Query<CompetanceDomainModel>("GetCompetanceListBySiteId", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<CompetanceDomainModel> GetCompetanceListDetails(int siteId, bool isActive, string UserType, string strSearch, string alphaChar, int offset, int fetch, string sortingOrder, int? countryId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@isActive", isActive);
            parameter.Add("@UserType", UserType);
            parameter.Add("@strSearch", strSearch);
            parameter.Add("@alphaChar", alphaChar);
            parameter.Add("@Offset", offset);
            parameter.Add("@Fetch", fetch);
            parameter.Add("@SortingOrder", sortingOrder);
            parameter.Add("@CountryId", countryId);
            return _con.Query<CompetanceDomainModel>("GetCompetanceListDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure);

        }
        public IEnumerable<CompetanceDomainModel> GetCompetanceMatrixDetailsDownload(int siteId,bool UserActive, int? UserId)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@UserActive", UserActive);
            parameter.Add("@CountryId", UserId);
            return _con.Query<CompetanceDomainModel>("GetCompetanceMatrixDetailsDownload", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public DataSet GetCompetanceDetailsToAdd(int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetCompetanceDetailsBySiteId", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public DataSet GetCompetanceDetailsToEdit(int loginUserSiteId, string empCode)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetCompetanceDetailsToEdit", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@SiteId", loginUserSiteId);
            cmd.Parameters.AddWithValue("@EmployeeCode", empCode);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public int SaveCompetanceDetails(CompetanceDomainModel objCDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EmployeeCode"                ,         objCDM.EmployeeCode);
            parameter.Add("@Materials"                   ,         objCDM.Materials);
            parameter.Add("@Welding"                     ,         objCDM.Welding);
            parameter.Add("@NDE"                         ,         objCDM.NDE);
            parameter.Add("@Line_Pipe_Inspection"        ,         objCDM.Line_Pipe_Inspection);
            parameter.Add("@Fabricated_Piping"           ,         objCDM.Fabricated_Piping);
            parameter.Add("@Valves_Actuators"            ,         objCDM.Valves_Actuators);
            parameter.Add("@Fittings"                    ,         objCDM.Fittings);
            parameter.Add("@Gaskets"                     ,         objCDM.Gaskets);
            parameter.Add("@Coatings_Painting"           ,         objCDM.Coatings_Painting);
            parameter.Add("@Steel_Structures_Fabrication",         objCDM.Steel_Structures_Fabrication);
            parameter.Add("@Pressure_Vessels"            ,         objCDM.Pressure_Vessels);
            parameter.Add("@Heat_Exchangers"             ,         objCDM.Heat_Exchangers);
            parameter.Add("@Boilers"                     ,         objCDM.Boilers);
            parameter.Add("@Tanks  "                     ,         objCDM.Tanks);
            parameter.Add("@Skid_Packages"               ,         objCDM.Skid_Packages);
            parameter.Add("@Rotating_Equipment_Pumps"    ,         objCDM.Rotating_Equipment_Pumps);
          parameter.Add("@Rotating_Equipment_Compressors",         objCDM.Rotating_Equipment_Compressors);
            parameter.Add("@Rotating_Equipment_Turbines" ,         objCDM.Rotating_Equipment_Turbines);
            parameter.Add("@Rotating_Equipment_Gears "   ,         objCDM.Rotating_Equipment_Gears);
            parameter.Add("@HVAC"                        ,         objCDM.HVAC);
            parameter.Add("@Lifting_Equipment"           ,         objCDM.Lifting_Equipment);
            parameter.Add("@Generators"                  ,         objCDM.Generators);
            parameter.Add("@Motors"                      ,         objCDM.Motors);
     parameter.Add("@Switchboards_PMCCs_MCCs_Dist_Boards",         objCDM.Switchboards_PMCCs_MCCs_Dist_Boards);
            parameter.Add("@Transformers"                ,         objCDM.Transformers   );
     parameter.Add("@Switchgears_Switchyard_Substation"  ,         objCDM.Switchgears_Switchyard_Substation              );
            parameter.Add("@Cables_Conductors"           ,         objCDM.Cables_Conductors);
            parameter.Add("@AC_DC_Drives"                ,         objCDM.AC_DC_Drives);
            parameter.Add("@Battery_Chargers_UPS"        ,         objCDM.Battery_Chargers_UPS);
            parameter.Add("@Battery_Cells_Banks"         ,         objCDM.Battery_Cells_Banks );
            parameter.Add("@Capacitors"                  ,         objCDM.Capacitors     );
    parameter.Add("@Ex_Equipmnent_Hazardous_Area_Equip"  ,         objCDM.Ex_Equipmnent_Hazardous_Area_Equip             );
            parameter.Add("@DG_Sets"                     ,         objCDM.DG_Sets);
            parameter.Add("@Solar_PV_Modules"            ,         objCDM.Solar_PV_Modules);
            parameter.Add("@Control_Systems"             ,         objCDM.Control_Systems);
            parameter.Add("@EI_Verification_Work"        ,         objCDM.EI_Verification_Work);
            parameter.Add("@Power"                       ,         objCDM.Power);
            parameter.Add("@Distribution"                ,         objCDM.Distribution);
  parameter.Add("@Instrument_Transformers_CTs_CVTs_PTs"  ,         objCDM.Instrument_Transformers_CTs_CVTs_PTs);
parameter.Add("@Circuit_Breakers_Isolators_Lightning_Arresters",   objCDM.Circuit_Breakers_Isolators_Lightning_Arresters );
            parameter.Add("@Power_Control"               ,         objCDM.Power_Control);
            parameter.Add("@Signal"                      ,         objCDM.Signal);
            parameter.Add("@Field_Instruments"           ,         objCDM.Field_Instruments   );
            parameter.Add("@DCS_PLC_SCADA"               ,        objCDM.DCS_PLC_SCADA  );
            parameter.Add("@Onshore"                     ,        objCDM.Onshore);
            parameter.Add("@Offshore"                    ,        objCDM.Offshore);
            parameter.Add("@Civil_Infrastructure"        ,        objCDM.Civil_Infrastructure);
        //    parameter.Add("@EmployeeCode1",         objCDM.EmployeeCode1);
            parameter.Add("@Others",                objCDM.Others);
            parameter.Add("@OthersText",            objCDM.OthersText);
            parameter.Add("@SiteId",                objCDM.SiteId);
            parameter.Add("CreatedBy",              objCDM.CreatedBy);
            return _con.Query<int>("AddCompetanceDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public bool IsCompetanceExistsAlready(CompetanceDomainModel objMVM)
        {
            Connection();
            var para = new DynamicParameters();
            // para.Add("@EnquiryNo", objMVM.EnquiryID);
            //para.Add("@ManufacturerName", objMDM.ManufacturerName.Trim());
            return _con.Query<bool>("IsManufacturerExistsAlready", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }

        //public DataSet GetCompetanceDetailsToEdit(string enquiryID, int loggedInUser)
        //{
        //    SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
        //    SqlCommand cmd = new SqlCommand();
        //    SqlDataAdapter da = new SqlDataAdapter();
        //    DataSet ds = new DataSet();
        //    cmd = new SqlCommand("GetEnquiryDetailsToEdit", con);
        //    cmd.CommandType = CommandType.StoredProcedure;
        //    //if you have parameters.
        //    cmd.Parameters.AddWithValue("@enquiryID", enquiryID);
        //    cmd.Parameters.AddWithValue("@LoginUserSiteId", loggedInUser);
        //    da = new SqlDataAdapter(cmd);
        //    da.Fill(ds);
        //    return ds;
        //}

        public int UpdateCompetanceDetails(CompetanceDomainModel objCDM)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EmployeeCode", objCDM.EmployeeCode);
            parameter.Add("@Materials", objCDM.Materials);
            parameter.Add("@Welding", objCDM.Welding);
            parameter.Add("@NDE", objCDM.NDE);
            parameter.Add("@Line_Pipe_Inspection", objCDM.Line_Pipe_Inspection);
            parameter.Add("@Fabricated_Piping", objCDM.Fabricated_Piping);
            parameter.Add("@Valves_Actuators", objCDM.Valves_Actuators);
            parameter.Add("@Fittings", objCDM.Fittings);
            parameter.Add("@Gaskets", objCDM.Gaskets);
            parameter.Add("@Coatings_Painting", objCDM.Coatings_Painting);
            parameter.Add("@Steel_Structures_Fabrication", objCDM.Steel_Structures_Fabrication);
            parameter.Add("@Pressure_Vessels", objCDM.Pressure_Vessels);
            parameter.Add("@Heat_Exchangers", objCDM.Heat_Exchangers);
            parameter.Add("@Boilers", objCDM.Boilers);
            parameter.Add("@Tanks  ", objCDM.Tanks);
            parameter.Add("@Skid_Packages", objCDM.Skid_Packages);
            parameter.Add("@Rotating_Equipment_Pumps", objCDM.Rotating_Equipment_Pumps);
            parameter.Add("@Rotating_Equipment_Compressors", objCDM.Rotating_Equipment_Compressors);
            parameter.Add("@Rotating_Equipment_Turbines", objCDM.Rotating_Equipment_Turbines);
            parameter.Add("@Rotating_Equipment_Gears ", objCDM.Rotating_Equipment_Gears);
            parameter.Add("@HVAC", objCDM.HVAC);
            parameter.Add("@Lifting_Equipment", objCDM.Lifting_Equipment);
            parameter.Add("@Generators", objCDM.Generators);
            parameter.Add("@Motors", objCDM.Motors);
            parameter.Add("@Switchboards_PMCCs_MCCs_Dist_Boards", objCDM.Switchboards_PMCCs_MCCs_Dist_Boards);
            parameter.Add("@Transformers", objCDM.Transformers);
            parameter.Add("@Switchgears_Switchyard_Substation", objCDM.Switchgears_Switchyard_Substation);
            parameter.Add("@Cables_Conductors", objCDM.Cables_Conductors);
            parameter.Add("@AC_DC_Drives", objCDM.AC_DC_Drives);
            parameter.Add("@Battery_Chargers_UPS", objCDM.Battery_Chargers_UPS);
            parameter.Add("@Battery_Cells_Banks", objCDM.Battery_Cells_Banks);
            parameter.Add("@Capacitors", objCDM.Capacitors);
            parameter.Add("@Ex_Equipmnent_Hazardous_Area_Equip", objCDM.Ex_Equipmnent_Hazardous_Area_Equip);
            parameter.Add("@DG_Sets", objCDM.DG_Sets);
            parameter.Add("@Solar_PV_Modules", objCDM.Solar_PV_Modules);
            parameter.Add("@Control_Systems", objCDM.Control_Systems);
            parameter.Add("@EI_Verification_Work", objCDM.EI_Verification_Work);
            parameter.Add("@Power", objCDM.Power);
            parameter.Add("@Distribution", objCDM.Distribution);
            parameter.Add("@Instrument_Transformers_CTs_CVTs_PTs", objCDM.Instrument_Transformers_CTs_CVTs_PTs);
            parameter.Add("@Circuit_Breakers_Isolators_Lightning_Arresters", objCDM.Circuit_Breakers_Isolators_Lightning_Arresters);
            parameter.Add("@Power_Control", objCDM.Power_Control);
            parameter.Add("@Signal", objCDM.Signal);
            parameter.Add("@Field_Instruments", objCDM.Field_Instruments);
            parameter.Add("@DCS_PLC_SCADA", objCDM.DCS_PLC_SCADA);
            parameter.Add("@Onshore", objCDM.Onshore);
            parameter.Add("@Offshore", objCDM.Offshore);
            parameter.Add("@Civil_Infrastructure", objCDM.Civil_Infrastructure);
            //    parameter.Add("@EmployeeCode1",         objCDM.EmployeeCode1);
            parameter.Add("@Others", objCDM.Others);
            parameter.Add("@OthersText", objCDM.OthersText);
            parameter.Add("@SiteId", objCDM.SiteId);
            parameter.Add("@ModifiedBy", objCDM.CreatedBy);
            return _con.Query<int>("UpdateCompetanceDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
    }
}