import * as THREE from 'three';

import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {SSAOShader} from 'three/examples/jsm/shaders/SSAOShader.js';
import {SSAOPass} from 'three/examples/jsm/postprocessing/SSAOPass.js';

import {RippleShader, RippleMaterial} from './ripple.shader.js';

const document = window.document;

let currentImage = new Image();
currentImage.src = new URL('hubble.jpg', import.meta.url);
currentImage.addEventListener('load', function() {
  currentImage.loaded = true;
  drawImg(currentImage);
});

let canvas1 = document.createElement('canvas');
canvas1.width = window.innerWidth * window.devicePixelRatio;
canvas1.height = window.innerHeight * window.devicePixelRatio;
canvas1.style.width = window.innerWidth + 'px';
canvas1.style.height = window.innerHeight + 'px';
canvas1.style.zIndex = 2;
document.body.appendChild(canvas1);
let ctx1 = canvas1.getContext('2d');

const defaultColor = makeColor(200, 200, 200);

function drawImg(img) {
  console.log('drawing img');
  ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
  ctx1.drawImage(img, 0, 0, canvas1.width, canvas1.height);

  let imgData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);

  let ps;
  let poly;
  for (let i = 0; i < polygons.length; i++) {
    poly = polygons[i];
    ps = poly.points;
    poly.c = {
      x: (points[ps[0]].x + points[ps[1]].x + points[ps[2]].x) / 3,
      y: (points[ps[0]].y + points[ps[1]].y + points[ps[2]].y) / 3,
    };
    poly.color = colorForPoint(imgData.data, poly.c);
    //poly.color = defaultColor;
  }

  currentImage = img;

  //requestAnimationFrame(drawAll);
  initWebGl();
}

function makeColor(r, g, b) {
  return {
    r,
    g,
    b,
    toString: colorToString,
    toHexNumber: colorToHexNumber,
  };
}

function colorForPoint(imgData, p) {
  let index = Math.floor(p.x) * 4 + Math.floor(p.y) * canvas.width * 4;
  return {
    r: imgData[index],
    g: imgData[index + 1],
    b: imgData[index + 2],
    toString: colorToString,
    toHexNumber: colorToHexNumber,
  };
}

let canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.background = '#eee';
canvas.style.zIndex = 3;
document.body.appendChild(canvas);

let ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';

// the algorithm
const PI2 = Math.PI * 2;
let RADIUS = 10;
let RADIUS2 = RADIUS * 2;
let CANDIDATES = 10;
const INTERVAL = 20;

let polygons = [];
let points = [];
let active = [];
let quadtree;

let useSsao = false;
let showMesh = false;

