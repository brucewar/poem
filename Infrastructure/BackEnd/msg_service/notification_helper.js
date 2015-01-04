/**
 * Created by Strawmanbobi
 * 2014-08-31
 */

require('../configuration/constants');
var ErrorCode = require('../configuration/error_code');
var Enums = require('../configuration/enums');

var ciphering = require('../security/md5');
var stringUtils = require('../utils/string_utils');
var Map = require('../mem/map');
var querystring = require('querystring');
var apn = require('apn');
var http = require('http');

var logger = require('../logging/logger4js').helper;

var JPush = require("../libs/JPush/JPush.js");
var client = JPush.buildClient(JPUSH_APP_KEY, JPUSH_APP_MASTER_SECRET);

var errorCode = new ErrorCode();
var enums = new Enums();

// global parameters
var gMessageTTL = 60 * 10;

/**
 * Push message via JPUSH
 * @param conversationID
 * @param conversationChannel
 * @param pushType
 * @param deviceTypes
 * @param message
 * @param callback
 */
exports.pushMessageViaJPush = function (conversationID, pushType, deviceTypes,
                                 message, callback) {
    logger.debug("converID = " + conversationID + ", pushType = " + pushType + ", deviceType = " + deviceTypes + ", message = " + message);

    var devices = null;
    var audience = null;

    // set target platform
    if(enums.JPUSH_DEVICE_TYPE_ANDROID == deviceTypes) {
        devices = 'android';
    } else if(enums.JPUSH_DEVICE_TYPE_IOS == deviceTypes) {
        devices = 'ios';
    } else if(enums.JPUSH_DEVICE_TYPE_BOTH == deviceTypes) {
        devices = JPush.ALL;
    } else {
        logger.error("Wrong push device types required");
        callback(errorCode.WRONG_PUSH_DEVICE);
    }

    // set audience
    if(enums.JPUSH_TYPE_BROADCAST == pushType) {
        audience = JPush.ALL;
    } else if(enums.JPUSH_TYPE_PEER == pushType) {
        audience = JPush.registration_id(conversationID);
    } else {
        logger.error("Wrong push audience required");
        callback(errorCode.WRONG_PUSH_TYPE);
    }

    logger.debug("devices: " + devices + ", audience: " + audience);

    client.push().setPlatform(devices)
        .setAudience(audience)
        .setMessage(message)
        .setOptions(null, gMessageTTL)
        .send(function(err, res) {
            if (err) {
                logger.error("failed to send message via JPush, error = " + err.message);
                callback(errorCode.FAILED);
            } else {
                logger.info("succeeded to send message via JPush, sendNo = " + res.sendno +
                    ", messageID = " + res.msg_id);
                callback(errorCode.SUCCESS);
            }
        });
};

/**
 * Push message via Baidu Channel API
 * @param conversationID
 * @param conversationChannel
 * @param deviceType
 * @param messageType
 * @param pushType
 * @param messageTitle
 * @param messageDescription
 * @param callback
 * spec: exception handler needed
 */
