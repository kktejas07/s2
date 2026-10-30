using System;
using System.Collections.Generic;
using System.Runtime.Caching;

namespace IQEApp.Core.Cache
{
    public class CacheProvider : ICacheProvider
    {
        private readonly ICache _cache;

        public CacheProvider(ICache cache)
        {
            _cache = cache;
        }
        #region ICacheProvider Members

        public string Region { get; set; }

        public ICache InnerCache { get { return _cache; } }


        public void Add(string cacheKey, CacheItemPolicy policy, object dataToAdd)
        {
            _cache.Add(cacheKey, policy, dataToAdd);
            AddKeyToMasterList(cacheKey, policy);
        }

        public T Get<T>(string cacheKey, CacheItemPolicy policy, Func<T> getData) where T : class
        {
            //Get data from cache
            var data = _cache.Get<T>(cacheKey);
            //only add non null data to the cache.
            if (data == null)
            {
                data = getData();
                if (data != null)
                {
                    _cache.Add(cacheKey, policy, data);
                    AddKeyToMasterList(cacheKey, policy);
                }
            }
            return data;
        }

        /// <summary>
        /// Gets items in cached. Will not autoretrieve if not found in cache
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="cacheKeys"></param>
        /// <returns></returns>
        public ICollection<T> Get<T>(HashSet<string> cacheKeys) where T : class
        {
            return _cache.Get<T>(cacheKeys);
        }

        public ICollection<T> GetAll<T>(CacheItemPolicy policy, Func<ICollection<T>> getData, Func<T, string> createCacheKey)
        {
            var data = _cache.Get<T>(GetMasterList());
            if (data == null)
            {
                data = getData();
                if (data != null)
                {
                    foreach (var d in data)
                    {
                        var k = createCacheKey(d);
                        if (String.IsNullOrEmpty(k)) continue;
                        _cache.Add(k, policy, d);
                        AddKeyToMasterList(k, policy);
                    }
                }
            }

            return data;
        }

        public void ClearAll()
        {
            var ml = GetMasterList();
            if (ml != null)
            {
                foreach (var v in ml)
                    _cache.InvalidateCacheItem(v);
            }
            _cache.InvalidateCacheItem(Region);
        }
        public void ClearAllRegions()
        {
            _cache.InvalidateAllCacheItem();
        }

        public void ClearRegions(string region)
        {
            var mlist = _cache.Get<HashSet<string>>(region);

            if (mlist != null)
            {
                foreach (var v in mlist)
                    _cache.InvalidateCacheItem(v);
            }
            _cache.InvalidateCacheItem(region);
        }
        private HashSet<string> GetMasterList()
        {
            var mlist = _cache.Get<HashSet<string>>(Region);
            return mlist;
        }

        private void AddKeyToMasterList(string key, CacheItemPolicy policy)
        {
            var mlist = _cache.Get<HashSet<string>>(Region) ?? new HashSet<string>();
            if (!mlist.Contains(key))
                mlist.Add(key);
            _cache.Add(Region, policy, mlist);
        }

        private void RemoveKeyFromMasterList(string key, CacheItemPolicy policy)
        {
            var mlist = _cache.Get<HashSet<string>>(Region);
            if (mlist == null) return;
            mlist.Remove(key);
            _cache.Add(Region, policy, mlist);
        }


        public bool Contains(string cacheKey)
        {
            return _cache.Contains(cacheKey);
        }

        public void InvalidateCacheItem(string cacheKey, CacheItemPolicy policy)
        {
            _cache.InvalidateCacheItem(cacheKey);
            RemoveKeyFromMasterList(cacheKey, policy);
        }

        #endregion




    }
}
