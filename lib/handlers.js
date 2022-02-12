//dependancies
//const { config } = require('process');
var _data = require('./data');
var helpers= require('./helpers');
var config= require('./config');

//Define the handlers
var handlers={};

//sample handler
handlers.sample= function(data, callback) {
    //callback a http status code and a paylaod object
    callback(406, {'name': 'Sample handler'});

};
//users

handlers.users=function(data,callback) {
    var acceptableMethods=['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
handlers._users[data.method](data,callback)
    } else{
        callback(405)
    }
};

//containter for the users submethods
handlers._users= {};


//Users-post 
//Required fields: firstname, lastname, phone, password, tosagreement
handlers._users.post = function(data,callback){

    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement){
        // Make sure the user doesnt already exist
        _data.read('users',phone,function(err,data){
          if(err){
            // Hash the password
            var hashedPassword = helpers.hash(password);
    
            // Create the user object
            if(hashedPassword){
              var userObject = {
                'firstName' : firstName,
                'lastName' : lastName,
                'phone' : phone,
                'hashedPassword' : hashedPassword,
                'tosAgreement' : true
              };
    
              // Store the user
              _data.create('users',phone,userObject,function(err){
                if(!err){
                  callback(200);
                } else {
                  console.log(err);
                  callback(500,{'Error' : 'Could not create the new user'});
                }
              });
            } else {
              callback(500,{'Error' : 'Could not hash the user\'s password.'});
            }
    
          } else {
            // User alread exists
            callback(400,{'Error' : 'A user with that phone number already exists'});
          }
        });
    } else{
        callback(400,{'Error': 'Missing required fields'});
    }
}


//Users-get
//Required data: phone
//Optional data: none
handlers._users.get = function(data,callback){
  //check if phone number is valid

  var phone=typeof(data.queryStringObject.phone)== 'string' && data.queryStringObject.phone.trim().length==10 ? data.queryStringObject.phone.trim(): false;

   if(phone){
//get the token from the headers
var token=typeof(data.headers.token)=='string' ? data.headers.token : false;

//Verify that the given token is valid for the phone number
handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
  if(tokenIsValid){
    _data.read('users', phone, function(err,data){
      if(!err && data){
    //Remove the hashed password from the user object before returning it to the requester
    delete data.hashedPassword;
    callback(200,data);
      } else{
        callback(404);
      }
    });
  }else{
  callback(403,{'Error':'Missing required token in header, or token is invalid'});
  }
});


   }else{
     callback(400,{'Error': 'Missing required field'})
   }

}

//Users-put
handlers._users.put = function(data,callback){
  //required fields
  var phone=typeof(data.payload.phone)== 'string' && data.payload.phone.trim().length==10 ? data.payload.phone.trim(): false;

  //optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if(phone){
if(firstName || lastName || password){

  //get the token from the headers
var token=typeof(data.headers.token)=='string' ? data.headers.token : false;

//Verify that the given token is valid for the phone number
handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
  if(tokenIsValid){
_data.read('users',phone,function(err,userData){
if(!err && userData){
if(firstName){
userData.firstName=firstName;
}
if(lastName){
  userData.lastName=lastName;
}
if(password)
{
  userData.hashedPassword=helpers.hash(password);
}
}else{
  callback(400,{'Error': 'Requested user does not exist'})
}

_data.update('users',phone,userData,function(err){
if(!err){
   callback(200);
}else{
  console.log(err);
  callback(500,{'Error' : 'Could not update the user'});
}
});
});
}else{
  callback(403,{'Error':'Missing required token in header, or token is invalid'});
  }
});
}else{
  callback(400,{'Error': 'Missing fields to update'});
}
  }else {
    callback(400,{'Error':'Missing required field'});
  }
    
}

