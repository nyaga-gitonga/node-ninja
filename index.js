/*
 * Primary file for API
 *
 */

// Dependencies
var server = require('./lib/server');
var workers = require('./lib/workers');
var cli = require('./lib/cli');

// Declare the app
var app = {};

// Init function
app.init = function(callaback){

  // Start the server
  server.init();

  // Start the workers
  workers.init();

  //Start the cli but make sure it starts last
  setTimeout(function(){
  cli.init();
  callaback();
  },50);

};

// Self executing only if required directly
if(require.main===module){
  app.init(function(){});
}




// Export the app
module.exports = app;

