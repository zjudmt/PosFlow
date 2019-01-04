function initMonitor() {

	monitor = svg
		.append("g")
			.attr("id", "monitor")
			.datum(layout.monitor)
			.classed("controls", true)
			.attr("transform", function(d){
				let str = "translate( " + d.x
				+ " , " + d.y + " )";
				return str
			})
			// .attr("c")

	var video_obj = document.getElementById("video")
	video_obj.addEventListener("canplaythrough", function(){
		source_video.duration = this.duration;
		source_video.seconds = Math.round(this.duration);
		initControls();
	})
}


function initControls(){
	function getTimeText(time){
		let t = Math.floor(time);
		let min = Math.floor(time / 60);
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
			color: {
				unwatched: "#7c7c7c",
				watched: "#c1c1c1",
			},
			endpoint:{
				x: unit * (lo.progress_bar.x + lo.progress_bar.w),
			}
		}
	}

	var time2x = d3.scaleLinear()
		.domain([0, source_video.duration])
		.range([controls_data.progress_bar.x, controls_data.progress_bar.endpoint.x])

	var x2time = d3.scaleLinear()
		.domain([controls_data.progress_bar.x, controls_data.progress_bar.endpoint.x])
		.range([0, source_video.duration])

	timer_controls = d3.timer(callbackControls);

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
			.attr("x2",function(d){return d.x + 10})
			.attr("y1",function(d){return d.y})
			.attr("y2",function(d){return d.y})

	var timebox = controls
		.append("text")
		.datum(controls_data.timebox)
		.attr("x",function(d){return d.x})
		.attr("y",function(d){return d.y})
		.attr("class","controls timebox text")
		.attr("id","timebox")
		.text(function(d){return d.current_time+"/"+d.total_time; })


	function callbackControls(argument) {
		// body...
	}

	function mousemove(){
		// if (flag_control) {
		// 	mouse = d3.mouse(this);
		// 	// console.log("mousemove",mouse);
		// 	if(mouse[0]<=42 || mouse[0]>=2770)
		// 		flag_control = false;
		// 	newtime = currentPosTime(mouse[0])
		// 	video.property("currentTime",newtime);
		// 	progress_bar_watched.attr("x2",function(d){return currentTimePos(newtime);})

		// }
	}
	function mousedown(){
		// flag_control = true;
		// mouse = d3.mouse(this);
		// if(mouse[0]<=42 || mouse[0]>=2770)
		// 	flag_control = false;
		// newtime = currentPosTime(mouse[0])
		// video.property("currentTime",newtime);
		// progress_bar_watched.attr("x2",function(d){return currentTimePos(newtime);})
	}

	function mouseup(){
		// flag_control = false;
	}

	function clickPlay(){
		if (video.property("paused")){
			video._groups[0][0].play();
			button_controls.attr("xlink:href",function(d){return d.pause.href});
		}
		else{
			video._groups[0][0].pause();
			button_controls.attr("xlink:href",function(d){return d.play.href});
		}
	}

}

