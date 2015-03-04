// the setup
var img = new Image();
//img.src = 'http://upload.wikimedia.org/wikipedia/commons/a/a5/Fez_(video_game)_screenshot_11.png';

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
const INTERVAL = 20;

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

var start = (new Date()) - 0;

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
      points.push(acceptable);
      active.push(acceptable);
    } else {
      active.splice(randomIndex, 1);
    }

    requestAnimationFrame(animate);
    drawAll();
  } else {

    console.log('done');
    triangulate();
    drawAll();
  }
}

function triangulate() {

  var outerPoints = [
    {x: 0, y: 0},
    {x: canvas.width, y: 0},
    {x: canvas.width, y: canvas.height},
    {x: 0, y: canvas.height},
  ];

  var edges = [
    [outerPoints[0], outerPoints[1]],
    [outerPoints[1], outerPoints[2]],
    [outerPoints[2], outerPoints[3]],
    [outerPoints[3], outerPoints[0]],
    [outerPoints[0], outerPoints[2]],
  ];

  polygons = [
    {
      points: [
        outerPoints[0],
        outerPoints[2],
        outerPoints[1],
      ],
      adjacents: [null, null, null],
    },
    {
      points: [
        outerPoints[0],
        outerPoints[3],
        outerPoints[2],
      ],
      adjacents: [null, null, null],
    },
  ];
  polygons[0].adjacents[2] = polygons[1];
  polygons[1].adjacents[1] = polygons[0];

  for (var point of points) {
    // find out if it's in a polygon
    var index;
    var container;
    polygons.some(function (polygon, i) {
      var det = contains2(polygon, point);

      if (det > 0) {
        index = i;
        container = polygon;
        return true;
      }
    });

    // split the polygon
    if (container) {
      var cp = container.points;
      var ca = container.adjacents;
      var newPolygons = [
        {
          points: [
            cp[0],
            point,
            cp[2],
          ],
          adjacents: [null, ca[1], null],
        },
        {
          points: [
            cp[0],
            cp[1],
            point,
          ],
          adjacents: [null, null, ca[2]],
        },
        {
          points: [
            point,
            cp[1],
            cp[2],
          ],
          adjacents: [ca[0], null, null],
        },
      ];

      var indx;
      if (ca[1]) {
        idx = ca[1].adjacents.indexOf(container);
        ca[1].adjacents[idx] = newPolygons[0];
      }
      if (ca[2]) {
        idx = ca[2].adjacents.indexOf(container);
        ca[2].adjacents[idx] = newPolygons[1];
      }
      if (ca[0]) {
        idx = ca[0].adjacents.indexOf(container);
        ca[0].adjacents[idx] = newPolygons[2];
      }

      newPolygons[0].adjacents[0] = newPolygons[2];
      newPolygons[0].adjacents[2] = newPolygons[1];
      newPolygons[1].adjacents[0] = newPolygons[2];
      newPolygons[1].adjacents[1] = newPolygons[0];
      newPolygons[2].adjacents[1] = newPolygons[0];
      newPolygons[2].adjacents[2] = newPolygons[1];

      polygons = polygons.concat(newPolygons);
      polygons.splice(index, 1);

    // create a new polygon with 2 closest points
    } else if (points.length > 1) {
      var closest = [];

      for (var otherPoint of points) {
        var diffX = otherPoint.x - point.x;
        var diffY = otherPoint.y - point.y;
        otherPoint.diff = Math.sqrt(diffX * diffX + diffY * diffY);

        if (closest.length < 1) {
          closest[0] = otherPoint;
        } else if (closest[0].diff > otherPoint.diff) {
          closest[1] = closest[0];
          closest[0] = otherPoint;
        } else if (closest.length < 2 || closest[1].diff > otherPoint.diff) {
          closest[1] = otherPoint;
        }
      }

      // TODO probably need to make these counterclockwise
      polygons.push([closest[0], closest[1], point]);
    }
  }
}

function drawAll() {
  ctx.clearRect(0, 0, 1000000, 1000000);

  ctx.fillStyle = 'black';
  for (var point of points) {
    ctx.fillRect(point.x, point.y, 10, 10);
  }

  ctx.strokeStyle = 'black';
  for (var polygon of polygons) {
    pps = polygon.points;
    ctx.beginPath();
    ctx.moveTo(pps[0].x, pps[0].y);
    ctx.lineTo(pps[1].x, pps[1].y);
    ctx.lineTo(pps[2].x, pps[2].y);
    ctx.lineTo(pps[0].x, pps[0].y);
    ctx.stroke();
  }
}

function sign(p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

function contains2(polygon, point) {
  var v1 = polygon.points[0], v2 = polygon.points[1], v3 = polygon.points[2];
  var b1, b2, b3;

  b1 = sign(point, v1, v2) < 0;
  b2 = sign(point, v2, v3) < 0;
  b3 = sign(point, v3, v1) < 0;

  return ((b1 == b2) && (b2 == b3));
}

function contains(polygon, point) {
  var a = polygon.points[0], b = polygon.points[1], c = polygon.points[2];
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

function adjacents(polygon) {
  var adjacents = new Set();
  for (var point of polygon.points) {
    for (var poly of point.polygons) {
      if (isAdjacent(polygon, poly)) {
        adjacents.add(poly);
      }
    }
  }
  return adjacents;
}

function isAdjacent(polygon1, polygon2) {
  var num = 0;
  for (var point of polygon1.points) {
    if (polygon2.points.indexOf(point) > -1) {
      num++;
    }
  }
  return num > 1;
}

requestAnimationFrame(animate);

/*
for (var point of points) {
  ctx.fillRect(point.x, point.y, 4, 4);
}
*/

