importScripts('bower_components/poly2tri/dist/poly2tri.js');

function ptri(points, canvas) {
  var polygons = [];
  var contour = [
      new poly2tri.Point(0, 0),
      new poly2tri.Point(canvas.width, 0),
      new poly2tri.Point(canvas.width, canvas.height),
      new poly2tri.Point(0, canvas.height)
  ];
  var swctx = new poly2tri.SweepContext(contour);
  swctx.addPoints(points.map(function (point) {
    return new poly2tri.Point(point.x, point.y);
  }));
  var triangles = swctx.triangulate().getTriangles();

  polygons = [];
  for (var tri of triangles) {
    polygons.push({points: tri.getPoints()});
  }
  return polygons;
}

self.onmessage = function (event) {
  var polygons = ptri(event.data[0], event.data[1]);
  self.postMessage(polygons);
  self.close();
};

