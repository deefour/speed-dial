var storage = require('./storage'),
    _       = require('lodash');



/**
 * Generic support/help for SpeedDial
 */
var support = module.exports = (function(){
  "use strict";

  var pub = {
    /**
     * Sort function passed to Array.sort, accounting for entry
     * weight and alias name
     */
    sortEntries: function(a, b) {
      if (a.weight !== b.weight) {
        return a.weight - b.weight;
      }

      if (a.alias === b.alias) {
        return 0;
      }

      if ((a.alias || '') < (b.alias || '')) {
        return -1;
      }

      return 1;
    },



    /**
     * Locates a specific entry by the group/id passed and
     *  - passes it to the callback function to have something done to it
     *  - returns it
     *
     * This ne's a bit tricky because many times the id corresponds to an
     * entry as though all entries and listings were printed in a single
     * fluent lists; they need to be treated as entries in a single, sorted
     * array
     */
    withEntry: function(group, id, callback) {
      // Initialize
      var result = false,
          i = 0;

      // Allow arbitrary # of arguments
      if (_.isFunction(id) || _.isUndefined(id)) {
        callback = id;
        id       = group;
        group    = undefined;
      } else if (_.isFunction(group)) {
        callback = group;
        group    = undefined;
        id       = undefined;
      }

      // Internal helpers
      var iterateGroup = function(entries, groupName) {
            entries = entries.sort(support.sortEntries);
        
            _.each(entries, function(entry, j) {
              if (++i === +id || id === entry.alias) {
                result = _.clone(entry);

                result = {
                  type: 'entry',
                  dataTarget: ['groups', groupName, j],
                  entry: entry,
                  groupName: groupName,
                  id: i
                };
              }
            });
          },
          iterateListings = function(listings) {
            _.each(listings, function(listing, j) {
              if (++i === +id || id === listing.alias) {
                result = _.clone(listing);
                
                result = {
                  type: 'listing',
                  dataTarget: ['listings', j],
                  entry: listing,
                  id: i
                };
              }
            });
          };
      
      // Find the entry
      if (_.isUndefined(group)) {
        storage.get(null, function(data) {
          _.each(data.groups, function(entries, groupName){
            iterateGroup(entries, groupName);
          });

          if (!result) {
            iterateListings(data.listings);
          }
        });
      } else {
        var target = (group === 'listings') ? ['listings'] : ['groups', group];

        storage.get(target, function(data) {
          if (data) {
            if (group === 'listings') {
              iterateListings(data);
            } else {
              iterateGroup(data, group);
            }
          }
        });
      }

      // Pass it to the callback if there is one, then return
      if (!_.isUndefined(callback)) {
        callback(result);
      }

      return result;
    },



    /**
     * Boolean check whether an entry exists. Group is optional
     */
    hasEntry: function(group, id){
      if (+group > 0) {
        id    = group;
        group = undefined;
      }

      return this.withEntry(group, id || 1) !== false;
    },



    /**
     * *NOT*-universal translation of ~ to $HOME; attempts to
     * get a full path when someone provides something like ~/Sites
     */
    normalizePath: function(filePath) {
      if (!_.isString(filePath)) {
        return false;
      }

      if (/^\~/.test(filePath)) {
        filePath = filePath.replace(/^\~/, process.env.HOME);
      }

      return require('path').normalize(filePath);
    }
  };

  // Expose the public api
  return pub;
})();
