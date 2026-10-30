using IQEApp.Web.Models.CommonModels;
using System;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Mail;

namespace IQEApp.Web.Services
{
    public class EmailProcessing
    {
        public bool EmailFormating(EmailViewModel objEmailViewModel)
        {
            var isSuccess = false;
            switch (objEmailViewModel.SectionType)
            {
                case SectionType.ForgotPassword:
                    ForgotPasswordEmail(objEmailViewModel);
                    break;
                default:
                    break;
            }
            isSuccess = ToSendEmail(objEmailViewModel);
            return isSuccess;
        }
        private bool ToSendEmail(EmailViewModel objEmailViewModel)
        {
            bool isSuccess = false;
            try
            {
                string azureSMTPLogin = ConfigurationManager.AppSettings["AzureSMTPLogin"];
                string azureSMTPPassword = ConfigurationManager.AppSettings["AzureSMTPPassword"];
                var mailMessage = new MailMessage();
                string[] receiverEmailIds = objEmailViewModel.ReceiverEmailId.Split(',');

                receiverEmailIds.ToList().ForEach(email =>
                {
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        mailMessage.To.Add(new MailAddress(email.Trim()));
                    }
                });
                mailMessage.From = new MailAddress(objEmailViewModel.SenderEmailId);
                mailMessage.Subject = objEmailViewModel.Subject;
                mailMessage.Body = objEmailViewModel.Body;
                mailMessage.IsBodyHtml = true;

                using (SmtpClient smtpServer = new SmtpClient("smtp.sendgrid.net"))
                {
                    smtpServer.Port = Convert.ToInt32(ConfigurationManager.AppSettings["AzureSMTPPort"]);
                    smtpServer.UseDefaultCredentials = false;
                    smtpServer.Credentials = new NetworkCredential(azureSMTPLogin, azureSMTPPassword);
                    smtpServer.EnableSsl = true;
                    smtpServer.Send(mailMessage);
                }
                isSuccess = true;
            }
            catch (Exception)
            {
                isSuccess = false;
            }
            return isSuccess;
        }
        //public bool SendEmail(EmailViewModel objEmailViewModel)
        //{
        //    var isSuccess = false;
        //    try
        //    {
        //        EmailModel emailM = new EmailModel();
        //        emailM.ReceiverEmailId = "gorthivamsi@gmail.com";
        //        emailM.ReceiverName = "Eswar";
        //        emailM.SenderEmailId = ConfigurationManager.AppSettings["InvitationsEmail"];
        //        emailM.SenderName = "Admin";
        //        emailM.Subject = "Test mail";
        //        emailM.Body = "This is test mail";
        //        EmailProcessing objEP = new EmailProcessing();
        //        objEP.SendEmail(emailM);
        //        isSuccess = true;
        //    }
        //    catch (Exception e)
        //    {
        //        throw e;
        //    }

        //    return Json(new { data = "", success = isSuccess }, JsonRequestBehavior.AllowGet);
        //}

        #region designing of email by mapping to html

        public void ForgotPasswordEmail(EmailViewModel objEmailViewModel)
        {
            try
            {
                objEmailViewModel.BaseUri = objEmailViewModel.BaseUri + "Login/LogOn";
                string body = string.Empty;
                using (StreamReader reader = new StreamReader(System.Web.HttpContext.Current.Server.MapPath("~/Views/Email/ForgotPwdTemplate.cshtml")))
                {
                    body = reader.ReadToEnd();
                }
                body = body.Replace("{ReceiverName}", objEmailViewModel.ReceiverName);
                body = body.Replace("{BaseUri}", objEmailViewModel.BaseUri);
                body = body.Replace("{SenderName}", objEmailViewModel.SenderName);
                body = body.Replace("{loginPage}", objEmailViewModel.BaseLeftUri + "/Login/LogOn");
                body = body.Replace("{loginurl}", objEmailViewModel.BaseUri);
                body = body.Replace("{Password}", objEmailViewModel.NewPassword);

                objEmailViewModel.Subject = "New Password";
                objEmailViewModel.Body = body;
                objEmailViewModel.Description = body;  //This description will be stored in db as mail body  for future ref
            }
            catch (Exception ex)
            {
                //errorLogObj.LogError(" Forgot Password Email", ex);
            }

        }

        #endregion
    }
}