function randomColor(variation, base) {
  variation = variation || 10;
  base = base || {r: 120, g: 120, b: 120};
  let half = variation / 2;
  let color = {
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

function colorToHexNumber() {
  return this.r * 65536 + this.g * 256 + this.b;
}

function drawAll() {
  let vx, vy;
  let i, j, k, poly, point, sibling;
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
  let polygon;
  for (let i = 0; i < polygons.length; i++) {
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

let scene;
const fov = 45;
const zPos =
  (window.innerHeight * window.devicePixelRatio) /
  (Math.sin(((fov / 2) * Math.PI) / 180) * 2);
//const zPos = 400;
const camera = new THREE.PerspectiveCamera(
  fov,
  window.innerWidth / window.innerHeight,
  1,
  zPos + 200,
);
camera.position.z = zPos * 0.9;
//camera.position.z = 10;

/*
window.innerHeight / 2 = Math.sin(fov / 2) * z;
z = (window.innerHeight / 2) / Math.sin(fov / 2);
*/

const renderer = new THREE.WebGLRenderer();

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.zIndex = 3;

document.body.appendChild(renderer.domElement);

canvas.style.display = 'none';
canvas = renderer.domElement;

let webGlPoints = [];
let plane;

let depthMaterial;
let depthRenderTarget;
let effectComposer;
let material;

function initWebGl() {
  console.log('initing webgl', points.length);
  if (!points.length) {
    return;
  }

  let point, poly, idx;
  /*
  for (let i = 0; i < points.length; i++) {
    point = points[i];
    for (let j = 0; j < point.polygons.length; j++) {
      poly = point.polygons[j];
      if (!poly.pointIndices) {
        poly.pointIndices = [];
      }
      idx = poly.points.indexOf(point);
      poly.pointIndices[idx] = i;
    }
  }
  */

  let planeGeometry = new THREE.BufferGeometry();

  let normal, color;
  let vertices = [];
  let normals = [];
  for (let i = 0; i < points.length; i++) {
    point = points[i];
    //vertices.push(pointx, -point.y, 0);
    //normals.push(0, 0, 1);
    //planeGeometry.vertices.push(new THREE.Vector3(point.x, -point.y, 0));
  }
  let colors = [];
  let faces = [];
  const halfHeight = canvas.height / 2;
  const halfWidth = canvas.width / 2;
  let least = [0, 0];
  let most = [0, 0];
  for (let i = 0; i < polygons.length; i++) {
    poly = polygons[i];
    for (let j = 0; j < 3; j++) {
      const point = points[poly.points[j]];
      /*
      vertices.push(
        point.x - halfWidth, point.y - halfHeight, 0,
      );
      */
      vertices.push(point.x - halfWidth, point.y - halfHeight, 0);
      least[0] = Math.min(point.x - halfWidth, least[0]);
      least[1] = Math.min(point.y - halfHeight, least[1]);
      most[0] = Math.max(point.x - halfWidth, most[0]);
      most[1] = Math.max(point.y - halfHeight, most[1]);
    }

    //const color = [poly.color.r / 255, poly.color.g / 255, poly.color.b / 255];
    const color = [0.8, 0.8, 0.8];
    colors.push(...color, ...color, ...color);

    normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
  }
  console.log('hi', most, least);

  console.log('colors', colors);

  planeGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  planeGeometry.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(normals, 3),
  );
  planeGeometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3),
  );

  //planeGeometry = new THREE.PlaneGeometry(200, 200, 100, 100);
  //planeGeometry.computeBoundingSphere();
  //planeGeometry.computeFaceNormals();

  //let material = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, vertexColors: THREE.FaceColors});
  /*
  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
  });
  */

  /*
  material = new THREE.ShaderMaterial({
    defines: {
      STANDARD: '',
      USE_COLOR: '',
    },
    uniforms: RippleShader.uniforms,
    //uniforms: THREE.ShaderLib.standard.uniforms,
    //vertexShader: THREE.RippleShader.vertex,
    vertexShader: RippleShader.vertex,
    //fragmentShader: THREE.RippleShader.fragment,
    fragmentShader: THREE.ShaderLib['standard'].fragmentShader,
    lights: true,
    fog: false,
  });
*/
  /*
  material = new RippleMaterial({
    color: 0xff00ff,
    lights: true,
    fog: false,
    uniforms: {
      color: {value: new THREE.Color(0xff00ff)},
      diffuse: {value: new THREE.Color(0xff00ff)},
    },
  });
*/

  material = new THREE.MeshStandardMaterial({
    //vertexColors: true,
    color: 0x00ff00,
  });

  plane = new THREE.Mesh(planeGeometry, material);

  console.log('position', plane.position);
  console.log('camera', camera.position);

  //material.uniforms.diffuse.value.set(0x6666dd);
  //material.color = new THREE.Color(0x6666dd);

  const planeScene = new THREE.Scene();
  /*
  planeScene.position.y -= canvas.height / 2;
  planeScene.position.x -= canvas.width / 2;
  */
  //planeScene.rotateX(-Math.PI / 4);
  planeScene.add(plane);

  const planeScene2 = new THREE.Scene();
  //planeScene2.rotateX(-Math.PI / 4);
  //planeScene2.position.y += 250;
  planeScene2.add(planeScene);

  scene = new THREE.Scene();

  //scene.rotateY(-4 * Math.PI / 4);

  let light = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(light);

  let directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  /*
  let pointLight = new THREE.PointLight(0xffffff, 0.5, 0);
  pointLight.position.set(50, 50, 600);
  scene.add(pointLight);
  */

  scene.add(planeScene2);

  /*
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(100, 100, 100),
    new THREE.MeshStandardMaterial({color: 0xff0000}),
  );
  scene.add(cube);
  */

  initPostprocessing();

  requestAnimationFrame(drawWebGl);
}

function initPostprocessing() {
  const renderPass = new RenderPass(scene, camera);

  console.log('main scene', scene);

  depthMaterial = new THREE.MeshDepthMaterial();
  depthMaterial.depthPacking = THREE.RGBADepthPacking;
  depthMaterial.blending = THREE.NoBlending;

  depthRenderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    },
  );

  /*
  const ssaoPass = new ShaderPass(SSAOShader);
  ssaoPass.renderToScreen = true;

  const uniforms = ssaoPass.uniforms;
  uniforms['tDepth'].value = depthRenderTarget.texture;
  uniforms['size'].value.set(window.innerWidth, window.innerHeight);
  uniforms['cameraNear'].value = camera.near;
  uniforms['cameraFar'].value = camera.far;
  uniforms['onlyAO'].value = false; // not sure what this means
  uniforms['aoClamp'].value = 0.3;
  uniforms['lumInfluence'].value = 0.5;
  */
  const ssaoPass = new SSAOPass(
    scene,
    camera,
    window.innerWidth,
    window.innerHeight,
  );

  effectComposer = new EffectComposer(renderer);
  effectComposer.setSize(window.innerWidth, window.innerHeight);
  effectComposer.addPass(renderPass);
  //effectComposer.addPass(ssaoPass);
}

