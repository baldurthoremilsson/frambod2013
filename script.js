var party_li = function(letter, info) {
  var name;
  if(info.url != '')
    name = crel('a', {href: info.url}, info.name);
  else
    name = info.name;
  return crel('li', name, ' (' + letter + ')');
};

$(function() {
  var self = this;
  var parties = $('#parties');

  $.getJSON('parties.json', function(data) {
    for(var partyLetter in data) {
      parties.append(party_li(partyLetter, data[partyLetter]));
    }
  });
});
