Template.editProfile.helpers({
  firstEmail: function () {
    return (this.emails && this.emails.length) &&
      this.emails[0].address || '';
  }
});

Template.editProfile.events({
  'submit form': function (event) {
    event.preventDefault();
    // XXX do the saving
  },
  'click .cancel': function (event) {
    Router.go("/people/" + (this.username || this.uid));
  }
});


Template.editProfile.events({
  'submit form.editProfile': function (event) {
    event.preventDefault();
    var self = this;

    Meteor.call("updateProfile", this.username || this.uid, {
      fullname: event.target.fullname.value,
      nickname: event.target.nickname.value,
      email: event.target.email.value,
      facebook: event.target.facebook.value,
      linkedin: event.target.linkedin.value,
      twitter: event.target.twitter.value
    }, function (err) {
      if (err) {
        alert(err.reason);
      } else {
        Router.go("/people/" + (self.username || self.uid));
      }
    });
  },
  'click .remove-tag': function (event) {
    var user = Template.parentData(0);
    Meteor.call("removeTag", user.username || user.uid, '' + this);
  },
  'click .add-tag': function (event) {
    Meteor.call("addTag", this.username || this.uid, self.prompt("Tag name"));
  }
});
