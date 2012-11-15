var support    = require('../support'),
    storage    = require('../storage'),
    app        = require('../../app'),
    prettyjson = require('prettyjson'),
    _          = require('lodash'),
    phpjs      = require('phpjs'),
    util       = require('utile'),
    appTitle   = require('../../package.json').title;



/**
 * Displays the contents of the SpeedDial entries & listings
 * in a variety of formats
 *
 *  - Sorted and organized by group and listing
 *  - A single group if specified
 *  - prettyjson formatted raw JSON of either format
 *  - One contiguous index spanning groups/listings (used for deletion)
 */
var list = module.exports = function(name, options, callback) {
  // Initialize functions
  var _getLine = function(entry, i, internalPointer, useInternalPointer) {
        var number;

        if (useInternalPointer) {
          number = phpjs.sprintf("%-26s", internalPointer.toString().yellow.bold);
        } else {
          number = phpjs.sprintf("%-17s", (i+1).toString().white);
        }

        return phpjs.sprintf('%s%-' + (entry.alias ? 35 : 26) + 's%s', number, entry.alias ? entry.alias.green.bold : '[none]'.grey, entry.path);
      },
      listGroup = function(entries, groupName){
        app.log.info('');
        app.log.info(util.format('%s%s', ('Entry Group: ' + groupName.blue.bold).underline, (app.config.get('currentGroup') === groupName) ? ' (active)'.yellow.bold : ''));
        app.log.info('');

        entries = entries.sort(support.sortEntries);    
        
        if (_.isEmpty(entries)) {
          app.log.info('[No entries have been set]'.grey);
        } else {
          _.each(entries, function(entry, i) {
            app.log.info(_getLine(entry, i, ++internalPointer, useInternalPointer));
          });
        }
      },
      listListings = function(listings){
        app.log.info('');
        app.log.info('Listings'.blue.bold.underline);
        app.log.info('');

        if (!_.isEmpty(listings)) {
          listings = listings.sort(support.sortEntries);

          _.each(listings, function(listing, i) {
              app.log.info(_getLine(listing, i, ++internalPointer, useInternalPointer));
          });
        } else {
          app.log.info('[No listings have been set]'.grey);
        }
      };



  // Allow for arbitrary number of arguments; in this case where no args are passed
  if (_.isPlainObject(name)) {
    options = name;
    name    = undefined;
  }

  // Set defautl --... options
  options = _.isPlainObject(options) ? options : app.argv;
  options = _.extend({
    'exit-if-empty': false, // there will be no listing output if the requested list is blank/empty
    'empty-message': '',    // if a group or listing is empty, this message will be used (ignored if --exit-with-empty is provided)
    'single-listing': false // causes increment of the SpeedDial ID for each entry/listing to *NOT* be reset for each group/listing
  }, options);

  // Initialize variables/defaults
  var internalPointer    = 0,
      useInternalPointer = options['single-listing'] == true;



  // Validate
  if (options['exit-if-empty'] && !support.hasEntry()) {
    return callback(new Error(util.format('No entries or listings have been added to %s yet', appTitle.blue.bold) + (options['empty-message'] ? '; ' + options['empty-message'] : '')));
  }

  if (_.isString(name)) {
    if (name === 'listings') {
      storage.get(['listings'], function(data) {
        if (options['exit-if-empty'] && _.isEmpty(data)) {
          return callback(new Error(util.format('No listings have been added to %s yet', appTitle.blue.bold) + (options['empty-message'] ? '; ' + options['empty-message'] : '')));
        }
      });
    } else {
      storage.get(['groups', name], function(data) {
        if (data === null) {
          return callback(new Error(util.format('There is currently no %s group to list entries for', name.yellow.bold)));
        }

        if (options['exit-if-empty'] && _.isEmpty(data)) {
          return callback(new Error(util.format('No entries have been added to the %s group yet', name.yellow.bold) + (options['empty-message'] ? '; ' + options['empty-message'] : '')));
        }
      });
    }
  }



  // Do the list
  storage.get(null, function(data) {
    if (_.has(app.argv, 'raw')) {
      if (_.isString(name)) {
        if (name === 'listings') {
          console.log(prettyjson.render(data.listings));
        } else {
          console.log(prettyjson.render(data.groups[name]));
        }
      } else {
        console.log(prettyjson.render(data));
      }
    } else {
      if (_.isString(name)) {
        if (name === 'listings') {
          listListings(data.listings);
        } else {
          listGroup(data.groups[name], name);
        }
      } else {
        _.each(data.groups, function(entries, groupName) {
          listGroup(entries, groupName);
        });
        
        listListings(data.listings);
      }

      app.log.info('');
    }
  });
};