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

function insertAfter(newElement,targetElement) {
  var parent = targetElement.parentNode;
  if (parent.lastChild == targetElement) {
    parent.appendChild(newElement);
  } else {
    parent.insertBefore(newElement,targetElement.nextSibling);
  }
}

// 创建layout 全局变量，让各模块能据此初始化自己的视图
function initLayout(argument) {
	viewport = {
		w: window.innerWidth,
		// h: window.innerWidth * 9 / 16,
		h: window.innerHeight,
	// on my laptop w = 1536, h = 864
	};
	unit = viewport.w / 48;
	basepoint = {
		x: 0,
		y: 0.5 * viewport.h - unit * 13.5,
	}
	// on my laptop unit = 32 = viewport.h / 27
	var row = [{
			name: "header",
			h: unit,
		},{
			name: "void",
			h: unit * 5,
		},{
			name: "monitor",
			h: unit * 11,
			main: {
				h: unit * 10,
			},
			control: {
				h: unit,
			}

		},{
			name: "factory",
			h:  unit * 10,
			col: [{
				name: "blank",
				w: unit * 16,
			},{				
				name: "birdseye",
				w: unit * 16,
			},{				
				name: "workspace",
				w: unit * 16,
			}]
		}
	]
	layout = {
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

	// console.log("layout: ", layout);
	// console.log("basepoint: ", basepoint);
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
	initVideo();
	initSVG();
	d3.json(source_data.src, function(error, data){
		tracklets = data;
		merge(363,360);
		initWorkspace();
		// initBirdseye();
		initMonitor();

	})

}


function initSVG(){
	d3.select("body")
	.append("div")
		.attr("id", "SVG-container")
		.attr("width", viewport.w)
		.attr("height", viewport.h)

	svg = d3.select("#SVG-container")
		.append("svg")
			.attr("width", viewport.w)
			.attr("height", viewport.h)
			.attr("id", "svg")
}

function getTrackletsByFrame(data, frame){
	var current_tracklets = [];
	for(var i = 0; i < data.length; ++i){
		if(data[i]["start_frame"] <= frame && frame <= data[i]["end_frame"]){
			current_tracklets.push(data[i]);
		}
	}
	return current_tracklets;
}

addLoadEvent(init)

function getTrackletById(id){
	for(var i=0;i<tracklets.length;i++){
		if(tracklets[i].id==id){
			tracklets[i].position=i;//用于标记位置以便删除
			return tracklets[i]
		}
	}
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