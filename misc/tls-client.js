/*
*Example TLS client
*
*Connects to Port 6000 and send the word "Ping" to the servers
*/

//Dependencies
var tls = require('tls');
var fs = require('fs');
var path = require('path');

//Server Options
var options = {
   'ca': fs.readFileSync(path.join(__dirname,'/../https/cert.pem')) //Only required because we are using a self signed cert
}

//Define the message to send
var outboundMessage = 'ping';

//Create the client

var client = tls.connect(6000,options,function(){
    //Send the message
    client.write(outboundMessage);

})

//When the server writes back, log what ut says then kill the client
client.on('data', function(inboundMessage){
    var messageString = inboundMessage.toString();
    console.log(" I wrote" + outboundMessage+ "and tney said" + messageString);
    client.end();
})