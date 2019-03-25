// Login
function(request){
    try {
        personium.validateRequestMethod(["POST"], request);

        var params = personium.parseBodyAsQuery(request);
        // verify parameter information
        personium.setAllowedKeys(['eventId', 'cellUrl']);
        personium.setRequiredKeys(['eventId', 'cellUrl']);
        personium.validateKeys(params);

        // 
        var cell = dc.as(accInfo.APP_CELL_ADMIN_INFO).cell();
        var odata = cell.box().odata('OData');
        var odataEntity = odata.entitySet('EventList');

        // uuid取得
        uuidRes = odataEntity.query().filter("event_id eq '" + params.eventId + "' and cellUrl eq '" + params.cellUrl + "'").select('__id').run().d.results;
        var uuid = null;
        if (uuidRes.length != 0) {
            uuid = uuidRes[0].__id;
        }

        //
        var propList = {};
        propList['event_id'] = params.eventId;
        propList['cellUrl'] = params.cellUrl; 
        if (uuid) {
            // edit
            odataEntity.merge(
                uuid,
                propList,
                "*"
            );
        } else {
            // create
            odataEntity.create(propList);
        }
        
        return personium.createResponse(200, "success");
    } catch (e) {
        return personium.createErrorResponse(e);
    }
}

var personium = require("personium").personium;
var accInfo = require("acc_info").accInfo;