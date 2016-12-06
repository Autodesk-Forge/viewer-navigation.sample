var marker;
var activateToolName;
var markerPlaced;

var lastFloorIndex = 0;
var currentFloorIndex = 0;

var lastPosition;
var STABLELIMIT = 1;


	// disable user interaction in the given viewer
function disableViewerCanvas(viewer) {
   	activateToolName = viewer.toolController.getActiveToolName();
	viewer.toolController.deactivateTool(activateToolName);
    viewer.toolbar.setVisible(false);

	if (viewer.viewCubeUi.homeViewContainer) {
		viewer.viewCubeUi.infoButton.style.display = "none";
		viewer.displayViewCube(false, true);	//hide viewcube and update preference
	}
}

	// enable user interaction in the given viewer
function enableViewerCanvas(viewer) {
	if (activateToolName) {
		viewer.toolController.activateTool(activateToolName);
		activateToolName = null;
	    // viewer.toolbar.setVisible(true);
	}

	if (viewer.viewCubeUi.homeViewContainer) {
		viewer.viewCubeUi.infoButton.style.display = "block";
		viewer.displayViewCube(true, true);
	}
}

	// instantiate marker UI class and set up viewer event listeners
function initializeMarker() {

	marker = new Marker(viewer2D.container);

		// adjust 2D viewer to a proper viewbox
	viewer2D.setViewFromViewBox(metadata[viewModels[currentModel].id].viewboxes[0].box);

		// update marker when camera in viewer2D changes or viewer2D resizes
	viewer2D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkerOnCanvas);
    viewer2D.addEventListener(Autodesk.Viewing.VIEWER_RESIZE_EVENT, updateMarkerOnCanvas);

    	// add external event hanlder on the marker UI
	marker.addEventListenerOnMarker("markerdown", startTracking);

	if (markerPlaced) {
		updateMarkerToCamera();
		return;
	}

	disableViewerCanvas(viewer2D);											// deactivate the 2d viewer canvas

	marker.hideMarker();													// hide marker for init placement
	marker.addEventListenerOnMarker("canvasclick", placeMarkerOnCanvas);	// set marker layer to listen to click events
	marker.toggleCanvas(true);												// activate marker layer
	markerPlaced = false;
}

	// place the marker on the canvas for the first time
function placeMarkerOnCanvas(evt, skipViewerUpdate) {

		// transform mouse click coordinates to offsetXY on viewer2D canvas
	var offsetLeft = (evt ? evt.clientX : 0) - viewer2D.container.getBoundingClientRect().left;
	var offsetTop = (evt ? evt.clientY : 0) - viewer2D.container.getBoundingClientRect().top;

		// set marker position
	marker.setPosition(offsetLeft, offsetTop);
	marker.showMarker();
	markerPlaced = true;
	marker.removeEventListenerOnMarker("canvasclick", placeMarkerOnCanvas);		// remove click event listener on marker layer
	marker.toggleCanvas(false);													// deactivate marker layer
	enableViewerCanvas(viewer2D);												// activate viewer2D canvas

		// skip viewer3D camera update
	if (!(skipViewerUpdate))
		updateCameraToMarker();

        // check the viewer transition, add the listener when done
    var checkTransition = setInterval(function() {
        if (!(viewer3D.navigation.getTransitionActive())) {
            clearInterval(checkTransition);
            	// update marker when camera in viewer3D changes
            viewer3D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkerToCamera);
        }
    }, 150);

}

	// user presses on marker, prepare for marker tracking
function startTracking(evt) {
	marker.addEventListenerOnMarker("markerdrag", trackMarker);
	marker.addEventListenerOnMarker("markerup", stopTracking);

	disableViewerCanvas(viewer2D);
		// NOTE: disable marker to camera update when tracking, to avoid
		// mutual updates between the camera and the marker
	viewer3D.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkerToCamera);
	lastPosition = null;
	updateCameraToMarker(false, false);
}

	// tracking state of marker and updating camera
