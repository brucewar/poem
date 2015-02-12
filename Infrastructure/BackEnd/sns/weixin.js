/**
 * Created by strawmanbobi on 2014-11-12.
 */

var crypto = require('crypto');
var Map = require('../mem/map.js');
var RequestSender = require('../http/request.js');
var ErrorCode = require('../configuration/error_code.js');
var errorCode = new ErrorCode();

var logger = require('../logging/logger4js').helper;

var WEIXIN_API_SERVER = "api.weixin.qq.com";
var WEIXIN_API_PORT = "443";

var WEIXIN_API_FETCH_ACCESS_TOKEN = "/sns/oauth2/access_token";
var WEIXIN_API_FETCH_USER_INFO = "/sns/userinfo";

var Weixin = function(_appID, _appSecret, _accessToken) {
    this.appID = _appID;
    this.appSecret = _appSecret;
    this.accessToken = _accessToken;
};

Weixin.prototype.accessValidate = function(signature, timestamp, nonce, callback) {
    if(this.checkSource(signature, timestamp, nonce)) {
        callback(errorCode.SNS_WEIXIN_VALIDATION_SUCCESS);
    } else {
        callback(errorCode.SNS_WEIXIN_VALIDATION_FAILED);
    }
};

Weixin.prototype.processUserMsg = function(message, callback) {
    // TODO:
    callback(errorCode.SUCCESS, "");
};

Weixin.prototype.fetchAccessToken = function(code, callback) {
    var queryParams = new Map();
    queryParams.put("appid", this.appID);
    queryParams.put("secret", this.appSecret);
    queryParams.put("code", code);
    queryParams.put("grant_type", "authorization_code");
    var requestSender = new RequestSender(WEIXIN_API_SERVER, WEIXIN_API_PORT, WEIXIN_API_FETCH_ACCESS_TOKEN, queryParams);

    var options = {
        https: true
    };
    requestSender.sendGetRequest(options, function(error, data) {
        if(errorCode.FAILED == error) {
            logger.error("failed to  get weixin access token");
            callback(error, null);
        } else {
            if(data.errcode) {
                logger.error("weixin access token got error, please check the cause : " + data.errcode);
                callback(errorCode.FAILED, null);
            } else {
                logger.info("weixin access token got : " + data);
                callback(errorCode.SUCCESS, data);
            }
        }
    });
};

Weixin.prototype.fetchUserInfo = function(accessToken, openID, callback) {
    var queryParams = new Map();
    queryParams.put("access_token", accessToken);
    queryParams.put("openid", openID);
    queryParams.put("lang", "zh_CN");
    var requestSender = new RequestSender(WEIXIN_API_SERVER, WEIXIN_API_PORT, WEIXIN_API_FETCH_USER_INFO, queryParams);

    var options = {
        https: true
    };
    requestSender.sendGetRequest(options, function(error, data) {
        if(errorCode.FAILED == error) {
            logger.error("failed to  get weixin user info");
            callback(error, null);
        } else {
            if(data.errcode) {
                logger.error("weixin user info got error, please check the cause : " + data.errcode);
                callback(errorCode.FAILED, null);
            } else {
                logger.info("weixin user info got : " + data);
                callback(errorCode.SUCCESS, data);
            }
        }
    });
};

Weixin.prototype.checkSource = function (signature, timestamp, nonce) {
    var shasum = crypto.createHash('sha1'),
        arr = [this.accessToken, timestamp, nonce];
    shasum.update(arr.sort().join(''),'utf-8');
    return shasum.digest('hex') == signature;
};

module.exports = Weixin;
