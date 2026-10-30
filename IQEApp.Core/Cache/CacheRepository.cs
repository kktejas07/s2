using System;
using System.Collections.Generic;
using System.Runtime.Caching;

namespace IQEApp.Core.Cache
{
    public abstract class CacheRepository<T> : ICacheRepository<T> where T : class
    {
        protected readonly ICacheProvider CacheProvdr;
        protected readonly CacheItemPolicy CachePolicy;

        protected CacheRepository(ICacheProvider cacheProvdr, CacheItemPolicy cachePolicy, string region)
        {
            CacheProvdr = cacheProvdr;
            CacheProvdr.Region = region;
            CachePolicy = cachePolicy;
        }

        protected abstract string GetCacheKey(string key);

        protected abstract string GetObjCacheKey(T obj);

        public void ReloadAll(Func<ICollection<T>> getData)
        {
            ClearAll();
            GetAll(getData);
        }

        public void ClearAll()
        {
            CacheProvdr.ClearAll();
        }

        public T Get(string id, Func<T> getData)
        {
            return CacheProvdr.Get(GetCacheKey(id), CachePolicy, getData);
        }

        public ICollection<T> Get(HashSet<string> ids)
        {
            var cacheKeys = new HashSet<string>();
            foreach (var id in ids)
                cacheKeys.Add(GetCacheKey(id));
            return CacheProvdr.Get<T>(cacheKeys);
        }

        public ICollection<T> GetAll(Func<ICollection<T>> getData)
        {
            return CacheProvdr.GetAll(CachePolicy, getData, GetObjCacheKey);
        }

        public void Add(string id, T obj)
        {
            var k = GetCacheKey(id);
            if (CacheProvdr.Contains(k))

                CacheProvdr.Add(k, CachePolicy, obj);

        }

        public void Update(string id, T obj)
        {
            var k = GetCacheKey(id);
            CacheProvdr.InvalidateCacheItem(k, CachePolicy);
            Get(id, () => obj);
        }

        public void Remove(HashSet<String> keys)
        {
            foreach (var id in keys)
                CacheProvdr.InvalidateCacheItem(id, CachePolicy);
        }

    }
}
