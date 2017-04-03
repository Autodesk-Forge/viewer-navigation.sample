function getModels() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", '/forge/models', false);
  xhr.send(null);
  return JSON.parse(xhr.responseText);
}

var viewModels = getModels();

var currentModel = 0;

var viewer3D;
var viewer2D;

var metadata;

var _blockEventMain = false;
var _blockEventSecondary = false;

document.addEventListener("DOMContentLoaded", function (event) {

  //  get and refresh token function
  var getToken = function () {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", '/forge/oauth/token', false);
    xhr.send(null);

    //var res = JSON.parse(xhr.responseText);
    return xhr.responseText;
  };

  //  viewer initializer
  function initialize() {
    var options = {
      env: "AutodeskProduction",
      getAccessToken: getToken,
      refreshToken: getToken
    };

    Autodesk.Viewing.Initializer(options, function () {

      var viewer3DContainer = document.getElementById("viewer3D");
      viewer3D = new Autodesk.Viewing.Private.GuiViewer3D(viewer3DContainer, {});

      var viewer2DContainer = document.getElementById("viewer2D");
      viewer2D = new Autodesk.Viewing.Private.GuiViewer3D(viewer2DContainer, {});

      viewer2D.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function (event) {
        viewer2D.toolbar.setVisible(false); // hide the tool bar in 2d viewer
      });

      viewer3D.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function (event) {
        panelDisabled = false;  // enable panel after geometry loaded
        initializeMarker();     // init marker layer
      });

      viewer3D.start();
      viewer2D.start();

      // select object with same dbId in 3d viewer
      viewer3D.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function (event) {
        if (_blockEventSecondary)
          return;
        _blockEventMain = true;
        viewer2D.select(viewer3D.getSelection());
        _blockEventMain = false;
      });

      // select object with same dbId in 2d viewer
      viewer2D.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function (event) {
        if (_blockEventMain)
          return;
        _blockEventSecondary = true;
        viewer3D.select(viewer2D.getSelection());
        _blockEventSecondary = false;
      });

      loadDocument(viewModels[currentModel].urn);
    });
  }

  initialize();
  metadata = JSON.parse(rac); // read hardwired location data for coordinate system mapping
  initializeControlPanel();   // init control panel
  initDraggableDiv();         // init draggable behavieor for viewer2D container

});

function loadDocument(urnStr, cb3d, cb2d) {

  viewer2D.

  // disable panel while loading document
  panelDisabled = true;

  // unload current loaded model
  viewer3D.impl.unloadModel(viewer3D.model);
  viewer2D.impl.unloadModel(viewer2D.model);

  var urn = "urn:" + urnStr;
  Autodesk.Viewing.Document.load(urn,

    // onSuccessCallback
    function (document) {
      var geometryItems3D = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {
        'type': 'geometry',
        'role': '3d'
      }, true);
      var geometryItems2D = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {
        'type': 'geometry',
        'role': '2d'
      }, true);

      viewer3D.load(document.getViewablePath(geometryItems3D[0]), null, function () {if (cb3d) cb3d();});
      viewer2D.load(document.getViewablePath(geometryItems2D[0]), null, function () {if (cb2d) cb2d();});
    },

    // onErrorCallback
    function (msg) {
      console.log("Error loading document: " + msg);
    }
  );
}