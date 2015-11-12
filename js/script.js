queue() 
	.defer(d3.csv, "data/occupations by age.csv")
	.defer(d3.csv, "data/ID of parent levels.csv")
	.defer(d3.json, "data/occupation.json")
	.await(drawAll);
	
//Initiates practically everything
function drawAll(error, ageCSV, idCSV, occupations) {

	////////////////////////////////////////////////////////////// 
	////////////////// Create Set-up variables  ////////////////// 
	////////////////////////////////////////////////////////////// 

	//Trying to figure out how to detect touch devices (exept for laptops with touch screens)
	//Since there's no need to have a mouseover function for touch
	//There has to be a more foolproof way than this...
	//var mobileSize = true;
	//if (!("ontouchstart" in document.documentElement) | window.innerWidth > 900) mobileSize = false;
	window.mobileAndTabletcheck = function() {
		var check = false;
		(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})
			(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	}//function mobileAndTabletcheck
	var mobileSize = window.mobileAndTabletcheck();
	
	var padding = 20,
		width = Math.max($("#chart").innerWidth(),350) - padding,
		height = (mobileSize | window.innerWidth < 768 ? width : window.innerHeight - 90);

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
	//We can use this to capture the clicked/hovered over on circle
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
		focus = root,
		nodeCount = nodes.length;

	var nodeByName = {};
	nodes.forEach(function(d,i) {
		nodeByName[d.name] = d;
	});

	////////////////////////////////////////////////////////////// 
	///////////////// Create Bar Chart Data //////////////////////
	////////////////////////////////////////////////////////////// 
	
	//Turn the value into an actual numeric value
	ageCSV.forEach(function(d) { d.value = +d.value; });
 
	//Create new dataset grouped by ID
	data = d3.nest()
		.key(function(d) { return d.ID; })
		.entries(ageCSV);
		
	//Find the max value per ID - needed for the bar scale setting per mini bar chart
	dataMax = d3.nest()
		.key(function(d) { return d.ID; })
		.rollup(function(d) { return d3.max(d, function(g) {return g.value;}); })
		.entries(ageCSV);

	//Array to keep track of which ID belongs to which index in the array
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
		
	var elementsPerBar = 7,
		barChartHeight = 0.7,
		barChartHeightOffset = 0.15;
	
	//The draw function of the canvas that gets called on each frame
	function drawCanvas(chosenContext, hidden) {

		//Clear canvas
		chosenContext.fillStyle = "#fff";
		chosenContext.rect(0,0,width,height);
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
				
			//Use one node to reset the scale factor for the legend
			if(i === 4) scaleFactor = node.value/(nodeR * nodeR); 
						
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
						var titleText = getLines(chosenContext, node.name, nodeR*2*0.7, fontSizeTitle, titleFont);
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
					if (fontSizeTitle > 4) drawCircularText(chosenContext, node.name.replace(/,? and /g, ' & '), fontSizeTitle, titleFont, nodeX, nodeY, nodeR, rotationText[counter], 0);
				}//if
				counter = counter + 1;
			}//if

		}//for i
		
	}//function drawCanvas

	////////////////////////////////////////////////////////////// 
	/////////////////// Click functionality ////////////////////// 
	////////////////////////////////////////////////////////////// 
	
	//Default values for variables - set to root
	var currentID = "",
		oldID = "",
		kids = ["occupation"]; //needed to check which arced titles to show - only those close to the parent node
	
	//Setup the kids variable for the top (root) level			
	for(var i = 0; i < root.children.length; i++) { kids.push(root.children[i].name) };	
	
	//Function to run oif a user clicks on the canvas
	var clickFunction = function(e){
		//Figure out where the mouse click occurred.
		var mouseX = e.offsetX; //e.layerX;
		var mouseY = e.offsetY; //e.layerY;

		// Get the corresponding pixel color on the hidden canvas and look up the node in our map.
		// This will return that pixel's color
		var col = hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
		//Our map uses these rgb strings as keys to nodes.
		var colString = "rgb(" + col[0] + "," + col[1] + ","+ col[2] + ")";
		var node = colToCircle[colString];

		//If there was an actual node clicked on, zoom into this
		if(node) {
			//If the same node is clicked twice, set it to the top (root) level
			if (focus === node) node = root;
			
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
		
	}//function clickFunction

	//Listen for clicks on the main canvas
	//document.getElementById("canvas").addEventListener("click", clickFunction);
	$("#canvas").on("click", clickFunction);
	
	////////////////////////////////////////////////////////////// 
	//////////////// Mousemove functionality ///////////////////// 
	////////////////////////////////////////////////////////////// 
	
	//Only run this if the user actually has a mouse
	if (!mobileSize) {
		var nodeOld = root;
		
		//Listen for mouse moves on the main canvas
		var mousemoveFunction = function(e){
			//Figure out where the mouse click occurred.
			var mouseX = e.offsetX; //e.layerX;
			var mouseY = e.offsetY; //e.layerY;
			
			// Get the corresponding pixel color on the hidden canvas and look up the node in our map.
			// This will return that pixel's color
			var col = hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
			//Our map uses these rgb strings as keys to nodes.
			var colString = "rgb(" + col[0] + "," + col[1] + ","+ col[2] + ")";
			var node = colToCircle[colString];

			//Only change the popover if the user mouses over something new
			if(node !== nodeOld) {
				//Remove all previous popovers
				$('.popoverWrapper').remove(); 
				$('.popover').each(function() {
						$('.popover').remove(); 	
				 }); 
				//Only continue when the user mouses over an actual node
				if(node) {
					//Only show a popover for the leaf nodes
					if(typeof node.ID !== "undefined") {
						//Needed for placement
						var nodeX = ((node.x - zoomInfo.centerX) * zoomInfo.scale) + centerX,
							nodeY = ((node.y - zoomInfo.centerY) * zoomInfo.scale) + centerY,
							nodeR = node.r * zoomInfo.scale;
						
						//Create the wrapper div for the popover
						var div = document.createElement('div');
						div.setAttribute('class', 'popoverWrapper');
						document.getElementById('chart').appendChild(div);

						//Position the wrapper right above the circle
						$(".popoverWrapper").css({
							'position':'absolute',
							'top':nodeY-nodeR,
							'left':nodeX+padding*5/4
						});
						
						//Show the tooltip
						$(".popoverWrapper").popover({
							placement: 'auto top',
							container: 'body',
							trigger: 'manual',
							html : true,
							animation:false,
							content: function() { 
								return "<span class='nodeTooltip'>" + node.name + "</span>"; }
							});
						$(".popoverWrapper").popover('show');
					}//if -> typeof node.ID !== "undefined"
				}//if -> node
			}//if -> node !== nodeOld
			
			nodeOld = node;
		}//function mousemoveFunction
		
		//document.getElementById("canvas").addEventListener("mousemove", mousemoveFunction);
		$("#canvas").on("mousemove", mousemoveFunction);
	
	}//if !mobileSize

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
		
		//Temporarily disable click & mouseover events
		$("#canvas").css("pointer-events", "none");
	
		//Remove all previous popovers - if present
		$('.popoverWrapper').remove(); 
		$('.popover').each(function() {
				$('.popover').remove(); 	
		}); 
					
		//Save the ID of the clicked on node (or its parent, if it is a leaf node)
		//Only the nodes close to the currentID will have bar charts drawn
		if (focusNode === focus) currentID = ""; 
		else currentID = (typeof focusNode.ID === "undefined" ? IDbyName[focusNode.name] : focusNode.ID.replace(/\.([^\.]*)$/, ""));
		
		//Set the new focus
		focus = focusNode;
		var v = [focus.x, focus.y, focus.r * 2.05]; //The center and width of the new "viewport"

		//Create interpolation between current and new "viewport"
		interpolator = d3.interpolateZoom(vOld, v);
			
		//Set the needed "zoom" variables
		duration = 	Math.max(1500, interpolator.duration); //Interpolation gives back a suggested duration	 		
		timeElapsed = 0; //Set the time elapsed for the interpolateZoom function to 0	
		showText = false; //Don't show text during the zoom
		vOld = v; //Save the "viewport" of the next state as the next "old" state
		
		//Only show the circle legend when not at a leaf node
		if(typeof focusNode.children === "undefined") {
			d3.select("#legendRowWrapper").style("opacity", 0);
			d3.select(".legendWrapper").transition().duration(1000).style("opacity", 0);
		} else {
			d3.select("#legendRowWrapper").style("opacity", 1);
			d3.select(".legendWrapper").transition().duration(1000).delay(duration).style("opacity", 1);
		}//else
		
		//Start animation
		stopTimer = false;
		animate();
		
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
		
			//After iteration is done remove the interpolater and set the fade text back into motion
			if (timeElapsed >= duration) {
				interpolator = null;
				showText = true;
				fadeText = true;
				timeElapsed = 0;
				
				//Draw the hidden canvas again, now that everything is settled in 
				//to make sure it is in the same state as the visible canvas
				//This way the tooltip and click work correctly
				drawCanvas(hiddenContext, true);
				
				//Update the texts in the legend
				d3.select(".legendWrapper").selectAll(".legendText")
					.text(function(d) { return commaFormat(Math.round(scaleFactor * d * d / 10)*10); });
				
			}//if -> timeElapsed >= duration
		}//if -> interpolator
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
			if (timeElapsed >= fadeTextDuration) {
				//Enable click & mouseover events again
				$("#canvas").css("pointer-events", "auto");
				
				fadeText = false; //Jump from loop after fade in is done
				stopTimer = true; //After the fade is done, stop with the redraws / animation
			}//if
		}//if
	}//function interpolateFadeText

	////////////////////////////////////////////////////////////// 
	//////////////////// Other Functions /////////////////////////
	////////////////////////////////////////////////////////////// 
	
	//The start angle in degrees for each of the non-node leaf titles
	var rotationText = [-14,4,23,-18,-10.5,-20,20,20,46,-30,-25,-20,20,15,-30,-15,-45,12,-15,-16,15,15,5,18,5,15,20,-20,-25]; //The rotation of each arc text
	
	//Adjusted from: http://blog.graphicsgen.com/2015/03/html5-canvas-rounded-text.html
	function drawCircularText(ctx, text, fontSize, titleFont, centerX, centerY, radius, startAngle, kerning) {
		// startAngle:   In degrees, Where the text will be shown. 0 degrees if the top of the circle
		// kearning:     0 for normal gap between letters. Positive or negative number to expand/compact gap in pixels
				
		//Setup letters and positioning
		ctx.textBaseline = 'alphabetic';
		ctx.textAlign = 'center'; // Ensure we draw in exact center
		ctx.font = fontSize + "px " + titleFont;
		ctx.fillStyle = "rgba(255,255,255," + textAlpha +")";

		startAngle = startAngle * (Math.PI / 180); // convert to radians
		text = text.split("").reverse().join(""); // Reverse letters
		
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
	///////////////////// Create Search Box ////////////////////// 
	////////////////////////////////////////////////////////////// 

	//Create options - all the occupations
	var options = nodes.map(function(d) { return d.name; });
	
	var select = document.getElementById("searchBox"); 
	//Put new options into select box
	for(var i = 0; i < options.length; i++) {
		var opt = options[i];
		var el = document.createElement("option");
		el.textContent = opt;
		el.value = opt;
		select.appendChild(el);
	}

	//Create search combo box
	$('.combobox').combobox();
	
	//Function to call once the search box is filled in
	searchEvent = function(occupation) { 
		//If the occupation is not equal to the default
		if (occupation !== "" & typeof occupation !== "undefined") {
			zoomToCanvas(nodeByName[occupation]);
		}//if 
	}//searchEvent
		
	////////////////////////////////////////////////////////////// 
	/////////////////////// FPS Stats box //////////////////////// 
	////////////////////////////////////////////////////////////// 
	
	/*
	var stats = new Stats();
	stats.setMode(0); // 0: fps, 1: ms, 2: mb

	// align top-left
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	document.body.appendChild( stats.domElement );

	d3.timer(function(elapsed) {
		stats.begin();
		stats.end();
	});
	*/
	
	////////////////////////////////////////////////////////////// 
	/////////////////////// Initiate ///////////////////////////// 
	////////////////////////////////////////////////////////////// 
			
	//First zoom to get the circles to the right location
	zoomToCanvas(root);
	//Draw the hidden canvas at least once
	drawCanvas(hiddenContext, true);
	//Draw the legend
	var scaleFactor = 1; //dummy value
	createLegend(scaleFactor);
	//Slowly fade in so the scaleFactor is set to the correct value in the mean time :)
	d3.select(".legendWrapper").transition().duration(1000).delay(500).style("opacity", 1);
	
	//Start the drawing loop. It will jump out of the loop once stopTimer becomes true
	var stopTimer = false;
	animate();
	
	//This function runs during changes in the visual - during a zoom
	function animate() {
		var dt = 0;
		d3.timer(function(elapsed) {
			interpolateZoom(elapsed - dt);
			interpolateFadeText(elapsed - dt);
			dt = elapsed;
			drawCanvas(context);

			return stopTimer;
		});
	}//function animate
		
}//drawAll

	
////////////////////////////////////////////////////////////// 
//////////////////// Other Functions /////////////////////////
////////////////////////////////////////////////////////////// 

