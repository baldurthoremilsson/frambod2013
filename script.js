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
    _.each(partylist.parties, function(partyId) {
      var party = new Party({
        id: partyId,
      });
      var jqXHR = party.fetch();
      jqXHR.always(_.bind(function() {
        this.add(party);
        counter--;
        if(counter == 0)
          this.trigger('loaded');
      }, this));
    }, this);
  },
});

var CandidateList = Backbone.Collection.extend({
});

var ConstituencyList = Backbone.Collection.extend({
  url: 'data/constituencies.json',
  comparator: 'name',
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
    this.listenTo(this.collection, 'loaded', this.render);
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

var MunicipalitiesView = Backbone.View.extend({
  tagName: 'ul',
  initialize: function() {
    this.municipalities = this.model.get('municipalities');
    this.municipalities.sort();
  },
  render: function() {
    for(var i = 0; i < this.municipalities.length; i++) {
      this.$el.append(crel('li', this.municipalities[i]));
    }
    return this;
  },
});

var ConstituencyView = Backbone.View.extend({
  tagName: 'li',
  events: {
    'click .showinfo': 'showinfo',
    'click .hideinfo': 'hideinfo',
  },
  render: function() {
    var attrs = this.model.attributes;
    var seatsTotal = attrs.seats + attrs.seatsatlarge;

    var municipalities = new MunicipalitiesView({model: this.model});

    this.$el.append(attrs.name + ' (' + seatsTotal + ')');
    this.$el.append(crel('button', {class: 'btn btn-link showinfo'}, 'Nánar'));
    this.$el.append(crel('button', {class: 'btn btn-link hidden hideinfo'}, 'Fela'));
    this.$el.append(crel('div', {class: 'hidden info'},
      crel('div',
        'Þingsæti: ' + attrs.seats, crel('br'),
        'Jöfnunarþingsæti: ' + attrs.seatsatlarge
      ),
      'Sveitarfélög í kjördæminu:',
      municipalities.render().el
    ));
    return this;
  },
  showinfo: function() {
    this.$('.info').removeClass('hidden');

    this.$('.showinfo').addClass('hidden');
    this.$('.hideinfo').removeClass('hidden');
  },
  hideinfo: function() {
    this.$('.info').addClass('hidden');

    this.$('.showinfo').removeClass('hidden');
    this.$('.hideinfo').addClass('hidden');
  },
});

var ConstituencyListView = Backbone.View.extend({
  initialize: function() {
    this.listenTo(this.collection, 'sync', this.render);
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
  events: {
    'click .display5': 'display5',
    'click .displayall': 'displayall',
    'click .hideall': 'hideall',
  },
  render: function() {
    var name = this.model.get('name');
    var candidates = this.model.get('candidates');
    var table = new CandidatesTable({collection: this.model.candidatesAll});
    var candidateLists = this.renderCandidates();

    this.$el.append(crel('h3', name));
    this.$el.append(crel('div', {class: 'row'},
        crel('div', {class: 'span4'}, table.render().el)
    ));
    this.$el.append(this.controls);
    this.$el.append(candidateLists);

    return this;
  },
  controls: function() {
    return crel('div', {class: 'controls'},
      'Birta frambjóðendur:',
      crel('button', {class: 'btn btn-link display5'}, '5 efstu'),
      crel('button', {class: 'btn btn-link displayall'}, 'alla á lista'),
      crel('button', {class: 'btn btn-link hideall hidden'}, 'fela lista')
    );
  },
  renderCandidates: function() {
    var container = crel('div', {class: 'candidates hidden'});
    var constituencies = this.model.constituencies.slice();

    for(var i = 0; i < constituencies.length; i++) {
      var constituency = constituencies[i];
      var candidates = new CandidatesList({collection: constituencies[i].candidates});
      container.appendChild(crel('h4', constituency.get('name')));
      container.appendChild(candidates.render().el);
    }
    return container;
  },
  display5: function() {
    // hide all but the first five on each list
    this.$('.candidates ol > li:nth-child(n+6)').hide();
    this.$('.candidates').removeClass('hidden');

    this.$('.display5').prop('disabled', true);
    this.$('.displayall').prop('disabled', false);
    this.$('.hideall').removeClass('hidden');
  },
  displayall: function() {
    // show all candidates in case they have been hidden
    this.$('.candidates ol > li').show();
    this.$('.candidates').removeClass('hidden');

    this.$('.display5').prop('disabled', false);
    this.$('.displayall').prop('disabled', true);
    this.$('.hideall').removeClass('hidden');
  },
  hideall: function() {
    this.$('.candidates').addClass('hidden');

    this.$('.display5').prop('disabled', false);
    this.$('.displayall').prop('disabled', false);
    this.$('.hideall').addClass('hidden');
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

var CandidatesList = Backbone.View.extend({
  tagName: 'ol',
  className: 'candidatelist',
  render: function() {
    var candidates = this.collection.slice();
    for(var i = 0; i < candidates.length; i++) {
      this.$el.append(crel('li', candidates[i].get('name')));
    }
    return this;
  },
});

var PartyInfoListView = Backbone.View.extend({
  initialize: function() {
    this.listenTo(this.collection, 'loaded', this.render);
  },
  render: function() {
    this.$el.empty();
    var ul = crel('ul', {class: 'nostyle'});
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
    this.constituencyCollection.fetch();
    window.dd = this.partyCollection;
  },
});


// kickstart the page!
$(function() {
  var app = new AppView({
    el: $('#frambod2013')
  });
});
