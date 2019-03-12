function getRecommendList(nowDate, callback) {
  let urlOData = APP_URL + "__/OData/Events";
  let startMoment = moment(nowDate).startOf("day").add(8,"hour");
  let endMoment = moment(nowDate).endOf("day");
  let query = {
    "$top": 1000,
    "$filter": "start ge datetimeoffset'"+startMoment.toISOString()+"' and end le datetimeoffset'"+endMoment.toISOString()+"'",
    "$orderby": "start asc, end desc"
  }
  
  let queryStr = $.param(query);
  let queryUrl = urlOData + "?" + queryStr;
  // プラン一覧と検討中一覧を取得
  $.when(
    getAPI(queryUrl, Common.getToken()),
    getPlanningAPI()
  ).done(function(planObj, planningObj) {
    let planList = planObj[0].d.results;
    let planningList = planningObj[0].d.results;
    // 該当日の検討中/参加済みのプラン一覧
    let todayPlanningList = [];
    // 取得した一覧をマージする
    _.each(planList, function(plan, i, list) {
      plan.type = "event";
      _.every(planningList, function(planning) {
        if (plan.__id == planning.event_id) {
          plan.planStatus = planning.planStatus;
          todayPlanningList.push(plan);
          return false;
        }
        return true;
      })
    })

    // reccomendイベントの作成(検討/参加)
    let recommendSchedule = [];
    recommendSchedule.push({
        "type": "home",
        "planStatus": "confirm",
        "title": "自宅",
        "startDate": startMoment.toISOString(),
        "endDate": moment(startMoment).add(30, "minutes").toISOString()
    });
    let tempEnd = moment(startMoment).add(30, "minutes");
    recommendSchedule = setRecommendSchedule(recommendSchedule, todayPlanningList);
    recommendSchedule = setRecommendSchedule(recommendSchedule, planList);
    let lastHomeEndMoment = moment(recommendSchedule[recommendSchedule.length - 1].endDate);
    recommendSchedule.push(getMove());
    recommendSchedule.push({
        "type": "home",
        "planStatus": "confirm",
        "title": "自宅",
        "startDate": lastHomeEndMoment.add(30, "minutes").toISOString()
    });

    if ((typeof callback !== "undefined") && $.isFunction(callback)) {
      callback(recommendSchedule);
    }
  }).fail(function(e) {
    console.log(e);
  })
}

function setRecommendSchedule(resultList, list) {
  let result = resultList;
  _.each(list, function(plan, i, p_list) {
    let grepList = $.grep(result, function(elem, index){return (elem.__id == plan.__id)});
    if (grepList.length <= 0) {
      let planStartMoment = moment(plan.startDate);
      let planEndMoment = moment(plan.endDate).add(30, "minutes");
      let tempPrevCnt = 0;
      let tempPrevRes = null;
      let resCnt = 0;
      let pushCnt = -1;
      let skipFlg = false;
      _.every(result, function(res) {
        if (res.endDate) {
          let resStartMoment = moment(res.startDate);
          if (resStartMoment.isSameOrAfter(planEndMoment)) {
            if (tempPrevRes) {
              let prevResEndMoment = moment(tempPrevRes.endDate).add(30, "minutes");
              if (prevResEndMoment.isSameOrBefore(planStartMoment)) {
                pushCnt = resCnt;
              } else {
                skipFlg = true;
              }
            } else {
              pushCnt = resCnt;
            }
            return false;
          }
  
          tempPrevCnt = resCnt;
          tempPrevRes = res;
        }
        resCnt++;    
        return true;
      })
      if (!skipFlg) {
        if (pushCnt >= 0) {
          result.splice(pushCnt-1, 0, plan);
          result.splice(pushCnt-1, 0, getMove());
        } else if (tempPrevRes && moment(tempPrevRes.endDate).add(30, "minutes").isSameOrBefore(planStartMoment)) {
          result.push(getMove());
          result.push(plan);
        }
      }
    }
  })

  return result;
}

function getMove() {
  return {
    "type": "transportation",
    "title": "移動",
    "distance": "約300M"
  };
}