function initPostprocessing2() {
  // depth
  let depthShader = THREE.ShaderLib['distanceRGBA'];
  //depthShader = THREE.ShaderLib['depth'];
  const depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);

  depthMaterial = new THREE.ShaderMaterial({
    fragmentShader: depthShader.fragmentShader,
    vertexShader: depthShader.vertexShader,
    uniforms: depthUniforms,
  });
  depthMaterial.blending = THREE.NoBlending;

  // postprocessing
  effectComposer = new THREE.EffectComposer(renderer);
  effectComposer.addPass(new THREE.RenderPass(scene, camera));

  depthRenderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
    },
  );

  const effect = new THREE.ShaderPass(THREE.SSAOShader);
  effect.uniforms['tDepth'].value = depthRenderTarget;
  effect.uniforms['size'].value.set(window.innerWidth, window.innerHeight);
  effect.uniforms['cameraNear'].value = camera.near;
  effect.uniforms['cameraFar'].value = camera.far;
  effect.renderToScreen = true;

  effectComposer.addPass(effect);
}

const defaultRipple = {
  center: new THREE.Vector3(0, 0, 0),
  magnitude: 0,
  decay: 0.999,
  speed: 0.1,
  radius: 0,
  start: 0,
};
const MAX_RIPPLES = 30;
let rippleLength = 0;
const ripples = [];
for (let i = 0; i < MAX_RIPPLES; i++) {
  ripples[i] = Object.assign({}, defaultRipple);
}

