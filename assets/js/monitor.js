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

		initMouseScroll();
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
	
	zoom_main = d3.zoom()
			.scaleExtent([1, 8])
			// .translateExtent([0,0],[0,0])
			// .extent([[0,0],[100,100]])
			.on("zoom", zoomed_main)
	drag_main = d3.drag()
			.on("drag", null)

	main_clip = monitor.append("clipPath")
		.attr("id", "main-clip")
		.append("rect")
		.attr("height", layout_main.h)
		.attr("width", layout_main.w)
		// .call(zoom_main)

	panel = monitor.append("rect")
		.attr("id", "panel")
		.attr("height", layout_main.h)
		.attr("width", layout_main.w)
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("click", function() {
			last_dbclicked = -1;
		})
		// .call(drag_main)
		.call(zoom_main)
		.on("mousemove", updateMousePosition)
		.on("mouseover", function() {
			cursor_on_main = true;
		})
		.on("mouseout", function() {
			cursor_on_main = false;
		})

	main = monitor.append("g")
		.attr("clip-path", "url(#main-clip)")
		.append("g")
		.attr("id", "players")
		// .call(drag)
		.call(zoom_main)

	path = main.append("g")
		.attr("id", "paths")

	rect = main.append("g")
		.attr("id", "rects")

	line = main.append("g")
		.attr("id", "lines")

	main_mouse_position = {x : -1, y : -1};
    cursor_on_main = false;


	function updateMousePosition() {
		main_mouse_position = mousePosition(window.event)
	}

	function mousePosition(e) {
    	if(e.pageX || e.pageY){  //ff,chrome等浏览器
			return {x:e.pageX - 2, y:e.pageY - 2};
	    } else {
			return {  //ie浏览器
                x:e.clientX + document.body.scrollLeft - document.body.clientLeft,
                y:e.clientY + document.body.scrollTop - document.body.clientTop
			}
     	}
	}

}

function zoomed_main() {
	
	var t = d3.event.transform;
	t = zoomS(t);
	main.attr("transform", t);
	var dom = document.getElementById('video-container');

	var vid_w = layout.new_video.w;
	var vid_h = layout.new_video.h;
	var dy = t.y;
	var dx = t.x;
	var k = t.k;
	var new_left = dx * viewport.scale + 0.5 * (k-1) * vid_w ;
	var new_top = dy * viewport.scale + 0.5 * (k-1) * vid_h ;
	var new_scale = t.k;
	dom.style.transform = "translate("+new_left+"px,"
		+new_top+"px)scale("+new_scale+")";
	d3.zoom().transform(panel, t);
	d3.zoom().transform(main, t);
}

