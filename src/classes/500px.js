/*
 * 500px.js
 *
 * Copyright 2012 Koen Romers
 * http://www.koenromers.com
 */
var https = require('https'),
	mongo = require('../mongo');

// Constructor
function api_500px(options){
	this._host = 'api.500px.com';
	this._path = '/v1/';
	this._consumer_key = options.consumer_key || '';
	this._consumer_secret = options.consumer_secret || '';
}

api_500px.prototype = {
	getBasePath: function(){
		return this._path;	
	},
	getHost: function(){
		return this._host;
	},
	getConsumerKey: function(){
		return this._consumer_key;
	},
	getConsumerSecret: function(){
		return this._consumer_secret;
	},
	_executeCall: function(path){
		// Define request
		var options = {
			host: this.getHost(),
			path: path
		};

		// Https request to get data from 500px
		var req = https.get(options, function(res){
			// When there is data
			var data = '';
			res.on('data', function(d) {
				data += d;
			});
			// On end parse JSON
			res.on('end', function() {
				try {
					var json = JSON.parse(data);
					// Save json data to mongo
					if(json.photos){
						this.saveData(json.photos);
					} else {
						console.log('No result on 500px.');
					}
				} catch(e){
					console.log('Error parsing data 500px.');
				}
			}.bind(this));
		}.bind(this));
		// On error
		req.on('error', function(e) {
			console.log('API call 500px error: ' + e.message);
		});
	},
	doCall: function(options){
		var path = this.getBasePath() + options.method + '?consumer_key=' + this.getConsumerKey() + '&image_size[]=3&image_size[]=4';
		// Extra params
		if(options.showTags){
			path += '&tags=1';
		}
		if(options.rpp){
			path += '&rpp=' + options.rpp;
		}
		if(options.sort){
			path += '&sort=' + options.sort;
		}
		// Do calls based on terms or tags
		if(options.terms){
			options.terms.forEach(function(term){
				var newPath = path + '&term=' + term;
				this._executeCall(newPath);
			}.bind(this));
		} else if(options.tags){
			options.tags.forEach(function(tag){
				var newPath = path + '&tag=' + tag;
				this._executeCall(newPath);
			}.bind(this));
		} else {
			console.log('No keywords or tags found to search.');
			return false;
		}
	},
	saveData: function(photos){
		// Loop through photos
		photos.forEach(function(photo){
			// If there is an ID to check
			if(photo.id){
				// Check if photo is already there, based on external ID
				var record = mongo.Photo.findOne({
					externalID: photo.id
				}, function(err,item){
					if(err){
						console.log('Something went wrong saving this item.');
					} else if(!item){
						// Check if photo is in exceptions, based on external ID
						var exception = mongo.Exception.findOne({
							externalID: photo.id
						}, function(err,item){
							if(err){
								console.log('Something went wrong saving this item.');
							} else if(!item){
								// Save it
								var thumbnail = '';
								var image = '';
								// Get images from object
								if(photo.images){
									photo.images.forEach(function(picture){
										if(picture.size == 3){
											thumbnail = picture.url;
										}
										if(picture.size == 4){
											image = picture.url;
										}
									});
								}
								// Calculate interestingness based on views,comments,favorites
								var interestingness = this._calculateInterestingness(photo.times_viewed,photo.comments_count,photo.favorites_count);
								// If there is an image and thumbnail, save it
								if(thumbnail && image){
									var model = new mongo.Photo({
										externalID: photo.id,
										name: photo.name,
										description: photo.description,
										thumbnail: thumbnail,
										image: image,
										tags: photo.tags,
										interestingness: interestingness
									});
									model.save(this._saveDataSuccess);
								}
							}
						}.bind(this));
					}
				}.bind(this));
			}
		}.bind(this));
	},
	_saveDataSuccess: function(){
		console.log('save success for this picture of 500px!');
	},
	_calculateInterestingness: function(views,comments,favorites){
		var interestingness = 0;
		interestingness += parseInt(views);
		interestingness += parseInt(comments * 2);
		interestingness += parseInt(favorites * 3);
		if(interestingness > 0){
			return Math.round(interestingness / 3);
		}
		return 0;
	}
};

// Exports
module.exports = api_500px;