// These tags will be set and cleared depending on the Trello list
// that the user's card is in. After sync completes, at most one tag
// will be set on each person (that is currently in Trello).
var TRELLO_TAGS = {
  'brunch-email': '550f740db7f193108765be5e', // 'Potential Candidates' list
  'candidate-email': '5507a8030388e672034a3cd7' // 'Candidate' list
};

var parseFacebookAccount = function (entry) {
  // 'None'
  // 'none'
  // ''
  // null
  if (entry === null ||
      entry.match(/^\s*$/) ||
      entry.match(/^\s*none\s*$/i)) {
    return null;
  }

  // Appears to be a super old school user with no username. Facebook
  // will accept 2526899 as a username, or at least it will redirect.
  // 'https://www.facebook.com/profile.php?id=2526899'
  var m = entry.match(/\/profile\.php\?id=([0-9]+)\s*$/);
  if (m)
    return m[1];

  // 'https://www.facebook.com/megan.ford.18062'
  // 'https://www.facebook.com/christinajkelly/' (trailing slash!)
  // 'Facebook.com/kristasbook'
  // 'www.facebook.com/coco.krumme'
  // 'facebook.com/kevnull'
  // 'https://www.facebook.com/dbqpdb  dont use it much though'
  var m = entry.match(/com\/([^\/\s]+)/);
  if (m)
    return m[1];

  // '/rebeccasinclair'
  // 'sierranoellecampbell'
  var m = entry.match(/^\s*\/?(\S+)/);
  if (m)
    return m[1];

  return null; // don't think this is actually reachable
};

var parseLinkedinAccount = function (entry) {
  // 'None'
  // 'none'
  // ''
  // null
  if (entry === null ||
      entry.match(/^\s*$/) ||
      entry.match(/^\s*none\s*$/i)) {
    return null;
  }

  // I'm not sure what's actually going on here. You see three styles
  // of URL.

  // -- STYLE 1 --
  // 'www.linkedin.com/in/benjaminhersh'
  // 'http://www.linkedin.com/in/whitneysales/'
  // 'https://www.linkedin.com/in/walterrgray/en'
  // 'linkedin.com/in/bradyforrest'
  // 'Www.linkedin.com/in/kristasanders'
  // 'Update your public profile settingswww.linkedin.com/in/simonedrucker/en'
  // 'Public Profile Update your public profile settingswww.linkedin.com/in/bblumenstein/'
  // 'linkedin/in/joshuakaufman'
  var m = entry.match(/\/in\/([^\/\s?]+)/);
  if (m)
    return "/in/" + m[1];

  // '/rebeccasinclair (probably)'
  var m = entry.match(/^\s*\/([^\/?\s]+)(\s|$)/);
  if (m)
    return "/in/" + m[1];

  // 'sierracampbell'
  // (we only give you this if it really looks like a username)
  var m = entry.match(/^\s*([a-zA-Z0-9\-]+)\s*$/);
  if (m)
    return "/in/" + m[1];

  // 'www.linkedin.com/justinhinojoza'
  var m = entry.match(/\.com\/([^\/\s]+)(\s|$)/);
  if (m)
    return "/in/" + m[1];

  // -- STYLE 2 --
  // ' https://www.linkedin.com/profile/view?id=11699028'
  // 'https://www.linkedin.com/profile/view?id=26670195'
  // 'https://www.linkedin.com/profile/view?id=81001168&trk=nav_responsive_tab_profile',
  var m = entry.match(/\/profile\/view\?id=([0-9]+)(\s|&|$)/);
  if (m)
    return "/profile/view?id=" + m[1];

  // -- STYLE 3 --
  // 'https://www.linkedin.com/pub/yan-zhu/27/242/b71'
  var m = entry.match(/\/pub\/([^\s?]+)/);
  if (m)
    return "/pub/" + m[1];

  // You win some, you lose some:
  // 'https://www.linkedin.com/profile/public-profile-settings?trk=prof-edit-edit-public_profile',
  // 'https://www.linkedin.com/hp/?dnr=mgdifbDxdrABHZowMgyefCCydYAVrQdAj99z',
  // 'coco krumme'
  // 'uh...somewhere...'
  // 'none yet, it exists as a bookmark atm '
  // 'Have one but can\'t find it now. '

  return null;
};

