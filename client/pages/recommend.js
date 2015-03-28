Template.recommend.helpers({
  loggedIn: function () {
    return !! Meteor.userId();
  },
  recommendError: function () {
    return Session.get("recommendError");
  },
  lastRecommend: function () {
    return Session.get("lastRecommend");
  }
});

Template.recommend.events({
  'submit form': function (event) {
    var t = event.target;

    event.preventDefault();
    // XXX validate form, don't let them submit it if it sucks

    var links = t.otherLinks.value.split('\n'); // XXX clean up further
    links.push(t.personal.value); // XXX if present/clean up

    Meteor.call("recommend", {
      fullname: t.theirName.value,
      recommenderName: Meteor.userId() ? null : t.yourName.value,
      comment: t.comment.value,
      emails: t.emails.value.split('\n'), // XXX clean up further
      facebook: t.facebook.value, // XXX parse out name
      linkedin: t.linkedin.value, // XXX parse out name
      twitter: t.twitter.value,
      links: links
    }, function (err) {
      if (err) {
        // XXX XXX clears all field.. major bummer!
        Session.set("lastRecommend", null);
        Session.set("recommendError", err.reason);
      } else {
        Session.set("recommendError", null);
        Session.set("lastRecommend", t.theirName.value);
      }
    });
  }
});
