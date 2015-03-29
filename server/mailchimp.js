var MAILCHIMP_LIST_ID = '6a7063f8fb'; // Friends of Monument

var callMailchimp = function (endpoint, params) {
  params = _.extend({}, params || {});

  var config = Config.findOne();
  if (! config.mailchimpAPIKey)
    throw new Meteor.Error("not-configured",
                           "Mailchimp API key must first be set");
  params.apikey = config.mailchimpAPIKey;
  var m = params.apikey.match(/-(.+)$/);
  if (! m)
    throw new Error("can't parse data center out of Mailchimp key");
  var dc = m[1];

  return HTTP.post('https://' + dc +
                   '.api.mailchimp.com/2.0/' + endpoint, {
                     data: params
                   }).data;
};

Meteor.methods({
  setMailchimpAPIKey: function (key) {
    check(key, String);
    checkAccess(this, "admin");

    Config.update({}, { $set: { mailchimpAPIKey: key } });
  },
  syncMailchimp: function () {
    checkAccess(this, "admin");

    console.log("--- Mailchimp Sync Running ---");
    var result = callMailchimp("lists/list");

    console.log("Lists (FYI):");
    _.each(result.data, function (list) {
      console.log("* " + list.id + " -- " + list.name);
    });

    var groupings = callMailchimp("lists/interest-groupings", {
      id: MAILCHIMP_LIST_ID,
      counts: false
    });
    var tagsGrouping = _.findWhere(groupings, { name: 'Tags' });
    if (! tagsGrouping)
      throw new Error("'Tags' grouping not found in list");
    var existingGroups = {}; // name to integer id
    _.each(tagsGrouping.groups, function (group) {
      existingGroups[group.name] = group.id;
    });

    // Grind through the user database and gather needed info
    var allTags = {}; // tag name to true
    var usersWithoutLeids = {}; // email address to _id
    var batch = [];
    Meteor.users.find().forEach(function (user) {
      _.each(user.tags || [], function (tag) {
        allTags[tag] = true;

        if (! user.emails || ! user.emails.length)
          return;
        var email = user.emails[0].address;

        var record = {
          email_type: 'html'
        };
        if (user.mailchimpLeid) {
          record.email = { leid: user.mailchimpLeid };
        } else {
          record.email = { email: email };
          usersWithoutLeids[email] = user._id;
        }

        record.merge_vars = {
          'new-email': email,
          groupings: [
            {
              id: tagsGrouping.id,
              groups: user.tags || []
            }
          ],
          FULLNAME: user.fullname,
          NICKNAME: user.nickname || 'bob'
        };

        batch.push(record);
      });
    });

    // Create any missing tags in Mailchimp
    _.each(_.keys(allTags), function (tag) {
      if (_.has(existingGroups, tag))
        return;

      callMailchimp("lists/interest-group-add", {
        id: MAILCHIMP_LIST_ID,
        group_name: tag,
        grouping_id: tagsGrouping.id
      });
    });

    // Add/update subscribers
    // Should be capped at 5k-10k records, but we're a ways away from that
    var outcome = callMailchimp("lists/batch-subscribe", {
      id: MAILCHIMP_LIST_ID,
      update_existing: true,
      replace_interests: true, // overwrite groups
      double_optin: false,
      batch: batch
    });

    if (outcome.error_count) {
      console.log(outcome);
      throw new Error("Mailchimp batch-subscribe call failed");
    }

    // Save Mailchimp ids back to our database
    _.each(outcome.adds.concat(outcome.updates), function (item) {
      if (_.has(usersWithoutLeids, item.email)) {
        Meteor.users.update(usersWithoutLeids[item.email], {
          $set: { mailchimpLeid: item.leid }
        });
      }
    });
  }
});
