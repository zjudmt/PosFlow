function initMonitor() {

	monitor = svg
		.append("g")
			.attr("id", "monitor")
			.datum(layout.monitor)
			.attr("transform", function(d){
				let str = "translate( " + d.x
				+ " , " + d.y + " )";
				return str
			})

	var video_obj = document.getElementById("video")
	video_obj.addEventListener("canplaythrough", function(){
		source_video.duration = this.duration;
		source_video.seconds = Math.round(this.duration);
		initControls();
		initMain();
	})
}

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
			x: 42, y: 0.7,
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

	function mousemove(){
		if (flag_control) {
			mouse = d3.mouse(this);
			console.log("mousemove",mouse);
			if(mouse[0] <= controls_data.progress_bar.x ||
			 mouse[0]>= controls_data.progress_bar.endpoint.x )
				flag_control = false;
			newtime = x2time(mouse[0])
			video.property("currentTime",newtime);
			// controls_data.timebox.current_time = newtime;

		}
	}
	function mousedown(){
		flag_control = true;
		mouse = d3.mouse(this);
		if(mouse[0] <= controls_data.progress_bar.x ||
		 mouse[0] >= controls_data.progress_bar.endpoint.x)
			flag_control = false;
		newtime = x2time(mouse[0])
		video.property("currentTime",newtime);
		// controls_data.timebox.current_time = newtime;
	}

	function mouseup(){
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

function initMain() {
	var layout_main = layout.monitor.main

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


	players = monitor.append("g")
		.attr("id", "players")

}

function getPlayerTransform(d) {
	var index = frame-d["start_frame"];
	index = d3.min([index, d["boxes"].length-1]);
	var pos = d["boxes"][index];
	var str = "translate(" + vid2x(pos[0]) +
	" , " + vid2y(pos[1]) + ")";
	// console.log(d.id, str);
	return str;
}

function getPlayerRectWidth(d) {
	var index = frame-d["start_frame"];
	index = d3.min([index, d["boxes"].length-1]);
	var pos = d["boxes"][index];
	var w = vid2w(pos[2])
	// console.log(w);
	return w;
}

function getPlayerRectHeight(d) {
	var index = frame-d["start_frame"];
	index = d3.min([index, d["boxes"].length-1]);
	var pos = d["boxes"][index];
	var h = vid2h(pos[3])
	// console.log(d, h);
	return h;
}

function updateMonitor() {
	updateMain();
}

function updateMain() {
	console.log("updateMain")
	players = monitor.select("#players")
		.selectAll("g").data(current_tracklets)
	players.enter().append("g")
	players.exit().remove();

	players.attr("transform", getPlayerTransform)
		.classed("main player", true)
		.attr("id", function(d) {
			return "main_" + d.id;
		})

	players.selectAll("rect").remove();

	rects = players.append("rect")
		.attr("width", getPlayerRectWidth)
		.attr("height", getPlayerRectHeight)
		.attr("stroke", function(d){return d.color})
		.classed("rect default", true)
		.attr("id", function(d){
			// console.log("300 d: ", d)
			return "rect_main_" + d.id} )

	function trackGenerator(d){
		var end_index = frame - d.start_frame;
		end_index = d3.min([end_index, d.boxes.length - 1]);
		var start_index = d3.max([frame - d.start_frame - 5 * source_video.fps, 0]);
		var current_point = {
			x: vid2x( d.boxes[end_index][0] + d.boxes[end_index][2] / 2 ),
			y: vid2y( d.boxes[end_index][1] + d.boxes[end_index][3] ),
		}
		var lineGenerator = d3.line()
							.x(function(d){
								return d.x ;
							} )
							.y(function(d){
								return d.y ;
							} );
		var path_data = [];
		for (var i = start_index; i < end_index; i++) {
			var track_point = {
				x: vid2x(d.boxes[i][0] + d.boxes[i][2]/2) - current_point.x ,
				y: vid2y(d.boxes[i][1] + d.boxes[i][3]) - current_point.y ,
			}
			path_data.push(track_point);
		}
		return lineGenerator(path_data);
	}

	function pathBasepoint(d) {
		var index = frame - d.start_frame;
		index = d3.min([index, d.boxes.length - 1]);
		var current_point = {
			x: vid2x(d.boxes[index][2] / 2 ),
			y: vid2y(d.boxes[index][3] ),
		}
		var str = "translate(" + current_point.x + ","
		+ current_point.y + ")";
		return str;
	}

	players.selectAll("path").remove()

	tracks = players.append("path")
		.attr("transform", pathBasepoint)
		.attr("d", trackGenerator)
		.classed("track player", true)
		.attr("stroke", function(d){
			return d.color});


}


