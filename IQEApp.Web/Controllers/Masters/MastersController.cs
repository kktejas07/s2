using IQEApp.Service.MasterService;
using IQEApp.Web.Controllers.Common;
using IQEApp.Web.Models.CommonModels;
using IQEApp.Web.Models.MasteModel;
using System;
using System.Linq;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers.Masters
{
    // [CustomAuthorize(Roles = "Super Admin Role, Admin Role, Technician Role, Coordinator Role, Quality Check Role, Finance Role")]
    public class MastersController : BaseController
    {
        private readonly IMasterService _masterService;
        MasterBusinessModel objMasterBusinessModel = new MasterBusinessModel();

        public MastersController()
        {
            _masterService = new MasterService();
        }
        // GET: /Masters/
        public ActionResult Index()
        {
            if (SingletonScreenFeatureMapping.CanPerformOperation((int)ScnFetMapId.AdminMasters, CurrentUser.RoleId.FirstOrDefault()))
            {
                return View("MasterPage");
            }
            else
            {
                return View("UnAuthorized");
            }
            return null;
        }

        public ActionResult GetMastersDetails(int mstSectionId, bool isActive, string sectionName)
        {
            try
            {
                objMasterBusinessModel.GetMastersDetails(CurrentUser.SiteId, mstSectionId, sectionName, isActive, _masterService);
                return PartialView("_mstMasterDetails", objMasterBusinessModel);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("GetMastersDetails", ex);
            }
            return null;
        }
        [HttpPost]
        public ActionResult CreateMaster(MasterViewModel objUserViewModel)
        {
            var isSuccess = false;
            var statusMsg = "";
            try
            {
                // need to valiadate, enter value exisits or not in DB, if not then save else return message
                objUserViewModel.LoginUserId = CurrentUser.UserId;
                objUserViewModel.SiteId = CurrentUser.SiteId;
                if (!objMasterBusinessModel.IsMasterRecordExitsAlready(CurrentUser.SiteId, objUserViewModel.SectionId,
                    objUserViewModel.MasterId, objUserViewModel.MasterName, _masterService))
                {
                    objMasterBusinessModel.CreateMaster(objUserViewModel, _masterService);
                    isSuccess = true;
                    statusMsg = "Success";
                }
                else
                    statusMsg = "DuplicateRecord";
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("CreateMaster", ex);
                statusMsg = "error";
            }
            return Json(new { status = isSuccess, message = statusMsg }, JsonRequestBehavior.AllowGet);
        }
        [HttpPost]
        public ActionResult EditMasterDetails(int sectionId, int masterId, string sectionName)
        {
            try
            {
                objMasterBusinessModel.GetMasterDetailsById(CurrentUser.SiteId, sectionId, masterId, sectionName, _masterService);
                return PartialView("_EditMaster", objMasterBusinessModel.objMasterViewModel);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("EditMasterDetails", ex);
            }
            return null;
        }
        [HttpPost]
        public ActionResult UpdateMaster(MasterViewModel objUserViewModel)
        {
            var isSuccess = false;
            var statusMsg = "";
            try
            {
                // need to valiadate, enter value exisits or not in DB, if not then save else return message
                objUserViewModel.LoginUserId = CurrentUser.UserId;

                if (!objMasterBusinessModel.IsMasterRecordExitsAlready(CurrentUser.SiteId, objUserViewModel.SectionId,
                    objUserViewModel.MasterId, objUserViewModel.MasterName, _masterService))
                {
                    objMasterBusinessModel.UpdateMaster(objUserViewModel, _masterService);
                    isSuccess = true;
                    statusMsg = "Success";
                }
                else
                    statusMsg = "DuplicateRecord";
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("UpdateMaster", ex);
            }
            return Json(new { status = isSuccess, message = statusMsg }, JsonRequestBehavior.AllowGet);
        }
        [HttpPost]
        public ActionResult DeleteOrUndoMasterDetails(int sectionId, int masterId, bool status)
        {
            try
            {
                _masterService.DeleteOrUndoMasterDetails(sectionId, masterId, status, CurrentUser.UserId);
            }
            catch (Exception ex)
            {
                errorLogObj.LogError("DeleteOrUndoMasterDetails", ex);
            }
            return null;
        }
    }
}


// Validation of data before save or edit weather data is already existing or not
// in undo, we need to change the prompt message as do u want to undo the selected record