//Users-delete
//Required field :phone
handlers._users.delete = function(data,callback){
  
  var phone=typeof(data.queryStringObject.phone)== 'string' && data.queryStringObject.phone.trim().length==10 ? data.queryStringObject.phone.trim(): false;

   if(phone){
  //get the token from the headers
  var token=typeof(data.headers.token)=='string' ? data.headers.token : false;

  //Verify that the given token is valid for the phone number
  handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
    if(tokenIsValid){

      _data.read('users', phone, function(err,userData){
        if(!err && userData){
      
      _data.delete('users',phone,function(err){
        if(!err){
      //Delete each of the checks assosiated with the user
      var userChecks=typeof(userData.checks)== 'object' && userData.checks instanceof Array ? userData.checks : [];
       var checksToDelete=userChecks.length;
       if(checksToDelete>0){
       var checksDeleted = 0;
       var deletionErrors = false;

       //Loop through the checks
       userChecks.forEach(function(checkId){
       //Delete the check
       _data.delete('checks', checkId, function(err){
         if(err){
           deletionErrors=true;
         } else {
           checksDeleted++;
           if(checksDeleted==checksToDelete){
              if(!deletionErrors){
             callback(200)
              }else{
                callback(500,{'Error':'Errors encountered while attempting to delete all of the users checks'});
              }
           }
         }
       })
       });
       }else{
         callback(200)
       }
     // callback(200);
        }else{
          callback(500,{'Error':"Could not delete the spectified user"});
        }
      })  
        } else{
          callback(400,{'Error':'Could not find the specified user'});
        }
      });
    }else{
      callback(403,{'Error':'Missing required token in header, or token is invalid'});
    }
  });


   }else{
     callback(400,{'Error': 'Missing required field'})
   }
}


//tokens
handlers.tokens=function(data,callback) {
  var acceptableMethods=['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
handlers._tokens[data.method](data,callback)
  } else{
      callback(405)
  }
};

//container for all tokens methods
handlers._tokens={};


//Tokens-post
//required data: phone, password
//optional data: none

handlers._tokens.post= function(data,callback) {
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  
  if(phone && password){
//lookup use who matches the phone number

_data.read('users',phone,function(err,userData){
  if(!err && userData){
//hash the sent password and compare it to th epassword stored in the user object
var hashedPassword=helpers.hash(password);
if(hashedPassword==userData.hashedPassword){
//id vaid, created a new token with random name, set expiration date 1 hr in the future

var tokenId = helpers.createRandomString(20);
var expires = Date.now() + 1000 * 60 * 60;
var tokenObject = {
  'phone': phone,
  'id': tokenId,
  'expires':expires
};

_data.create('tokens', tokenId, tokenObject,function(err){
  if(!err){
    callback(200,tokenObject);
  } else {
     callback(500,{'Error':'Could not create new token'});
  }
});
}else{
  callback(400,{'Error':'Password did not match the specified users\'s stored password'})
}
  }else{
  callback(400,{'Error':'Could not find the specified user'});
  }
})
  }
  else{
    callback(400,{'Error':'Missing required field(s)'})
  }
};

//Tokens-get
//Required data: id
//Optional data : none

handlers._tokens.get= function(data,callback) {
  var id=typeof(data.queryStringObject.id)== 'string' && data.queryStringObject.id.trim().length==20 ? data.queryStringObject.id.trim(): false;

   if(id){
_data.read('tokens', id, function(err,tokenData){
  if(!err && tokenData){

callback(200,tokenData);
  } else{
    callback(404);
  }
});
   }else{
     callback(400,{'Error': 'Missing required field'})
   }
}

//Tokens-put
//Required data: id ,extend
//Optional data: none

handlers._tokens.put= function(data,callback) {
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend==true ? true: false;
  if(id && extend) {
//lookup the token
_data.read('tokens',id, function(err,tokenData){
  if(!err && tokenData){
     //Check to make sure the token is not already expired

     if(tokenData.expires > Date.now()){
//Set the exiration an hour from now
tokenData.expires=Date.now() + 1000 * 60 * 60;

_data.update('tokens',id,tokenData,function(err){
  if(!err){
    callback(200);
  }else{
    callback(500,{'Error':'Could not update the token expiration'})
  }
})
     }else{
       callback(400,{'Error':'Token has already expired'});
     }
  }else{
    callback(400,{'Error': 'Specified token does not exist'});
  }
})
  } else {
    callback(400,{'Error': 'Missing required field(s) or field(s) are invalid'});
  }
}

