importScripts('/bower_components/poly2tri/dist/poly2tri.js');
importScripts('/bower_components/underscore/underscore.js');
importScripts('quadtree.js');

const PI2 = Math.PI * 2;
var RADIUS = 20;
var CANDIDATES = 10;
var WIDTH = 100;
var HEIGHT = 100;

var polygons = [];
var points = [];
var active = [];
var quadtree;


function poisson() {
  quadtree = quadtreeNew(0, 0, WIDTH, HEIGHT);

  // create one random point
  var point = {
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    vx: 0,
    vy: 0,
  };
  points.push(point);
  active.push(point);
  quadtreeAdd(quadtree, point);

  while (active.length) {
    // get a random active sample
    var randomIndex = Math.floor(Math.random() * active.length);
    var current = active[randomIndex];
    var acceptable = null;

    // generate candidates
    for (var i = 0; i < CANDIDATES; i++) {
      var far = Math.random() * RADIUS + RADIUS;
      var angle = Math.random() * PI2;
      var candidate = {
        x: current.x + Math.cos(angle) * far,
        y: current.y - Math.sin(angle) * far,
        vx: 0,
        vy: 0,
      };
      var good = true;

      // check candidate
      if (candidate.x > WIDTH || candidate.y > HEIGHT
          || candidate.x < 0 || candidate.y < 0) {
          good = false;
      } else {
        good = quadtreeFits(quadtree, candidate);
      }

      if (good) {
        acceptable = candidate;
        break;
      }
    }

    if (acceptable) {
      points.push(acceptable);
      active.push(acceptable);
      quadtreeAdd(quadtree, acceptable);
    } else {
      active.splice(randomIndex, 1);
    }
  }
}

function ptri(pointList, canvas) {
  var contour = [
    {x: 0, y: 0},
    {x: canvas.width, y: 0},
    {x: canvas.width, y: canvas.height},
    {x: 0, y: canvas.height},
    /*
    new poly2tri.Point(0, 0),
    new poly2tri.Point(canvas.width, 0),
    new poly2tri.Point(canvas.width, canvas.height),
    new poly2tri.Point(0, canvas.height)
    */
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

  for (var poly of polygons) {
    for (var point of poly.points) {
      if (!point.polygons) {
        point.polygons = [];
      }
      point.polygons.push(poly);
    }
  }

  return [polygons, contour.concat(pointList), poly];
}

self.onmessage = function (event) {
  RADIUS = event.data[0];
  CANDIDATES = event.data[1];
  WIDTH = event.data[2];
  HEIGHT = event.data[3];

  poisson();
  var results = ptri(points, {width: WIDTH, height: HEIGHT});

  //console.log('hi', results);
  postMessage([results[0], results[1], quadtree]);

  self.close();
};

