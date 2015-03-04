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

    ctx.fillStyle = 'blue';
    //ctx.fillRect(Math.round(current.x), Math.round(current.y), 4, 4);

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
      if (candidate.x > canvas.width || canvas.y > canvas.height
          || candidate.x < 0 || candidate.y < 0) {
          good = false;
      } else {
        // TODO find a way to avoid brute forcing this
        var smallest
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
      ctx.fillStyle = 'red';
      //ctx.fillRect(Math.round(acceptable.x), Math.round(acceptable.y), 4, 4);
    } else {
      active.splice(randomIndex, 1);
      ctx.fillStyle = 'black';
      ctx.fillRect(Math.round(current.x), Math.round(current.y), 4, 4);
    }

    requestAnimationFrame(animate);
  } else {
    console.log('done');
  }

}

requestAnimationFrame(animate);

/*
for (var point of points) {
  ctx.fillRect(point.x, point.y, 4, 4);
}
*/

