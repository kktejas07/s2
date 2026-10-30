using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.ReportDomain;
using IQEApp.Service.ReportService;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.UserModel;
using System.Collections.Generic;
using System.Linq;

namespace IQEApp.Web.Models.Reports
{
    public class ReportsBusinessModel
    {
        public ReportFiltersViewModel GetVisitFiltersData(IReportService reportService)
        {

            var filtersDataSet = reportService.GetVisitFiltersData();
            ReportFiltersViewModel objModel = new ReportFiltersViewModel();
            objModel.LstEngineers = filtersDataSet.Tables[0].DataTableToList<UserViewModel>().ToList();
            objModel.LstClients = filtersDataSet.Tables[1].DataTableToList<ClientViewModel>().ToList();
            return objModel;
        }
        public List<RptVisitViewModel> GetVisitDetailsForReports(ReportFiltersViewModel filterModel, IReportService reportService)
        {
            Mapper.CreateMap<ReportFiltersViewModel, ReportFiltersDomainModel>();
            var filterQuery = Mapper.Map<ReportFiltersViewModel, ReportFiltersDomainModel>(filterModel);
            var visitDetails = reportService.GetVisitDetailsForReport(filterQuery);
            List<RptVisitViewModel> model = new List<RptVisitViewModel>();
            Mapper.CreateMap<RptVisitDomainModel, RptVisitViewModel>();
            model = visitDetails.Select(Mapper.Map<RptVisitDomainModel, RptVisitViewModel>).ToList();
            return model;
        }

        public List<RptVisitExpensesModel> GetVisitExpensesForReports(ReportFiltersViewModel filterModel, IReportService reportService)
        {
            Mapper.CreateMap<ReportFiltersViewModel, ReportFiltersDomainModel>();
            var filterQuery = Mapper.Map<ReportFiltersViewModel, ReportFiltersDomainModel>(filterModel);
            var visitDetails = reportService.GetVisitExpensesForReport(filterQuery);
            List<RptVisitExpensesModel> model = new List<RptVisitExpensesModel>();
            Mapper.CreateMap<RptVisitExpensesDomainModel, RptVisitExpensesModel>();
            model = visitDetails.Select(Mapper.Map<RptVisitExpensesDomainModel, RptVisitExpensesModel>).ToList();
            return model;
        }
    }
}