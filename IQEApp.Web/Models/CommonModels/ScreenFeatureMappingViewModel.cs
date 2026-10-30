using IQEApp.Service.SecurityService;
using IQEApp.Web.Models.Security;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace IQEApp.Web.Models.CommonModels
{
    public class ScreenFeatureMappingViewModel
    {
        public int ScnFetMapId { get; set; }
        //public int ScreenId { get; set; }
        //public int FeatureId { get; set; }
    }
    public static class SingletonScreenFeatureMapping
    {
        private static readonly ConcurrentDictionary<int, HashSet<int>> _rolePermissions = new ConcurrentDictionary<int, HashSet<int>>();

        public static void ClearScreenFeatureMapping()
        {
            _rolePermissions.Clear();
        }

        public static void ClearScreenFeatureMapping(int roleId)
        {
            _rolePermissions.TryRemove(roleId, out _);
        }

        public static void SetScreenFeatureMapping(int RoleId)
        {
            if (RoleId <= 0)
                return;

            try
            {
                ISecurityService _securityService = new SecurityService();
                SecurityBusinessModel objSecurityBusinessModel = new SecurityBusinessModel();
                var objSecFetMapId = objSecurityBusinessModel.FetchRoleBasedScreenFeatureMappingByRoleId(RoleId, _securityService);

                var permissionSet = new HashSet<int>();
                if (objSecFetMapId != null)
                {
                    foreach (var item in objSecFetMapId)
                    {
                        permissionSet.Add(item.ScnFetMapId);
                    }
                }
                _rolePermissions[RoleId] = permissionSet;
            }
            catch (Exception)
            {
                // Fail safely; do not throw unhandled exception
            }
        }

        public static bool CanPerformOperation(int SecFetMapId, int RoleId)
        {
            if (RoleId <= 0 || SecFetMapId <= 0)
                return false;

            try
            {
                if (!_rolePermissions.TryGetValue(RoleId, out var permissions) || permissions == null)
                {
                    SetScreenFeatureMapping(RoleId);
                    _rolePermissions.TryGetValue(RoleId, out permissions);
                }

                if (permissions != null && permissions.Contains(SecFetMapId))
                {
                    return true;
                }
            }
            catch (Exception)
            {
                return false;
            }

            return false;
        }
    }

    //public enum FeatureDataType
    //{
    //    Create = 1,
    //    Edit = 2,
    //    Delete = 3,
    //    Undo = 4
    //}
    //public enum ScreenDataType
    //{
    //    Menu=1,
    //    Home=2,
    //    Admin=3,
    //    Sales=4,
    //    Operations=5,
    //    Finance=6,
    //    QMS=7,
    //    Masters=8,
    //    Authorizations=9,
    //    HumanResource=10,
    //    Associates=11,
    //    Client=12,
    //    Enquries=13,
    //    ControlNo=14,
    //    CustomerComplaint=15,
    //    WorkOrders=16,
    //    Manufacturer=17,
    //    PurchaseOrder=18,
    //    ScheduleVisit=19,
    //    OpenCalls=20,
    //    LogSheet=21,
    //    SalesRegister=22,
    //    CreateInvoice=23,
    //    Creditors=24,
    //    Debtors=25,
    //    Documents=26,
    //    ServiceOrder = 27,
    //}

    //public enum ScnFetMapId
    //{
    //    MasterCreate = 1,
    //    MasterEdit = 2,
    //    MasterDelete = 3,
    //    MasterUndo = 4,
    //    EmployeeCreate = 5,
    //    EmployeeEdit = 6,
    //    EmployeeDelete = 7,
    //    EmployeeUndo = 8,
    //    AssociateCreate = 9,
    //    AssociateEdit = 10,
    //    AssociateDelete = 11,
    //    AssociateUndo = 12,
    //    ClientCreate = 13,
    //    ClientEdit = 14,
    //    ClientDelete = 15,
    //    ClientUndo = 16,
    //    EnquriesCreate=17,
    //    EnquriesEdit = 18,
    //    EnquriesDelete = 19,
    //    EnquriesUndo= 20,
    //    ServiceOrderCreate = 21,
    //    ServiceOrderEdit = 22,
    //    ServiceOrderDelete = 23,
    //    ServiceOrderUndo = 24,
    //    ControlNumbersCreate =25,
    //    ControlNumbersEdit=26,
    //    ControlNumbersDelete=27,
    //    ControlNumbersUndo=28,
    //    CustomerComplaintCreate=29,
    //    CustomerComplaintEdit=30,
    //    CustomerComplaintDelete=31,
    //    CustomerComplaintUndo=32,
    //    WorkOrdersCreate = 33,
    //    WorkOrdersEdit=34,
    //    WorkOrdersDelete=35,
    //    WorkOrdersUndo=36,
    //    ManufacturerCreate = 37,
    //    ManufacturerEdit = 38,
    //    ManufacturerDelete = 39,
    //    ManufacturerUndo = 40,
    //    PurchaseOrderCreate = 41,
    //    PurchaseOrderEdit = 42,
    //    PurchaseOrderDelete = 43,
    //    PurchaseOrderUndo = 44,
    //    ScheduleVisitCreate=45,
    //    ScheduleVisitEdit=46,
    //    ScheduleVisitDelete = 47,
    //    ScheduleVisitUndo = 48,
    //    OpencallsCreate=49,
    //    OpencallsEdit = 50,
    //    OpencallsDelete=51,
    //    OpencallsUndo=52,
    //    InvoiceCreate = 53,
    //    InvoiceEdit = 54,
    //    InvoiceUnFreeze = 55,
    //    InvoicePayments = 56,
    //    InvoiceCancel = 57,
    //    DocumentCreate = 58,
    //    DocumentsEdit = 59,
    //    DocumentPreview = 60,
    //    DocumentDownload = 61,
    //    AssignCreditNotes = 62,


    //    MenuHomeDirectory = 63,
    //    MenuAdminDirectory = 64,
    //    MenuSalesDirectory = 65,
    //    MenuOperationsDirectory = 66,
    //    MenuFinanceDirectory = 67,
    //    MenuQMSDirectory = 68,
    //    MenuDirectory=69
    //    //MenuAdministration = 1,
    //    //MenuHome = 2,
    //    //MenuMasters =3 ,
    //    //MenuSecurity = 19,
    //    //MenuEmpDirectory = 20,
    //    //MenuClientDirectory = 21,
    //    //MenuManufacturerDirectory = 22,
    //    //SalesRegisterCreate = 53,
    //    //SalesRegisterEdit=54,
    //    //SalesRegisterDelete=55

    //    //
    //    //
    //    //
    //    //
    //    //


    //    //MenuPurchaseOrderDirectory = 31,
    //    //MenuServiceOrderDirectory = 32,
    //    //ControlNumberCreate = 33,
    //    //ControlNumberEdit = 34,
    //    //ControlNumberDelete = 35,
    //    //ControlNumberUndo = 36,
    //    //MenuControlNumberDirectory = 37,
    //    //MenuVisitProcessingDirectory = 38,
    //    //ScheduleVisit = 39,
    //    //VisitScheduleEdit = 40,
    //    //QualityReview = 41,
    //    //FinanceReview = 42,
    //    //MenuInvoice = 43,
    //    //MenuDocument = 44,
    //    //EnquiryCreate = 54,
    //    //EnquiryEdit = 55,
    //    //MenuEnquiryDirectory = 56,
    //    //EnquiryDelete = 57,
    //    //EnquiryUndo = 58,

    //}

    public enum ScreenDataType
    {
        Employee = 1,
        Client = 2,
        Manufacturer = 3,
        PurchaseOrder = 4,
        ServiceOrder = 5,
        Visits = 6,
        InvoiceDetails = 7,
        Payments = 8,
        Enquiry = 9
    }

    //Uniquie ID values from mstScreenFeatureMapping


    public enum ScnFetMapId
    {
        MenuSecurity = 1,
        MenuHome = 2,
        MenuAdmin = 3,
        MenuSales = 4,
        MenuOperations = 5,
        MenuFinance = 6,
        MenuQMS = 7,
        AdminMasters=8,
        AdminHumanResource = 9,
        AdminAssociate=10,
        SalesClients = 11,
        SalesEnquiry = 12,
        SalesServiceOrder=13,
        SalesControlNumber = 14,
        SalesCustomerComplaint = 15,
        SalesWorkOrders = 16,
        OperationsManufacturers = 17,
        OperationsPurchaseOrders = 18,
        OperationsScheduleVisit = 19,
        OperationsOpenCalls = 20,
        OperationsLogSheet = 21,
        FinanceSalesRegister = 22,
        FinanceCreateInvocie = 23,
        FinanceCreditors = 24,
        FinanceDebtors = 25,
        QMSDocuments = 26,
        QualityReview = 27,
        FinanceReview = 28,
        Download = 29,
        InvoiceUnFreeze =30,
        InvoicePayments = 31,
        InvoiceCancel = 32,
        MastersCreate = 33,
        MastersEdit = 34,
        MastersInActive = 35,
        MastersActive = 36,
        HumanResourceCreate = 37,
        HumanResourceEdit = 38,
        HumanResourceInActive = 39,
        HumanResourceActive = 40,
        AssociatesCreate = 41,
        AssociatesEdit = 42,
        AssociatesInActive = 43,
        AssociatesActive = 44,
        ClientCreate = 45,
        ClientEdit = 46,
        ClientInActive = 47,
        ClientActive = 48,
        EnquiryCreate = 49,
        EnquiryEdit = 50,
        EnquiryInActive = 51,
        EnquiryActive = 52,
        ServiceOrderCreate = 53,
        ControlNumberEdit = 54,
        CustomerComplaintCreate = 55,
        CustomerComplaintEdit = 56,
        CustomerComplaintInActive = 57,
        CustomerComplaintActive = 58,
        ManufacturerCreate = 59,
        ManufacturerEdit = 60,
        ManufacturerInActive = 61,
        ManufacturerActive = 62,
        PurchaseOrderCreate = 63,
        PurchaseOrderEdit = 64,
        PurchaseOrderInActive = 65,
        PurchaseOrderActive = 66,
        ScheduleVisitCreate = 67,
        ScheduleVisitEdit = 68,
        OpenCallsEdit = 69,
        InvoiceCreate = 70,

        CreditiorsCreate = 71,
        CreditiorsEdit = 72,
        CreditiorsInActive = 73,
        CreditiorsActive = 74,
        DebtorsCreate = 75,
        DebtorsEdit = 76,
        DebtorsInActive = 77,
        DebtorsActive = 78,
        
        DocumentCreate =79,
        DocumentsEdit = 80,
        DocumentsInActive = 81,
        DocumentsActive = 82,
        DocumentDownload = 83,

        AdminData = 84,
        DataCreate =85,
        DataEdit=86,
        DataView = 87,
        DataDelete =88,
        AssignCreditNotes = 89,
        //AssignCreditNotes = 63,

        // SalesRegisterInvoiceEdit = 61,


        // MenuFinance=59,
        //MenuInvoice=59,
        //SalesRegisterUnFreeze=62,

        //SalesRegisterPayments =63,

        //SalesRegisterCancelInvoice =64,


        //CreateInvoiceCreate=66,



        //EmployeeCreate=10,
        // MenuSales = 19,
        //SalesClients=20,
        //MenuClientDirectory=20,

        //ClientUndo=24,
        //SalesEnquiry =25,

        // MenuServiceOrderDirectory=30,
        // SalesServiceOrder =30,
        //ServiceOrderEdit=31,
        //ServiceOrderDelete=31,
        //ServiceOrderUndo=31,
        //MenuControlNumberDirectory=32,

        //  MenuOperations = 40,
        // MenuManufacturerDirectory=40,


        //ManufacturerUndo=45,
        //MenuPurchaseOrderDirectory =46,


        //PurchaseOrderUndo=50,

        //MenuVisitProcessingDirectory=52,
        // VisitScheduleEdit=53,
        //OperationsOpenCalls =54,
        // OpenCallsQualityReview=56,

        // OpenCallsFinanceReview =57,




        // MenuQMS=77,

        //MenuDocument=78,


        //  DocumentPreview =83,







        //Menu = 1,
        //MenuHome = 2,
        //MenuAdmin = 3,
        //MenuSales = 4,
        //MenuOperations = 5,
        //MenuFinance = 6,
        //MenuQMS = 7,
        //HomeView = 8,
        //AdminMastersCreate = 9,
        //AdminMastersEdit = 10,
        //AdminMastersInActive = 11,
        //AdminMastersActive = 12,
        //AdminHumanResourceCreate = 13,
        //AdminHumanResourceEdit = 14,
        //AdminHumanResourceInActive = 15,
        //AdminHumanResourceActive = 16,
        //AdminAssociatesCreate = 17,
        //AdminAssociatesEdit = 18,
        //AdminAssociatesInActive = 19,
        //AdminAssociatesActive = 20,
        //SalesClientsCreate = 21,
        //SalesClientsEdit = 22,
        //SalesClientsInActive = 23,
        //SalesClientsActive = 24,
        //SalesEnquiryCreate = 25,
        //SalesEnquiryEdit = 26,
        //SalesEnquiryInActive = 27,
        //SalesEnquiryActive = 28,
        //SalesServiceOrderCreate = 29,
        //SalesControlNumberEdit = 30,
        //SalesCustomerComplaintCreate = 31,
        //SalesCustomerComplaintEdit = 32,
        //SalesCustomerComplaintInActive = 33,
        //SalesCustomerComplaintActive = 34,
        //OperationsManufacturerCreate = 35,
        //OperationsManufacturerEdit = 36,
        //OperationsManufacturerInActive = 37,
        //OperationsManufacturerActive = 38,
        //OperationsPOCreate = 39,
        //OperationsPOEdit = 40,
        //OperationsPOInActive = 41,
        //OperationsPOActive = 42,
        //OperationsScheduleVisitCreate = 43,
        //OperationsScheduleVisitEdit = 44,
        //OperationsScheduleQualityReview = 45,
        //OperationsScheduleFinanceReview = 46,
        //OperationsOpenCallsEdit = 47,
        //OperationsLogSheetView = 48,
        //FinanceSalesRegisterInvoiceDownlaod = 49,
        //FinanceSalesRegisterInvoiceUnFreeze = 50,
        //FinanceSalesRegisterInvoicePayments = 51,
        //FinanceSalesRegisterInvoiceCancel = 52,
        //FInanceCreateInvoiceCreate = 53,
        //FInanceDebtorsCreate = 54,
        //FInanceDebtorsEdit = 55,
        //FInanceDebtorsInActive = 56,
        //FInanceDebtorsActive = 57,
        //QMSDocumentCreate = 58,
        //QMSDocumentDownload = 59,
        //AdminAuthorizationsCreate = 60,
        //AdminAuthorizationsEdit = 61,
        //AdminAuthorizationsInActive = 62,
        //AdminAuthorizationsActive = 63,


        // MasterCreate = 1,
        //// MasterEdit = 2,
        // MasterDelete = 3,
        // MasterUndo = 4,
        // EmployeeCreate = 5,
        // EmployeeEdit = 6,
        // //ClientCreate = 7,
        // ClientEdit = 8,
        // ManufacturerCreate = 9,
        // ManufacturerEdit = 10,
        // EmployeeDelete = 11,
        // EmployeeUndo = 12,
        // MenuAdministration = 13,
        // MenuMasters = 14,
        // MenuSecurity = 15,
        // //MenuEmpDirectory = 16,
        // MenuClientDirectory = 17,
        // MenuManufacturerDirectory = 18,
        // ManufacturerDelete = 19,
        // ManufacturerUndo = 20,
        // ClientDelete = 21,
        // ClientUndo = 22,
        // PurchaseOrderCreate = 23,
        // PurchaseOrderEdit = 24,
        // PurchaseOrderDelete = 25,
        // PurchaseOrderUndo = 26,
        // ServiceOrderCreate = 27,
        // ServiceOrderEdit = 28,
        // ServiceOrderDelete = 29,
        // ServiceOrderUndo = 30,
        // MenuPurchaseOrderDirectory = 31,
        // MenuServiceOrderDirectory = 32,
        // ControlNumberCreate = 33,
        // ControlNumberEdit = 34,
        // ControlNumberDelete = 35,
        // ControlNumberUndo = 36,
        // MenuControlNumberDirectory = 37,
        // MenuVisitProcessingDirectory = 38,
        // ScheduleVisit = 39,
        // VisitScheduleEdit = 40,
        // QualityReview = 41,
        // FinanceReview = 42,
        // MenuInvoice = 43,
        // MenuDocument = 44,
        // InvoiceCreate = 45,
        // InvoiceEdit = 46,
        // InvoiceUnFreeze = 47,
        // InvoicePayments = 48,
        // InvoiceCancel = 49,
        // DocumentCreate = 50,
        // DocumentPreview = 51,
        // DocumentDownload = 52,
        // AssignCreditNotes = 53,
        // EnquiryCreate = 54,
        // EnquiryEdit = 55,
        // MenuEnquiryDirectory = 56,
        // EnquiryDelete = 57,
        // EnquiryUndo = 58,

    }

    //public enum ScnFetMapId
    //{
    //    MasterCreate = 1,
    //    MasterEdit = 2,
    //    MasterDelete = 3,
    //    MasterUndo = 4,
    //    EmployeeCreate = 5,
    //    EmployeeEdit = 6,
    //    ClientCreate = 7,
    //    ClientEdit = 8,
    //    ManufacturerCreate = 9,
    //    ManufacturerEdit = 10,
    //    EmployeeDelete = 11,
    //    EmployeeUndo = 12,
    //    MenuAdministration = 13,
    //    MenuMasters = 14,
    //    MenuSecurity = 15,
    //    MenuEmpDirectory = 16,
    //    MenuClientDirectory = 17,
    //    MenuManufacturerDirectory = 18,
    //    ManufacturerDelete = 19,
    //    ManufacturerUndo = 20,
    //    ClientDelete = 21,
    //    ClientUndo = 22,
    //    PurchaseOrderCreate = 23,
    //    PurchaseOrderEdit = 24,
    //    PurchaseOrderDelete = 25,
    //    PurchaseOrderUndo = 26,
    //    ServiceOrderCreate = 27,
    //    ServiceOrderEdit = 28,
    //    ServiceOrderDelete = 29,
    //    ServiceOrderUndo = 30,
    //    MenuPurchaseOrderDirectory = 31,
    //    MenuServiceOrderDirectory = 32,
    //    ControlNumberCreate = 33,
    //    ControlNumberEdit = 34,
    //    ControlNumberDelete = 35,
    //    ControlNumberUndo = 36,
    //    MenuControlNumberDirectory = 37,
    //    MenuVisitProcessingDirectory = 38,
    //    ScheduleVisit = 39,
    //    VisitScheduleEdit = 40,
    //    QualityReview = 41,
    //    FinanceReview = 42,
    //    MenuInvoice = 43,
    //    MenuDocument = 44,
    //    InvoiceCreate = 45,
    //    InvoiceEdit = 46,
    //    InvoiceUnFreeze = 47,
    //    InvoicePayments = 48,
    //    InvoiceCancel = 49,
    //    DocumentCreate = 50,
    //    DocumentPreview = 51,
    //    DocumentDownload = 52,
    //    AssignCreditNotes = 53,
    //    EnquiryCreate = 54,
    //    EnquiryEdit = 55,
    //    MenuEnquiryDirectory = 56,
    //    EnquiryDelete = 57,
    //    EnquiryUndo = 58,

    //}
}