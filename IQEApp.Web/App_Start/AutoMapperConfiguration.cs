using AutoMapper;
using IQEApp.Domain.UserDomain;
using IQEApp.Web.Models.UserModel;
using System.Linq;

namespace IQEApp.Web.App_Start
{
    public static class AutoMapperConfiguration
    {
        public static void Configure()
        {
            //  ConfigureDomainMapping();
            ConfigureViewModelMapping();
        }
        //private static void ConfigureDomainMapping()
        //{
        //    Mapper.CreateMap<UserDomainModel, UserViewModel>()
        //        .ForMember(prop => prop.ConfirmPassword, opt => opt.Ignore())
        //        .ForMember(prop => prop.CampaignList, opt => opt.Ignore())
        //        ;
        //    Mapper.CreateMap<UserDomainModel, UserViewModel>();

        //}
        private static void ConfigureViewModelMapping()
        {
            Mapper.CreateMap<UserViewModel, UserDomainModel>();
            Mapper.CreateMap<UserViewModel, UserDomainModel>();
        }
    }
    public static class AutoMapperExtensions
    {
        public static IMappingExpression<TSource, TDestination>
            IgnoreAllNonExisting<TSource, TDestination>(this IMappingExpression<TSource, TDestination> expression)
        {
            var sourceType = typeof(TSource);
            var destinationType = typeof(TDestination);
            var existingMaps = Mapper.GetAllTypeMaps().First(x => x.SourceType == sourceType && x.DestinationType == destinationType);
            foreach (var property in existingMaps.GetUnmappedPropertyNames())
            {
                expression.ForMember(property, opt => opt.Ignore());
            }
            return expression;
        }
    }
}