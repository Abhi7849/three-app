import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─────────────────────────────────────────────────────────────────────────────
// Renderer
// ─────────────────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ─────────────────────────────────────────────────────────────────────────────
// Scene & camera
// ─────────────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.FogExp2(0x050510, 0.035);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 2, 7);

// ─────────────────────────────────────────────────────────────────────────────
// Orbit controls
// ─────────────────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 2;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI * 0.85;
controls.autoRotate = false;

// ─────────────────────────────────────────────────────────────────────────────
// Lights
// ─────────────────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x1a1a3a, 1.5));

const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(8, 12, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 60;
sun.shadow.camera.left = sun.shadow.camera.bottom = -12;
sun.shadow.camera.right = sun.shadow.camera.top = 12;
scene.add(sun);

const bluePoint = new THREE.PointLight(0x4488ff, 4, 18);
bluePoint.position.set(-5, 4, 3);
scene.add(bluePoint);

const pinkPoint = new THREE.PointLight(0xff44aa, 3, 14);
pinkPoint.position.set(5, 2, -3);
scene.add(pinkPoint);

// ─────────────────────────────────────────────────────────────────────────────
// Platform / ground
// ─────────────────────────────────────────────────────────────────────────────
const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(4, 4, 0.15, 64),
  new THREE.MeshStandardMaterial({ color: 0x111133, metalness: 0.8, roughness: 0.2 })
);
platform.position.y = -1.6;
platform.receiveShadow = true;
scene.add(platform);

// Grid on platform
const grid = new THREE.GridHelper(8, 24, 0x223366, 0x112244);
grid.position.y = -1.52;
scene.add(grid);

// ─────────────────────────────────────────────────────────────────────────────
// Central rotating cube
// ─────────────────────────────────────────────────────────────────────────────
const cubeMat = new THREE.MeshStandardMaterial({
  color: 0x44aaff,
  metalness: 0.5,
  roughness: 0.2,
  emissive: 0x112244,
  emissiveIntensity: 0.3,
});
const cube = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), cubeMat);
cube.castShadow = true;
cube.userData.id = 'main-cube';
scene.add(cube);

// Wireframe overlay on cube
const wireframe = new THREE.Mesh(
  new THREE.BoxGeometry(1.42, 1.42, 1.42),
  new THREE.MeshBasicMaterial({ color: 0x88ccff, wireframe: true, transparent: true, opacity: 0.25 })
);
cube.add(wireframe);

// ─────────────────────────────────────────────────────────────────────────────
// Orbiting satellite objects
// ─────────────────────────────────────────────────────────────────────────────
const satellites = [];
const satelliteConfigs = [
  { geo: new THREE.TetrahedronGeometry(0.35, 0), color: 0xff6644, r: 2.8, speed: 0.9, yOff: 0.4 },
  { geo: new THREE.OctahedronGeometry(0.3, 0),   color: 0x44ff88, r: 2.2, speed: -1.3, yOff: -0.3 },
  { geo: new THREE.IcosahedronGeometry(0.28, 0), color: 0xffcc44, r: 3.3, speed: 0.6, yOff: 0.6 },
  { geo: new THREE.TorusGeometry(0.22, 0.08, 8, 20), color: 0xcc44ff, r: 2.5, speed: -0.7, yOff: -0.5 },
];

satelliteConfigs.forEach(({ geo, color, r, speed, yOff }) => {
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.35, emissive: color, emissiveIntensity: 0.15 })
  );
  mesh.castShadow = true;
  mesh.userData = { r, speed, yOff, angle: Math.random() * Math.PI * 2 };
  scene.add(mesh);
  satellites.push(mesh);
});

// ─────────────────────────────────────────────────────────────────────────────
// Particle star-field
// ─────────────────────────────────────────────────────────────────────────────
const STAR_COUNT = 2500;
const starPositions = new Float32Array(STAR_COUNT * 3);
const starSizes = new Float32Array(STAR_COUNT);
for (let i = 0; i < STAR_COUNT; i++) {
  const r = 40 + Math.random() * 80;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  starPositions[i * 3 + 2] = r * Math.cos(phi);
  starSizes[i] = Math.random() * 2.5 + 0.5;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xffffff, sizeAttenuation: true, size: 0.12, transparent: true, opacity: 0.85 })
);
scene.add(stars);

