importScripts('bower_components/poly2tri/dist/poly2tri.js');
importScripts('bower_components/underscore/underscore.js');

var polygons = [];
var points = [];

function ptri(pointList, canvas) {
  var contour = [
      new poly2tri.Point(0, 0),
      new poly2tri.Point(canvas.width, 0),
      new poly2tri.Point(canvas.width, canvas.height),
      new poly2tri.Point(0, canvas.height)
  ];
  var swctx = new poly2tri.SweepContext(contour);

  // use original points
  /*
  points = pointList.map(function (point) {
    return new poly2tri.Point(point.x, point.y);
  });
  swctx.addPoints(points);
  */
  swctx.addPoints(pointList);
  var triangles = swctx.triangulate().getTriangles();

  polygons = [];
  for (var tri of triangles) {
    polygons.push({points: tri.getPoints()});
  }

  var closest = pointList[100];
  var poly = _.find(polygons, function (poly) {
    var point = _.find(poly.points, function (point) {
      return point == closest;
    });
    if (point) {
      return poly;
    }
  });

  return [polygons, pointList, poly];
}

self.onmessage = function (event) {
  var results = ptri(event.data[0], event.data[1]);
  self.postMessage(results);
  self.close();
};

