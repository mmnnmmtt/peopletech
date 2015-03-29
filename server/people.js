Accounts.config({
  forbidClientAccountCreation: true
});

Meteor.startup(function () {
  if (Meteor.users.find().count() === 0) {
    Accounts.createUser({
      username: "bootstrap",
      password: "bootstrap",
      details: {
        fullname: "Bootstrap User"
      }
    });
  }
});

Accounts.onCreateUser(function (options, user) {
  var lastUser = Meteor.users.findOne({}, { sort: { uid: -1 } });
  // This can generate the same UID twice in a race, but then the unique
  // index on uid will make the insert fail. Good enough for now.
  user.uid = lastUser && (lastUser.uid + 1) || 0;

  if (user.uid !== 0) {
    delete user.username; // this is not how accounts get usernames
  }

  user.fullname = options.details.fullname;
  user.nickname = options.details.fullname; // XXX take just first word
  user.status = (user.uid === 0) ? "admin" : "lead";
  user.facebook = options.details.facebook;
  user.linkedin = options.details.linkedin;
  user.twitter = options.details.twitter;
  user.trello = options.details.trello;
  user.links = options.details.links || [];
  user.referrer = options.details.referrer || null;
  user.tags = ["new"];
  user.emails = user.emails || [];
  _.each(options.details.emails, function (email) {
    user.emails.push({ address: email, verified: false });
  });
  // XXX mergeTokens
  // XXX loginToken
  // XXX referralCode

  return user;
});

// XXX should probably move these to the client
Meteor.methods({
  recommend: function (options) {
    // XXX validate something or other
    var newUserId = Accounts.createUser({
      username: ' ', // dummy value
      details: {
        fullname: options.fullname,
        referrer: this.userId,
        emails: options.emails,
        facebook: options.facebook,
        linkedin: options.linkedin,
        twitter: options.twitter,
        links: options.links
      }
    });

    var comment = options.comment;
    if (! this.userId) {
      comment = "Public recommendation from " + options.recommenderName +
        "\n\n" + comment;
    }
    Stories.insert({
      type: "comment",
      person: newUserId,
      who: this.userId,
      comment: comment,
      when: new Date,
      private: false,
      archived: false
    });
  },

  // XXX verify appropriate login
  // XXX check inputs
  comment: function (options) {
    var person = Meteor.users.findOne({ $or: [
      { username: options.person },
      { uid: options.person }
    ]});
    if (! person)
      throw new Error("not-found", "No such person");

    Stories.insert({
      type: "comment",
      person: person._id,
      who: this.userId,
      when: new Date,
      private: options.private,
      archived: false,
      comment: options.comment
    });
  }
});

// XXX verify appropriate login
// XXX check inputs
Meteor.publish("people", function (searchSpec) {
  return Meteor.users.find(searchSpecToSelector(searchSpec),
                           { fields: { fullname: 1, status: 1, tags: 1,
                                       username: 1, uid: 1
                                     } });
});


// XXX verify appropriate login
// XXX check inputs
Meteor.publish("person", function (spec) {
  var who;

  // Nonreactively resolve to a user id
  if (typeof spec === "number") {
    who = Meteor.users.findOne({ uid: spec });
  }
  else {
    who = Meteor.users.findOne({ username: spec });
  }
  if (! who)
    throw new Meteor.Error("not-found", "No such person");

  return [
    Meteor.users.find(who._id, {
      fields: { fullname: 1, nickname: 1, status: 1, facebook: 1,
                linkedin: 1, twitter: 1, trello: 1, links: 1, tags: 1,
                referrer: 1, mergeTokens: 1, username: 1, emails: 1, uid: 1
              }
    }),
    /*
    // This isn't perfect, since mergeTokens on the person we're subscribing
    // to is not resolved reactively, but it'll do
    // XXX doesn't work at all: multiple cursors from same collection
    Meteor.users.find({ mergeTokens: { $in: who.mergeTokens } },
                      { fields: { mergeTokens: 1, fullname: 1, uid: 1,
                                  username: 1 }
                      }),
    */
    // XXX XXX include stories only if not private or if you are the admin,
    // and only if not archived, unless you wanted to see archived stories
    Stories.find({ person: who._id }),
    Forms.find({ person: who._id })
  ];
});

