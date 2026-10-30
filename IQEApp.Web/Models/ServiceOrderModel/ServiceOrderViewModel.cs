using AutoMapper;
using IQEApp.Core.Extensions;
using IQEApp.Domain.EnquiryDomain;
using IQEApp.Domain.PurchaseOrderDomain;
using IQEApp.Domain.ServiceOrderDomain;
using IQEApp.Service.EnquiryService;
using IQEApp.Service.ServiceOrder;
using IQEApp.Web.Models.ClientModel;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.EnquiryModel;
using IQEApp.Web.Models.ManufacturerModel;
using IQEApp.Web.Models.PurchaseOrderModel;
using IQEApp.Web.Utils;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace IQEApp.Web.Models.ServiceOrderModel
{
    public class ServiceOrderViewModel : BaseViewModel
    {
        public int SOId { get; set; }

        public int ControlId { get; set; }

        public string ControlNo { get; set; }
        public Guid ServiceOrderGuid { get; set; }


        [DisplayName("LOI SO")]
        [Required]
        [Range(1,2)]
        public int LOISOType { get; set; }

        [DisplayName("LOI/Others")]
        [Required]
        [StringLength(35, ErrorMessage = "LOI/Others cannot exceed 35 characters. ")]
        public string LOINumber { get; set; }

        [DisplayName("S.O. Number")]
        [Required]
        [StringLength(35, ErrorMessage = "Service order number cannot exceed 35 characters. ")]
        public string SONumber { get; set; }

        
        [DisplayName("S.O. Type")]
        [Required]
        [Range(1, 3)]
        public int SOType { get; set; }

        [DisplayName("Other S.O. Type")]
        public string OtherSOType { get; set; }
        public string ServiceOrderTypeName { get; set; }
        [Required]
        [DisplayName("S.O. Start Date")]
        //[DisplayFormat(DataFormatString = "{0:dd-MM-yyyy}")] 
        public DateTime? SODate { get; set; }
        [DisplayName("S.O. Due Date")]
        //[DisplayFormat(DataFormatString = "{0:d}")] 
        [Required]
        public DateTime? SODueDate { get; set; }
        [DisplayName("Customer Name")]
        [Required]
        public int ClientId { get; set; }
        [DisplayName("Customer Unit Name")]
        [Required]
        public int ClientUnitId { get; set; }

        [Required]
        [DisplayName("Customer Name")]
        public string ClientName { get; set; }
        
        [Required]
        public string ClientUnitName { get; set; }
        public string ManufacturerName { get; set; }
        public int ManufacturerId { get; set; }
        [Required]
        public List<int> LstManufacturerIds { get; set; }
        [Required]
        public int ManufacturerUnitId { get; set; }
        public string ManufacturerUnitName { get; set; }
        public List<int> LstManufacturerUnitIds { get; set; }
        [DisplayName("P.O. Number")]
        public int POID { get; set; }
        public string PONumber { get; set; }
        public string POIDs { get; set; }
        [Required]
        public List<int> LstPOIDs { get; set; }
        [DisplayName("S.O. Comments"), StringLength(1000, ErrorMessage = "The Service order num cannot exceed {0} characters. ")]
        public string SOComments { get; set; }
        [Required]
        public string Amount { get; set; }
        [DisplayName("Currency")]
        public int CurrencyId { get; set; }
        public int Total { get; set; }
        public bool IsSOActive { get; set; }
        public string ContactPersonName { get; set; }
        public string ContactPersonDesignation { get; set; }
        [DisplayName("Project Number"), StringLength(50, ErrorMessage = "Enter Less than 50 characters. ")]
        public string ProjectNumber { get; set; }
        [DisplayName("Project Name"), StringLength(100, ErrorMessage = "Enter Less than 100 characters. ")]
        public string ProjectName { get; set; }

        public int EID { get; set; }
        public string EnquiryIdRefernce { get; set; }



        [Required(ErrorMessage = "Please select file.")]
        [RegularExpression(@"([a-zA-Z0-9\s_\\.\-:])+(.pdf|.doc)$", ErrorMessage = "Only Pdf doc files allowed.")]
        public string FileName { get; set; }

        public string FilePath { get; set; }
        public HttpPostedFileBase[] UploadFile { get; set; }
        public HttpPostedFileBase[] ExistingFiles { get; set; }

    }
    public class ServiceOrderDetailsModel : ServiceOrderViewModel
    {
        public List<ClientViewModel> LstClients { get; set; }
        public List<ClientUnitsViewModel> LstClientUnits { get; set; }
        public List<ManufacturerViewModel> LstManufacturers { get; set; }
        public List<ManufacturerUnitsViewModel> LstManufacturerUnits { get; set; }
        public List<CommonModel.CurrencyTypeModel> LstCurrencyType { get; set; }
        public ClientViewModel ClientDetails { get; set; }
        public List<CommonModel.LOISOType> LstLOISOTypes { get; set; }
        public List<CommonModel.ServiceOrderType> LstServiceOrderTypes { get; set; }
        public List<PurchaseOrderViewModel> LstPONumbers { get; set; }
        public ClientUnitsViewModel ClientUnitDetails { get; set; }
        public PurchaseOrderViewModel PurchaseOrderDetails { get; set; }
        public ManufacturerViewModel ManufacturerDetails { get; set; }
        public ManufacturerUnitsViewModel ManufacturerUnitDetails { get; set; }
    }

    public class ServiceOrderBusinessModel
    {
        public List<ServiceOrderViewModel> LstServiceOrders { get; set; }
        #region ServiceOrder

        public List<ServiceOrderViewModel> GetServiceOrdersBySite(DirectorySearchQueryModel model, IServiceOrderService serviceOrderService)
        {
            var serviceOrders = serviceOrderService.GetServiceOrders(model.SiteId, model.StrSearch, model.AlphaSearch,
                model.PageCount, model.FetchCount, model.ActiveStatus, model.SortingOrder);
            Mapper.CreateMap<ServiceOrderDomainModel, ServiceOrderViewModel>();
            return LstServiceOrders = serviceOrders.Select(Mapper.Map<ServiceOrderDomainModel, ServiceOrderViewModel>).ToList();
        }
        public ServiceOrderDetailsModel GetServiceOrderDetailsToAdd(int loginUserSiteId, IServiceOrderService serviceOrderService)
        {
            var dsServiceOrderDetails = serviceOrderService.GetServiceOrderDetailsToAdd(loginUserSiteId);
            ServiceOrderDetailsModel obj = new ServiceOrderDetailsModel();
            obj.LstClients = dsServiceOrderDetails.Tables[0].DataTableToList<ClientViewModel>();
            obj.LstServiceOrderTypes = dsServiceOrderDetails.Tables[1].DataTableToList<CommonModel.ServiceOrderType>();
            obj.LstLOISOTypes = dsServiceOrderDetails.Tables[2].DataTableToList<CommonModel.LOISOType>();
            obj.LstCurrencyType = dsServiceOrderDetails.Tables[3].DataTableToList<CommonModel.CurrencyTypeModel>();
            //obj.LstPONumbers = dsServiceOrderDetails.Tables[3].DataTableToList<PurchaseOrderViewModel>();
            // obj.LstManufacturers = dsServiceOrderDetails.Tables[4].DataTableToList<ManufacturerViewModel>();
            return obj;
        }

        public List<PurchaseOrderViewModel> GetPODetailsByClientUnitId(int clientUnitId, int siteId, string ManufacturerUnitIds, IServiceOrderService serviceOrderService)
        {
            List<PurchaseOrderViewModel> model = new List<PurchaseOrderViewModel>();
            var data = serviceOrderService.GetPODetailsByClientUnitId(clientUnitId, siteId, ManufacturerUnitIds);
            Mapper.CreateMap<PurchaseOrderDomainModel, PurchaseOrderViewModel>();
            model = data.Select(Mapper.Map<PurchaseOrderDomainModel, PurchaseOrderViewModel>).ToList();
            return model;
        }
        public int SaveNewServiceOrder(ServiceOrderViewModel objSOVM, IServiceOrderService serviceOrderService)
        {
            Mapper.CreateMap<ServiceOrderViewModel, ServiceOrderDomainModel>();
            var data = Mapper.Map<ServiceOrderViewModel, ServiceOrderDomainModel>(objSOVM);
           // ConvertExtensions objConvExt = new ConvertExtensions();
           // data.POIDs = objConvExt.ConvertListToString(data.LstPOIDs);
            //data.ManufacturerUnitIds = objConvExt.ConvertListToString(data.LstManufacturerUnitIds);
            var serviceOrderId = serviceOrderService.SaveNewServiceOrder(data);
            return serviceOrderId;
        }

        public int SaveServiceOrderCNo(ServiceOrderViewModel objSOVM, IServiceOrderService serviceOrderService)
        {
            Mapper.CreateMap<ServiceOrderViewModel, ServiceOrderDomainModel>();
            var data = Mapper.Map<ServiceOrderViewModel, ServiceOrderDomainModel>(objSOVM);
            ConvertExtensions objConvExt = new ConvertExtensions();
            data.POIDs = objConvExt.ConvertListToString(data.LstPOIDs);
            data.ManufacturerUnitIds = objConvExt.ConvertListToString(data.LstManufacturerUnitIds);
            var serviceOrderId = serviceOrderService.SaveServiceOrderCNo(data);
            return serviceOrderId;
        }

        public bool ServiceOrderUploadedFilesBySOID(ServiceOrderViewModel objSOVM,bool Flag, IServiceOrderService serviceOrderService)
        {
            Mapper.CreateMap<ServiceOrderViewModel, ServiceOrderDomainModel>();
            ServiceOrderDomainModel objServiceOrderDomainModel = Mapper.Map<ServiceOrderViewModel, ServiceOrderDomainModel>(objSOVM);
            var isSuccess =  serviceOrderService.ServiceOrderUploadedFilesBySOID(objServiceOrderDomainModel,Flag);
            return isSuccess;
        }
        public bool RemoveServiceOrderFileBySOID(ServiceOrderViewModel objSOVM,  IServiceOrderService serviceOrderService)
        {
            Mapper.CreateMap<ServiceOrderViewModel, ServiceOrderDomainModel>();
            ServiceOrderDomainModel objServiceOrderDomainModel = Mapper.Map<ServiceOrderViewModel, ServiceOrderDomainModel>(objSOVM);
            var isSuccess = serviceOrderService.RemoveServiceOrderFileBySOID(objServiceOrderDomainModel);
            return isSuccess;
        }
        public ServiceOrderDetailsModel GetServiceOrderDetailsToEdit(Guid serviceOrderGuid, int loginUserSiteId, IServiceOrderService serviceOrderService)
        {
            var dsServiceOrderDetails = serviceOrderService.GetServiceOrderDetailsToEdit(serviceOrderGuid, loginUserSiteId);
            ServiceOrderDetailsModel obj = new ServiceOrderDetailsModel();
            var dataSet = dsServiceOrderDetails.Tables[0].DataTableToList<ServiceOrderViewModel>().FirstOrDefault();
            obj.SOId = dataSet.SOId;
            obj.SONumber = dataSet.SONumber;
            obj.SOType = dataSet.SOType;
            obj.OtherSOType = dataSet.OtherSOType;
            obj.LOISOType = dataSet.LOISOType;
           // obj.PONumber = dataSet.PONumber;
           // obj.POID = dataSet.POID;
            obj.SODueDate = dataSet.SODueDate;
            obj.SODate = dataSet.SODate;
            obj.SOComments = dataSet.SOComments;
            obj.ClientId = dataSet.ClientId;
            obj.ClientUnitId = dataSet.ClientUnitId;
            obj.Amount = dataSet.Amount;
            obj.ProjectNumber = dataSet.ProjectNumber;
            obj.ProjectName = dataSet.ProjectName;
            obj.LOINumber=dataSet.LOINumber;
            obj.SONumber = dataSet.SONumber;
            obj.CurrencyId = dataSet.CurrencyId;
            obj.FileName = dataSet.FileName;
                obj.FilePath = dataSet.FilePath;
            // obj.ManufacturerId = dataSet.ManufacturerId;
            // obj.ManufacturerUnitId = dataSet.ManufacturerUnitId;
            // obj.LstClients = dsServiceOrderDetails.Tables[1].DataTableToList<ClientViewModel>();
            obj.LstClients = dsServiceOrderDetails.Tables[1].DataTableToList<ClientViewModel>();
            obj.LstServiceOrderTypes = dsServiceOrderDetails.Tables[2].DataTableToList<CommonModel.ServiceOrderType>();
            obj.LstLOISOTypes = dsServiceOrderDetails.Tables[3].DataTableToList<CommonModel.LOISOType>();
            obj.LstClientUnits = dsServiceOrderDetails.Tables[4].DataTableToList<ClientUnitsViewModel>();
            obj.LstCurrencyType = dsServiceOrderDetails.Tables[5].DataTableToList<CommonModel.CurrencyTypeModel>();
            //obj.LstPONumbers = dsServiceOrderDetails.Tables[3].DataTableToList<PurchaseOrderViewModel>();
            //obj.ClientUnitDetails = dsServiceOrderDetails.Tables[5].DataTableToList<ClientUnitsViewModel>().FirstOrDefault();
            //obj.PurchaseOrderDetails = dsServiceOrderDetails.Tables[6].DataTableToList<PurchaseOrderViewModel>().FirstOrDefault()?? new PurchaseOrderDetailsModel();
            //obj.PurchaseOrderDetails.LstPurchaseOrderItems = dsServiceOrderDetails.Tables[7].DataTableToList<PurchaseOrderItemsViewModel>().ToList()??new List<PurchaseOrderItemsViewModel>();
            //  obj.LstManufacturers = dsServiceOrderDetails.Tables[8].DataTableToList<ManufacturerViewModel>();
            // obj.LstManufacturerUnits = dsServiceOrderDetails.Tables[9].DataTableToList<ManufacturerUnitsViewModel>();
            //obj.ManufacturerUnitDetails = dsServiceOrderDetails.Tables[10].DataTableToList<ManufacturerUnitsViewModel>().FirstOrDefault();
            // List<int> lstIds = new List<int>();
            //foreach (var unit in dsServiceOrderDetails.Tables[11].DataTableToList<PurchaseOrderViewModel>())
            //{
            //    lstIds.Add(unit.POId);
            //}

            //obj.LstPOIDs = lstIds;
            //List<int> lstM = new List<int>();
            //List<int> lstMU = new List<int>();
            //foreach (var unit in dsServiceOrderDetails.Tables[12].DataTableToList<ManufacturerUnitsViewModel>())
            //{
            //    lstM.Add(unit.ManufacturerId);
            //    lstMU.Add(unit.ManufacturerUnitId);
            //    //  objClientDetailsModel.LstManufacturerUnitIds.Add(unit.ManufacturerUnitId);
            //}
            //obj.LstManufacturerIds = lstM;
            //obj.LstManufacturerUnitIds = lstMU;
            return obj;
        }
        public bool UpdateServiceOrder(ServiceOrderViewModel objSOVM, IServiceOrderService serviceOrderService)
        {
            Mapper.CreateMap<ServiceOrderViewModel, ServiceOrderDomainModel>();
            var data = Mapper.Map<ServiceOrderViewModel, ServiceOrderDomainModel>(objSOVM);
            //ConvertExtensions objConvExt = new ConvertExtensions();
            //data.POIDs = objConvExt.ConvertListToString(data.LstPOIDs);
            //data.ManufacturerUnitIds = objConvExt.ConvertListToString(data.LstManufacturerUnitIds);
            var retStatus = serviceOrderService.UpdateServiceOrder(data);
            return retStatus;
        }
        public bool UpdateServiceOrderStatus(Guid serviceOrderGuid, int loginUserId, bool status, IServiceOrderService serviceOrderService)
        {
            var retStatus = serviceOrderService.UpdateServiceOrderStatus(serviceOrderGuid, loginUserId, status);
            return retStatus;
        }
        #endregion
    }
}