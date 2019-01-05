function initHeader(){
	var header = d3.select("svg")
		.append("g")
		.attr("id", "header")

	var image = header.append("svg:image")
		.attr("xlink:href", "/resources/PosFlow/img/header.png")
		.attr("transform", function(){
			return "translate("+layout.header.x + "," + layout.header.y + ")";
		})
        .attr("width", layout.header.w);
}
