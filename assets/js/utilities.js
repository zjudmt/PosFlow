function getColorByID(ID){
	let res = md5(ID)
	let color = "#"+ res.substr(0,6);
	return color;
}

function getIndexbyID(id) {
	return map[id];
}

function isDashed(d) {
	for (var i = d.interpolation.length - 1; i >= 0; i--) {
			if (frame > d.interpolation[i][0] && frame < d.interpolation[i][1] ){
				return true;
			}
		}
	return false;
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
	}
	else{
		if(cur_status == "conflicted")
			return;
		tracklets[index].status = "selected";
		selected.push(tracklets[index]);
		console.log("selectTracklet: ", selected)
	}
}

function setStatus(id, status){
	var index = getIndexbyID(id);
	var cur_status = tracklets[index].status
	// console.log(cur_status, status)
	if(cur_status != "selected" && cur_status != "conflicted" ){
		tracklets[index].status = status	
	}
}


function getTrackletsByFrame(data, frame){
	var current_tracklets = [];
	selected_num = 0;
	tracklets_num = 0;
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
		if (flag_conflicted||(selected.length==2&&data[i].status!="selected"))
			data[i].status = "conflicted";
		else if(data[i].status == "conflicted")
			data[i].status = "default";

		if(start_frame <= frame && frame <= end_frame || data[i].status == "selected"){
			if (data[i].status == "selected") {
				selected_num ++;
			}
			current_tracklets.push(data[i]);
			tracklets_num++;
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
		if(data[i]["start_frame"] <= frame+future_duration && frame-past_duration <= data[i]["end_frame"]&&data[i].status!="selected"){
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


function getTrackletById(id){

	for(var i=0;i<tracklets.length;i++){

		if(tracklets[i].id==id){

			tracklets[i].position=i;//用于标记位置以便删除

			return tracklets[i]

		}

	}

}
function merge(){
	console.log("merge")
	if(selected.length!=2)
		return 0;
	

	//根据id选择对象
	var tracklet1=selected[0],
		tracklet2=selected[1];

	tracklet1.status="selected"
	tracklet2.status="selected"
	console.log(tracklet1)
	console.log(tracklet2)
	//两个box作为关键帧
	var box1=tracklet1.boxes[tracklet1.boxes.length-1],
		box2=tracklet2.boxes[0],
		num_newboxes=tracklet2.start_frame-tracklet1.end_frame-1;

	//生成中间box
	for(var i=0;i<num_newboxes;i++){
		var w=(i+1)/(num_newboxes+1)//权重
		var tempbox=[]
		for(var j=0;j<4;j++){
			tempbox.push(Math.round((1-w)*box1[j]+w*box2[j]))
		}
		// tempbox.push(0)//插值后面多加个0
		tracklet1.boxes.push(tempbox);
	}
	tracklet1.interpolation.push([tracklet1.end_frame+1,tracklet2.start_frame-1])//插值数组添加

	//复制后一个tracklet
	for(var i=0;i<tracklet2.boxes.length;i++){
		tracklet1.boxes.push(tracklet2.boxes[i]);
	}
	tracklet1.end_frame=tracklet2.end_frame;
	//存入第一个tracklet
	for (var i = tracklets.length - 1; i >= 0; i--) {
			if(tracklets[i].id == tracklet1.id)
				tracklets.splice(i,1,tracklet1);
		}

	//删除后一个tracklets
	for (var i = tracklets.length - 1; i >= 0; i--) {
			if(tracklets[i].id == tracklet2.id)
				tracklets.splice(i,1);
		}
	selected.splice(1,1)

	console.log(tracklet1)
}

function cutline(){
	console.log("cut")
	console.log(d3.selectAll("#wsbutton-3 .enable").size())
	if(d3.selectAll("#wsbutton-3 .enable").size()==1)//改成0
		return 0;

	var tracklet1=selected[0]
	//获取interpolation中位置
	var index_inter
	for(var i=0;i<tracklet1.interpolation.length;i++){

		if(frame>=tracklet1.interpolation[i][0]&&frame<=tracklet1.interpolation[i][1]){
			index_inter=i
			console.log(index_inter)
		}
	}
	if(i==tracklet1.interpolation.length)
		console.log("not in range")
	

	// console.log(tracklet1)
	// console.log(index_inter)
	//创建新tracklet
	var tracklet2={}
	tracklet2.id=setNewId()
	tracklet2.color=getColorByID(tracklet2.id)
	//调整end_frame和start_frame
	tracklet2.start_frame=tracklet1.interpolation[index_inter][1]+1
	tracklet2.end_frame=tracklet1.end_frame
	//分离interpolation
	tracklet2.interpolation=[]
	for(var i=0;i<tracklet1.interpolation.length;i++){
		if(tracklet1.interpolation[i][0]>=tracklet2.start_frame)
			tracklet2.interpolation.push(tracklet1.interpolation[i])
	}
	//复制boxes
	tracklet2.boxes=[]
	for(var i=tracklet2.start_frame;i<=tracklet2.end_frame;i++){
		tracklet2.boxes.push(tracklet1.boxes[i-tracklet1.start_frame])
	}


	//剪切旧tracklet
	//调整end_frame
	tracklet1.end_frame=tracklet1.interpolation[index_inter][0]-1
	//分离interpolation
	for(var i=0;i<tracklet1.interpolation.length;i++){
		if(tracklet1.interpolation[i][0]>=tracklet1.end_frame)
			tracklet1.interpolation.splice(i,1)
	}
	//删除boxes
	tracklet1.boxes.splice(tracklet1.end_frame-tracklet1.start_frame+1)

	tracklet2.status="selected"
	tracklets.push(tracklet2)
	selected.push(tracklet2)

	// console.log(tracklet1)
	// console.log(tracklet2)
}
function setNewId(){
	//设置新ID
	var maxid=0;
	for(var i=0;i<tracklets.length;i++){
		if(tracklets[i].id>maxid)
			maxid=tracklets[i].id
	}
	return maxid+1
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

