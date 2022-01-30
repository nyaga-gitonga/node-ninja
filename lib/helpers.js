/*
*Helpers for various tasks
*/

//dependancies

var crypto= require('crypto');
var config= require('./config');

//container for all the helpers

var helpers ={};

//Create a SHA256 hash

helpers.hash = function(str){
    if(typeof(str)=='string' && str.length >0){
     var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
     return hash;
    } else {
        return false;
    }
};


//Parse a json string to an object in all cases without throwing

helpers.parseJsonToObject = function(str) {
    try{
     var obj=JSON.parse(str);
     return obj;
    }catch(e){
     return {};
    }
}

//Create a string of rabdom alphanumeric characters of a given length

helpers.createRandomString= function(strLength){
    strLength=typeof(strLength)=='number' && strLength >0 ? strLength : false;

    if(strLength){
//defiene all possible characters that could go intoa string
var possibleCharacters='abcdefghijklmnopqrstuvwxyz0123456789';

//final string
var str='';

for(i=1;i<=strLength;i++){
    //Get a random character from the possible String
    var randomCharacter=possibleCharacters.charAt(Math.floor(Math.random()* possibleCharacters.length));

    //add character to the final string

    str+=randomCharacter;

}
return str;
    } else{
        return false;
    }
}



//Export the module

module.exports=helpers;