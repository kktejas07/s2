using Dapper;
using IQEApp.Domain.AssociateDomain;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.AssociatesService
{

    public interface IAssociatesServices
    {

        #region Associates
        IEnumerable<AssociatesDomainModel> GetAllAssociateDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder);
        DataSet GetAssociateDetailsToAdd(int loginUserSiteId);
        bool IsAssociateAlreadyExists(AssociatesDomainModel objClientDomainModel);
        int CreateAssociate(AssociatesDomainModel objClientDomainModel);
        DataSet GetAssociateDetailsToEdit(Guid clientGuid, int loginUserSiteId);
        bool UpdateAssociateDetails(AssociatesDomainModel objClientDomainModel);
        bool UpdateAssociateStatus(Guid clientGuid, bool status, int loggedInUser);
        #endregion
    }
    public class AssociatesServices : IAssociatesServices
    {
        private SqlConnection _con;
        private void Connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            _con = new SqlConnection(constring);
        }

        public IEnumerable<AssociatesDomainModel> GetAllAssociateDetails(int siteId, string strSearch, string alphaChar, int offset, int fetch, bool activeStatus, string sortingOrder)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SiteId", siteId);
            parameter.Add("@strSearch", strSearch);
            parameter.Add("@alphaChar", alphaChar);
            parameter.Add("@Offset", offset);
            parameter.Add("@Fetch", fetch);
            parameter.Add("@isActive", activeStatus);
            parameter.Add("@SortingOrder", sortingOrder);
            return _con.Query<AssociatesDomainModel>("GetAllAssociateDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public DataSet GetAssociateDetailsToAdd(int siteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetAssociateDetailsToAdd", con);
            cmd.CommandType = CommandType.StoredProcedure;
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }

        public bool IsAssociateAlreadyExists(AssociatesDomainModel objAssociateDomainModel)
        {
            Connection();
            var para = new DynamicParameters();
            para.Add("@CountryId", objAssociateDomainModel.CountryId);
            para.Add("@AssociateName", objAssociateDomainModel.AssociateName.Trim());
            para.Add("@ContactPerson", objAssociateDomainModel.ContactPerson.Trim());
            return _con.Query<bool>("IsAssociateExistsAlready", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }
        public int CreateAssociate(AssociatesDomainModel objAssociateDomainModel)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@AssociateName", objAssociateDomainModel.AssociateName.Trim());
            parameter.Add("@WebSite", objAssociateDomainModel.WebSite);
            parameter.Add("@ContactPerson", objAssociateDomainModel.ContactPerson);
            parameter.Add("@Designation", objAssociateDomainModel.Designation);
            parameter.Add("@ContactNumber1", objAssociateDomainModel.ContactNumber1);
            parameter.Add("@Email", objAssociateDomainModel.Email);
            parameter.Add("@CountryId", objAssociateDomainModel.CountryId == 0 ? null : (object)objAssociateDomainModel.CountryId);
           // if (objAssociateDomainModel.StateId == 0)
            parameter.Add("@StateId", objAssociateDomainModel.StateId == 0 ? null : (object)objAssociateDomainModel.StateId);
            parameter.Add("@StateName", objAssociateDomainModel.StateName);
            parameter.Add("@Address", objAssociateDomainModel.Address);
            parameter.Add("@Currency", objAssociateDomainModel.Currency);
            parameter.Add("@Cost", objAssociateDomainModel.Cost);
            parameter.Add("@MilageInKM", objAssociateDomainModel.MilageInKM);

            parameter.Add("@BankAcc", objAssociateDomainModel.BankAcc);
            parameter.Add("@BankName", objAssociateDomainModel.BankName);
            parameter.Add("@IFSCCode", objAssociateDomainModel.IFSCCode);
            parameter.Add("@Branch", objAssociateDomainModel.Branch);
            parameter.Add("@SwiftCode", objAssociateDomainModel.SwiftCode);
            parameter.Add("@IBANNumber", objAssociateDomainModel.IBANNumber);
            parameter.Add("@BeneficiaryName", objAssociateDomainModel.BeneficiaryName);
            parameter.Add("@PAN", objAssociateDomainModel.PAN);
            parameter.Add("@Aadhar", objAssociateDomainModel.Aadhar);  
            //parameter.Add("@ContactNumber2", objAssociateDomainModel.ContactNumber2);
            parameter.Add("@SiteId", objAssociateDomainModel.SiteId);
            parameter.Add("@CreteadBy", objAssociateDomainModel.CreteadBy);
            return _con.Query<int>("SaveAssociateDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();
        }
        public DataSet GetAssociateDetailsToEdit(Guid AssociateGuid, int loginUserSiteId)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["WIConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand();
            SqlDataAdapter da = new SqlDataAdapter();
            DataSet ds = new DataSet();
            cmd = new SqlCommand("GetAssociateDetailsToEdit", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@AssociateGuid", AssociateGuid);
            cmd.Parameters.AddWithValue("@LoginUserSiteId", loginUserSiteId);
            da = new SqlDataAdapter(cmd);
            da.Fill(ds);
            return ds;
        }
        public bool UpdateAssociateDetails(AssociatesDomainModel objAssociateDomainModel)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@AssociateId", objAssociateDomainModel.AssociateId);
            parameter.Add("@AssociateName", objAssociateDomainModel.AssociateName.Trim());
            parameter.Add("@WebSite", objAssociateDomainModel.WebSite);
            parameter.Add("@ContactPerson", objAssociateDomainModel.ContactPerson);
            parameter.Add("@Designation", objAssociateDomainModel.Designation);
            parameter.Add("@ContactNumber1", objAssociateDomainModel.ContactNumber1);
            parameter.Add("@Email", objAssociateDomainModel.Email);
            parameter.Add("@CountryId", objAssociateDomainModel.CountryId == 0 ? null : (object)objAssociateDomainModel.CountryId);
           // if (objAssociateDomainModel.StateId == 0)
            {
                parameter.Add("@StateId", objAssociateDomainModel.StateId == 0 ? null : (object)objAssociateDomainModel.StateId);
                parameter.Add("@StateName", objAssociateDomainModel.StateName);
            }
            parameter.Add("@Address", objAssociateDomainModel.Address);
            parameter.Add("@Currency", objAssociateDomainModel.Currency);
            parameter.Add("@Cost", objAssociateDomainModel.Cost);
            parameter.Add("@MilageInKM", objAssociateDomainModel.MilageInKM);
            //parameter.Add("@ContactNumber2", objAssociateDomainModel.ContactNumber2);
            parameter.Add("@BankAcc", objAssociateDomainModel.BankAcc);
            parameter.Add("@BankName", objAssociateDomainModel.BankName);
            parameter.Add("@IFSCCode", objAssociateDomainModel.IFSCCode);
            parameter.Add("@Branch", objAssociateDomainModel.Branch);
            parameter.Add("@SwiftCode", objAssociateDomainModel.SwiftCode);
            parameter.Add("@IBANNumber", objAssociateDomainModel.IBANNumber);
            parameter.Add("@BeneficiaryName", objAssociateDomainModel.BeneficiaryName);
            parameter.Add("@PAN", objAssociateDomainModel.PAN);
            parameter.Add("@Aadhar", objAssociateDomainModel.Aadhar);

            parameter.Add("@SiteId", objAssociateDomainModel.SiteId);
            parameter.Add("@ModifiedBy", objAssociateDomainModel.ModifiedBy);
            return _con.Query<bool>("UpdateAssociateDetails", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();

        }
        public bool UpdateAssociateStatus(Guid associateGuid, bool status, int loggedInUser)
        {
            Connection();
            var parameter = new DynamicParameters();
            parameter.Add("@AssociateGuid", associateGuid);
            parameter.Add("@Status", status);
            parameter.Add("@LoggedInUser", loggedInUser);
            return _con.Query<bool>("UpdateAssociateStatus", parameter, null, true, 0, commandType: CommandType.StoredProcedure).SingleOrDefault();

        }
    }
}
