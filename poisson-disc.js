// the setup
var img = new Image();
img.src = 'test.png';
img.addEventListener('load', function () {
  img.loaded = true;
  drawImg(img);
});
var canvas1 = document.createElement('canvas');
canvas1.width = window.innerWidth;
canvas1.height = window.innerHeight;
document.body.appendChild(canvas1);
var ctx1 = canvas1.getContext('2d');

function drawImg(img) {
  ctx1.clearRect(0, 0, 10000000, 1000000);
  ctx1.drawImage(img, 0, 0, canvas1.width, canvas1.height);

  var imgData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);

  var ps;
  for (var poly of polygons) {
    ps = poly.points;
    poly.c = {
      x: (ps[0].x + ps[1].x + ps[2].x) / 3,
      y: (ps[0].y + ps[1].y + ps[2].y) / 3,
    };
    poly.color = colorForPoint(imgData.data, poly.c);
  }

  requestAnimationFrame(drawAll);
}

function colorForPoint(imgData, p) {
  var index = Math.round(p.x) * 4 + Math.round(p.y) * canvas.width * 4;
  return {
    r: imgData[index],
    g: imgData[index + 1],
    b: imgData[index + 2],
    toString: colorToString,
  };
}

var canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.background = '#eee';
canvas.style.zIndex = 2;
document.body.appendChild(canvas);

var ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';


// the algorithm
const PI2 = Math.PI * 2;
const RADIUS = 20;
const RADIUS2 = RADIUS * 2;
const CANDIDATES = 10;
const INTERVAL = 20;

var polygons = [];
var points = [];
var active = [];
var quadtree = quadtreeNew(0, 0, canvas.width, canvas.height);

// create one random point
var point = {
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
};
points.push(point);
active.push(point);
quadtreeAdd(quadtree, point);

var start = (new Date()) - 0;