let currentTime = 0;
function drawWebGl(time) {
  requestAnimationFrame(drawWebGl);

  currentTime = time;

  const {uniforms} = material;

  /*
  uniforms.time.value = currentTime;
  uniforms.ripples.value = ripples;
  uniforms.rippleLength.value = rippleLength;
  uniforms.emissive.value.set(
    1, 0, 1
  );
*/
  if (!window.asdf) {
    console.log('uniforms', uniforms);
    window.asdf = true;
  }

  let frequency = 2 * 1000;
  let secondsPerCycle = 2000;
  let radiansPerCycle = (time / secondsPerCycle) * Math.PI * 2;
  let radiansPerDistance;
  let ripple, vertex, distance, rippleTime;

  /*
  for (let vertex of plane.geometry.vertices) {
    vertex.z = 0;
  }
  */

  for (let i = 0; i < rippleLength; ) {
    const ripple = ripples[i];
    const {magnitude} = ripple;

    if (magnitude > 0 && magnitude < 0.01) {
      ripples.splice(i, 1);
      ripples.push(ripple);
      rippleLength--;
    } else {
      const {start, speed, decay} = ripple;
      const rippleTime = time - start;

      ripple.radius = speed * rippleTime;
      ripple.magnitude *= decay;

      /*
      if (showMesh) {
        for (let j = 0; j < plane.geometry.vertices.length; j++) {
          vertex = plane.geometry.vertices[j];
          distance = vertex.distanceTo(ripple.center);
          if (distance < ripple.radius) {
            radiansPerDistance =
              (rippleTime - distance / ripple.speed) / secondsPerCycle;
            vertex.z +=
              Math.cos(radiansPerDistance * Math.PI * 2) *
              10 *
              ripple.magnitude;
          }
        }
      }
      */

      i++;
    }
  }

  /*
  plane.geometry.verticesNeedUpdate = true;
  plane.geometry.normalsNeedUpdate = true;
  plane.geometry.computeFaceNormals();
  */

  if (useSsao) {
    scene.overrideMaterial = depthMaterial;
    renderer.render(scene, camera, depthRenderTarget, true);

    scene.overrideMaterial = null;
    effectComposer.render();
  } else {
    renderer.render(scene, camera);
  }
}

