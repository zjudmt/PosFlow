function initHeader(){
	// alert("addHeader")
	var headerLayout = d3.select("#svg")
		.append("g")
		.attr("id", "header");

	d3.json("/resources/VidAssist/matches/0/event_new.json",function(error,data){
	// alert("addHeader")	
		if(error) throw error;
		var video = d3.select('#video')
					.on("play.score",function(){timerScore.restart(callbackScore);});
					
		headerLayout.append("text")
				.attr("x",width/2)
				.attr("y",height/8)
				.attr("text-anchor","middle")
				.attr("fill","white")
				.attr("id","scoreText")
				.style("font-size", "25px")
				.text("0-0");

		headerLayout.append("text")
				.attr("x",width/2)
				.attr("y",height/4)
				.attr("text-anchor","middle")
				.attr("fill","white")
				.attr("id","TimeText")
				.html("00:00");

		timerScore = d3.timer(callbackScore);
		function callbackScore(){
			if(video.property("paused")){
				timerScore.stop();
			}
			var time = Math.round(video.property("currentTime"));
			var frameCurrent = time*25;
			var team1Score = 0,
				team2Score = 0;
			for(var i=1;data[i].frame<=frameCurrent;i++)
			{
				if(data[i].detail == "goal"||data[i].detail == "goal_corner"||data[i].detail == "goal_free_kick")
				{
					if(data[i].flag)
						team1Score++;
					else
						team2Score++;
				}
				else if(data[i].detail == "goal_own_goal")
				{
					if(data[i].flag)
						team2Score++;
					else
						team1Score++;
				}
			}
			d3.select("#scoreText")
			 .text(team1Score  + " - "  + team2Score);
			var minutes = Math.round(time/60-0.5),
				seconds = Math.round(time%60);
			var min =  minutes < 10 ? ("0" + minutes) : minutes,
					sec =  seconds < 10 ? ("0" + seconds) : seconds;
			d3.select("#TimeText")
				.text(min+":"+sec);
		}
	});
}
function addButton(){

	d3.select("#svg_bg").append("rect")
		.datum({"x": 0.892*width, "y": 0.01*width, "w": 0.084*width, "h": 0.02*width})
		.classed("button", true)
		.attr("id","button_language")
		.attr("x",function(d,i){return d.x})
		.attr("y",function(d,i){return d.y})
		.attr("width",function(d,i){return d.w})
		.attr("height",function(d,i){return d.h})	
		.attr("fill","white")
		.attr("fill-opacity",0)
		.style("cursor", "pointer")
		.on("click",switchLanguage);
		
	function switchLanguage()
	{
		if(language == "zh"){
			d3.select("#background_img")
				.attr("xlink:href", "/resources/VidAssist/img/Background-en.png");
			d3.selectAll(".key_event_text")
				.text(function(d){return d.detail_en})
			language = "en";
		}
		else{
			d3.select("#background_img")
				.attr("xlink:href", "/resources/VidAssist/img/Background-zh.png");
			d3.selectAll(".key_event_text")
				.text(function(d){return d.detail_zh})
			language = "zh";
		}
	}

}

// addLoadEvent(addHeader);
// addLoadEvent(addButton);
