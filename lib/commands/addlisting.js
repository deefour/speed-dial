var storage = require('../storage'),
    app     = require('../../app'),
    util    = require('utile'),
    _       = require('lodash');



/**
 * Adds a new listing to the storage. Expects a path and an alias.
 */
var addlisting = module.exports = function(path, alias, callback) {
  // Initialize
  var weight    = app.argv.weight || 0,
      listing   = { path: path, alias: alias, weight: weight },
      listings, existing, entries;
  


  // Fetch the listings data from the JSON storage
  storage.get('listings', function(val) {
    listings = val || []; // Initialize the listings if necessary
  });



  // Validate
  if (existing = _.find(listings, function(listing){ return listing.alias === alias; })) {
    return callback(new Error(util.format('The %s alias already exists for the listing with path %s. Listing aliases must remain globally unique.', alias.yellow.bold, existing.path.yellow.bold)));
  }

  // Fetch the groups data from the JSON storage
  storage.get(['groups'], function(val){
    entries = val || {};
  });

  _.each(entries, function(group, groupName) {
    if (existing = _.find(group, function(entry){ return entry.alias === alias; })) {
      return callback(new Error(util.format('The %s alias already exists in the %s entry group for path %s. Listing aliases must remain globally unique.', alias.yellow.bold, groupName.yellow.bold, existing.path.yellow.bold)));
    }    
  });



  // Save the listing
  listings.push(listing);
  
  storage.set(['listings'], listings, function() {
    storage.save(function(err) {
      if (err) {
        return callback(err);
      }

      app.log.info(util.format('The path %s has been added to the %s with alias %s', listing.path.yellow.bold, 'listings'.yellow.bold, listing.alias.yellow.bold));
    });
  });
};