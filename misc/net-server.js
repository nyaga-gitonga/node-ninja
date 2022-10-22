/*
* Example TCP (NET) server
*
* Listens to port  6000 and sends the word pong to client
*
*/

//Dependencies
var net = require('net');

//Create the server
var server = net.createServer(function(connection){
    //Send the word "Pong"
    var outboundMessage= 'Pong';
    connection.write(outboundMessage);

    //When the client writes something, log it out
    connection.on('data', function(inboundMessage){
        var messageString = inboundMessage.toString();
        console.log(" I wrote" + outboundMessage+ "and tney said" + messageString);
    })
});

//Listen
server.listen(6000);