function trackMarker(evt) {
	if (marker.isTracking)
		updateCameraToMarker(false, false);
	else if (marker.isRotating)
		updateCameraToMarker(true, false);
}

	// user lifts mouse, stop tracking marker
function stopTracking(evt) {
	marker.removeEventListenerOnMarker("markerdrag", trackMarker);
	marker.removeEventListenerOnMarker("markerup", stopTracking);

	enableViewerCanvas(viewer2D);
		// restore marker to camera update when done
	viewer3D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkerToCamera);
}


	// update the marker on 2d canvas when the camera has changed in viewer2D
function updateMarkerOnCanvas() {
	var position = viewer3D.navigation.getPosition();
	var paperPos = worldToPaper(position);
	if (paperPos) {
		var newPos2D = projectToViewport(paperPos.pos, viewer2D.getCamera());
    	marker.setPosition(newPos2D.x, newPos2D.y);
    }
}

	// update the marker's position and direction to the camera in viewer3D
function updateMarkerToCamera() {
	if (marker.isTracking() || marker.isRotating())
		return;

		// update marker direction to camera target
	var position = viewer3D.navigation.getPosition();
	var eye = viewer3D.navigation.getEyeVector();
	marker.setDirection([eye.x, eye.y]);

	var paperPos = worldToPaper(position);
	if (paperPos) {
			// update marker position to camera position
		var newPos2D = projectToViewport(paperPos.pos, viewer2D.getCamera());
		marker.setPosition(newPos2D.x, newPos2D.y);

			// update floor state
		currentFloorIndex = paperPos.boxIndex;
		if (currentFloorIndex != lastFloorIndex) {
				// switch to a different viewbox if we're on a different floor
			var viewboxes = metadata[viewModels[currentModel].id].viewboxes;
			viewer2D.setViewFromViewBox(viewboxes[currentFloorIndex].box);
		}

		lastFloorIndex = currentFloorIndex;
	}
}

	// update the viewer3D's camera's position and target to the marker
function updateCameraToMarker(skipPosition, skipTarget) {
    var nav = viewer3D.navigation;
	nav.toPerspective();

	var up = positionToVector3([0,0,1]);
	nav.setCameraUpVector(up);

	if (!(skipPosition)) {

			// transform marker coordinates to world position and update
			// 3d camera to that position
		var position = marker.getPosition();
		var boundingRect = viewer2D.container.getBoundingClientRect();
	    var normedPoint = {
	        x: position.x / boundingRect.width,
	        y: position.y / boundingRect.height
	    };
	    var worldPos = clientToWorld(normedPoint);
	    if (worldPos) {

	    	if (lastPosition) {
	    		worldPos.x = Math.abs(worldPos.x - lastPosition.x) < STABLELIMIT ? lastPosition.x : worldPos.x;
	    		worldPos.y = Math.abs(worldPos.y - lastPosition.y) < STABLELIMIT ? lastPosition.y : worldPos.y;
	    	}

	    	nav.setPosition(positionToVector3(worldPos));
	    	lastPosition = worldPos;
	    } 
	}

	if (!(skipTarget)) {
		var position = viewer3D.navigation.getPosition();
		var direction = marker.getDirection();

			// update camera target to marker direction
		viewer3D.navigation.setTarget(positionToVector3([position.x+direction[0], position.y+direction[1], position.z]));
	}
}




/**
 *  This class can be instantiated as a separate marker UI.
 *  @class
 *  @param {Object} container - The container div for the marker.
 *  @param {Object} customMarker - The customized marker object
 *  @constructor
 */

	// constructor for marker UI
