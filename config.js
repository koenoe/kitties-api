/*
 * config.js
 *
 * Copyright 2012 Koen Romers
 * http://www.koenromers.com
 */

var config = {};

if(process.env.NODE_ENV == 'production'){
	// Mongo configuration
	config.mongoUsername = process.env.MONGO_USERNAME || "";
	config.mongoPassword = process.env.MONGO_PASSWORD || "";
	config.mongoUri = "mongodb://"+config.mongoUsername+":"+config.mongoPassword+"@ds037647.mongolab.com:37647/kitties-api";
} else {
	// Mongo configuration
	config.mongoUri = "mongodb://localhost/photos";
}

// Security hash for some functions
config.securityHash = process.env.SECURITY_HASH || "85898ad39c0480f68948d81ef307b78e";


module.exports = config;