//Tokens-delete
//required data: id
//Optional data: none
handlers._tokens.delete= function(data,callback) {
  //check that the id is valid
  var id=typeof(data.queryStringObject.id)== 'string' && data.queryStringObject.id.trim().length==20 ? data.queryStringObject.id.trim(): false;

   if(id){
_data.read('tokens', id, function(err,data){
  if(!err && data){

_data.delete('tokens',id,function(err){
  if(!err){
callback(200);
  }else{
    callback(500,{'Error':"Could not delete the spectified token"});
  }
})  
  } else{
    callback(400,{'Error':'Could not find the specified token'});
  }
});
   }else{
     callback(400,{'Error': 'Missing required field'})
   }
}


//Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken= function(id,phone,callaback){
  //lookup the token
  _data.read('tokens',id,function(err,tokenData){
    if(!err && tokenData) {
//Check that the token is for the given user and has not expired
if(tokenData.phone==phone && tokenData.expires> Date.now()){
   callaback(true);
} else {
  callaback(false);
}
    } else {
      callaback(false);
    }
  })
}

//Checks

handlers.checks=function(data,callback) {
  var acceptableMethods=['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
handlers._checks[data.method](data,callback)
  } else{
      callback(405)
  }
};

//container for all checks methods
handlers._checks={};

//Checks post
//Required data: protocal, url, method, successcodes, timeoutseconds
//Optional data: none

handlers._checks.post=function(data,callback){
  var protocol= typeof(data.payload.protocol)== 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url= typeof(data.payload.url)=='string' &&  data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method= typeof(data.payload.method)=='string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes=typeof(data.payload.successCodes)=='object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false; 
  var timeoutSeconds=typeof(data.payload.timeoutSeconds)=='number' && data.payload.timeoutSeconds % 1 == 0  && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false; 

if(protocol && url && method && successCodes && timeoutSeconds){
//Get the token from the headers
var token =typeof(data.headers.token)=='string' ? data.headers.token : false;

//lookup the token
_data.read('tokens', token, function(err,tokenData){
if(!err && tokenData){
var userPhone=tokenData.phone;

//lookup userData
_data.read('users',userPhone, function(err,userData){
  if(!err && userData){
  var userChecks=typeof(userData.checks)== 'object' && userData.checks instanceof Array ? userData.checks : [];

//verify that the user has less than the number of max-checks-per user
if(userChecks.length < config.maxChecks){
  //create a random id for the checks
  var checkId=helpers.createRandomString(20);

  //create the check object and include the user's phone
  var checkObject = {
  'id': checkId,
  'userPhone': userPhone,
  'protocol': protocol,
  'url':url,
  'method':method,
  'successCodes':successCodes,
  'timeoutSeconds': timeoutSeconds
  }
//save the object
  _data.create('checks',checkId,checkObject,function(err){
    if(!err){
     //Add the check id to the user's object

     userData.checks=userChecks;
     userData.checks.push(checkId);

     //Save the new user data

     _data.update('users',userPhone,userData,function(err){
       if(!err){
     //Return the data about teh new check
     callback(200,userData);
       } else {
         callback(500,{'Error': 'Could not update the user with te new check'});
       }
     })


    } else {
      callback(500,{'Error': 'Could not create the new check'})
    }
  })
}else{
  callback(400,{'Error': 'The user already has the maximum number of checks ('+config.maxChecks+')'})
}
  }else{
    callback(403)
  }
})
}else{
  callback(403);
}
});

}else{
  callback(400,{'Error':'Missing required inputs or inputs are invalid'})
}
 
}

//Checks -Get
//Required ata :id
//Optional Data: none
handlers._checks.get = function(data,callback){
  //check if id is valid

  var id=typeof(data.queryStringObject.id)== 'string' && data.queryStringObject.id.trim().length==20 ? data.queryStringObject.id.trim(): false;

   if(id){
//lookup the check

_data.read('checks',id,function(err,checkData) {
  if(!err && checkData){


//get the token from the headers
var token=typeof(data.headers.token)=='string' ? data.headers.token : false;

//Verify that the given token is valid and belongs to the user who created the check
handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
  if(tokenIsValid){
   //Return the check data
   callback(200,checkData);
  }else{
  callback(403);
  }
});
  } else {
  callback(404);
  }
})

   }else{
     callback(400,{'Error': 'Missing required field'})
   }

}