// ─────────────────────────────────────────────────────────────────────────────
// Floating ring around cube
// ─────────────────────────────────────────────────────────────────────────────
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(2.0, 0.04, 6, 80),
  new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.4 })
);
ring.rotation.x = Math.PI / 2;
scene.add(ring);

// ─────────────────────────────────────────────────────────────────────────────
// HUD overlay
// ─────────────────────────────────────────────────────────────────────────────
const hud = document.createElement('div');
hud.id = 'hud';
hud.innerHTML = `
  <div class="hud-title">THREE.JS SCENE</div>
  <div class="hud-row"><span>DRAG</span><span>Orbit camera</span></div>
  <div class="hud-row"><span>SCROLL</span><span>Zoom</span></div>
  <div class="hud-row"><span>OBJECTS</span><span id="obj-count">—</span></div>
  <div class="hud-row"><span>FPS</span><span id="fps-count">—</span></div>
`;
document.body.appendChild(hud);

const style = document.createElement('style');
style.textContent = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#000; overflow:hidden; }
  canvas { display:block; }
  #hud {
    position:fixed; top:16px; left:16px;
    background:rgba(5,5,20,0.75);
    border:1px solid rgba(68,136,255,0.35);
    border-radius:8px;
    padding:12px 16px;
    font-family:'Courier New',monospace;
    font-size:11px;
    color:#88ccff;
    backdrop-filter:blur(6px);
    pointer-events:none;
    min-width:180px;
  }
  .hud-title {
    font-size:13px; font-weight:bold; color:#fff;
    letter-spacing:2px; margin-bottom:10px;
    border-bottom:1px solid rgba(68,136,255,0.3);
    padding-bottom:6px;
  }
  .hud-row {
    display:flex; justify-content:space-between;
    gap:16px; margin-top:5px; opacity:0.85;
  }
  .hud-row span:first-child { color:#4488ff; }
`;
document.head.appendChild(style);

// ─────────────────────────────────────────────────────────────────────────────
// FPS counter
// ─────────────────────────────────────────────────────────────────────────────
let frameCount = 0, lastFpsTime = performance.now(), fps = 0;
const fpsEl = document.getElementById('fps-count');
const objEl = document.getElementById('obj-count');
objEl.textContent = String(scene.children.length);

// ─────────────────────────────────────────────────────────────────────────────
// Resize
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────────────────────────────────────
// Animation loop
// ─────────────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Central cube
  cube.rotation.x = t * 0.4;
  cube.rotation.y = t * 0.65;
  cube.position.y = Math.sin(t * 0.8) * 0.15;

  // Ring pulse
  ring.rotation.z = t * 0.2;
  ring.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03);

  // Satellites orbit
  satellites.forEach((s) => {
    s.userData.angle += s.userData.speed * 0.01;
    const a = s.userData.angle;
    s.position.set(
      Math.cos(a) * s.userData.r,
      Math.sin(t * 0.5 + a) * 0.3 + s.userData.yOff,
      Math.sin(a) * s.userData.r
    );
    s.rotation.x = t * 1.2;
    s.rotation.y = t * 0.8;
  });

  // Light animation
  bluePoint.position.x = Math.sin(t * 0.6) * 6;
  bluePoint.position.z = Math.cos(t * 0.6) * 5;
  pinkPoint.position.x = Math.cos(t * 0.4) * 6;
  pinkPoint.position.z = Math.sin(t * 0.4) * 5;

  // Stars slow drift
  stars.rotation.y = t * 0.008;

  controls.update();

  // FPS
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsTime = now;
    if (fpsEl) fpsEl.textContent = String(fps);
  }

  renderer.render(scene, camera);
}

animate();
