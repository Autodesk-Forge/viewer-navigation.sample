
var modelStates = [];   // saved viewstates for the models
var resizeEvt;          // custom resize event for control panel

var panelDisabled = true;


    // init the left control panel
function initializeControlPanel() {

    loadModelList();

        // collapse button for the panel
    var panelBtn = document.getElementById("panelBtn");
    panelBtn.addEventListener("click", toggleControlPanel);

        // save view state button
    var saveBtn = document.getElementById("saveBtn");
    saveBtn.addEventListener("click", saveCurrentViewState);

        // attach mouse events to table cell buttons and labels
    var cellBtns = document.querySelectorAll(".table-list .table-cell .cell-btn");
    for (var i = 0; i < cellBtns.length; i++) {

        var cellBtn = cellBtns[i];
        cellBtn.addEventListener("click", function() {

            var cellId = this.parentElement.id;
            var modelIndex = parseInt(cellId.substring(cellId.length-1, cellId.length));

            toggleTableList(modelIndex);

        });

        var cellLabel = cellBtn.nextElementSibling;
        cellLabel.addEventListener("click", function() {

            if (panelDisabled)  // disabled while the viewer is still loading geometry of last model
                return;

            var cellId = this.parentElement.id;
            var modelIndex = parseInt(cellId.substring(cellId.length-1, cellId.length));

                // switch to a different model
            if (modelIndex !== currentModel) {
                currentModel = modelIndex;
                viewer2D.container.removeChild(marker.layer);   // remove current marker layer
                loadDocument(viewModels[currentModel].urn);     // reload viewable document
                markerPlaced = false;                           // reset marker
            };
        });
    };

    resizeEvt = new CustomEvent("panelresize");

        // we need to manually trigger here for panel collapse, as it's a customized event
    document.addEventListener("panelresize", function (evt) {
        viewer3D.resize();
        viewer2D.resize();
    });

        // update local storage before window or tab unloads
    window.addEventListener("beforeunload", function() {
        updateLocalStorage();
    });

        // get the previously saved viewstates from local storage
    loadViewStateList();
}


    // display or hide the control panel
function toggleControlPanel() {

    var controlPanel = document.getElementsByClassName("control-panel")[0];
    var viewerPanel = document.getElementsByClassName("viewer-panel")[0];
    
    if (controlPanel.offsetWidth > 0) {

            // hide table in panel
        controlPanel.firstElementChild.style.display = "none";
        controlPanel.style.width = "0";

            // left shift collapse button
        this.style.left = "-4px";
        this.className = "collapse-btn right-round-btn icon icon-angle-circled-right";

            // left shift savestate button
        this.nextElementSibling.style.left = "-4px";
        this.nextElementSibling.className = "collapse-btn right-round-btn icon icon-plus";

            // hide panel
        viewerPanel.style.left = "0px";
        viewerPanel.style.width = "100%";

    } else {

            // show table in panel
        controlPanel.firstElementChild.style.display = "block";
        controlPanel.style.width = "22%";

            // right shift collapse button
        this.style.left = "calc(22% - 42px)";
        this.className = "collapse-btn left-round-btn icon icon-angle-circled-left";

            // right shift savestate button
        this.nextElementSibling.style.left = "calc(22% - 42px)";
        this.nextElementSibling.className = "collapse-btn left-round-btn icon icon-plus";

            // show panel
        viewerPanel.style.left = "22%";
        viewerPanel.style.width = "78%";
    }

        // fire panel resize event, trigger viewers to resize
    document.dispatchEvent(resizeEvt);
}


    // display or hide the view state table list
function toggleTableList(modelIndex) {

    var sublist = document.getElementsByClassName("table-sublist")[modelIndex];
    var cellBtn = sublist.previousElementSibling.firstElementChild;

    if (sublist.offsetHeight > 0) {

            // hide viewstate sublist
        sublist.style.height = 0 + "px";
        cellBtn.className = "cell-btn icon icon-angle-right";

    } else if (modelStates[modelIndex].length > 0) {

            // show viewstate sublist
        sublist.style.display = "block";
        var row = sublist.querySelectorAll(".table-cell")[0];

        var tableHeight = modelStates[modelIndex].length * (row.offsetHeight + 20);
        sublist.style.height = tableHeight + "px";
        cellBtn.className = "cell-btn icon icon-angle-down";
    }
}


    // save the current viewstate object of the 3d viewer and also get a screenshot of it
