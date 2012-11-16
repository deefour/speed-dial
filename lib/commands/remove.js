var support     = require('../support'),
    storage     = require('../storage'),
    app         = require('../app'),
    _           = require('lodash'),
    list        = require('./list'),
    util        = require('utile'),
    changeGroup = require('./group');



/**
 * Lists all entries & listings, and prompts the user
 * for the index/ID # of the entry or listing to delete
 * from storage
 */
var remove = module.exports = function(callback) {
  "use strict";
  
  // Initialize
  var key  = 'Entry/Listing ID',
      notifyDeletion = function(deleteObj, options) {
        options = _.extend({ dryRun: true }, options || {});
        var confirmation = 'You are about to delete ID ';

        if (!options.dryRun) {
          confirmation = 'ID ';          
        }

        confirmation += deleteObj.id.toString().yellow.bold + ', the';

        if (_.isUndefined(deleteObj.groupName)) {
          confirmation += ' listing'.yellow.bold;
        } else {
          confirmation += ' group entry'.yellow.bold;
          confirmation += ' from group ' + deleteObj.groupName.yellow.bold;
        }

        confirmation += ' with path ' + deleteObj.entry.path.yellow.bold;

        if (_.isString(deleteObj.entry.alias)) {
          confirmation += ' and alias ' + deleteObj.entry.alias.yellow.bold;
        }

        if (!options.dryRun) {
          confirmation += ' has been';
          confirmation += ' deleted'.red.bold;
          confirmation += ' successfully';
          app.log.info(confirmation);
        } else {
          app.log.warn(confirmation);
        }
      };



  // List the entries/listing with single index
  list({ 
    'exit-if-empty': true,
    'empty-message': 'there is nothing to delete',
    'single-listing': true
  });



  // Ask for the index to delete
  app.prompt.get([{
    name: key,
    required: true,
    pattern: /\d+/,
    message: key.bold.grey + ' must match an id for an entery or listing above',
    conform: function(id){
      return support.hasEntry(id);
    }
  }], function(err, result) { 
    if (err) {
      throw err;
    }

    var id            = result[key],
        deleteObj     = support.withEntry(id),
        confirmation  = notifyDeletion(deleteObj);

    // Confirm the deletion
    app.prompt.get(['yesno'], function(err, result) {
      if (err) {
        return callback(err);
      }

      // Do the deletion
      if (/^y/i.test(result.yesno)) {
        support.withEntry(id, function(result) {
          var groupTarget = result.dataTarget.slice(0, 2);
          storage.del(result.dataTarget, function(){
            storage.save(function(err) {
              if (err) {
                return callback(err);
              }

              // For user-created groups, if this just-deleted entry was the last one, delete the group too
              if (!support.hasEntry(result.groupName) && result.groupName !== 'default') {
                storage.del(groupTarget, function(){
                  storage.save(function(err) {
                    if (err) {
                      return callback(err);
                    }

                    if (result.groupName === app.config.get('currentGroup')) {
                      app.log.warn(util.format('%s was the currently active group. No entries exist for this group anymore, so the group has been %s', result.groupName.yellow.bold, 'deleted'.red.bold));
                      changeGroup('default');
                    }
                  });
                });
              }

              notifyDeletion(deleteObj, { dryRun: false });
            });
          });
        });
      }
    });
  });
};
