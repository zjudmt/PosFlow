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


}

function initVideo(){
	// 添加video-container的div并设置布局
	d3.select("body")
		.append("div")
		.attr("id","video-container")
		.style("top", layout.monitor.main.y + "px")
		.style("left", layout.monitor.main.x + "px")	
	
	// 添加视频
	video = d3.select("#video-container")
		.append("video")
			.attr("width", layout.monitor.main.w + "px" )
			.attr("height", layout.monitor.main.h + "px" )
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
			x: 3, y: 0.4,
			h: 0.2, w: 35,
		},
		timebox: {
			x: 38, y: 0.1,
			w: 8, h: 0.8,
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
			total_time: "--:--", current_time: "00:00",
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

	var time2x = d3.scalelinear()
		.domain([0, source_video.duration])
		.range([controls_data.progress_bar.x, controls_data.progress_bar.endpoint.x])

	var x2time = d3.scalelinear()
		.domain([controls_data.progress_bar.x, controls_data.progress_bar.endpoint.x])
		.range([0, source_video.duration])

	timer_controls = d3.timer(callbackControls);

	controls = svg
		.append("g")
			.datum(controls_data)
			.attr("id", "controls")
			.attr("transform", function(d){
				return "translate("+d.x+","+d.y+")";
			})

	background
}