function Marker(container, customMarker) {

		// create marker layer
	var overlayDiv = document.createElement("div");
    overlayDiv.style.top = "0";
    overlayDiv.style.left = "0";
    overlayDiv.style.right = "0";
    overlayDiv.style.bottom = "0";
    overlayDiv.style.zIndex = "998";
    overlayDiv.style.position = "absolute";
    overlayDiv.style.pointerEvents = "none";
    overlayDiv.id = "markerlayer";

    	// create SVG element
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.width = "8px";
    svg.style.height = "16px";
    svg.style.top = "0px";
    svg.style.left = "0px";
    svg.style.position = "absolute";
    svg.style.pointerEvents = "visible";
    svg.style.cursor = "pointer";
    svg.id = "marker";

    	// create marker triangle
    var arrow = customMarker || document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    if (!customMarker) {
    	arrow.setAttribute("points", "0,16 4,0 8,16");
    	arrow.style.fill = "rgb(196, 20, 26)";
    }

    svg.appendChild(arrow);
    overlayDiv.appendChild(svg);
    container.appendChild(overlayDiv);

    this.marker = svg;
    this.layer = overlayDiv;


	function rotateMarker(angle, unit) {
		unit = unit || 'deg';
		svg.style.webkitTransform = 'rotate('+angle+unit+')';
		svg.style.MozTransform = 'rotate('+angle+unit+')';
		svg.style.msTransform = 'rotate('+angle+unit+')';
		svg.style.OTransform = 'rotate('+angle+unit+')';
		svg.style.transform = 'rotate('+angle+unit+')';
	};

	function translateBy(translateX, translateY) {
			// firefox does not support offsetLeft for SVG element
		var newOffsetLeft = svg.getBBox().x + translateX;
		var newOffsetTop = svg.getBBox().y + translateY;
		svg.style.left = newOffsetLeft + "px";
		svg.style.top = newOffsetTop + "px";
	};

	function translateTo(translateX, translateY) {
		svg.style.left = translateX + "px";
		svg.style.top = translateY + "px";
	};

	var isRotating = false;
	var isTracking = false;
	var DELTA = 10;

	var lastClientX = 0;
	var lastClientY = 0;
	var lastTimestamp = 0;
	var REFRESHINTERVAL = 0;

	var directionMap = new DirectionMap();
	var autoUpdateDirection = true;
	var shouldGeneralizeDirection = true;

	var ANGLETOLERANCE = Math.PI/8;
	var SUCCESSIVELIMIT = 1;
	var successiveCount = 0;
	var successiveChange = "";

		// external handlers for the marker, used for customized behavior for 
		// mousedown/mousemove/mouseup events, called after the internal hanlders are done
	var externalEvtHandlers = {
		"canvasclick": [],
		"markerdown": [],
		"markerdrag": [],
		"markerup": []
	};

	function callExtHandler(eventName, evt) {
		var extHandler = externalEvtHandlers[eventName];
		for (var i = 0; i < extHandler.length; i++) {
			var cb = extHandler[i];
			cb(evt);
		};
	}

		// internal handler to keep the marker updated with mousemove events
	var onmarkerdrag= function(evt) {
		var currentTimestamp = Date.now();
		if (currentTimestamp - lastTimestamp > REFRESHINTERVAL) {
			if (isTracking) {
				var deltaX = evt.clientX - lastClientX;
				var deltaY = lastClientY - evt.clientY; // mouse Y coord system opposite to viewer
				translateTo(evt.clientX-container.getBoundingClientRect().left, evt.clientY-container.getBoundingClientRect().top);

				if (autoUpdateDirection) {
					var newDirection = [deltaX, deltaY];
					var deviate = Math.abs(directionMap.angleBetween(directionMap.currentDirection, newDirection));
					
					if (deviate > ANGLETOLERANCE && successiveCount >= SUCCESSIVELIMIT) {
						if (shouldGeneralizeDirection) {
							directionMap.currentDirection = directionMap.generalizeDirection(newDirection).vector;
						} else {
							directionMap.currentDirection = directionMap.normalizeDirection(newDirection);
						}
						var angleToxAxis = directionMap.angleBetween(directionMap.currentDirection, [1,0]);
						rotateMarker((Math.PI/2 - angleToxAxis), 'rad');

						successiveCount = 0;
						successiveChange = "";

					} else if (deviate > ANGLETOLERANCE) {
						var d = directionMap.generalizeDirection(newDirection);
						if (d.name === successiveChange) {
							successiveCount += 1;
						}
						else {
							successiveCount = 0;
							successiveChange = d.name;
						}
					} else {
						successiveCount = 0;
						successiveChange = "";
					}
				}

			} else if (isRotating) {
				var d = directionMap.calcMouseDirection(evt.clientX, evt.clientY);
				directionMap.currentDirection = d;
				
				var angleToxAxis = directionMap.angleBetween(d, [1,0]);
				rotateMarker((Math.PI/2 - angleToxAxis), 'rad');
			}

			lastClientX = evt.clientX;
			lastClientY = evt.clientY;

			callExtHandler("markerdrag", evt);
		}
		lastTimestamp = currentTimestamp;
	};

	var onmarkerup = function(evt) {
		isTracking = false;
		isRotating = false;

		overlayDiv.style.cursor = "auto";
		overlayDiv.style.pointerEvents = "none";
		overlayDiv.removeEventListener("mousemove", onmarkerdrag);
		overlayDiv.removeEventListener("mouseup", onmarkerup);
		
		callExtHandler("markerup", evt);
	};

	svg.onmousedown = function(evt) {
		if (evt.shiftKey) {
			isRotating = true;
			isTracking = false;

			directionMap.setRotateCenter(evt.clientX, evt.clientY);

		} else {
			isRotating = false;
			isTracking = true;

			translateBy(DELTA);
		}

		overlayDiv.style.pointerEvents = "auto";
		overlayDiv.style.cursor = "default";
		overlayDiv.addEventListener("mousemove", onmarkerdrag, false);
		overlayDiv.addEventListener("mouseup", onmarkerup, false);

		lastClientX = evt.clientX;
		lastClientY = evt.clientY;
		lastTimestamp = Date.now();

		callExtHandler("markerdown", evt);
	};

	var oncanvasclick = function(evt) {
		callExtHandler("canvasclick", evt);
	}

	var getCursor = function() {
		return 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAXCAYAAAA7kX6CAAAAAXNSR0IArs4c6QAAATVJREFUOBGNlEFOw0AMRT2e0JaSQjdRBWsQe8oFECsQKgu4AefiFhyim56DLRvECoF/FFczP5PASJbt8X+JMl8TkYG1k+Z8K83FwFh0YKAfos+fok82L2qKmyauDoI+IFCXHl4EX0TqWvQagfq/YNhIc6tBpgjUBgaGS2+MM9VHF3Z19N5zCawWP/HGBV3d+84e+CrLy3kIZw6ixp73nhnUlUw2PvTc7WXarDFhVQe9c8DzUdB7zLxHzkAc/ULiOhWgPpZ4xbakYGtDDDJhEHtsSwpmNjDMtqRgZgODbMseZBsYZFscLNrAcGqLg5Udec8GBjtNa0sL4qhP7MhZyL3ZsnZbAO5vAwu5T20BOGoDw24LwFEbGHRbcEHnFvhFnFpEi7H1bcN3izeAiEOLvyCTtAvw1y8BCCQKGvhlGAAAAABJRU5ErkJggg==), auto';
	};

	this.toggleCanvas = function(activate) {
		if (activate) {
			this.layer.style.pointerEvents = "auto";
			this.layer.style.cursor = getCursor();
			this.layer.addEventListener("click", oncanvasclick, false);
		}
		else {
			this.layer.style.pointerEvents = "none";
			this.layer.style.cursor = "none";
			this.layer.removeEventListener("click", oncanvasclick);
		}
	};

	this.getDirectionMap = function() {
		return directionMap;
	};

	this.alignMarkerDirection = function() {
		var angleToxAxis = directionMap.angleBetween(directionMap.currentDirection, [1,0]);
		rotateMarker((Math.PI/2 - angleToxAxis), 'rad');	
	};

	this.isTracking = function() {
		return isTracking;
	};

	this.isRotating = function() {
		return isRotating;
	};

	this.getExtHandler = function() {
		return externalEvtHandlers;
	};
}

