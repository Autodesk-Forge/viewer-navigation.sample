/////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////

'use strict'; // http://www.w3schools.com/js/js_strict.asp

var config = require('./config');

function Token() {
}

Token.prototype.getTokenPublic = function (callback) {
  var ForgeOauth2 = require('forge-oauth2');
  var apiInstance = new ForgeOauth2.TwoLeggedApi();
  var clientId = config.credentials.client_id;
  var clientSecret = config.credentials.client_secret;
  var grantType = "client_credentials";
  var opts = {'scope': config.scopePublic};
  apiInstance.authenticate(clientId, clientSecret, grantType, opts).then(function (data) {
    callback(data.access_token);
  });
};

Token.prototype.getTokenInternal = function (callback) {
  var ForgeOauth2 = require('forge-oauth2');
  var apiInstance = new ForgeOauth2.TwoLeggedApi();
  var clientId = config.credentials.client_id;
  var clientSecret = config.credentials.client_secret;
  var grantType = "client_credentials";
  var opts = {'scope': config.scopeInternal};
  apiInstance.authenticate(clientId, clientSecret, grantType, opts).then(function (data) {
    callback(data.access_token);
  });
};

module.exports = Token;
