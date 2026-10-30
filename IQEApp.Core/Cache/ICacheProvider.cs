using System;
using System.Collections.Generic;
using System.Runtime.Caching;

namespace IQEApp.Core.Cache
{
    public interface ICacheProvider
    {
        T Get<T>(string cacheKey, CacheItemPolicy policy, Func<T> getData) where T : class;
        ICollection<T> Get<T>(HashSet<string> cacheKeys) where T : class;
        ICollection<T> GetAll<T>(CacheItemPolicy policy, Func<ICollection<T>> getData, Func<T, string> createCacheKey);
        void Add(string cacheKey, CacheItemPolicy policy, object dataToAdd);
        void InvalidateCacheItem(string cacheKey, CacheItemPolicy policy);
        ICache InnerCache { get; }
        string Region { get; set; }
        bool Contains(string cacheKey);
        void ClearAll();
        void ClearAllRegions();
        void ClearRegions(string region);
    }
}
