_.extend(Accounts.emailTemplates, {
  sitename: "Monument",
  from: "Monument <contact@monument.house>"
});

_.extend(Accounts.emailTemplates.enrollAccount, {
  subject: function (user) {
    return "Set up your Monument account";
  },
  text: function (user, url) {
    return "" +
"Congratulations on becoming a Monument member! You'll now want to\n" +
"pick your Monument name (similar to a Twitter handle or username) and\n" +
"set up your online account so that you can more fully subsume your\n" +
"individuality into the hive mind. Better get on that right away, at\n" +
"this URL:\n" +
"\n" +
url + "\n"
"\n" +
"Time to find out how deep the rabbit hole really goes!\n",
"\n" +
"- Monument\n";
  }
});
