/// //////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/// //////////////////////////////////////////////////////////////////

'use strict'; // http://www.w3schools.com/js/js_strict.asp

const config = require('config');
const ForgeSDK = require('forge-apis');

class Token {
	getTokenPublic (callback) {
		let clientId = config.get('credentials.client_id') || process.env.FORGE_CLIENT_ID;
		let clientSecret = config.get('credentials.client_secret') || process.env.FORGE_CLIENT_SECRET;

		let apiInstance = new ForgeSDK.AuthClientTwoLegged(clientId, clientSecret, config.get('scopePublic'), config.get('autoRefresh'));
		apiInstance.authenticate().then(function (data) {
			callback(data, apiInstance);
		});
	}

	getTokenInternal (callback) {
		let clientId = config.get('credentials.client_id');
		let clientSecret = config.get('credentials.client_secret');

		let apiInstance = new ForgeSDK.AuthClientTwoLegged(clientId, clientSecret, config.get('scopeInternal'), config.get('autoRefresh'));
		apiInstance.authenticate().then(function (data) {
			callback(data, apiInstance);
		});
	}
}

module.exports = Token;
