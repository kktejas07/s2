using System;
using System.Collections.Generic;
using System.Data;
using System.Reflection;

namespace IQEApp.Core.Extensions
{
    static public class DataTableToListExtension
    {
        public static List<T> DataTableToList<T>(this DataTable dt) where T : class, new()
        {
            try
            {
                List<T> lstItems = new List<T>();
                if (dt != null && dt.Rows.Count > 0)
                {
                    foreach (DataRow row in dt.Rows)
                        lstItems.Add(ConvertDataRowToGenericType<T>(row));
                }
                //else
                //{
                //    lstItems = null;
                //}
                return lstItems;
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return null;
            }
        }

        private static T ConvertDataRowToGenericType<T>(DataRow row) where T : class, new()
        {
            try
            {
                Type entityType = typeof(T);
                T objEntity = new T();
                foreach (DataColumn column in row.Table.Columns)
                {
                    object value = row[column.ColumnName];
                    if (value == DBNull.Value) value = null;
                    PropertyInfo property = entityType.GetProperty(column.ColumnName, BindingFlags.Instance | BindingFlags.IgnoreCase | BindingFlags.Public);
                    try
                    {
                        if (property != null && property.CanWrite)
                        {
                            if (property.PropertyType == typeof(DateTime?) && value is string stringValue)
                            {
                                if (DateTime.TryParse(stringValue, out DateTime parsedDate))
                                {
                                    value = (DateTime?)parsedDate;
                                }
                                else
                                {
                                    value = null; // Handle invalid date formats gracefully
                                }
                            }
                            property.SetValue(objEntity, value, null);
                        }


                    }
                    catch (Exception ex)
                    {
                        throw ex;
                    }
                }
                return objEntity;
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw;
            }

        }

    }
}
