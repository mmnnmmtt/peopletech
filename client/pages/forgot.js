Template.forgot.helpers({
  recoverySuccess: function () {
    return Session.get("recoverySuccess");
  },
  recoveryError: function () {
    return Session.get("recoveryError");
  },
});

Template.forgot.events({
  'submit form': function (event) {
    event.preventDefault();
    Meteor.call("requestPasswordReset", event.target.who.value, function (err) {
      if (err) {
        Session.set("recoveryError", err.reason);
        return;
      }
      Session.set("recoverySuccess", true);
    });
  }
});
