using IQEApp.Core.Cache;
using IQEApp.Domain.CommonDomain;
using IQEApp.Service.CommonService;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Linq;
using System.Runtime.Caching;

namespace IQEApp.Service.Cache
{
    public class RolesCacheRepository : CacheRepository<RoleDomain>, IRolesCacheRepository
    {
        private readonly IGenericItemsService _genericItemsService;

        public RolesCacheRepository(IGenericItemsService genericItemsService, ICacheProvider cacheProvdr) :
            base(cacheProvdr, new CacheItemPolicy { SlidingExpiration = new TimeSpan(365, 0, 0, 0) }, "IRolesCacheRepository")
        {
            _genericItemsService = genericItemsService;
        }

        public RoleDomain Get(short id)
        {

            var obj = Get(id);
            return obj;
        }

        //public void Load()
        //{
        //    ReloadAll(() =>
        //    {
        //        var data = _genericItemsService.RolesGet().ToList();
        //        return data;
        //    });
        //}

        //public ICollection<RoleDomain> GetAll()
        //{
        //    return CacheProvdr.GetAll(CachePolicy, () => _genericItemsService.RolesGet().ToList(), GetObjCacheKey);
        //}

        public ICollection<RoleDomain> GetAllByIdList(string list)
        {
            if (!string.IsNullOrEmpty(list))
                return list.Split(',').Select(int.Parse).ToList().Select(roleId => Get(short.Parse(roleId.ToString(CultureInfo.InvariantCulture)))).ToList();
            else
                return new Collection<RoleDomain>();
        }

        protected override string GetCacheKey(string key)
        {
            return String.Format("{0}.{1}", CacheProvdr.Region, key);
        }

        protected override string GetObjCacheKey(RoleDomain obj)
        {
            return GetCacheKey(obj.RoleId.ToString(CultureInfo.InvariantCulture));
        }
    }
    public interface IRolesCacheRepository
    {
        RoleDomain Get(short roleId);
        //void Load();
        //ICollection<RoleDomain> GetAll();
        ICollection<RoleDomain> GetAllByIdList(string list);
    }
}
