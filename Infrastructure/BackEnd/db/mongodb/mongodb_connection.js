/*
 * Created by Strawmanbobi
 * 2014-09-22
 */

require('../../configuration/constants');
var mongoose = require('mongoose');
var logger = require('../../logging/logger4js').helper;

exports.setMongoDBParameter = function(dbHost, dbName, dbUser, dbPassword) {
    var dbURI = "mongodb://" + dbHost + "/" + dbName;
    mongoose.connect(dbURI);
    exports.mongoDB = mongoose.Schema;
};

exports.define = function(schemaName, schemaObj) {
    return mongoose.model(schemaName, schemaObj);
};