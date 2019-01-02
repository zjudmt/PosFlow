function addLoadEvent(func) {
	var oldonload = window.onload;
	if (typeof window.onload != 'function') {
		window.onload = func;
	} else {
		window.onload = function() {
			oldonload();
			func();
		}
	}
}

function insertAfter(newElement,targetElement) {
  var parent = targetElement.parentNode;
  if (parent.lastChild == targetElement) {
    parent.appendChild(newElement);
  } else {
    parent.insertBefore(newElement,targetElement.nextSibling);
  }
}

function init(argument) {
	viewport = {
		w: window.innerWidth,
		// h: window.innerWidth * 9 / 16,
		h: window.innerHeight,
	// on my laptop w = 1536, h = 864
	};
	unit = viewport.w / 48;
	basepoint = {
		x: 0,
		y: viewport.h - unit * 13.5,
	}
	// on my laptop unit = 32 = viewport.h / 27
	source_video = {
		w: 3840,
		h: 800,
		ratio: 24/5,
		fps: 25,
		src: "/resources/PosFlow/2min.mp4",
	};
	source_data = {
		fps: 25,
		src: "/resources/PosFlow/tracklets.json",
	}
	// console.log("viewport", viewport);
	// console.log("source_video", source_video);
	// console.log("source_video", source_data);
	var row = [{
			name: "header",
			h: unit,
		},{
			name: "void",
			h: unit * 5,
		},{
			name: "monitor",
			h: unit * 11,
			main: {
				h: unit * 10,
			},
			control: {
				h: unit,
			}

		},{
			name: "factory",
			h:  unit * 10,
			col: [{
				name: "blank",
				w: unit * 16,
			},{				
				name: "birdseye",
				w: unit * 16,
			},{				
				name: "workspace",
				w: unit * 16,
			}]
		}
	]
	layout = {
		header:{
			x: basepoint.x ,
			y: basepoint.y,
			w: unit * 48,
			h: unit,
		},
		monitor:{
			x: basepoint.x,
			y: basepoint.y + row[0].h + row[1].h ,
			w: unit * 48,
			h: row[2].h ,
			main: {
				x: basepoint.x,
				y: basepoint.y + row[0].h + row[1].h ,
				w: unit * 48,
				h: row[2].main.h ,
			},
			control: {
				x: basepoint.x,
				y: basepoint.y + row[0].h + row[1].h + row[2].main.h,
				w: unit * 48,
				h: row[2].control.h,				
			}
		},
		birdseye:{
			x: basepoint.x + row[3].col[0].w ,
			y: basepoint.y + row[0].h + row[1].h + row[2].h ,
			w: row[3].col[1].w ,
			h: row[3].h ,
		},
		workspace:{
			x: basepoint.x + row[3].col[0].w +  row[3].col[1].w,
			y: basepoint.y + row[0].h + row[1].h + row[2].h ,
			w: row[3].col[2].w ,
			h: row[3].h ,
		},
	}

	console.log("layout: ", layout);
}

addLoadEvent(init);

