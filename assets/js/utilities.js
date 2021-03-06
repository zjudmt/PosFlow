function getColorByID(ID){
	let res = (ID/Math.PI) - Math.floor(ID/Math.PI)
	let color = colorScale(res).toString();
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
	else {
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
	// console.log(id, cur_status, status)
	if(cur_status != "selected" && cur_status != "conflicted" ){
		tracklets[index].status = status	
	}
}


function getTrackletsByFrame(data, frame){
	var current_tracklets = [];
	var path_tracklets = [];
	var range_tracklets = [];
	for(var i = 0; i < data.length; ++i){
		map[data[i].id] = i;
		var start_frame = data[i]["start_frame"];
		var end_frame = data[i]["end_frame"];
		var flag_conflicted = false;
		for (var j = selected.length - 1; j >= 0; j--) {
			var max_start = d3.max( [selected[j].start_frame, start_frame] )
			var min_end = d3.min( [selected[j].end_frame, end_frame] ) 
			if( max_start <= min_end && data[i].status != "selected" ) {
				flag_conflicted = true;
				// console.log("max_start", max_start, "min_end", min_end)
			}
		}
		if (flag_conflicted||(selected.length==2&&data[i].status!="selected"))
			data[i].status = "conflicted";
		else if(data[i].status == "conflicted")
			data[i].status = "default";
		if(start_frame <= frame && frame <= end_frame || data[i].status == "selected"){
			if (data[i].status == "selected" || data[i].status == "hover") {
				path_tracklets.push(data[i]);
			}
			current_tracklets.push(data[i]);
		}

		// WsVer
		if(data[i]["start_frame"] <= frame+future_duration && frame-past_duration <= data[i]["end_frame"]&&data[i].status!="selected")
			range_tracklets.push(data[i]);
	}
	return [current_tracklets, path_tracklets, range_tracklets];
	// return current_tracklets;
}


function getCurrentFrame(){
	return Math.floor(d3.select("#video").property("currentTime")*source_video.fps);
}

function trash(){
	if(!d3.select("#wsbuttong-3").selectAll(".enable").size())
		return 0;
	var garbage = selected[0];
	var index_g = getIndexbyID(garbage.id);
	tracklets.splice(index_g, 1);
	selected.splice(0, 1);
}

function merge(){

	console.log(d3.select("#wsbuttong-1").selectAll(".enable").size())
	if(d3.select("#wsbuttong-1").selectAll(".enable").size()==0)
		return 0;
	console.log("merge")

	//根据id选择对象
	var tracklet1=selected[0],
		tracklet2=selected[1];


	if(tracklet1.end_frame<tracklet2.start_frame-1){//是否无缝贴合
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
			tracklet1.boxes.push(tempbox);
		}
		tracklet1.interpolation.push([tracklet1.end_frame+1,tracklet2.start_frame-1])//插值数组添加

	}

	//复制后一个tracklet
	for(var i=0;i<tracklet2.boxes.length;i++){
		tracklet1.boxes.push(tracklet2.boxes[i]);
	}
	tracklet1.end_frame=tracklet2.end_frame;

	for(var i=0;i<tracklet2.interpolation.length;i++)
		tracklet1.interpolation.push(tracklet2.interpolation[i])
	tracklet1.interpolation.sort(function(a,b){return a[0]-b[0]})

	//存入第一个tracklet
	var index_t1 = getIndexbyID(tracklet1.id);
	tracklets.splice(index_t1,1,tracklet1);
	
	//删除后一个tracklets
	var index_t2 = getIndexbyID(tracklet2.id);
	tracklets.splice(index_t2,1);

	selected.splice(1,1);

}