function saveCurrentViewState() {

    if (! markerPlaced)
        return;

    var viewState = viewer3D.getState();    // get current viewstate

    var stateId = viewModels[currentModel].id + Date.now();
    var stateObj = {id: stateId, state: viewState};
    modelStates[currentModel].push(stateObj);

    viewer3D.getScreenShot(100, 100, function(blobURL) {    // get screenshot blob URL

            // NOTE: because the viewer API returns a URL of the blob, we use an ajax call
            // to get the blob object from localhost, for saving it in local storage later
        var xhr = new XMLHttpRequest();
        xhr.open('GET', blobURL, true);
        xhr.responseType = 'blob';
        xhr.onload = function(e) {
            if (this.status == 200) {
                var blob = this.response;
                // uploadToServer(blob, name);
                saveBlobToLocalStorage(blob, stateId);  // save image blob to local storage
            } else {
                console.log("Error getting screenshot blob. ", this.status);
            }
        };
        xhr.send();

        // console.log("modelStates ", modelStates);
        pushStateToTableList(blobURL, currentModel, stateObj);  // show this screenshot in list

    });
}


    // add a screenshot image to its model cell's sublist
function pushStateToTableList(blobURL, modelIndex, stateObj) {

    var sublist = document.getElementsByClassName("table-sublist")[modelIndex];

        // create sublist table cell
    var row = document.createElement("div");
    row.className = "table-cell";

        // create image element
    var img = document.createElement("img");
    img.src = blobURL;
    img.id = stateObj.id;

        // attach click events
    img.onclick = function(evt) {

        if (panelDisabled)  // disabled when the viewer is still loading
            return;

        if (modelIndex != currentModel) {   // if it's another model, we need to switch model first
            currentModel = modelIndex;
            viewer2D.container.removeChild(marker.layer);

            loadDocument(viewModels[currentModel].urn, function () {
                markerPlaced = true;
                viewer3D.restoreState(stateObj.state);  // restore viewstate after the model is loaded
            });

        } else {    
            // if it's the same as current model, we need to 
            // check whether the marker has already been placed
            if (!markerPlaced)
                placeMarkerOnCanvas(null, true);

                // restore to its related viewstate
            viewer3D.restoreState(stateObj.state);
        }
    };

    row.appendChild(img);
    sublist.appendChild(row);

        // adjust sublist table height
    var tableHeight = sublist.offsetHeight + (row.offsetHeight + 20);
    sublist.style.height = tableHeight + "px";
}


    // load the models into the panel
function loadModelList() {

    var list = document.querySelector(".control-panel .table-list");    
    for (var i = 0; i < viewModels.length; i++) {

            // create table cell for model
        var cell = document.createElement("div");
        cell.className = "table-cell";
        var modelId = "model" + i;
        cell.id = "model" + i;

            // create collapse button for each model cell
        var cellBtn = document.createElement("div");
        cellBtn.className = "cell-btn icon icon-angle-right";

            // create label for each model cell
        var cellLabel = document.createElement("div");
        cellLabel.className = "cell-label";
        cellLabel.innerHTML = viewModels[i].label;

        cell.appendChild(cellBtn);
        cell.appendChild(cellLabel);

            // create sublist for viewstate screenshots
        var sublist = document.createElement("div");
        sublist.className = "table-sublist";

        list.appendChild(cell);
        list.appendChild(sublist);
    };
}


    // load the previously saved viewstate from local storage
function loadViewStateList() {

    for (var i = 0; i < viewModels.length; i++) {

        var objStr = localStorage.getItem(viewModels[i].id);
        if (objStr && objStr.length > 0) {

                // get the viewstate object
            var viewStates = JSON.parse(objStr);
            modelStates.push(viewStates);

            for (var j = 0; j < viewStates.length; j++) {

                    // get the screenshot image
                var dataURI = localStorage.getItem(viewStates[j].id);

                    // insert screenshot to sub tablelist
                pushStateToTableList(dataURI, i, viewStates[j]);
            }
        } else {
                // no saved viewstates, empty list
            var emptyStates = new Array(0);
            modelStates.push(emptyStates);
        }
    };
}


    // update the viewstate objects in local storage
function updateLocalStorage() {

    for (var i = 0; i < viewModels.length; i++) {
        var model = viewModels[i].id;
        var objStr = JSON.stringify(modelStates[i]);
        localStorage.setItem(model, objStr);
    };
}


    // save the screenshot image into localStorage
function saveBlobToLocalStorage(blob, name) {

    var reader = new FileReader();
    reader.onload = function (evt) {
        var fileUploadData = evt.target.result;
        localStorage.setItem(name, fileUploadData);  
    }

    reader.readAsDataURL(blob);
}