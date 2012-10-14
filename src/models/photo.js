/*
 * photo.js
 *
 * Copyright 2012 Koen Romers
 * http://www.koenromers.com
 */
var mongo = require('../mongo');

function getClientIp(req) {
	var ipAddress = null;
	var forwardedIpsStr = req.header('x-forwarded-for'); 
	if (forwardedIpsStr) {	
		var forwardedIps = forwardedIpsStr.split(',');
		ipAddress = forwardedIps[0];
	}
	if (!ipAddress) {
		ipAddress = req.connection.remoteAddress;
	}
	return ipAddress;
};

var routes = {
	index: function(req, res) {
		mongo.Photo.find(null,null,{
			sort: { 'time': -1 }
		},function(err,photos){
			res.send(200, {
				results: photos,
				total: photos.length
			});
		});	
	},
	total: function(req, res) {
		mongo.Photo.count(function(err,result){
			res.send(200, {
				total: result
			});
		});	
	},
	list: function(req, res){
		mongo.Photo.find(null,null,{
			limit:req.params.limit,
			skip: req.params.skip || 0,
			sort: { 'time': -1 }
		},function(err,photos){
			res.send(200, {
				results: photos
			});
		});
	},
	search: function(req, res){
		var keyword = decodeURIComponent(req.params.keyword.replace('-',' '));
		var reg = new RegExp(keyword, 'i');

		mongo.Photo.find().or([
			{ name: { $regex: reg }}, 
			{ description: { $regex: reg }},
			{ tags: { $regex: reg }}
		]).exec(function(err, photos) {
			res.send(200, {
				results: photos,
				total: photos.length
			});
		});
	},
	random: function(req, res){
		mongo.Photo.count(function(err,count) {
			var num = Math.floor(Math.random() * count) + 1;
			mongo.Photo.find(null,null,{
				limit: -1,
				skip: num
			},function(err,photo){
				res.send(200, {
					random: photo
				});
			});
		});
	},
	reported: function(req, res){
		mongo.Photo.find({ reported: true }, function(err,photos){
			res.send(200, {
				results: photos,
				total: photos.length
			});
		});	
	},
	destroy: function(req, res){

		if(process.env.NODE_ENV == 'production' && getClientIp(req) != "213.46.88.138"){
			res.send(403, {
				message: "This method is not available for you."
			});
			return false;
		}

		// Remove all reported pictures
		mongo.Photo.find({ reported: true }, function(err,photos){
			if(photos.length > 0){
				async.waterfall(
					[
						function(callback) {
							var i = 0;
							photos.forEach(function(photo){
								// Add to exceptions collection
								var model = new mongo.Exception({
									externalID: photo.externalID
								});
								model.save(function(err,exception){
									if(!err){
										i++;
									}
								});
							});
							if(i == photos.length){
								callback(null, photos);
							}
						},
						function(photos, callback) {
							var i = 0;
							photos.forEach(function(photo){
								photo.remove(function(err, result){
									if(!err){
										i++;
									}
								});
							});
							if(i == photos.length){
								callback(null, true);
							}
						}					
					],
					function(err, success) {
						if(success){
							res.send(200,{
								message: 'Reported images successfully destroyed.'
							});
							return false;
						}
						if(err){
							res.send(400,{
								error: 'Something went wrong destroying reported images.'
							});
							return false;
						}
					}
				);
				
			} else {
				res.send(404, {
					message: 'No reported images found.'
				});
			}
		});
	},
	update: function(req, res){
		mongo.Photo.findOne({
			externalID: req.params.externalID
		}, function(err, photo) {
			if (err) {
				res.send(400,{
					error: 'Something went wrong updating this photo.'
				});
			} else if (!photo) {
				res.send(404,{
					error: 'Photo not found.'
				});
			} else {
				photo.interestingness = req.body.interestingness || photo.interestingness;
				photo.reported = req.body.reported || photo.reported;
				photo.save(function(err, photo) {
					if(!err){
						res.send(200, {
							message: 'Photo successfully updated.'
						});
					}
				});
			}
		});
	},
	create: function(req, res){
		if(!req.body.externalID || !req.body.name || !req.body.image || !req.body.thumbnail){
			res.send(400, {
				error: 'Object is missing fields.'
			});
		} else {
			var model = new mongo.Photo({
				externalID: req.body.externalID,
				name: req.body.name,
				description: req.body.description,
				thumbnail: req.body.thumbnail,
				image: req.body.image,
				tags: req.body.tags,
				interestingness: req.body.interestingness
			});
			model.save(function(err,photo){
				if(!err){
					res.send(200, {
						message: 'Photo successfully added.',
						_id: photo._id
					});
				}
			});
		}
	}
};

// Exports
module.exports = function(app) {
	return function() {
		app.get('', routes.index);
		app.get('total', routes.total);
		app.get('list/:limit', routes.list);
		app.get('list/:limit/:skip', routes.list);
		app.get('search/:keyword', routes.search);
		app.get('random', routes.random);
		app.get('reported', routes.reported);
		app.del('', routes.destroy);
		app.put(':externalID', routes.update);
		app.post('', routes.create);
	}
}