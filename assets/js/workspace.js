function initWorkspace(){

	var x_start=layout.workspace.x//workspace起始位置
	var y_start=layout.workspace.y
	var width_workspace=layout.workspace.w-unit//ws宽度
	var height_workspace=layout.workspace.h//ws高度
	
	var img_list=["/resources/PosFlow/img/chain.png",
	"/resources/PosFlow/img/chain-broken.png",
	"/resources/PosFlow/img/trash.png",
	"/resources/PosFlow/img/chain-broken.png",
	
	"/resources/PosFlow/img/upload.png",
	"/resources/PosFlow/img/download.png"]

	var width_buttonarea=height_workspace/img_list.length
	var width_graph=width_workspace-width_buttonarea

	var color_bg="#191b21" //
	var img_propotion=0.7//按钮图像占比
	var width_side=width_buttonarea*(1-img_propotion)/2
	
	var height_select=Math.round(height_workspace*0.1)//选择框高度



	var width_rect=0//id框宽高
	var height_rect=10

	var width_line=width_graph//wsline宽度
	var thickness_line=10 //线条宽度
	var distance_line=5 //线条之间距离
	
	y_drag=0//滚动条高度


	workspace=d3.select("svg")
		.append("g")
		.attr("id","workspace")
		.attr("transform","translate("+x_start+","+y_start+")")

	//按钮区域
	var buttonarea=workspace.append("g")
		.attr("id","ws_ba")
	
	for(var i=0;i<img_list.length;i++){
		buttonarea.append("g")
			.attr("id","wsbuttong-"+(i+1))
			.attr("transform","translate(0,"+i*width_buttonarea+")")
			.append("svg:image")
			.attr("id","wsbutton-"+(i+1))
			.attr("class","wsbutton")
			.classed("button", true)
			.classed("enable",false)
			.attr("transform","translate("+width_side+","+width_side+")")
			.attr("xlink:href", img_list[i])
			.attr("height",width_buttonarea*img_propotion)
			
	}
	//merge按钮
	// var button_merge= buttonarea.select("#wsbutton-1")
	buttonarea.select("#wsbutton-1").append("title").text("merge")
	buttonarea.select("#wsbutton-2").append("title").text("cut")
	buttonarea.select("#wsbutton-3").append("title").text("delete")
	buttonarea.select("#wsbutton-4").append("title").text("selectvideo")
	buttonarea.select("#wsbutton-5").append("title").text("load")
	buttonarea.select("#wsbutton-6").append("title").text("save")

	buttonarea.select("#wsbutton-4").classed("enable",true)
	buttonarea.select("#wsbutton-5").classed("enable",true)
	buttonarea.select("#wsbutton-6").classed("enable",true)
	
	buttonarea.select("#wsbutton-1").on("click",merge)
	buttonarea.select("#wsbutton-2").on("click",cutline)
	buttonarea.select("#wsbutton-3").on("click",trash)
	buttonarea.select("#wsbutton-4").on("click",selectvideo)
	buttonarea.select("#wsbutton-5")
		.attr("type","file")
		.on("click",load)
	buttonarea.select("#wsbutton-6").on("click",save)



	var background=workspace.append("g")
		.attr("id","ws_bg")
		.attr("transform","translate("+width_buttonarea+",0)")
		
	

	workspace.append("clipPath")
		.attr("id","ws-clipPath")
		.append("rect")
		// .attr("transform","translate(0,"+height_select+")")
		.attr("width",width_graph)
		.attr("height",height_workspace-height_select)

	workspace.append("clipPath")
		.attr("id","ws-clipPath2")
		.append("rect")
		.attr("width",width_graph)
		.attr("height",height_select)

	// 背景框
	background.append("rect")
		.attr("width",width_graph)
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
		.attr("x2",width_graph)
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
		.on("click",function(){console.log("hhh")})



	zoom = d3.zoom()
				.scaleExtent([0,2])
				// .translateExtent([[0,0], [100, 100]])
				// .extent([[0,0],[10,10]])
				.on("zoom", zoomed);
	// console.log(zoom.extent)

	function zoomed() {
		console.log(d3.event.transform)
		var y_transform=d3.event.transform.y
		// if(d3.event.transform.k==1)return 0 //禁用拖拽
		// if(!(y_drag>=0&&y_transform<0||
		// y_drag<=(-range_trackletsWsVer.length*(thickness_line+distance_line)+height_workspace-height_select)&&y_transform>0))//设置滑动范围
			
		// else
			if(d3.event.transform.k!=1){
				if(!(y_drag>=0&&y_transform<0||y_drag<=(-range_trackletsWsVer.length*(thickness_line+distance_line)+height_workspace-height_select)&&y_transform>0))//设置滑动范围
					y_drag-=d3.event.transform.y
			d3.event.transform.k=1
			d3.event.transform.y=0}
			
		
	}


	var content=workspace.append("g")
		.attr("id","ws_content")
		.attr("transform","translate("+width_buttonarea+",0)")
		.attr("width",width_graph)
		.attr("height",height_workspace)
		.call(zoom)
	
    let zoomRect = content.append("g").append("rect") //设置缩放的区域，一般覆盖整个绘图区
		.attr("width",width_graph)
		.attr("height",height_workspace-height_select)
		.attr("transform","translate(0,"+height_select+")")
		.attr("fill","none")
		.attr("pointer-events","all")	
		
		

	var selected=content.append("g")
		.attr("id","content-selected")

	var toselect=content.append("g")
		.attr("id","content-toselect")
		.attr("transform","translate(0,"+height_select+")")
		.attr("width",width_graph)
		.attr("height",height_workspace-height_select)
		
}