Marker.prototype.hideMarker = function() {
	this.marker.style.display = "none";
};

Marker.prototype.showMarker = function() {
	this.marker.style.display = "block";
};

Marker.prototype.getPosition = function() {
	// return {x:this.marker.offsetLeft, y:this.marker.offsetTop};

	// workaround
	// offsetLeft and offsetTop doesn't work for svg elements in Firefox
	var cssLeft = this.marker.style.left;
	var cssTop = this.marker.style.top;

	var offsetLeft = parseFloat(cssLeft.substring(0, cssLeft.length-2));
	var offsetTop = parseFloat(cssTop.substring(0, cssTop.length-2));

	return {x:offsetLeft, y:offsetTop};
};

Marker.prototype.getDirection = function() {
	return this.getDirectionMap().currentDirection;
};

Marker.prototype.setPosition = function(offsetLeft, offsetTop) {

	if (this.marker.style.display === "none")
		this.showMarker();

	var boundingRect = this.marker.getBBox();

	this.marker.style.left = offsetLeft - boundingRect.width / 2 + "px";
	this.marker.style.top = offsetTop - boundingRect.height / 2 + "px";
};

Marker.prototype.setDirection = function(newDirection) {
	var directionMap = this.getDirectionMap();
	directionMap.currentDirection = directionMap.normalizeDirection(newDirection);
	this.alignMarkerDirection();
};

