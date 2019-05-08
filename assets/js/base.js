
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
	row = [
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
								w: unit * 1,
							},{				
								name: "birdseye",
								w: unit * 19,
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

	zoom = {
		scale: 1,
		x: 0,
		y: 0
	}
}

function initData(data){
	status_t = {
		"default": "default",
		"hover": "hover",
		"selected": "selected",
		"conflicted": "conflicted"
	};
	for(var i = 0; i < data.length; ++i){
		data[i]["status"] = status_t["default"];
		data[i]["end_frame"] = data[i].start_frame + data[i].boxes.length - 1;
		data[i]["color"] =  getColorByID(data[i].id);
		if(! data[i]["interpolation"])
			data[i]["interpolation"] = [];
	}
	return data;
}

function filterData(data){
	min_frames = 5;
	for(var i = 0; i < data.length; ++i){
		var flag = false;
		// tracklet时间不能短于5帧
		if(data[i]["end_frame"]-data[i]["start_frame"] < min_frames){
			flag = true;	
		}
		// 球员开始的位置和结束及中间三个的位置一共五个位置至少有一个在场内
		else
		{
			var count = 0;
			var end_index = d3.max([0, data[i]["boxes"].length-1]);
			for(var j = 0; j < 5; ++j){
				if(!inField(data[i]["boxes"][Math.floor(j*end_index/4)])){
					count++;
				}
				else{
					break;
				}
			}
			if(count == 5){
				flag = true;
			}
		}
		// 如果tracklet少于5帧，或被判断在场外，就从预处理数据中删掉
		if(flag == true){
			data.splice(i,1);
			--i;
		}
	}
	return data;
}

function inField(box){
	field_corners = [{x:1050, y:235}, {x:2783, y:235}, {x:3800, y:785}, {x:56, y:785}];

	var player = {x:box[0]+box[2]/2, y:box[1]+box[3]};

	var degree_sum = 0;
	for(var i = 0; i < 4; ++i){
		var edge_vec1 = {x:player.x-field_corners[i].x, y:player.y-field_corners[i].y};
		var edge_vec2 = {x:player.x-field_corners[(i+1)%4].x, y:player.y-field_corners[(i+1)%4].y};
		var norm1 = Math.sqrt(dotProduct(edge_vec1, edge_vec1));
		var norm2 = Math.sqrt(dotProduct(edge_vec2, edge_vec2));
		// at the corner, prevent dividing zero.
		if(norm1==0 || norm2==0)
			return true;
		var product = dotProduct(edge_vec1,edge_vec2)/(norm1*norm2);
		degree_sum += Math.acos(product);
	}
	return degree_sum < 2*Math.PI-0.01 ? false : true;
}

function dotProduct(vec1, vec2){
	return vec1.x*vec2.x+vec1.y*vec2.y;
}


function test() {
	var ar = []
	for (var i = 10 - 1; i >= 0; i--) {
		ar.push(i);
	}
	console.log(ar);
}


function init(argument) {
	// test();
	initLayout();
	source_video = {
		w: 3840,
		h: 800,
		ratio: 24/5,
		fps: 25,
		src: "/resources/PosFlow/first_half.mp4",
	};
	source_data = {
		fps: 25,
		src: "/resources/PosFlow/Germany_tracklets.json",
	}
	past_duration = 5 * source_video.fps;
	future_duration = 5 * source_video.fps;
	colorScale = d3.scaleSequential()
		.domain([0, 1])
		.interpolator(d3.interpolateRainbow);
	frame = 0;
	map = [];
	selected = [];
	initVideo();
	initSVG();
	initKeyBoardEvent();

	d3.json(source_data.src, function(error, data){
		data = filterData(data);
		tracklets = initData(data);
		cur_data = getTrackletsByFrame(tracklets, 0)
		current_tracklets = cur_data[0];
		path_tracklets = cur_data[1];
		range_trackletsWsVer = cur_data[2];
		initMonitor();
		initWorkspace();
		initBirdseye();
		last = 0;
		timer_update = d3.timer(update);
	})
}

