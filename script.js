// utils
var link = function(value, url) {
  if(url)
    return crel('a', {href: url}, value);
  return value;
};


// models

var Party = Backbone.Model.extend({
  urlRoot: 'data/',
  defaults: function() {
    return {populated: false};
  },
  initialize: function() {
    this.on('change', function() {
      if(this.get('populated'))
        return;
      this.set({populated: true,});
    });
  },
});


// collections

var PartyList = Backbone.Collection.extend({
  model: Party,
  url: 'data/partylist.json',
  comparator: 'letter',
  populate: function() {
    var options = {
      success: _.bind(this.populateHandler, this),
    };
    this.sync('read', this, options);
  },
  populateHandler: function(partylist) {
    for(var i = 0; i < partylist.parties.length; i++) {
      var party = new Party({
        id: partylist.parties[i],
      });
      this.add(party);
      party.fetch();
    }
  },
});


// views

var PartyListView = Backbone.View.extend({
  initialize: function() {
    this.listenTo(this.collection, 'change', this.render);
  },
  render: function() {
    this.$el.empty();
    var parties = this.collection.where({populated: true});
    for(var i = 0; i < parties.length; i++) {
      var party = new PartyView({model: parties[i]});
      this.$el.append(party.render().el);
    }
  },
});

var ConstituenciesView = Backbone.View.extend({
});

var PartyView = Backbone.View.extend({
  tagName: 'li',
  render: function() {
    var attrs = this.model.attributes;
    this.$el.append(link(attrs.name, attrs.url));
    this.$el.append(' (' + attrs.letter + ')');
    return this;
  },
});

var AppView = Backbone.View.extend({
  initialize: function() {
    this.partyCollection = new PartyList;
    this.partylist = this.$('#partylist');
    this.constituencies = this.$('#constituencies');
    this.parties = this.$('#parties');

    new PartyListView({
      collection: this.partyCollection,
      el: this.partylist,
    });

    this.partyCollection.populate();
  },
});


// kickstart the page!
$(function() {
  var app = new AppView({
    el: $('#frambod2013')
  });
});
