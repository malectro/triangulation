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

self.onmessage = function (event) {
  RADIUS = event.data[0];
  CANDIDATES = event.data[1];
  WIDTH = event.data[2];
  HEIGHT = event.data[3];

  poisson();

  postMessage([points, quadtree]);
};

