using System;
using System.Collections;
using System.Web;

namespace IQEApp.Core
{
    public class WISession
    {
        public void AddSession(string key, string value)
        {
            HttpContext.Current.Session.Add(key, value);
        }

        public void AddIntSession(string key, int value)
        {
            HttpContext.Current.Session.Add(key, value);
        }
        public void AddboolSession(string key, bool value)
        {
            HttpContext.Current.Session.Add(key, value);
        }
        public void AddArrylistSession(string key, ArrayList value)
        {
            HttpContext.Current.Session.Add(key, value);
        }

        public string GetSessionValue(string key)
        {
            try
            {

                object objValue = HttpContext.Current.Session[key];
                string strSessionValue;
                if (objValue != null)
                    strSessionValue = (string)objValue;
                else
                    strSessionValue = null;
                return strSessionValue;
            }
            catch (Exception ex)
            {
                return null;
            }

        }

        public bool GetboolSessionValue(string key)
        {
            try
            {
                object objValue = HttpContext.Current.Session[key];
                bool boolSessionValue;
                if (objValue != null)
                    boolSessionValue = (bool)objValue;
                else
                    boolSessionValue = false;
                return boolSessionValue;
            }
            catch (Exception ex)
            {
                return false;
            }
        }


        public int GetIntSessionValue(string key)
        {
            try
            {
                object objValue = HttpContext.Current.Session[key];
                int intSessionValue;
                if (objValue != null)
                    intSessionValue = (int)objValue;
                else
                    intSessionValue = 0;
                return intSessionValue;
            }
            catch (Exception ex)
            {
                return 0;
            }

        }

        public void RemoveSession(string key)
        {
            HttpContext.Current.Session.Remove(key);
        }
        public void RemoveAllSession()
        {
            HttpContext.Current.Session.RemoveAll();
        }


    }
}
