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
			var c = "birdseye_circle " + d.status;
			if(isDash(d)){
				c += " dashed";
			}
			return c;
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
			if(d["status"] == "conflicted")
				return "#7a7374";
			else
				return d["color"];
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

		var start_index = d3.max([0, frame-d["start_frame"]-5*source_video.fps]);
		start_index = d3.min([start_index, d.boxes.length - 1]);

		var end_index = frame - d.start_frame;
		end_index = d3.min([end_index+5*source_video.fps, d.boxes.length - 1]);
		end_index = d3.max([0, end_index]);

		var path_data = [];
		for(var i = start_index; i < end_index; ++i){
			path_data.push(birdseyeTransition(d["boxes"][i]));
		}
		return lineGenerator(path_data);
	}

	// ["dashed"][i][0] for start frame and ["dashed"][j][1] for end frame
	// function dashArrayGenerator(d){
	// 	start_index = d["dashed"][0][0];
	// 	end_index = d["dashed"][0][1];
	// 	for(var i = 0; i < d; ++i){
	// 		if(d[i] < d[])
	// 	}
	// }
}