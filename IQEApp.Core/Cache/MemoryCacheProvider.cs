using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Runtime.Caching;

namespace IQEApp.Core.Cache
{
    public class MemoryCacheAdapter : ICache
    {
        private readonly MemoryCache _cache = MemoryCache.Default;



        public void Add(string cacheKey, CacheItemPolicy policy, object dataToAdd)
        {
            if (dataToAdd == null) return;
            _cache.Add(cacheKey, dataToAdd, policy);
        }

        public T Get<T>(string cacheKey) where T : class
        {
            var data = _cache.Get(cacheKey) as T;
            return data;
        }

        public ICollection<T> Get<T>(HashSet<string> cacheKeys)
        {
            if (cacheKeys == null || cacheKeys.Count == 0)
                return null;

            var data = _cache.GetValues(cacheKeys);
            if (data == null)
                return null;

            var col = new Collection<T>();
            foreach (var o in data.Values)
                col.Add((T)o);
            return col;
        }

        public bool Contains(string cacheKey)
        {
            return _cache.Contains(cacheKey);
        }

        public int Count()
        {
            return _cache.Count();
        }

        public void InvalidateCacheItem(string cacheKey)
        {
            if (_cache.Contains(cacheKey))
                _cache.Remove(cacheKey);
        }

        public void InvalidateAllCacheItem()
        {
            foreach (var element in _cache)
            {
                _cache.Remove(element.Key);
            }
        }

        public void Add(string cacheKey, TimeSpan slidingExpiryWindow, object dataToAdd)
        {
            if (dataToAdd == null) return;
            var item = new CacheItem(cacheKey, dataToAdd);
            var policy = new CacheItemPolicy { SlidingExpiration = slidingExpiryWindow };
            _cache.Add(item, policy);
        }

    }
}
