var storage = require('../storage'),
    app     = require('../app'),
    util    = require('utile'),
    _       = require('lodash');



/**
 * Displays the currently active group if no group is passed.
 * Sets the passed group as the newly 'current' one.
 */
var group = module.exports = function(group, callback) {
  "use strict";
  
  // The currently active group should be printed
  if (!_.isString(group)) {
    return app.log.info(util.format('The %s is %s', 'active group'.yellow.bold, app.config.get('currentGroup').yellow.bold));
  }


  // A new group is being made active

  // Validate
  storage.get(['groups'], function(data) {
    if (_.isUndefined(data[group])) {
      return callback(new Error(util.format('%s is not a valid %s', group.yellow.bold, 'group name'.yellow.bold)));
    }
  });



  // Save the newly active gropu
  app.config.set('currentGroup', group);

  app.config.save(function(){
    app.log.info(util.format('The %s is now %s', 'active group'.yellow.bold, app.config.get('currentGroup').yellow.bold));
  });
};