Marker.prototype.addEventListenerOnMarker = function(eventName, callFunc) {
	var externalEvtHandler = this.getExtHandler();
	if (eventName in externalEvtHandler)
		externalEvtHandler[eventName].push(callFunc);
};

Marker.prototype.removeEventListenerOnMarker = function(eventName, callFunc) {
	var externalEvtHandler = this.getExtHandler();
	if (eventName in externalEvtHandler) {
		var callFuncs = externalEvtHandler[eventName];
		for (var i = 0; i < callFuncs.length; i++) {
			if (callFunc === callFuncs[i]) {
				callFuncs.splice(i, 1);
				break;
			}
		}
	}
};


/**
 *  This class manages the direction data of the marker
 *  @class
 *  @param {number} direction - The unit normlized length for direction vector.
 *  @constructor
 */

function DirectionMap(direction) {

	var normLen = 300;
	this.getNormLen = function() {return normLen;};
	this.currentDirection = direction || [0, normLen];

	this.rotateCenter = {x:0, y:0};
	this.generalizedDirections = [
		{name:'EAST',		vector:[normLen, 0],							xDeg:0	},
		{name:'NORTHEAST',	vector:[0.7071 * normLen, 0.7071 * normLen],	xDeg:45 },
		{name:'NORTH',		vector:[0, normLen],							xDeg:90	},
		{name:'NORTHWEST',	vector:[-0.7071 * normLen, 0.7071 * normLen],	xDeg:135},
		{name:'WEST',		vector:[-1 * normLen, 0],						xDeg:180},
		{name:'SOUTHWEST',	vector:[-0.7071 * normLen, -0.7071 * normLen],	xDeg:225},
		{name:'SOUTH',		vector:[0, -1 * normLen],						xDeg:270},
		{name:'SOUTHEAST',	vector:[0.7071 * normLen, -0.7071 * normLen],	xDeg:315},
	];

}

