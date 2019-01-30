function initMonitor() {

	// monitor 是整个区域
	monitor = svg
		.append("g")
			.attr("id", "monitor")
			.datum(layout.monitor)
			.attr("transform", function(d){
				let str = "translate( " + d.x
				+ " , " + d.y + " )";
				return str
			})

	// 用flag_canplaythrough来判断是否已经初始化过monitor了
	flag_canplaythrough = false;
	var video_obj = document.getElementById("video")
	// 如果还拿不到duration 说明canplaythrough时间还没发生 那就添加个监听器
	if( !video_obj.duration ){
		video_obj.addEventListener("canplaythrough", function(){
			doInitMonitor();
		})
	}
	else{
		doInitMonitor();
	}
}

// 初始化Monitor区域 包括 Main 和 Controls
function doInitMonitor() {
	if(!flag_canplaythrough){
		var video_obj = document.getElementById("video")
		// 获取duration 进度条需要
		source_video.duration = video_obj.duration;
		source_video.seconds = Math.round(video_obj.duration);
		initMain();
		initControls();
		flag_canplaythrough = true;
	}
}


// 初始化Main 主要是生成各种需要的比例尺 以及添加main的group并设置id
function initMain() {

	var layout_main = layout.monitor.main

	// 从原始视频的坐标投影到main的线性坐标变化
	vid2x = d3.scaleLinear()
		.domain([0, source_video.w])
		.range([layout_main.x, layout_main.x + layout_main.w])

	vid2y = d3.scaleLinear()
		.domain([0, source_video.h])
		.range([layout_main.y, layout_main.y + layout_main.h])

	vid2w = d3.scaleLinear()
		.domain([0, source_video.w])
		.range([0, layout_main.w])

	vid2h = d3.scaleLinear()
		.domain([0, source_video.h])
		.range([0, layout_main.h])

	main = monitor.append("g")
		.attr("id", "players")

	path = main.append("g")
		.attr("id", "paths")

	rect = main.append("g")
		.attr("id", "rects")
}


function updateMain(){
	// 通过id选择器选中初始化时创建的 "g"
	main = d3.select("#players")

	// 动态绑定数据
	paths = main.select("#paths")
		.selectAll("path").data(path_tracklets)

	rects = main.select("#rects")
		.selectAll("rect").data(current_tracklets)



	// 如果有多的元素就remove掉
	paths.exit().remove();
	rects.exit().remove();

	// 如果需要新的元素就添加
	new_paths =  paths.enter().append("path")
	new_rects =  rects.enter().append("rect")



	// 在绑定矩形之前先绑定路径,避免矩形被路径遮挡
	// 通过路径生成器生成路径,然后使用pathBasepoint平移到球员脚下的位置
	paths.attr("transform", pathBasepoint)
		.attr("class", function(d){
				return d.status + " main";
		})
		.attr("id", function(d){
			return "path_"+d.id;
		})
		.attr("d", trackGenerator)
		.attr("stroke", function(d){
			if(d.status == "conflicted")
				return "#7a7374";
			else
				return d.color;
	});

	// 绑定矩形,长宽通过比例尺计算 同时绑定操作元素
	rects.attr("transform", getPlayerTransform)
		.attr("class", function(d){
			return d.status + " main";
		})
		.attr("id", function(d){
			return "rect_"+d.id;
		})
		.attr("width", getPlayerRectWidth)
		.attr("height", getPlayerRectHeight)
		.attr("stroke", function(d){
			// console.log(d.status)
			if(d.status == "conflicted")
				return "#7a7374";
			else
				return d.color;
		})
		.attr("stroke-dasharray", function(d){
			if(isDashed(d))
				return "4,4";
			else
				return "";
		})
		.on("click", selectTracklet)
		.on("mouseover", function(d){
			setStatus(d.id, "hover")
		})
		.on("mouseout", function(d){
			setStatus(d.id, "default")
	})

	// 路径生成器
	function trackGenerator(d){
		// 首先做判断,保证不会出现数组越界,同时尽可能至少保留5秒信息
		var end_index = indexS(frame - d.start_frame + future_duration, d);
		var start_index = indexS(frame - d.start_frame - past_duration, d);
		start_index = d3.min([start_index, d.boxes.length - 1 - past_duration]);

		// 以当前帧(保护过的)作为基准点
		var cur_frame = indexS(frame - d.start_frame, d);
		var current_point = {
			x: vid2x( d.boxes[cur_frame][0] + d.boxes[cur_frame][2] / 2 ),
			y: vid2y( d.boxes[cur_frame][1] + d.boxes[cur_frame][3] ),
		}
		// 使用d3的线段生成器
		var lineGenerator = d3.line()
			.x(function(d){return d.x ;})
			.y(function(d){return d.y ;});
		// 根据之前计算的下标,将合适的数据取出来
		var path_data = [];
		try{
			for (var i = start_index; i < end_index; i++) {
				if(!d.boxes[i])
					continue;
				var track_point = {
					x: vid2x(d.boxes[i][0] + d.boxes[i][2]/2) - current_point.x ,
					y: vid2y(d.boxes[i][1] + d.boxes[i][3]) - current_point.y ,
				}
				path_data.push(track_point);
			}
		}
		catch(err){
			console.log("start_index:", start_index)
			console.log("err:", err)
			console.log("end_index:", end_index)
			console.log("d.boxes.length:", d.boxes.length)
			console.log("id: ", d)
		}
		return lineGenerator(path_data);
	}

	function pathBasepoint(d) {
		var index = indexS(frame - d.start_frame, d);
		var current_point = {
			x: vid2x(d.boxes[index][2] / 2 ),
			y: vid2y(d.boxes[index][3] ),
		}
		var pos = d["boxes"][index];
		var base_x = vid2x(pos[0]) + current_point.x;
		var base_y = vid2y(pos[1]) + current_point.y;
		var str = "translate("+ base_x + "," + base_y + ")";
		return str;
	}
	if(rect_hide>0){
		paths.remove();
		rects.remove();
		
	}
}
// 各种取位移或者尺寸函数,都需要进行坐标保护
function getPlayerTransform(d) {
	var index = indexS(frame-d["start_frame"], d);
	var pos = d["boxes"][index];
	var str = "translate(" + vid2x(pos[0]) +
	" , " + vid2y(pos[1]) + ")";
	return str;
}

