var support  = require('../support'),
    storage  = require('../storage'),
    app      = require('../../app'),
    fs       = require('fs'),
    util     = require('utile'),
    _        = require('lodash'),
    appTitle = require('../../package.json').title;



/**
 * Adds a new entry to SpeedDial. Expects a path a path.
 * The entry will be appended to the current group if none is specified.
 * The entry doesn't require an alias.
 */
var add = module.exports = function(dir, alias, callback) {
  // Initialize
  var groupName = app.argv.group  || app.config.get('currentGroup'),
      weight    = app.argv.weight || 0,
      entry     = { weight: weight, path: support.normalizePath(dir) },
      group, existing, listings;


  // Validate
  if (_.isString(alias) && !/^[a-zA-Z][a-zA-Z0-9\-\_]+$/.test(alias)) {
    return callback(new Error(util.format('%s cannot be used as an entry alias. Aliases must start with a letter and only contain letters, numbers, underscores, and hyphens.', alias.yellow.bold)));
  }

  if (!_.isString(dir)) {
    return callback(new Error(util.format('A directory path must be provided to add an entry to %s', appTitle.blue.bold)));
  }

  if (!fs.existsSync(entry.path)) {
    return callback(new Error(util.format('%s does not appear to be a valid directory path', entry.path.yellow.bold)));
  } else {
    if (!fs.statSync(entry.path).isDirectory()) {
      return callback(new Error(util.format('%s is a file path. %s only works with directories.', entry.path.yellow.bold, appTitle.blue.bold)));
    }
  }

  if (_.contains(['listings'], groupName)) {
    return callback(new Error(util.format('%s cannot be used as a group name because it is a reserved word within %s', groupName.yellow.bold, appTitle.blue.bold)));
  }

  if (/^\d/.test(groupName)) {
    return callback(new Error(util.format('%s cannot be used as a group name because it starts with a number', groupName.yellow.bold)));
  }



  // Fetch the group data from the JSON storage
  storage.get(['groups', groupName], function(val) {
    group = val || []; // initialize the group if necessary
  });



  // More alias validation
  if (_.isString(alias)) {
    if (existing = _.find(group, function(entry){ return entry.alias === alias; })) {
      return callback(new Error(util.format('The %s alias already exists in the %s entry group for path %s', alias.yellow.bold, groupName.yellow.bold, existing.path.yellow.bold)));
    }

    storage.get(['listings'], function(val){
      listings = val || []; // initialize the listings if necessary
    });

    if (existing = _.find(listings, function(listing){ return listing.alias === alias; })) {
      return callback(new Error(util.format('The %s alias already exists for the listing with path %s. Listing aliases must remain globally unique.', alias.yellow.bold, existing.path.yellow.bold)));
    }


    // Append the alias to the entry
    entry.alias = alias;
  }

  

  // Save the entry
  group.push(entry);

  storage.set(['groups', groupName], group, function() {
    storage.save(function(err) {
      if (err) {
        return callback(err);
      }

      app.log.info(util.format('The path %s has been added to the %s entry group %s', entry.path.yellow.bold, groupName.yellow.bold, (_.has(entry, 'alias')) ? util.format("with alias %s", entry.alias.yellow.bold) : util.format("with no alias")));
    });
  });
};