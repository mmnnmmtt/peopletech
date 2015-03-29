Router.plugin('dataNotFound', { notFoundTemplate: 'not-found' });

Router.onBeforeAction(function () {
  if (! Meteor.userId()) {
    this.layout(null);
    Session.set("loginError", null);
    this.render('login');
  } else {
    this.next();
  }
}, {
  except: ['home', 'forgot', 'hello-start', 'hello-page', 'recommend',
           'create']
});

Router.route('/', {
  name: 'home'
});

Router.route('/forgot', {
  name: 'forgot'
});

Router.route('/hello', {
  name: 'hello-start',
  template: 'hello',
  data: { page: 1 }
});

Router.route('/hello/:page', {
  name: 'hello-page',
  template: 'hello',
  data: function () { return this.params.page }
});

Router.route('/recommend', {
  name: 'recommend',
  action: function () {
    // Put the nav bar there only if logged in
    if (Meteor.userId())
      this.layout('mainLayout')
    Session.set("lastRecommend", null);
    Session.set("recommendError", null);
    this.render();
  }
});

Router.route('/people/:code', {
  name: 'profile',
  layoutTemplate: 'mainLayout',
  loadingTemplate: 'loading',
  waitOn: function () {
    var code = this.params.code;
    if (code.match(/^[0-9]+/)) {
      code = parseInt(code);
    }
    return Meteor.subscribe("person", code);
  },
  action: function () {
    // XXX unsightly code duplication
    var code = this.params.code;
    if (code.match(/^[0-9]+/)) {
      code = parseInt(code);
    }

    var person = Meteor.users.findOne({ $or: [
      { uid: code },
      { username: code }
    ]});

    if (! person) {
      this.render("not-found");
      return;
    }

    if (typeof code === "number") {
      // Redirects to canonical URL
      if (this.params.code !== '' + code) {
        this.redirect("/people/" + code);
        return;
      }
      if (person.username) {
        this.redirect("/people/" + person.username);
      }
    }

    this.render('profile', { data: person });
  }
});

Router.route('/create/:loginToken', {
  name: 'create',
  data: function () {
    return Meteor.users.findOne({ loginToken: this.params.loginToken });
  }
});

Router.route('/me', {
  name: 'dashboard',
  layoutTemplate: 'mainLayout'
});

Router.route('/list', {
  name: 'list',
  layoutTemplate: 'mainLayout',
  action: function () {
    Session.set("currentSearch", {
      tags: null,
      status: STATUSES
    });
    this.render();
  }
});

// XXX not idiomatic?
Router.onStop(function () {
  Session.set("currentSearch", null);
}, { only: ['list'] });

Router.route('/stats', {
  name: 'stats',
  layoutTemplate: 'mainLayout'
});

Router.route('/tools', {
  name: 'tools',
  layoutTemplate: 'mainLayout'
});

