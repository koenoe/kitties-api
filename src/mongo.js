/*
 * mongo.js
 * http://www.koenromers.com
 *
 * Copyright 2012
 *
 * Date: 05/10/2012
 * Author: Koen Romers
 */
// Imports
var mongoose = require('mongoose');

// Create new schemas as Mongoose Schema
var Schema = mongoose.Schema;

// Photo
var PhotoSchema = new Schema({
	externalID: {type: String, required: true, unique: true},
	name: {type: String},
	description: {type: String},
	thumbnail: {type: String, required: true},
	image: {type: String, required: true},
	tags: [String]
});

// Exception
var ExceptionSchema = new Schema({
	externalID: {type: String, required: true, unique: true}
});

// Connect to mongoDB
var connect = function(callback){
	mongoose.connect('mongodb://localhost/photos', callback);
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