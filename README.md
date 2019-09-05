# viewer-navigation.sample

[![Node.js](https://img.shields.io/badge/Node.js-6.4.0-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-6.2.0-blue.svg)](https://www.npmjs.com/)
![Platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://opensource.org/licenses/MIT)

[![oAuth2](https://img.shields.io/badge/oAuth2-v1-green.svg)](http://forge.autodesk.com/)
[![ForgeSDK](https://img.shields.io/badge/ForgeSDK-0.2.7-green.svg)](http://forge.autodesk.com/)
[![Model-Derivative](https://img.shields.io/badge/Model%20Derivative-v2-green.svg)](http://forge.autodesk.com/)
[![Viewer](https://img.shields.io/badge/Viewer-v7.*-green.svg)](http://forge.autodesk.com/)
<!-- Coding Style -->
[![js-happiness-style](https://img.shields.io/badge/code%20style-happiness-brightgreen.svg)](https://github.com/JedWatson/happiness)

# Description

This sample demonstrates how to navigate on a model with 3D and 2D in sync.

### [Live Demo](https://autodesk-viewer-navigation.herokuapp.com/)

# Thumbnail
![thumbnail](/thumbnail.png)

# Setup

  - For using this sample, you need an Autodesk developer credentials. Visit the [Forge Developer Portal](https://developer.autodesk.com), sign up for an account, then [create an app](https://developer.autodesk.com/myapps/create). For this new app, use **http://localhost:3000/api/forge/callback/oauth** as Callback URL, although is not used on 2-legged flow. Finally take note of the **Client ID** and **Client Secret**.

  - This sample is hard-coded with the viewboxes for the specific Revit models:rac_basic_sample_project.rvt and rac_advanced_sample_project.rvt. you can find them in [Samples] folder of Revit installation path OR [Revit on-line help](https://knowledge.autodesk.com/support/revit-products/getting-started/caas/CloudHelp/cloudhelp/2018/ENU/Revit-GetStarted/files/GUID-61EF2F22-3A1F-4317-B925-1E85F138BE88-htm.html).

  - Please use other ways to upload the model file to translate the source model to the format for Forge Viewer in advance. Get the model base64 urn. Make sure the logic object name is consistent to what are defined in [viewboxes json](www/rac.json), e.g. **revithouse** and **racadvanced**

  - provide your client id, client secret, bucket name in [config.js](server/config.js)

### Run locally

Install [NodeJS](https://nodejs.org).

Clone this project or download it. It's recommended to install [GitHub desktop](https://desktop.github.com/). To clone it via command line, use the following (**Terminal** on MacOSX/Linux, **Git Shell** on Windows):

    git clone https://github.com/developer-autodesk/viewer-navigation.sample

To run it, install the required packages, set the enviroment variables with your client ID & secret and finally start it. Via command line, navigate to the folder where this repository was cloned and use the following:

Mac OSX/Linux (Terminal)

    npm install
    export FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    export FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    export FORGE_BUCKET=<<YOUR OWN UNIQUE BUCKET NAME - OPTIONAL>>  
    npm run dev

Windows (use **Node.js command line** from Start menu)

    npm install
    set FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    set FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    set FORGE_BUCKET=<<YOUR OWN UNIQUE BUCKET NAME - OPTIONAL>>
    npm run dev

Open the browser: [http://localhost:3000](http://localhost:3000).

To prepare the models, run the [Initial Setup](http://localhost:3000/forge/initialsetup) endpoint. This still under development, so there is not feedback... just access the endpoint to start the setup process, wait a few minutes to translate the models.

**Important:** do not use **npm start** locally, this is intended for PRODUCTION only with HTTPS (SSL) secure cookies.

### Deploy on Heroku

To deploy this application to Heroku, the **Callback URL** must use your .herokuapp.com address. After clicking on the button below, at the Heroku Create New App page, set your Client ID & Secret and the correct callback URL.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://dashboard.heroku.com/new?template=https://github.com/Autodesk-Forge/viewer-navigation.sample)

Watch [this video](https://www.youtube.com/watch?v=Oqa9O20Gj0c) on how deploy this sample to Heroku.

## Packages used

All Autodesk Forge NPM packages are included by default, see complete list of what's available at [NPM website](https://www.npmjs.com/browse/keyword/autodesk). Some other non-Autodesk packaged are used, including [express](https://www.npmjs.com/package/express).

# Tips & tricks

For local development/testing, consider use [nodemon](https://www.npmjs.com/package/nodemon) package, which auto restart your node application after any modification on your code. To install it, use:

    sudo npm install -g nodemon

Then, instead of **npm run dev**, use the following:

    npm run nodemon

Which executes **nodemon server.js --ignore www/**, where the **--ignore** parameter indicates that the app should not restart if files under **www** folder are modified.

## Troubleshooting

After installing Github desktop for Windows, on the Git Shell, if you see a ***error setting certificate verify locations*** error, use the following:

    git config --global http.sslverify "false"

# License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT).
Please see the [LICENSE](LICENSE) file for full details.

## Written by

Originally by Shen Hong (Autodesk China)

Updated by Augusto Goncalves (Forge Partner Development) & Bryan Huang (Forge Partner Development)

http://forge.autodesk.com
