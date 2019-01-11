function getColorByID(ID){
	let res = md5(ID)
	let color = "#"+ res.substr(0,6);
	return color;
}

function getIndexbyID(id) {
	return map[id];
}

function addLoadEvent(func) {
	var oldonload = window.onload;
	if (typeof window.onload != 'function') {
		window.onload = func;
	} else {
		window.onload = function() {
			oldonload();
			func();
		}
	}
}

function selectTracklet(d){
	var id = d.id
	var index = getIndexbyID(id)
	var cur_status = tracklets[index].status
	if ( cur_status == "selected") {
		tracklets[index].status = "default";
		for (var i = selected.length - 1; i >= 0; i--) {
			if(selected[i].id == id)
				selected.splice(i,1);
		}
		console.log("deselectTracklet: ", selected)
		// update()
		// dispatch.call("refresh", this, {selected: "less"});
	}
	else{
		if(cur_status == "conflicted")
			return;
		tracklets[index].status = "selected";
		selected.push(d);
		console.log("selectTracklet: ", selected)
		// update()
		// dispatch.call("refresh", this, {selected: "more"});
	}
}

function setStatus(id, status){
	var index = getIndexbyID(id);
	var cur_status = tracklets[index].status
	if(cur_status != "selected"){
		tracklets[index].status = status	
	}
}


function getTrackletsByFrame(data, frame){
	var current_tracklets = [];
	for(var i = 0; i < data.length; ++i){
		map[data[i].id] = i;
		var start_frame = data[i]["start_frame"];
		var end_frame = data[i]["end_frame"];
		var flag_conflicted = false;
		for (var j = selected.length - 1; j >= 0; j--) {
			var max_start = d3.max( [selected[j].start_frame, start_frame] )
			var min_end = d3.min( [selected[j].end_frame, end_frame] ) 
			if( max_start < min_end && data[i].status != "selected" ) {
				flag_conflicted = true;
				// console.log("max_start", max_start, "min_end", min_end)
			}
		}
		if (flag_conflicted)
			data[i].status = "conflicted";
		else if(data[i].status == "conflicted")
			data[i].status = "default";

		if(start_frame <= frame && frame <= end_frame || data[i].status == "selected"){
			current_tracklets.push(data[i]);
		}
	}
	return current_tracklets;
}

function getTrackletsInRange(data, frame, past_duration, future_duration){
var selection = [];
	for(var i = 0; i < data.length; ++i){
		if(data[i]["start_frame"] <= frame && frame <= data[i]["end_frame"]){
			var tracklet = {};
			// deep copy
			for(item in data[i]){
				if(typeof data[i][item] == "object"){
					tracklet[item] = [];
				}
				else{
					tracklet[item] = data[i][item];
				}
			}
			// set range
			var start_index = d3.max([frame-past_duration, data[i]["start_frame"]]) - data[i]["start_frame"];
			var end_index = d3.min([frame+future_duration, data[i]["end_frame"]]) - data[i]["start_frame"];
			// to correct the error of the data;
			end_index = d3.min([end_index, data[i]["boxes"].length-1]);
			// fill in the tracklet["boxes"]
			for(var j = start_index; j < end_index; ++j){
				var pos = data[i]["boxes"][j];
				tracklet["boxes"].push(pos);
			}
			selection.push(tracklet);
		}
	}
	return selection;
}

function getTrackletsInRangeWsVer(data, frame, past_duration, future_duration){
var selection = [];
	for(var i = 0; i < data.length; ++i){
		if(data[i]["start_frame"] <= frame+future_duration && frame-past_duration <= data[i]["end_frame"]){
			var tracklet = {};
			// deep copy
			for(item in data[i]){
				if(typeof data[i][item] == "object"){
					tracklet[item] = [];
				}
				else{
					tracklet[item] = data[i][item];
				}
			}
			// set range
			var start_index = d3.max([frame-past_duration, data[i]["start_frame"]]) - data[i]["start_frame"];
			var end_index = d3.min([frame+future_duration, data[i]["end_frame"]]) - data[i]["start_frame"];
			// to correct the error of the data;
			end_index = d3.min([end_index, data[i]["boxes"].length-1]);

			tracklet["start_frame"]=start_index+data[i]["start_frame"];
			tracklet["end_frame"]=end_index+data[i]["start_frame"];
			// fill in the tracklet["boxes"]
			for(var j = start_index; j < end_index; ++j){
				var pos = data[i]["boxes"][j];
				tracklet["boxes"].push(pos);
			}
			selection.push(tracklet);
		}
	}
	return selection;
}


function getCurrentFrame(){
	return Math.floor(d3.select("#video").property("currentTime")*source_video.fps);
}


// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
        	console.log(this[i].status, array[i].status)
            return false;   
        }           
    }       
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});