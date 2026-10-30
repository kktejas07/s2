using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.CompetanceDomain;
using IQEApp.Service.CompetanceService;
using IQEApp.Web.Models.CommonModels;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;

namespace IQEApp.Web.Models.CompetanceModel
{
    public class CompetanceViewModel1 : BaseViewModel
    {
        [DisplayName("User Name")]
        public string EmployeeCode { get; set; }
        [DisplayName("User Name")]
        public string EmployeeCode1 { get; set; }
        public int UserId { get; set; }

        [DisplayName("Batteries(Regular/Solar)")]
        public bool Batteries { get; set; }

        public bool BatteryChargers { get; set; }
        public bool Cables { get; set; }
        public bool Castings { get; set; }

        [DisplayName("Civil Structures")]
        public bool CivilStructures { get; set; }
        public bool Compressors { get; set; }

        [DisplayName("Conductors(ACSCR)")]
        public bool Conductors { get; set; }

        [DisplayName("Digital Control Systems(DCS)")]
        public bool DigitalControlSystems { get; set; }

        [DisplayName("FRP HDPE")]
        public bool FRP_HDPE { get; set; }
        public bool Forgings { get; set; }
        public bool Generators { get; set; }

        [DisplayName("Heat Exchangers")]
        public bool HeatExchangers { get; set; }

        [DisplayName("Insulators/Switchgears")]
        public bool Insulators_Switchgears {get;set;}

        [DisplayName("Invertors(Regular/Solar)")]
        public bool Invertors { get; set; }
        public bool LinePipes { get; set; }

        [DisplayName("Machined Components")]
        public bool MachinedComponents { get; set; }
        [DisplayName("Manufacturer Assesment")]
        public bool ManufacturerAssesment { get; set; }

        [DisplayName("Motors(AC&DC)")]
        public bool Motors { get; set; }

        public bool Others { get; set; }

        [DisplayName("Enter Text")]
        public string OthersText { get; set; }

        [DisplayName("Panels(HV/MV)")]
        public bool Panels { get; set; }

        [DisplayName("Painting Coating")]
        public bool PaintingCoating { get; set; }

        [DisplayName("Pressure Vessels")]
        public bool PressureVessels { get; set; }

        public bool Pumps { get; set; }
        public bool Skids { get; set; }
        public bool SolarPanels { get; set; }

        [DisplayName("Steel Structures")]
        public bool SteelStructures { get; set; }

        public bool Tanks { get; set; }

        [DisplayName("Transformers(CT&PT)")]
        public bool Transformers { get; set; }
        public bool Tubes { get; set; }
        public bool Turbines { get; set; }

        [DisplayName("Valves Actuators")]
        public bool Valves_Actuators { get; set; }

        public int CreatedBy { get; set; }

        [DisplayName("User Name")]
        public string UserFullName { get; set; }
        public string Qualification { get; set; }

        public string ProfCourses { get; set; }

        [DisplayName("Experience In Years")]
        public string Experience { get; set; }
        public string CityName { get; set; }
        public string stateName { get; set; }

        public int Total { get; set; }

        public string FileName { get; set; }
        public string FilePath { get; set; }
    }

    public class CompetanceViewModel : BaseViewModel
    {
        [DisplayName("User Name")]
        public string EmployeeCode { get; set; }
        [DisplayName("User Name")]
        public string EmployeeCode1 { get; set; }
        public int UserId { get; set; }

        public bool Materials { get; set; }
        public bool Welding { get; set; }
        public bool NDE { get; set; }
        [DisplayName("Line Pipe Inspection")]
        public bool Line_Pipe_Inspection { get; set; }
        [DisplayName("Fabricated Piping")]
        public bool Fabricated_Piping { get; set; }
        [DisplayName("Valves/Actuators")]
        public bool Valves_Actuators { get; set; }
        public bool Fittings { get; set; }
        public bool Gaskets { get; set; }
        [DisplayName("Coatings/Painting")]
        public bool Coatings_Painting  {get;set;}

