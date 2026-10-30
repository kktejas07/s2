using DocumentFormat.OpenXml.Wordprocessing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace IQEApp.Web.Controllers
{
    public class TestController : Controller
    {
        // GET: Test
        public ActionResult Index()
        {
            List<TestModel> items = new List<TestModel>
            {
                new TestModel { Id=1, Name="Hari", Email="Hari@gmail.com" },
                new TestModel { Id=2, Name="Krishna", Email="Krishna@gmail.com" },
                new TestModel { Id=3, Name="Reddy", Email="Reddy@gmail.com" }
             };
            return View(items);
        }
    }

    public class TestModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }
}