using System;
using System.Collections.Generic;

namespace IQEApp.Core.Cache
{
    public interface ICacheRepository<T> where T : class
    {
        T Get(string id, Func<T> getData);
        void ReloadAll(Func<ICollection<T>> getData);
        void Remove(HashSet<String> keys);
        void ClearAll();
        ICollection<T> GetAll(Func<ICollection<T>> getData);
        ICollection<T> Get(HashSet<string> cacheKeys);
        void Update(string id, T obj);
        void Add(string id, T obj);
    }

}