function updateMain(){
	// 通过id选择器选中初始化时创建的 "g"
	main = d3.select("#players")

	// 动态绑定数据
	paths = main.select("#paths")
		.selectAll("path").data(path_tracklets)

	rects = main.select("#rects")
		.selectAll("rect").data(current_tracklets)

	lines = main.select("#lines")
		.selectAll("line").data(getLinkData())


	// 如果有多的元素就remove掉
	paths.exit().remove();
	rects.exit().remove();
	lines.exit().remove();

	// 如果需要新的元素就添加
	new_paths =  paths.enter().append("path")
	new_rects =  rects.enter().append("rect")
	new_lines =  lines.enter().append("line")


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

	lines.attr("class", "main line")
		.attr("id", function(d, i) {
			return "main_line" + String(i);
		})
		.attr("x1", function(d) {
			return vid2x(d["box1"][0]) + vid2x(d["box1"][2] / 2 );
		})
		.attr("x2", function(d) {
			return vid2x(d["box2"][0]) + vid2x(d["box2"][2] / 2 );
		})
		.attr("y1", function(d) {
			return vid2x(d["box1"][1]) + vid2x(d["box1"][3] / 2 );
		})
		.attr("y2", function(d) {
			return vid2x(d["box2"][1]) + vid2x(d["box2"][3] / 2 );
		})
		.attr("stroke", function(d) {
			var id = d["id1"];
			for(var found = true; found; ) {
				found = false;
				for (var i = 0; i < linked_pairs.length; ++i) {
					if (linked_pairs[i][1] == id) {
						id = linked_pairs[i][0];
						found = true;
						break;
					}
				}
			}
			// console.log(linked_pairs);
			// console.log(getColorByID(id))
			return getColorByID(id);
		})
		.attr("stroke-width", "3")
		.attr("stroke-opacity", "0.2")
		.attr("cursor", "crosshair")
		.on("dblclick", removeLink);

	d3.select("#main_assist_link_line").remove()
	if (last_dbclicked != -1 && cursor_on_main) {
		var start_box;
		var index = current_tracklets.length - 1;
		for (; index >= 0; --index) {
			if (current_tracklets[index]["id"] == last_dbclicked) {
				var start_frame = current_tracklets[index]["start_frame"];
				start_box = current_tracklets[index]["boxes"][frame-start_frame];
				break;
			}
		}
		var scale = window.innerWidth / 1536;
		main.append("line")
				.attr("id", "main_assist_link_line")
				.attr("x1", function(d) {
					return main_mouse_position.x / scale;
				})
				.attr("x2", function(d) {
					return vid2x(start_box[0]) + vid2x(start_box[2] / 2 );
				})
				.attr("y1", function(d) {
					return (main_mouse_position.y) / scale - layout.monitor.y;
				})
				.attr("y2", function(d) {
					return vid2x(start_box[1]) + vid2x(start_box[3] / 2 );
				})
				.attr("stroke", "gray")
				.attr("stroke-width", "3")
				.attr("stroke-opacity", "0.2")
				.attr("cursor", "crosshair")
				.on("click", function() {
					last_dbclicked = -1;
				});
	}


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
		.on("dblclick", appendLink)
		.on("click", selectTracklet )
		.on("mouseover", function(d){
			cursor_on_main = true
			setStatus(d.id, "hover")
		})
		.on("mouseout", function(d){
			cursor_on_main = false
			setStatus(d.id, "default")

		
	})

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

	function removeLink(d) {
		console.log("remove link")
		for (var i = 0; i < linked_pairs.length; ++i) {
			if (linked_pairs[i][0] == d["id1"] && linked_pairs[i][1] == d["id2"]) {
				linked_pairs.splice(i--, 1);
			}
		}
	}

	function appendLink(d) {
		console.log("append link")
		if (last_dbclicked == -1) {
			last_dbclicked = d["id"];
		} else {
			var found = false;
			for (var i = current_tracklets.length - 1; i >= 0; --i) {
				if (current_tracklets[i]["id"] == last_dbclicked) {
					found = true;
					break;
				}
			}
			if (!found) {
				last_dbclicked = -1;
			} else {
				found = false;
				for (var i = linked_pairs.length - 1; i >= 0; --i) {
					if (linked_pairs[i][0] == last_dbclicked && linked_pairs[i][1] == d["id"]) {
						found = true;
						break;
					} else if (linked_pairs[i][0] == d["id"] && linked_pairs[i][1] == last_dbclicked){
						found = true;
						break;
					}
				}
				if (!found) {
					linked_pairs.push([last_dbclicked, d["id"]]);
				}
				last_dbclicked = d["id"];
			}
		}
	}

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
	updateMark();
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
		mark_line:{
			y1:0.1,
			y2:0.4,
		}
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
		},
		
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

	var mark_line_group=progress_bar
		.append("g")
		.attr("id","markgroup");

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


function updateMark(){

	var mark_line_group=monitor.select("#markgroup");
	var mark_line=mark_line_group
		.selectAll("line")
		.data(tracklets.marklines)

	mark_line.exit().remove();
	mark_line.enter().append("line");

	mark_line.attr("class","mark_line")
		.attr("x1",function(d){return d.x})
		.attr("y1",function(d){return d.y1})
		.attr("x2",function(d){return d.x})
		.attr("y2",function(d){return d.y2})
		.on("dblclick",function(d,i){
			tracklets.marklines.splice(i,1);
			console.log(tracklets.marklines)
			})
}

function initMouseScroll() {
	document.body.onmousewheel = function(event){
	    var t = event || window.event;
	    // console.log(t);
	}
}


