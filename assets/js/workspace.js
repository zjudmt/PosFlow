
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

function getColor(){
	var color={}
	color.R=0;
	color.G=0;
	color.B=0;
	return color
}

function getFrame(){
	return 2000
}

function initSvg(){
	console.log("initsvg")
	
	var svg=d3.select("body")
		.append("svg")
		.attr("width",width_svg)
		.attr("height",height_svg)
		.attr("transform", "translate(0,0)")
		.attr("id","svg");

			
}


function initWorkspace(){

	var x_start=layout.workspace.x//workspace起始位置
	var y_start=layout.workspace.y
	var width_workspace=layout.workspace.w//ws宽度
	var height_workspace=layout.workspace.h//ws高度

	var frame_current=getFrame()
	var color_bg="#666000"

	
	var height_select=Math.round(height_workspace*0.1)//选择框高度



	var width_rect=0//id框宽高
	var height_rect=10

	var width_line=width_workspace-width_rect//wsline宽度
	var thickness_line=10//线条宽度
	var distance_line=20//线条之间距离
	
	// 选取前后五秒出现的轨迹
	var data_handled=dataToWorkspace(tracklets,frame_current)

	
	var workspace=d3.select("svg")
		.append("g")
		.attr("transform","translate("+x_start+","+y_start+")")
		.attr("id","workspace")

	var background=workspace.append("g")
		.attr("id","ws_bg")



	var draged = d3.drag()
        .on('drag', function (d) {
            d3.select(this).attr("transform", "translate(" + 0 + "," + d3.event.y + ")");
        })

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
	
	
		
	var selected=content.append("g")
		.attr("id","content-selected")

	var toselect=content.append("g")

		.attr("id","content-toselect")
		.attr("transform","translate(0,"+height_select+")")
		// .call(zoom)

		
		
		// .call(draged)
	toselect.append("pattern")
		.attr("id","ws-pattern")
		.attr("width",width_workspace)
		.attr("height",height_workspace-height_select)
		.attr("viewbox","0,0,"+width_workspace+","+height_workspace-height_select)
	


	// 背景框
	background.append("rect")
		.attr("width",width_workspace)
		.attr("height",height_workspace)
		.attr("stroke",color_bg)
		.attr("stroke-width",1)
		.attr("fill","#99ccdd")


	background.append("line")
		.attr("x1",width_rect)
		.attr("y1",0)
		.attr("x2",width_rect)
		.attr("y2",height_workspace)
		.attr("stroke",color_bg)
		.attr("stroke-width",1)

	background.append("line")
		.attr("x1",0)
		.attr("y1",height_select)
		.attr("x2",width_workspace)
		.attr("y2",height_select)
		.attr("stroke",color_bg)
		.attr("stroke-width",1)
	// 当前帧虚线表示
	background.append("line")
		.attr("x1",width_rect+Math.round(width_line/2))
		.attr("y1",0)
		.attr("x2",width_rect+Math.round(width_line/2))
		.attr("y2",height_workspace)
		.attr("stroke","red")
		.attr("stroke-width",1)
		.attr("stroke-dasharray","5,5")


	// 处理数据
	for(var i=0;i<data_handled.length;i++){
		var newline=[]
		var x_startline=Math.round(data_handled[i].x_start*width_line),
			x_endline=Math.round(data_handled[i].x_end*width_line),
			y_line=(i+1)*(distance_line+thickness_line);

		newline.push([x_startline,y_line],[x_endline,y_line]);
		data_handled[i].line=newline;

		// console.log(data_handled[i])
	}

	// 
	var lineGenerator=d3.line()
		.x(function(d){return d[0]})
		.y(function(d){return d[1]})

	var groups=toselect.selectAll("g")
		.data(data_handled)
		.enter()
		.append("g")
		.attr("id",function(d){return "ws_"+d.id})

	// var g_rect=groups.append("g")
	// 	.attr("transform",function(d){return "translate(2,"+(d.line[0][1]-Math.round(height_rect/2))+")"})
	// 	.attr("id",function(d){return "wsrect_"+d.id})

	// // g_rect.append("rect")
	// // 	.attr("width",width_rect-4)
	// // 	.attr("height",height_rect)
	// // 	.attr("stroke",function(d){return d.color})
	// // 	.attr("stroke-width",1)
	// // 	.attr("fill","none")

	// g_rect.append("text")
	// 	.text(function(d){return d.id})
	// 	.attr("dy","1em")
	// 	.attr("class","text_rect_ws")
	// 	.attr("font-size","50%")


	var wsline=groups.append("g")
		.attr("transform","translate("+width_rect+",0)")
		.attr("id",function(d){return "wsline_"+d.id})
		.attr("fill","url(#ws-pattern")

	wsline.append("path")
		.attr("clip-path", "url(#ws-clipPath)")
		.attr("stroke",function(d){return d.color})
		.attr("stroke-width",thickness_line)
		.attr("fill","none")
		.attr('d',function(d){return lineGenerator(d.line)})

	let zoomRect = workspace.append("rect") //设置缩放的区域，一般覆盖整个绘图区
     .attr("width",width_workspace)
     .attr("height",height_workspace-height_select)
     .attr("transform","translate(0,"+height_select+")")
     .attr("fill","none")
     .attr("pointer-events","all")
     .call(zoom);	
}

function dataToWorkspace(tracklets,frame_current){
	var newdata=[],
		frame_range=75,
		num=0;
	var point_start=frame_current-frame_range,
		point_end=frame_current+frame_range;


	for(var i=0;i<tracklets.length;i++){
		if(tracklets[i].start_frame<point_end&&tracklets[i].end_frame>point_start){
			var newobj={}
			newobj.id=tracklets[i].id;
			newobj.x_start=Math.max(tracklets[i].start_frame-point_start,0)/(2*frame_range);
			newobj.x_end=Math.min(tracklets[i].end_frame-point_start,2*frame_range)/(2*frame_range);
			newdata.push(newobj);
		}
	}
	num=newdata.length
	for(var i=0;i<num;i++){
		newdata[i].y=(i+1)/(num+1);
		newdata[i].color="#123456"
	}
	return newdata;
}	


