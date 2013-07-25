'use strict';

/* Directives */
angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]).
  directive('visHeatmap', [function() {
  /* Heatmap visualization function.
  * 
  */
		
    return {
			
		restrict: 'E',
		scope: {
			inputdata:"=",
			inputcolor:"=",
			pushtomarked:"&"
		},
		link: function (scope, element, attrs) {
			
			var visparams = {
				width : 600,
				height : 700,
				columnlabelgutter : 80,
				rowlabelgutter : 80,
			};
			var treeheight = visparams.height;
			var treewidth = 300;
			var genes = new Array;
			//SVG and D3.js of hierarchical tree.
			var svgt = d3.select(element[0])
				.append('svg')
				.attr('width', treewidth)
				.attr('height', treeheight) //May also be used for updating function and resizing.
				.append('g')
				.attr('transform','translate(40,80)');
				
			var cluster = d3.layout.cluster()
				.size([treeheight - 80, treewidth])
				.separation(function(a,b){ //Define a separation of neighboring nodes. Make neighbor distances equidistant so they can align with heatmap.
					return a.parent == b.parent ? 1:1;
				});
				
			d3.json("readme.json", function(json){ //Read the JSON that has the tree structure
				var nodes = cluster.nodes(json) //Create the nodes based on the tree structure.
				
				var link = svgt.selectAll("path.link") //Create the branches.
					.data(cluster.links(nodes))
					.enter().append("path")
					.attr("class", "link")
					.attr("d", elbow); //Call function elbow() so that the paths drawn are straight and not curved.
				
				var node = svgt.selectAll("g.node") //Take the data in nodes and create individual nodes.
					.data(nodes)
					.enter().append("g")
					.attr("class","node")
					.on("click", click) //Call function that will highlight the child branches from this node. Indicates to user which clustering they are interested in.
					.attr("transform", function(d){return "translate(" + d.y + "," + d.x + ")";})
								
				node.append("circle") //Add a circle to represent each node.
					.attr("r", 2)

				node.append("text") //Add labels to each node.
					.attr("dx", function(d){return d.children ? -8:8;})
					.attr("dy", 3)
					.attr("text-anchor", function(d){return d.children ? "end" : "start";})
					.text(function(d){return d.name});
			});
			function elbow(d, i){
				return "M" + d.source.y + "," + d.source.x
				+ "V" + d.target.x + "H" + d.target.y;
			};
			function click(d){
				var nColor = '#ffffff'; //Initial nonselected color of a node.
				var pColor = '#cccccc'; //Initial nonselected color of a branch.
				
				var cir = d3.selectAll("svg") //Selects all the circles representing nodes but only those which were the clicked circle, using datum as the equality filter.
					.selectAll("circle")
					.filter(function(db){
						return d === db ? 1 : 0;
				});
				
				var path = d3.selectAll(".link") //Selects all paths but only those which have the same source coordinates as the node clicked.
					.filter(function(dp){
						return (d.x === dp.source.x && d.y === dp.source.y) ? 1 : 0;
					});
				//Check the state of the clicked node. If 'active' (color is green) swap to inactive colors and pass those colors down to all children and vice versa.
				if(cir.style('fill') == '#00ff00'){
						cir.style('fill', nColor)
							.transition().attr('r', 2).duration(500); //Change radius of nonactive nodes.
						path.transition().style('stroke', pColor).duration(500);
				}
				else{
					nColor = '#00ff00';
					pColor = '#00ff00';
					cir.style('fill', nColor)
						.transition().attr('r', 5).duration(500);
					path.transition().style('stroke', pColor).duration(500);
				};
				
				if(d.children){ //Check if the node clicked is not a leaf. If the node has children, travel down the three updating the colors to indicate selection.
					walk(d, nColor, pColor);
				}
				else{
					if(nColor == '#00ff00'){ //Check color to see if indicated action is a select/deselect
						if(genes.indexOf(d.name) == -1){ //Check if gene already is in the array.
							genes.push(d.name)
						}
					}
					else{ //Algorithm for removing genes from the list on a deselect.
						var index = genes.indexOf(d.name); //Get the index of the given gene in the gene array.
						genes.splice(index, 1); //Splice that gene out of the array using its gotten index.
					};
				};
				alert(genes);
			};
			//Function to walk down the tree from a selected node and apply proper color assignments based on selection.
			function walk(d, nColor, pColor){
				//alert(d.name);
				d.children.forEach(function(dc){ //Loop through each child, recursively calling walk() as necessary.
					d3.selectAll("svg")
						.selectAll("circle")
						.filter(function(db){
							return dc === db ? 1 : 0;
						})
						.transition().style("fill",nColor).duration(500)
						.transition().attr("r", 2).duration(500);
					
					d3.selectAll(".link")
						.filter(function(dp){
							return (dc.x === dp.source.x && dc.y === dp.source.y) ? 1 : 0;
						})
						.transition().style("stroke", pColor).duration(500);
						
					if(dc.children){ //Check if children exist, if so, recurse the previous function.
						walk(dc, nColor, pColor);
					}
					else{
						if(nColor == '#00ff00'){
							if(genes.indexOf(dc.name) == -1){
								genes.push(dc.name);
							};
						}
						else{
							var index = genes.indexOf(dc.name);
							genes.splice(index, 1);
						}
					};
				});
			};
		
		var vis = d3.select(element[0])
					.append("svg")
					.attr("width", visparams.width )
					.attr("height", visparams.height);
        
        scope.cellParams = {
            width: 0,
            height: 0,
            padding: 3
        };
				
		var xCellScale = function(index, cols, cellPs) {
            return (index%cols)*(cellPs.width+(cellPs.padding/2));         
          }
          
        var yCellScale = function(index, cols, cellPs) {
            return Math.floor(index/cols) * (cellPs.height+cellPs.padding);
        };
        
        var threshold = 150;

        var colorScaleForward = function(j) {	 
            var value = d3.scale.linear()
                           .domain([d3.min(scope.inputdata.data), d3.max(scope.inputdata.data)])
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
        
        var colorScaleReverse = function(j) {	 
            var value = d3.scale.linear()
                           .domain([d3.min(scope.inputdata.data), d3.max(scope.inputdata.data)])
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
        
                var redColorControl = function(j, code) {
			
			var output = 0;
			
			if (code == 0) {
				output = colorScaleForward(j);
			} else {
				output = colorScaleForward(j);
			}
			
			return output;
		}
		
		var blueColorControl = function(j, code) {
			var output = 0;
			
			if (code == 1) {
				output = colorScaleReverse(j);
			}
			
			return output;
		}
		
		var greenColorControl = function(j, code) {
			var output = 0;
			
			if (code == 0) {
				output = colorScaleReverse(j);
			} else {
				output = colorScaleForward(j);
			}
			
			return output;
		}
        
        var buildVisualization = function () {
		    
		    svg.selectAll("rect")
               .data(scope.inputdata.data)
               .enter()
               .append("rect")
               .attr("height", scope.cellParams.height)
               .attr("width", scope.cellParams.width)
               .attr("x", function(d, i) {
                 return xCellScale(i, scope.inputdata.columns, scope.cellParams);
               })
               .attr("y", function(d, i) {
	             return yCellScale(i, scope.inputdata.rows, scope.cellParams);
               })
               .attr("fill", function(d) {
                 return "rgb(" + redColorControl(d, scope.inputcolor) + "," + greenColorControl(d, scope.inputcolor) + ","+blueColorControl(d, scope.inputcolor)+")";
               });
					
        }
			
			scope.$watch('inputdata', function(newdata, olddata) {
							
				vis.selectAll('*').remove();
				
				if (!newdata) {
					return;
				}
				    
				var values = newdata.data.map(function(x){return x.value});
				
				var threshold = 150;
				
				var colorScaleForward = function(j) {	 
					var value = d3.scale.linear()
						.domain([d3.min(values), d3.max(values)])
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

				var colorScaleReverse = function(j) {	 
					var value = d3.scale.linear()
						.domain([d3.min(values), d3.max(values)])
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

				var redColorControl = function(j, code) {
					var output = 0;
					if (code == "red") {
						output = colorScaleForward(j);
					} else {
						output = colorScaleForward(j);
					}
					return output;
					};

				var blueColorControl = function(j, code) {
					var output = 0;
					if (code == "blue") {
						output = colorScaleReverse(j);
					}
					return output;
				};

				var greenColorControl = function(j, code) {
					var output = 0;

					if (code == "red") {
						output = colorScaleReverse(j);
					} else {
						output = colorScaleForward(j);
					}

					return output;
				};
				
				var cellXPosition = d3.scale.ordinal()
						.domain(newdata.columnlabels)
						.rangeBands([visparams.rowlabelgutter, visparams.width]);
								
				var cellYPosition = d3.scale.ordinal()
						.domain(newdata.rowlabels)
						.rangeBands([visparams.columnlabelgutter, visparams.height]);

				var squares = vis.selectAll("rect")
						.data(newdata.data)
						.enter()
						.append("rect")
						.attr({
							"height": function(d){
								return .98*(cellYPosition(newdata.rowlabels[1]) - cellYPosition(newdata.rowlabels[0]));
							},
							"width": function(d){
								return .98*(cellXPosition(newdata.columnlabels[1]) - cellXPosition(newdata.columnlabels[0]));
							},
							"x": function(d, i) { return cellXPosition(d.col); },
							"y": function(d, i) { return cellYPosition(d.row); },
							"fill": function(d) {
								return "rgb(" + redColorControl(d.value, scope.inputcolor) + "," + greenColorControl(d.value, scope.inputcolor) + ","+ blueColorControl(d.value, scope.inputcolor)+")";
								
							},
							"value": function(d) { return d.value; },
							"index": function(d, i) { return i; },
							"row": function(d, i) { return d.row; },
							"column": function(d, i) { return d.col; }
						})
						.on('mouseover', function(d) {
							vis.append("text")
								.attr({
									"id": "tooltip",
									"x": cellXPosition(d.col),
									"y": cellYPosition(d.row) + 40,
								})
								.text("Gene: " + d.row + " Point: " + d.col + "\n Value: " + d.value);
						})
						.on('mouseout', function() { d3.select('#tooltip').remove(); })
						.on('click', function(d) {	
							scope.$apply( function() {
								scope.pushtomarked({input:d.row});
							});							
						});
						
				var xAxis = d3.svg.axis().scale(cellXPosition).orient("bottom");
				var yAxis = d3.svg.axis().scale(cellYPosition).orient("left");
				
				vis.append('g').attr("transform", "translate(0,"+ (visparams.rowlabelgutter - 20) +")").call(xAxis);
				vis.append('g').attr("transform", "translate(" + (visparams.columnlabelgutter) +",0)").call(yAxis);
				
				scope.changeColor = function(newcolor) {
				
					vis.selectAll('rect')
						.transition()
						.duration(500)
						.attr({
							"fill": function(d) {
								return "rgb(" + redColorControl(d.value, newcolor) + "," + greenColorControl(d.value, newcolor) + ","+ blueColorControl(d.value, newcolor)+")";
							}
						});
				};
			});
			
			scope.$watch('inputcolor', function(newdata, olddata) {

				if (newdata == olddata) {
					return;
				} 
				if (!newdata) {
				    return;	
				}
				else {
					scope.changeColor(newdata)
				}
				
				
				
			});
		}
	}
}]);
