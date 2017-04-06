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

// web framework
var express = require('express');
var router = express.Router();
var request = require('request');

// forge config information, such as client ID and secret
var config = require('./config');

// make requests for tokens
var token = require('./forge.token');

// forge
var ForgeModelDerivative = require('forge-model-derivative');
var ForgeOSS = require('forge-oss');

// this end point will forgeLogoff the user by destroying the session
// as of now there is no Forge endpoint to invalidate tokens
router.get('/forge/oauth/token', function (req, res) {
  var t = new token();
  t.getTokenPublic(function (tokenPublic) {
    res.status(200).end(tokenPublic);
  })
});

var ossBucketKey = process.env.FORGE_BUCKET || 'navigationsample3d2d';

router.get('/forge/models', function (req, res) {
  var t = new token();
  t.getTokenInternal(function (tokenInternal) {
    var ossClient = ForgeOSS.ApiClient.instance;
    var ossOAuth = ossClient.authentications ['oauth2_application']; // not the 'oauth2_access_code', as per documentation
    ossOAuth.accessToken = tokenInternal;
    var buckets = new ForgeOSS.BucketsApi();
    var objects = new ForgeOSS.ObjectsApi();

    buckets.getBuckets({limit: 100}).then(function (data) {
      data.items.forEach(function (bucket) {
        if (bucket.bucketKey.indexOf(ossBucketKey) == 0) {
          objects.getObjects(bucket.bucketKey).then(function (data) {
            var models = [];
            data.items.forEach(function (object) {
              models.push({id: object.objectKey.split('.')[0], label: object.objectKey, urn: object.objectId.toBase64()});
            });
            res.status(200).json(models);
          });
        }
      });
    });
  });
});

router.get('/forge/initialsetup', function (req, res) {
  var path = require('path');

  uploadToOSS('revithouse.rvt', path.join(__dirname, '..', '/samples/rac_basic_sample_project.rvt'), req, res, function () {
    uploadToOSS('racadvanced.rvt', path.join(__dirname, '..', '/samples/rac_advanced_sample_project.rvt'), req, res, function () {
      res.end("setup completed!");
    });
  });

});

function uploadToOSS(fileName, filePath, req, res, callback) {
  var t = new token();
  t.getTokenInternal(function (tokenInternal) {

    var ossObjectName = fileName;

    //
    var ossClient = ForgeOSS.ApiClient.instance;
    var ossOAuth = ossClient.authentications ['oauth2_application']; // not the 'oauth2_access_code', as per documentation
    ossOAuth.accessToken = tokenInternal;
    var buckets = new ForgeOSS.BucketsApi();
    var objects = new ForgeOSS.ObjectsApi();
    var postBuckets = new ForgeOSS.PostBucketsPayload();
    postBuckets.bucketKey = ossBucketKey;
    postBuckets.policyKey = "persistent";

    // promise will treat 409 as error, but let's handle it
    buckets.createBucket(postBuckets, null, function (err, data, response) {
      if (err) {
        if (err.statusCode!=409) {
          console.log('Error creating bucket ' + err);
          return;
        }
      }

      // upload to Forge OSS
      var mineType = getMineType(filePath);
      var fs = require('fs');
      fs.readFile(filePath, function (err, filecontent) {
        request({
          url: 'https://developer.api.autodesk.com/oss/v2/buckets/' + ossBucketKey + '/objects/' + ossObjectName,
          method: "PUT",
          headers: {
            'Authorization': 'Bearer ' + tokenInternal,
            'Content-Type': mineType
          },
          body: filecontent
        }, function (error, response, body) {
          if (error) {console.log(error); return;}

          // now translate to SVF (Forge Viewer format)
          var ossUrn = JSON.parse(body).objectId.toBase64();

          var mdClient = ForgeModelDerivative.ApiClient.instance;
          var mdOAuth = mdClient.authentications ['oauth2_access_code'];
          mdOAuth.accessToken = tokenInternal;

          var derivative = new ForgeModelDerivative.DerivativesApi();
          derivative.translate(translateData(ossUrn), null).then(function (data) {
          }).catch(function (e) {
            console.log(e);
          });

          if (callback)
            callback();
        });
      });
    });
  });
}


var re = /(?:\.([^.]+))?$/; // regex to extract file extension

function getMineType(fileName) {
  var extension = re.exec(fileName)[1];
  var types = {
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

function translateData(ossUrn) {
  var postJob =
  {
    input: {
      urn: ossUrn
    },
    output: {
      formats: [
        {
          type: "svf",
          views: ["2d", "3d"]
        }
      ]
    }
  };
  return postJob;
}

String.prototype.toBase64 = function () {
  return new Buffer(this).toString('base64');
};

module.exports = router;