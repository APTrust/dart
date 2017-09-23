<profile-list>
<h1>BagIt Profiles</h1>
<div class="pull-right">
  <a class="btn btn-primary" href="/profile/new" role="button">New</a>
</div>
<table class="table table-hover">
  <thead class="thead-inverse">
	<tr>
	  <th>Description</th>
	</tr>
  </thead>
  <tbody>
	<tr each={ p in profiles } class="clickable-row" data-href="#profile/{ p._id }/edit">
	  <td>{ p. }</td>
	</tr>
  </tbody>
</table>

<script>
  var self = this;
  var es = require('./static/js/easy-store.js');
  self.profiles = es.profiles()
</script>

</profile-list>
