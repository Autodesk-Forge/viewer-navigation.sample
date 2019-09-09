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

// web framework
const express = require('express');
const router = express.Router();
const request = require('request');
const re = /(?:\.([^.]+))?$/; // regex to extract file extension

// forge config information, such as client ID and secret
const config = require('config');

// make requests for tokens
const Token = require('./token');

// forge

const ForgeSDK = require('forge-apis');
const myBucketKey = config.get('bucketName') || process.env.FORGE_BUCKET;
const errHandler = function (err, res) { console.log(err); if (res && res.status)res.status(500).json(err); };
// this end point will forgeLogoff the user by destroying the session
// as of now there is no Forge endpoint to invalidate tokens
router.get('/forge/oauth/token', (req, res) =>
  new Token().getTokenPublic(tokenPublic => res.status(200).end(tokenPublic.access_token))
);

router.get('/forge/models', (req, res) => {
	new Token().getTokenInternal((tokenInternal, apiInstance) => {
		let buckets = new ForgeSDK.BucketsApi();
		let objects = new ForgeSDK.ObjectsApi();

		buckets.getBuckets({}, apiInstance, tokenInternal).then(data => {
			let bucket = data.body.items.find(abucket => abucket.bucketKey === myBucketKey);

			if (bucket) {
				objects.getObjects(bucket.bucketKey, null, apiInstance, tokenInternal).then(data => {
					res.status(200).json(
            data.body.items.map(object => {
	return { id: object.objectKey.split('.')[0], label: object.objectKey, urn: toBase64(object.objectId) };
})
          );
				}, err => errHandler(err, res));
			}
		}, err => errHandler(err, res));
	});
});

router.get('/forge/initialsetup', (req, res) => {
	let path = require('path');

	uploadToOSS('revithouse.rvt', path.join(__dirname, '..', '/samples/rac_basic_sample_project.rvt'), req, res, () => {
		uploadToOSS('racadvanced.rvt', path.join(__dirname, '..', '/samples/rac_advanced_sample_project.rvt'), req, res, () => {
			res.end('setup completed!');
		});
	});
});

function uploadToOSS (fileName, filePath, req, res, callback) {
	new Token().getTokenInternal((tokenInternal, apiInstance) => {
		let buckets = new ForgeSDK.BucketsApi();
    //  let objects = new ForgeSDK.ObjectsApi()
		let postBuckets = new ForgeSDK.PostBucketsPayload();
		postBuckets.bucketKey = myBucketKey;
		postBuckets.policyKey = 'persistent';

		buckets.createBucket(postBuckets, null, apiInstance, tokenInternal).then(() => {
			let mineType = getMineType(filePath);
			let fs = require('fs');

			fs.readFile(filePath, function (err, filecontent) {
				if (err) { errHandler(err, res); res.status(500).end('Error occurred ...'); return; }
				request({
					url: 'https://developer.api.autodesk.com/oss/v2/buckets/' + myBucketKey + '/objects/' + fileName,
					method: 'PUT',
					headers: {
						'Authorization': 'Bearer ' + tokenInternal.access_token,
						'Content-Type': mineType
					},
					body: filecontent
				}, function (error, response) {
					if (error) { console.log(error); res.status(500).end('Error occurred ...'); return; }
          // now translate to SVF (Forge Viewer format)
					let bodyObj = JSON.parse(response.body);
					if (bodyObj.objectId) {
						let ossUrn = toBase64(bodyObj.objectId);

						let derivative = new ForgeSDK.DerivativesApi();
						derivative.translate(translateData(ossUrn), null, apiInstance, tokenInternal).then(data => {
							if (callback) callback(); else res.status(200).end();
						}, err => { errHandler(err, res); res.status(500).end('Error occurred ...'); });
					} else res.status(500).end('Error occurred ...');
				});
			});
		}, err => errHandler(err, res)
    );
	});
}

function getMineType (fileName) {
	let extension = re.exec(fileName)[1];
	let types = {
		'png': 'application/image',
		'jpg': 'application/image',
		'txt': 'application/txt',
		'ipt': 'application/vnd.autodesk.inventor.part',
		'iam': 'application/vnd.autodesk.inventor.assembly',
		'dwf': 'application/vnd.autodesk.autocad.dwf',
		'dwg': 'application/vnd.autodesk.autocad.dwg',
		'f3d': 'application/vnd.autodesk.fusion360',
		'f2d': 'application/vnd.autodesk.fusiondoc',
		'rvt': 'application/vnd.autodesk.revit'
	};
	return (types[extension] != null ? types[extension] : 'application/' + extension);
}

function translateData (ossUrn) {
	let postJob =
		{
			input: {
				urn: ossUrn
			},
			output: {
				formats: [
					{
						type: 'svf',
						views: ['2d', '3d']
					}
				]
			}
		};
	return postJob;
}

function toBase64 (val) {
	return Buffer.from(val).toString('base64');
};

module.exports = router;