        [DisplayName("Steel Structures Fabrication")]
        public bool Steel_Structures_Fabrication { get; set; }
        [DisplayName("Pressure Vessels")]
        public bool Pressure_Vessels  {get;set;}
        [DisplayName("Heat Exchangers")]
        public bool Heat_Exchangers  {get; set;}
        public bool Boilers { get; set; }
        public bool Tanks { get; set; }
        [DisplayName("Skid Packages")]
        public bool Skid_Packages  {get; set;}
        [DisplayName("Rotating Equipment - Pumps ")]
        public bool Rotating_Equipment_Pumps  { get; set; }
        [DisplayName("Rotating Equipment - Compressors")]
        public bool Rotating_Equipment_Compressors  { get; set; }
        [DisplayName("Rotating Equipment - Turbines")]
        public bool Rotating_Equipment_Turbines  { get; set; }
        [DisplayName("Rotating Equipment - Gears")]
        public bool Rotating_Equipment_Gears  { get; set; }
        public bool HVAC { get; set; }
        [DisplayName("Lifting Equipment")]
        public bool Lifting_Equipment  {get; set;}
        public bool Generators { get; set; }
        public bool Motors { get; set; }
        [DisplayName("Switchboards PMCCs / MCCs / Dist.Boards")]
        public bool Switchboards_PMCCs_MCCs_Dist_Boards  { get; set; }
        public bool Transformers { get; set; }
        [DisplayName("Switchgears Switchyard / Substation")]
        public bool Switchgears_Switchyard_Substation  { get; set; }
        [DisplayName("Cables / Conductors")]
        public bool Cables_Conductors  { get; set; }
        [DisplayName("AC-DC Drives")]
        public bool AC_DC_Drives  {get; set;}
        [DisplayName("Battery Chargers / UPS")]
        public bool Battery_Chargers_UPS  { get; set; }
        [DisplayName("Battery Cells / Banks")]

        public bool Battery_Cells_Banks  { get; set; }
        public bool Capacitors { get; set; }
        [DisplayName("Ex-Equipmnent(Hazardous Area Equip)")]
        public bool Ex_Equipmnent_Hazardous_Area_Equip  { get; set; }
        [DisplayName("DG Sets")]
        public bool DG_Sets  {get; set;}
        [DisplayName("Solar PV Modules")]
        public bool Solar_PV_Modules { get; set; }
        [DisplayName("Control Systems ")]
        public bool Control_Systems  {get; set;}
        [DisplayName("E&I Verification Work")]
        public bool EI_Verification_Work { get; set; }

        public bool Power { get; set; }
        public bool Distribution { get; set; }
        [DisplayName("Instrument Transformers CTs/CVTs/PTs ")]
        public bool Instrument_Transformers_CTs_CVTs_PTs  {get;set;}

        [DisplayName("Circuit Breakers / Isolators / Lightning Arresters ")]
        public bool Circuit_Breakers_Isolators_Lightning_Arresters { get; set; }
        [DisplayName("Power & Control")]
        public bool Power_Control  {get;set;}
        public bool Signal { get; set; }
        [DisplayName("Field Instruments")]
        public bool Field_Instruments  {get; set;}
        [DisplayName("DCS / PLC SCADA")]
        public bool DCS_PLC_SCADA  {get; set;}
        public bool Onshore { get; set; }
        public bool Offshore { get; set; }

        public bool Others { get; set; }

        [DisplayName("Enter Text")]
        public string OthersText { get; set; }

        [DisplayName("Civil & Infrastructure")]
        public bool Civil_Infrastructure { get; set; }
        public int CreatedBy { get; set; }

        [DisplayName("User Name")]
        public string UserFullName { get; set; }
        public string Qualification { get; set; }

        public string ProfCourses { get; set; }

        [DisplayName("Experience In Years")]
        public string Experience { get; set; }
        public string CityName { get; set; }
        public string stateName { get; set; }

        //public int Total { get; set; }

        public string FileName { get; set; }
        public string FilePath { get; set; }

        public int CountryId { get; set; }
    }

    public class CompetanceBusinessModel
    {
        public List<CompetanceViewModel> LstCompetanceViewModel { get; set; }
        #region Enquiry
        public List<CompetanceViewModel> GetCompetanceListBySiteId(int loginUserSiteId, bool isActive,string strSearch, string alphaChar, int offsetIndex, int fetchCount, string sortingOrder, int? countryId, ICompetanceService competanceService)
        {
            var competanceDetails = competanceService.GetCompetanceListBySiteId(loginUserSiteId, isActive, strSearch, alphaChar,  offsetIndex, fetchCount, sortingOrder, countryId);
            Mapper.CreateMap<CompetanceDomainModel, CompetanceViewModel>();
            LstCompetanceViewModel = competanceDetails.Select(Mapper.Map<CompetanceDomainModel, CompetanceViewModel>).ToList();
            return LstCompetanceViewModel;
        }

