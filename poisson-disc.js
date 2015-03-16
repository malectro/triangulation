// the setup
var currentImage = new Image();
currentImage.src = 'test.png';
currentImage.addEventListener('load', function () {
  currentImage.loaded = true;
  drawImg(currentImage);
});
var canvas1 = document.createElement('canvas');
canvas1.width = window.innerWidth;
canvas1.height = window.innerHeight;
canvas1.style.zIndex = 2;
document.body.appendChild(canvas1);
var ctx1 = canvas1.getContext('2d');

function drawImg(img) {
  ctx1.clearRect(0, 0, 10000000, 1000000);
  ctx1.drawImage(img, 0, 0, canvas1.width, canvas1.height);

  var imgData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);

  var ps;
  var poly;
  for (var i = 0; i < polygons.length; i++) {
    poly = polygons[i];
    ps = poly.points;
    poly.c = {
      x: (ps[0].x + ps[1].x + ps[2].x) / 3,
      y: (ps[0].y + ps[1].y + ps[2].y) / 3,
    };
    poly.color = colorForPoint(imgData.data, poly.c);
  }

  currentImage = img;

  requestAnimationFrame(drawAll);
}

function colorForPoint(imgData, p) {
  var index = Math.floor(p.x) * 4 + Math.floor(p.y) * canvas.width * 4;
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
canvas.style.zIndex = 3;
document.body.appendChild(canvas);

var ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';


// the algorithm
const PI2 = Math.PI * 2;
var RADIUS = 50;
var RADIUS2 = RADIUS * 2;
var CANDIDATES = 10;
const INTERVAL = 20;

var polygons = [];
var points = [];
var active = [];
var quadtree;

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
  var vx, vy;
  var i, j, k, poly, point, sibling;
  /*
  for (i = 0; i < points.length; i++) {
    point = points[i];

    vx = point.vx * 0.2;
    vy = point.vy * 0.2;

    if (vx + vy > 0) {
      for (j = 0; j < point.polygons.length; j++) {
        poly = point.polygons[j];
        for (k = 0; k < poly.points.length; k++) {
          sibling = poly.points[k];
          sibling.vx += vx;
          sibling.vy += vy;
        }
      }
    }
  }
  */

  for (i = 0; i < points.length; i++) {
    point = points[i];
    point.x += point.vx;
    point.y += point.vy;
    point.vx = point.vx * 0.5;
    point.vy = point.vy * 0.5;
  }

  ctx.clearRect(0, 0, 1000000, 1000000);

  ctx.strokeStyle = 'black';
  var polygon;
  for (i = 0; i < polygons.length; i++) {
    polygon = polygons[i];
    ctx.fillStyle = polygon.color + '';
    pps = polygon.points;
    ctx.beginPath();
    ctx.moveTo(pps[0].x, pps[0].y);
    ctx.lineTo(pps[1].x, pps[1].y);
    ctx.lineTo(pps[2].x, pps[2].y);
    ctx.lineTo(pps[0].x, pps[0].y);
    ctx.fill();
  }

  requestAnimationFrame(drawAll);
}

function run() {
  runButton.disabled = true;

  var begin = (new Date()) - 0;
  var poisson = new Worker('poisson-ptri.js');

  poisson.onmessage = function (event) {
    polygons = event.data[0];
    points = event.data[1];
    quadtree = event.data[2];
    if (currentImage.loaded) {
      drawImg(currentImage);
    }
    console.log('poisson polytri took ms', (new Date()) - begin);
    runButton.disabled = false;
  };

  poisson.postMessage([RADIUS, CANDIDATES, canvas.width, canvas.height]);

  /*
  var begin = (new Date()) - 0;
  var poisson = new Worker('poisson.js');

  poisson.onmessage = function (event) {
    points = event.data[0];
    quadtree = event.data[1];

    console.log('poisson took ms', (new Date()) - begin);
    begin = new Date() - 0;

    var worker = new Worker('ptri.js');
    worker.onmessage = function (event) {
      polygons = event.data[0];
      points = event.data[1];
      if (currentImage.loaded) {
        drawImg(currentImage);
      }
      console.log('polytri took ms', (new Date()) - begin);
      runButton.disabled = false;
    };

    worker.postMessage([points, {width: canvas.width, height: canvas.height}]);
  };

  poisson.postMessage([RADIUS, CANDIDATES, canvas.width, canvas.height]);
  */
}

var opacity;
canvas.addEventListener('mousedown', function () {
  opacity = canvas.style.opacity;
  canvas.style.opacity = 0;
});
canvas.addEventListener('mouseup', function () {
  canvas.style.opacity = opacity;
});

var input = document.getElementById('file');
var result;
input.addEventListener('change', function () {
  var img = new Image();

  img.addEventListener('load', function () {
    img.loaded = true;
    drawImg(img);
  });

  img.src = URL.createObjectURL(input.files[0]);
});

var radiusInput = document.getElementById('radius');
radiusInput.addEventListener('change', function () {
  RADIUS = parseInt(radiusInput.value, 10);
});

var candidatesInput = document.getElementById('candidates');
candidatesInput.addEventListener('change', function () {
  CANDIDATES = parseInt(candidatesInput.value, 10);
});

var opacityInput = document.getElementById('opacity');
opacityInput.addEventListener('change', function () {
  canvas.style.opacity = parseFloat(opacityInput.value, 10);
});
canvas.style.opacity = parseFloat(opacityInput.value, 10);

var runButton = document.getElementById('run');
runButton.addEventListener('click', run);

var controls = document.getElementById('controls');
document.getElementById('hide').addEventListener('click', function () {
  controls.className = 'hide';
});
document.getElementById('show').addEventListener('click', function () {
  controls.className = '';
});

canvas.addEventListener('mousemove', _.throttle(function (event) {
  /*
  var closest = quadtreeClosest(quadtree, event);

  closest.vx += event.movementX * 0.5;
  closest.vy += event.movementY * 0.5;
  console.log(closest);
  */

  var radius = 50;
  var points = quadtreeIsWithin(quadtree, event, radius);
  var magnitude;
  for (var i = 0; i < points.length; i++) {
    point = points[i];
    magnitude = (radius - point.d) / radius;
    point.vx = event.movementX * magnitude;
    point.vy = event.movementY * magnitude;
  }

}, 10));

run();

document.body.addEventListener('click', function (event) {
  var click = {x: event.offsetX, y: event.offsetY};

  var points = quadtreeIsWithin(quadtree, click, 100);
  console.log(points);
  /*
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
  */
});