function run() {
  runButton.disabled = true;

  let begin = new Date() - 0;
  let poisson = new Worker(new URL('poisson-ptri.js', import.meta.url), {
    type: 'module',
  });

  poisson.onmessage = function(event) {
    polygons = event.data[0];
    points = event.data[1];
    quadtree = event.data[2];
    if (currentImage.loaded) {
      drawImg(currentImage);
    }
    console.log('poisson polytri took ms', new Date() - begin);
    runButton.disabled = false;
  };

  poisson.postMessage([RADIUS, CANDIDATES, canvas.width, canvas.height]);

  /*
  let begin = (new Date()) - 0;
  let poisson = new Worker('poisson.js');

  poisson.onmessage = function (event) {
    points = event.data[0];
    quadtree = event.data[1];

    console.log('poisson took ms', (new Date()) - begin);
    begin = new Date() - 0;

    let worker = new Worker('ptri.js');
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

let opacity;
/*
canvas.addEventListener('mousedown', function () {
  opacity = canvas.style.opacity;
  canvas.style.opacity = 0;
});
canvas.addEventListener('mouseup', function () {
  canvas.style.opacity = opacity;
});
*/

let input = document.getElementById('file');
let result;
input.addEventListener('change', function() {
  let img = new Image();

  img.addEventListener('load', function() {
    img.loaded = true;
    drawImg(img);
  });

  img.src = URL.createObjectURL(input.files[0]);
});

let radiusInput = document.getElementById('radius');
radiusInput.addEventListener('change', function() {
  RADIUS = parseInt(radiusInput.value, 10);
});
RADIUS = parseInt(radiusInput.value, 10);

let candidatesInput = document.getElementById('candidates');
candidatesInput.addEventListener('change', function() {
  CANDIDATES = parseInt(candidatesInput.value, 10);
});
CANDIDATES = parseInt(candidatesInput.value, 10);

let opacityInput = document.getElementById('opacity');
opacityInput.addEventListener('change', function() {
  canvas.style.opacity = parseFloat(opacityInput.value, 10);
});
canvas.style.opacity = parseFloat(opacityInput.value, 10);

const meshInput = document.getElementById('mesh');
meshInput.addEventListener('change', function() {
  showMesh = meshInput.checked;
});
showMesh = meshInput.checked;

const ssaoInput = document.getElementById('ssao');
ssaoInput.addEventListener('change', () => {
  useSsao = ssaoInput.checked;
});
useSsao = ssaoInput.checked;

let runButton = document.getElementById('run');
runButton.addEventListener('click', run);

let controls = document.getElementById('controls');
document.getElementById('hide').addEventListener('click', function() {
  controls.className = 'hide';
});
document.getElementById('show').addEventListener('click', function() {
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

const FACTOR = 0.005;
window.addEventListener('wheel', event => {
  console.log('event', event);
  if (event.shiftKey) {
    camera.position.z += event.deltaY * 0.1;
  } else {
    scene.rotateY(event.deltaX * FACTOR);
    scene.rotateX(event.deltaY * FACTOR);
  }
});

run();

const pointersDown = new Set();
async function handleCanvasTap(event) {
  event.preventDefault();

  const click = {
    x: event.pageX * window.devicePixelRatio,
    y: event.pageY * window.devicePixelRatio,
    /*
    x: event.pageX,
    y: event.pageY,
*/
  };

  let nextRipple;
  if (rippleLength < MAX_RIPPLES) {
    nextRipple = ripples[rippleLength];
    rippleLength++;
  } else {
    nextRipple = ripples.reduce((acc, ripple) => {
      return acc.magnitude < ripple.magnitude ? acc : ripple;
    }, ripples[0]);
  }

  Object.assign(nextRipple, {
    center: new THREE.Vector3(
      click.x - canvas.width / 2,
      canvas.height / 2 - click.y,
      0,
    ),
    magnitude: 1,
    start: currentTime,
    // might not need rest
    decay: 0.998,
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
}

async function playRandomSample() {
  let rand = Math.floor(Math.random() * audio.bufferArray.length);

  await audio.ctx.resume();
  const sampler = audio.ctx.createBufferSource();
  sampler.buffer = audio.bufferArray[rand];
  sampler.connect(audio.master);

  sampler.start(audio.ctx.currentTime);
}

const handleCanvasDown = (event) => {
  pointersDown.add(event.pointerId);
  handleCanvasTap(event);
  playRandomSample();
};

const handleCanvasMove = (event) => {
  if (pointersDown.has(event.pointerId)) {
    handleCanvasTap(event);
  }
};

const handleCanvasUp = (event) => {
  console.log('up');
  pointersDown.delete(event.pointerId);
};

canvas.addEventListener('pointerdown', handleCanvasDown);
canvas.addEventListener('pointermove', throttle(handleCanvasMove, 100));
canvas.addEventListener('pointerup', handleCanvasUp);
canvas.addEventListener('pointerleave', handleCanvasUp);
canvas.addEventListener('pointerout', handleCanvasUp);
canvas.addEventListener('pointerleave', handleCanvasUp);

// audio
let audio;

(function() {
  let AudioContext = window.AudioContext || window.webkitAudioContext;
  let ctx = new AudioContext();

  let masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(1.0, ctx.currentTime);
  masterGain.connect(ctx.destination);

  let master = ctx.createDynamicsCompressor();
  master.connect(masterGain);

  let srces = [
    'pianos/b.wav',
    'pianos/c-sharp.wav',
    'pianos/e.wav',
    'pianos/f-sharp.wav',
    'pianos/g-sharp.wav',
  ];
  let buffers = {};
  let bufferArray = [];
  let count = srces.length;
  let loaded = false;

  for (const src of srces) {
    let request = new XMLHttpRequest();
    request.open('GET', src, true);
    request.responseType = 'arraybuffer';

    buffers[src] = null;

    // Decode asynchronously
    request.onload = function() {
      ctx.decodeAudioData(
        request.response,
        function(buffer) {
          buffers[src] = buffer;
          count--;
          console.log('Loaded ' + src);

          if (count < 1) {
            bufferArray = audio.bufferArray = Object.values(buffers);
            loaded = true;
            console.log('Loaded all audio');
          }
        },
        function() {},
      );
    };

    request.send();
  }

  audio = {
    ctx: ctx,
    masterGain: masterGain,
    master: master,
    bufferArray: bufferArray,
    buffers: buffers,
  };
})();

function throttle(fn, interval) {
  let timeoutId;

  return (...args) => {
    if (timeoutId) {
      return;
    }

    fn(...args);

    timeoutId = setTimeout(() => {
      timeoutId = null;
    }, interval);
  };
}
