/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var config = require('./config/environment');
var models = require('./models');
var offlineQueryRunner = require('./headless');
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'digapp',
    streams: [{
        path: 'digapp.log',
        // `type: 'file'` is implied
    }]
});

// create a logger instance 
// (see http://docs.sequelizejs.com/en/latest/api/sequelize/)
// TODO: create a rolling log instance.
models.sequelize.options.logging=function(loginfo) {
    log.info(loginfo);
}

// Populate DB with sample data        
if(config.seedDB) {require('./config/seedsql');}

// Setup server
var app = express();
var server = require('http').createServer(app);

require('./config/express')(app);
require('./routes')(app);

app.models = models;
app.log = log;

models.sequelize.sync()
.then(function () {
    // start saved scheduled query runner
    offlineQueryRunner(log);
    server.listen(config.port, config.ip, function () {
        console.log('Express server listening on %d, in %s mode', 
            config.port, app.get('env'));
    });

});

// Expose app
exports = module.exports = app;