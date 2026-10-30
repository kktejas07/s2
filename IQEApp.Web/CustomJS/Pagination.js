window.paginationObj = function () {
    var totalRecsCount = 0;
    var defaultPageSizeForListView = 10;
    var currentPageCount = 0;

    return {
        updateTotalRecords: function (count) {
            $("#TotalResultsEle").html(count);
        },
        getPageSize: function () {
            var size = parseInt(totalRecsCount);
            var pageSize = Math.ceil(size / defaultPageSizeForListView);
            console.log("page size" + pageSize);
            return pageSize;
        },
        setTotalPageCount: function (count) {
            //debugger;
            totalRecsCount = count;
            this.updateTotalRecords();
        },
        setCurrentPageCount: function (count) {
           // debugger;
            currentPageCount = count;
        },
        getCurrentPageCount: function () {
           // debugger;
            return currentPageCount;
        },
        setCalculatedCurrentPageCount: function (pageNo) {
            //before showing specific page data, we need to set the current page count to previous page, so that we get current page content
            currentPageCount = (defaultPageSizeForListView * (pageNo - 1));
        },
        CreateListGridPager: function (data) {
            console.log("creating pager ");

            //setTimeout(function(){
            if (data.backToFirstPage == true) {
                var pageSize = paginationObj.getPageSize();
                console.log("going to first page");
                $('.JsListGridPager').bootpag({ page: 1, total: pageSize == 0 ? 1 : pageSize, maxVisible: 5 });
            }

        }
    }
}();

function DefineListPagerForInitialLoad() {
   // console.log("total pages:" + window.paginationObj.getPageSize());
    setTimeout(function () {
        $('.JsListGridPager').bootpag({
            total: window.paginationObj.getPageSize(),
            page: 1,
            maxVisible: 5,
            leaps: true,
            firstLastUse: true,
            first: '<span aria-hidden="true">&larr;</span>',
            last: '<span aria-hidden="true">&rarr;</span>',
            wrapClass: 'pagination',
            activeClass: 'active',
            disabledClass: 'disabled',
            nextClass: 'next',
            prevClass: 'prev',
            lastClass: 'last',
            firstClass: 'first'
        }).on("page", function (event, num) {
            var bootPagObj = this;
            window.paginationObj.setCalculatedCurrentPageCount(num);
            window.ShowMore(function (status, newclass) {

            });
        });
    }, 0);
}

