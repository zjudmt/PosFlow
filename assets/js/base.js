
// 创建layout 全局变量，让各模块能据此初始化自己的视图
function initLayout(argument) {
	viewport = {
		w: window.innerWidth,
		h: window.innerWidth * 9 / 16,
		x: 0,
		y: 0,
		// h: window.innerHeight,
	// on my laptop w = 1536, h = 864 w/h = 48/27
		scale: window.innerWidth / 1536,
	};
	console.log("viewport: ", viewport);
	viewBox = {
		x : 0,
		y : 0,
		w: 1536,
		h: 864,
	}
	unit = viewBox.w / 48;
	basepoint = {
		x: 0,
		y: 0,
	}
	// on my laptop unit = 32 = viewport.h / 27
	var row = [
				{
					name: "header",
					h: unit,
				},{
					name: "void",
					h: unit * 2,
				},{
					name: "monitor",
					h: unit * 13,
					main: {
						h: unit * 10,
					},
					control: {
						h: unit,
					}

				},{
					name: "factory",
					h:  unit * 10,
					col: [
							{
								name: "blank",
								w: unit * 0,
							},{				
								name: "birdseye",
								w: unit * 20,
							},{				
								name: "workspace",
								w: unit * 28,
							}
						]
					}
			]
	layout = {
		video:{
			x: 0,
			y: (row[0].h + row[1].h) * viewport.scale ,
			w: window.innerWidth,
			h: viewport.h * viewport.scale,
		},
		header:{
			x: basepoint.x ,
			y: basepoint.y,
			w: unit * 48,
			h: unit,
		},
		monitor:{
			x: basepoint.x,
			y: basepoint.y + row[0].h + row[1].h ,
			w: unit * 48,
			h: row[2].h ,
			main: {
				x: 0,
				y: 0,
				w: unit * 48,
				h: row[2].main.h ,
			},
			controls: {
				x: 0,
				y: row[2].main.h,
				w: unit * 48,
				h: row[2].control.h,		
			}
		},
		birdseye:{
			x: basepoint.x + row[3].col[0].w ,
			y: basepoint.y + row[0].h + row[1].h + row[2].h ,
			w: row[3].col[1].w ,
			h: row[3].h ,
		},
		workspace:{
			x: basepoint.x + row[3].col[0].w +  row[3].col[1].w,
			y: basepoint.y + row[0].h + row[1].h + row[2].h ,
			w: row[3].col[2].w ,
			h: row[3].h ,
		},
	}

	console.log("layout: ", layout);
	console.log("basepoint: ", basepoint);
}

function initData(data){
	status_t = {
		"default": "default",
		"hover": "hover",
		"selected": "selected",
		"conflicted": "conflicted"
	};
	console.log("initData")
	for(var i = 0; i < data.length; ++i){
		data[i]["status"] = status_t["default"];
		data[i]["color"] =  getColorByID(data[i].id);
	}
	return data;
}

function initDispatch() {
	dispatch = d3.dispatch("refresh");
	console.log("initDispatch")
	dispatch.on("refresh", function(detail){
		refreshMonitor(detail);
	});
}

function init(argument) {
	initLayout();
	source_video = {
		w: 3840,
		h: 800,
		ratio: 24/5,
		fps: 25,
		src: "/resources/PosFlow/2min.mp4",
	};
	source_data = {
		fps: 25,
		src: "/resources/PosFlow/tracklets.json",
	}
	past_duration = 5 * source_video.fps;
	future_duration = 5 * source_video.fps;
	frame = 0;
	map = [];
	selected = [];
	test();
	initVideo();
	initSVG();
	initHeader();
	initDispatch();
	d3.json(source_data.src, function(error, data){
		tracklets = initData(data);
		current_tracklets = getTrackletsByFrame(tracklets, 0)
		// range_tracklets = getTrackletsInRange(tracklets, 0, past_duration, future_duration)
		// range_trackletsWsVer = getTrackletsInRangeWsVer(tracklets, 0, past_duration, future_duration)
		initMonitor();
		// initWorkspace();
		// initBirdseye();
		timer_update = d3.timer(update);
	})
}

function update() {
	map = [];
	// selected = [];
	frame = getCurrentFrame();
	previous = current_tracklets;
	current_tracklets = getTrackletsByFrame(tracklets, frame);

	if (! previous.equals(current_tracklets) ){
		if(previous.length > current_tracklets.length)
			dispatch.call("refresh", this, {exit: true})
		else if ( previous.length < current_tracklets.length )
			dispatch.call("refresh", this, {enter: true})
		else
			dispatch.call("refresh", this, {})
	}
	// range_tracklets = getTrackletsInRange(tracklets, frame, past_duration, future_duration)
	// range_trackletsWsVer = getTrackletsInRangeWsVer(tracklets, frame, past_duration, future_duration)


	// updateWorkspace();
	// updateMonitor();
	// updateBirdseye();
}


function initSVG(){
	d3.select("body")
	.append("div")
		.attr("id", "SVG-container")
		.attr("top", basepoint.y )
		.attr("width", viewport.w + "px" )
		.attr("height", viewport.h + "px" )

	svg = d3.select("#SVG-container")
		.append("svg")
			.datum(viewBox)
			.attr("width", viewport.w ) 
			.attr("height", viewport.h )
			.attr("id", "svg")
			.attr("viewBox", function(d){
				console.log("vbx: ", d)
				let str = "" + d.x + " " + d.y
				+ " " + d.w +  " " + d.h;
				console.log("svg viewBox: ", str)
				return str;
			})


}

function initVideo(){
	// 添加video-container的div并设置布局
	d3.select("body")
		.append("div")
		.attr("id","video-container")
		.style("top", layout.video.y + "px" )
		.style("left", layout.video.x + "px" )	
	
	// 添加视频
	video = d3.select("#video-container")
		.append("video")
			.attr("width", "100%" )
			// .attr("height", layout.monitor.main.h )
			// .attr("controls", "controls")
			.attr("controls", "false")
			.attr("preload", "auto")
			.attr("src", source_video.src) //源视频文件位置
			.attr("id", "video")
			.attr("type", "video/mp4")

	// d3 的 on 方法在这个属性上不知道为什么用不了，所以用原生js监听并获取视频的时长

}

function merge(id1,id2){
	var w;
	//根据id选择对象
	var tracklet1=getTrackletById(id1),
		tracklet2=getTrackletById(id2);

	//排序
	if(tracklet1.end_frame>tracklet2.end_frame){
		var temp=tracklet1;
		tracklet1=tracklet2;
		tracklet2=temp
	}

	//两个box作为关键帧
	var box1=tracklet1.boxes[tracklet1.boxes.length-1],
		box2=tracklet2.boxes[0],
		num_newboxes=tracklet2.start_frame-tracklet1.end_frame-1;

	//生成中间box
	for(var i=0;i<num_newboxes;i++){
		w=(i+1)/(num_newboxes+1)
		var tempbox=[]
		for(var j=0;j<4;j++){
			tempbox.push(Math.round((1-w)*box1[j]+w*box2[j]))
		}
		tempbox.push(0)//插值后面多加个0
		tracklet1.boxes.push(tempbox);
	}

	//复制后一个tracklet
	for(var i=0;i<tracklet2.boxes.length;i++){
		tracklet1.boxes.push(tracklet2.boxes[i]);
	}
	tracklet1.end_frame=tracklet2.end_frame;

	//删除后一个tracklets
	tracklets.splice(tracklet2.position,1)

	// console.log(tracklet1.id,tracklet2.id)
}


addLoadEvent(init);
