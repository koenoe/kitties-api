/*
 * app.js
 *
 * Copyright 2012 Koen Romers
 * http://www.koenromers.com
 */

// Module dependencies
var express = require('express'),
	mongoose = require('mongoose'),
	cronJob = require('cron').CronJob,
	namespace = require('express-namespace'),
	config = require('./config'),
	mongo = require('./src/mongo'),
	model = require('./src/models'),
	_api_500px = require('./src/classes/500px.js'),
	_api_flickr = require('./src/classes/flickr.js'),
	app = express();

// Connect to Mongo
mongo.connect(function(error) {
	if(error) {
		console.log('MongoDB error: ', error);
		process.exit(1);
	}
});

// App configuration
app.configure(function(){
	app.set('port', process.env.PORT || 3001);
	app.use(express.favicon());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
});
app.configure('development', function() {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
	app.use(express.errorHandler());
});

// App start
app.listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

// Namespaces
app.namespace('/', model.photo(app));

// Cronjob 500px
new cronJob('0 */10 * * * *', function(){
	var api_500px = new _api_500px({
		consumer_key: config.apiKey500px,
		consumer_secret: config.apiSecret500px
	});
	
	api_500px.doCall({
		method: 'photos/search',
		// terms: ['kitten'],
		tags: ['kitten'],
		showTags: true,
		rpp: 100,
		sort: 'created_at',
		// sort: 'rating'
	});
}, null, true);

// Cronjob Flickr
new cronJob('0 */10 * * * *', function(){
	var api_flickr = new _api_flickr({
		api_key: config.apiKeyFlickr,
		api_secret: config.apiSecretFlickr
	});
	
	api_flickr.doCall({
		method: 'flickr.photos.search',
		// text: ['kitten'],
		tags: ['kitten'],
		per_page: 100,
		sort: 'date-posted-desc'
		// sort: 'interestingness-desc'
	});
}, null, true);
