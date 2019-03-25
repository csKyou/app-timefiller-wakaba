// 1ページの表示件数
PAGE_DISP_NUM = 10;

nowPage = 1;

function getEventList(paramObj) {
	let urlOData = Common.getBoxUrl() + 'OData/Events';
	//let urlOData = "https://app-timefiller-wakaba.demo.personium.io/__/" + 'OData/Events';
	let query = {
		"$top": 1000,
		"$orderby": "startDate asc, endDate desc"
	}
	let queryStr = $.param(query);
	let queryUrl = urlOData + "?" + queryStr;
	getAPI(queryUrl, Common.getToken()).done(function(odataObj) {
		if ((typeof paramObj.callback !== "undefined") && $.isFunction(paramObj.callback)) {
      		paramObj.callback(odataObj);
  		}
  	}).fail(function(e) {
    	console.log(e);
  	})
}