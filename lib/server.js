/*
*Server related tasks
*
*
*/

//Dependacies
const http = require('http');
const https = require('https');
const url=require('url');
const StringDecoder=require('string_decoder').StringDecoder;
const config=require('./config');
const fs=require('fs');
const handlers= require('./handlers');
const helpers= require('./helpers');
const path= require('path');
var utils=require('util');
var debug=utils.debuglog('server');

//instantiate te server module object

const server={};


//Instantiate the HTTP server
server.httpServer =http.createServer(function(req,res){
   
server.unifiedServer(req,res);

});



//Instantiate the https server
server.httpsServerOptions= {
'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
'cert':fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};
server.httpsServer =https.createServer(server.httpsServerOptions,function(req,res){
   
    server.unifiedServer(req,res);
    
    });




//All the server logic for http and https server

server.unifiedServer= function(req, res){
//Get the URL and parse it
const parsedUrl=url.parse(req.url,true);

//Get the path
const path=parsedUrl.pathname;
const trimmedPath=path.replace(/^\/+|\/+$/g,'');

//Get the query string as an object
const queryStringObject=parsedUrl.query;

//Get the Http method
const method=req.method.toLowerCase();

//Get the headers as an object
const headers=req.headers;

//Get the payload if any

var decoder=new StringDecoder('utf-8');
var buffer='';

req.on('data', function(data){
buffer += decoder.write(data);
});
req.on('end', function() {
buffer += decoder.end();

//choose the handler this request should go to
var chosenHandler= typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

//construct the data object to send to the handler

var data= {
    'trimmedPath':trimmedPath,
    'queryStringObject': queryStringObject,
    'method': method,
    'headers': headers,
    'payload': helpers.parseJsonToObject(buffer)
};

//Route the request to the handler specified in the router
chosenHandler(data, function(statusCode,payload,contentType) {
//Determine he type of response (fallback to JSON)
contentType=typeof(contentType)=='string' ? contentType : 'json';    
//use the status code called back by the handler, or default to 200
statusCode=typeof(statusCode)=='number' ? statusCode : 200;


//return the response parts that are content specific
var payloadString = '';
if(contentType == 'json'){
    res.setHeader('Content-Type', 'application/json');
    payload=typeof(payload)== 'object' ? payload : {};
    payloadString=JSON.stringify(payload);
}
if(contentType=='html'){
    res.setHeader('Content-Type', 'text/html');
    payloadString=typeof(payload) == 'string' ? payload : '';
}
//Return the response-parts that are common to all content-types
res.writeHead(statusCode);
res.end(payloadString);

//Log the request path
if(statusCode==200){
  debug('\x1b[32m%s]\x1b[0m',method.toUpperCase()+'/'+trimmedPath+' '+statusCode)
}else {
  
    debug('\x1b[31m%s]\x1b[0m',method.toUpperCase()+'/'+trimmedPath+' '+statusCode)
}
//  debug('Request was received with this payload:', statusCode, payloadString);

});
});
};



//Define a request router

server.router = {
    '':handlers.index,
    'account/create':handlers.accountCreate,
    'account/edit':handlers.accountEdit,
    'account/deleted':handlers.accountDeleted,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'checks/all': handlers.checksList,
    'checks/create': handlers.checksCreate,
    'checks/edit':handlers.checksEdit,
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/tokens':handlers.tokens,
    'api/checks':handlers.checks
}

//init script
server.init= function(){
    //Start the http server

//Start the server and lsiten to port
server.httpServer.listen(config.httpPort, function() {
    console.log('\x1b[36m%s]\x1b[0m','The server is listening to port '+config.httpPort+' in '+config.envName+ ' now');
});

//Start the https server
server.httpsServer.listen(config.httpsPort, function() {
    console.log('\x1b[35m%s]\x1b[0m','The server is listening to port '+config.httpsPort+' in '+config.envName+ ' now');
});

}

module.exports=server;