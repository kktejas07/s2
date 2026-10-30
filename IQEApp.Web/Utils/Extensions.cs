using System;
using System.Configuration;

namespace WebIndiaApp.Web.Utils
{
    public static class Extensions
    {
        /// <summary>
        /// Convert the passed datetime from UTC timezone to configured timezone in web.config.
        /// </summary>
        /// <param name="utcDT"></param>
        /// <returns></returns>
        public static string TimeAway(this DateTime utcDT)
        {
            TimeSpan timeSince = DateTime.Now.Subtract(utcDT);

            if (timeSince.TotalDays < -7)
                return ToConfigLocalTime(utcDT);

            if (timeSince.TotalDays > -7 & timeSince.TotalDays < -2)
                return string.Format("in {0} days", Math.Ceiling(timeSince.Duration().TotalDays));
            if (timeSince.TotalDays < -1 & timeSince.TotalDays > -2)
                return "tomorrow";
            if (timeSince.TotalHours > -24 && timeSince.TotalHours < -1)
                return string.Format("in {0} hours", timeSince.Duration().Hours);
            if (timeSince.TotalMinutes > -60 && timeSince.TotalMinutes < -2)
                return string.Format("in {0} minutes", timeSince.Duration().Minutes);
            if (timeSince.TotalMinutes > -1 && timeSince.TotalMinutes < 0)
                return "Now";
            return ToConfigLocalTime(utcDT);
        }

        public static string TimeAwayWithNoConvert(this DateTime utcDT)
        {
            TimeSpan timeSince = DateTime.Now.Subtract(utcDT);

            if (timeSince.TotalDays < -7)
                return ToConfigLocalTimeWithoutTimezoneConvert(utcDT);

            if (timeSince.TotalDays > -7 & timeSince.TotalDays < -2)
                return string.Format("in {0} days", Math.Ceiling(timeSince.Duration().TotalDays));
            if (timeSince.TotalDays < -1 & timeSince.TotalDays > -2)
                return "tomorrow";
            if (timeSince.TotalHours > -24 && timeSince.TotalHours < -1)
                return string.Format("in {0} hours", timeSince.Duration().Hours);
            if (timeSince.TotalMinutes > -60 && timeSince.TotalMinutes < -2)
                return string.Format("in {0} minutes", timeSince.Duration().Minutes);
            if (timeSince.TotalMinutes > -1 && timeSince.TotalMinutes < 0)
                return "Now";
            return ToConfigLocalTimeWithoutTimezoneConvert(utcDT);
        }
        //public static string GetNullDateConvertedShortDate(this DateTime? utcDT)
        //{
        //    //if (utcDT != null)
        //    //{
        //    //    return utcDT.ToString("dd-MMM-yyyy");
        //    //}
        //    //else
        //    //{
        //    //    return null;
        //    //}

        //    if (utcDT != null && utcDT != Convert.ToDateTime("01/01/1900"))
        //    {
        //        return String.Format("{dd-MMM-yyyy}", utcDT);
        //    }
        //    else
        //    {
        //        return "";
        //    }
        //}


        public static string GetConvertedShortDate(this DateTime utcDT)
        {
            return utcDT.ToString("dd-MMM-yyyy");
        }
        public static string GetConvertedShortDateTime(this DateTime utcDT)
        {
            return utcDT.ToString("dd-MMM-yyyy h:mm tt");
        }
        public static string TimeAgo(this DateTime datetime)
        {

            TimeSpan timeSince = DateTime.UtcNow.Subtract(datetime);

            if (datetime.Hour == 0 && datetime.Minute == 0)
            {
                return String.Format("{0}", ToConfigLocalTime(datetime));
            }
            else
            {

                if (timeSince.TotalMilliseconds < 1)
                    //return "not yet";
                    return "just now";
                if (timeSince.TotalMinutes < 1)
                    return "just now";
                if (timeSince.TotalMinutes < 2)
                    return "1 minute ago";
                if (timeSince.TotalMinutes < 60)
                    return string.Format("{0} minutes ago", timeSince.Minutes);
                if (timeSince.TotalMinutes < 120)
                    return "1 hour ago";
                if (timeSince.TotalHours < 24)
                    return string.Format("{0} hours ago", timeSince.Hours);

                return String.Format("{0:dddd, MMMM dd, yyyy h:mm tt (CST)}", datetime.ConvertUtcToSystemTimeZone());
            }
        }

        public static DateTime ConvertUtcToSystemTimeZone(this DateTime utcDT)
        {
            var ustTZ = TimeZoneInfo.FindSystemTimeZoneById(ConfigurationManager.AppSettings["Timezone"]);
            return TimeZoneInfo.ConvertTimeFromUtc(utcDT, ustTZ);
        }

        /// <summary>
        /// Convert the passed datetime from UTC timezone to configured timezone in web.config.
        /// </summary>
        /// <param name="utcDT"></param>
        /// <returns></returns>
        public static string ToConfigLocalTime(this DateTime utcDT)
        {
            return String.Format("{0:ddd, dd-MM-yyyy}", utcDT.ConvertUtcToSystemTimeZone());
        }

        public static string ToConfigLocalTimeWithoutTimezoneConvert(this DateTime utcDT)
        {
            return String.Format("{0:dddd, d-MMM-yyyy}", utcDT);
        }
    }
}