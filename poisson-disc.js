// the setup
var img = new Image();
img.src = 'http://upload.wikimedia.org/wikipedia/commons/a/a5/Fez_(video_game)_screenshot_11.png';

var canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.background = '#eee';
document.body.appendChild(canvas);

var ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';


// the algorithm
const PI2 = Math.PI * 2;
const RADIUS = 100;
const RADIUS2 = RADIUS * 2;
const CANDIDATES = 10;
const INTERVAL = 1000;

var polygons = [];
var points = [];
var active = [];

// create one random point
var point = {
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
};
points.push(point);
active.push(point);

var start = new Date();

function animate() {

  if ((new Date()) - start < INTERVAL) {
    requestAnimationFrame(animate);

  } else if (active.length) {
    start = start + INTERVAL;

    // get a random active sample
    var randomIndex = Math.floor(Math.random() * active.length);
    var current = active[randomIndex];
    var acceptable = null;

    // generate candidates
    for (var i of new Array(CANDIDATES)) {
      var distance = Math.random() * RADIUS + RADIUS;
      var angle = Math.random() * PI2;
      var candidate = {
        x: current.x + Math.cos(angle) * distance,
        y: current.y - Math.sin(angle) * distance,
      };
      var good = true;

      // check candidate
      if (candidate.x > canvas.width || candidate.y > canvas.height
          || candidate.x < 0 || candidate.y < 0) {
          good = false;
      } else {
        // TODO find a way to avoid brute forcing this
        for (var point of points) {
          var diffX = point.x - candidate.x;
          var diffY = point.y - candidate.y;
          var diff = Math.sqrt(diffX * diffX + diffY * diffY);

          if (diff < RADIUS) {
            good = false;
            break;
          }
        }
      }

      if (good) {
        acceptable = candidate;
        break;
      }
    }


    if (acceptable) {
      // find out if it's in a polygon
      var index;
      var container;
      polygons.some(function (polygon, i) {
        var det = contains2(polygon, acceptable);

        if (det > 0) {
          index = i;
          container = polygon;
          return true;
        }
      });

      // split the polygon
      if (container) {
        polygons = polygons.concat([
          [container[0], container[1], acceptable],
          [container[1], container[2], acceptable],
          [container[2], container[0], acceptable],
        ]);
        polygons.splice(index, 1);

      // create a new polygon with 2 closest points
      } else if (points.length > 1) {
        var closest = [];

        for (var point of points) {
          var diffX = point.x - acceptable.x;
          var diffY = point.y - acceptable.y;
          point.diff = Math.sqrt(diffX * diffX + diffY * diffY);

          if (closest.length < 1) {
            closest[0] = point;
          } else if (closest[0].diff > point.diff) {
            closest[1] = closest[0];
            closest[0] = point;
          } else if (closest.length < 2 || closest[1].diff > point.diff) {
            closest[1] = point;
          }
        }

        // TODO probably need to make these counterclockwise
        polygons.push([closest[0], closest[1], acceptable]);
      }

      points.push(acceptable);
      active.push(acceptable);
    } else {
      active.splice(randomIndex, 1);
    }

    requestAnimationFrame(animate);
  } else {
    console.log('done');

  }

  drawAll();
}

function drawAll() {
  ctx.clearRect(0, 0, 1000000, 1000000);

  ctx.fillStyle = 'black';
  for (var point of points) {
    ctx.fillRect(point.x, point.y, 10, 10);
  }

  ctx.strokeStyle = 'black';
  for (var polygon of polygons) {
    ctx.moveTo(polygon[0].x, polygon[0].y);
    ctx.lineTo(polygon[1].x, polygon[1].y);
    ctx.lineTo(polygon[2].x, polygon[2].y);
    ctx.lineTo(polygon[0].x, polygon[0].y);
    ctx.stroke();
  }
}

function sign(p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

function contains2(polygon, point) {
  var v1 = polygon[0], v2 = polygon[1], v3 = polygon[2];
  var b1, b2, b3;

  b1 = sign(point, v1, v2) < 0;
  b2 = sign(point, v2, v3) < 0;
  b3 = sign(point, v3, v1) < 0;

  return ((b1 == b2) && (b2 == b3));
}

function contains(polygon, point) {
  var a = polygon[0], b = polygon[1], c = polygon[2];
  var p = point;
  if (!a || !b || !c || !p) {
    debugger;
  }
  return (
    (a.x - p.x) * (b.y - p.y) * ((c.x * c.x - p.x * p.x) + (c.y * c.y - p.y * p.y)) +
    (a.y - p.y) * (c.x - p.x) * ((b.x * b.x - p.x * p.x) + (b.y * b.y - p.y * p.y)) +
    (b.x - p.x) * (c.y - p.y) * ((a.x * a.x - p.x * p.x) + (a.y * a.y - p.y * p.y)) -
    (
      (a.x - p.x) * (c.y - p.y) * ((b.x * b.x - p.x * p.x) + (b.y * b.y - p.y * p.y)) +
      (a.y - p.y) * (b.x - p.x) * ((c.x * c.x - p.x * p.x) + (c.y * c.y - p.y * p.y)) +
      (b.y - p.x) * (c.x - p.y) * ((a.x * a.x - p.x * p.x) + (a.y * a.y - p.y * p.y))
    )
  );
}

requestAnimationFrame(animate);

/*
for (var point of points) {
  ctx.fillRect(point.x, point.y, 4, 4);
}
*/

