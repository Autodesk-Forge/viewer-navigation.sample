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
const app = require('./server/server');

// start server
app.listen(process.env.PORT || app.get('port'), function (server) {
	if (process.env.FORGE_CLIENT_ID == null || process.env.FORGE_CLIENT_SECRET == null)		{ console.log('*****************\nWARNING: Client ID & Client Secret not defined as environment variables.\n*****************'); }

	console.log('Starting at ' + (new Date()).toString());
	console.log('Server listening on port ' + app.get('port'));
});
