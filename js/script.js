queue() 
	.defer(d3.csv, "data/occupations by age.csv")
	.defer(d3.csv, "data/ID of parent levels.csv")
	.defer(d3.json, "data/occupation.json")
	.await(drawAll);
	
function drawAll(error, ageCSV, idCSV, occupations) {

	////////////////////////////////////////////////////////////// 
	////////////////// Create Set-up variables  ////////////////// 
	////////////////////////////////////////////////////////////// 

	var width = Math.max($("#chart").width(),350) - 20,
		height = (window.innerWidth < 768 ? width : window.innerHeight - 20);

	var mobileSize = (window.innerWidth < 768 ? true : false);

	var centerX = width/2,
		centerY = height/2;
		
	////////////////////////////////////////////////////////////// 
	/////////////////////// Create SVG  /////////////////////// 
	////////////////////////////////////////////////////////////// 
	
	//Create the visible canvas and context
	var canvas  = d3.select("#chart").append("canvas")
		.attr("id", "canvas")
		.attr("width", width)
		.attr("height", height);
	var context = canvas.node().getContext("2d");
		context.clearRect(0, 0, width, height);
	
	//Create a hidden canvas in which each circle will have a different color
	//We can use this to capture the clicked on circle
	var hiddenCanvas  = d3.select("#chart").append("canvas")
		.attr("id", "hiddenCanvas")
		.attr("width", width)
		.attr("height", height)
		.style("display","none");	
	var hiddenContext = hiddenCanvas.node().getContext("2d");
		hiddenContext.clearRect(0, 0, width, height);

	////////////////////////////////////////////////////////////// 
	/////////////////////// Create Scales  /////////////////////// 
	////////////////////////////////////////////////////////////// 

	var mainTextColor = [74,74,74],//"#4A4A4A",
		titleFont = "Oswald",
		bodyFont = "Merriweather Sans";
	
	var colorCircle = d3.scale.ordinal()
			.domain([0,1,2,3])
			.range(['#bfbfbf','#838383','#4c4c4c','#1c1c1c']);
			
	var colorBar = d3.scale.ordinal()
		.domain(["16 to 19","20 to 24","25 to 34","35 to 44","45 to 54","55 to 64","65+"])
		.range(["#EFB605", "#E3690B", "#CF003E", "#991C71", "#4F54A8", "#07997E", "#7EB852"]);	

	var diameter = Math.min(width*0.9, height*0.9),
		radius = diameter / 2;
		
	var commaFormat = d3.format(',');
	
	var zoomInfo = {
		centerX: centerX,
		centerY: centerY,
		scale: 1
	};

	//Dataset to swtich between color of a circle (in the hidden canvas) and the node data	
	var colToCircle = {};
	
	var pack = d3.layout.pack()
		.padding(1)
		.size([diameter, diameter])
		.value(function(d) { return d.size; })
		.sort(function(d) { return d.ID; });

	////////////////////////////////////////////////////////////// 
	////////////// Create Circle Packing Data ////////////////////
	////////////////////////////////////////////////////////////// 

	var nodes = pack.nodes(occupations),
		root = occupations,
		focus = root;		

	////////////////////////////////////////////////////////////// 
	///////////////// Create Bar Chart Data //////////////////////
	////////////////////////////////////////////////////////////// 
	
	ageCSV.forEach(function(d) { d.value = +d.value; });
 
	data = d3.nest()
		.key(function(d) { return d.ID; })
		.entries(ageCSV);
	
	dataMax = d3.nest()
		.key(function(d) { return d.ID; })
		.rollup(function(d) { return d3.max(d, function(g) {return g.value;}); })
		.entries(ageCSV);

	var dataById = {};
	data.forEach(function (d, i) { 
		dataById[d.key] = i; 
	});	
	
	var IDbyName = {};
	//Small file to get the IDs of the non leaf circles
	idCSV.forEach(function (d, i) { 
		IDbyName[d.name] = d.ID; 
	});	

	////////////////////////////////////////////////////////////// 
	///////////////// Canvas draw function ///////////////////////
	////////////////////////////////////////////////////////////// 
		
	var cWidth = canvas.attr("width");
	var cHeight = canvas.attr("height");
	var nodeCount = nodes.length;

	var elementsPerBar = 7,
		barChartHeight = 0.7,
		barChartHeightOffset = 0.15;
	
	//The draw function of the canvas that gets called on each frame
	function drawCanvas(chosenContext, hidden) {

		//Clear canvas
		chosenContext.fillStyle = "#fff";
		chosenContext.rect(0,0,cWidth,cHeight);
		chosenContext.fill();
	  
		//Select our dummy nodes and draw the data to canvas.
		var node = null;
		// It's slightly faster than nodes.forEach()
		for (var i = 0; i < nodeCount; i++) {
			node = nodes[i];

			//If the hidden canvas was send into this function and it does not yet have a color, generate a unique one
			if(hidden) {
				if(node.color == null) {
					// If we have never drawn the node to the hidden canvas get a new color for it and put it in the dictionary.
					node.color = genColor();
					colToCircle[node.color] = node;
				}//if
				// On the hidden canvas each rectangle gets a unique color.
				chosenContext.fillStyle = node.color;
			} else {
				chosenContext.fillStyle = node.children ? colorCircle(node.depth) : "white";
			}//else
		
			var nodeX = ((node.x - zoomInfo.centerX) * zoomInfo.scale) + centerX,
				nodeY = ((node.y - zoomInfo.centerY) * zoomInfo.scale) + centerY,
				nodeR = node.r * zoomInfo.scale;
			//Draw each circle
			chosenContext.beginPath();
			chosenContext.arc(nodeX, nodeY, nodeR, 0,  2 * Math.PI, true);				
			chosenContext.fill();
		
			//Draw the bars inside the circles (only in the visible canvas)
			//Only draw bars in leaf nodes
			if(node.ID in dataById) {
				//Only draw the bars that are in the same parent ID as the clicked on node
				if(node.ID.lastIndexOf(currentID, 0) === 0  & !hidden) {
					//if(node.ID === "1.1.1.30") console.log(currentID);
														
					//Variables for the bar title
					var drawTitle = true;
					var fontSizeTitle = Math.round(nodeR / 10);
					if (fontSizeTitle < 8) drawTitle = false;

					//Only draw the title if the font size is big enough
					if(drawTitle & showText) {	
						//First the light grey total text
						chosenContext.font = (fontSizeTitle*0.5 <= 5 ? 0 : Math.round(fontSizeTitle*0.5)) + "px " + bodyFont;
						chosenContext.fillStyle = "rgba(191,191,191," + textAlpha +")" //"#BFBFBF";
						chosenContext.textAlign = "center";
						chosenContext.textBaseline = "middle"; 
						chosenContext.fillText("Total "+commaFormat(node.size)+" (in thousands)", nodeX, nodeY + -0.75 * nodeR);
						
						//Get the text back in pieces that will fit inside the node
						var titleText = getLines(chosenContext, node.name, nodeR*2*0.7, fontSizeTitle);
						//Loop over all the pieces and draw each line
						titleText.forEach(function(txt, iterator) { 
							chosenContext.font = fontSizeTitle + "px " + titleFont;
							chosenContext.fillStyle = "rgba(" + mainTextColor[0] + "," + mainTextColor[1] + ","+ mainTextColor[2] + "," + textAlpha +")";
							chosenContext.textAlign = "center";
							chosenContext.textBaseline = "middle"; 
							chosenContext.fillText(txt, nodeX, nodeY + (-0.65 + iterator*0.125) * nodeR);
						})//forEach
						
					}//if

					//The barscale differs per node
					var barScale = d3.scale.linear()
						.domain([0, dataMax[dataById[node.ID]].values]) //max value of bar charts in circle
						.range([0, nodeR]);
			
					//Variables for the bar chart
					var bars = data[dataById[node.ID]].values,
						totalOffset = nodeX + -nodeR*0.3, 
						eachBarHeight = ((1 - barChartHeightOffset) * 2 * nodeR * barChartHeight)/elementsPerBar,
						barHeight = eachBarHeight*0.8;
					
					//Variables for the labels on the bars: Age
					var drawLabelText = true;
					var fontSizeLabels = Math.round(nodeR / 18);
					if (fontSizeLabels < 6) drawLabelText = false;
					
					//Variables for the value labels on the end of each bar
					var drawValueText = true;
					var fontSizeValues = Math.round(nodeR / 22);
					if (fontSizeValues < 6) drawValueText = false;
					
					//Only draw the bars and all labels of each bar has a height of at least 1 pixel
					if (Math.round(barHeight) > 1) {
						//Loop over each bar
						for (var j = 0; j < bars.length; j++) {
							var bar = bars[j];
							
							bar.width = (isNaN(bar.value) ? 0 : barScale(bar.value)); 
							bar.barPiecePosition = nodeY + barChartHeightOffset*2*nodeR + j*eachBarHeight - barChartHeight*nodeR;
							
							//Draw the bar
							chosenContext.beginPath();
							chosenContext.fillStyle = colorBar(bar.age);
							chosenContext.fillRect(nodeX + -nodeR*0.3, bar.barPiecePosition, bar.width, barHeight);
							chosenContext.fill();
							
							//Only draw the age labels if the font size is big enough
							if(drawLabelText & showText) {
								chosenContext.font = fontSizeLabels + "px " + bodyFont;
								chosenContext.fillStyle = "rgba(" + mainTextColor[0] + "," + mainTextColor[1] + ","+ mainTextColor[2] + "," + textAlpha +")";
								chosenContext.textAlign = "right";
								chosenContext.textBaseline = "middle"; 
								chosenContext.fillText(bar.age, nodeX + -nodeR*0.35, bar.barPiecePosition+0.5*barHeight);
							}//if
							
							//Only draw the value labels if the font size is big enough
							if(drawValueText & showText) {
								chosenContext.font = fontSizeValues + "px " + bodyFont;
								var txt = commaFormat(bar.value);
								//Check to see if the bar is big enough to place the text inside it
								//If not, place the text outside the bar
								var textWidth = chosenContext.measureText(txt).width;
								var valuePos = (textWidth*1.1 > (bar.width - nodeR * 0.03) ? "left" : "right");
								
								//Calculate the x position of the bar value label
								bar.valueLoc = nodeX + -nodeR*0.3 + bar.width + (valuePos === "left" ? (nodeR * 0.03) : (-nodeR * 0.03));
								
								//Draw the text
								chosenContext.fillStyle = (valuePos === "left" ? "rgba(51,51,51," + textAlpha +")" : "rgba(255,255,255," + textAlpha +")"); //#333333 or white
								chosenContext.textAlign = valuePos;
								chosenContext.textBaseline = "middle"; 
								chosenContext.fillText(txt, bar.valueLoc, bar.barPiecePosition+0.5*barHeight);
							}//if
				
						}//for j
					}//if -> Math.round(barHeight) > 1
					
				}//if -> node.ID.lastIndexOf(currentID, 0) === 0 & !hidden
			}//if -> node.ID in dataById 
			
		}//for i
		
		var counter = 0; //Needed for the rotation of the arc titles
		
		//Do a second loop because the arc titles always have to be drawn on top
		for (var i = 0; i < nodeCount; i++) {
			node = nodes[i];
		
			var nodeX = ((node.x - zoomInfo.centerX) * zoomInfo.scale) + centerX,
				nodeY = ((node.y - zoomInfo.centerY) * zoomInfo.scale) + centerY,
				nodeR = node.r * zoomInfo.scale;
			
			//Don't draw for leaf-nodes
			//And don't draw the arced label for the largest outer circle
			//And don't draw these things for the hidden layer
			//And only draw these while showText = true (so not during a zoom)
			//And hide those not close the the parent
			if(typeof node.parent !== "undefined" & typeof node.children !== "undefined") {
				if(node.name !== "occupation" & !hidden & showText & $.inArray(node.name, kids) >= 0) {
					//Calculate the best font size for the non-leaf nodes
					var fontSizeTitle = Math.round(nodeR / 10);
					if (fontSizeTitle > 6) drawCircularText(chosenContext, node.name, fontSizeTitle, nodeX, nodeY, nodeR, rotationText[counter], 0);
				}//if
				counter = counter + 1;
			}//if

		}//for i
		
	}//function drawCanvas

	////////////////////////////////////////////////////////////// 
	/////////////////// Click functionality ////////////////////// 
	////////////////////////////////////////////////////////////// 
	
	var currentID = "",
		oldID = "",
		kids = ["occupation"]; //needed to check which arced titles to show - only those close to the parent node
	
	//Setup the kids variable for the top (root) level			
	for(var i = 0; i < root.children.length; i++) { kids.push(root.children[i].name) };	
	
	// Listen for clicks on the main canvas
	document.getElementById("canvas").addEventListener("click", function(e){
		// We actually only need to draw the hidden canvas when there is an interaction. 
		// This sketch can draw it on each loop, but that is only for demonstration.
		drawCanvas(hiddenContext, true);

		//Figure out where the mouse click occurred.
		var mouseX = e.layerX;
		var mouseY = e.layerY;

		// Get the corresponding pixel color on the hidden canvas and look up the node in our map.
		// This will return that pixel's color
		var col = hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
		//Our map uses these rgb strings as keys to nodes.
		var colString = "rgb(" + col[0] + "," + col[1] + ","+ col[2] + ")";
		var node = colToCircle[colString];

		if(node) {
			//If the same node is clicked twice, set it to the top (root) level
			if (focus !== node) {
				//Save the ID of the clicked on node (or its parent, if it is a leaf node)
				currentID = (typeof node.ID === "undefined" ? IDbyName[node.name] : node.ID.replace(/\.([^\.]*)$/, ""));
			} else {
				currentID = "";
				node = root;
			}//else
			
			//Save the names of the circle itself and first children
			//Needed to check which arc titles to show
			kids = [node.name];
			if(typeof node.children !== "undefined") {
				for(var i = 0; i < node.children.length; i++) {
					kids.push(node.children[i].name)
				}//for i
			}//if

			//Perform the zoom
			zoomToCanvas(node);
			
		}//if -> node
	}); //on click function

	////////////////////////////////////////////////////////////// 
	///////////////////// Zoom Function //////////////////////////
	////////////////////////////////////////////////////////////// 
	
	//Based on the generous help by Stephan Smola
	//http://bl.ocks.org/smoli/d7e4f9199c15d71258b5
	
	var ease = d3.ease("cubic-in-out"),
		timeElapsed = 0,
		interpolator = null,
		duration = 1500, //Starting duration
		vOld = [focus.x, focus.y, focus.r * 2.05];

		
	//Create the interpolation function between current view and the clicked on node
	function zoomToCanvas(focusNode) {
		focus = focusNode;
		var v = [focus.x, focus.y, focus.r * 2.05]; //The center and width of the new "viewport"
		
		interpolator = d3.interpolateZoom(vOld, v); //Create interpolation between current and new "viewport"
		
		duration = 	Math.max(1500, interpolator.duration); //Interpolation gives back a suggested duration	 		
		timeElapsed = 0; //Set the time elapsed for the interpolateZoom function to 0	
		showText = false; //Don't show text during the zoom
		vOld = v; //Save the "viewport" of the next state as the next "old" state
	}//function zoomToCanvas
	
	//Perform the interpolation and continuously change the zoomInfo while the "transition" occurs
	function interpolateZoom(dt) {
		if (interpolator) {
			timeElapsed += dt;
			var t = ease(timeElapsed / duration); //mini interpolator that puts 0 - duration into 0 - 1 in a cubic-in-out fashion
			
			//Set the new zoom variables
			zoomInfo.centerX = interpolator(t)[0];
			zoomInfo.centerY = interpolator(t)[1];
			zoomInfo.scale = diameter / interpolator(t)[2];
		
			//Remove the interpolater and set the fade text back into motion
			if (timeElapsed >= duration) {
				interpolator = null;
				showText = true;
				fadeText = true;
				timeElapsed = 0;
			}//if
		}//if
	}//function zoomToCanvas

	//Text fading variables
	var	showText = true, //Only show the text while you're not zooming
		textAlpha = 1, //After a zoom is finished fade in the text;
		fadeText = false,
		fadeTextDuration = 750;
	//Function that fades in the text - Otherwise the text will be jittery during the zooming	
	function interpolateFadeText(dt) {
		if(fadeText) {
			timeElapsed += dt;
			textAlpha = ease(timeElapsed / fadeTextDuration);				
			if (timeElapsed >= fadeTextDuration) fadeText = false; //Jump from loop after fade in is done
		}//if
	}//function interpolateFadeText
	
	////////////////////////////////////////////////////////////// 
	//////////////////// Other Functions /////////////////////////
	////////////////////////////////////////////////////////////// 
	
	//Generates the next color in the sequence, going from 0,0,0 to 255,255,255.
	//From: https://bocoup.com/weblog/2d-picking-in-canvas
	var nextCol = 1;
	function genColor(){
		var ret = [];
		// via http://stackoverflow.com/a/15804183
		if(nextCol < 16777215){
		  ret.push(nextCol & 0xff); // R
		  ret.push((nextCol & 0xff00) >> 8); // G 
		  ret.push((nextCol & 0xff0000) >> 16); // B

		  nextCol += 100; // This is exagerated for this example and would ordinarily be 1.
		}
		var col = "rgb(" + ret.join(',') + ")";
		return col;
	}//function genColor

	//From http://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
	function getLines(ctx, text, maxWidth, fontSize) {
		var words = text.split(" ");
		var lines = [];
		var currentLine = words[0];

		for (var i = 1; i < words.length; i++) {
			var word = words[i];
			ctx.font = fontSize + "px " + titleFont;
			var width = ctx.measureText(currentLine + " " + word).width;
			if (width < maxWidth) {
				currentLine += " " + word;
			} else {
				lines.push(currentLine);
				currentLine = word;
			}
		}
		lines.push(currentLine);
		return lines;
	}//function getLines

	
	//The start angle in degrees for each of the non-node leaf titles
	var rotationText = [-14,4,23,-18,-10.5,-20,20,20,46,-30,-25,-20,20,15,-30,-15,-45,12,-15,-16,15,15,5,18,5,15,20,-20,-25]; //The rotation of each arc text
	
	//Adjusted from: http://blog.graphicsgen.com/2015/03/html5-canvas-rounded-text.html
	function drawCircularText(ctx, text, fontSize, centerX, centerY, radius, startAngle, kerning) {
		// startAngle:   In degrees, Where the text will be shown. 0 degrees
		//               if the top of the circle
		// kearning:     0 for normal gap between letters. positive or
		//               negative number to expand/compact gap in pixels
		
						//console.log(text);
		//if(text == "Professional and related occupations") console.log(radius);
		
		startAngle = startAngle * (Math.PI / 180); // convert to radians
		text = text.split("").reverse().join(""); // Reverse letters
					
		//Setup letters and positioning
		ctx.textBaseline = 'alphabetic';
		ctx.textAlign = 'center'; // Ensure we draw in exact center
		ctx.font = fontSize + "px " + titleFont;
		ctx.fillStyle = "rgba(255,255,255," + textAlpha +")";

		//Rotate 50% of total angle for center alignment
		for (var j = 0; j < text.length; j++) {
			var charWid = ctx.measureText(text[j]).width;
			startAngle += ((charWid + (j == text.length-1 ? 0 : kerning)) / radius) / 2;
		}//for j

		ctx.save(); //Save the default state before doing any transformations
		ctx.translate(centerX, centerY); // Move to center
		ctx.rotate(startAngle); //Rotate into final start position
			
		//Now for the fun bit: draw, rotate, and repeat
		for (var j = 0; j < text.length; j++) {
			var charWid = ctx.measureText(text[j]).width/2; // half letter
			//Rotate half letter
			ctx.rotate(-charWid/radius); 
			//Draw the character at "top" or "bottom" depending on inward or outward facing
			ctx.fillText(text[j], 0, -radius);
			//Rotate half letter
			ctx.rotate(-(charWid + kerning) / radius); 
		}//for j
		
		ctx.restore(); //Restore to state as it was before transformations
	}//function drawCircularText

	////////////////////////////////////////////////////////////// 
	/////////////////////// FPS Stats box //////////////////////// 
	////////////////////////////////////////////////////////////// 
	
	var stats = new Stats();
	stats.setMode(0); // 0: fps, 1: ms, 2: mb

	// align top-left
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	document.body.appendChild( stats.domElement );

	////////////////////////////////////////////////////////////// 
	/////////////////////// Initiate ///////////////////////////// 
	////////////////////////////////////////////////////////////// 
			
	//First zoom to get the circles to the right location
	zoomToCanvas(root);
	
	//context.textAlign = 'center'; // Ensure we draw in exact center
	//context.font = 20 + "px " + titleFont;
	//console.log(context.measureText("m").width);
	//console.log(context.measureText("l").width);
	
	var dt = 0;
	d3.timer(function(elapsed) {
		stats.begin();
		interpolateZoom(elapsed - dt);
		interpolateFadeText(elapsed - dt);
		dt = elapsed;
		drawCanvas(context);
		stats.end();
	});
	
	
}//drawAll