using System;
using System.Text.RegularExpressions;

namespace IQEApp.Core.Extensions
{
    static public class PasswordExtension
    {
        public static bool IsEmail(this string inputEmail)
        {

            string strRegex = @"^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}" +
                  @"\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\" +
                  @".)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$";
            Regex re = new Regex(strRegex);

            return re.IsMatch(inputEmail);

        }

        static public string GenerateNewPassword()
        {
            try
            {
                var rng = new Random();
                const int size = 8;
                var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                var buffer = new char[size];
                for (var i = 0; i < size; i++)
                {
                    buffer[i] = chars[rng.Next(chars.Length)];
                }
                return new string(buffer);
            }
            catch (Exception ex)
            {
                //ErrorLog.ErrorLogI(ex.Message, "GeneratePassword");
                return string.Empty;
            }
        }

    }
}
