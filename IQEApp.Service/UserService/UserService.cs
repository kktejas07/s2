using Dapper;
using IQEApp.Domain.CompetanceDomain;
using IQEApp.Domain.ControlNumberDomain;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Domain.ServiceOrderDomain;
using IQEApp.Domain.UserDomain;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using static IQEApp.Domain.CommonDomain.CommonDomainModel;

namespace IQEApp.Service.UserService
{
    public interface IUserService
    {
        IEnumerable<UserDomainModel> GetUserListDetails(int siteId, bool isActive,bool isSecondment, string UserType, string strSearch, string alphaChar, int offset, int fetch, string sortingOrder);

        IEnumerable<UserDomainModel> GetUserListDetails1(Guid Associateguid, string contactPerson, int siteId, bool isActive, string strSearch, string alphaChar, int offset, int fetch, string sortingOrder);
        //IEnumerable<UserDomainModel> GetUserSearchList(int siteId, bool isActive, string strSearch, int offset, int fetch);
        int CreateUser(UserDomainModel objUserDomainModel);
        UserDomainModel GetUserResumeByID(string userId, string fileName);
        bool UploadResumeByUserID(UserDomainModel objUserDomainModel, bool Flag);
        IEnumerable<UserDomainModel> GetUserDetailsByGUID(Guid userGuid);
        UserDomainModel GetUserDetailsByUserId(int userId);
        IEnumerable<UserDomainModel> GetUserDetailsByStateId(int stateId, string stateName);
        IEnumerable<UserDomainModel> GetInspectorsByCountry(int countryId);
        
        IEnumerable<StateDomainModel> GetStateListByCountyId(int countryId, string countryName);
        bool UpdateUser(UserDomainModel objUserDomainModel, bool emplannelmentflag);
        bool UpdateUserResumeByUserID(UserDomainModel objCNDM, bool flag);
        IEnumerable<UserDomainModel> GetUserResumeBackupFiles(int userId);
        void AddEmpannlementUser(UserDomainModel objUserDomainModel);
        void UpdateUserStatus(Guid userGuid, bool statusId, string remarks, int loginUserId);
        bool UpdateCompetanceStatus(string userId, bool statusId, string remarks, int loginUserId);
        //test method to test editor text saving
        void saveEditorText(string sampleText);
        DataSet GetEmployeeDetailsToAdd(int loginUserSiteId);
        DataSet GetAssociateDetailsToAdd(int loginUserSiteId);

        DataSet GetAssociateContactPersonDetailsToAdd(int loginUserSiteId, string associateName);
        DataSet GetEmployeeDetailsToEdit(Guid UserGUId, int loginUserSiteId);
        int CheckUserExistsOrNot(UserDomainModel objUserDomainModel);
        //int CheckLoginNameExistsOrNot(UserDomainModel objUserDomainModel);
        bool RemoveResumesByUserId(UserDomainModel objUserDM);
        DataSet GetEmpannelmentDetailsToAdd(int loginUserSiteId);
    }
    public class UserService : IUserService
    {
        private SqlConnection con;
        private void connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            con = new SqlConnection(constring);
        }

