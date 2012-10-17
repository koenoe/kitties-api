/*
 * photo.js
 *
 * Copyright 2012 Koen Romers
 * http://www.koenromers.com
 */
var mongo = require('../mongo');
var config = require('../../config');

function checkSecurityHash(req,res,callback) {
	mongo.SecurityHash.findOne({
		hash: config.securityHash
	}, function(err, doc) {
		if (err) {
			res.send(400,{
				error: 'Something went wrong checking the security hash.'
			});
		} else if (!doc) {
			res.send(403,{
				error: 'Invalid security hash.'
			});
		} else {
			callback(req,res);
		}
	});
};

function destroyPhoto(req,res){
	mongo.Photo.findOne({
		externalID: req.params.externalID
	}, function(err,photo){
		if(err){
			res.send(400,{
				error: 'Something went wrong removing this photo.'
			});
		}
		if(!photo){
			res.send(404,{
				error: 'Photo not found.'
			});
		} else {
			// Remove from photos collection
			photo.remove(function(err, result){
				if(!err){
					// Add to exceptions collection
					var model = new mongo.Exception({
						externalID: req.params.externalID
					});
					model.save(function(err,exception){
						if(!err){
							res.send(200, {
								message: 'Photo successfully removed and added to exceptions.'
							});
						}
					});
				}
			});
		}
	});
};

function createPhoto(req,res){
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
};

function getSorting(req){
	var sorting = {'time': -1};
	if(req.query.sort == 'interestingness'){
		sorting = {'interestingness': -1};
	}
	return sorting;
};

var routes = {
	index: function(req, res) {
		mongo.Photo.find(null,null,{
			sort: getSorting(req)
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
			sort: getSorting(req)
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
		checkSecurityHash(req,res,destroyPhoto);
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
				photo.reported = (req.body.reported == 'true' ? true : false);
				photo.interestingness = req.body.interestingness || photo.interestingness;
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
		checkSecurityHash(req,res, createPhoto);
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
		app.del(':externalID', routes.destroy);
		app.put(':externalID', routes.update);
		app.post('', routes.create);
	}
}