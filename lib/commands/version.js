var app = require('../app');



/**
 * Prints the version of SpeedDial as found in the package.json file
 */
var version = module.exports = function() {
  "use strict";
  
  app.log.info(require('../../package.json').version);
};