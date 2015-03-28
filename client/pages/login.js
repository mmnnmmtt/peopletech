Template.login.helpers({
  loginError: function () {
    return Session.get("loginError");
  }
});

Template.login.events({
  'submit form': function (event) {
    event.preventDefault();
    Meteor.loginWithPassword(
      { username: event.target.username.value },
      event.target.password.value,
      function (err) {
        if (err) {
          Session.set("loginError", err.reason);
        }
      });
  }
});
