using IQEApp.Web.Models.ControlNumberModel;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using IQEApp.Web.Models.CommonModels;

namespace IQEApp.Web.Models.PurchaseOrderModel
{
    public class PurchaseOrderItemsViewModel
    {
        public int POItemId { get; set; }
        public Guid POItemGuid { get; set; }
        [Required]
        [DisplayName("Item No")]
        [StringLength(15, ErrorMessage = "The value cannot exceed 15 characters. ")]
        public string POItemNo { get; set; }
        public int? Quantity { get; set; }

        [DisplayName("UOM")]
        public int UOMID { get; set; }
        public string UOMName { get; set; }
        public string UOMOthers { get; set; }
        public List<CommonModel.UnitOfMeasurment> LstUOM { get; set; }
        [Required]
        [StringLength(250, ErrorMessage = "The value cannot exceed 250 characters.")]
        public string Description { get; set; }
        [DisplayName("Allowed Visits")]
        public int? NumberOfVisits { get; set; }
        public int POId { get; set; }

        public int PONId { get; set; }

        public int? VisitId { get; set; }
        public int? VisitPId { get; set; }
        public string PONumber { get; set; }
        [StringLength(1000, ErrorMessage = "The value cannot exceed 1000 characters.")]
        public string Remarks { get; set; }
        public string InspectionActivity { get; set; }


    }

    public class PurchaseOrderNumbersViewModel 
    {
        public int ManufacturerId { get; set; }
        public string ManufacturerName { get; set; }

        public string PurchaseID { get; set; }
        public int PONId { get; set; }
        public string PONIds { get; set; }
        public Guid PONGuid { get; set; }
        public string PONumber { get; set; }
        public DateTime? PoDate { get; set; }
        public int POId { get; set; }

        public string ControlNo { get; set; }
        public int ControlID { get; set; }
        public int SOID { get; set; }
        public string SONumber { get; set; }
        public List<PurchaseOrderNumbersViewModel> LstPurchaseOrderNumbers { get; set; }
        public List<CommonModel.UnitOfMeasurment> LstUOM { get; set; }

         public int ClientID          {get;set;}
         public string ClientName        {get;set;}
         public int ClientUnitId      {get;set;}
         public string ClientUnitName    {get;set;}

        public int UOMID { get; set; }
        public string UOMName { get; set; }
        public string UOMOthers { get; set; }
        public string DisplayText => $"{PONumber} - {PurchaseID}";
    }


}