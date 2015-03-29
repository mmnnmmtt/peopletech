var MAILCHIMP_DC = 'us10';
var MAILCHIMP_KEY = '99081bf71dfb562fa3a15efabbe85213-us10';

var BRUNCH_GUESTS_ID = 'ce5fa086fd'; // Monument Brunch Guests
var CANDIDATES_ID = '6a7063f8fb'; // People Interested in Monument Membership

Meteor.methods({
  syncMailchimp: function () {
    console.log("--- Mailchimp Sync Running ---");
    var result = HTTP.post('https://' + MAILCHIMP_DC + '.api.mailchimp.com/2.0/lists/list.json', {
      params: {
        apikey: MAILCHIMP_KEY
      }
    });

    console.log("Lists (FYI):");
    _.each(result.data.data, function (list) {
      console.log("* " + list.id + " -- " + list.name);
    });
  }
});
