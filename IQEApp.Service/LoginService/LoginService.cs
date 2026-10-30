using Dapper;
using IQEApp.Domain.CommonDomain;
//using Dapper;
using IQEApp.Domain.LoginDomain;
using IQEApp.Domain.UserDomain;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace IQEApp.Service.LoginService
{
    public interface ILoginService
    {
        string checkUserLogin(LoginDomainModel loginDomainModel);
        IEnumerable<LoginDomainModel> ValidateLoginUserInfo(string loginName);
        void SaveProcessedEmails(EmailDomainModel emailDomainModel);
        void UpdatePassword(UserDomainModel userDomainModel);
    }
    public class LoginService : ILoginService
    {
        private SqlConnection con;
        private void connection()
        {
            string constring = ConfigurationManager.ConnectionStrings["WIConnectionString"].ToString();
            con = new SqlConnection(constring);
        }
        public string checkUserLogin(LoginDomainModel loginDomainModel)
        {
            connection();
            var para = new DynamicParameters();
            para.Add("@LoginName", loginDomainModel.LoginName.Trim());
            para.Add("@LoginPassword", loginDomainModel.LoginPassword.Trim());
            return con.Query<string>("checkUserLogin", para, null, true, 0, CommandType.StoredProcedure).SingleOrDefault();
        }
        public IEnumerable<LoginDomainModel> ValidateLoginUserInfo(string loginName)
        {
            connection();
            var para = new DynamicParameters();
            para.Add("@LoginName", loginName.Trim());
            return con.Query<LoginDomainModel>("ValidateLoginUserInfo", para, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public void SaveProcessedEmails(EmailDomainModel emailDomainModel)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@SenderEmailId", emailDomainModel.SenderEmailId);
            parameter.Add("@ReceiverUserId", emailDomainModel.ReceiverId);
            parameter.Add("@ReceiverEmailId", emailDomainModel.ReceiverEmailId);
            parameter.Add("@EmailSubject", emailDomainModel.Subject);
            parameter.Add("@EmailBody", emailDomainModel.Body);
            parameter.Add("@SectionId", emailDomainModel.SectionId);
            parameter.Add("@LoginUserId", emailDomainModel.LoginUserId);
            con.Query("SaveProcessedEmails", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }

        public void UpdatePassword(UserDomainModel userDomainModel)
        {
            connection();
            var parameter = new DynamicParameters();
            parameter.Add("@UserGuid", userDomainModel.UserGuid);
            parameter.Add("@NewPassword", userDomainModel.NewPassword);
            parameter.Add("@IsPasswordUpdate", userDomainModel.IsPasswordUpdate);
            parameter.Add("@LoginUserId", userDomainModel.LoginUserId);
            con.Query("UpdatePassword", parameter, null, true, 0, commandType: CommandType.StoredProcedure);
        }
    }
}