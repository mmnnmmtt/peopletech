// Currently we only do enrollment for members, so we ask for both a
// username and password. In the future we may want to do enrollment
// for non-members as well, which would involve only a password
// (they'd log in with their email address instead of their
// username). We'll cross that bridge when we get there.

var enrollmentToken, doneEnrolling;

Accounts.onEnrollmentLink(function (token, done) {
  setTimeout(function () {
    Router.go("/enroll");
  }, 0);
  enrollmentToken = token;
  doneEnrolling = done;
});

Template.enroll.helpers({
  enrollmentError: function () {
    console.log("it's the helper");
    return Session.get("enrollmentError");
  }
});

Template.enroll.events({
  'submit form': function (event) {
    console.log("submit");
    event.preventDefault();

    if (! enrollmentToken) {
      Router.go("/me");
      return;
    }

    // XXX There's a bit of jank here. If password change succeeds but
    // username change fails, then you end up logged in with no
    // username, which is weird, and it's not clear how to go back and
    // fix it.
    //
    // Right way to fix this is a method that both redeems the change
    // token (and changes the password and logs you in), and changes
    // the username, simultaneously. To do this I think we need to
    // expose more of the accounts machinery so that you could write
    // your own resetPassword implementation.

    Meteor.call(
      "setUsername", event.target.username.value, { dryRun: true },
      function (err) {
        if (err) {
          Session.set("enrollmentError", err.reason);
          return;
        }

        Accounts.resetPassword(
          enrollmentToken,
          event.target.password.value, function (err) {
            if (err) {
              Session.set("enrollmentError", err.reason);
              return;
            }

            Meteor.call("setUsername", event.target.username.value, function (err) {
              if (err) {
                Session.set("enrollmentError", err.reason);
                return;
              }

              doneEnrolling();
              enrollmentError = doneEnrolling = null;
              Router.go("/me");
            });
          });
      });
  }
});
