drct.directive('visHeatmap', [function() {

	return {
			
		restrict: 'E',
		scope: {
			inputdata:"=",
			inputcolor:"@",
			showlabels: "=",
			width: "=",
			height: "=",
			marginleft: "=",
			marginright: "=",
			margintop: "=",
			marginbottom: "=",
			celllink: "="
		},
		template: "<div class='heatmap'></div>",
		link: function (scope, element, attrs) {
			
			var margin = {
					left: scope.marginleft,
					right: scope.marginright,
					top: scope.margintop,
					bottom: scope.marginbottom
				}
				
			var width = scope.width - margin.left - margin.right;
			
			var height = scope.height - margin.top - margin.bottom;
			
			var window = d3.select(element[0]);
			
			var firsttime = true;

			scope.$watch('inputdata', function(newdata, olddata) {
				
				if (newdata == olddata | !newdata) {
					return;
				}
				
				window.selectAll('*').remove();
				
				if (newdata.tree.top && firsttime) {
					
					firsttime = false;
					
					margin.top = margin.top + 150
						
					height = height + 150
				
				}
				
				var svg = window
					.append("svg")
					.attr("class", "chart")
					.attr("pointer-events", "all")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom);

				var threshold = 150;
				
				function colorScaleForward(j) {
					
					var value = d3.scale.linear()
						.domain([newdata.matrixsummary.min, newdata.matrixsummary.max])
						.rangeRound([0, 255]);
			 
					var output = 0;
			 
					if (value(j) >= threshold ) {
						var layer2 = d3.scale.linear()
							.domain([125,255])
							.rangeRound([0,255]);
						output = layer2(value(j));  	
					}
			 
					return output;
				};
			 
				function colorScaleReverse(j) {	 
					var value = d3.scale.linear()
						.domain([newdata.matrixsummary.min, newdata.matrixsummary.max])
						.rangeRound([255, 0]);
					var output = 0;
					if ( value(j) >= threshold ) {
						var layer2 = d3.scale.linear()
							.domain([255,125])
							.rangeRound([255, 0]);
						output = layer2(value(j));  	
					}
					return output;
				};
			 
				function redColorControl(j, code) {
					var output = 0;
					if (code == "red") {
						output = colorScaleForward(j);
					} else {
						output = colorScaleForward(j);
					}
					return output;
					};
			 
				function blueColorControl(j, code) {
					var output = 0;
					if (code == "blue") {
						output = colorScaleReverse(j);
					}
					return output;
				};
			 
				function greenColorControl(j, code) {
					var output = 0;
			 
					if (code == "red") {
						output = colorScaleReverse(j);
					} else {
						output = colorScaleForward(j);
					}
			 
					return output;
				};
			 
				
				var xkeylabels = newdata.columnlabels.map( function(d, i){ return { key:d, val:i} } );
				var ykeylabels = newdata.rowlabels.map( function(d, i){ return { key:d, val:i} } );
				
				var indexXMapper = d3.scale.ordinal()
						.domain( newdata.columnlabels.map(function(d, i) { return d; } ) )
						.range( newdata.columnlabels.map(function(d, i){ return i; } ) );
						
				var indexYMapper = d3.scale.ordinal()
						.domain( newdata.rowlabels.map(function(d, i) { return d; } ) )
						.range( newdata.rowlabels.map(function(d, i){ return i; } ) );
						
				var invIndexXMapper = d3.scale.ordinal()
						.domain( indexXMapper.range() )
						.range( indexXMapper.domain() );
						
				var invIndexYMapper = d3.scale.ordinal()
						.domain( indexYMapper.range() )
						.range( indexYMapper.domain() );
						
				var cellXPosition = d3.scale.ordinal()
						.domain( newdata.columnlabels )
						.rangeRoundBands([ margin.left, margin.left + width]);
			 
				var cellYPosition = d3.scale.ordinal()
						.domain( newdata.rowlabels  )
						.rangeRoundBands([0,height]);
			 
				var cellXPositionLin = d3.scale.linear()
						.domain( d3.extent( d3.range(newdata.columnlabels.length) ) )
						.range([margin.left, margin.left + width - cellXPosition.rangeBand() ]);
			 
				var cellYPositionLin = d3.scale.linear()
						.domain( d3.extent( d3.range(newdata.rowlabels.length) ) )
						.range([margin.top, margin.top + height - cellYPosition.rangeBand() ]);
				
				var xAxis = d3.svg.axis().scale(cellXPositionLin).orient("bottom")
						.ticks(newdata.columnlabels.length)
						.tickFormat(function(d) {
							if (d % 1 == 0 && d >= 0 && d < newdata.columnlabels.length) {
								return invIndexXMapper(d);
							}
						});
						
				var yAxis = d3.svg.axis().scale(cellYPositionLin).orient("right")
						.ticks(newdata.rowlabels.length)
						.tickFormat(function(d) {
							if (d % 1 == 0 && d >= 0 && d < newdata.rowlabels.length) {
								return invIndexYMapper(d);
							}
						});
						
				var zoom = d3.behavior.zoom()
						.y(cellYPositionLin)
						.scaleExtent([1, 8])
						.on("zoom", draw);
						
				var vis = svg.append("g")
					.attr("class", "uncovered")
						
				var clip = svg.append("defs").append("svg:clipPath")
					.attr("id", "clip")
					.append("svg:rect")
					.attr("id", "clip-rect")
					.attr("x", margin.left)
					.attr("y", margin.top  )
					.attr("width", width)
					.attr("height", height);
				
				var cellcover = svg.append("g")
					.attr("class", "heatmapcells")
					.attr("clip-path", "url(#clip)")
					.call(zoom);
				
				vis.append("g").attr("class", "xAxis").attr("transform", "translate(0," + (margin.top + height) + ")")
					.call(xAxis)
					.selectAll("text")  
						.style("text-anchor", "start")
						.attr("dy", ( -(cellXPositionLin(2) - cellXPositionLin(1) )/2 ) + "px")
						.attr("dx", "20px")
						.attr("transform", function(d) {
							return "rotate(90)" 
						});
					
				vis.append("g").attr("class", "yAxis").attr("transform", "translate(" + (width + margin.left) + ")")
					.call(yAxis)
					.selectAll("text")  
							.style("text-anchor", "start")
							.attr("dy", ( (cellYPositionLin(2) - cellYPositionLin(1) )/2 ) + "px");
							
				var heatmapcells = cellcover.append("g")
					.selectAll("rect")
						.data(newdata.data)
						.enter()
						.append("rect");
						
				draw();
						
				function draw() {
					
					
					vis.select(".xAxis").call(xAxis)
						.selectAll("text")  
							.style("text-anchor", "start")
							.attr("dy", ( -(cellXPositionLin(2) - cellXPositionLin(1) )/2 ) + "px")
							.attr("dx", "20px")
							.attr("transform", function(d) {
								return "rotate(90)" 
							});
							
					vis.select(".yAxis").call(yAxis)
						.selectAll("text")  
							.style("text-anchor", "start")
							.attr("dy", ( (cellYPositionLin(2) - cellYPositionLin(1) )/2 ) + "px");

					heatmapcells
						.attr({
							"class": "cells",
							"height": function(d){
								return cellYPositionLin(2) - cellYPositionLin(1); ;
							},
							"width": function(d){
								return cellXPositionLin(2) - cellXPositionLin(1) ;
							},
							"x": function(d, i) { return cellXPositionLin( indexXMapper(d.col) ); },
							"y": function(d, i) { return cellYPositionLin( indexYMapper(d.row) ); },
							"fill": function(d) {
								return "rgb(" + redColorControl(d.value, scope.inputcolor) + "," + greenColorControl(d.value, scope.inputcolor) + ","+ blueColorControl(d.value, scope.inputcolor)+")";
					
							},
							"value": function(d) { return d.value; },
							"index": function(d, i) { return i; },
							"row": function(d, i) { return d.row; },
							"column": function(d, i) { return d.col; }
						})
					
					//cellcover.selectAll("path").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
					//cellcover.selectAll("circle").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
				}

				if (newdata.tree.left) {
					
					var lefttreewidth = margin.left;
					var lefttreeheight = height;
					var leftgenes = new Array();

					var leftcluster = d3.layout.cluster()
						.size([lefttreeheight, lefttreewidth -120])
						.separation(function(a,b){ //Define a separation of neighboring nodes. Make neighbor distances equidistant so they can align with heatmap.
							return a.parent == b.parent ? 5:5;
					});

					var leftelbow = function(d, i){
						return "M" + (lefttreewidth - (d.source.d * 100) )  + "," + (d.source.x + margin.top )
						+ "V" + ( d.target.x + margin.top  ) + "H" + (lefttreewidth - (d.target.d * 100) );
					};

					var leftclick = function(d){

						var nColor = '#ffffff'; //Initial nonselected color of a node.
						var pColor = '#cccccc'; //Initial nonselected color of a branch.
						
						var cir = lefttree //Selects all the circles representing nodes but only those which were the clicked circle, using datum as the equality filter.
							.selectAll("circle")
							.filter(function(db){
								return d === db ? 1 : 0;
							});

						var path = lefttree.selectAll(".leftlink") //Selects all paths but only those which have the same source coordinates as the node clicked.
							.filter(function(dp){
								return (d.x === dp.source.x && d.y === dp.source.y) ? 1 : 0;
							});
							
						//Check the state of the clicked node. If 'active' (color is green) swap to inactive colors and pass those colors down to all children and vice versa.
						if(cir.style('fill') == '#00ff00'){
						
							cir.style('fill', nColor)
								.transition().attr('r', 2).duration(500); //Change radius of nonactive nodes.
							
							path.transition().style('stroke', pColor).duration(500);
						
						} else {
							
							nColor = '#00ff00';
							pColor = '#00ff00';
							cir.style('fill', nColor)
								.transition().attr('r', 5).duration(500);
							path.transition().style('stroke', pColor).duration(500);
							
						};

						if(d.children){ //Check if the node clicked is not a leaf. If the node has children, travel down the three updating the colors to indicate selection.
							leftwalk(d, nColor, pColor);
						} else {
							if(nColor == '#00ff00'){ //Check color to see if indicated action is a select/deselect
								if(leftgenes.indexOf(d.id) == -1){ //Check if gene already is in the array.
									leftgenes.push(d.id)
								}
							} else { //Algorithm for removing genes from the list on a deselect.
								var index = leftgenes.indexOf(d.id); //Get the index of the given gene in the gene array.
								leftgenes.splice(index, 1); //Splice that gene out of the array using its gotten index.
							};
						};
						
						//alert(leftgenes) <-- Function to do something with selected genes.
						
					};

					//Function to walk down the tree from a selected node and apply proper color assignments based on selection.
					var leftwalk = function(d, nColor, pColor){
						//alert(d.name);
						d.children.forEach(function(dc){ //Loop through each child, recursively calling walk() as necessary.
						
							lefttree
								.filter(function(db){
									return dc === db ? 1 : 0;
								})
								.transition().style("fill",nColor).duration(500)
								.transition().attr("r", 2).duration(500);

							d3.selectAll(".leftlink")
								.filter(function(dp){
									return (dc.x === dp.source.x && dc.y === dp.source.y) ? 1 : 0;
								})
								.transition().style("stroke", pColor).duration(500);

							if(dc.children){ //Check if children exist, if so, recurse the previous function.
								leftwalk(dc, nColor, pColor);
							} else {
								if(nColor == '#00ff00'){
									if(leftgenes.indexOf(dc.id) == -1){
										leftgenes.push(dc.id);
									};
								} else {
									var index = leftgenes.indexOf(dc.id);
									leftgenes.splice(index, 1);
								}
							};
						});
					};

					var leftnodes = leftcluster.nodes(newdata.tree.left)//Create the nodes based on the tree structure.

					var lefttree = cellcover.append("g").attr("class", "lefttree");

					var leftlink = lefttree.selectAll("path") //Create the branches.
						.data(leftcluster.links(leftnodes))
						.enter().append("path")
						.attr("class", "leftlink")
						.attr("d", leftelbow) //Call function elbow() so that the paths drawn are straight and not curved.


					var leftnode = lefttree.selectAll("circle") //Take the data in nodes and create individual nodes.
						.data(leftnodes)
						.enter().append("circle")
						.attr("class","leftnode")
						.attr("cx", function(d) {
							if( !(d.parent) ){
								return Math.floor( (lefttreewidth - (d.d * 100)) );
							} else {
								if( !(d.children) ){
									return  Math.floor(lefttreewidth) ;
								} else {
									return Math.floor(lefttreewidth - (d.d * 100));
								}
							}
						})
						.attr("cy", function(d) {
							if( !(d.parent) ){
								return Math.floor(d.x) + margin.top;
							} else {
								if( !(d.children) ){
									return Math.floor(d.x) + margin.top;
								} else {
									return Math.floor(d.x) + margin.top;
								}
							}
						})
						.attr("r", 2)
						.on("click", function(d) {
							console.log(d);
							console.log( getter(d) );
						})
						.on("click", leftclick);
					
				}
				
				
				
				if (newdata.tree.top) { //only goes here if tree information is built into system

					var toptreewidth = width;
					var toptreeheight = margin.top;
					
					var topgenes = new Array();

					var getter = function(node) {

						if (!node.children) {
							return(node.name);
						} else {
							for (i = 0; i < 2; ++i) {
								getter(node.children[i])
							}
						}

					}

					var topcluster = d3.layout.cluster()
						.size([toptreewidth, toptreeheight -120 ])
						.separation(function(a,b){ //Define a separation of neighboring nodes. Make neighbor distances equidistant so they can align with heatmap.
							return a.parent == b.parent ? 5:5;
					});
					
					//Scaling function to fit the dimensions of the tree within its svg window
					var topscaling = d3.scale.linear()
										.domain([0, newdata.tree.top.d])
										.range([toptreeheight, 0]); //In reversed order due to svg coordinate system. 0 distance nodes should be along the bottom, which would be the height of that window.

					var topelbow = function(d, i){
						
						return "M" + (d.target.x + margin.left )  + "," + (topscaling(d.target.d))
						+ "V" + (topscaling(d.source.d)) + "H" +  ( d.source.x + margin.left  );
					};
					
				

					var topclick = function(d){
						
						var nColor = '#ffffff'; //Initial nonselected color of a node.
						var pColor = '#cccccc'; //Initial nonselected color of a branch.
						
						var cir = toptree //Selects all the circles representing nodes but only those which were the clicked circle, using datum as the equality filter.
							.selectAll("circle")
							.filter(function(db){
								return d === db ? 1 : 0;
							});

						var path = toptree.selectAll(".toplink") //Selects all paths but only those which have the same source coordinates as the node clicked.
							.filter(function(dp){
								return (d.x === dp.source.x && d.y === dp.source.y) ? 1 : 0;
							});
							
						//Check the state of the clicked node. If 'active' (color is green) swap to inactive colors and pass those colors down to all children and vice versa.
						if(cir.style('fill') == '#00ff00' || cir.style('fill') == 'rgb(0, 255, 0)'){
						
							cir.style('fill', nColor)
								.transition().attr('r', 2).duration(500); //Change radius of nonactive nodes.
							
							path.transition().style('stroke', pColor).duration(500);
						
						} else {
							
							nColor = '#00ff00';
							pColor = '#00ff00';
							cir.style('fill', nColor)
								.transition().attr('r', 5).duration(500);
							path.transition().style('stroke', pColor).duration(500);
							
						};

						if(d.children){ //Check if the node clicked is not a leaf. If the node has children, travel down the three updating the colors to indicate selection.
							topwalk(d, nColor, pColor);
						} else {
							if(nColor == '#00ff00'){ //Check color to see if indicated action is a select/deselect
								if(topgenes.indexOf(d.id) == -1){ //Check if gene already is in the array.
									topgenes.push(d.id)
								}
							} else { //Algorithm for removing genes from the list on a deselect.
								var index = topgenes.indexOf(d.id); //Get the index of the given gene in the gene array.
								topgenes.splice(index, 1); //Splice that gene out of the array using its gotten index.
							};
						};
						
						//<-- Function to do something with selected genes.
						scope.$apply(function() {
							scope.celllink.column = topgenes; 
						});
					};

					//Function to walk down the tree from a selected node and apply proper color assignments based on selection.
					var topwalk = function(d, nColor, pColor){
						//alert(d.name);
						d.children.forEach(function(dc){ //Loop through each child, recursively calling walk() as necessary.
						
							toptree
								.selectAll("circle")
								.filter(function(db){
									return dc === db ? 1 : 0;
								})
								.transition().style("fill",nColor).duration(500)
								.transition().attr("r", 2).duration(500);

							d3.selectAll(".toplink")
								.filter(function(dp){
									return (dc.x === dp.source.x && dc.y === dp.source.y) ? 1 : 0;
								})
								.transition().style("stroke", pColor).duration(500);

							if(dc.children){ //Check if children exist, if so, recurse the previous function.
								topwalk(dc, nColor, pColor);
							} else {
								if(nColor == '#00ff00'){
									if(topgenes.indexOf(dc.id) == -1){
										topgenes.push(dc.id);
									};
								} else {
									var index = topgenes.indexOf(dc.id);
									topgenes.splice(index, 1);
								}
							};
						});
					};

					var topnodes = topcluster.nodes(newdata.tree.top)//Create the nodes based on the tree structure.

					var toptree = vis.append("g").attr("class", "toptree");

					var toplink = toptree.selectAll("path") //Create the branches.
						.data(topcluster.links(topnodes))
						.enter().append("path")
						.attr("class", "toplink")
						.attr("d", topelbow) //Call function topelbow() so that the paths drawn are straight and not curved.


					var topnode = toptree.selectAll("circle") //Take the data in nodes and create individual nodes.
						.data(topnodes)
						.enter().append("circle")
						.attr("class","topnode")
						.attr("cy", function(d) {
							if( !(d.parent) ){
								return Math.floor(topscaling(d.d));
							} else  {
								if( !(d.children) ){
									return  Math.floor(toptreeheight) ;
								} else {
									return Math.floor(topscaling(d.d));
								}
							}
						})
						.attr("cx", function(d) {
							if( !(d.parent) ){
								return Math.floor(d.x) + margin.left;
							} else {
								if( !(d.children) ){
									return Math.floor(d.x) + margin.left;
								} else {
									return Math.floor(d.x) + margin.left;
								}
							}
						})
						.attr("r", 2)
						.on("click", topclick);
					
				}
				
			});
		 

		}
	}
}]);