function poisson() {

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
      if (candidate.x > canvas.width || candidate.y > canvas.height
          || candidate.x < 0 || candidate.y < 0) {
          good = false;
      } else {
        /*
        for (var p of points) {
          var dist = distance(p, candidate);
          if (dist < RADIUS) {
            good = false;
            break;
          }
        }
        */

        /*
        var closest = quadtreeClosest(quadtree, candidate);
        good = distance(closest, candidate) > RADIUS;
        */

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

const QT_NW = 0;
const QT_NE = 1;
const QT_SW = 2;
const QT_SE = 3;

function quadtreeNew(x, y, width, height) {
  return {
    x: x,
    y: y,
    width: width,
    height: height,
    halfW: width / 2,
    halfH: height / 2,
    regions: [],
    point: null,
    depth: 0,
    count: 0,
  };
}

function quadtreeAddLoop(qt, point) {
  var region;

  while (qt) {
    if (!qt.point) {
      qt.point = point;
      qt = null;

    } else {
      region = quadtreeRegion(qt, point);

      if (!qt.regions[region]) {
        qt.regions[region] = quadtreeNew((region % 2) * qt.halfW + qt.x, Math.floor(region / 2) * qt.halfH + qt.y, qt.halfW, qt.halfH);
      }

      qt = qt.regions[region];
    }
  }
}

function quadtreeAdd(qt, point) {
  qt.count++;

  if (!qt.point) {
    qt.point = point;

  } else {
    var region = quadtreeRegion(qt, point);

    if (!qt.regions[region]) {
      qt.regions[region] = quadtreeNew((region % 2) * qt.halfW + qt.x, Math.floor(region / 2) * qt.halfH + qt.y, qt.halfW, qt.halfH);
    }

    qt.depth = quadtreeAdd(qt.regions[region], point) + 1;
  }

  return qt.depth;
}

function quadtreeRegion(qt, point) {
  var region;
  var x = point.x - qt.x;
  var y = point.y - qt.y;
  if (x < qt.halfW) {
    if (y < qt.halfH) {
      region = QT_NW;
    } else {
      region = QT_SW;
    }
  } else {
    if (y < qt.halfH) {
      region = QT_NE;
    } else {
      region = QT_SE;
    }
  }
  return region;
}

function quadtreeClosest(qt, point) {
  return quadtreeClosestRecurse(qt, point, {d: qt.width + qt.width, p: null}).p;
}

function quadtreeClosestRecurse(qt, point, best) {
  if (point.x < qt.x - best.d || point.y < qt.y - best.d
      || point.x > qt.x + qt.width + best.d || point.y > qt.y + qt.height + best.d) {
      return best;
  }

  if (qt.point) {
    var dist = distance(point, qt.point);

    if (dist < best.d) {
      best = {
        d: dist,
        p: qt.point,
      };
    }
  }

  for (var child of qt.regions) {
    if (child) {
      best = quadtreeClosestRecurse(child, point, best);
    }
  }

  return best;
}

function quadtreeFits(qt, point) {
  if (point.x < qt.x - RADIUS || point.y < qt.y - RADIUS
      || point.x > qt.x + qt.width + RADIUS || point.y > qt.y + qt.height + RADIUS) {
      return true;
  }

  if (qt.point) {
    var dist = distance(point, qt.point);

    if (dist < RADIUS) {
      return false;
    }
  }

  for (var child of qt.regions) {
    if (child) {
      if (!quadtreeFits(child, point)) {
        return false;
      }
    }
  }

  return true;
}

function quadtreeClosestRecurse(qt, point, best) {
  if (point.x < qt.x - best.d || point.y < qt.y - best.d
      || point.x > qt.x + qt.width + best.d || point.y > qt.y + qt.height + best.d) {
      return best;
  }

  if (qt.point) {
    var dist = distance(point, qt.point);

    if (dist < best.d) {
      best = {
        d: dist,
        p: qt.point,
      };
    }
  }

  for (var child of qt.regions) {
    if (child) {
      best = quadtreeClosestRecurse(child, point, best);
    }
  }

  return best;
}

function ptri() {
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
    polygons.push({points: tri.getPoints(), color: randomColor()});
  }
}

function getColor() {
  for (var poly of polygons) {

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


  var index, container, cp, ca, newPolygons, idx;

  for (var point of points) {
    // find out if it's in a polygon
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
      cp = container.points;
      ca = container.adjacents;
      newPolygons = [
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

      newPolygons[0].adjacents[0] = newPolygons[2];
      newPolygons[0].adjacents[2] = newPolygons[1];
      newPolygons[1].adjacents[0] = newPolygons[2];
      newPolygons[1].adjacents[1] = newPolygons[0];
      newPolygons[2].adjacents[1] = newPolygons[0];
      newPolygons[2].adjacents[2] = newPolygons[1];

      if (ca[1]) {
        idx = ca[1].adjacents.indexOf(container);
        ca[1].adjacents[idx] = newPolygons[0];
        maybeFlip(ca[1], newPolygons[0]);
      }
      if (ca[2]) {
        idx = ca[2].adjacents.indexOf(container);
        ca[2].adjacents[idx] = newPolygons[1];
        maybeFlip(ca[2], newPolygons[1]);
      }
      if (ca[0]) {
        idx = ca[0].adjacents.indexOf(container);
        ca[0].adjac.adjacentsents[idx] = newPolygons[2];
        maybeFlip(ca[0], newPolygons[2]);
      }

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

function randomColor(variation, base) {
  variation = variation || 10;
  base = base || {r: 120, g: 120, b: 120};
  var half = variation / 2;
  var color = {
    r: Math.round(Math.random() * variation - half + base.r),
    g: Math.round(Math.random() * variation - half + base.g),
    b: Math.round(Math.random() * variation - half + base.b),
    toString: colorToString,
  };
  return color;
}

function colorToString() {
  return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
}

function drawAll() {
  ctx.clearRect(0, 0, 1000000, 1000000);

  ctx.strokeStyle = 'black';
  for (var polygon of polygons) {
    ctx.fillStyle = polygon.color;
    pps = polygon.points;
    ctx.beginPath();
    ctx.moveTo(pps[0].x, pps[0].y);
    ctx.lineTo(pps[1].x, pps[1].y);
    ctx.lineTo(pps[2].x, pps[2].y);
    ctx.lineTo(pps[0].x, pps[0].y);
    ctx.fill();
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

// i should be doing this by angles, but i'm lazy
function maybeFlip(polygon1, polygon2) {
  var opposeIdx1 = polygon1.adjacents.indexOf(polygon2);
  var opposeIdx2 = polygon2.adjacents.indexOf(polygon1);
  var op1 = polygon1.points[opposeIdx1];
  var op2 = polygon2.points[opposeIdx2];
  var e1 = polygon1.points[(opposeIdx1 + 1) % 3];
  var e2 = polygon1.points[(opposeIdx1 + 2) % 3];

  var flip = distance(e1, e2) > distance(op1, op2);

  if (flip) {
    var tradeIdx = (opposeIdx1 + 1) % 3;
    polygon1.points[tradeIdx] = op2;
    polygon1.adjacents[opposeIdx1] = polygon2.adjacents[(opposeIdx2 + 2) % 3];
    polygon1.adjacents[(opposeIdx1 + 2) % 3] = polygon2;

    var tradeIdx = (opposeIdx2 + 1) % 3;
    polygon2.points[tradeIdx] = op1;
    polygon2.adjacents[opposeIdx2] = polygon1.adjacents[(opposeIdx1 + 2) % 3];
    polygon2.adjacents[(opposeIdx2 + 2) % 3] = polygon1;
  }

  return flip;
}

function distance(p1, p2) {
  if (!p1 || !p2) {
    debugger;
  }
  var dx = p1.x - p2.x;
  var dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

var begin = (new Date()) - 0;
poisson();
console.log('poisson took ms', (new Date()) - begin);
begin = new Date() - 0;

var worker = new Worker('ptri.js');
worker.onmessage = function (event) {
  polygons = event.data;
  if (img.loaded) {
    drawImg(img);
  }
  console.log('polytri took ms', (new Date()) - begin);
};
worker.postMessage([points, {width: canvas.width, height: canvas.height}]);
//ptri();
//requestAnimationFrame(drawAll);

canvas.addEventListener('mousedown', function () {
  canvas.style.zIndex = '';
});
canvas.addEventListener('mouseup', function () {
  canvas.style.zIndex = 2;
});

var input = document.getElementById('file');
var result;
input.addEventListener('change', function () {
  var img = new Image();

  img.addEventListener('load', function () {
    drawImg(img);
  });

  img.src = URL.createObjectURL(input.files[0]);
});

/*
document.body.addEventListener('click', function (event) {
  var click = {x: event.offsetX, y: event.offsetY};

  var start = new Date() - 0;

  var bp = null;
  var bd = Infinity;
  var dist;
  for (var p of points) {
    dist = distance(p, click);
    if (dist < bd) {
      dist = bd;
      bp = p;
    }
  }

  console.log('brute force found point in ms', new Date() - start);
  start = new Date() - 0;

  quadtreeClosest(quadtree, click);
  console.log('quadtree found point in ms', new Date() - start);
});
*/
