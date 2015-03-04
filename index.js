var query = {};

// create query dict from search string
location.search.replace('?', '').split('&').forEach(function (tuple) {
  tuple = tuple.split('=');
  query[tuple[0]] = tuple[1];
});

if (query.run) {
  var script = document.createElement('script');
  script.async = true;
  script.src = query.run + '.js';
  document.head.appendChild(script);
}

