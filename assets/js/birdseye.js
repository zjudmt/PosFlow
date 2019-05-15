function initBirdseye(){
	var x = layout.birdseye.x;
	var y = layout.birdseye.y;
	var width = layout.birdseye.w;
	var height = layout.birdseye.h;

	// append birdseyelayout
	birdseyeLayout = d3.select("svg")
						.append("g")
						.attr("id", "birdseye");

	// mouse position
    mouse_position = {x : -1, y : -1};
    cursor_on_birdseye = false;

	// append the play field image as the background image
	var image = birdseyeLayout.append("svg:image")
				.attr("xlink:href", "../resources/PosFlow/img/field.png")
				.attr("transform", function(){
					return "translate("+ x + "," + y + ")";
				})
            	.attr("width", width)
            	.attr("height", height)
            	.on("click", function(){
            		last_dbclicked = -1;
            	})
				.on("mousemove", updateMousePosition)
				.on("mouseover", function() {
					cursor_on_birdseye = true;
				})
				.on("mouseout", function() {
					cursor_on_birdseye = false;
				});


    // append the group of the birdseye_paths for the paths of the players
	birdseyeLayout.append("g")
				.attr("id", "birdseye_paths")
    // append the group of the birdseye_lines for the links of the players
	birdseyeLayout.append("g")
				.attr("id", "birdseye_lines")
    // append the group of the birdseye_circles for the positions of the players
	birdseyeLayout.append("g")
				.attr("id", "birdseye_circles")

	// 连线辅助线
	birdseyeLayout.append("line")
				.attr("id", "birdseye_assist_link_line")

}

function updateBirdseye(){
	// d3.select("svg").append("circle")
	// .attr("r", 10)
	// .attr("cx", mouse_position.x)
	// .attr("cy", mouse_position.y)

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
								.data(linked_tracklets);

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
		.attr("stroke-width", "5")
		.attr("stroke-opacity", "0.2")
		.attr("cursor", "pointer")
		.on("dblclick", removeLink);
		
	var assist_line = birdseyeLayout.select("#birdseye_assist_link_line");

	if (last_dbclicked != -1 && cursor_on_birdseye) {
		var start_box;
		var index = current_tracklets.length - 1;
		for (; index >= 0; --index) {
			if (current_tracklets[index]["id"] == last_dbclicked) {
				var start_frame = current_tracklets[index]["start_frame"];
				start_box = current_tracklets[index]["boxes"][frame-start_frame];
				break;
			}
		}
		assist_line
				.attr("x1", function(d) {
					return mouse_position.x / viewport.scale;
				})
				.attr("x2", function(d) {
					return xScale(birdseyeTransition(start_box)["x"]);
				})
				.attr("y1", function(d) {
					return mouse_position.y / viewport.scale;
				})
				.attr("y2", function(d) {
					return yScale(birdseyeTransition(start_box)["y"]);
				})
				.attr("stroke", "gray")
				.attr("stroke-width", "5")
				.attr("stroke-opacity", "0.2")
				.attr("cursor", "default")
				.on("click", function() {
					last_dbclicked = -1;
				});
	}
	else{
		assist_line.attr("stroke-opacity", "0")
			.attr()
	}

	// select all circles in birdseye view 
	var circles = birdseyeLayout.select("#birdseye_circles")
							.selectAll("circle")
							.data(current_tracklets)
	// fit the numbers of elements with the data
	circles.exit().select()
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
			// if(d["status"]=="selected")
				// console.log(d["id"])
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
		.on("mousemove", function(d, i){
			updateMousePosition();
		})
		.on("mouseover", function(d, i){
			cursor_on_birdseye = true;
			mouse_position.x = d3.select(this).attr("cx") * viewport.scale;
			mouse_position.y = d3.select(this).attr("cy") * viewport.scale;
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

function mousePosition(e) {
	if(e){
	    if(e.pageX || e.pageY){  //ff,chrome等浏览器
			return {x:e.pageX - 1, y:e.pageY - 1};
	    } else {
			return {  //ie浏览器
	                x:e.clientX + document.body.scrollLeft - document.body.clientLeft,
	                y:e.clientY + document.body.scrollTop - document.body.clientTop
			}
		}
	}
}

function updateMousePosition(d, i) {
	mouse_position = mousePosition(window.event)
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
