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
				.attr("xlink:href", "../resources/PosFlow/img/field.png")
				.attr("transform", function(){
					return "translate("+ x + "," + y + ")";
				})
            	.attr("width", width)
            	.attr("height", height);

    // append the group of the birdseye_paths for the paths of the players
	birdseyeLayout.append("g")
				.attr("id", "birdseye_paths")
    // append the group of the birdseye_lines for the links of the players
	birdseyeLayout.append("g")
				.attr("id", "birdseye_lines")
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
					.domain([-12, 107])
					.range([x, x+width-padding.left-padding.right]);
	var yScale = d3.scaleLinear()
				.domain([0, 68])
				.range([y+height-padding.bottom, y+padding.top]);

	// select all circles in birdseye view 
	var paths = birdseyeLayout.select("#birdseye_paths")
							.selectAll("path")
							.data(path_tracklets);
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
		})
		// .attr("stroke-dasharray", dashArrayGenerator);


	var lines = birdseyeLayout.select("#birdseye_lines")
								.selectAll("line")
								.data(getLinkData());

	lines.exit().remove()
	lines.enter().append("line")

	// console.log("last_dbclicked:", last_dbclicked);

	lines.attr("class", "birdseye_lines")
		.attr("id", function(d, i) {
			return "birdseye_line" + String(i);
		})
		.attr("x1", function(d) {
			return xScale(birdseyeTransition(d["box1"])["x"]);
		})
		.attr("x2", function(d) {
			return xScale(birdseyeTransition(d["box2"])["x"]);
		})
		.attr("y1", function(d) {
			return yScale(birdseyeTransition(d["box1"])["y"]);
		})
		.attr("y2", function(d) {
			return yScale(birdseyeTransition(d["box2"])["y"]);
		})
		.attr("stroke", "gray")
		.attr("stroke-width", "5")
		.attr("stroke-opacity", "0.2")
		.on("dblclick", removeLink);


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
			if (isDashed(d)){
			  c_name += " dashed";
			}
			return c_name;
		})
		.attr("id", function(d,i){
			if(d["status"]=="selected")
				console.log(d["id"])
			return "birdseye_circle" + String(i);
		})
		.attr("cx", function(d){
			var index = getCurrentFrame()-d["start_frame"];
			// to correct the error of the data;
			index = d3.min([index, d["boxes"].length-1]);
			index = d3.max([0, index]);
			try{
				var pos_ab = birdseyeTransition(d["boxes"][index]);
			}
			catch(err){
				console.log("cx: ", d);
			}
			return xScale(pos_ab.x);					
		})
		.attr("cy", function(d){
			var index = getCurrentFrame()-d["start_frame"];
			// to correct the error of the data;
			index = d3.min([index, d["boxes"].length-1]);
			index = d3.max([0, index]);
			try{
				var pos_ab = birdseyeTransition(d["boxes"][index]);
			}
			catch(err){
				console.log("cy: ", d);
			}
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
		.on("dblclick", appendLink)
		.on("mouseover", function(d){
			setStatus(d["id"], "hover");
		})
		.on("mouseout", function(d){
			setStatus(d["id"], "default");
		})



	// change the data from the pixels in screen to the real play field
	// that is [0,3840] * [0,800] ----> [0,105]*[0,68] + outside
	function birdseyeTransition(box){
		var x = box[0]+box[2]/2;
		var y = box[1]+box[3];
		var x_ab = 28.683*(x-1890)/(y+228)+51.7317;
		var y_ab = 54835.2/(228+y)-54.4;
		return {x:x_ab, y:y_ab};
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
				for (var i = linked_pairs.length - 1; i >= 0; --i) {
					console.log(linked_pairs[i]);
				}
				console.log("linked data");
				console.log(getLinkData());
			}
		}
	}

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

	// generate the path string
	function trackGenerator(d){
		var lineGenerator = d3.line()
							.x(function(d){
								return xScale(d.x);
							})
							.y(function(d){
								return yScale(d.y);
							});

		var start_index = frame-d["start_frame"]-past_duration
		start_index = d3.min([start_index, d["boxes"].length-1-past_duration]);
		start_index = d3.max([0, start_index]);

		var end_index = frame - d["start_frame"] + future_duration;
		end_index = d3.max([0, end_index]);
		end_index = d3.min([end_index, d["boxes"].length-1]);

		var path_data = [];
		for(var i = start_index; i < end_index; ++i){
			try{
				path_data.push(birdseyeTransition(d["boxes"][i]));
			}
			catch(err){
				console.log("trackGenerator: ", d);
			}
		}
		return lineGenerator(path_data);
	}

}