        public List<CompetanceViewModel> GetCompetanceListDetails(int siteId, bool isActive, string UserType, string strSearch, string alphaChar, int offsetIndex, int fetchCount, string sortingOrder, int? countryId, ICompetanceService _competanceService)
        {
            var competanceDetails = _competanceService.GetCompetanceListDetails(siteId, isActive, UserType, strSearch, alphaChar, offsetIndex, fetchCount, sortingOrder, countryId);
            Mapper.CreateMap<CompetanceDomainModel, CompetanceViewModel>();
            LstCompetanceViewModel = competanceDetails.Select(Mapper.Map<CompetanceDomainModel, CompetanceViewModel>).ToList();
            return LstCompetanceViewModel;
        }

        public List<CompetanceViewModel> GetCompetanceMatrixDetailsDownload(int loginUserSiteId, bool UserActive, int? CountrtId, ICompetanceService competanceService)
        {
            var competanceDetails = competanceService.GetCompetanceMatrixDetailsDownload(loginUserSiteId, UserActive, CountrtId);
            Mapper.CreateMap<CompetanceDomainModel, CompetanceViewModel>();
            LstCompetanceViewModel = competanceDetails.Select(Mapper.Map<CompetanceDomainModel, CompetanceViewModel>).ToList();
            return LstCompetanceViewModel;
        }

        public CompetanceViewModel GetCompetanceDetailsToAdd(int loginUserSiteId, ICompetanceService competanceService)
        {
            var dsEnquiryDetails = competanceService.GetCompetanceDetailsToAdd(loginUserSiteId);
            CompetanceViewModel objCompetanceViewModel = new CompetanceViewModel();
            // objEnquiryDetailsModel.LstWorkScope = new List<CommonModel.WorkScopeModel>();
            // objCompetanceViewModel.LstWorkScope = dsEnquiryDetails.Tables[0].DataTableToList<CommonModel.WorkScopeModel>();
            return objCompetanceViewModel;
        }

