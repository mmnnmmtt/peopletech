Meteor.autorun(function () {
  if (Session.get("currentSearch")) {
    Session.set("currentSearchReady", false);
    Meteor.subscribe("people", Session.get("currentSearch"), function () {
      Session.set("currentSearchReady", true);
    });
  }
})

Template.list.helpers({
  statuses: function () {
    return _.map(STATUSES, function (s) {
      return { statusName: s };
    });
  },
  loading: function () {
    return ! Session.get("currentSearchReady");
  },
  matches: function () {
    return Meteor.users.find(searchSpecToSelector(
      Session.get("currentSearch")));
  },
  relevantId: function () {
    return this.username || this.uid;
  }
});

Template.list.events({
  'submit form': function (event) {
    event.preventDefault();
    var t = event.target;

    var searchSpec = { tags: null, status: [] };
    var m = t.tags.value.match(/^\s*(.+)\s*$/);
    if (m) {
      searchSpec.tags = m[1].split(/\s+/);
    }
    _.each(STATUSES, function (status) {
      if (t['status.' + status].checked) {
        searchSpec.status.push(status);
      }
    });

    Session.set("currentSearch", searchSpec);
    console.log(searchSpec);
    console.log(event.target);
  }
});