        public IEnumerable<UserDomainModel> GetUserListDetails(int siteId, bool isActive,bool isSecondment, string UserType, string strSearch, string alphaChar, int offset, int fetch, string sortingOrder)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@isActive", isActive);
            parameter.Add("@isSecondment", isSecondment);
            parameter.Add("@UserType", UserType);
            parameter.Add("@strSearch", strSearch);
            parameter.Add("@alphaChar", alphaChar);
            parameter.Add("@Offset", offset);
            parameter.Add("@Fetch", fetch);
            parameter.Add("@SortingOrder", sortingOrder);
            return con.Query<UserDomainModel>("GetUserListDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure);

        }
        public IEnumerable<UserDomainModel> GetUserResumeBackupFiles(int userId)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@UserId", userId);
            return con.Query<UserDomainModel>("GetUserResumeBackupFiles", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public bool RemoveResumesByUserId(UserDomainModel objUserDM)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@UserId", objUserDM.UserId);
            parameter.Add("@FileName", objUserDM.FileName);
            return con.Query<bool>("RemoveResumesByUserId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public UserDomainModel GetUserResumeByID(string userId, string fileName)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@UserId", userId);
            parameter.Add("@FileName", fileName.Trim());
            //parameter.Add("@SectionId", SId);
            return con.Query<UserDomainModel>("GetUserResumeByID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool UpdateUserResumeByUserID(UserDomainModel objUDM, bool flag)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@UserId", objUDM.UserId);
            // parameter.Add("@QuotationNo", objEDM.QuotationNo);
            // parameter.Add("@QuotationDate", objEDM.QuotationDate);
            parameter.Add("@FileName", objUDM.FileName);
            parameter.Add("@FilePath", objUDM.FilePath);
            parameter.Add("@Validity", objUDM.Validity);
            parameter.Add("@CreatedBy", objUDM.LoginUserId);
            parameter.Add("@Flag", flag);
            return con.Query<bool>("UpdateUserResumeByUserID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public IEnumerable<UserDomainModel> GetUserListDetails1(Guid @AssociateGuid, string contactPerson, int siteId, bool isActive, string strSearch, string alphaChar, int offset, int fetch, string sortingOrder)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@AssociateGuid", AssociateGuid);
            parameter.Add("@contactPerson", contactPerson);
            parameter.Add("@SiteId", siteId);
            parameter.Add("@isActive", isActive);
            parameter.Add("@strSearch", strSearch);
            parameter.Add("@alphaChar", alphaChar);
            parameter.Add("@Offset", offset);
            parameter.Add("@Fetch", fetch);
            parameter.Add("@SortingOrder", sortingOrder);
            return con.Query<UserDomainModel>("GetUserListDetails1", parameter, null, true, 0, commandType: CommandType.StoredProcedure);

        }
        //public IEnumerable<UserDomainModel> GetUserSearchList(int siteId, bool isActive, string strSearch, int offset, int fetch)
        //{
        //    connection();
        //    var parameter = new DynamicParameters();
        //    parameter.Add("@SiteId", siteId);
        //    parameter.Add("@isActive", isActive);
        //    parameter.Add("@strSearch", strSearch);
        //    parameter.Add("@Offset", offset);
        //    parameter.Add("@Fetch", fetch);
        //    return con.Query<UserDomainModel>("GetUserSearchList", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        //}
        public int CreateUser(UserDomainModel objUserDomainModel)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", objUserDomainModel.SiteId);
            parameter.Add("@TitleId", objUserDomainModel.TitleId);
            parameter.Add("@FirstName", objUserDomainModel.FirstName);
            parameter.Add("@LastName", objUserDomainModel.LastName);
            parameter.Add("@EmailId", objUserDomainModel.EmailId);
            parameter.Add("@loginName", objUserDomainModel.LoginName);
            parameter.Add("@Password", objUserDomainModel.LoginPassword);
            parameter.Add("@Address", objUserDomainModel.Address);
            parameter.Add("@City", objUserDomainModel.CityName);
            parameter.Add("@UserImage", objUserDomainModel.UserImageGUID == null ? "" : (object)objUserDomainModel.UserImageGUID);
            parameter.Add("@UserImagePath", objUserDomainModel.UserImagePath == null ? "" : (object)objUserDomainModel.UserImagePath);
            parameter.Add("@CountryId", objUserDomainModel.CountryId ==0 ? null : (object)objUserDomainModel.CountryId);
            parameter.Add("@StateId", objUserDomainModel.StateId == 0 ? null : (object)objUserDomainModel.StateId);
            parameter.Add("@StateName", objUserDomainModel.StateName);
//            parameter.Add(new SqlParameter("@Experience", SqlDbType.NVarChar, 100) { Value = objUserDomainModel.Experience });
            parameter.Add("@Experience", objUserDomainModel.Experience);
            parameter.Add("@Certifications", objUserDomainModel.Certifications);
            parameter.Add("@SkillSet", objUserDomainModel.SkillSets);
            parameter.Add("@OtherProfessional", objUserDomainModel.OtherProfessional);
            parameter.Add("@Qualification", objUserDomainModel.Qualification);
            parameter.Add("@ProfQualification", objUserDomainModel.ProfQualification);
            parameter.Add("@EmployeeTypeId", objUserDomainModel.UserTypeId);
            parameter.Add("@DateofBirth", objUserDomainModel.DOB == DateTime.MinValue ? DateTime.Now: objUserDomainModel.DOB);
            parameter.Add("@RoleID", objUserDomainModel.RoleId);
            parameter.Add("@DesignationId", objUserDomainModel.DesignationId);
            parameter.Add("@LoginUserId", objUserDomainModel.LoginUserId);
            parameter.Add("@UserImageGUID", objUserDomainModel.UserImageGUID);
            parameter.Add("@UserImageFileSize", objUserDomainModel.UserImageFileSize);
            parameter.Add("@ContactNumber", objUserDomainModel.EmpContactNumber);//== "" : 0 ? objUserDomainModel.EmpContactNumber);
            parameter.Add("@EmployeeCode", objUserDomainModel.EmployeeCode);
            parameter.Add("@InspectorCode", objUserDomainModel.InspectorCode);
            //parameter.Add("@AssociateId", objUserDomainModel.AssociateId);
            parameter.Add("@AssociateName", objUserDomainModel.AssociateName);
            parameter.Add("@ContactPerson", objUserDomainModel.ContactPerson);
            parameter.Add("@ESI", objUserDomainModel.ESI);
            parameter.Add("@PF", objUserDomainModel.PF);
            parameter.Add("@PA", objUserDomainModel.PA);
            parameter.Add("@Medical", objUserDomainModel.Medical);
            parameter.Add("@BankAcc", objUserDomainModel.BankAcc);
            parameter.Add("@IFSCCode", objUserDomainModel.IFSCCode);
            parameter.Add("@Branch", objUserDomainModel.Branch);
            parameter.Add("@PAN", objUserDomainModel.PAN);
            parameter.Add("@Aadhar", objUserDomainModel.Aadhar);
            return con.Query<int>("CreateUser", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault(); ;
        }

