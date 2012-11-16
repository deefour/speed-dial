var fs   = require('fs'),
    _    = require('lodash');



/**
 * Manages in memeory copy of the SpeedDial entries & listings,
 * as well as provides functionality to load/persist the data
 * to/from an external file.
 *
 * There is currently an expectation that .load will be called
 * by the app during it's own init to preload JSON into memory.
 */
var storage = module.exports = (function() {
  "use strict";

  // Initialize/defaults
  var priv = {
        source: null,
        data: {},
        defaultData: {
          groups: {
            'default': []
          },
          listings: []
        }
      };


  // Public api
  var pub = {
    /**
     * Sets a value in the in-memory JSON data store
     */
    set: function(path, value, cb) {
      if (!_.isArray(path)) {
        path = [path];
      }

      var data = priv.data,
          key  = path.pop();

      _.each(path, function(key) { 
        data = data[key];
      });

      if (data[key] = value) {
        cb();
      }
    },



    /**
     * Retrieves a value from the in-memory JSON data store
     */
    get: function(path, cb) {
      var data = priv.data;
      
      if (_.isString(path) || _.isArray(path)) {
        if (!_.isArray(path)) {
          path = [path];
        }

        _.each(path, function(key) { data = data[key]; });
      }

      if (arguments.length === 2) {
        return cb(data || null);
      }

      return data;
    },



    /**
     * Removes a value from the in-memory JSON data store
     */
    del: function(path, cb) {
      if (!_.isArray(path)) {
        path = [path];
      }

      var data = priv.data,
          key  = path.pop();

      _.each(path, function(key) {data = data[key]; });

      delete data[key];

      if (_.isArray(data)) {
        data.splice(key, 1);
      }
      
      cb();
    },



    /**
     * Persists the in-memory JSON store to a file
     */
    save: function(cb) {
      fs.writeFile(priv.source, JSON.stringify(priv.data), function(err) {
        cb(err || null);
      });
    },



    /**
     * Loads JSON from a file into memory
     */
    load: function(file, cb) {
      priv.source = file;
      priv.data = _.clone(priv.defaultData);
       
      try {
        var content = fs.readFileSync(file, 'utf8');
        priv.data = JSON.parse(content);
      } catch(err) {
        if (err && err.code !== 'ENOENT') {
          return cb(err);
        }
      }
       
      cb(null);
    }
  };

  // Expose the public api
  return pub;
})();