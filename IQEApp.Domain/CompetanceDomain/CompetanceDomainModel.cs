using System.ComponentModel;

namespace IQEApp.Domain.CompetanceDomain
{
    public class CompetanceDomainModel
    {
        public int UserId { get; set; }

        public string EmployeeCode { get; set; }
        public string EmployeeCode1 { get; set; }
        public bool Materials { get; set; }
        public bool Welding { get; set; }
        public bool NDE { get; set; }
        public bool Line_Pipe_Inspection { get; set; }
        public bool Fabricated_Piping { get; set; }
        public bool Valves_Actuators { get; set; }
        public bool Fittings { get; set; }
        public bool Gaskets { get; set; }
        public bool Coatings_Painting { get; set; }

        public bool Steel_Structures_Fabrication { get; set; }
        public bool Pressure_Vessels { get; set; }
        public bool Heat_Exchangers { get; set; }
        public bool Boilers { get; set; }
        public bool Tanks { get; set; }
        public bool Skid_Packages { get; set; }
        public bool Rotating_Equipment_Pumps { get; set; }
        public bool Rotating_Equipment_Compressors { get; set; }
        public bool Rotating_Equipment_Turbines { get; set; }
        public bool Rotating_Equipment_Gears { get; set; }
        public bool HVAC { get; set; }
        public bool Lifting_Equipment { get; set; }
        public bool Generators { get; set; }
        public bool Motors { get; set; }
        public bool Switchboards_PMCCs_MCCs_Dist_Boards { get; set; }
        public bool Transformers { get; set; }
        public bool Switchgears_Switchyard_Substation { get; set; }
        public bool Cables_Conductors { get; set; }
        public bool AC_DC_Drives { get; set; }
        public bool Battery_Chargers_UPS { get; set; }

        public bool Battery_Cells_Banks { get; set; }
        public bool Capacitors { get; set; }
        public bool Ex_Equipmnent_Hazardous_Area_Equip { get; set; }
        public bool DG_Sets { get; set; }
        public bool Solar_PV_Modules { get; set; }
        public bool Control_Systems { get; set; }
        public bool EI_Verification_Work { get; set; }

        public bool Power { get; set; }
        public bool Distribution { get; set; }
        public bool Instrument_Transformers_CTs_CVTs_PTs { get; set; }

        public bool Circuit_Breakers_Isolators_Lightning_Arresters { get; set; }
        public bool Power_Control { get; set; }
        public bool Signal { get; set; }
        public bool Field_Instruments { get; set; }
        public bool DCS_PLC_SCADA { get; set; }
        public bool Onshore { get; set; }
        public bool Offshore { get; set; }
        public bool Civil_Infrastructure { get; set; }

        public bool Others { get; set; }
        public string OthersText { get; set; }
 
        public int CreatedBy { get; set; }
        public string UserFullName { get; set; }
        public string Qualification { get; set; }
        public string ProfCourses { get; set; }
        public string Experience { get; set; }
        public string CityName { get; set; }
        public string stateName { get; set; }
        public int SiteId { get; set; }

        public int Total { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }

        public int CountryId { get; set; }

    }
}
