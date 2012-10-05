/*
 * photo.js
 * http://www.koenromers.com
 *
 * Copyright 2012
 *
 * Date: 05/10/2012
 * Author: Koen Romers
 */
var mongo = require('../mongo');

var routes = {
	index: function(req, res) {
		mongo.Photo.find(function(err,photos){
			res.send(200, {
				results: photos,
				total: photos.length
			});
		});	
	},
	list: function(req, res){
		mongo.Photo.find(null,null,{
			limit:req.params.limit
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
	destroy: function(req, res){
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
				tags: req.body.tags
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
		app.get('list/:limit', routes.list);
		app.get('search/:keyword', routes.search);
		app.get('random', routes.random);
		app.del(':externalID', routes.destroy);
		app.post('', routes.create);
	}
}