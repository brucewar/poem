/**
 * Created by Strawmanbobi
 * 2014-08-31
 */

var later = require("later");
var logger = require('../logging/logger4js').helper;
var Enums = require("../configuration/enums");
var ErrorCode = require("../configuration/error_code");

var enums = new Enums();
var errorCode = new ErrorCode();

exports.scheduleTask = function(textMode, text, scheduleMode, next, description, timeoutCallback) {
    var sched = null;
    var timer = null;
    later.date.localTime();
    switch(textMode) {
        case enums.SCHEDULE_TEXT_TEXT:
            logger.debug("text = " + text);
            sched = later.parse.text(text);
            break;
        case enums.SCHEDULE_TEXT_CRON:
            sched = later.parse.cron(text);
            break;
        default:
            logger.debug("wrong text mode");
            return errorCode.FAILED;
            break;
    }
    if(sched) {
        switch(scheduleMode) {
            case enums.SCHEDULE_DELAY:
                timer = later.setTimeout(function() { timeoutCallback(timer); }, sched);
                logger.debug("scheduler working in delay mode : " + text);
                break;
            case enums.SCHEDULE_INTERVAL:
                timer = later.setInterval(function() { timeoutCallback(timer); }, sched);
                logger.debug("scheduler working in interval mode : " + text);
                break;
            default:
                logger.debug("scheduler error");
                return errorCode.FAILED;
                break;
        }
        if(timer) {
            logger.debug("task " + description + " scheduled");
            return errorCode.SUCCESS;
        } else {
            logger.debug("execute " + description + " error");
            return errorCode.SCHEDULER_ERROR;
        }
    } else {
        logger.debug("parse scheduler " + description + " error");
        return errorCode.SCHEDULER_ERROR;
    }
};