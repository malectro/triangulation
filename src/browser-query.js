const query = {};

if (typeof window !== 'undefined') {
  // create query dict from search string
  location.search.replace('?', '').split('&').forEach((tuple) => {
    tuple = tuple.split('=');
    query[tuple[0]] = tuple[1];
  });
}

export default query;