DirectionMap.prototype.angleBetween = function(d1, d2) {

	var length1 = Math.sqrt(d1[0]*d1[0]+d1[1]*d1[1]);
	var length2 = Math.sqrt(d2[0]*d2[0]+d2[1]*d2[1]);
	if (length1 === 0 || length2 === 0)
		return 0;
	var angle1 = Math.acos(d1[0]/length1);
	var angle2 = Math.acos(d2[0]/length2);
	if (d1[1] < 0)
		angle1 = 2*Math.PI - angle1;
	if (d2[1] < 0)
		angle2 = 2*Math.PI - angle2;

	return angle1-angle2;
};

DirectionMap.prototype.normalizeDirection = function(d, normLen) {

	var length = Math.sqrt(d[0]*d[0]+d[1]*d[1]);
	normLen = normLen || this.getNormLen();
	return [normLen*(d[0]/length), normLen*(d[1]/length)];
};

DirectionMap.prototype.generalizeDirection = function(d) {

	var angleToxAxis = Math.abs(this.angleBetween(d, [1,0]));
	var index = Math.floor(angleToxAxis/(Math.PI/8));

	if (index === 15 || index === 0) {
		return this.generalizedDirections[0];
	} else if (index%2 == 0){
		return this.generalizedDirections[index/2];
	} else {
		return this.generalizedDirections[Math.ceil(index/2)];
	}
};

DirectionMap.prototype.setRotateCenter = function(clientX, clientY) {

	this.rotateCenter.x = clientX;
	this.rotateCenter.y = clientY;
};

DirectionMap.prototype.calcMouseDirection = function(clientX, clientY) {

	var	subVec = [clientX-this.rotateCenter.x, this.rotateCenter.y-clientY];
	return this.normalizeDirection(subVec);
};





	// set up for 2d viewer container so that it can be dragged around on top of the 3d viewer
function initDraggableDiv() {

    var floatNav = document.getElementsByClassName("draggable")[0].firstElementChild;
    var _prev_x = 0;
    var _prev_y = 0;
    var _selected = null;

    floatNav.onmousedown = function (evt) {

        _prev_x = evt.clientX;
        _prev_y = evt.clientY;
        _selected = this.parentElement;

        document.addEventListener("mousemove", navmousemove);
        document.addEventListener("mouseup", navmouseup);

        // stop propagation
        return true;
    };

    var navmousemove = function (evt) {

        if (_selected == null)
            return;

        var next_left = _selected.offsetLeft + evt.clientX - _prev_x;
        var next_top = _selected.offsetTop + evt.clientY - _prev_y;
        var _bounding_left = _selected.parentElement.offsetWidth - _selected.offsetWidth;
        var _bounding_top = _selected.parentElement.offsetHeight - _selected.offsetHeight;

        if (next_left >= 0 && next_left < _bounding_left)
            _selected.style.left = next_left + "px";
        if (next_top >= 0 && next_top < _bounding_top)
            _selected.style.top = next_top + "px";

        _prev_x = evt.clientX;
        _prev_y = evt.clientY;

        return true;
    };

    var navmouseup = function () {

        _selected = null;

        document.removeEventListener("mousemove", navmousemove);
        document.removeEventListener("mouseup", navmouseup);

        return false;
    };
}






	// NOTE: functions below handles the transformation between coordinate systems, for now the 
	// relative location data (scale and offset) is hardcoded in rac.json, which is parsed into metadata.
	// Also, as floor plans are only shown in part of the paper sheet, we define a viewbox for each floor,
	// this is also hardwired, others include floor height and the base line.


	// find the viewbox where the given point is located on a paper sheet
function getPaperViewBox(point) {
	var viewboxes = metadata[viewModels[currentModel].id].viewboxes;
	for (var i = viewboxes.length - 1; i >= 0; i--) {
		var viewbox = viewboxes[i].box;
		if (point.x >= viewbox[0] && point.x <= viewbox[2] &&
			point.y >= viewbox[3] && point.y <= viewbox[1]) {
			return viewboxes[i];
		}
	};

	return null;
}

	// transform 3D world position to paper position, i.e. position in viewer2D
