function initBirdseye(){
	var x = layout.birdseye.x;
	var y = layout.birdseye.y;
	var width = layout.birdseye.w;
	var height = layout.birdseye.h;

	// append birdseyelayout
	birdseyeLayout = d3.select("svg")
						.append("g")
						.attr("id", "birdseye");

	// append the play field image as the background image
	var image = birdseyeLayout.append("svg:image")
				.attr("xlink:href", "/resources/PosFlow/img/field.png")
				.attr("transform", function(){
					return "translate("+ x + "," + y + ")";
				})
            	.attr("width", width)
            	.attr("height", height);

    // append the group of the birdseye_paths for the paths of the players
	birdseyeLayout.append("g")
				.attr("id", "birdseye_paths")
    // append the group of the birdseye_circles for the positions of the players
	birdseyeLayout.append("g")
				.attr("id", "birdseye_circles")
}

function updateBirdseye(){
	var x = layout.birdseye.x;
	var y = layout.birdseye.y;
	var width = layout.birdseye.w;
	var height = layout.birdseye.h;
	var padding = {left:30, right:30, top:20, bottom:20};

	var xScale = d3.scaleLinear()
					.domain([-16, 110])
					.range([x, x+width-padding.left-padding.right]);
	var yScale = d3.scaleLinear()
				.domain([5, 70])
				.range([y+height-padding.bottom, y+padding.top]);

	// select all circles in birdseye view 
	var paths = birdseyeLayout.select("#birdseye_paths")
							.selectAll("path")
							.data(current_tracklets)
	// fit the numbers of elements with the data
	paths.exit().remove()
	paths.enter().append("path")
	// set attributes of the elements
	paths.attr("class",function(d){
			return d["status"] + " birdseye_path"
		})
	 	.attr("id", function(d,i){
	 		return "birdseye_path" + String(i);
	 	})
	 	.attr("d", trackGenerator)
		.attr("stroke", function(d){
			return d["color"];
		});

	// select all circles in birdseye view 
	var circles = birdseyeLayout.select("#birdseye_circles")
							.selectAll("circle")
							.data(current_tracklets)
	// fit the numbers of elements with the data
	circles.exit().remove()
	circles.enter().append("circle")
	// set attributes of the elements
	circles.attr("class", function(d){
			var c_name = "birdseye_circle " + d.status;
			if (isDash(d)){
			  c_name += " dashed";
			}
			return c_name;
		})
		.attr("id", function(d,i){
			return "birdseye_circle" + String(i);
		})
		.attr("cx", function(d){
			var index = getCurrentFrame()-d["start_frame"];
			// to correct the error of the data;
			index = d3.min([index, d["boxes"].length-1]);
			index = d3.max([0, index]);
			var pos_ab = birdseyeTransition(d["boxes"][index]);
			return xScale(pos_ab.x);					
		})
		.attr("cy", function(d){
			var index = getCurrentFrame()-d["start_frame"];
			// to correct the error of the data;
			index = d3.min([index, d["boxes"].length-1]);
			index = d3.max([0, index]);
			var pos_ab = birdseyeTransition(d["boxes"][index]);
			return yScale(pos_ab.y);
		})
		.attr("r", 8)
		.attr("fill", function(d){
			if(d["status"] == "conflicted"){
				return "#7a7374";
			}
			else{
				return d["color"];
			}
		})
		.on("click", selectTracklet)
		.on("mouseover", function(d){
			setStatus(d["id"], "hover");
		})
		.on("mouseout", function(d){
			setStatus(d["id"], "default");
		})

	// change the data from the pixels in screen to the real play field
	// that is [0,3840] * [0,800] ----> [0,105]*[0,68] + outside
	function birdseyeTransition(box){
		var x = box[0];
		var y = box[1];
		var x_ab = 28.683*(x-1890)/(y+228)+51.7317;
		var y_ab = 54835.2/(228+y)-54.4;
		return {x:x_ab, y:y_ab};
	}

	// generate the path string
	function trackGenerator(d){
		var lineGenerator = d3.line()
							.x(function(d){
								return xScale(d.x);
							})
							.y(function(d){
								return yScale(d.y);
							});

		var start_index = d3.max([0, frame-d["start_frame"]-past_duration]);
		start_index = d3.min([start_index, d.boxes.length - 1]);

		var end_index = frame - d["start_frame"];
		end_index = d3.min([end_index+future_duration, d.boxes.length - 1]);
		end_index = d3.max([0, end_index]);

		var path_data = [];
		for(var i = start_index; i < end_index; ++i){
			path_data.push(birdseyeTransition(d["boxes"][i]));
		}
		return lineGenerator(path_data);
	}

	// ["interpolation"][i][0] for start frame and ["interpolation"][j][1] for end frame
	function dashArrayGenerator(d){
		// start
		var start_index = d3.max([0, frame-d["start_frame"]-past_duration]);
		start_index = d3.min([start_index, d.boxes.length - 1]);
		// end
		var end_index = frame - d["start_frame"];
		end_index = d3.min([end_index+future_duration, d.boxes.length - 1]);
		end_index = d3.max([0, end_index]);

		var dash_index = d["interpolation"].length;
		for(var i = 0, len = d["interpolation"].length; i < len; ++i){
			if(start_index+d["start_frame"] < d["interpolation"][i][1]){
				dash_index = i;
				break;
			}
		}

		var dash_str = "";
		var pixel_length = 0;
		var unit_length = 2;
		var pre_pos = birdseyeTransition(d["boxes"][start_index]);
		for(start_index++; start_index<end_index && dash_index<d["interpolation"].length; ++start_index){
			var cur_pos = birdseyeTransition(d["boxes"][start_index]);
			var dx = xScale(cur_pos.x)-xScale(pre_pos.x);
			var dy = yScale(cur_pos.y)-yScale(pre_pos.y);
			pixel_length += Math.sqrt(dx*dx, dy*dy);

			if(d["start_frame"]+start_index == d["interpolation"][0]){
				dash_str += String(pixel_length)+",";
				pixel_length = 0;
			}
			else if(d["start_frame"]+start_index == d["interpolation"][1]){
				var m = Math.floor(pixel_length/unit_length);
				dash_str += String(0)+",";
				for(var i = 0; i < m; ++i){
					dash_str += String(unit_length)+",";
				}
				dash_str += String(pixel_length-m*unit_length)+",";
				if(m%2 == 0){
					dash_str += String(0)+",";
				}
				dash_index++;
				pixel_length = 0;
			}
			pre_pos = cur_pos;
		}
		for(var i = start_index; i < end_index; ++i){
			var cur_pos = birdseyeTransition(d["boxes"][i]);
			var dx = xScale(cur_pos.x)-xScale(pre_pos.x);
			var dy = yScale(cur_pos.y)-yScale(pre_pos.y);
			pixel_length += Math.sqrt(dx*dx, dy*dy);
			pre_pos = cur_pos;
		}
		dash_str += String(pixel_length);
		// console.log(dash_str);
		return dash_str;
	}
}