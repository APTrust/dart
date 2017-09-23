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
	<virtual each={ profiles }>
	<tr class="clickable-row" data-href="#profile/{ _id }/edit">
	  <td>{ ['BagIt-Profile-Info']['External-Description'] } xxxx</td>
	</tr>
	</virtual>
  </tbody>
</table>

<script>
  //var self = this;
  //var es = require('./static/js/easy-store.js');
  //self.profiles = es.profiles()
</script>

</profile-list>
