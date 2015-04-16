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
  user.nickname = options.details.nickname;
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

  comment: function (options) {
    check(options, {
      person: Match.OneOf(String, Number),
      private: Boolean,
      comment: String
    });
    var currentUser = checkAccess(this, ["member", "admin"]);

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
  },

  makeMember: function (who) {
    check(who, Match.OneOf(String, Number));
    var currentUser = checkAccess(this, "admin");

    var person = Meteor.users.findOne({ $or: [
      { username: who },
      { uid: who }
    ]});
    if (! person)
      throw new Meteor.Error("not-found", "No such person");

    if (! person.emails || ! person.emails.length)
      throw new Meteor.Error("wrong-state",
                             "Only people with email addresses " +
                             "can be membered");

    if (_.contains(["admin", "member"], person.status)) {
      throw new Meteor.Error("wrong-state", "That person is already a member");
    }

    Meteor.users.update(person._id, {
      $set: { status: "member" }
    });

    Accounts.sendEnrollmentEmail(person._id);
  },

  setUsername: function (username, params) {
    check(username, String);
    params = params || {};
    check(params, {
      dryRun: Match.Optional(Boolean)
    });

    if (! params.dryRun) {
      var currentUser = checkAccess(this, ["member", "admin"]);
    }

    if (! username.match(/^[a-z0-9]+$/))
      throw new Meteor.Error("bad-value",
                             "Your name must be made up of lowercase " +
                             "letters and numbers. That's all you get.");
    if (username.length < 3 || username.length > 15)
      throw new Meteor.Error("bad-value",
                             "Your name must be between 3 and 15 characters.");

    if (Meteor.users.findOne({ username: username }))
      throw new Meteor.Error("taken", "That username is already taken.");

    if (params.dryRun)
      return;

    Meteor.users.update(currentUser._id, { $set: { username: username } });
  },

  requestPasswordReset: function (who) {
    check(who, String);

    var person = Meteor.users.findOne({ $or: [
      { username: who },
      { 'emails.address': who }
    ]});

    if (! person ||
        ! _.contains(["member", "admin"], person.status)) {
      // Only members can get password resets. For everyone else, we
      // pretend they're not in the database. That may change in the
      // future when candidates can be given passwords to log in (for
      // RSVPing for events, editing their form, whatever).
      throw new Meteor.Error("not-found", "Sorry, don't see such an account.");
    }

    if (! person.username) {
      // You actually should be setting a username too.
      Accounts.sendEnrollmentEmail(person._id);
    } else {
      // Nah, you just need to recover your password like you said.
      Accounts.sendResetPasswordEmail(person._id);
    }
  },

  updateProfile: function (who, fields) {
    check(who, Match.OneOf(String, Number));
    check(fields, {
      fullname: Match.Optional(String),
      nickname: Match.Optional(String),
      email: Match.Optional(String),
      facebook: Match.Optional(String),
      linkedin: Match.Optional(String),
      twitter: Match.Optional(String)
    });
    var currentUser = checkAccess(this, ["member", "admin"]);

    var person = Meteor.users.findOne({ $or: [
      { username: who },
      { uid: who }
    ]});

    if (! person)
      throw new Error("not-found", "No such person");

    if (_.has(fields, 'email')) {
      var email = fields.email;
      delete fields.email;
      if (email !== (person.emails &&
                     person.emails.length &&
                     person.emails[0].address)) {
        // Trying to change the email
        if (person._id !== currentUser._id &&
            _.contains(["member", "admin"], person.status) &&
            currentUser.status !== "admin") {
          throw new Meteor.Error("access-denied", "Members can only change " +
                                 "their own email addresses");
        }

        Meteor.users.update(person._id, {
          $set: { 'emails.0': { address: email, verified: false } }
        });
      }
    }

    Meteor.users.update(person._id, {
      $set: fields
    });
  },

  removeTag: function (who, tag) {
    console.log(who, tag);
    check(who, Match.OneOf(String, Number));
    check(tag, String);

    var currentUser = checkAccess(this, ["member", "admin"]);
    var person = Meteor.users.findOne({ $or: [
      { username: who },
      { uid: who }
    ]});

    Meteor.users.update(person._id, { $pull: { tags: tag } });
  },

  addTag: function (who, tag) {
    console.log(who, tag);
    check(who, Match.OneOf(String, Number));
    check(tag, String);

    var currentUser = checkAccess(this, ["member", "admin"]);
    var person = Meteor.users.findOne({ $or: [
      { username: who },
      { uid: who }
    ]});

    Meteor.users.update(person._id, { $addToSet: { tags: tag } });
  }
});

Meteor.publish("people", function (searchSpec) {
  checkAccess(this, ["member", "admin"]);
  check(searchSpec, MatchSearchSpec);

  return Meteor.users.find(searchSpecToSelector(searchSpec),
                           { fields: { fullname: 1, status: 1, tags: 1,
                                       username: 1, uid: 1
                                     } });
});


Meteor.publish("person", function (spec) {
  checkAccess(this, ["member", "admin"]);
  check(spec, Match.OneOf(String, Number));
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
                referrer: 1, mergeTokens: 1, username: 1, emails: 1, uid: 1,
                mailchimpLeid: 1
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
