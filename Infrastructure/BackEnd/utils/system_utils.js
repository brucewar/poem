/*
 * Created by Strawmanbobi
 * 2015-03-02
 */

var dateUtils = require('./date_utils');

function startup(expressApp, port, serverName) {
    if(expressApp && expressApp.listen && typeof(expressApp.listen) == "function") {
        expressApp.listen(port);

        console.log(serverName +' restful webservice server is listening at port : ' +
        port + " //" +  dateUtils.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss"));
        console.log("driven by " + ICODE + " <(￣︶￣)>");
    }
}
exports.startup = startup;