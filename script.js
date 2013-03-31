var link = function(value, url) {
  if(url)
    return crel('a', {href: url}, value);
  return value;
};

var party_li = function(info) {
  var letter = ' (' + info.letter + ')';
  return crel('li', link(info.name, info.url), letter);
};

var constituency_li = function(name, info) {
  return crel('li', crel('a', {href: info.url}, name));
};

var candidate_list = function(partyName, info) {
  var fragment = document.createDocumentFragment();
  fragment.appendChild(crel('h3', link(partyName, info.url)));

  info.constituencies.sort(function(a,b) {
    if(a.name < b.name)
      return -1;
    if(a.name > b.name)
      return 1;
    return 0;
  });
  for(var i in info.constituencies) {
    var constituency = info.constituencies[i];
    var ol = crel('ol');
    fragment.appendChild(crel('h4', link(constituency.name, constituency.url)));
    for(var j in constituency.list) {
      var person = constituency.list[j];
      ol.appendChild(crel('li', link(person.name, person.url)));
    }
    fragment.appendChild(ol);
  }

  return fragment;
};


var parties_list = function(el, data) {
  var letters = [];
  var parties = {};
  for(var i in data.parties) {
    var p = data.parties[i];
    letters.push(p.letter);
    parties[p.letter] = p;
  }

  letters.sort();
  for(var i in letters) {
    var letter = letters[i];
    var info = parties[letter];
    el.append(party_li(info));
  }
};

var candidates_list = function(el, data) {
  for(var i in data.parties) {
    var party = data.parties[i];
    var candidates = party.candidates;
    if(typeof candidates === "undefined")
      continue;
    //console.log(party.name);
    el.append(candidate_list(party.name, candidates));
  }
};

$(function() {
  var self = this;
  var parties = $('#parties');
  var constituencies = $('#constituencies');
  var candidates = $('#candidates');

  $.getJSON('data/parties.json', function(data) {
    parties_list(parties, data);
    candidates_list(candidates, data);
  });

  $.getJSON('data/constituencies.json', function(data) {
    for(var name in data) {
      constituencies.append(constituency_li(name, data[name]));
    }
  });

  return;
  $.get('data/candidates.json', function(data) {
    for(var partyName in data) {
      candidates.append(candidate_list(partyName, data[partyName]));
    }
  });
});
