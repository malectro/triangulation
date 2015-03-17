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

  //requestAnimationFrame(drawAll);
  initWebGl();
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

  for (i = 0; i < points.length; i++) {
    point = points[i];
    point.x += point.vx;
    point.y += point.vy;
    point.vx = point.vx * 0.5;
    point.vy = point.vy * 0.5;
  }
  */

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

var scene;
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.zIndex = 3;
document.body.appendChild(renderer.domElement);

canvas.style.display = 'none';
canvas = renderer.domElement;

var webGlPoints = [];
var plane;
var animStart;

function initWebGl() {
  var point, poly, idx;
  for (var i = 0; i < points.length; i++) {
    point = points[i];
    for (var j = 0; j < point.polygons.length; j++) {
      poly = point.polygons[j];
      if (!poly.pointIndices) {
        poly.pointIndices = [];
      }
      idx = poly.points.indexOf(point);
      poly.pointIndices[idx] = i;
    }
  }

  var idx;
  for (i = 0; i < polygons.length; i++) {
    poly = polygons[i];
    for (j = 0; j < poly.points.length; j++) {
      if (!_.isNumber(poly.pointIndices[j])) {
        idx = points.indexOf(poly.points[j]);
        debugger;
      }
    }
  }

  var normal, color;
  var planeGeometry = new THREE.Geometry();
  for (i = 0; i < points.length; i++) {
    point = points[i];
    planeGeometry.vertices.push(new THREE.Vector3(point.x, -point.y, 0));
  }
  for (i = 0; i < polygons.length; i++) {
    poly = polygons[i];
    color = new THREE.Color(poly.color + '');
    normal = new THREE.Vector3(0, 0, 1);
    planeGeometry.faces.push(new THREE.Face3(poly.pointIndices[0], poly.pointIndices[1], poly.pointIndices[2], normal, color, 0));
  }

  var material = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, vertexColors: THREE.FaceColors});
  var materials = new THREE.MeshFaceMaterial([material]);
  plane = new THREE.Mesh(planeGeometry, materials);

  scene = new THREE.Scene();
  scene.position.y += canvas.height / 2;
  scene.position.x -= canvas.width / 2;
  scene.add(plane);

  camera.position.z = 500;

  /*
var geometry = new THREE.BoxGeometry( 1, 1, 1 );
			var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
			var cube = new THREE.Mesh( geometry, material );
			scene.add( cube );
      */


  animStart = new Date() - 0;
  requestAnimationFrame(drawWebGl);
}

var ripples = [];
function drawWebGl() {
  requestAnimationFrame(drawWebGl);

  var time = new Date() - animStart;

  var frequency = 2 * 1000;
  var secondsPerCycle = 2000;
  var radiansPerCycle = (time / secondsPerCycle) * Math.PI * 2;
  var radiansPerDistance;
  var ripple, vertex, distance;

  for (var i = 0; i < ripples.length; i++) {
    ripple = ripples[i];
    ripple.radius = ripple.speed * time;

    for (var j = 0; j < plane.geometry.vertices.length; j++) {
      vertex = plane.geometry.vertices[j];
      distance = vertex.distanceTo(ripple.center);
      if (distance < ripple.radius) {
        radiansPerDistance = (time - vertex.distanceTo(ripple.center) / ripple.speed) / secondsPerCycle;
        vertex.z = Math.sin(radiansPerDistance * Math.PI * 2) * 10 * ripple.magnitude;
      }
    }

    ripple.magnitude *= ripple.decay;
  }
  plane.geometry.verticesNeedUpdate = true;
  ripples = _.filter(ripples, function (ripple) {
    return ripple.magnitude > 0.01;
  });

  renderer.render(scene, camera);
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

/*
canvas.addEventListener('mousemove', _.throttle(function (event) {
  //var closest = quadtreeClosest(quadtree, event);
  var closest = bruteClosest(points, event);

  closest.vx += event.movementX * 0.5;
  closest.vy += event.movementY * 0.5;

  var radius = 50;
  //var points = quadtreeIsWithin(quadtree, event, radius);
  var closest = bruteWithin(points, event, radius);
  var magnitude;
  for (var i = 0; i < closest.length; i++) {
    point = closest[i];
    magnitude = (radius - point.d) / radius;
    point.vx = event.movementX * magnitude;
    point.vy = event.movementY * magnitude;
  }

}, 10));
*/

run();

document.body.addEventListener('click', function (event) {
  var click = {x: event.offsetX, y: event.offsetY};

  ripples.push({
    center: new THREE.Vector3(click.x, -click.y, 0),
    magnitude: 1,
    decay: 0.999,
    speed: 0.1,
    radius: 0,
  });

  /*
  //var points = quadtreeIsWithin(quadtree, click, 100);
  var closest = bruteWithin(points, click, 100);
  console.log(closest);
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

