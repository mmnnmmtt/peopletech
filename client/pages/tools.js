var runTrelloImport = function () {
  Trello.boards.get('uLLSluYC', {
    cards: 'all',
    lists: 'all'
  }, function (data) {
    console.log(data);
    Meteor.call("importTrelloData", data, function (err, result) {
      if (err) {
        alert(err.message);
      } else {
        alert("Success was perpetrated, you sexy beast");
      }
    });
  }, function () {
    alert("Trello API request failed");
  });
};

Template.tools.events({
  'click .import-trello': function () {
    Trello.authorize({
      type: "popup",
      name: "Monument",
      persist: false,
      scope: { read: true, write: false, account: false },
      expiration: '1hour',
      success: runTrelloImport
    });
  },
  'click .sync-mailchimp': function () {
    Meteor.call("syncMailchimp", function (err, result) {
      if (err) {
        alert(err.message);
      } else {
        alert("Bold synchronization was effectuated");
      }
    });
  }
});
