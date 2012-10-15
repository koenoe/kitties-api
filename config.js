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
	// Security hash for some functions
	config.securityHash = process.env.SECURITY_HASH || "";
	// Api keys
	config.apiKey500px = process.env.KEY_500PX || "";
	config.apiSecret500px = process.env.SECRET_500PX || "";
	config.apiKeyFlickr = process.env.KEY_FLICKR || "";
	config.apiSecretFlickr = process.env.SECRET_FLICKR || "";
} else {
	// Mongo configuration
	config.mongoUri = "mongodb://localhost/photos";
	// Security hash for some functions
	config.securityHash = "123456";
	// Api keys
	config.apiKey500px = "QAevASFNU0CYQ4Ryvs3Fs42JH1Y0rQozZrbfAmju";
	config.apiSecret500px = "ViTsZM3uYYUSqzleddxBinzagPkx68ng2RnGupXg";
	config.apiKeyFlickr = "e46c6b70ba7ada632df962c7dc980b51";
	config.apiSecretFlickr = "77bed8eb5f5e2cdc";
}


module.exports = config;
