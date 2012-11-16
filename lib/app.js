"use strict";

var flatiron = require('flatiron'),
    colors   = require('colors'),
    path     = require('path'),
    util     = require('utile'),
    _        = require('lodash'),
    appName  = require('../package.json').name;



var app = module.exports = flatiron.app;

// Set $HOME properly for windows
if (process.platform === "win32") {
  process.env.HOME = process.env.USERPROFILE;
}



// Setup some basic options/usage instructions for flatiron
// an the related cli plugin
app.use(flatiron.plugins.cli, {
  dir: path.join(__dirname, 'commands'),
  argv: {
    usage: [''],
    colors: {
      description: '--no-colors will disable output coloring',
      'default': true,
      boolean: true
    },
    notFoundUsage: []
  }
});

app.config.file({ file: path.join(__dirname, util.format('%s-config.json', appName)) });
app.config.defaults({
  'currentGroup': 'default',
  'storageFile': path.join(process.env.HOME, util.format('.%s.json', appName)), 
  'tmpDirFile': '/tmp/speed-dial'
});

app.use(require('flatiron-cli-config'), {
  store: 'file',
  restricted: [
    'currentGroup',
    'storageFile'
  ]
});



// Logging options
app.options.log = {
  console: {
    raw: app.argv.raw
  }
};



// Commonly used prompts (ie. confirmation prompt)
app.prompt.properties = flatiron.common.mixin(
  app.prompt.properties, 
  {
    yesno: {
      name: 'yesno',
      message: 'Are you sure?',
      validator: /y[es]*|n[o]?/,
      warning: 'Must respond yes or no',
      'default': 'no'
    }
  }
);

app.prompt.override = app.argv;



// Startup the flatiron app
app.start = function(callback) {
  // Allow coloring in the console output to be disabled
  var useColors = (typeof app.argv.colors === 'undefined' || app.argv.colors);

  if (!useColors) {
    colors.mode = "none";
  }

  app.init(function(err) {
    if (!useColors) {
      app.log.get('default').stripColors = true;
      app.log.get('default').transports.console.colorize = false;
    }
  });

  // Set a default command if speed-dial is run without any command
  if (_.isEmpty(app.argv._)) {
    app.argv._ = ['list'];
  }

  return app.exec(app.argv._, callback);
};


// Overload implementation of flatiron's exec; attempts to handle errors within the
// application's commands gracefully and help with routing
app.exec = function (command, callback) {
  app.router.dispatch('on', command.join(' '), app.log, function (err, shallow) {
    if (err) {
      app.log.error(err.message);
      if (!_.isUndefined(callback)) {
        callback(err);
      }
    }

    if (!_.isUndefined(callback)) {
      callback(err);
    }
  });
};