/*
* Library for storing and editing data
*
*/

// Dependencies
var fs = require('fs');
var path = require('path');

// Container for the module (to be exported)

var lib = {};

// Base directory for data folder

lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = function(dir,file,data,callback) {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Convert data to string
            var stringData = JSON.stringify(data);

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, function (err) {
                if (!err) {
                    fs.close(fileDescriptor, function (err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    })
                } else {
                    callback('Error to writing to new file');
                }
            })
        } else {
            callback('Could not create new file, it may already exist');
        }
    })
};

// Read data from file

lib.read = function(dir,file,callback) {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', function (err, data) {
        callback(err, data);
    })
};

lib.update = function(dir,file,data,callback) {
    //Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Convert data to string
            var stringData = JSON.stringify(data);

            // Truncate the file
            fs.ftruncate(fileDescriptor, function (err) {
                if(!err) {
                    // Write to the file and close
                    fs.writeFile(fileDescriptor, stringData, function (err) {
                        if (!err) {
                            fs.close(fileDescriptor, function (err) {
                                if (!err) {
                                    callback(false);
                                } else
                                    callback('Error closing the file')
                            })
                        } else {
                            callback('Error writing to existing file')
                        }
                    })
                } else {
                    callback('Error truncating file')
                }
            })
        } else {
            callback('Could not open the file for updating, it may not exist')
        }
    })
};

//Delete file

lib.delete = function(dir,file,callback) {
    //Unlink the file
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
        if(!err) {
            callback(false);
        } else {
            callback('Error deleting the file');
        }
    })
};

//Export the module

module.exports = lib;