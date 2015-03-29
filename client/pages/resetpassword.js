var resetToken, doneResetting;

Accounts.onResetPasswordLink(function (token, done) {
  setTimeout(function () {
    Router.go("/resetPassword");
  }, 0);
  resetToken = token;
  doneResetting = done;
});

Template.resetPassword.helpers({
  resetPasswordError: function () {
    return Session.get("resetPasswordError");
  }
});

Template.resetPassword.events({
  'submit form': function (event) {
    event.preventDefault();
    Accounts.resetPassword(resetToken, event.target.password.value, function (err) {
      if (err) {
        Session.set("resetPasswordError", err.reason);
        return;
      }

      doneResetting();
      resetToken = doneResetting = null;
      Router.go("/me");
    });
  }
});
