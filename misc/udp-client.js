/*
*Example UDP Client
*
*Sending a message to a udp server on port 6000
*/

//Var Dependencies
var dgram = require('dgram');

//Create the client
var client =dgram.createSocket('udp4');

//Define the message and pull it into a buffer
var messageString = 'This is a message';
var messageBuffer =  Buffer.from(messageString);

//Send off the message
client.send(messageBuffer,6000, 'localhost', function(err){
    client.close();
});