function getColorByID(ID){
	let res = md5(ID)
	let color = {
		r: res.stbstr(0, 2),
		g: res.stbstr(2, 2),
		b: res.stbstr(4, 2),
	}
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

function insertAfter(newElement,targetElement) {
  var parent = targetElement.parentNode;
  if (parent.lastChild == targetElement) {
    parent.appendChild(newElement);
  } else {
    parent.insertBefore(newElement,targetElement.nextSibling);
  }
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
		// initWorkspace();
		// initBirdseye();
		initMonitor();
	})
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
			.attr("controls", "controls")
			// .attr("controls", "false")
			.attr("preload", "auto")
			.attr("src", source_video.src) //源视频文件位置
			.attr("id", "video")
			.attr("type", "video/mp4")

	// d3 的 on 方法在这个属性上不知道为什么用不了，所以用原生js监听并获取视频的时长
	var video_obj = document.getElementById("video")
	video_obj.addEventListener("canplaythrough", function(){
		source_video.duration = this.duration;
		source_video.seconds = Math.round(this.duration);
		initControls();
	})

}


addLoadEvent(init);

