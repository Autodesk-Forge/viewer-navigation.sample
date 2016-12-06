var HitTest = {
	activate: function(a){},
	deactivate: function(a){},
	getName: function(){return this.getNames()[0];},
	getNames: function(){return ["HitTest"];},
	getCursor: function(){return "pointer";},
	handleSingleClick: function(evt){
	    var normedpos = {
	    	x: evt.layerX / this.controller.domElement.clientWidth,
	    	y: evt.layerY / this.controller.domElement.clientHeight
	    };
		console.log("HitTest", this.utilities.getHitPoint(normedpos.x, normedpos.y));
		return false;
	}
};

function startHitTest() {
	// viewer3D.toolController.registerTool(HitTest);
	// viewer3D.toolController.activateTool("HitTest");

	// event bubbling
	// viewer3D.container.addEventListener("mouseover", printHitResult, false);
	viewer3D.canvasWrap.addEventListener("click", printHitResult, false);
	viewer2D.canvasWrap.addEventListener("click", printHitResult2D, false);
}

function clearHitTest() {
	// viewer3D.toolController.deregisterTool(HitTest);
	// viewer3D.toolController.deactivateTool("HitTest");

	viewer3D.canvasWrap.removeEventListener("click", printHitResult);
	viewer2D.canvasWrap.removeEventListener("click", printHitResult2D);
}

function getHitTest(x, y, viewer, prompt) {
	var viewport = viewer.navigation.getScreenViewport();
    var normedPoint = {
        x: (x - viewport.left) / viewport.width,
        y: (y - viewport.top) / viewport.height
    };
    var hitPoint = viewer.utilities.getHitPoint(normedPoint.x, normedPoint.y);
    if (hitPoint) {
    	console.log(prompt, hitPoint);
    	return hitPoint;
    } else {
    	hitPoint = viewer.navigation.getWorldPoint(normedPoint.x, normedPoint.y);
    	console.log("Hit missed, world point", hitPoint);
    	return null;
    }
}

function printHitResult(evt) {
	var point = getHitTest(evt.clientX, evt.clientY, viewer3D, "3D");
	if (point) {
		if (!worldPoint1) {
			worldPoint1 = point;
			placeMeasureDot(evt.x, evt.y, viewer3D);
		}
		else if (!worldPoint2) {
			worldPoint2 = point;
			placeMeasureDot(evt.x, evt.y, viewer3D);
		}
	}
}

function printHitResult2D(evt) {
	var point = getHitTest(evt.clientX, evt.clientY, viewer2D, "2D");
	if (point) {
		if (!paperPoint1) {
			paperPoint1 = point;
			placeMeasureDot(evt.x, evt.y, viewer2D);
		}
		else if (!paperPoint2) {
			paperPoint2 = point;
			placeMeasureDot(evt.x, evt.y, viewer2D);
		}
	}

}

function placeMeasureDot(x, y, viewer) {
	var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	dot.setAttribute("cx", "4px");
	dot.setAttribute("cy", "8px");
	dot.setAttribute("r", "4px");
    dot.style.fill = "rgb(196, 20, 26)";

	var measureMarker = new Marker(viewer.container, viewer.container.getBoundingClientRect().left, viewer.container.getBoundingClientRect().top, dot);
	measureMarker.setPosition(x-viewer.navigation.getScreenViewport().left, y-viewer.navigation.getScreenViewport().top);

}

function resetPoints() {
	worldPoint1 = null;
	worldPoint2 = null;
	paperPoint1 = null;
	paperPoint2 = null;
}

var worldPoint1;
var worldPoint2;
var paperPoint1;
var paperPoint2;

function getOffsetAndScale() {
	var worldVec = [worldPoint1.x - worldPoint2.x, worldPoint1.y - worldPoint2.y];
	var paperVec = [paperPoint1.x - paperPoint2.x, paperPoint1.y - paperPoint2.y];

	var scale = Math.sqrt(paperVec[0]*paperVec[0] + paperVec[1]*paperVec[1]) / Math.sqrt(worldVec[0]*worldVec[0] + worldVec[1]*worldVec[1]);
	var xoffset = (paperPoint1.x - worldPoint1.x * scale + paperPoint2.x - worldPoint2.x * scale) / 2;
	var yoffset = (paperPoint1.y - worldPoint1.y * scale + paperPoint2.y - worldPoint2.y * scale) / 2;

	console.log(scale, xoffset, yoffset);
}
