using System.Collections.Generic;
using System.Runtime.Caching;

namespace IQEApp.Core.Cache
{
    public interface ICache
    {
        T Get<T>(string cacheKey) where T : class;
        ICollection<T> Get<T>(HashSet<string> cacheKeys);
        void Add(string cacheKey, CacheItemPolicy policy, object dataToAdd);
        void InvalidateCacheItem(string cacheKey);
        bool Contains(string cacheKey);
        int Count();
        void InvalidateAllCacheItem();
    }
}