var parseTwitterAccount = function (entry) {
  // 'None'
  // 'none'
  // ''
  // null
  if (entry === null ||
      entry.match(/^\s*$/) ||
      entry.match(/^\s*none\s*$/i)) {
    return null;
  }

  // 'https://twitter.com/ChrisRCohen'
  // 'http://twitter.com/lydialaurenson'
  // 'twitter.com/ehrlicp'
  var m = entry.match(/com\/([^\/\s]+)/);
  if (m)
    return m[1];


  // 'mjpesavento'
  // 'Empact'
  // '@kamrinklauschie'
  // 'tdfischer_'
  // '/hypothetical'
  var m = entry.match(/^\s*(\/|@)?([a-zA-Z0-9_]+)\s*$/);
  if (m)
    return m[2];

  // 'aahhh not actively on twitter as ive been motorbiking / off roading for the last 7 months. '
  return null;
};

Meteor.methods({
  importTrelloData: function (data) {
    checkAccess(this, "admin");

    _.each(data.cards, function (card) {
      if (card.closed)
        return; // archived card

      var person = Meteor.users.findOne({ trello: card.id });
      if (! person) {
        // Parse the description
        var m = card.desc.match(/### Email:\s*([^\s]+)\s*###/);
        var email = m ? m[1] : null;

        var details = {};
        var m = card.desc.match(/### Links:\n([\s\S]*)\n### How did you/)
        if (m) {
          var lines = m[1].split('\n');
          details.facebook = parseFacebookAccount(lines[0]);
          details.linkedin = parseLinkedinAccount(lines[1]);
          details.twitter = parseTwitterAccount(lines[2]);
          details.links = lines.slice(3)
        }

        // Guess their nickname
        var m = card.name.match(/\(([^)]+)\)\s*$/);
        if (m) {
          // 'Geoffrey Schmidt (Geoff)'
          details.nickname = m[1];
        } else {
          // Just take their first name
          m = card.name.match(/^\s*(\S+)/);
          details.nickname = m[1];
        }

        // Create the user, and set everything but email address
        details.trello = card.id;
        Accounts.createUser({
          username: ' ', // dummy value
          details: details
        });

        // Find the record we just created
        person = Meteor.users.findOne({ trello: card.id });
        if (! person)
          throw new Error("just created record, but still not found?");

        // Now set the email, if we have it.
        if (email) {
          try {
            Meteor.users.update(person._id, {
              $push: {
                emails: { address: email, verified: false }
              }
            });
          } catch (e) {
            // This happens if someone in Trello has an email address
            // that has already been taken by some other user (either
            // a duplicate Trello card, or someone created not through
            // Trello).
            console.log("Email set failed (duplicated address?) -- ",
                        email);
          }
        }
      }

      // Following sync logic runs even for cards that already exist

      // Tags based on Trello lists
      var wantedTags = [];
      var unwantedTags = [];
      _.each(TRELLO_TAGS, function (listId, tag) {
        if (card.idList === listId)
          wantedTags.push(tag);
        else
          unwantedTags.push(tag);
      });

      var fullname = card.name;
      var m = fullname.match(/^(.*\S)\s*\([^)]+\)\s*$/);
      if (m) {
        // Strip "Geoffrey Schmidt (Geoff)" to "Geoffrey Schmidt"
        // We will have pulled out Geoff as the nickname on initial import
        fullname = m[1];
      }

      Meteor.users.update(person._id, {
        $set: {
          fullname: fullname
        },
        $addToSet: {
          tags: { $each: wantedTags }
        }
      });

      // Evidently you can't addToSet and pull the same field in one operation
      Meteor.users.update(person._id, {
        $pullAll: {
          tags: unwantedTags
        }
      });
    });
  }
});