function update(elapsed) {
	interval = elapsed - last;
	frame = getCurrentFrame();
	fps = (1000/interval)
  
	if(fps < 10)
		console.log("fps", fps, " at frame: ", frame);
	
	map = [];
	cur_data = getTrackletsByFrame(tracklets, frame)
	current_tracklets = cur_data[0];
	path_tracklets = cur_data[1];
	range_trackletsWsVer = cur_data[2];

	updateLayout();
	updateWorkspace();
	updateMonitor();
	updateBirdseye();

	last = elapsed;
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
	video_container = d3.select("body")
		.append("div")
		.attr("display", "inline-block")
		.attr("width", viewport.w)
		.attr("height", viewport.h)
		.attr("id","video-container")
		.style("position", "fixed")
		.style("top", layout.video.y + "px" )
		.style("left", layout.video.x + "px" )	
	
	// 添加视频
	video = d3.select("#video-container")
		.append("video")
			.attr("width", "100%" )
			.attr("controls", "false")
			.attr("preload", "auto")
			.attr("src", source_video.src) //源视频文件位置
			.attr("id", "video")
			.attr("type", "video/mp4")

	// d3 的 on 方法在这个属性上不知道为什么用不了，所以用原生js监听并获取视频的时长

}


function updateLayout() {
	viewport = {
		w: window.innerWidth,
		h: window.innerWidth * 9 / 16,
		x: 0,
		y: 0,
		scale: window.innerWidth / 1536,
	};
	d3.select("#SVG-container")
		.attr("width", viewport.w )
		.attr("height", viewport.h )
	d3.select("#svg")
		.attr("width", viewport.w )
		.attr("height", viewport.h )
	layout.new_video = {
			x: 0,
			y: (row[0].h + row[1].h) * viewport.scale ,
			w: window.innerWidth,
			h: viewport.h * viewport.scale,
		}
	d3.select("#video-container")
		.style("top", layout.new_video.y + "px" )
}

function initKeyBoardEvent(){
    document.onkeydown = function(event){
    	// 多浏览器支持
        var e = event || window.event || arguments.callee.caller.arguments[0];
        // 按 <- 向前播放
        if(e && !event.ctrlKey && e.keyCode==37){
            console.log("<-");
            var time = video.property("currentTime");
            if(video.property("paused")){
            	video.property("currentTime", time-1/source_video.fps);
            }
            else{
            	video.property("currentTime", time-125/source_video.fps);
            }
        }
        // 按 -> 向后播放
        else if(e && !event.ctrlKey && e.keyCode==39){
            console.log("->");
            var time = video.property("currentTime");
            if(video.property("paused")){
            	video.property("currentTime", time+1/source_video.fps);
            }
            else{
            	video.property("currentTime", time+125/source_video.fps);
            }
        }
        // 按 Up 向前跳到一个tracklet开头
        else if(e && e.keyCode==38){
            console.log("Up: to be discussed");
        }
        // 按 Down 向后跳到一个tracklet结尾
        else if(e && e.keyCode==40){
            console.log("Down: to be discussed");
        }          
        // 按 空格 暂停/开始
        else if(e && e.keyCode==32){
            console.log("Space");
            if(video.property("paused")){
            	video._groups[0][0].play();
            }
            else{
            	video._groups[0][0].pause();
            }
        }
        // 按 Ctrl + <- 减速播放
        else if(e && event.ctrlKey && e.keyCode==37){
            console.log("Ctrl + <-");
            var speed = video.property("playbackRate");
            if(speed > 0.125)
            	video.property("playbackRate", speed/2);
        }
        // 按 Ctrl + -> 加速播放
        else if(e && event.ctrlKey && e.keyCode==39){
            console.log("Ctrl + ->");
            var speed = video.property("playbackRate");
            if(speed < 8)
            	video.property("playbackRate", speed*2);
        }
        // 按 Ctrl + S 保存
        else if(e && event.ctrlKey && e.keyCode==83){
            console.log("Ctrl + S: ask lin to do");

        }
        // 按 Ctrl + O 载入
        else if(e && event.ctrlKey && e.keyCode==79){
            console.log("Ctrl + O: ask lin to do");

        }
        // 按 Ctrl + C 合并
        else if(e && event.ctrlKey && e.keyCode==67){
            console.log("Ctrl + C: ask lin to do");

        }
        // 按 Ctrl + X 剪断
        else if(e && event.ctrlKey && e.keyCode==79){
            console.log("Ctrl + X: ask lin to do");

        }
        // 按 Ctrl + D 删除
        else if(e && event.ctrlKey && e.keyCode==68){
            console.log("Ctrl + D: ask lin to do");

        }
        // 按 Ctrl + Z 撤销
        else if(e && event.ctrlKey && e.keyCode==90){
            console.log("Ctrl + Z: to be finished");

        }
        // 按 [ 放大
        else if(e && e.keyCode == 219){
            console.log("Ctrl + +: to be finished");

        }
        // 按 ] 缩小
        else if(e && e.keyCode == 221){
            console.log("Ctrl + -: to be finished");
            // zoomIn();
        }
        else{
        	console.log("e:", e);
        	// zoomOut();
        }
	};
}

addLoadEvent(init);