function updateWorkspace(){

	var x_start=layout.workspace.x//workspace起始位置
	var y_start=layout.workspace.y
	var width_workspace=layout.workspace.w-unit//ws宽度
	var height_workspace=layout.workspace.h//ws高度
	var img_list=["/resources/PosFlow/img/chain.png",
	"/resources/PosFlow/img/chain-broken.png",
	"/resources/PosFlow/img/trash.png",
	"/resources/PosFlow/img/upload.png",
	"/resources/PosFlow/img/download.png"]
	var width_buttonarea=height_workspace/img_list.length
	var width_graph=width_workspace-width_buttonarea


	var color_bg="#191b21" //

	
	var height_select=Math.round(height_workspace*0.1)//选择框高度



	var width_rect=0//id框宽高
	var height_rect=10

	var width_line=width_workspace-width_rect//wsline宽度
	var thickness_line=10 //线条宽度
	var distance_line=5 //线条之间距离





	var area_selected=d3.select("#content-selected")
	var area_toselect=d3.select("#content-toselect")

	
	//更新按钮状态

	merge_button=d3.select("#wsbutton-1")
	cut_button=d3.select("#wsbutton-2")
	trash_button=d3.select("#wsbutton-3")

	cut_button.classed("enable",false);
	trash_button.classed("enable",false);

	if(selected.length==2)
		merge_button.classed("enable",true)
	else{
		merge_button.classed("enable",false)
		if(selected.length==1){
			trash_button.classed("enable", true)	
			var tracklet_temp=selected[0]
			if (frame > tracklet_temp.start_frame && frame < tracklet_temp.end_frame)
				cut_button.classed("enable",true);
			// for(var i=0;i<tracklet_temp.interpolation.length;i++){
			// 	if(frame>=tracklet_temp.interpolation[i][0]&&frame<=tracklet_temp.interpolation[i][1]){
			// 		cut_button.classed("enable",true);
			// 		break;
			// 	}
			// }
		}
	}


	var sgroups=area_selected.selectAll("line")
		.data(selected.sort(function(a,b){return a.start_frame-b.start_frame}))

	sgroups.exit().remove()
		
	sgroups.enter().append("line")

	sgroups.attr("id",function(d){return "se_"+d.id})
		.attr("class", function(d){return d.status + " workspace"})
		.attr("x2",function(d){
			var fps=source_video.fps
			var p
			if(d.start_frame>=frame+future_duration-fps)
				p=frame+future_duration-fps+(d.end_frame-d.start_frame)
			else if(d.end_frame<=frame-past_duration+fps)
				p=frame-past_duration+fps
			else
				p=d.end_frame

			return width_graph*Math.min((p-(frame-past_duration))/(past_duration+future_duration),1)})
		.attr("x1",function(d){
			var fps=source_video.fps
			var p
			if(d.start_frame>=frame+future_duration-fps)
				p=frame+future_duration-fps
			else if(d.end_frame<=frame-past_duration+fps)
				p=frame-past_duration+fps-(d.end_frame-d.start_frame)
			else
				p=d.start_frame

			return width_graph*Math.max((p-(frame-past_duration))/(past_duration+future_duration),0)
		})
		.attr("y1",function(d,i){return i*(thickness_line+distance_line)+thickness_line})
		.attr("y2",function(d,i){return i*(thickness_line+distance_line)+thickness_line})
		.attr("stroke-dasharray", s_dashGenerator)
		// .attr("clip-path","url(#ws-clipPath2)")
		.attr("stroke",function(d){return d.color})
		.attr("stroke-width",thickness_line)
		.on("click",selectTracklet)



	var tgroups=area_toselect.selectAll("line")
	.data(range_trackletsWsVer.sort(function(a,b){
		if(a.status=="conflicted"&&b.status!="conflicted")
			return 1;
		else if(b.status=="conflicted"&&a.status!="conflicted")
			return -1;
		else
			return a.start_frame-b.start_frame;
	}))


	tgroups.exit().remove()
	tgroups.enter().append("line")
		
	tgroups.attr("id",function(d){return "ts_"+d.id})
		.attr("class", function(d){return d.status + " workspace"})
		.attr("x1",function(d){return width_graph*(d.start_frame-(frame-past_duration))/(past_duration+future_duration)})
		.attr("x2",function(d){return width_graph*(d.end_frame-(frame-past_duration))/(past_duration+future_duration)})
		.attr("y1",function(d,i){return i*(thickness_line+distance_line)+thickness_line+y_drag})
		.attr("y2",function(d,i){return i*(thickness_line+distance_line)+thickness_line+y_drag})
		.attr("stroke-dasharray", t_dashGenerator)
		.attr("clip-path","url(#ws-clipPath)")
		.attr("stroke",function(d){
			if(d.status == "conflicted")
				return "#7a7374";
			else
				return d.color;})
		.attr("stroke-width",thickness_line)
		.on("click",selectTracklet)
		.on("mouseover",function(d){setStatus(d.id, "hover")})
		.on("mouseout",function(d){setStatus(d.id, "default")})
	
	function time2length(t){
		return width_graph*t/(past_duration+future_duration);
	}

	function t_dashGenerator(d){
		if(!d["interpolation"][0])
			return "";
		// 找能显示长方形的端点时间[t1, t2]
		var t1 = d["start_frame"];
		var t2 = d["end_frame"];
		// var t2 = d3.min([d["end_frame"], frame+future_duration]);
		// 找到虚线可能的起始点， 找不到为数组长度
		var dash_index = d["interpolation"].length;
		for(var i = 0; i < d["interpolation"].length; ++i){
			if(t1 < d["interpolation"][i][1]){
				dash_index = i;
				break;
			}
		}
		// 添加dasharray中的字符
		var dash_str = "";
		var count = 0;
		var interval = 3;
		var t = t1;
		var t_end = t1;
		for(t = t1; t<t2 && dash_index!=d["interpolation"].length; ++t){
			// 找到虚线起始点，把上一条实线写进去
			if(t == d["interpolation"][dash_index][0]){
				dash_str += String(time2length(t-t_end))+",";
				t_end = t;
				count++;
			}
			// 找到虚线终点，处理虚线
			if(t == d["interpolation"][dash_index][1]){
				var dash_end_t = d["interpolation"][dash_index][0];
				if(count == 0){
					dash_end_t = t1;
				}
				var n = Math.floor((t-dash_end_t)/interval);
				// 拓展线条字符串
				for(var i = 0; i < n; ++i){
					dash_str += String(time2length(interval))+",";
					count++;
				}
				if(t-dash_end_t != n*interval){
					dash_str += String(time2length(t-dash_end_t-n*interval))+",";
					count++;
				}
				if(count%2 == 1){
					dash_str += String(0)+",";
					count++;
				}
				// 选择下一个虚线
				dash_index++;
				t_end = t;
			}
		}
		//  处理最后一条虚线后面的实线部分
		dash_str += String(time2length(t2-t));
		// if(d["interpolation"].length != 0){
		// 	console.log(dash_str);
		// 	console.log(d);
		// }
		return dash_str;
	}

	function s_dashGenerator(d){
		if(!d["interpolation"][0])
			return "";
		// 找能显示长方形的端点时间[t1, t2]
		var t1 = d["start_frame"];
		if(d["end_frame"] < frame-past_duration+25){
			t1 = d["end_frame"]-25;
		}
		else if(d["start_frame"] > frame-past_duration){
			t1 = d["start_frame"];
		}
		else{
			t1 = frame-past_duration;
		}
		var t2 = d["end_frame"];
		// console.log(t1,t2)

		// 找到虚线可能的起始点， 找不到为数组长度
		var dash_index = d["interpolation"].length;
		for(var i = 0, len = d["interpolation"].length; i < len; ++i){
			if(t1 < d["interpolation"][i][1]){
				dash_index = i;
				break;
			}
		}
		// 添加dasharray中的字符
		var dash_str = "";
		var count = 0;
		var interval = 3;
		var t = t1;
		var t_end = t1;
		for(t = t1; t<t2 && dash_index!=d["interpolation"].length; ++t){
			// 找到虚线起始点，把上一条实线写进去
			if(t == d["interpolation"][dash_index][0]){
				dash_str += String(time2length(t-t_end))+",";
				t_end = t;
				count++;
			}
			// 找到虚线终点，处理虚线
			if(t == d["interpolation"][dash_index][1]){
				var dash_end_t = d["interpolation"][dash_index][0];
				if(count == 0){
					dash_end_t = t1;
				}
				var n = Math.floor((t-dash_end_t)/interval);
				// 拓展线条字符串
				for(var i = 0; i < n; ++i){
					dash_str += String(time2length(interval))+",";
					count++;
				}
				if(t-d["interpolation"][dash_index][0] != n*interval){
					dash_str += String(time2length(t-dash_end_t-n*interval))+",";
					count++;
				}
				if(count%2 == 1){
					dash_str += String(0)+",";
					count++;
				}
				// 选择下一个虚线
				dash_index++;
				t_end = t;
			}
		}
		//  处理最后一条虚线后面的实线部分
		dash_str += String(time2length(t2-t));
		// if(d["interpolation"].length != 0){
		// 	console.log(dash_str);
		// 	console.log(d);
		// }
		return dash_str;
	}
		
	
}