        public CompetanceViewModel GetCompetanceDetailsToEdit(int loginUserSiteId, string empCode, ICompetanceService competanceService)
        {
            var dsEnquiryDetails = competanceService.GetCompetanceDetailsToEdit(loginUserSiteId, empCode);

            CompetanceViewModel objCompetanceViewModel = new CompetanceViewModel();
            var CompetanceDetails = dsEnquiryDetails.Tables[0].DataTableToList<CompetanceViewModel>().FirstOrDefault();

            objCompetanceViewModel.EmployeeCode = CompetanceDetails.EmployeeCode;
            objCompetanceViewModel.EmployeeCode1 = CompetanceDetails.EmployeeCode1;

            objCompetanceViewModel.Materials                     =CompetanceDetails.Materials;
            objCompetanceViewModel.Welding                       =CompetanceDetails.Welding;
            objCompetanceViewModel.NDE                           =CompetanceDetails.NDE;
            objCompetanceViewModel.Line_Pipe_Inspection          =CompetanceDetails.Line_Pipe_Inspection;
            objCompetanceViewModel.Fabricated_Piping             =CompetanceDetails.Fabricated_Piping;
            objCompetanceViewModel.Valves_Actuators              =CompetanceDetails.Valves_Actuators;
            objCompetanceViewModel.Fittings                      =CompetanceDetails.Fittings;
            objCompetanceViewModel.Gaskets                       =CompetanceDetails.Gaskets;
            objCompetanceViewModel.Coatings_Painting             =CompetanceDetails.Coatings_Painting;
            objCompetanceViewModel.Steel_Structures_Fabrication  =CompetanceDetails.Steel_Structures_Fabrication;
            objCompetanceViewModel.Pressure_Vessels              =CompetanceDetails.Pressure_Vessels;
            objCompetanceViewModel.Heat_Exchangers               =CompetanceDetails.Heat_Exchangers;
            objCompetanceViewModel.Boilers                       =CompetanceDetails.Boilers;
            objCompetanceViewModel.Tanks                         =CompetanceDetails.Tanks;
            objCompetanceViewModel.Skid_Packages                 =CompetanceDetails.Skid_Packages;
            objCompetanceViewModel.Rotating_Equipment_Pumps      =CompetanceDetails.Rotating_Equipment_Pumps;
            objCompetanceViewModel.Rotating_Equipment_Compressors=CompetanceDetails.Rotating_Equipment_Compressors;
            objCompetanceViewModel.Rotating_Equipment_Turbines   =CompetanceDetails.Rotating_Equipment_Turbines;
            objCompetanceViewModel.Rotating_Equipment_Gears      =CompetanceDetails.Rotating_Equipment_Gears;
            objCompetanceViewModel.HVAC                          =CompetanceDetails.HVAC;
            objCompetanceViewModel.Lifting_Equipment             =CompetanceDetails.Lifting_Equipment;
            objCompetanceViewModel.Generators                    =CompetanceDetails.Generators;
            objCompetanceViewModel.Motors                        =CompetanceDetails.Motors;
    objCompetanceViewModel.Switchboards_PMCCs_MCCs_Dist_Boards   =CompetanceDetails.Switchboards_PMCCs_MCCs_Dist_Boards;
            objCompetanceViewModel.Transformers                  =CompetanceDetails.Transformers;
     objCompetanceViewModel.Switchgears_Switchyard_Substation    =CompetanceDetails.Switchgears_Switchyard_Substation;
            objCompetanceViewModel.Cables_Conductors             =CompetanceDetails.Cables_Conductors;
            objCompetanceViewModel.AC_DC_Drives                  =CompetanceDetails.AC_DC_Drives;
            objCompetanceViewModel.Battery_Chargers_UPS          =CompetanceDetails.Battery_Chargers_UPS;
            objCompetanceViewModel.Battery_Cells_Banks           =CompetanceDetails.Battery_Cells_Banks;
            objCompetanceViewModel.Capacitors                    =CompetanceDetails.Capacitors;
     objCompetanceViewModel.Ex_Equipmnent_Hazardous_Area_Equip   =CompetanceDetails.Ex_Equipmnent_Hazardous_Area_Equip;
            objCompetanceViewModel.DG_Sets                       =CompetanceDetails.DG_Sets;
            objCompetanceViewModel.Solar_PV_Modules              =CompetanceDetails.Solar_PV_Modules;
            objCompetanceViewModel.Control_Systems               =CompetanceDetails.Control_Systems;
            objCompetanceViewModel.EI_Verification_Work          =CompetanceDetails.EI_Verification_Work;
            objCompetanceViewModel.Power                         =CompetanceDetails.Power;
            objCompetanceViewModel.Distribution                  =CompetanceDetails.Distribution;
     objCompetanceViewModel.Instrument_Transformers_CTs_CVTs_PTs =CompetanceDetails.Instrument_Transformers_CTs_CVTs_PTs;
objCompetanceViewModel.Circuit_Breakers_Isolators_Lightning_Arresters=CompetanceDetails.Circuit_Breakers_Isolators_Lightning_Arresters;
            objCompetanceViewModel.Power_Control                 =CompetanceDetails.Power_Control;
            objCompetanceViewModel.Signal                        =CompetanceDetails.Signal;
            objCompetanceViewModel.Field_Instruments             =CompetanceDetails.Field_Instruments;
            objCompetanceViewModel.DCS_PLC_SCADA                 =CompetanceDetails.DCS_PLC_SCADA;
            objCompetanceViewModel.Onshore                       = CompetanceDetails.Onshore;
            objCompetanceViewModel.Offshore = CompetanceDetails.Offshore;
            objCompetanceViewModel.Civil_Infrastructure = CompetanceDetails.Civil_Infrastructure;
            objCompetanceViewModel.Others = CompetanceDetails.Others;
            objCompetanceViewModel.OthersText    = CompetanceDetails.OthersText;
            objCompetanceViewModel.CountryId = CompetanceDetails.CountryId;

            return objCompetanceViewModel;
        }
        public int SaveCompetanceDetails(CompetanceViewModel obj, ICompetanceService competanceService)
        {
            Mapper.CreateMap<CompetanceViewModel, CompetanceDomainModel>();
            CompetanceDomainModel objCompetanceDomainModel = Mapper.Map<CompetanceViewModel, CompetanceDomainModel>(obj);
            var ClientId = competanceService.SaveCompetanceDetails(objCompetanceDomainModel);
            return ClientId;

        }

        public int UpdateCompetanceDetails(CompetanceViewModel obj, ICompetanceService competanceService)
        {
            Mapper.CreateMap<CompetanceViewModel, CompetanceDomainModel>();
            CompetanceDomainModel objEnquiryDomainModel = Mapper.Map<CompetanceViewModel, CompetanceDomainModel>(obj);
            //ConvertExtensions objConvExt = new ConvertExtensions();
            //objEnquiryDomainModel.WorkScopeName = objConvExt.ConvertListToString(objEnquiryDomainModel.LstWorkScopeIds);
            var isSuccess = competanceService.UpdateCompetanceDetails(objEnquiryDomainModel);
            return isSuccess;
        }

        

        #endregion Competance
    }
}