function cutline(){
	
	console.log(d3.selectAll(".enable").size())
	if(d3.select("#wsbuttong-2").selectAll(".enable").size()==0)//改成0
		return 0;
	console.log("cut")

	var tracklet1=selected[0]
	//获取interpolation中位置

	var index_inter = -1, old_end, new_start
	var new_end = tracklet1.end_frame;
	for(var i=0;i<tracklet1.interpolation.length;i++){
		//考虑在interpolation边缘的剪切情况，由注释中代码改为现代码
		// if(frame>=tracklet1.interpolation[i][0]&&frame<=tracklet1.interpolation[i][1]){
		if(frame>=(tracklet1.interpolation[i][0]-1)&&frame<=(tracklet1.interpolation[i][1]+1)){
			index_inter=i;
			break;
		}
	}

	if(index_inter == -1){
		old_end = frame;
		new_start = frame + 1;
		console.log("solid cut")
	}else{
		new_start = tracklet1.interpolation[index_inter][1] + 1;
		old_end = tracklet1.interpolation[index_inter][0] - 1;
	}

	// console.log(tracklet1)
	// console.log(index_inter)
	//创建新tracklet
	var tracklet2={}
	tracklet2.id=setNewId()
	tracklet2.color=getColorByID(tracklet2.id)
	//调整end_frame和start_frame
	tracklet2.start_frame = new_start;
	tracklet2.end_frame = new_end;
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
	tracklet1.end_frame = old_end;
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

function getLinkData() {
	var line_data = [];
	for (var k = linked_pairs.length - 1; k >= 0; --k) {
		for (var i = current_tracklets.length - 1; i >= 0; --i) {
			if (linked_pairs[k][0] == current_tracklets[i]["id"]) {
				for (var j = current_tracklets.length - 1; j >= 0; --j) {
					if(linked_pairs[k][1] == current_tracklets[j]["id"]) {
						var start_frame = current_tracklets[i]["start_frame"];
						line_data.push(
						{
							"id1" : linked_pairs[k][0],
						    "id2" : linked_pairs[k][1],
						    "box1" : current_tracklets[i]["boxes"][frame-start_frame],
						    "box2" : current_tracklets[j]["boxes"][frame-start_frame]
						})
					}
				}
			}
		}
	}
	return line_data;
}
	


function exchange(){
	console.log(d3.selectAll(".enable").size())
	if(d3.select("#wsbuttong-3").selectAll(".enable").size()==0)//改成0
		return 0;
	console.log("exchange")

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


function selectLineX1(d){
	var fps=source_video.fps
	var p
	if(d.start_frame>=frame+future_duration-fps)
		p=frame+future_duration-fps
	else if(d.end_frame<=frame-past_duration+fps)
		p=frame-past_duration+fps-(end_frame-start_frame)
	else
		p=d.start_frame

	console.log("start"+p)
	return width_graph*Math.max((p-(frame-past_duration))/(past_duration+future_duration),0)
}

function selectLineX2(d){
	var fps=source_video.fps
	var p
	if(d.start_frame>=frame+future_duration-fps)
		p=frame+future_duration-fps+(end_frame-start_frame)
	else if(d.end_frame<=frame-past_duration+fps)
		p=frame-past_duration+fps
	else
		p=d.end_frame

	console.log("end:"+p)
	return width_graph*Math.min((p-(frame-past_duration))/(past_duration+future_duration),1)
}

function load(){
	document.getElementById("uploadTracklets").click(); 
}

function selectvideo(){
	document.getElementById("uploadVideo").click(); 
}

function readTracklets () {
        selected=[];
        var localFile = document.getElementById("uploadTracklets").files[0];

        var reader = new FileReader();
       
        reader.readAsText(localFile)
        reader.onload=function(f){  
        var result=document.getElementById("fileContent");  
		
        var newdata=JSON.parse(this.result)
        
        tracklets = initData(newdata);
    } 
        
}

function readVideo(){
	
	var localVideo = document.getElementById("uploadVideo").files[0]
	console.log(localVideo)

	if(!/video\/\w+/.test(localVideo.type)){  
        alert("需要选择视频！");  
        return false;  
    }  
	var new_video_src = URL.createObjectURL(localVideo)
	console.log(new_video_src)


	video.attr("src",new_video_src)
	// frame=0
	svg.select("#monitor").remove()
	initMonitor()
	// controls_data.timebox.total_time= getTimeText( source_video.duration )

	URL.revokeObjectURL(localVideo)

}

function save(){
	var blob = new Blob([JSON.stringify(tracklets)], { type: "" });
	saveAs(blob, "tracklets.json");

}

function indexS(index, d) {
	index = d3.min([index, d["boxes"].length-1]);
	index = d3.max([0, index])
	return index;
}


function markCurrentTime(){
	console.log("mark")
	var t=frame/25
	var xtemp=time2x(t);
	var new_mark={
		x:xtemp,
		y1:unit * lo.mark_line.y1,
		y2:unit * lo.mark_line.y2,
	}
	tracklets.marklines.push(new_mark);
	console.log(tracklets.marklines)
}

function zoomS(t) {
	// var vid_w = viewBox.w;
	// var vid_h = viewBox.w / source_video.ratio;
	var vid_w = viewBox.w;
	var vid_h = viewBox.w * source_video.ratio;
	var x_s = d3.max([t.x, (1-t.k)*vid_w ]);
	x_s = d3.min([0, x_s]);
	var y_s = d3.max([t.y, (1-t.k)*vid_h ]);
	y_s = d3.min([0, y_s]);
	t.x = x_s;
	t.y = y_s;
	return t;
}

