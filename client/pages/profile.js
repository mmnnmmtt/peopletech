Template.profile.helpers({
  stories: function () {
    return Stories.find({ person: this._id }, { sort: { date: -1 } });
  },
  isComment: function () {
    return this.type === "comment";
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
  }
});