function getPlayerRectWidth(d) {
	var index = indexS(frame-d["start_frame"], d);
	var pos = d["boxes"][index];
	var w = vid2w(pos[2])
	// console.log(w);
	return w;
}

function getPlayerRectHeight(d) {
	var index = indexS(frame-d["start_frame"], d);
	var pos = d["boxes"][index];
	var h = vid2h(pos[3])
	// console.log(d, h);
	return h;
}

function updateMonitor() {
	updateMain();
}

// 通过时间获取
function getTimeText(current_time){
	let t = Math.floor(current_time);
	let min = Math.floor(current_time / 60);
	let sec = t % 60;
	let min_text = sec_text =  "";
	if (min < 10)
		min_text = "0" + min;
	else
		min_text += min;
	if (sec < 10)
		sec_text = "0" + sec;
	else
		sec_text += sec;
	time_text = min_text + ":" + sec_text;
	return time_text;
}

function initControls(){

	// 设置控制条的各种数值
	lo = {
		x: layout.monitor.controls.x,
		y: layout.monitor.controls.y,
		w: layout.monitor.controls.w,
		h: layout.monitor.controls.h,
		button: {
			x: 0.5,	y: 0.1,
			w: 1, h: 0.8,
		},
		progress_bar: {
			x: 1, y: 0.25,
			h: 0.2, w: 39,
		},
		timebox: {
			x: 42, y: 0.75,
			w: 6, h: 0.8,
		},
	}
	controls_data = {
		layout: layout.monitor.controls,
		color: "transparent",
		background:{
			x: 0, y: 0, color: "#282828",
			w: layout.monitor.controls.w,
			h: layout.monitor.controls.h,
		},
		button:{
			x: unit * lo.button.x , y: unit * lo.button.y ,
			w: unit * lo.button.w , h: unit * lo.button.h ,
			play:{
				href: "/resources/PosFlow/img/button_play.png"
			},
			pause:{
				href: "/resources/PosFlow/img/button_pause.png"
			}
		},
		timebox:{				
			x: unit * lo.timebox.x , y: unit * lo.timebox.y ,
			w: unit * lo.timebox.w , h: unit * lo.timebox.h ,
			total_time: getTimeText( source_video.duration ), current_time: "00:00",
		},
		progress_bar: {
			name: "progress_bar",
			x: unit * lo.progress_bar.x , y: unit * lo.progress_bar.y ,
			w: unit * lo.progress_bar.w , h: unit * lo.progress_bar.h ,
			x2: unit * lo.progress_bar.x,
			color: {
				unwatched: "#7c7c7c",
				watched: "#c1c1c1",
			},
			endpoint:{
				x: unit * (lo.progress_bar.x + lo.progress_bar.w),
			}
		}
	}

	time2x = d3.scaleLinear()
		.domain([0, source_video.duration])
		.range([controls_data.progress_bar.x, controls_data.progress_bar.endpoint.x])

	x2time = d3.scaleLinear()
		.domain([controls_data.progress_bar.x, controls_data.progress_bar.endpoint.x])
		.range([0, source_video.duration])

	timer_controls = d3.timer(callbackControls);
	flag_control = false;

	// 添加各个元素并设置属性
	var controls = monitor
		.append("g")
			.datum(controls_data.layout)
			.attr("id", "controls")
			.attr("transform", function(d){
				let str = "translate("+d.x+","+d.y+")"
				// console.log("this str", this, str, d)
				return str;
			})

	var background_controls = controls
		.append("rect")
			.datum(controls_data.background)
			.attr("width", function(d){return d.w})
			.attr("height", function(d){return d.h})
			.style("fill", function(d){return d.color})
			.attr("transform", function(d){
				return "translate("+d.x+","+d.y+")";
			})

	var button_controls = controls
		.append("svg:image")
			.datum(controls_data.button)
			.attr("height", function(d){return d.h})
			.attr("id", "button_controls")
			.classed("button", true)
			.attr("xlink:href", function(d){return d.play.href})
			.attr("transform", function(d){
				return "translate("+d.x+","+d.y+")";
			})
			.on("click", clickPlay)

	var progress_bar = controls
		.append("g")
		.datum(controls_data.progress_bar)
		.attr("class", "controls progress_bar")
		.attr("id","progress_bar")
		.attr("transform", function(d){return "translate("+d.x+","+d.y+")";})
		.on("mousedown",mousedown)
		.on("mouseup",mouseup)
		.on("mousemove",mousemove)

	var progress_bar_bg = progress_bar
		.append("line")
			.datum(controls_data.progress_bar)
			.attr("class","progress_bar controls unwatched")
			.attr("x1",function(d){return d.x})
			.attr("x2",function(d){return d.endpoint.x})
			.attr("y1",function(d){return d.y})
			.attr("y2",function(d){return d.y})

	var progress_bar_watched = progress_bar
		.append("line")
			.datum(controls_data.progress_bar)
			.attr("class","progress_bar controls watched")
			.attr("x1",function(d){return d.x})
			.attr("x2",function(d){return d.x2})
			.attr("y1",function(d){return d.y})
			.attr("y2",function(d){return d.y})

	var timebox = controls
		.append("text")
		.datum(controls_data.timebox)
		.attr("x",function(d){return d.x})
		.attr("y",function(d){return d.y})
		.attr("class","controls timebox text")
		.attr("id","timebox")


	function callbackControls() {
		if (video.property("paused")) {
			button_controls.attr("xlink:href",function(d){return d.play.href});
		}
		else{
			button_controls.attr("xlink:href",function(d){return d.pause.href});
		}
		var current_time = video.property("currentTime");
		var time_text = getTimeText(current_time);
		controls_data.timebox.current_time = time_text;
		timebox.text(function(d){return d.current_time+"/"+d.total_time; })
		controls_data.progress_bar.x2 = time2x(current_time);
		progress_bar_watched.attr("x2",function(d){return d.x2})
	}

	d3.select("#svg").on("mouseup.controls", mouseup)
	d3.select("#svg").on("mousemove.controls", mousemove)

	function mousemove(d){
		if (flag_control) {
			mouse = d3.mouse(this);
			cur_x = mouse[0];
			if(d.name != "progress_bar")
				cur_x -= controls_data.progress_bar.x
			cur_x = d3.max([cur_x, controls_data.progress_bar.x])
			cur_x = d3.min([cur_x, controls_data.progress_bar.endpoint.x])
			newtime = x2time(cur_x)
			video.property("currentTime",newtime);
		}
	}
	function mousedown(d){
		flag_control = true;
		mouse = d3.mouse(this);
		var cur_x = mouse[0]
		if(d.name != "progress_bar")
			cur_x -= controls_data.progress_bar.x
		if(cur_x >= controls_data.progress_bar.x
		&& cur_x<= controls_data.progress_bar.endpoint.x){
			newtime = x2time(mouse[0])
			video.property("currentTime",newtime);
		}
	}

	function mouseup(d){
		flag_control = false;
	}

	function clickPlay(){
		if (video.property("paused")){
			video._groups[0][0].play();
		}
		else{
			video._groups[0][0].pause();
		}
	}
}

