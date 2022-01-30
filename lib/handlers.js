//dependancies
var _data = require('./data');
var helpers= require('./helpers');

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

      _data.read('users', phone, function(err,data){
        if(!err && data){
      
      _data.delete('users',phone,function(err){
        if(!err){
      callback(200);
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

//Ping handler

handlers.ping = function(data, callback) {
    callback(200);
}
//Not found handler
handlers.notFound = function(data, callback) {
 callback(404);
};

//Export the module
module.exports=handlers;