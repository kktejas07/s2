using AutoMapper;
using DocumentFormat.OpenXml.EMMA;
using IQEApp.Core.Extensions;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Domain.PurchaseOrderDomain;
using IQEApp.Domain.VisitProcessing;
using IQEApp.Service.EnquiryService;
using IQEApp.Service.PurchaseOrder;
using IQEApp.Service.VisitProcessing;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.EnquiryModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.ServiceOrderModel;
using IQEApp.Web.Models.UserModel;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Linq;
using IQEApp.Web.Utils;

namespace IQEApp.Web.Models.VisitProcessing
{
    public class ScheduleVisitModel : BaseViewModel
    {
        public int VisitTypeId { get; set; }
        public int VisitId { get; set; }
        public string VisitSeqId { get; set; }
        [Required]
        [DisplayName("Control Number")]
        public int ControlId { get; set; }
        public string ControlNo { get; set; }

        public int SOId { get; set; }
        [Required]
        [DisplayName("Planned Date")]
        public DateTime? ScheduleDate { get; set; }
        
        //[DataType(DataType.DateTime)]
        [DisplayFormat(DataFormatString = "{0:dd-MM-yyyy}")]
        public DateTime? ScheduleDate1 { get; set; }
        [DisplayName("RFI Date")]
        public DateTime? RFIScheduleDate { get; set; }

        [DisplayName("Visit Date")]
        public DateTime? VisitDate { get; set; }

        [DisplayName("Customer Confirmation")]
        public bool ClientConfirmation { get; set; }
        [DisplayName("Manufacturer Confirmation")]
        public bool ManufacturerConfirmation { get; set; }
        [DisplayName("Schedule Comments")]
        public string ScheduleComments { get; set; }
        public string UserIds { get; set; }
        public int VisitStatusId { get; set; }
        public string VisitStatusName { get; set; }
        public Guid VisitGuid { get; set; }
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public int ClientUnitId { get; set; }
        public string ClientUnitName { get; set; }
        public string QualityHeadComments { get; set; }
        public string QualityDoneByName { get; set; }
        public DateTime QualityDoneOn { get; set; }
        public string FinanceApproverComments { get; set; }
        public string FinanceApprovedByName { get; set; }
        public DateTime FinanceApprovedOn { get; set; }
        public int POID { get; set; }
        public int PONID { get; set; }
        public string PONumber { get; set; }
        public string PODate { get; set; }
        public int ManufacturerUnitId { get; set; }
        public string ManufacturerUnitName { get; set; }
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }
        public string Equipment { get; set; }
        public int Quantity { get; set; }
        public string UOM { get; set; }
        public string QuantityWithUOM { get; set; }
        public int CountryId { get; set; }
        public int StateId { get; set; }
        public string StateName { get; set; }
        public string InspectionActivity { get; set; }
        public string InspectionActivity1 { get; set; }
        public string InspectorName { get; set; }
        public string VisitLocation { get; set; }
        public string InspReportNo { get; set; }
        public string Employment { get; set; }
        public string InvoiceNo { get; set; }

        //public string QCInspectorName { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }

        public DateTime InvoiceDate { get; set; }

        public int SaleValue { get; set; }

        public decimal CostValue { get; set; }

        public decimal GP { get; set; }

        public int StateCode { get; set; }  // Example: Use StateCode instead of ID
        public string StateFullName { get; set; }

       // public List<int> ListPONIds { get; set; }
        public string PONIds { get; set; }
        public string PurchaseID { get; set; }

        public List<int> SelectedPONIdList { get; set; }
        public string DisplayText => $"{PONumber} - {PurchaseID}";
    }

    public class ScheduleVisitStatusModel
    {
        public int ID { get; set; }
        public string Name { get; set; }

        public int ActiveCount { get; set; }
        public int ClosedCount { get; set; }
        public int CancelledCount { get; set; }
        public int OnHoldCount { get; set; }
        public int ProspectiveCount { get; set; }
        public int TotalCount { get; set; }

        public decimal ActivePercentage { get; set; }
        public decimal ClosedPercentage { get; set; }
        public decimal CancelledPercentage { get; set; }
        public decimal OnHoldPercentage { get; set; }
        public decimal ProspectivePercentage { get; set; }

    }

