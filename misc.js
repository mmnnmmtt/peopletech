checkAccess = function (that, permittedLevels) {
  if (! (permittedLevels instanceof Array))
    permittedLevels = [ permittedLevels ];

  if (! that.userId)
    throw new Meteor.Error("not-logged-in", "Must be logged in to do that");

  var user = Meteor.users.findOne(that.userId);
  if (! user)
    throw new Error("User record missing?");

  if (! _.contains(permittedLevels, user.status))
    throw new Meteor.Error("access-denied",
                           "You don't have permission to do that");

  return user;
};