//Checks -put
//Required data : id
//Optional data : protocol, url, method, successCodes, timeoutSeconds
//Ping handler

handlers._checks.put= function(data,callback){
//check for the required fields
var id=typeof(data.payload.id)== 'string' && data.payload.id.trim().length==20 ? data.payload.id.trim() : false;

//check for optional fields
var protocol= typeof(data.payload.protocol)== 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
var url= typeof(data.payload.url)=='string' &&  data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
var method= typeof(data.payload.method)=='string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
var successCodes=typeof(data.payload.successCodes)=='object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false; 
var timeoutSeconds=typeof(data.payload.timeoutSeconds)=='number' && data.payload.timeoutSeconds % 1 == 0  && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false; 

//check to make sure id is valid
if(id){
//check to make sure one or more optional fields has been sent
if(protocol || url || method || successCodes || timeoutSeconds){
  _data.read('checks',id,function(err,checkData){
    if(!err && checkData){
      //get the token from the headers
      var token =typeof(data.headers.token)==='string' ? data.headers.token : false;

      //Verify that the token is valid and belongs to the user who created it
      handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
if(tokenIsValid){
//Update the check where necessary
if(protocol){
  checkData.protocol=protocol;
}
if(url){
  checkData.url=url;
}
if(method){
  checkData.method=method;
}
if(successCodes){
  checkData.successCodes=successCodes;
}
if(timeoutSeconds){
checkData.timeoutSeconds=timeoutSeconds;
}
//Store the update

_data.update('checks',id,checkData,function(err){
  if(!err){
 callback(200);
  } else {
 callback(500,{'Error':'Could not update check'});
  }
})
} else {
  callback(403);
}
      });


    } else {
      callback(400,{'Error': 'Check ID did not exist'});
    }
  })
} else {
  callback(400,{'Error': 'Missing fields to update'})
}
}else{
  callback(400,{'Error': 'Missing required field'})
}

};



//Checks -delete
//Required data: id
//No optional data

handlers._checks.delete= function(data,callback){
  var id=typeof(data.queryStringObject.id)== 'string' && data.queryStringObject.id.trim().length==20 ? data.queryStringObject.id.trim(): false;

   if(id){
//lookup the check
_data.read('checks','id',function(err,checkData){

  if(!err && checkData){
  //get the token from the headers
  var token=typeof(data.headers.token)=='string' ? data.headers.token : false;

  //Verify that the given token is valid for the phone number
  handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
    if(tokenIsValid){

      //Delete the check

      _data.delete('checks',id,function(err){
        if(!err){
          _data.read('users', checkData.userPhone, function(err,userData){
            if(!err && userData){
          
          var userChecks=typeof(userData.checks)== 'object' && userData.checks instanceof Array ? userData.checks : [];

          //Remove the check from the ,ist of checks
          var checkPosition=userChecks.indexOf(id);
          if(checkPosition>-1){
          userChecks.splice(checkPosition,1);
          //Re-save the user's data
          _data.update('users',checkData.userPhone,userData,function(err){
            if(!err){
          callback(200);
            }else{
              callback(500,{'Error':"Could not update the specified user"});
            }
          })  
          }else{
            callback(500,{'Error':'Could not find the check on users object'})
          }

        
            } else{
              callback(400,{'Error':'Could not find the user who created the check'});
            }
          });
        }
        else{
          callback(500,{'Error': 'Could not delete the check data'})
        }
      });


    }else{
      callback(403);
    }
  });
} else {
 callback(400,{'Error': 'The specified checkId does not exist'});
}
});

   }else{
     callback(400,{'Error': 'Missing required field'})
   }
}


//tokens
handlers.tokens=function(data,callback) {
  var acceptableMethods=['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
handlers._tokens[data.method](data,callback)
  } else{
      callback(405)
  }
}

handlers.ping = function(data, callback) {
    callback(200);
}
//Not found handler
handlers.notFound = function(data, callback) {
 callback(404);
};

//Export the module
module.exports=handlers;