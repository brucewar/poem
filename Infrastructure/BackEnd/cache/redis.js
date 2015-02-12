/**
 * Created by strawmanbobi
 * 2014-12-02.
 */

require('../configuration/constants');
var ErrorCode = require('../configuration/error_code');
var Enums = require('../configuration/enums');
var BaseCache = require('./base_cache.js')

var AliOCS = require('aliyun-sdk').MEMCACHED;
var logger = require('../logging/logger4js').helper;

var errorCode = new ErrorCode();
var enums = new Enums();

var Cache = function(_host, _port, _user, _password) {
    // TODO: implemented redis connector
};

Cache.prototype = Object.create(BaseCache.prototype);

Cache.prototype.set = function(key, value, ttl, callback) {
    callback(errorCode.SUCCESS);
};

Cache.prototype.get = function(key, callback) {
    callback(errorCode.SUCCESS, null);
};

Cache.prototype.delete = function(key, callback) {
    callback(errorCode.SUCCESS);
};

module.exports = Cache;