public class TotalsViewModel
{
    public decimal TotalSaleValue { get; set; }
    public decimal TotalCostValue { get; set; }
    public decimal TotalGPValue { get; set; }
}

public class GridFilter
    {
        public string Column { get; set; }
        public string FilterType { get; set; } // e.g., "Contains", "Equals"
        public string Value { get; set; }
    }

    public class GridFilterRequest
    {
        public List<GridFilter> Filters { get; set; }
        public string Status { get; set; }
        public int PageCount { get; set; }
        public int FetchCount { get; set; }
        public string FiYear { get; set; }
        public string Month { get; set; }
        public string SortingOrder { get; set; }
    }

    public class ScheduleVisitListViewModel
    {
        public IEnumerable<ScheduleVisitModel> ScheduleVisit { get; set; }
        public ScheduleVisitStatusModel StatusCounts { get; set; }
        public TotalsViewModel Totals { get; set; }
    }
    public class InspRepoNoViewModel  
    {
        public string PONumber { get; set; }
        public string VisitSeqId { get; set; }
        public DateTime VisitDate { get; set; }
        public string ManufacturerName { get; set; }
        public string LocationDetails { get; set; }
        public string InspReportNo { get; set; }
    }

    public class ScheduleVisitDetailsModel : ScheduleVisitModel
    {
        public ControlNumberDetailsModel ControlNumberDetailsModel { get; set; }

        public ControlNumberViewModel ControlNumberDetails { get; set; }
        public List<UserViewModel> LstUsers { get; set; }
        public List<UserViewModel> LstUsersGrid { get; set; }
        public List<VisitProcessingModel> LstVisitProcessing { get; set; }
        public ClientUnitsViewModel ClientUnitDetails { get; set; }
        public ManufacturerUnitsViewModel ManufacturerUnitDetails { get; set; }
        public List<ManufacturerUnitsViewModel> LstManufacturerUnitDetails { get; set; }
        public PurchaseOrderViewModel PurchaseOrderDetails { get; set; }
        public ServiceOrderViewModel ServiceOrderDetails { get; set; }
        public List<PurchaseOrderNumbersViewModel> LstPurchaseOrderNumbers { get; set; }
        public List<PurchaseOrderItemsViewModel> LstPurchaseOrderItems { get; set; }
        public List<PurchaseOrderItemsViewModel> LstSelectedPurchaseOrderItems { get; set; }
        public List<CommonModel.CountryModel> LstCountries { get; set; }
        public List<CommonModel.StateModel> LstStates { get; set; }

        public List<string> LstPOItemNos { get; set; }
        


    }

    public class ScheduleVisitBusinessModel
    {
        ConvertExtensions objConvExt = new ConvertExtensions();
        public List<ScheduleVisitModel> LstVisitsList { get; set; }
        public int ScheduleNewVisit(ScheduleVisitModel model, IVisitProcessingService visitProcessingService)
        {
            Mapper.CreateMap<ScheduleVisitModel, ScheduleVisitDomainModel>();
            if (model.UserIds == null)
                model.UserIds = "-1";
            var newVisitDetails = Mapper.Map<ScheduleVisitModel, ScheduleVisitDomainModel>(model);
            var VisitId = 0;

            if (((IQEApp.Web.Models.VisitProcessing.ScheduleVisitDetailsModel)model).LstPurchaseOrderItems != null)
            {
                if (((IQEApp.Web.Models.VisitProcessing.ScheduleVisitDetailsModel)model).LstPurchaseOrderItems.Count > 0)
                {

                    VisitId = visitProcessingService.ScheduleNewVisit(newVisitDetails);

                    if (VisitId > 0) 
                    { 
                    foreach (var obj in ((IQEApp.Web.Models.VisitProcessing.ScheduleVisitDetailsModel)model).LstPurchaseOrderItems)
                    {
                        Mapper.CreateMap<PurchaseOrderItemsViewModel, PurchaseOrderItemsDomainModel>();
                        var data1 = Mapper.Map<PurchaseOrderItemsViewModel, PurchaseOrderItemsDomainModel>(obj);
                        if (model.VisitDate.HasValue && model.VisitDate > DateTime.Today.AddDays(1))
                        {
                            data1.VisitPId = VisitId;
                            data1.VisitId = null;
                        }
                        else
                        {
                            data1.VisitId = VisitId;
                            data1.VisitPId = null;
                        }

                        var PONUmbers = visitProcessingService.AddScheduleVisitSelectedPOItems(data1);
                    }
                 }
                }
            }
            return VisitId;
        }
        public int UpdateScheduleVisit(ScheduleVisitModel model, IVisitProcessingService visitProcessingService)
        {
            Mapper.CreateMap<ScheduleVisitModel, ScheduleVisitDomainModel>();
            if (model.UserIds == null)
                model.UserIds = "-1";
            var newVisitDetails = Mapper.Map<ScheduleVisitModel, ScheduleVisitDomainModel>(model);
            var VisitId = 0;

            if (((IQEApp.Web.Models.VisitProcessing.ScheduleVisitDetailsModel)model).LstPurchaseOrderItems != null)
            {
                if (((IQEApp.Web.Models.VisitProcessing.ScheduleVisitDetailsModel)model).LstPurchaseOrderItems.Count > 0)
                {

                    VisitId = visitProcessingService.UpdateScheduleVisit(newVisitDetails);
                    bool flag = false;
                    foreach (var obj in ((IQEApp.Web.Models.VisitProcessing.ScheduleVisitDetailsModel)model).LstPurchaseOrderItems)
                    {
                        Mapper.CreateMap<PurchaseOrderItemsViewModel, PurchaseOrderItemsDomainModel>();
                        var data1 = Mapper.Map<PurchaseOrderItemsViewModel, PurchaseOrderItemsDomainModel>(obj);
                        data1.VisitId = VisitId;
                        var PONUmbers = visitProcessingService.ReCreateScheduleVisitSelectedPOItems(data1,flag);
                        flag = true;
                    }
                }
            }
            return VisitId;
        }
       public (IEnumerable<ScheduleVisitModel> ScheduleVisits,  ScheduleVisitStatusModel StatusCounts, TotalsViewModel Totals)GetScheduledVisitList(int loginUserId,int siteId, string strSearch, string alphaChar, int offset,int fetch, bool activeStatus, string sortingOrder, string fiYear,    string month, IVisitProcessingService visitProcessingService)
        {
            var ds = visitProcessingService.GetScheduledVisitsList(loginUserId,siteId, strSearch, alphaChar, offset, fetch,activeStatus,sortingOrder, fiYear, month );

            List<ScheduleVisitModel> scheduleVisits =   ds.Tables[0].DataTableToList<ScheduleVisitModel>();

            DataRow statRow = ds.Tables[1].Rows[0];

            ScheduleVisitStatusModel statusCounts =  ds.Tables[1].DataTableToList<ScheduleVisitStatusModel>().FirstOrDefault();

            TotalsViewModel totals = new TotalsViewModel
            {
                TotalSaleValue = statRow["TotalSaleValue"] == DBNull.Value ? 0 : Convert.ToDecimal(statRow["TotalSaleValue"]),
                TotalCostValue = statRow["TotalCostValue"] == DBNull.Value ? 0 : Convert.ToDecimal(statRow["TotalCostValue"]),
                TotalGPValue = statRow["TotalGPValue"] == DBNull.Value ? 0 : Convert.ToDecimal(statRow["TotalGPValue"])
            };

            return (scheduleVisits, statusCounts, totals);
        }

        public ScheduleVisitModel GetVisitEmpUploadFileDetailsByID(IVisitProcessingService visitProcessingService, string VisitId, string fileName)
        {
            ScheduleVisitModel files = new ScheduleVisitModel();
            var filesInfo = visitProcessingService.GetVisitEmpUploadFileDetailsByID(VisitId, fileName);
            Mapper.CreateMap<ScheduleVisitDomainModel, ScheduleVisitModel>();
            files = Mapper.Map<ScheduleVisitDomainModel, ScheduleVisitModel>(filesInfo);
            return files;
        }

        public List<ScheduleVisitModel> GetFilteredVisits(GridFilterRequest request, IVisitProcessingService visitProcessingService)
        {
            if (request.Filters != null)
            {
                var filterDomainList = request.Filters.Select(f => new GridFilterDomainModel
                {
                    Column = f.Column,
                    FilterType = f.FilterType,
                    Value = f.Value
                }).ToList();

                var visitList = visitProcessingService.GetFilteredVisits(filterDomainList, request.PageCount, request.FetchCount , request.FiYear, request.Month);
                Mapper.CreateMap<ScheduleVisitDomainModel, ScheduleVisitModel>();
                LstVisitsList = visitList.Select(Mapper.Map<ScheduleVisitDomainModel, ScheduleVisitModel>).ToList();

                return LstVisitsList;
            }
            else return LstVisitsList;
        }
        public List<InspRepoNoViewModel> GetInspRepoNoByPurchaseId(string purchaseId, IVisitProcessingService visitProcessingService)
        {
            List<InspRepoNoViewModel> LstInspRepoList = new List<InspRepoNoViewModel>();
             var insprepoList = visitProcessingService.GetInspRepoNoByPurchaseId(purchaseId);
            Mapper.CreateMap<InspRepoNoDomainModel, InspRepoNoViewModel>();
            LstInspRepoList = insprepoList.Select(Mapper.Map<InspRepoNoDomainModel, InspRepoNoViewModel>).ToList();
            return LstInspRepoList;
        }

        public (IEnumerable<ScheduleVisitModel> ScheduleVisits, ScheduleVisitStatusModel StatusCounts, TotalsViewModel Totals)  GetScheduleVisitFilters(GridFilterRequest request,
        int loginUserId,  int siteId, string strSearch, string alphaChar, int offset, int fetch,  bool activeStatus,  string sortingOrder,    string fIYear,
        string month,   IVisitProcessingService visitProcessingService)
        {
            var filterDomainList = request.Filters?
                .Select(f => new GridFilterDomainModel
                {
                    Column = f.Column,
                    FilterType = f.FilterType,
                    Value = f.Value
                })
                .ToList() ?? new List<GridFilterDomainModel>();

            var(visitList, statusCountsDomain, totals) =  visitProcessingService.GetScheduleVisitFilters( filterDomainList, loginUserId,  siteId,
                    strSearch, alphaChar,offset, fetch,activeStatus,sortingOrder, fIYear,month );

            Mapper.CreateMap<ScheduleVisitDomainModel, ScheduleVisitModel>();
            LstVisitsList = visitList.Select(Mapper.Map<ScheduleVisitDomainModel, ScheduleVisitModel>).ToList();

            ScheduleVisitStatusModel mappedStatus = null;
            if (statusCountsDomain != null)
            {
                Mapper.CreateMap<ScheduleVisitStatusDomainModel, ScheduleVisitStatusModel>();
                mappedStatus = Mapper.Map<ScheduleVisitStatusDomainModel, ScheduleVisitStatusModel>(statusCountsDomain);
            }
            TotalsViewModel mappedTotals = null;
            if (totals != null)
            {
                Mapper.CreateMap<TotalsDomainModel, TotalsViewModel>();
                mappedTotals = Mapper.Map<TotalsDomainModel, TotalsViewModel>(totals);
            }

            return (LstVisitsList, mappedStatus, mappedTotals);
        }
        
        public List<ScheduleVisitModel> ScheduleVisitFilters(string ColumnName, string FilterType, string FilterValue, int pageCount, int fetchCount, IVisitProcessingService visitProcessingService)
        {
            var visitList = visitProcessingService.ScheduleVisitFilters(ColumnName, FilterType, FilterValue, pageCount, fetchCount);
            Mapper.CreateMap<ScheduleVisitDomainModel, ScheduleVisitModel>();
            LstVisitsList = visitList.Select(Mapper.Map<ScheduleVisitDomainModel, ScheduleVisitModel>).ToList();
            return LstVisitsList;
        }

        public List<PONumberItemsViewModel> GetVisitPODetailsByVisitId(int visitId , IVisitProcessingService visitProcessingService)
        {
            List<PONumberItemsViewModel> lstPONumberItems;
            var visitList = visitProcessingService.GetVisitPODetailsByVisitId(visitId);
            Mapper.CreateMap<PONumberItemsDomainModel, PONumberItemsViewModel>();
            lstPONumberItems = visitList.Select(Mapper.Map<PONumberItemsDomainModel, PONumberItemsViewModel>).ToList();
            return lstPONumberItems;
        }
        public List<PONumberItemsViewModel> GetVisitPODetailsByVisitIds(List<int> visitIds, IVisitProcessingService visitProcessingService)
        {
            var visitList = visitProcessingService.GetVisitPODetailsByVisitIds(visitIds);

            Mapper.CreateMap<PONumberItemsDomainModel, PONumberItemsViewModel>();

            return visitList
                .Select(Mapper.Map<PONumberItemsDomainModel, PONumberItemsViewModel>)
                .ToList();
        }
        public List<ScheduleVisitModel> PreviewScheduledVisit(int loginUserId, Guid? controlNumberGuid, IVisitProcessingService visitProcessingService)
        {
            var visitList = visitProcessingService.PreviewScheduledVisit(loginUserId, controlNumberGuid);
            Mapper.CreateMap<ScheduleVisitDomainModel, ScheduleVisitModel>();
            LstVisitsList = visitList.Select(Mapper.Map<ScheduleVisitDomainModel, ScheduleVisitModel>).ToList();
            return LstVisitsList;
        }
        public ScheduleVisitDetailsModel GetVisitDetailsToEdit(Guid visitIdGuid, int loginUserId, int siteId, IVisitProcessingService visitProcessingService)
        {
            var visitDetails = visitProcessingService.GetVisitDetailsToEdit(visitIdGuid, loginUserId, siteId);
            ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();
            model.ControlNumberDetails = visitDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            model.LstUsers = visitDetails.Tables[1].DataTableToList<UserViewModel>();
            model.LstUsersGrid = visitDetails.Tables[2].DataTableToList<UserViewModel>();
            var visit = visitDetails.Tables[3].DataTableToList<ScheduleVisitModel>().FirstOrDefault();
            model.VisitId = visit.VisitId;
            model.VisitGuid = visit.VisitGuid;
            model.ScheduleDate = visit.ScheduleDate;
            model.ClientConfirmation = visit.ClientConfirmation;
            model.ManufacturerConfirmation = visit.ManufacturerConfirmation;
            model.ScheduleComments = visit.ScheduleComments;
            model.POID = visit.POID;
            model.ClientUnitDetails = visitDetails.Tables[4].DataTableToList<ClientUnitsViewModel>().FirstOrDefault();
            model.ManufacturerUnitDetails = visitDetails.Tables[5].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault();
            model.PurchaseOrderDetails = visitDetails.Tables[6].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault();
            model.ServiceOrderDetails = visitDetails.Tables[7].DataTableToList<ServiceOrderViewModel>().FirstOrDefault();
            model.LstStates = visitDetails.Tables[8].DataTableToList<CommonModel.StateModel>().ToList() ?? new List<CommonModel.StateModel>(); ;
            return model;
        }
        public ScheduleVisitDetailsModel ViewVisitDetailsByGuid(Guid visitIdGuid, int loginUserId, int siteId, IVisitProcessingService visitProcessingService)
        {
            var visitDetails = visitProcessingService.ViewVisitDetailsByGuid(visitIdGuid, loginUserId, siteId);
            ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();
            model.ControlNumberDetails = visitDetails.Tables[0].DataTableToList<ControlNumberViewModel>().FirstOrDefault();
            // model.LstUsers = visitDetails.Tables[1].DataTableToList<UserViewModel>();
            model.LstVisitProcessing = new List<VisitProcessingModel>();
            List<FileViewModel> lstFileDocs = visitDetails.Tables[3].DataTableToList<FileViewModel>().ToList();
            List<TravelExpensesModel> lstVisitExpenses = visitDetails.Tables[4].DataTableToList<TravelExpensesModel>().ToList();
            foreach (var employeeVisit in visitDetails.Tables[1].DataTableToList<VisitProcessingModel>())
            {
                employeeVisit.TechnicalDocsList = lstFileDocs.Where(m => (m.SectionId == 11) && (m.GenericId == employeeVisit.VEM_ID)).ToList();
                employeeVisit.TravelDocsList = lstFileDocs.Where(m => (m.SectionId == 12) && (m.GenericId == employeeVisit.VEM_ID)).ToList();
                employeeVisit.TravelExpenses = lstVisitExpenses.Where(e => e.VEMId == employeeVisit.VEM_ID).ToList();
                model.LstVisitProcessing.Add(employeeVisit);
            }
            var visit = visitDetails.Tables[2].DataTableToList<ScheduleVisitModel>().FirstOrDefault();
            model.VisitId = visit.VisitId;
            model.VisitGuid = visit.VisitGuid;
            model.ScheduleDate = visit.ScheduleDate;
            model.ClientConfirmation = visit.ClientConfirmation;
            model.ManufacturerConfirmation = visit.ManufacturerConfirmation;
            model.ScheduleComments = visit.ScheduleComments;
            model.QualityHeadComments = visit.QualityHeadComments;
            model.QualityDoneByName = visit.QualityDoneByName;
            model.QualityDoneOn = visit.QualityDoneOn;
            model.FinanceApproverComments = visit.FinanceApproverComments;
            model.FinanceApprovedByName = visit.FinanceApprovedByName;
            model.FinanceApprovedOn = visit.FinanceApprovedOn;
            model.VisitStatusName = visit.VisitStatusName;
            model.VisitStatusId = visit.VisitStatusId;

            return model;
        }
        public bool UpdateVisitDetails(ScheduleVisitModel model, IVisitProcessingService visitProcessingService)
        {
            Mapper.CreateMap<ScheduleVisitModel, ScheduleVisitDomainModel>();
            var newVisitDetails = Mapper.Map<ScheduleVisitModel, ScheduleVisitDomainModel>(model);
            var retStatus = visitProcessingService.UpdateVisitDetails(newVisitDetails);
            return retStatus;
        }
        public ScheduleVisitDetailsModel EditVisitScheduleByVID(int VisitId,string PONID, int POID, IVisitProcessingService visitProcessingService)
        {
            ScheduleVisitDetailsModel model = new ScheduleVisitDetailsModel();

            model.SelectedPONIdList = objConvExt.ConvertStringToList(PONID);
            var dsPoItemDetails = visitProcessingService.EditVisitScheduleByVID(VisitId, model.SelectedPONIdList, POID);
            if (dsPoItemDetails != null)
            {
                model.LstPurchaseOrderNumbers = dsPoItemDetails.Tables[0].DataTableToList<PurchaseOrderNumbersViewModel>().ToList();
                model.LstPurchaseOrderItems = dsPoItemDetails.Tables[1].DataTableToList<PurchaseOrderItemsViewModel>().ToList();
                model.LstCountries = dsPoItemDetails.Tables[2].DataTableToList<CommonModel.CountryModel>().ToList();
                model.LstStates = dsPoItemDetails.Tables[3].DataTableToList<CommonModel.StateModel>().ToList();
                model.LstUsers  = dsPoItemDetails.Tables[4].DataTableToList<UserViewModel>().ToList();
                model.LstSelectedPurchaseOrderItems = dsPoItemDetails.Tables[5].DataTableToList<PurchaseOrderItemsViewModel>().ToList();
                var visit = dsPoItemDetails.Tables[6].DataTableToList<ScheduleVisitModel>().FirstOrDefault();

                model.ControlNumberDetailsModel = new ControlNumberDetailsModel();

                model.ControlNumberDetailsModel.LstClients = dsPoItemDetails.Tables[7].DataTableToList<ClientViewModel>().ToList();
                model.ControlNumberDetailsModel.LstClientUnits = dsPoItemDetails.Tables[8].DataTableToList<ClientUnitsViewModel>().ToList();
                model.ControlNumberDetailsModel.LstControlNumbers = dsPoItemDetails.Tables[9].DataTableToList<ControlNumberViewModel>().ToList();
                model.ControlNumberDetailsModel.LstServiceOrdersList =   dsPoItemDetails.Tables[10].DataTableToList<ServiceOrderViewModel>().ToList(); 
                model.ControlNumberDetailsModel.LstManufacturerUnitDetails = dsPoItemDetails.Tables[11].DataTableToList<ManufacturerUnitsViewModel>().ToList();
                model.ControlNumberDetailsModel.LstPurchaseOrderNumbers = dsPoItemDetails.Tables[12].DataTableToList<PurchaseOrderNumbersViewModel>().ToList();

                if (dsPoItemDetails.Tables[0].Rows.Count > 0)
                {
                    model.ControlNumberDetailsModel.ClientId = Convert.ToInt32(dsPoItemDetails.Tables[0].Rows[0]["ClientId"]);
                    model.ControlNumberDetailsModel.ClientUnitId = Convert.ToInt32(dsPoItemDetails.Tables[0].Rows[0]["ClientUnitId"]);
                    model.ControlNumberDetailsModel.ControlId = Convert.ToInt32(dsPoItemDetails.Tables[0].Rows[0]["ControlId"]);
                    model.ControlNumberDetailsModel.SOId = Convert.ToInt32(dsPoItemDetails.Tables[0].Rows[0]["SOId"]);
                    model.ControlNumberDetailsModel.ManufacturerId = Convert.ToInt32(dsPoItemDetails.Tables[0].Rows[0]["ManufacturerId"]);

                    model.SelectedPONIdList = objConvExt.ConvertStringToList(PONID);
                }

                model.UserId = visit.UserId;
                model.CountryId = visit.CountryId;
                model.StateId = visit.StateId;
                model.StateName = visit.StateName;
                model.VisitLocation = visit.VisitLocation;
                model.RFIScheduleDate = visit.RFIScheduleDate;
                model.ScheduleDate = visit.ScheduleDate;
                model.VisitDate = visit.VisitDate;
                model.ClientConfirmation = visit.ClientConfirmation;
                model.ManufacturerConfirmation = visit.ManufacturerConfirmation;
                model.ScheduleComments = visit.ScheduleComments;
                model.POID = visit.POID;

                foreach (var item in model.LstPurchaseOrderItems)
                {
                    var selectedItem = model.LstSelectedPurchaseOrderItems.FirstOrDefault(s => s.POItemNo == item.POItemNo && s.PONId == item.PONId);
                    if (selectedItem != null)
                    {
                        item.Remarks = selectedItem.Remarks;
                        item.InspectionActivity = selectedItem.InspectionActivity;
                        item.Description = selectedItem.Description;
                        item.Quantity = selectedItem.Quantity;
                        item.NumberOfVisits = selectedItem.NumberOfVisits;
                    }
                }
            }

            return model;
        }

        // Wrapper/helper to reassign control number for a visit using service
        public bool ReassignVisitControlNumber(int visitId, int toControlId, int changedBy, string reason, IVisitProcessingService visitProcessingService)
        {
            if (visitProcessingService == null) return false;
            try
            {
                return visitProcessingService.ReassignVisitControlNumber(visitId, toControlId, changedBy, reason);
            }
            catch
            {
                return false;
            }
        }
    }

    public enum VisitStatus
    {
        VisitScheduled = 1,
        VisitInitiated = 2,
        VisitCompleted = 3,
        QualityCheckCompleted = 4,
        FinanceCheckCompleted = 5,
        InvoiceInitiated = 6,
        InvoiceCompleted = 7,
        InvoiceCancelled = 8,
        PaymentInitiated = 9,

    }
}