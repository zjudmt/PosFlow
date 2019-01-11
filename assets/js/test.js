
function test(argument) {
	var a = new Array()
	for (var i = 100; i >= 0; i--) {
		a[i] = i;
	}
	function c(a){
		var c = a.slice(0);
		for (var i = 10; i >= 0; i--) {
			c[i] += 1000
		}
	}
	c(a)
}


// var t00 = d3.timer(function(elapsed) {
// 	console.log("elapsed: ", elapsed)
// 	if (elapsed > 5000)
// 		t00.stop()
// 	// body...
// })
