/*
 * flickr.js
 *
 * Copyright 2012 Koen Romers
 * http://www.koenromers.com
 */
var http = require('http'),
	mongo = require('../mongo');

// Constructor
function api_flickr(options){
	this._host = 'api.flickr.com';
	this._path = '/services/rest/?format=json&nojsoncallback=1';
	this._api_key = options.api_key || '';
	this._api_secret = options.api_secret || '';

	this._photos = {};
}

api_flickr.prototype = {
	getBasePath: function(){
		return this._path;
	},
	getHost: function(){
		return this._host;
	},
	getApiKey: function(){
		return this._api_key;
	},
	getApiSecret: function(){
		return this._api_secret;
	},
	_setPhoto: function(id,photo){
		this._photos[id] = photo;
	},
	_getPhoto: function(id){
		if(this._photos[id]){
			return this._photos[id];
		}
		return false;
	},
	_getPhotos: function(){
		return this._photos;
	},
	_search: function(path){
		// Define request
		var options = {
			host: this.getHost(),
			path: path
		};

		// Https request to search in flickr
		var req = http.get(options, function(res){
			// When there is data
			var data = '';
			res.on('data', function(d) {
				data += d;
			});
			// On end parse JSON
			res.on('end', function() {
				try {
					var json = JSON.parse(data);
					if(json.photos && json.photos.photo){
						json.photos.photo.forEach(function(photo){
							var info = {
								externalID: photo.id
							};
							this._setPhoto(photo.id, info);
						}.bind(this));

						this._getImageDetails();

					} else {
						console.log('No search result on flickr.');
					}
				} catch(e){
					console.log('Error parsing search results flickr.', e);
				}
			}.bind(this));
		}.bind(this));
		// On error
		req.on('error', function(e) {
			console.log('API call search flickr error: ' + e.message);
		});
	},
	_getInfo: function(path, id){
		// Define request
		var options = {
			host: this.getHost(),
			path: path
		};

		// Https request to search in flickr
		var req = http.get(options, function(res){
			// When there is data
			var data = '';
			res.on('data', function(d) {
				data += d;
			});
			// On end parse JSON
			res.on('end', function() {
				try {
					var json = JSON.parse(data);
					if(json.photo){

						var photo = this._getPhoto(id);
						
						var tags = [];
						if(json.photo.tags && json.photo.tags.tag){
							json.photo.tags.tag.forEach(function(tag){
								tags.push(tag._content);
							});
						}

						var extraInfo = {
							name: json.photo.title._content,
							description: json.photo.description._content,
							tags: tags,
							views: json.photo.views,
							comments: json.photo.comments._content
						};
						
						photo = this.mergeObj(photo,extraInfo);
						this._setPhoto(id,photo);

						this._saveToDb(photo);

					} else {
						console.log('No image info found for this picture.');
					}
				} catch(e){
					console.log('Error parsing image info for this picture.', e);
				}
			}.bind(this));
		}.bind(this));
		// On error
		req.on('error', function(e) {
			console.log('API call search flickr error: ' + e.message);
		});
	},
	_getSizes: function(path, id){
		// Define request
		var options = {
			host: this.getHost(),
			path: path
		};

		// Https request to search in flickr
		var req = http.get(options, function(res){
			// When there is data
			var data = '';
			res.on('data', function(d) {
				data += d;
			});
			// On end parse JSON
			res.on('end', function() {
				try {
					var json = JSON.parse(data);
					if(json.sizes && json.sizes.size){
						
						var thumbnail = '';
						var image = '';
						json.sizes.size.forEach(function(size){
							if(size.label == 'Large'){
								image = size.source;
							}
							if(size.label == 'Large Square'){
								thumbnail = size.source;
							}
						}.bind(this));

						if(thumbnail && image){
							var extraInfo = {
								image: image,
								thumbnail: thumbnail
							};
							var photo = this._getPhoto(id);
							photo = this.mergeObj(photo,extraInfo);
							this._setPhoto(id,photo);

							this.doCall({
								method: 'flickr.photos.getFavorites',
								photo_id: id
							});
						}

					} else {
						console.log('No image sizes found for this picture.');
					}
				} catch(e){
					console.log('Error parsing image sizes for this picture.', e);
				}
			}.bind(this));
		}.bind(this));
		// On error
		req.on('error', function(e) {
			console.log('API call search flickr error: ' + e.message);
		});
	},
	_getFavoriteCount: function(path, id){
		// Define request
		var options = {
			host: this.getHost(),
			path: path
		};

		// Https request to search in flickr
		var req = http.get(options, function(res){
			// When there is data
			var data = '';
			res.on('data', function(d) {
				data += d;
			});
			// On end parse JSON
			res.on('end', function() {
				try {
					var json = JSON.parse(data);
					
					var favorites = 0;
					if(json.photo.total){
						favorites = json.photo.total;
					}

					var extraInfo = {
						favorites: favorites
					};

					var photo = this._getPhoto(id);
					photo = this.mergeObj(photo,extraInfo);
					this._setPhoto(id,photo);

					this.doCall({
						method: 'flickr.photos.getInfo',
						photo_id: id
					});

				} catch(e){
					console.log('Error parsing favorite count for this picture.', e);
				}
			}.bind(this));
		}.bind(this));
		// On error
		req.on('error', function(e) {
			console.log('API call search flickr error: ' + e.message);
		});
	},
	_getImageDetails: function(){
		var photos = this._getPhotos();
		if(photos){
			for(var id in photos){
				var photo = photos[id];
				this.doCall({
					method: 'flickr.photos.getSizes',
					photo_id: photo.externalID
				});
			}
		}
	},
	doCall: function(options){
		var path = this.getBasePath() + '&method=' + options.method + '&api_key=' + this.getApiKey();
		// Extra params
		if(options.per_page){
			path += '&per_page=' + options.per_page;
		}
		if(options.sort){
			path += '&sort=' + options.sort;
		}

		switch(options.method){
			case 'flickr.photos.search':
				if(options.text){
					options.text.forEach(function(keyword){
						var newPath = path + '&text=' + keyword;
						this._search(newPath);
					}.bind(this));
				}
				if(options.tags){
					options.tags.forEach(function(tag){
						var newPath = path + '&tags=' + tag;
						this._search(newPath);
					}.bind(this));
				}
			break;
			case 'flickr.photos.getInfo': 
				if(options.photo_id){
					var newPath = path + '&photo_id=' + options.photo_id;
					this._getInfo(newPath, options.photo_id);
				}
			break;
			case 'flickr.photos.getSizes':
				if(options.photo_id){
					var newPath = path + '&photo_id=' + options.photo_id;
					this._getSizes(newPath, options.photo_id);
				}
			break;
			case 'flickr.photos.getFavorites':
				if(options.photo_id){
					var newPath = path + '&photo_id=' + options.photo_id;
					this._getFavoriteCount(newPath, options.photo_id);
				}
			break;
		}
		return false;
	},
	_saveToDb: function(photo){
		// Check if photo is already there, based on external ID
		var record = mongo.Photo.findOne({
			externalID: photo.externalID
		}, function(err,item){
			if(err){
				console.log('Something went wrong saving this item.');
			} else if(!item){
				// Check if photo is in exceptions, based on external ID
				var exception = mongo.Exception.findOne({
					externalID: photo.externalID
				}, function(err,item){
					if(err){
						console.log('Something went wrong saving this item.');
					} else if(!item){
						// Save it
						var interestingness = this._calculateInterestingness(photo.views,photo.comments,photo.favorites);
						if(interestingness > 0){
							var model = new mongo.Photo({
								externalID: photo.externalID,
								name: photo.name,
								description: photo.description,
								thumbnail: photo.thumbnail,
								image: photo.image,
								tags: photo.tags,
								interestingness: interestingness
							});
							model.save(this._saveDataSuccess);
						}
					}
				}.bind(this));
			}
		}.bind(this));
	},
	_saveDataSuccess: function(){
		console.log('save success for this picture of flickr!');
	},
	_calculateInterestingness: function(views,comments,favorites){
		var interestingness = 0;
		// interestingness += parseInt(views);
		interestingness += parseInt(comments);
		interestingness += parseInt(favorites);
		if(interestingness > 0){
			return interestingness;
		}
		return 0;
	},
	mergeObj: function(obj1,obj2){
		var obj3 = {};
		for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
		for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
		return obj3;
	}
};

// Exports
module.exports = api_flickr;