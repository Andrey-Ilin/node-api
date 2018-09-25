/*
*Primary file for API
* 
*/

// Dependencies
var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

// Instantiate http server
var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});

// Start the http server
httpServer.listen(config.httpPort, function () {
    console.log("Server is listening on port " + config.httpPort + " in " + config.envName + " mode")
});

// Instantiate https server
var httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/-cert.pem')
};

var httpsServers = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req, res);
});

// Start the https server
httpsServers.listen(config.httpsPort, function () {
    console.log("Server is listening on port " + config.httpsPort + " in " + config.envName + " mode")
});

// All the logic for http and https servers
var unifiedServer = function (req, res) {
    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    //Get the query string as an object

    var queryStringObject = parsedUrl.query;

    //Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the headers as an object

    var headers = req.headers;

    //Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('end', function () {
        buffer += decoder.end();

        //Choose the handler this request should do
        var choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //Construct data object to send to the handler
        var data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: buffer
        };

        //Route the request to the handler specified in the router

        choosenHandler(data, function (statusCode, payload) {
            //Use the status code defined by handler, or default 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            //Use the payload defined by the handler or default empty object
            payload = typeof(payload) == 'object' ? payload : {};

            //Convert payload to string
            var payloadString = JSON.stringify(payload);

            //Return response
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            //Log the request
            console.log('Returning this response: ', statusCode, payloadString);
        });
    });
};

// Define handlers
var handlers = {};

handlers.ping = function(data, callback) {
    callback(200);
};

// Not found handler
handlers.notFound = function (data, callback) {
    callback(404)
};

// Define a request routing
var router = {
    'ping': handlers.ping
};