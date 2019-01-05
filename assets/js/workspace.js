
// var width_svg=1000
// var height_svg=800
// var x_workspace=500
// var y_workspace=400




// d3.json("src/tracklets.json",function(error,data2) {
// 	tracklets=data2
// 	console.log(tracklets)
// 	initSvg()

// 	initWorkspace()
// });



function initWorkspace(){

	var x_start=layout.workspace.x//workspace起始位置
	var y_start=layout.workspace.y
	var width_workspace=layout.workspace.w//ws宽度
	var height_workspace=layout.workspace.h//ws高度

	var color_bg="#191b21" //

	
	var height_select=Math.round(height_workspace*0.1)//选择框高度



	var width_rect=0//id框宽高
	var height_rect=10

	var width_line=width_workspace-width_rect//wsline宽度
	var thickness_line=10 //线条宽度
	var distance_line=5 //线条之间距离
	
	// 选取前后五秒出现的轨迹
	// var range_tracklets=dataToWorkspace(tracklets,frame)
	// var range_tracklets=getTrackletsInRange(tracklets,frame, past_duration, future_duration)


	workspace=d3.select("svg")
		.append("g")
		.attr("transform","translate("+x_start+","+y_start+")")
		.attr("id","workspace")

	var background=workspace.append("g")
		.attr("id","ws_bg")

	var draged = d3.drag()
        .on('drag', function (d) {
            d3.select(this).attr("transform", "translate(" + 0 + "," + d3.event.y + ")");
        })

	


		// console.log(d3.select("#ws_content").transform)
	var content=workspace.append("g")
		.attr("id","ws_content")
		.attr("width",width_workspace)
		.attr("height",height_workspace)

	workspace.append("clipPath")
		.attr("id","ws-clipPath")
		.append("rect")
		.attr("width",width_workspace)
		.attr("height",height_workspace-height_select)
	
	
		
	

		
		
		


	// 背景框
	background.append("rect")
		.attr("width",width_workspace)
		.attr("height",height_workspace)


	background.append("line")
		.attr("id", "seperation")
		.attr("x1",width_rect)
		.attr("y1",0)
		.attr("x2",width_rect)
		.attr("y2",height_workspace)

	background.append("line")
		.attr("x1",0)
		.attr("y1",height_select)
		.attr("x2",width_workspace)
		.attr("y2",height_select)
		.attr("stroke",color_bg)
		.attr("stroke-width",1)
	// 当前帧虚线表示
	background.append("line")
		.attr("id", "current")
		.attr("x1",width_rect+Math.round(width_line*past_duration/(future_duration+past_duration)))
		.attr("y1",0)
		.attr("x2",width_rect+Math.round(width_line*past_duration/(future_duration+past_duration)))
		.attr("y2",height_workspace)



	var zoom = d3.zoom()
				// .scaleExtent([1, 10])
				// .translateExtent([[0,0], [100, 100]])
				.extent([[0,0],[10,10]])
				.on("zoom", zoomed);
	// console.log(zoom.extent)

	function zoomed() {
		console.log(d3.event.transform)
		d3.select("#content-toselect").attr("transform", "translate(0,"+d3.event.transform.y+")");
	}
	let zoomRect = content.append("g").append("rect") //设置缩放的区域，一般覆盖整个绘图区
     .attr("width",width_workspace)
     .attr("height",height_workspace-height_select)
     .attr("transform","translate(0,"+height_select+")")
     .attr("fill","none")
     .attr("pointer-events","all")
     .call(zoom);
		

	
}


function updateWorkspace(){

	var x_start=layout.workspace.x//workspace起始位置
	var y_start=layout.workspace.y
	var width_workspace=layout.workspace.w//ws宽度
	var height_workspace=layout.workspace.h//ws高度

	var color_bg="#191b21" //

	
	var height_select=Math.round(height_workspace*0.1)//选择框高度



	var width_rect=0//id框宽高
	var height_rect=10

	var width_line=width_workspace-width_rect//wsline宽度
	var thickness_line=10 //线条宽度
	var distance_line=5 //线条之间距离





	var content=d3.select("#ws_content")

	content.selectAll("g").remove();



	var selected=content.append("g")
		.attr("id","content-selected")

	var toselect=content.append("g")

		.attr("id","content-toselect")
		.attr("transform","translate(0,"+height_select+")")

	var groups=toselect.selectAll("g")
		.data(range_trackletsWsVer)
		.enter()
		.append("g")
		.attr("id",function(d){return "ws_"+d.id})

	


	var wsline=groups.append("g")
		.attr("transform","translate("+width_rect+",0)")
		.attr("id",function(d){return "wsline_"+d.id})
		// .call(zoom)
	wsline.append("line")
		.attr("x1",function(d){return width_workspace*(d.start_frame-(frame-past_duration))/(past_duration+future_duration)})
		.attr("x2",function(d){return width_workspace*(d.end_frame-(frame-past_duration))/(past_duration+future_duration)})
		.attr("y1",function(d,i){return (i+1)*(thickness_line+distance_line)+height_select})
		.attr("y2",function(d,i){return (i+1)*(thickness_line+distance_line)+height_select})
		// .attr("clip-path", "url(#ws-clipPath)")
		.attr("stroke",function(d){return d.color})
		.attr("stroke-width",thickness_line)
		
		
}