exports.pushViaBaiduChannelAPI = function (conversationID, conversationChannel, deviceType, messageType, pushType,
                                           messageTitle, messageDescription, callback) {
    var messageBody = "";

    // adjust parameters
    // TODO: to fix the URIEncode issue
    if(enums.BC_API_MESSAGE_TYPE_MESSAGE == messageType) {
        messageBody = encodeURI(messageDescription);
    } else if(enums.BC_API_MESSAGE_TYPE_NOTIFICATION == messageType) {
        messageBody = "{\"title\":\"" + messageTitle + "\",\"description\":\"" + messageDescription + "\"}";
    } else {
        throw "Wrong Message Type";
    }

    if(enums.BC_API_PUSH_TYPE_PEER && (null == conversationID || null == conversationChannel)) {
        throw "Wrong Conversation ID or Channel";
    }

    // prepare parameter map and base URL
    var parameterMap = new Map();
    var baiduChannelAPIPushMsgURL = BAIDU_CLOUD_CHANNEL_API_PUSH_MSG_URL;

    // fill parameters according to BAIDU CHANNEL API Spec
    parameterMap.put("apikey", BAIDU_CLOUD_API_KEY);
    parameterMap.put("method", "push_msg");
    parameterMap.put("channel_id", conversationChannel);
    parameterMap.put("user_id", conversationID);
    parameterMap.put("device_type", deviceType);
    var timeStamp = Math.round(new Date().getTime() / 1000);
    parameterMap.put("timestamp", timeStamp);
    parameterMap.put("messages", messageBody);
    parameterMap.put("message_type", messageType);
    parameterMap.put("push_type", pushType);
    parameterMap.put("msg_keys", utils.randomChar(16));

    // sort parameters and sign
    parameterMap.sortByKey('A');
    var signPlainText = "POSThttp://" + BAIDU_CLOUD_CHANNEL_API_HOST + BAIDU_CLOUD_CHANNEL_API_PUSH_MSG_URL;
    var parameterArray = parameterMap.getArray();
    for (var i = 0; i < parameterArray.length; i++) {
        signPlainText += parameterArray[i].key + "=" + parameterArray[i].value;
    }
    signPlainText += BAIDU_CLOUD_SECRET_KEY;
    // logger.debug("plain text of sign string = " + signPlainText);

    var signText = ciphering.MD5(encodeURIComponent(signPlainText));
    // logger.debug(signText);

    // construct final URL string
    for (var i = 0; i < parameterArray.length; i++) {
        if (0 == i) {
            baiduChannelAPIPushMsgURL += "?";
        } else {
            baiduChannelAPIPushMsgURL += "&";
        }
        baiduChannelAPIPushMsgURL += parameterArray[i].key + "=" + parameterArray[i].value;
    }

    baiduChannelAPIPushMsgURL += "&sign=" + signText;
    // logger.debug("baidu push url = " + baiduChannelAPIPushMsgURL);

    var postData = querystring.stringify({
    });

    var androidPushOptions = {
        host: BAIDU_CLOUD_CHANNEL_API_HOST,
        port: BAIDU_CLOUD_CHANNEL_API_PORT,
        path: baiduChannelAPIPushMsgURL,
        method: 'POST',
        headers: {
            'Content-Length': postData.length
        }
    };

    var req = http.request(androidPushOptions, function (res) {
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            if ('200' == res.statusCode) {
                logger.debug("baidu push request successfully made");
                callback(errorCode.SUCCESS);
            } else {
                logger.debug('baidu push request failed, status code = ' + res.statusCode + " error detail = " + data);
                callback(errorCode.FAILED);
            }
        });
    });

    try {
        req.write(postData);
        req.end();
    } catch(e) {
        logger.error("exception occurred while making HTTP request : " + e);
        req.end();
        callback(errorCode.FAILED);
    }
};

/**
 * Push message to IOS devices via Apple official APN
 * @param deviceToken
 * @param expiry
 * @param alert
 * @param sound
 * @param payload
 * @param callback
 * spec: exception handler needed
 */
exports.pushViaAppleAPN = function(deviceToken, expiry, alert, sound, payload, callback) {
    var options = null;
    if(enums.APP_PRODUCTION_MODE == ENV) {
        option = {
            "cert": "./certs/push_cert_production.pem",
            "key": "./certs/push_key_production.pem",
            "gateway": "gateway.sandbox.push.apple.com",
            "port": APN_PUSH_PORT
        };
    } else if(enums.APP_DEVELOPMENT_MODE == ENV) {
        options = {
            "cert": "./certs/push_cert_dev.pem",
            "key": "./certs/push_key_dev.pem",
            "gateway": "gateway.sandbox.push.apple.com",
            "port": APN_PUSH_PORT
        };
    } else {
        throw "Wrong ENV";
    }
    var apnConnection = new apn.Connection(options),
        device = new apn.Device(deviceToken),
        note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + (3600 | expiry);
    note.badge = 3;
    note.alert = alert;
    note.sound = 'default' | sound;
    note.payload = payload;
    note.device = device;

    apnConnection.pushNotification(note, device);

    if(callback) {
        callback(option, note, device);
    }
};