/*
* Helpers for a various task
*
*/

// Dependencies

var crypto = require('crypto');
var config = require('./config');

// Container for all the helpers
var helpers = {};

// Create SHA256 hash
helpers.hash = function(str) {
    if (typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON to an object in all casese, without throwing
helpers.parseJsonToObject = function(str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
};

// Create new string of a random alphanumeric characters, of a given length
helpers.createRandomString = function (strLength) {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;

    if (strLength) {
        // Define all possible characters that could be into a string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        //Start the final string
        var str = '';
        
        for (i = 0; i < strLength; i++) {
            // Get random character
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            //Append character
            str += randomCharacter;
        }

        return str;
    } else {
        return false;
    }
};










module.exports = helpers;