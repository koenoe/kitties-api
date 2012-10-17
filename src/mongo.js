/*
 * mongo.js
 *
 * Copyright 2012 Koen Romers
 * http://www.koenromers.com
 */
// Imports
var mongoose = require('mongoose');
var config = require('../config');

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
	interestingness: {type: Number, default: 0, index: {background: true}}
});

// Exception
var ExceptionSchema = new Schema({
	externalID: {type: String, required: true, unique: true, index: {background: true}}
});

// Security hashes
var SecurityHashSchema = new Schema({
	hash: {type: String, required: true, unique: true, index: {background: true}}
});

// Connect to mongoDB
var connect = function(callback){
	mongoose.connect(config.mongoUri, callback);
}

// Exports
module.exports = {
	Photo: mongoose.model('Photo', PhotoSchema),
	Exception: mongoose.model('Exception', ExceptionSchema),
	SecurityHash: mongoose.model('SecurityHash', SecurityHashSchema),
	schemes: {
		PhotoSchema: PhotoSchema,
		ExceptionSchema: ExceptionSchema,
		SecurityHashSchema: SecurityHashSchema
	},
	connect: connect
};