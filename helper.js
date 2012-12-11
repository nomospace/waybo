var Handlebars = Handlebars || require('handlebars');

Handlebars.registerHelper('dateFormat', function(date) {
  return date && new Date(date);
});
Handlebars.registerHelper('textFormat', function(text) {
  return text;
});
Handlebars.registerHelper('trendsFormat', function(trends) {
  for (var t in trends) {
    if (t) {
      var dom = '', name = '';
      $.each(trends[new Date(t).format('yyyy-MM-dd hh:mm')], function(i, d) {
        name = '#' + d.name + '#';
        dom += '<li data-action="choose-trend" title="' + name + '">' + name + '</li>';
      });
      return dom;
    }
  }
});
