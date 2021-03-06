<div class="row">
	<ul class="nav nav-tabs">
		<li class="active"><a href="#heatmapview" data-toggle="tab">Heatmap</a></li>
		<li><a href="#filterview" data-toggle="tab">Annotations</a></li>
		<li><a href="#analysisview" data-toggle="tab" ng-click="pullAllSelections()">Analysis</a></li>
		<li><a href="#infopane" data-toggle="tab" ng-click="pullAllSelections()">Info</a></li>
	</ul>
</div>

<div class="tab-content">

	<div class="tab-pane active" id="heatmapview">
		<div class="row">
			<div class="span3">
		
				<p class="lead">{{matrixlocation}}</p>
				
				<hr>
				
				<div ng-show="matrixsummary.columnClustered">
					<p class="muted"> Selected Column Cells: {{selectedcells.column.length}} </p>
					<p class="muted"> Selected Row Cells: {{selectedcells.row.length}} </p>
					<hr>
				</div>
				
				<div ng-show="matrixsummary.columnClustered">
					<!-- <button class="btn btn-block btn-primary" ng-click="pushSelections('row')">Submit Row Selections</button> -->
					
					<div class="control-group">
					  <label class="control-label" for="inputIcon">Name</label>
						<div class="controls">
							<div class="input-prepend">
								<span class="add-on"><i class="icon-folder-open"></i></span>
								<input class="span2" ng-model='selectionname' placeholder="Selection Name" type="text">
							</div>
						</div>
					</div>
					
					<button class="btn btn-block btn-primary" ng-click="pushSelections('column')">Submit Column Selections</button>
					<hr>
				</div>
				
				<p class="muted">Analysis Options</p>
				
				<div class="accordion" id="heatmapaccordion">
		
						<div class="accordion-group">
							<div class="accordion-heading">
								<a class="accordion-toggle" data-toggle="collapse" data-parent="#heatmapaccordion" href="#heatmapcollapseOne">
									Clustering
								</a>
							</div>
							<div id="heatmapcollapseOne" class="accordion-body collapse in">
								<div class="accordion-inner">
								
									<select ng-model="ClusterType">
										<option ng-repeat="clustertype in ['Euclidian']" value="{{clustertype}}"> {{clustertype}} </option> 
									</select> <p> by </p>
									<select ng-model="ClusterDimension"> 
										<option ng-repeat="selection in ['column']" value="{{selection}}"> {{selection}} </option>
									</select>
									
									<button class="btn btn-primary btn-block" ng-click="analyzeClustering()">Cluster</button>
									
								</div>
							</div>
						</div>

						
						
						<div class="accordion-group">
							<div class="accordion-heading">
								<a class="accordion-toggle" data-toggle="collapse" data-parent="#heatmapaccordion" href="#heatmapcollapseTwo">
									LIMMA
								</a>
							</div>
							<div id="heatmapcollapseTwo" class="accordion-body collapse">
								<div class="accordion-inner">
								
									<select ng-model="LimmaDimension">
										<option ng-repeat="dimension in ['column', 'row']" value="{{dimension}}"> {{dimension}} </option>		
									</select>
								
									<select ng-model="LimmaSelection1">
										<option ng-repeat="selection in selections.row.concat(selections.column)" value="{{selection}}"> {{selection}} </option>
									</select>
									
									<select ng-model="LimmaSelection2">	
										<option ng-repeat="selection in selections.row.concat(selections.column)" value="{{selection}}"> {{selection}} </option>
									</select>
									
									<input type='text' placeholder="0.2" />
									
									<button class="btn btn-primary btn-block" ng-click="analyzeLimmaRequester()">Analyze</button>
															
								</div>
							</div>
						</div>			
					
				</div>
				
				<hr>
				
				<button class="btn btn-block btn-success"><a href="/heatmap/{{matrixlocation}}/download"><i class="icon-download"></i> Download Data Matrix</a></button>
							
			</div>
			<div class="span7">
				<vis-Heatmap 
					inputdata="transformeddata"
					inputcolor="blue"
					showlabels="true"
					width="1000"
					height="900"
					marginleft="80"
					marginright="80"
					margintop="80"
					marginbottom="120"
					celllink="selectedcells"
					pushtomarked="markRow(inputindecies, inputdimension)">
				</vis-Heatmap>
			</div>
			
			<!--End Visualization Column -->
			
		</div>

	</div>
	
	<div class="tab-pane" id="filterview" ng-controller="GeneSelectCtrl">

		<div class="span3">

			<ul class="thumbnails">
				<li class="span2" ng-repeat="field in fieldFilters">
				
					<div class="well well-small">
					
						<a class="pull-right">
							<i class="icon-remove" ng-click="remFilter(field)"></i>
						</a>
						
						<h4 class="media-heading">{{field.attribute}}</h4>
						<hr>
						<p>Query: {{field.operand}}</p>
						<p>Operator: {{field.operator}}</p>
					
					</div>
					
				</li>
				
			</ul>
			
			<div class="row">
				<button class="btn btn-primary" ng-click="reqQuery(1)">Filter</button>
				<button class="btn btn-danger" ng-click="remAll()">Clear</button>
			</div>
			
			<hr>
			
			
			<div class="accordion" id="filteraccordion">
		
				<div class="accordion-group">
					<div class="accordion-heading">
						<a class="accordion-toggle" data-toggle="collapse" data-parent="#filteraccordion" href="#filterCollapseOne">
							Upload Annotations
						</a>
					</div>
					<div id="filterCollapseOne" class="accordion-body collapse">
						<div class="accordion-inner">
						
							<input id="file" type="file" multiple name="upload" />

							<div class="progress progress-striped active" id="progbox" style="visibility: hidden;">
								<div class="bar" id="progbar"></div>
							</div>
							
							<div id="rowoutput"></div>
							<div id="coloutput"></div>
						
							<button class="btn btn-primary btn-block" ng-click="sendRowFile()">Submit Row Annotations</button>
							<button class="btn btn-primary btn-block" ng-click="sendColFile()">Submit Column Annotations</button>
							
						</div>
					</div>
				</div>
				
				<div class="accordion-group">
					<div class="accordion-heading">
						<a class="accordion-toggle" ng-click="pullAllSelections()" data-toggle="collapse" data-parent="#filteraccordion" href="#filterCollapseTwo">
							LIMMA
						</a>
					</div>
					<div id="filterCollapseTwo" class="accordion-body collapse">
						<div class="accordion-inner">
						
							<select ng-model="LimmaDimension">
								<option ng-repeat="dimension in ['column', 'row']" value="{{dimension}}"> {{dimension}} </option>		
							</select>
						
							<select ng-model="LimmaSelection1">
								<option ng-repeat="selection in selections.row.concat(selections.column)" value="{{selection}}"> {{selection}} </option>
							</select>
							
							<select ng-model="LimmaSelection2">	
								<option ng-repeat="selection in selections.row.concat(selections.column)" value="{{selection}}"> {{selection}} </option>
							</select>
							
							<input type='text' value="0.2" />
							
							<button class="btn btn-primary btn-block" ng-click="analyzeLimmaRequester()">Analyze</button>
													
						</div>
					</div>
				</div>
				
				
			</div>
			
				
				
			
		</div>
		
		<!-- Data Table -->
		<div class="span9 offset1">
			
			<div class = "row">
			
				<div class="btn-group">
					<button class="btn" ng-click="changeDimension('row')">Rows</button>
					<button class="btn" ng-click="changeDimension('column')">Columns</button>
				</div>
				
				<div class="pagination pagination-right">
					<ul>
						<li><a ng-click="getPage(currentpage - 1)">Prev</a></li>
						<li ng-repeat="page in nearbypages"><a ng-click="getPage(page)"> {{page + 1}} </a> </li>
						<li><a ng-click="getPage(currentpage + 1)">Next</a></li>
					</ul>
				</div>
				
			</div>
		
			<div class="row">
			
				<div id="filtertable">
					<table class="table table-hover table-bordered">
						<thead>
							<tr>
							  <th ng-repeat="header in headers">{{header}}<i class="icon-plus-sign" data-target="#myModal" data-toggle="modal" ng-click="selectfilter( header )"></i></th>
							</tr>
						</thead>
						<tbody>
							<tr ng-repeat="row in tuples">
								<td ng-repeat="cell in row">
									{{cell.value}}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			
			</div>
			
			
			
		</div>
		
		<!-- Modal -->
		<div id="myModal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">

		  <div class="modal-header">
			<button type="button" class="close" data-dismiss="modal" aria-hidden="true"><i class="icon-remove"></i></button>
			<h3 id="myModalLabel">Add New Filter</h3>
		  </div>
		  
		  <div class="modal-body">
		    <p>Selection Name</p>
				<input ng-model="selectionname" type="text"/>
			<p>Select Filter Term</p>
				<input ng-model='modalinput.operand' />
			<p>Select Operator Term</p>
				<input ng-model='modalinput.operator' />

		  </div>
		  
		  <div class="modal-footer">
			<button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
			<button class="btn btn-primary"  data-dismiss="modal" aria-hidden="true" ng-click="addFilter( modalinput )">Save changes</button>
		  </div>

		</div>
		
	</div>

	

	<div class="tab-pane" id="analysisview">

		<div class="accordion" id="accordion2">
		
				<div class="accordion-group">
					<div class="accordion-heading">
						<a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion2" href="#collapseOne">
							Clustering
						</a>
					</div>
					<div id="collapseOne" class="accordion-body collapse in">
						<div class="accordion-inner">
						
							<select ng-model="ClusterType">
								<option ng-repeat="clustertype in ['Euclidian']" value="{{clustertype}}"> {{clustertype}} </option> 
							</select> <p> by </p>
							<select ng-model="ClusterDimension"> 
								<option ng-repeat="selection in ['column']" value="{{selection}}"> {{selection}} </option>
							</select>
							
							<button class="btn btn-primary" ng-click="analyzeClustering()">Cluster</button>
							
						</div>
					</div>
				</div>

				
				
				<div class="accordion-group">
					<div class="accordion-heading">
						<a class="accordion-toggle" ng-click="pullLimmaAnalysis()" data-toggle="collapse" data-parent="#accordion2" href="#collapseTwo">
							LIMMA
						</a>
					</div>
					<div id="collapseTwo" class="accordion-body collapse">
						<div class="accordion-inner">
							<div class="span3">
								<select ng-model="LimmaDimension">
									<option ng-repeat="dimension in ['column', 'row']" value="{{dimension}}"> {{dimension}} </option>		
								</select>
							
								<select ng-model="LimmaSelection1">
									<option ng-repeat="selection in selections.row.concat(selections.column)" value="{{selection}}"> {{selection}} </option>
								</select>
								
								<select ng-model="LimmaSelection2">	
									<option ng-repeat="selection in selections.row.concat(selections.column)" value="{{selection}}"> {{selection}} </option>
								</select>
								
								<input type='text' placeholder="0.2" />
								
								<button class="btn btn-primary btn-block" ng-click="analyzeLimmaRequester()">Analyze</button>
							
							</div>
							
							<div class="span8">
								<p class="lead">Previous Results (Significant)</p>
								<hr>
								<div class="accordion" id="limmaAccordion">
							
									<div class="accordion-group" ng-repeat="analysis in limmaPreviousAnalysis">
										<div class="accordion-heading">
											<a class="accordion-toggle" data-toggle="collapse" ng-click="analyzeLimmaViewRequester('{{analysis.dimension}}', '{{analysis.experiment}}', '{{analysis.control}}')" data-parent="#limmaAccordion" href="#filterCollapse{{analysis.experiment}}{{analysis.control}}">
												Experiment: {{analysis.experiment}} Control: {{analysis.control}} Dimension: {{analysis.dimension}} 
												
											</a>
										</div>
										<div id="filterCollapse{{analysis.experiment}}{{analysis.control}}" class="accordion-body collapse">
											<div class="accordion-inner">
											
												<div class="row">
												
												<button class="btn btn-success pull-right btn-small" 
													title="Download Full Limma Results" 
													ng-click="downloadLimmaRequester('{{analysis.dimension}}', '{{analysis.experiment}}', '{{analysis.control}}')">
													<i class="icon-download icon-white"></i>
												</button>
												<button class="btn btn-success pull-right btn-small"
													title="Generate New Heatmap" 
													ng-click="createNewHeatmap('{{analysis.dimension}}', '{{analysis.experiment}}', '{{analysis.control}}')">
													<i class="icon-th icon-white"></i>
												</button>
												
												</div>
												
												<div id="limmaResultsTable">
													<table class="table table-hover table-bordered">
														<thead>
															<tr>
															  <th ng-repeat="header in ['ID', 'Log-Fold-Change', 'Average Expression', 'P-Value', 'Q-Value']">{{header}}</th>
															</tr>
														</thead>
														<tbody>
															<tr ng-repeat="row in limmaviewtablerows ">
																<td>
																	{{row["id"]}}
																</td>
																<td>
																	{{row["logFoldChange"]}}
																</td>
																<td>
																	{{row["averageExpression"]}}
																</td>
																<td>
																	{{row["pValue"]}}
																</td>
																<td>
																	{{row["qValue"]}}
																</td>
															</tr>
														</tbody>
													</table>
												</div>
												
											</div>
										</div>
									</div>
									
								</div>
							<!--End Span Div -->
							</div>						
						</div>
					</div>
				</div>
				
				
								
			
		</div>


	</div>
	
	<div class="tab-pane" id="infopane">
	
			<p>Your Row Selections:</p>
			<p ng-repeat="selection in selections['row']">{{selection}}</p>
			
			
			<p>Your Column Selections:</p>
			<p ng-repeat="selection in selections['column']">{{selection}}</p>

		
		
		
		
		
						

	</div>

</div>
