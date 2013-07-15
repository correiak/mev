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
		var svgt = d3.select(element[0])
			.append('svg')
			.attr('width', scope.visParams.width) //Use the same height and width parameters as the heatmap.
			.attr('height', scope.visParams.height) //May also be used for updating function and resizing.
			.append('g')
			.attr('transform','translate(40,0)');
			
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
					//Build the hierarchy tree
					var cluster = d3.layout.cluster()
						.size([scope.visParams.height, scope.visParams.width - 160]);
					d3.json("../readme.json", function(json){
						var nodes = cluster.nodes(json)
						
						var link = svg.selectAll("path.link")
							.data(cluster.links(nodes))
							.enter().append("path")
							.attr("class", "link")
							.attr("d", elbow);
						
						var node = svg.selectAll("g.node")
							.data(nodes)
							.enter().append("g")
							.attr("class","node")
							.attr("transform", function(d){return "translate(" + d.y + "," + d.x + ")";});
						
						node.append("circle")
							.attr("r", 4.5);
						
						node.append("text")
							.attr("dx", function(d){return d.children ? -8:8;})
							.attr("dy", 3)
							.attr("text-anchor", function(d){return d.children ? "end" : "start";})
							.text(function(d){return d.name});
					});
					function elbow(d, i){
						return "M" + d.source.y + "," + d.source.x
						+ "V" + d.target.x + "H" + d.target.y;
					}
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
