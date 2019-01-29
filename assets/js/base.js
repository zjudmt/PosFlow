
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
		src: "/resources/PosFlow/2min.mp4",
	};
	source_data = {
		fps: 25,
		src: "/resources/PosFlow/tracklets.json",
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

	d3.json(source_data.src, function(error, data){
		data = filterData(data);
		tracklets = initData(data);
		// tracklets = filterData(tracklets);
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
	d3.select("body")
		.append("div")
		.attr("id","video-container")
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



addLoadEvent(init);
