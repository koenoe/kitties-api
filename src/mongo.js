/*
 * mongo.js
 *
 * Copyright 2012 Koen Romers
 * http://www.koenromers.com
 */
// Imports
var mongoose = require('mongoose');

// Create new schemas as Mongoose Schema
var Schema = mongoose.Schema;

// Photo
var PhotoSchema = new Schema({
	time: {type: Date, default: Date.now, index: {background: true}},
	externalID: {type: String, required: true, unique: true, index: {background: true}},
	name: {type: String},
	description: {type: String},
	thumbnail: {type: String, required: true},
	image: {type: String, required: true},
	tags: [String],
	reported: {type: Boolean, default: false},
	interestingness: {type: Number, default: 0}
});

// Exception
var ExceptionSchema = new Schema({
	externalID: {type: String, required: true, unique: true, index: {background: true}}
});

// Connect to mongoDB
var connect = function(callback){
	if(process.env.NODE_ENV == 'production'){
		mongoose.connect('mongodb://koenoe:3Baco900@ds037647.mongolab.com:37647/kitties-api',callback);
	} else {
		mongoose.connect('mongodb://localhost/photos', callback);
	}
}

// Exports
module.exports = {
	Photo: mongoose.model('Photo', PhotoSchema),
	Exception: mongoose.model('Exception', ExceptionSchema),
	schemes: {
		PhotoSchema: PhotoSchema,
		ExceptionSchema: ExceptionSchema
	},
	connect: connect
};