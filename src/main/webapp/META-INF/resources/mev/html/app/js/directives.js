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
        inputsize:"="
      },
      //template: '<div>{{inputdata.data}}</div>',
      link: function (scope, element, attrs) {
		
		
		//Variable Declarations
		var debug = true;
		
		scope.visParams = {
            width : 600,
            height : 900,
            horizontal_padding : 30,
            vertical_padding : 10
        };
        
        scope.cellParams = {
            width: 0,
            height: 0,
            padding: 3
        };
		
		var svg = d3.select(element[0])
                      .append("svg")
                      .attr("width", scope.visParams.width )
                      .attr("height", scope.visParams.height);
		//Temporary SVG for hierarchy tree
		var genes = new Array;
		var svgt = d3.select(element[0])
			.append('svg')
			.attr('width', scope.visParams.width) //Use the same height and width parameters as the heatmap.
			.attr('height', scope.visParams.height) //May also be used for updating function and resizing.
			.append('g')
			.attr('transform','translate(40,0)');
		var cluster = d3.layout.cluster()
			.size([scope.visParams.height, scope.visParams.width - 160])
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
			var cir = d3.selectAll("svg").selectAll("circle").filter(function(db){
				return d === db ? 1 : 0
			}); //Selects all the circles representing nodes but only those which were the clicked circle, using datum as the equality filter.
			var path = d3.selectAll("svg").selectAll("path").filter(function(dp){
				return (d.x === dp.source.x && d.y === dp.source.y) ? 1 : 0;
			}); //Selects all paths but only those which have the same source coordinates as the node clicked.
			//Check the state of the clicked node. If 'active' (color is green) swap to inactive colors and pass those colors down to all children and vice versa.
			if(cir.style('fill') == '#00ff00'){
					cir.style('fill', nColor);
					path.transition().style('stroke', pColor).duration(500);
			}
			else{
				nColor = '#00ff00';
				pColor = '#00ff00';
				cir.style('fill', nColor);
				path.transition().style('stroke', pColor).duration(500);
			};
			if(d.children){ //Check if the node clicked is not a leaf. If the node has children, travel down the three updating the colors to indicate selection.
				walk(d, nColor, pColor);
			}
			else{
				if(nColor == '#00ff00'){
					genes.push(d.name)
				}
				else{
					var index = genes.indexOf(d.name);
					genes.splice(index, 1);
				};
			};
			alert(genes);
		};
		//Function to walk down the tree from a selected node and apply proper color assignments based on selection.
		function walk(d, nColor, pColor){
			//alert(d.name);
			d.children.forEach(function(dc){ //Loop through each child, recursively calling walk() as necessary.
				d3.selectAll("svg").selectAll("circle").filter(function(db){
					return dc === db ? 1 : 0;
				})
				.transition().style("fill",nColor).duration(500);
				d3.selectAll("svg").selectAll("path").filter(function(dp){
					return (dc.x === dp.source.x && dc.y === dp.source.y) ? 1 : 0;
				}).transition().style("stroke", pColor).duration(500);
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
        
        var updateVisualization = function () {
			
			svg.selectAll("rect")
               .data(scope.inputdata.data)
               .transition()
               .duration(1000)
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
        
        scope.$watch('inputdata', function(foo) {
        //Builds visualization on inputdata insert
          
          scope.cellParams.padding = ((scope.inputsize + 1) /3) * 3;
          scope.cellParams.width = ((scope.inputsize + 1) /3) *Math.floor( (scope.visParams.width / scope.inputdata.columns) - scope.cellParams.padding );
          scope.cellParams.height = scope.cellParams.width;
          
          if (debug) {
            // Debug Flag for Input Data
            
            console.log("Input Data Change ======================================");
            console.log("Input Data: ");
            console.log(scope.inputdata);
            console.log("Columns: " + scope.inputdata.columns + " (" + typeof scope.inputdata.columns);
            console.log("Rows: " + scope.inputdata.rows + " (" + typeof scope.inputdata.rows);

            // Debug Flag for Cell Params Values
            console.log("Cell Parameters:");
            console.log(scope.cellParams);
            console.log("Cell Width: " + scope.cellParams.width + " (" + typeof scope.cellParams.width + ")");
            console.log("Cell Height: " + scope.cellParams.height + " (" + typeof scope.cellParams.height + ")");

            // Debug flag for Vis Params 
            console.log("visParams:");
            console.log(scope.visParams);
            console.log("Width: " + scope.visParams.width + " (" + typeof scope.visParams.width + ")");
            console.log("Height: " + scope.visParams.height + " (" + typeof scope.visParams.height + ")");
            console.log("HR Padding: " + scope.visParams.horizontal_padding + " (" + typeof scope.visParams.horizontal_padding + ")");
            console.log("VR Padding: " + scope.visParams.vertical_padding + " (" + typeof scope.visParams.vertical_padding + ")");
          }

          //Build Visualization from scratch
          
          buildVisualization();
          
        });
        
        scope.$watch('inputsize', function(newdata, olddata) {
			

          scope.cellParams.padding = ((scope.inputsize + 1) /3) * 3;
          scope.cellParams.width = ((scope.inputsize + 1) /3) *Math.floor( (scope.visParams.width / scope.inputdata.columns) - scope.cellParams.padding );
          scope.cellParams.height = scope.cellParams.width;
          
          if (debug) {
            // Debug Flag for Input Data
            
            console.log("Input Data Change ======================================");
            console.log("Input Data: ");
            console.log(scope.inputdata);
            console.log("Columns: " + scope.inputdata.columns + " (" + typeof scope.inputdata.columns);
            console.log("Rows: " + scope.inputdata.rows + " (" + typeof scope.inputdata.rows);

            // Debug Flag for Cell Params Values
            console.log("Cell Parameters:");
            console.log(scope.cellParams);
            console.log("Cell Width: " + scope.cellParams.width + " (" + typeof scope.cellParams.width + ")");
            console.log("Cell Height: " + scope.cellParams.height + " (" + typeof scope.cellParams.height + ")");

            // Debug flag for Vis Params 
            console.log("visParams:");
            console.log(scope.visParams);
            console.log("Width: " + scope.visParams.width + " (" + typeof scope.visParams.width + ")");
            console.log("Height: " + scope.visParams.height + " (" + typeof scope.visParams.height + ")");
            console.log("HR Padding: " + scope.visParams.horizontal_padding + " (" + typeof scope.visParams.horizontal_padding + ")");
            console.log("VR Padding: " + scope.visParams.vertical_padding + " (" + typeof scope.visParams.vertical_padding + ")");
          }
          
          //Rebuild Visualization with new sizes
          
          updateVisualization();
          
        });
        
        scope.$watch('inputcolor', function(newdata, olddata) {
			

          scope.cellParams.padding = ((scope.inputsize + 1) /3) * 3;
          scope.cellParams.width = ((scope.inputsize + 1) /3) *Math.floor( (scope.visParams.width / scope.inputdata.columns) - scope.cellParams.padding );
          scope.cellParams.height = scope.cellParams.width;
          
          if (debug) {
            // Debug Flag for Input Data
            
            console.log("Input Data Change ======================================");
            console.log("Input Data: ");
            console.log(scope.inputdata);
            console.log("Columns: " + scope.inputdata.columns + " (" + typeof scope.inputdata.columns);
            console.log("Rows: " + scope.inputdata.rows + " (" + typeof scope.inputdata.rows);

            // Debug Flag for Cell Params Values
            console.log("Cell Parameters:");
            console.log(scope.cellParams);
            console.log("Cell Width: " + scope.cellParams.width + " (" + typeof scope.cellParams.width + ")");
            console.log("Cell Height: " + scope.cellParams.height + " (" + typeof scope.cellParams.height + ")");

            // Debug flag for Vis Params 
            console.log("visParams:");
            console.log(scope.visParams);
            console.log("Width: " + scope.visParams.width + " (" + typeof scope.visParams.width + ")");
            console.log("Height: " + scope.visParams.height + " (" + typeof scope.visParams.height + ")");
            console.log("HR Padding: " + scope.visParams.horizontal_padding + " (" + typeof scope.visParams.horizontal_padding + ")");
            console.log("VR Padding: " + scope.visParams.vertical_padding + " (" + typeof scope.visParams.vertical_padding + ")");
          }
          
          //Rebuild Visualization with new sizes
          
          updateVisualization();
          
        });
		  
      }
    }
  }]);