function worldToPaper(position) {
	var paperPos = {x:position.x * metadata[viewModels[currentModel].id].scale + metadata[viewModels[currentModel].id].xoffset, y:position.y * metadata[viewModels[currentModel].id].scale + metadata[viewModels[currentModel].id].yoffset, z:metadata[viewModels[currentModel].id].paperZ};

	var floor = Math.floor((position.z - metadata[viewModels[currentModel].id].floorBase) / metadata[viewModels[currentModel].id].floorHeight);
	floor = floor < 0 ? 0 : floor;
	floor = floor >= metadata[viewModels[currentModel].id].viewboxes.length ? metadata[viewModels[currentModel].id].viewboxes.length - 1 : floor;

	var viewbox = metadata[viewModels[currentModel].id].viewboxes[floor];
	var xoffsetBox = viewbox.box[0] - metadata[viewModels[currentModel].id].viewboxes[0].box[0];
    var yoffsetBox = viewbox.box[1] - metadata[viewModels[currentModel].id].viewboxes[0].box[1];

    paperPos.x += xoffsetBox;
    paperPos.y += yoffsetBox;

	if (paperPos.x < viewbox.box[0] || paperPos.x > viewbox.box[2] ||
		paperPos.y > viewbox.box[1] || paperPos.y < viewbox.box[3]) {
		return null;
	}
	else {
		return {pos:paperPos, boxIndex:floor};
	}
}

	// transform client point to 3D world position, i.e. position in viewer3D
function clientToWorld(normedPoint) {
	var paperPos = clientToPaper(normedPoint);
	var viewbox = getPaperViewBox(paperPos);
    if (viewbox == null)
    	return null;

	var xoffsetBox = viewbox.box[0] - metadata[viewModels[currentModel].id].viewboxes[0].box[0];
    var yoffsetBox = viewbox.box[1] - metadata[viewModels[currentModel].id].viewboxes[0].box[1];

    return {x:(paperPos.x - metadata[viewModels[currentModel].id].xoffset - xoffsetBox) / metadata[viewModels[currentModel].id].scale, y:(paperPos.y - metadata[viewModels[currentModel].id].yoffset - yoffsetBox) / metadata[viewModels[currentModel].id].scale, z:(viewbox.floor * metadata[viewModels[currentModel].id].floorHeight) + (metadata[viewModels[currentModel].id].floorHeight/2 + metadata[viewModels[currentModel].id].floorBase)};
}

	// transform client point to paper position, i.e. position in viewer2D
function clientToPaper(normedPoint) {

		// using hitpoint instead of scale/offset calculation
    var hitPoint = viewer2D.utilities.getHitPoint(normedPoint.x, normedPoint.y);
    if (hitPoint == null) {
    	hitPoint = viewer2D.navigation.getWorldPoint(normedPoint.x, normedPoint.y);
    }

    return hitPoint;
}

	// project world/paper position to client canvas
function projectToViewport(position, camera) {
    var p = new THREE.Vector4();

    p.x = position.x;
    p.y = position.y;
    p.z = position.z;
    p.w = 1;

    p.applyMatrix4(camera.matrixWorldInverse);
    p.applyMatrix4(camera.projectionMatrix);

    if (p.w > 0)
    {
        p.x /= p.w;
        p.y /= p.w;
        p.z /= p.w;
    }

    var point = viewer2D.impl.viewportToClient(p.x, p.y);
    point.x = Math.floor(point.x) + 0.5;
    point.y = Math.floor(point.y) + 0.5;

    return point;
}

	// array|object to THREE.Vector3
function positionToVector3(position) {
	var x = parseFloat(position[0] || position.x);
	var y = parseFloat(position[1] || position.y);
	var z = parseFloat(position[2] || position.z);
    return new THREE.Vector3(x, y, z);
}
