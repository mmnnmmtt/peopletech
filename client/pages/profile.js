Template.profile.helpers({
  stories: function () {
    return Stories.find({ person: this._id }, { sort: { date: -1 } });
  },
  isComment: function () {
    return this.type === "comment";
  },
  anyLinks: function () {
    return this.links && this.links.length > 0;
  },
  resolveLink: function (link) {
    // Do the 60 second version instead of the 2 hour version of
    // linking their text
    if (link.match(/^http/))
      return link;
    else
      return 'http://' + link;
  }
});

Template.profile.events({
  'submit form.comment': function (event) {
    event.preventDefault();
    // XXX validate
    Meteor.call("comment", {
      person: this.username || this.uid,
      comment: event.target.comment.value,
      private: event.target.private.checked
    });
  },
  'click .make-member': function (event) {
    Meteor.call("makeMember", this.username || this.uid,
                function (err) {
                  if (err)
                    alert(err.message);
                });
  }
});
