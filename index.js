//Dependacies
const http = require('http');
const https = require('https');
const url=require('url');
const StringDecoder=require('string_decoder').StringDecoder;
const config=require('./lib/config');
const fs=require('fs');
const handlers= require('./lib/handlers');
const helpers= require('./lib/helpers');

/*
const _data=require('./lib/data')

_data.read('test', 'newFile', function(err) {
console.log('this was the error', err);
});*/

//Instantiate the HTTP server
const httpServer =http.createServer(function(req,res){
   
unifiedServer(req,res);

});


//Start the server and lsiten to port
httpServer.listen(config.httpPort, function() {
    console.log('The server is listening to port '+config.httpPort+' in '+config.envName+ ' now');
});

//Instantiate the https server
httpsServerOptions= {
'key': fs.readFileSync('./https/key.pem'),
'cert':fs.readFileSync('./https/cert.pem')
};
const httpsServer =https.createServer(httpsServerOptions,function(req,res){
   
    unifiedServer(req,res);
    
    });

//Start the https server
httpsServer.listen(config.httpsPort, function() {
    console.log('The server is listening to port '+config.httpsPort+' in '+config.envName+ ' now');
});


//All the server logic for http and https server

const unifiedServer= function(req, res){
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
var chosenHandler= typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

//construct the data object to send to the handler

var data= {
    'trimmedPath':trimmedPath,
    'queryStringObject': queryStringObject,
    'method': method,
    'headers': headers,
    'payload': helpers.parseJsonToObject(buffer)
};

//Route the request to the handler specified in the router
chosenHandler(data, function(statusCode,payload) {
//use the status code called back by the handler, or default to 200
statusCode=typeof(statusCode)=='number' ? statusCode : 200;

//use the payload called back by the hanlder or default to object
payload =typeof(payload)=='object' ? payload : {};

//convert the payload to a string

var payloadString= JSON.stringify(payload);

//return the response
res.setHeader('Content-Type', 'application/json');
res.writeHead(statusCode);
res.end(payloadString);

//Log the request path
console.log('Request was received with this payload:', statusCode, payloadString);

});
});
};



//Define a request router

var router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens':handlers.tokens
}