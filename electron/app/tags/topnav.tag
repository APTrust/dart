<topnav>
	<nav class="navbar navbar-default brand-light-orange-bg">
	  <div class="container-fluid">
		<!-- Brand and toggle get grouped for better mobile display -->
		<div class="navbar-header">
		  <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
			<span class="sr-only">Toggle navigation</span>
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
		  </button>
		  <a class="navbar-brand" href="#">Easy Store</a>
		</div>

		<!-- Collect the nav links, forms, and other content for toggling -->
		<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
		  <ul class="nav navbar-nav">
			<li><a href="#">Dashboard</a></li>
			<li class="dropdown">
			  <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">Settings<span class="caret"></span></a>
			  <ul class="dropdown-menu" role="menu">
				<li><a href="#profiles">BagIt Profiles</a></li>
				<li><a href="#settings">General Settings</a></li>
				<li><a href="#storage">Storage Services</a></li>
				<li><a href="#workflows">Workflows</a></li>
			  </ul>
			</li>
			<li class="dropdown">
			  <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">Jobs<span class="caret"></span></a>
			  <ul class="dropdown-menu" role="menu">
				<li><a href="#jobs/new">New</a></li>
				<li><a href="#jobs">List All</a></li>
			  </ul>
			</li>
			<li><a href="#bags">Bags</a></li>
		  </ul>
		  <ul class="nav navbar-nav navbar-right">
			<li><a href="#">Your Name</a></li>
			<li class="dropdown">
			  <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">Account <span class="caret"></span></a>
			  <ul class="dropdown-menu" role="menu">
				<li><a href="#">Change Password</a></li>
				<li><a href="#">Sign Out</a></li>
			  </ul>
			</li>
		  </ul>
		</div><!-- /.navbar-collapse -->
	  </div><!-- /.container-fluid -->
	</nav>

	<p>{ selected }</p>

	<script>
	  var self = this;
	  self.selected = '';
	  var route = require('riot-route');
	  var r = route.create();
	  r('profiles', loadProfiles);
	  r('settings', loadSettings);
	  r('storage', loadStorage);
	  r('workflows', loadWorkflows);
	  r('jobs/new', newJob);
	  r('jobs', loadJobs);
	  r('bags', loadBags);
	  r(showDefault)

	  function showDefault() {
		self.update({
		  selected: 'Click a menu item'
		});
	  }

	  function loadProfiles() {
		var callback = function(err, docs) {
		  if(err) { console.log(err) }
		  console.log(docs)
		  riot.mount(document.getElementById('container'), 'profile-list', { profiles: docs })
		}
		var es = require('electron').remote.getGlobal('EasyStore')
		es.profiles(callback)
	  }
	  function loadSettings() {
		self.update({
		  selected: 'profiles'
		});
	  }
	  function loadStorage() {

	  }
	  function loadWorkflows() {

	  }
	  function newJob() {

	  }
	  function loadJobs() {

	  }
	  function loadBags() {

	  }
	  showDefault();
	</script>

</topnav>
