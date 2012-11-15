var app      = module.exports = require('../app'),
    storage  = require('./storage');



// Initial load, brings JSON data from the storage into memory
storage.load(
  app.config.get('storageFile'),
  function(err) {
    if (err) throw err;
  }
);
