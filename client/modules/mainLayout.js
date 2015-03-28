Template.mainLayout.events({
  'click .logout': function (event) {
    Meteor.logout();
    Router.go('/');
    return false;
  }
});
