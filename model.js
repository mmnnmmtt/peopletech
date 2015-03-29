/* Meteor.users

_id, username, emails, createdAt, profile, services: per Meteor Accounts
If 'member' or 'admin', will have a username and password

uid: a small integer
fullname: String
nickname: String
status: String (inactive, lead, candidate, member, admin)
facebook, linkedin, twitter: String (username on each service)
trello: String (id of trello card on recruiting board)
links: [String]
mergeTokens (map from string to true if active, false if declined)
  (something like facebook:[username], fullname:[canonicalized name])
tags: [String]
referrer: person _id or null
referralCode: String (the code they give out to people they want to intro)

If status is 'candidate':
- loginToken (for magic link)
*/
Meteor.startup(function () {
  if (Meteor.isServer) {
    Meteor.users._ensureIndex({ uid: 1 }, { unique: true });
    Meteor.users._ensureIndex({ mergeTokens: 1 });
    Meteor.users._ensureIndex({ status: 1 });
    Meteor.users._ensureIndex({ tags: 1 });
    Meteor.users._ensureIndex({ referrer: 1 });
    Meteor.users._ensureIndex({ referralCode: 1 });
    Meteor.users._ensureIndex({ trello: 1 });
  }
});

STATUSES = [
  "inactive",
  "lead",
  "candidate",
  "member",
  "admin"
];


/*
_id
type: String (comment, merge-accepted, merge-declined, form-created,
      form-updated)
person: _id of Person that it applies to
who: _id of Person that posted the comment/took the action, or null
when: Date
private: if true, only admin and 'by' can see
archived: if true, only admin can see

for 'comment':
 - comment (String)
*/
Stories = new Mongo.Collection("stories");

/*
_id
person: _id of Person that filled out the form
type: String (name of form)
fields: subdocument with form data
*/
Forms = new Mongo.Collection("forms");

searchSpecToSelector = function (searchSpec) {
  var selector = {};
  if (searchSpec.tags)
    selector.tags = { $all: searchSpec.tags };
  selector.status = { $in: searchSpec.status };
  return selector;
};
