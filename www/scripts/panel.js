var modelStates = [];
var resizeEvt;

function loadModelList() {

    var list = document.querySelector(".control-panel .table-list");    
    for (var i = 0; i < viewModels.length; i++) {

        var modelId = "model" + i;
        var cell = document.createElement("div");
        cell.className = "table-cell";
        cell.id = "model" + i;

        var cellBtn = document.createElement("div");
        cellBtn.className = "cell-btn icon icon-angle-right";

        var cellLabel = document.createElement("div");
        cellLabel.className = "cell-label";
        cellLabel.innerHTML = viewModels[i].label;

        cell.appendChild(cellBtn);
        cell.appendChild(cellLabel);

        var sublist = document.createElement("div");
        sublist.className = "table-sublist";

        list.appendChild(cell);
        list.appendChild(sublist);
    };

}

function initializeControlPanel() {

    loadModelList();

    var panelBtn = document.getElementById("panelBtn");
    panelBtn.addEventListener("click", toggleControlPanel);

    var saveBtn = document.getElementById("saveBtn");
    saveBtn.addEventListener("click", saveCurrentViewState);

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
        if (_selected === null)
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


    var cellBtns = document.querySelectorAll(".table-list .table-cell .cell-btn");;
    for (var i = 0; i < cellBtns.length; i++) {
        var cellBtn = cellBtns[i];
        cellBtn.addEventListener("click", function() {
            var cellId = this.parentElement.id;
            var modelIndex = parseInt(cellId.substring(cellId.length-1, cellId.length));
            toggleTableList(modelIndex);
        });

        var cellLabel = cellBtn.nextElementSibling;
        cellLabel.addEventListener("click", function() {
            var cellId = this.parentElement.id;
            var modelIndex = parseInt(cellId.substring(cellId.length-1, cellId.length));
            if (modelIndex !== currentModel) {
                currentModel = modelIndex;
                viewer2D.container.removeChild(marker.layer);
                loadDocument(viewModels[currentModel].urn);
                markerPlaced = false;
            };
        });
    };

    resizeEvt = new CustomEvent("panelresize");
    document.addEventListener("panelresize", function (evt) {
        viewer3D.resize();
        viewer2D.resize();
    });

    window.addEventListener("beforeunload", function() {
        updateLocalStorage();
    });

    populateFromLocalStorage();
}

function toggleControlPanel() {
    var controlPanel = document.getElementsByClassName("control-panel")[0];
    var viewerPanel = document.getElementsByClassName("viewer-panel")[0];
    
    if (controlPanel.offsetWidth > 0) {
        controlPanel.firstElementChild.style.display = "none";
        controlPanel.style.width = "0";

        this.style.left = "-4px";
        this.className = "collapse-btn right-round-btn icon icon-angle-circled-right";

        this.nextElementSibling.style.left = "-4px";
        this.nextElementSibling.className = "collapse-btn right-round-btn icon icon-plus";

        viewerPanel.style.left = "0px";
        viewerPanel.style.width = "100%";

    } else {
        controlPanel.firstElementChild.style.display = "block";
        controlPanel.style.width = "22%";

        this.style.left = "calc(22% - 42px)";
        this.className = "collapse-btn left-round-btn icon icon-angle-circled-left";

        this.nextElementSibling.style.left = "calc(22% - 42px)";
        this.nextElementSibling.className = "collapse-btn left-round-btn icon icon-plus";

        viewerPanel.style.left = "22%";
        viewerPanel.style.width = "78%";
    }

    document.dispatchEvent(resizeEvt);
}

function toggleTableList(modelIndex) {

    var sublist = document.getElementsByClassName("table-sublist")[modelIndex];
    var cellBtn = sublist.previousElementSibling.firstElementChild;

    if (sublist.offsetHeight > 0) {
        sublist.style.height = 0 + "px";
        cellBtn.className = "cell-btn icon icon-angle-right";
    } else if (modelStates[currentModel].length > 0){
        // if (sublist.style.display == "none" || sublist.style.display == "")
        sublist.style.display = "block";
        var row = sublist.querySelectorAll(".table-cell")[0];

        var tableHeight = modelStates[currentModel].length * (row.offsetHeight + 20);
        sublist.style.height = tableHeight + "px";
        cellBtn.className = "cell-btn icon icon-angle-down";
    }
}

