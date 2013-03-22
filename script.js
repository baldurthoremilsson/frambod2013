var party_li = function(letter, info) {
  var name;
  if(info.url != '')
    name = crel('a', {href: info.url}, info.name);
  else
    name = info.name;
  return crel('li', name, ' (' + letter + ')');
};

var constituency_li = function(name, info) {
  return crel('li', crel('a', {'href': info.url}, name));
};

$(function() {
  var self = this;
  var parties = $('#parties');
  var constituencies = $('#constituencies');

  $.getJSON('parties.json', function(data) {
    for(var partyLetter in data) {
      parties.append(party_li(partyLetter, data[partyLetter]));
    }
  });

  $.getJSON('constituencies.json', function(data) {
    for(var name in data) {
      constituencies.append(constituency_li(name, data[name]));
    }
  })
});
