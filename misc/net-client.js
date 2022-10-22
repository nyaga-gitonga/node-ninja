/*
*Example TCP(net) client
*
*Connects to Port 6000 and send the word "Ping" to the servers
*/

//Dependencies
var net = require('net');

//Define the message to send
var outboundMessage = 'ping';

//Create the client

var client = net.createConnection({'port' : 6000}, function(){
    //Send the message
    client.write(outboundMessage);

})

//When the server writes back, log what ut says then kill the client
client.on('data', function(inboundMessage){
    var messageString = inboundMessage.toString();
    console.log(" I wrote" + outboundMessage+ "and tney said" + messageString);
    client.end();
})