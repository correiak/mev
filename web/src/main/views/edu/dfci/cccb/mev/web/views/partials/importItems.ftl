
<!-- Page Hacks -->
<br>
<br>
<br>
<!-- End Page Hacks -->

<p class="lead">Manage your datasets</p>


<div class="row-fluid">

  <div class="span12">
    <div class="row-fluid">
      <ul class="nav nav-tabs">
        <li class="active"><a href="#upload" data-toggle="tab">Upload</a></li>
        <li><a href="#googleDrive" data-toggle="tab">Google Drive</a></li>
        <li><a href="#tcga" data-toggle="tab">TCGA</a></li>
        <li><a href="#current" data-toggle="tab" ng-click="loadUploads()">Current</a></li>
      </ul>
 
      <div class="tab-content">
      
        <div class="tab-pane active" id="upload">
          <div class='uploadDrag'></div>
        </div>
        
        <div class="tab-pane" id="googleDrive">

        </div>
        
        <div class="tab-pane" id="tcga">

        </div>
       
        <div class="tab-pane" id="current" >
        
          <div uploads-Table uploads="userUploads"></div>
          
        </div>
      </div>
    </div>
  </div>

</div>