var commands = module.exports;

var support = require('../support'),
    app     = require('../app'),
    util    = require('utile'),
    list    = require('./list'),
    phpjs    = require('phpjs'),
    _       = require('lodash'),
    fs      = require('fs'),
    appTitle = require('../../package.json').title;


/**
 * The real purpose of SpeedDial - changes working directory to the
 * path specified in an entry. If a listing is specified, the children
 * of that directory will be listed and the user is prompted to make a
 * selection
 *
 * **Important**
 *
 * This command doesn't actually do anything in terms of physically changing
 * the terminal's working directory. This CLI runs through node in a child
 * process of the shell, so changing the terminal process' directory is
 * (as far as I know) impossible.
 *
 * Instead, this command stores the path for the new directory to a file in
 * /tmp which the `sd` bash script that SpeedDial is intended to be run through
 * will catch and
 */
var go = module.exports = function(group, alias, callback) {
  "use strict";

  // Initialize
  var key = 'Entry/Listing ID',
      entryResult;

  // Allow for arbitrary number of arguments
  if (alias === null) {
    alias    = group;
    group    = undefined;
  }


  // Help/support functions
      /**
       * Truncates and writes the selected new current working directory to the /tmp file
       * for the bash script to read
       */
  var writeTarget = function(result, output) {
        fs.open(app.config.get('tmpDirFile'), 'w+', 666, function(e, id) {
          fs.write( id, result.entry.path, null, 'utf8', function(){
            fs.close(id, function(){
              if (_.isUndefined(output)) {
                output  = util.format('The %s path', result.entry.path.yellow.bold);
                output += util.format(' from the %s', (result.type === 'listing') ? 'listings'.yellow.bold : util.format('%s group', result.groupName.yellow.bold));
                output += util.format(' with %s', result.entry.alias ? result.entry.alias.yellow.bold : 'no alias'.grey);
                output += ' has been selected';
              }

              app.log.info(output);
              app.log.info(util.format('The %s is now %s', 'current working directory'.yellow.bold, result.entry.path.green.bold));
            });
          });
        });
      },
      /**
       * Displays or retrieves child directory(ies) of a listing path
       *  - if an index is *not* provided, the child directories will be listed
       *    with an index value to be used in a prompt
       *  - if an index is provided, the child matching the index will be returned
       *    in a result object
       */
      listingChildren = function(dir, index) {
        var i    = 0,
            list = fs.readdirSync(dir),
            number, result;

        _.each(list, function(filename) {
          var file = support.normalizePath(dir + '/' + filename);
          if (fs.statSync(file).isDirectory()) {
            if (++i === +index) {
              result = {file: filename, path: file};
            } else if (_.isUndefined(index)) {
              number = phpjs.sprintf("%-26s", i.toString().yellow.bold);
              app.log.info(phpjs.sprintf('%s%-26s', number, filename.green.bold, file));
            }
          }
        });

        if (result) {
          return result;
        }
      },
      /**
       * Lists the entries for a single group and prompts the user to enter the ID
       * or alias associated with the entry they want to change to
       */
      askGroup = function(group, callback){
        list(group, {
          'single-listing': true,
          'exit-if-empty': true
        });

        var key = 'Directory alias or ID';

        app.prompt.get([{
          name: key,
          required: true,
          pattern: /^(\d+|[a-zA-Z][a-zA-Z0-9\-\_]+)$/,
          message: key.bold.grey + ' must match an alias or ID for a directory above',
          conform: function(id){
            return support.hasEntry(group, id);
          }
        }], function(err, result) {
          if (err) {
            return callback(err);
          }

          support.withEntry(group, result[key], function(entryResult) {
            if (!_.isUndefined(callback)) {
              callback(entryResult);
            } else {
              writeTarget(entryResult, util.format('The %s directory, an entry with %s in the %s group, has been selected', entryResult.entry.path.yellow.bold, (entryResult.entry.alias ? entryResult.entry.alias.yellow.bold : 'no alias'.grey), entryResult.groupName.yellow.bold));
            }
          });
        });
      },
      /**
       * Lists the entries for a single listing (@see listingChildren above) and
       * prompts the user to enter the ID or alias associated with the entry
       * they want to change to
       */
      askList = function(entryResult) {
        app.log.info('');
        app.log.info(util.format('Select the target directory within %s for the %s with alias %s', entryResult.entry.path.yellow.bold, 'listing'.yellow.bold, entryResult.entry.alias.yellow.bold));
        app.log.info('');

        listingChildren(entryResult.entry.path);
        var key = 'Directory ID';

        app.prompt.get([{
          name: key,
          required: true,
          pattern: /^\d+$/,
          message: key.bold.grey + ' must match an ID for a directory above',
          conform: function(id){
            return !_.isUndefined(listingChildren(entryResult.entry.path, id));
          }
        }], function(err, result) {
          if (err) {
            return callback(err);
          }

          var target = listingChildren(entryResult.entry.path, result[key]);
          writeTarget({ entry: { path: target.path }}, util.format('The %s directory, a child of %s, the %s with alias %s, has been selected', target.file.yellow.bold, entryResult.entry.path.yellow.bold, 'listing'.yellow.bold, entryResult.entry.alias.yellow.bold));
        });
      };



  // And now the branching logic for the various cases for how this command can be expected to run
  if (!_.isString(alias)) { // no args passed; print a single listing of everything and prompt for an id
    list({
      'single-listing': true,
      'exit-if-empty': true
    });

    app.prompt.get([{
      name: key,
      required: true,
      pattern: /\d+/,
      message: key.bold.grey + ' must match an id for an entry or listing above',
      conform: function(id){
        return support.hasEntry(id);
      }
    }], function(err, result) {
      if (err) {
        return callback(err);
      }

      entryResult = support.withEntry(result[key]);

      if (entryResult.type === 'listing') { // A listing was selected; list the children and prompt again
        askList(entryResult);
      } else {
        writeTarget(entryResult);
      }
    });
  } else if (_.isUndefined(group) && +alias > 0) { // an integer entry id was provided - go to the id within the current group
    entryResult = support.withEntry(app.config.get('currentGroup'), +alias);

    if (!entryResult) {
      return callback(new Error(util.format('The target %s does not match any %s in the %s group', alias.yellow.bold, 'entry ID'.yellow.bold, app.config.get('currentGroup').yellow.bold)));
    }

    writeTarget(entryResult);
  } else if (_.isString(alias) && _.isUndefined(group)) { // a string alias was provided - go to the alias within the current group
    entryResult = support.withEntry(app.config.get('currentGroup'), alias);

    if (!entryResult) {
      if (app.config.get('globalLookupFallback')) {
        entryResult = support.withEntry(alias);

        if (entryResult.type === 'entry') {
          return writeTarget(entryResult);
        }
      }

      // if it didn't match an alias in the current group, check if it's a group name, an alias for a listing or if 'listings' was passed (special case)
      if (alias === 'listings') {
        askGroup('listings', function(entryResult){ // 'listings' was passed - list the listings, prompt the user, list the children and prompt again
          askList(entryResult);
        });
      } else {
        if (entryResult = support.withEntry('listings', alias)) { // check the listing aliases for a match, list the children, and prompt again
          askList(entryResult);
        } else if (entryResult = support.withEntry(alias, 1)) { // check the group names for a match, list the group entries, and prompt again
          askGroup(alias);
        } else {
          return callback(new Error(util.format('The target %s does not match any %s in the %s group', alias.yellow.bold, 'alias'.yellow.bold, app.config.get('currentGroup').yellow.bold)));
        }
      }

      // @todo Add an option here (set through the config) to look further, at aliases for entries
      //       within other unspecified groups for a match.
    } else {
      writeTarget(entryResult);
    }
  } else if (_.isString(group) && (_.isString(alias) || +alias > 0)) { // a group and alias were entered - go to the alias within the specified group
    entryResult = support.withEntry(group, alias);

    if (!entryResult) {
      return callback(new Error(util.format('The target %s does not match any %s or id in the %s group', alias.yellow.bold, 'alias'.yellow.bold, group)));
    }

    writeTarget(entryResult);
  } else {
    return callback(new Error(util.format('The command format was not recognized by %s', appTitle.blue.bold)));
  }
};