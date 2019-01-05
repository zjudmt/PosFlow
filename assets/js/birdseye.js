function initBirdseye(){
	var x = layout.birdseye.x;
	var y = layout.birdseye.y;
	var width = layout.birdseye.w;
	var height = layout.birdseye.h;
	var padding = {left:30, right:30, top:20, bottom:20};

	var xScale = d3.scaleLinear()
					.domain([-17, 107])
					.range([x, x+width-padding.left-padding.right]);
	var yScale = d3.scaleLinear()
				.domain([-10, 88])
				.range([y+height-padding.bottom, y+padding.top]);

	var birdseyeLayout = d3.select("svg")
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

	// append the points representing the location of players in birdseye view
	var circles = birdseyeLayout.append("g")
			.attr("class", "birdseye_circles")
			.selectAll(".birdseye_circle")
			.data(current_tracklets)
			.enter()
			.append("circle")
			.attr("class", "birdseye_circle")
			.attr("id", function(d,i){
				return "birdseye_circle" + String(i);
			})
			.attr("cx", function(d){
				var index = getCurrentFrame()-d["start_frame"];
				// to correct the error of the data;
				index = d3.min([index, d["boxes"].length-1]);
				var pos_ab = birdseyeTransition(d["boxes"][index]);
				return xScale(pos_ab.x);					
			})
			.attr("cy", function(d){
				var index = getCurrentFrame()-d["start_frame"];
				// to correct the error of the data;
				index = d3.min([index, d["boxes"].length-1]);
				var pos_ab = birdseyeTransition(d["boxes"][index]);
				return yScale(pos_ab.y);
			})
			.attr("r", 5)
			.attr("fill", function(d){
				return d["color"];
			})
			.on("mouseover", hoverPlayerCircle)
			.on("mouseout", unhoverPlayerCircle)
			.on("click", clickPlayerCircle);

	// append the path representing the location of players in birdseye view
	var path = birdseyeLayout.append("g")
			.attr("class", "birdseye_paths")
			.selectAll(".birdseye_path")
	 		.data(range_tracklets)
	 		.attr("class","birdseye_path")
	 		.enter()
	 		.append("path")
	 		.attr("id", function(d,i){
	 			return "birdseye_path" + String(i);
	 		})
	 		.attr("d", trackGenerator)
	 		.attr("fill-opacity", "0")
	 		.attr("stroke-opacity", "1")
	 		.attr("stroke-width", 2)
			.attr("stroke", function(d){
				return d["color"];
			});

	// change the data from the pixels in screen to the real play field
	// that is [0,3840] * [0,800] ----> [0,105]*[0,68] + outside
	function birdseyeTransition(box){
		var x = box[0];
		var y = box[1];
		var x_ab = 28.683*(x-1890)/(y+228)+51.7317;
		var y_ab = 54835.2/(228+y)-54.4;
		return {x:x_ab, y:y_ab};
	}

	function trackGenerator(d){
		var lineGenerator = d3.line()
							.x(function(d){
								return xScale(d.x);
							})
							.y(function(d){
								return yScale(d.y);
							});
		var path_data = [];
		for(var i = 0; i < d["boxes"].length; i++){
			path_data.push(birdseyeTransition(d["boxes"][i]));
		}
		return lineGenerator(path_data);
	}

	function hoverPlayerCircle(d){
		console.log("hover");
		var index = 0;
		for(; index < tracklets.length; ++index){
			if(tracklets[index]["id"] == d["id"]){
				break;
			}
		}
		if(index == tracklets.length){
			console.log("error");
			return;
		}
		if(tracklets[index]["status"] == "default"){
			tracklets[index]["status"] = "hover";
			console.log(tracklets[index]);
		}
	}

	function unhoverPlayerCircle(d){
		var index = 0;
		for(; index < tracklets.length; ++index){
			if(tracklets[index]["id"] == d["id"]){
				break;
			}
		}
		if(index == tracklets.length){
			console.log("error");
			return;
		}
		if(tracklets[index]["status"] == "hover"){
			tracklets[index]["status"] = "default";
		}
	}

	function clickPlayerCircle(d){
		var index = 0;
		for(; index < tracklets.length; ++index){
			if(tracklets[index]["id"] == d["id"]){
				break;
			}
		}
		if(index == tracklets.length){
			console.log("error");
			return;
		}
		tracklets[index]["status"] = "selected";
		for(var i = 0; i < tracklets.length; ++i){
			if(tracklets[i]["end_frame"] >= d["start_frame"] || tracklets[i]["start_frame"] <= d["end_frame"]){
				tracklets[i]["status"] = "conflict";
			}
		}
	}
}
