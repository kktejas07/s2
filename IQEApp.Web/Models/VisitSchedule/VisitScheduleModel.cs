using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Models.CommonModels;
using AutoMapper;
using IQEApp.Domain.PurchaseOrderDomain;
using IQEApp.Service.VisitProcessing;
using IQEApp.Domain.VisitSchedule;
using IQEApp.Service.VisitScheduleService;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.ControlNumberModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.ServiceOrderModel;
using IQEApp.Web.Models.UserModel;
using IQEApp.Core.Extensions;

namespace IQEApp.Web.Models.VisitSchedule
{
    public class VisitScheduleModel : BaseViewModel
    {
        public int VisitTypeId { get; set; }
        public int VisitId { get; set; }
        public string VisitSeqId { get; set; }

        public int ClientId { get; set; }

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
        public bool? ClientConfirmation { get; set; }
        [DisplayName("Manufacturer Confirmation")]
        public bool? ManufacturerConfirmation { get; set; }
        [DisplayName("Schedule Comments")]
        public string ScheduleComments { get; set; }
        public string UserIds { get; set; }
        public int VisitStatusId { get; set; }
        public string VisitStatusName { get; set; }
        public Guid VisitGuid { get; set; }
        public int CountryId { get; set; }
        public int StateId { get; set; }
        public string StateName { get; set; }
        public string InspectionActivity { get; set; }
        public string InspectionActivity1 { get; set; }
        public string InspectorName { get; set; }
        public string VisitLocation { get; set; }

        public List<CommonModel.VisitLocations> LstVisitLocations { get; set; }
        public List<string> VisitLocations { get; set; }
        public string InspReportNo { get; set; }
        public string Employment { get; set; }
        public string InvoiceNo { get; set; }

        public string FileName { get; set; }
        public string FilePath { get; set; }

        public DateTime InvoiceDate { get; set; }

        public int SaleValue { get; set; }

        public decimal CostValue { get; set; }

        public decimal GP { get; set; }
        public string PONIds { get; set; }

    }

    public class VisitScheduleDetailsModel : VisitScheduleModel
    {
        public List<ClientViewModel> LstClients { get; set; }
        //public ControlNumberDetailsModel ControlNumberDetailsModel { get; set; }

        //public ControlNumberViewModel ControlNumberDetails { get; set; }
        public List<UserViewModel> LstUsers { get; set; }
        //public List<UserViewModel> LstUsersGrid { get; set; }
        //public List<VisitProcessingModel> LstVisitProcessing { get; set; }
        //public ClientUnitsViewModel ClientUnitDetails { get; set; }
        //public ManufacturerUnitsViewModel ManufacturerUnitDetails { get; set; }
        //public List<ManufacturerUnitsViewModel> LstManufacturerUnitDetails { get; set; }
        //public PurchaseOrderViewModel PurchaseOrderDetails { get; set; }
        //public ServiceOrderViewModel ServiceOrderDetails { get; set; }
        //public List<PurchaseOrderNumbersViewModel> LstPurchaseOrderNumbers { get; set; }
        public List<PONumberItemsViewModel> LstPurchaseOrderItems { get; set; }
        //public List<PurchaseOrderItemsViewModel> LstSelectedPurchaseOrderItems { get; set; }
        public List<CommonModel.CountryModel> LstCountries { get; set; }
        public List<CommonModel.StateModel> LstStates { get; set; }

        public List<CommonModel.ManufacturerLocationMapping> LstManufacturerVisitLocations { get; set; }


        //public List<string> LstPOItemNos { get; set; }



    }

    public class VisitScheduleBusinessModel
    {
        public int VisitScheduleSave(VisitScheduleModel model, IVisitScheduleService visitScheduleService)
        {
            Mapper.CreateMap<VisitScheduleModel, VisitScheduleDomainModel>();
            if (model.UserIds == null)
                model.UserIds = "-1";

            var newVisitDetails = Mapper.Map<VisitScheduleModel, VisitScheduleDomainModel>(model);
            int VisitId = 0;

            var modelDetails = model as IQEApp.Web.Models.VisitSchedule.VisitScheduleDetailsModel;
            if (modelDetails?.LstPurchaseOrderItems != null && modelDetails.LstPurchaseOrderItems.Count > 0)
            {
                // Skip old string splitting logic
                // Handle visit locations only from model.VisitLocations (list of ManufacturerVisitLocation)

                string type;
                VisitId = visitScheduleService.VisitScheduleSave(newVisitDetails, out type);

                // Stop immediately on an unsuccessful visit result (prevent dependent saves)
                if (VisitId <= 0)
                {
                    return VisitId;
                }

                // Save Manufacturer Visit Locations (if any)
                if (modelDetails.LstManufacturerVisitLocations != null && modelDetails.LstManufacturerVisitLocations.Any())
                {
                    foreach (var visitLoc in modelDetails.LstManufacturerVisitLocations)
                    {
                        visitScheduleService.SaveManufacturerVisitLocation(VisitId, visitLoc.ManufacturerId,
                            visitLoc.LocationDetails,visitLoc.IsSubManufacturer, visitLoc.SubManufacturerDetails, visitLoc.ContactNo, visitLoc.Cost,  model.LoginUserId,  false , type);
                    }
                }

                // Save PO Item Details
                if (modelDetails.LstPurchaseOrderItems != null)
                {
                    foreach (var item in modelDetails.LstPurchaseOrderItems)
                    {
                        Mapper.CreateMap<PONumberItemsViewModel, PONumberItemsDomainModel>();
                        var mapped = Mapper.Map<PONumberItemsViewModel, PONumberItemsDomainModel>(item);

                        if (model.VisitDate.HasValue && model.VisitDate > DateTime.Today.AddDays(1))
                        {
                            mapped.VisitPId = VisitId;
                            mapped.VisitId = null;
                        }
                        else
                        {
                            mapped.VisitId = VisitId;
                            mapped.VisitPId = null;
                        }

                        visitScheduleService.AddVisitScheduleSelectedPOItems(mapped);
                    }
                }
            }

            return VisitId;
        }