function populateFromLocalStorage() {
    for (var i = 0; i < viewModels.length; i++) {
        var objStr = localStorage.getItem(viewModels[i].id);
        if (objStr && objStr.length > 0) {
            var viewStates = JSON.parse(objStr);
            modelStates.push(viewStates);
            for (var j = 0; j < viewStates.length; j++) {
                var dataURI = localStorage.getItem(viewStates[j].id);
                pushStateToTableList(dataURI, i, viewStates[j]);
            }
        } else {
            var emptyStates = new Array(0);
            modelStates.push(emptyStates);
        }
    };
}

function updateLocalStorage() {
    for (var i = 0; i < viewModels.length; i++) {
        var model = viewModels[i].id;
        var objStr = JSON.stringify(modelStates[i]);
        localStorage.setItem(model, objStr);
    };
}

function saveCurrentViewState() {
    if (! markerPlaced)
        return;
    var viewState = viewer3D.getState();

    var stateId = viewModels[currentModel].id + Date.now();
    var stateObj = {id: stateId, state: viewState};
    modelStates[currentModel].push(stateObj);

    viewer3D.getScreenShot(100, 100, function(blobURL) {

        var xhr = new XMLHttpRequest();
        xhr.open('GET', blobURL, true);
        xhr.responseType = 'blob';
        xhr.onload = function(e) {
            if (this.status == 200) {
                var blob = this.response;
                // uploadToServer(blob, name);
                pushToLocalStorage(blob, stateId);
            }
        };
        xhr.send();

        console.log("modelStates ", modelStates);
        pushStateToTableList(blobURL, currentModel, stateObj);
    });
}

function pushStateToTableList(blobURL, modelIndex, stateObj) {
    var sublist = document.getElementsByClassName("table-sublist")[modelIndex];
    var row = document.createElement("div");
    row.className = "table-cell";
    var img = document.createElement("img");
    img.src = blobURL;
    img.id = stateObj.id;
    img.onclick = function(evt) {

        if (modelIndex != currentModel) {
            currentModel = modelIndex;
            viewer2D.container.removeChild(marker.layer);
            loadDocument(viewModels[currentModel].urn, function () {

                markerPlaced = true;
                viewer3D.restoreState(stateObj.state);
            });
        } else {
            if (!markerPlaced)
                placeMarkerOnCanvas(null, true);
            viewer3D.restoreState(stateObj.state);
        }
    };

    row.appendChild(img);
    sublist.appendChild(row);

    var tableHeight = sublist.offsetHeight + (row.offsetHeight + 20);
    sublist.style.height = tableHeight + "px";
}

function pushToLocalStorage(blob, name) {
    var reader = new FileReader();
    reader.onload = function (evt) {
        var fileUploadData = evt.target.result;
        localStorage.setItem(name, fileUploadData);  
    }
    reader.readAsDataURL(blob);
}

/*
function uploadToServer(blob, name) {
    var request = new XMLHttpRequest();
    var params = JSON.stringify({imageName:name});
    request.open("POST", "/api/prepare", true);
    request.setRequestHeader("Content-type", "application/json; charset=utf-8");

    request.onreadystatechange = function(e) {
        if(request.readyState == 4 && request.status == 200) {
            console.log("success ", e.target.response);
            var reader = new FileReader();
            reader.onload = function (evt) {

                var fileUploadData = evt.target.result;
                var request = new XMLHttpRequest();
                request.open(
                            "POST",
                            "/api/upload",
                            true
                        );
                request.send(fileUploadData);
            }
            reader.readAsDataURL(blob);
        } else {
            console.log("fail ", e.target.response);
        }
    }
    
    request.send(params);
}
*/
