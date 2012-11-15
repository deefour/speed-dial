var support    = require('../support'),
    storage    = require('../storage'),
    app        = require('../../app'),
    path       = require('path'),
    _          = require('lodash'),
    fs         = require('fs'),
    util       = require('utile'),
    appTitle   = require('../../package.json').title,
    appRepoUrl = require('../../package.json').repository.url;



/**
 * To be run before using SpeedDial, finishes the install by
 * appending a bash source line to the specified config file
 * included in a user's terminal. The user is prompted
 * to enter the file path to append the souce line to.
 */
var init = module.exports = function(id, callback) {
  // Initialize
  var args = app.argv._,
      key  = 'File to append souce line';



  // Explain
  app.log.warn(util.format('This command will attempt to add a new %s line to the file you specify', '. (source)'.yellow.bold));
  app.log.warn(util.format('Alternative instructions can be found in %s repo\'s %s file at %s', appTitle.blue.bold, 'README.md'.yellow.bold, appRepoUrl.yellow.bold));



  // Get the filepath to append the source line to for bash shortcuts
  app.prompt.get([{
    name: key,
    required: true,
    message: util.format('%s must point to an already-existing file that %s can write to', key.bold.grey, appTitle.blue.bold),
    conform: function(filePath){ // make sure the path exists and is a file
      filePath = support.normalizePath(filePath);
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    }
  }], function(err, result) { 
    if (err) {
      return callback(err);
    }

    // Initialize the file append
    var filePath = support.normalizePath(result[key]),
        sourceLine = util.format('. %s', path.join(__dirname, '..', '..', 'assets', 'functions'));

    // Explain (warn)
    app.log.warn(util.format('%s will append "%s" to the %s file', appTitle.blue.bold, sourceLine.yellow.bold, filePath.yellow.bold))

    // Confirm the filepath & write action
    app.prompt.get(['yesno'], function(err, result) {
      if (err) throw err;

      if (/^y/i.test(result.yesno)) {
        // Perform the append
        fs.open(filePath, 'a+', 0666, function( e, id ) {
          fs.write( id, util.format("\n\n# Loads %s functions\n%s", appTitle, sourceLine), null, 'utf8', function(){
            fs.close(id, function(){
              // Explain everything went well
              app.log.info(util.format('%s has had "%s" appended successfully', filePath.yellow.bold, sourceLine.yellow.bold));
              app.log.info(util.format('You must reload your terminal session for the %s commands to become available', appTitle.blue.bold));
            });
          });
        });
      }
    });
  });
};