        public IEnumerable<UserDomainModel> GetUserDetailsByGUID(Guid userGuid)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@userGuid", userGuid);
            return con.Query<UserDomainModel>("GetUserDetailsByGUID", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public UserDomainModel GetUserDetailsByUserId(int userId)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@UserId", userId);
            return con.Query<UserDomainModel>("GetUserDetailsByUserId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }

        public IEnumerable<UserDomainModel> GetUserDetailsByStateId(int stateId, string stateName)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@StateId", stateId);
            parameter.Add("@StateName", stateName);
            return con.Query<UserDomainModel>("GetUserDetailsByStateId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }
        public IEnumerable<UserDomainModel> GetInspectorsByCountry(int countryId)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("CountryId", countryId);
            parameter.Add("@isActive", 1);
            parameter.Add("@SiteId", 1);
            return con.Query<UserDomainModel>("GetInspectorsByCountry", parameter, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }
        
        public IEnumerable<StateDomainModel> GetStateListByCountyId(int countyId, string countyrName)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@CountryId", countyId);
            //parameter.Add("@StateName", countyrName);
            return con.Query<StateDomainModel>("GetStateListByCountyId", parameter, null, true, 0, commandType: CommandType.StoredProcedure).ToList();
        }
        
        public bool UploadResumeByUserID(UserDomainModel objUDM, bool Flag)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@UserID", objUDM.UserId);
            // parameter.Add("@QuotationNo", objEDM.QuotationNo);
            // parameter.Add("@QuotationDate", objEDM.QuotationDate);
            parameter.Add("@FileName", objUDM.FileName);
            parameter.Add("@FilePath", objUDM.FilePath);
            parameter.Add("@CreatedBy", objUDM.CreatedBy);
            parameter.Add("@Validity", objUDM.Validity);
            parameter.Add("@Flag", Flag);
            return con.Query<bool>("UploadResumeByUserID", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public bool UpdateUser(UserDomainModel objUserDomainModel, bool emplannelmentflag)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@UserGUID", objUserDomainModel.UserGuid);
            parameter.Add("emplannelmentflag", emplannelmentflag);
            parameter.Add("@TitleId", objUserDomainModel.TitleId);
            parameter.Add("@FirstName", objUserDomainModel.FirstName);
            parameter.Add("@LastName", objUserDomainModel.LastName);
            parameter.Add("@loginName", objUserDomainModel.LoginName);
            parameter.Add("@EmailId", objUserDomainModel.EmailId);
            parameter.Add("@Address", objUserDomainModel.Address);
            parameter.Add("@City", objUserDomainModel.CityName);
            parameter.Add("@UserImage", objUserDomainModel.UserImageGUID == null ? "" : (object)objUserDomainModel.UserImageGUID);
            parameter.Add("@UserImagePath", objUserDomainModel.UserImagePath == null ? "" : (object)objUserDomainModel.UserImagePath);
            parameter.Add("@CountryId", objUserDomainModel.CountryId == 0 ? null : (object)objUserDomainModel.CountryId);
            parameter.Add("@StateId", objUserDomainModel.StateId == 0 ? null : (object)objUserDomainModel.StateId);
            parameter.Add("@StateName", objUserDomainModel.StateName);
            parameter.Add("@Experience", objUserDomainModel.Experience);
            parameter.Add("@Certifications", objUserDomainModel.Certifications);
            parameter.Add("@SkillSet", objUserDomainModel.SkillSets);
            parameter.Add("@OtherProfessional", objUserDomainModel.OtherProfessional);
            parameter.Add("@Qualification", objUserDomainModel.Qualification);
            parameter.Add("@ProfQualification", objUserDomainModel.ProfQualification);
           // parameter.Add("@EmployeeTypeId", objUserDomainModel.UserTypeId);
            parameter.Add("@IsSecondment", objUserDomainModel.IsSecondment);
            parameter.Add("@DateofBirth", objUserDomainModel.DOB == DateTime.MinValue ? DateTime.Now : objUserDomainModel.DOB);
            parameter.Add("@RoleID", objUserDomainModel.RoleId);
            parameter.Add("@DesignationId", objUserDomainModel.DesignationId);
            parameter.Add("@LoginUserId", objUserDomainModel.LoginUserId);
            parameter.Add("@UserImageGUID", objUserDomainModel.UserImageGUID);
            parameter.Add("@UserImageFileSize", objUserDomainModel.UserImageFileSize);
            parameter.Add("@ContactNumber", objUserDomainModel.EmpContactNumber);
            parameter.Add("@InspectorCode", objUserDomainModel.InspectorCode);
            //parameter.Add("@AssociateId", objUserDomainModel.AssociateId);
            parameter.Add("@AssociateName", objUserDomainModel.AssociateName);
            parameter.Add("@ContactPerson", objUserDomainModel.ContactPerson);
            parameter.Add("@ESI", objUserDomainModel.ESI);
            parameter.Add("@PF", objUserDomainModel.PF);
            parameter.Add("@PA", objUserDomainModel.PA);
            parameter.Add("@Medical", objUserDomainModel.Medical);
            parameter.Add("@BankAcc", objUserDomainModel.BankAcc);
            parameter.Add("@IFSCCode", objUserDomainModel.IFSCCode);
            parameter.Add("@Branch", objUserDomainModel.Branch);
            parameter.Add("@PAN", objUserDomainModel.PAN);
            parameter.Add("@Aadhar", objUserDomainModel.Aadhar);
            if (objUserDomainModel.IsEmpannlementflag == true)
            {

                parameter.Add("@CurrencyTypeId", objUserDomainModel.CurrencyId);
                parameter.Add("@MilageInKm", objUserDomainModel.MilageInKm);
                parameter.Add("@AllInclusive", objUserDomainModel.AllInclusive);
                parameter.Add("@CostPerHour", objUserDomainModel.CostPerHour);

            }
            return con.Query<bool>("UpdateUser", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }





        public void AddEmpannlementUser(UserDomainModel objUserDomainModel)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@UserGUID", objUserDomainModel.UserGuid);
            parameter.Add("@CurrencyTypeId", objUserDomainModel.CurrencyId);
            parameter.Add("@MilageInKm", objUserDomainModel.MilageInKm);
            parameter.Add("@AllInclusive", objUserDomainModel.AllInclusive);
            parameter.Add("@CostPerHour", objUserDomainModel.CostPerHour);

            con.Query("AddEmpannlementUpdateUser", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public void UpdateUserStatus(Guid userGuid, bool statusId, string remarks,int loginUserId)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@userGuid", userGuid);
            parameter.Add("@statusId", statusId);
            parameter.Add("@remarks", remarks);
            parameter.Add("@loginUserId", loginUserId);
            con.Query("UpdateUserStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public bool UpdateCompetanceStatus(string userId, bool statusId, string remarks, int loginUserId)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EmployeeCode", userId);
            parameter.Add("@statusId", statusId);
            parameter.Add("@remarks", remarks);
            parameter.Add("@loginUserId", loginUserId);
            return con.Query<bool>("UpdateCompetanceStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
    public void saveEditorText(string sampleText)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@EditorText", sampleText);
            con.Query("SaveEditorTextSample", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public DataSet GetEmployeeDetailsToAdd(int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetEmployeeDetailsToAdd", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@loginUserSiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public DataSet GetAssociateDetailsToAdd(int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetAssociateDetails", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@loginUserSiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public DataSet GetAssociateContactPersonDetailsToAdd(int loginUserSiteId, string associateName)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetAssociateContactPersonDetails", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@loginUserSiteId", loginUserSiteId);
            cmd.Parameters.AddWithValue("@associateName", associateName);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public DataSet GetEmployeeDetailsToEdit(Guid UserGUId, int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetEmployeeDetailsToEdit", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@UserGUID", UserGUId);
            cmd.Parameters.AddWithValue("@loginUserSiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public DataSet GetEmployeeDetailsToEditCompetance(Guid UserGUId, int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetEmployeeDetailsToEditCompetance", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@UserGUID", UserGUId);
            cmd.Parameters.AddWithValue("@loginUserSiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public int CheckUserExistsOrNot(UserDomainModel objUserDomainModel)
        {
            connection();
            var para = new DynamicParameters();
            para.Add("@UserId", objUserDomainModel.UserId);
            para.Add("@LoginName", objUserDomainModel.LoginName.Trim());
            para.Add("@EmailId", objUserDomainModel.EmailId.Trim());
            return con.Query<int>("CheckUserExistsOrNotForUpdate", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }
        //public int CheckLoginNameExistsOrNot(UserDomainModel objUserDomainModel)
        //{
        //    connection();
        //    var para = new DynamicParameters();
        //    para.Add("@LoginName", objUserDomainModel.LoginName.Trim());
        //    return con.Query<int>("CheckLoginNameExistsOrNot", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        //}

        public DataSet GetEmpannelmentDetailsToAdd(int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetEmpannelmentDetailsToAdd", con);
            cmd.CommandType = CommandType.StoredProcedure;
            //if you have parameters.
            cmd.Parameters.AddWithValue("@loginUserSiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
    }
}
