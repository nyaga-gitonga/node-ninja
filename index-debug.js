/*
 * Primary file for API
 *
 */

// Dependencies
var server = require('./lib/server');
var workers = require('./lib/workers');
var cli = require('./lib/cli');
var exampleDebuggingProblem = require('./lib/exampleDebuggingProblem')

// Declare the app
var app = {};

// Init function
app.init = function(){

  // Start the server
  debugger;
  server.init();
  debugger;

  // Start the workers
  debugger;
  workers.init();
  debugger;

  //Start the cli but make sure it starts last
  debugger;
  setTimeout(function(){
  cli.init();
  },50);
debugger;

  debugger;
  var foo=1;
  console.log("Just assigned one to foo");
  debugger;

  foo++;
  console.log("Just incremented foo");
  debugger;

  foo=foo*foo;
  console.log("Just squared foo");
  debugger;

  foo=foo.toString();
  console.log("Just converted foo toa string")
  debugger;

  //Call the init script that will throw

  exampleDebuggingProblem.init();
  console.log("Just called the Library");
  debugger;

};

// Self executing
app.init();


// Export the app
module.exports = app;

