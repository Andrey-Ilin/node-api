/*
* Request handlers
*
*/

// Dependencies

var _data = require('./data');
var helpers = require('./helpers');

// Define handlers
var handlers = {};

handlers.users = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) >=0) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for thr users submethods

handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback) {
    // Check that all required field are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone  = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    var password  = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement  = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesnt exist
        _data.read('users', phone, function (err, data) {
            if (err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);

                // Create the user object
                if (hashedPassword) {
                    var userObject = {
                        firstName: firstName,
                        lastName: lastName,
                        phone: phone,
                        hashedPassword: hashedPassword,
                        tosAgreement: true
                    };

                    // Store the user

                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {Error: 'Could not create the new User'});
                        }
                    })
                } else {
                    callback(500, {Error: 'Could not hashed the user\'s password'});
                }
            } else {
                //User already exist
                callback(400, {Error: 'A user with that phone number already exist'})
            }
        })
    } else {
        callback(400, {Error: 'Missing required fields'});
    }
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback) {
    // Check that phone number provided is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;

    if (phone) {
        // Get the token from the header
        var token = typeof(data.headers.token) == "string" && data.headers.token.length == 20 ? data.headers.token : false;
        // Verify that the given token
        handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
                // Lookup for the user
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        // Remove the hashed password before we returning;
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404)
                    }
                })
            } else {
                callback(403, {Error: 'Missing required token in header or token is invalid'});
            }
        });
    } else {
        callback(404, {Error: "Missing required field"})
    }

};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function(data, callback) {
    // Check for the required field
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;

    // Check for the optional fields

    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password  = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone is invalid
    if (phone) {
        // Error if nothing to update
        if (firstName || lastName || password) {

            // Get the token from the header
            var token = typeof(data.headers.token) == "string" && data.headers.token.length == 20 ? data.headers.token : false;

            handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
                if (tokenIsValid) {
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            // Update the fields necessary
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // Store new updates
                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    callback(200)
                                } else {
                                    console.log(e);
                                    callback(500, {Error: "Could not update the user"});
                                }
                            })
                        } else {
                            callback(400, {Error: "The specified user does not exist"})
                        }
                    })
                } else {
                    callback(403, {Error: 'Missing required token in header or token is invalid'});
                }
            });
        } else {
            callback(400, {Error: 'Missing fields to update'});
        }
    } else {
        callback(400, {Error: 'Missing required fields'});
    }

};

// Users - delete
// Required fields: phone
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = function(data, callback) {
    // Check if phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
    if (phone) {

        // Get the token from the header
        var token = typeof(data.headers.token) == "string" && data.headers.token.length == 20 ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
                // Lookup for the user
                _data.delete('users', phone, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {Error: 'Could not delete the specified user'});
                    }
                })
            } else {
                callback(403, {Error: 'Missing required token in header or token is invalid'});
            }
        });
    } else {
        callback(404, {Error: "Missing required field"})
    }
};

// Tokens

handlers.tokens = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) >=0) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all tokens methods

handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback) {
    var phone  = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    var password  = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {
        // Look the user who matches that phone number
        _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
                // Hash the sent password, and compare it with the password stored in the user object
                var hashedPassword = helpers.hash(password);

                if (hashedPassword === userData.hashedPassword) {
                    // if valid, create a new token with random name, set expiration in 1 hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;

                    var tokenObject = {
                        phone: phone,
                        id: tokenId,
                        expires: expires
                    }

                    //Store the token
                    _data.create('tokens', tokenId, tokenObject, function (err) {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {Error: 'Could not create new token'});
                        }
                    })
                } else {
                    callback(400, {Error: 'Password did not match the specified user\'s stored password'})
                }
            } else {
                callback(400, {Error: 'Could not find the specified user'})
            }
        })
    } else {
        callback(400, {Error: 'Missing required fields'})
    }
};

// Tokens - get
// Required data: id,
// Optional data: none
handlers._tokens.get = function(data, callback) {
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {
        // Lookup for the user
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404)
            }
        })
    } else {
        callback(404, {Error: "Missing required field"})
    }
};

// Tokens - put
// Required fields: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback) {
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if (id && extend) {
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                // Check to make sure that token is not already expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    //Store the new updates
                    _data.update('tokens', id, tokenData, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {Error: 'Could not update the token expiration'})
                        }
                    })
                } else {
                    callback(400, {Error: 'The token has already expired and cannot be extended'})
                }
            } else {
                callback(400, {Error: 'Specified token does not exist'});
            }
        })
    } else {
        callback(400, {Error: 'Missing required field(s), or field(s) is invalid'});
    }
};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback) {
    // Check id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {
        // Lookup for the token
        _data.delete('tokens', id, function (err) {
            if (!err) {
                callback(200);
            } else {
                callback(500, {Error: 'Could not delete the specified token'});
            }
        })
    } else {
        callback(404, {Error: "Missing required field"})
    }
};



// Verify if a given token id is currently valid for a given user

handlers._tokens.verifyToken = function(id, phone, callback) {
    //Look up the token
    _data.read('tokens', id, function (err, tokenData) {
        if (!err && tokenData) {
            // Check that token is for given user and has not expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false)
        }
    })
};

handlers.ping = function(data, callback) {
    callback(200);
};

// Not found handler
handlers.notFound = function (data, callback) {
    callback(404)
};

module.exports = handlers;