//Needed in the global scope
var searchEvent = function(occupation) { };
	
//If there is a scroll bar then its fine
//But if there is no scrollbar prevent one from occuring when the user opens the search box
//Otherwise the visual will seem to move to the left for a bit and that looks rather odd
var noScrollBar = ($(document).height() > $(window).height() ? false : true);
if(noScrollBar) {
	//Prevent scroll bars from forming
	document.documentElement.style.overflow = 'hidden';  // firefox, chrome
	document.body.scroll = "no"; // ie only
}//if

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
function getLines(ctx, text, maxWidth, fontSize, titleFont) {
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

////////////////////////////////////////////////////////////// 
///////////// Function | The legend creation /////////////////
////////////////////////////////////////////////////////////// 

function createLegend(scaleFactor) {
	var legendSizes = [10,20,30],
		commaFormat = d3.format(',');
		
	//d3.select("#legendRowWrapper").style("opacity", 0);
	
	var width = $("#legendCircles").width(),
		height = legendSizes[2]*2*1.2;

	var	legendCenter = -10,
		legendBottom = height,
		legendLineLength = legendSizes[2]*1.3,
		textPadding = 5
		
	//Create SVG for the legend
	var svg = d3.select("#legendCircles").append("svg")
		.attr("width", width)
		.attr("height", height)
	  .append("g")
		.attr("class", "legendWrapper")
		.attr("transform", "translate(" + width / 2 + "," + 0 + ")")
		.style("opacity", 0);
	
	//Draw the circles
	svg.selectAll(".legendCircle")
		.data(legendSizes)
		.enter().append("circle")
		.attr('r', function(d) { return d; })
		.attr('class',"legendCircle")
		.attr('cx', legendCenter)
		.attr('cy', function(d) { return legendBottom-d; });
	//Draw the line connecting the top of the circle to the number
	svg.selectAll(".legendLine")
		.data(legendSizes)
		.enter().append("line")
		.attr('class',"legendLine")
		.attr('x1', legendCenter)
		.attr('y1', function(d) { return legendBottom-2*d; })
		.attr('x2', legendCenter + legendLineLength)
		.attr('y2', function(d) { return legendBottom-2*d; });	
	//Place the value next to the line
	svg.selectAll(".legendText")
		.data(legendSizes)
		.enter().append("text")
		.attr('class',"legendText")
		.attr('x', legendCenter + legendLineLength + textPadding)
		.attr('y', function(d) { return legendBottom-2*d; })
		.attr('dy', '0.3em')
		.text(function(d) { return commaFormat(Math.round(scaleFactor * d * d / 10)*10); });
		
}//createLegend