        public VisitScheduleDetailsModel EditVisitScheduleByVID(int VisitId, IVisitScheduleService visitScheduleService)
        {
            VisitScheduleDetailsModel model = new VisitScheduleDetailsModel();

            //  model.SelectedPONIdList = objConvExt.ConvertStringToList(PONID);
            var dsPoItemDetails = visitScheduleService.EditVisitScheduleByVisitID(VisitId);
            if (dsPoItemDetails != null)
            {
                model.LstPurchaseOrderItems = dsPoItemDetails.Tables[1].DataTableToList<PONumberItemsViewModel>();// lstPurchaseOrderViewModel1 = new List<PONumberItemsViewModel>();
                model.LstClients= dsPoItemDetails.Tables[2].DataTableToList<ClientViewModel>();
                model.LstManufacturerVisitLocations = dsPoItemDetails.Tables[3].DataTableToList<CommonModel.ManufacturerLocationMapping>();

                model.LstCountries = new List<CommonModel.CountryModel>();// dsPoItemDetails.Tables[3].DataTableToList<CommonModel.CountryModel>();
               
                model.LstStates = new List<CommonModel.StateModel>();
                model.LstUsers = new List<UserViewModel>();
               
                model.PONIds = string.Join(",", model.LstPurchaseOrderItems
                        .Select(x => x.PONID)
                        .Distinct());
                var visitRow = dsPoItemDetails.Tables[0].DataTableToList<VisitScheduleDetailsModel>().FirstOrDefault();

                if (visitRow != null)
                {
                    model.ClientId = visitRow.ClientId;
                    model.VisitTypeId = visitRow.VisitTypeId;
                    model.CountryId = visitRow.CountryId;
                    model.StateId = visitRow.StateId;
                    model.StateName = visitRow.StateName;
                    model.VisitLocation = visitRow.VisitLocation;
                    model.UserId = visitRow.UserId;

                    model.ScheduleDate = visitRow.ScheduleDate;
                    model.RFIScheduleDate = visitRow.RFIScheduleDate;
                    model.VisitDate = visitRow.VisitDate;
                    model.ScheduleComments = visitRow.ScheduleComments;
                    model.ClientConfirmation = visitRow.ClientConfirmation;
                    model.ManufacturerConfirmation = visitRow.ManufacturerConfirmation;
                } ////  model.LstSelectedPurchaseOrderItems = dsPoItemDetails.Tables[5].DataTableToList<PurchaseOrderItemsViewModel>().ToList();
                //  var visit = dsPoItemDetails.Tables[6].DataTableToList<ScheduleVisitModel>().FirstOrDefault();



                return model;
            }
            return null;
        }

        public int VisitScheduleUpdate(VisitScheduleModel model, IVisitScheduleService visitScheduleService)
        {
            Mapper.CreateMap<VisitScheduleModel, VisitScheduleDomainModel>();
            if (model.UserIds == null)
                model.UserIds = "-1";
            var newVisitDetails = Mapper.Map<VisitScheduleModel, VisitScheduleDomainModel>(model);
            var VisitId = 0;

            if (((IQEApp.Web.Models.VisitSchedule.VisitScheduleDetailsModel)model).LstPurchaseOrderItems != null)
            {
                if (((IQEApp.Web.Models.VisitSchedule.VisitScheduleDetailsModel)model).LstPurchaseOrderItems.Count > 0)
                {

                    VisitId = visitScheduleService.VisitScheduleUpdate(newVisitDetails);
                    var modelDetails = model as IQEApp.Web.Models.VisitSchedule.VisitScheduleDetailsModel;
                    bool flag = true;
                    if (VisitId > 0 && modelDetails.LstManufacturerVisitLocations.Any() == true)
                    {

                        foreach (var visitLoc in modelDetails.LstManufacturerVisitLocations)
                        {
                            visitScheduleService.SaveManufacturerVisitLocation(VisitId, visitLoc.ManufacturerId,
                                visitLoc.LocationDetails, visitLoc.IsSubManufacturer, visitLoc.SubManufacturerDetails, visitLoc.ContactNo, visitLoc.Cost, model.LoginUserId, flag,"VisitId");
                            flag = false;
                        }
                    }


                    flag = true;
                    foreach (var obj in ((IQEApp.Web.Models.VisitSchedule.VisitScheduleDetailsModel)model).LstPurchaseOrderItems)
                    {
                        Mapper.CreateMap<PONumberItemsViewModel, PONumberItemsDomainModel>();
                        var data1 = Mapper.Map<PONumberItemsViewModel, PONumberItemsDomainModel>(obj); 
                        
                        data1.VisitId = VisitId;

                        // data1.POId = model.POID;

                        var PONUmbers = visitScheduleService.ReCreateVisitScheduleSelectedPOItems(data1, flag);
                        flag = false;
                    }
                }
            }
            return VisitId;
        }
    }
}