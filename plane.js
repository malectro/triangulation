import * as THREE from 'three';

const container = document.getElementById('container');

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.toneMapping = THREE.ACESFilmicToneMapping;

container.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 0, 5);

const box = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({color: 0xff00ff}),
);
scene.add(box);

const planeScene = new THREE.Scene();
planeScene.rotateX(-Math.PI / 4);
scene.add(planeScene);

const planeGeometry = new THREE.BufferGeometry();

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.MeshStandardMaterial({color: 0xffff00}),
);
planeScene.add(plane);

const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

renderer.render(scene, camera);
