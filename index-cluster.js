/*
 * Primary file for API
 *
 */

// Dependencies
var server = require('./lib/server');
var workers = require('./lib/workers');
var cli = require('./lib/cli');
var cluster= require('cluster');
var os = require('os');

// Declare the app
var app = {};

// Init function
app.init = function(callaback){

  //If we're on the master thread, start the background workers and the CLI
  if(cluster.isMaster){
  // Start the workers
  workers.init();

  //Start the cli but make sure it starts last
  setTimeout(function(){
  cli.init();
  callaback();
  },50);

  //Fork the process
  for(var i=0; i<os.cpus().length; i++){
    cluster.fork();
  }
  } else{
    //start the server
    server.init();
  }


};

// Self executing only if required directly
if(require.main===module){
  app.init(function(){});
}




// Export the app
module.exports = app;

