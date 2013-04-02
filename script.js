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
  initialize: function(data) {
    this.on('change', function() {
      if(this.get('populated'))
        return;
      this.set({populated: true,});
      this.candidateLists();
    });
  },
  candidateLists: function() {
    var candidates = this.get('candidates');
    if(!candidates)
      return;

    this.candidatesAll = new CandidateList;
    this.constituencies = new ConstituencyList;
    for(var i = 0; i < candidates.constituencies.length; i++) {
      var constituency = candidates.constituencies[i];
      var constituencyModel = new Backbone.Model({
        name: constituency.name,
      });
      var candidateList = constituencyModel.candidates = new CandidateList;
      for(var j = 0; j < constituency.list.length; j++) {
        var data = constituency.list[j];
        data.seat = j+1;
        var candidate = new Backbone.Model(data);
        candidateList.add(candidate);
        this.candidatesAll.add(candidate);
      }
      this.constituencies.add(constituencyModel);
    }
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
    var counter = partylist.parties.length;
    var always = function() {
      counter--;
      if(counter == 0)
        this.trigger('loaded');
    };
    for(var i = 0; i < partylist.parties.length; i++) {
      var party = new Party({
        id: partylist.parties[i],
      });
      this.add(party);
      var jqXHR = party.fetch();
      jqXHR.always(_.bind(always, this));
    }
  },
});

var CandidateList = Backbone.Collection.extend({
});

var ConstituencyList = Backbone.Collection.extend({
  url: 'data/constituencies.json',
  comparator: 'name',
  populate: function() {
    var options = {
      success: _.bind(this.populateHandler, this),
    };
    this.sync('read', this, options);
  },
  populateHandler: function(constituencies) {
    for(var name in constituencies) {
      var data = constituencies[name];
      data.name = name;
      var constituency = new Backbone.Model(data);
      this.add(constituency);
    }
    this.trigger('render');
  },
});


// views

var PartyView = Backbone.View.extend({
  tagName: 'li',
  render: function() {
    var attrs = this.model.attributes;
    this.$el.append(link(attrs.name, attrs.url));
    this.$el.append(' (' + attrs.letter + ')');
    return this;
  },
});

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

var ConstituencyView = Backbone.View.extend({
  tagName: 'li',
  render: function() {
    var attrs = this.model.attributes;
    this.$el.append(link(attrs.name, attrs.url));
    return this;
  },
});

var ConstituencyListView = Backbone.View.extend({
  initialize: function() {
    this.listenTo(this.collection, 'render', this.render);
  },
  render: function() {
    this.$el.empty();
    var constituencies = this.collection.slice();
    for(var i = 0; i < constituencies.length; i++) {
      var constituency = new ConstituencyView({model: constituencies[i]});
      this.$el.append(constituency.render().el);
    }
  },
});

var PartyInfoView = Backbone.View.extend({
  tagName: 'li',
  render: function() {
    var name = this.model.get('name');
    var candidates = this.model.get('candidates');
    var table = new CandidatesTable({collection: this.model.candidatesAll});
    this.$el.append(crel('h3', name));
    this.$el.append(crel('div', {class: 'row'},
        crel('div', {class: 'span4'}, table.render().el)
    ));
    return this;
  },
});

var CandidatesTable = Backbone.View.extend({
  tagName: 'table',
  initialize: function() {
    this.all = this.collection;
    this.top5 = this.all.filter(function(candidate) {
      return candidate.get('seat') < 6;
    });
  },
  render: function() {
    this.$el
      .empty()
      .addClass('table')
      .append(this.header())
      .append(this.candidates())
      .append(this.females())
      .append(this.males());
    return this;
  },
  header: function() {
    return crel('tr',
      crel('th'),
      crel('th', '5 efstu'),
      crel('th', 'Allir')
    );
  },
  row: function(title, first, second) {
    return crel('tr',
      crel('th', title),
      crel('td', first),
      crel('td', second)
    );
  },
  candidates: function() {
    return this.row('Frambjóðendur', this.top5.length, this.all.length);
  },
  females: function() {
    var top5 = this.top5.filter(function(candidate) {
      return candidate.get('gender') == 'f';
    });
    var all = this.all.where({gender: 'f'});
    return this.row('Konur', top5.length, all.length);
  },
  males: function() {
    var top5 = this.top5.filter(function(candidate) {
      return candidate.get('gender') == 'm';
    });
    var all = this.all.where({gender: 'm'});
    return this.row('Karlar', top5.length, all.length);
  },
});

var PartyInfoListView = Backbone.View.extend({
  initialize: function() {
    this.listenTo(this.collection, 'loaded', this.render);
  },
  render: function() {
    this.$el.empty();
    var ul = crel('ul');
    for(var i = 0; i < this.collection.length; i++) {
      var party = this.collection.at(i);
      if(!party.get('candidates'))
        continue;

      var partyView = new PartyInfoView({model: party});
      ul.appendChild(partyView.render().el);
    }
    this.$el.append(ul);
  },
});

var AppView = Backbone.View.extend({
  initialize: function() {
    this.partylist = this.$('#partylist');
    this.constituencies = this.$('#constituencies');
    this.partyinfo = this.$('#partyinfo');

    this.partyCollection = new PartyList;
    this.constituencyCollection = new ConstituencyList;

    new PartyListView({
      collection: this.partyCollection,
      el: this.partylist,
    });
    new ConstituencyListView({
      collection: this.constituencyCollection,
      el: this.constituencies,
    });
    new PartyInfoListView({
      collection: this.partyCollection,
      el: this.partyinfo,
    });

    this.partyCollection.populate();
    this.constituencyCollection.populate();
  },
});


// kickstart the page!
$(function() {
  var app = new AppView({
    el: $('#frambod2013')
  });
});
