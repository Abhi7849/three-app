import * as THREE from 'three';

// ── Scene ────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

// ── Camera ───────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 4);

// ── Renderer ─────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ── Lights ───────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

const pointLight = new THREE.PointLight(0x4488ff, 2, 20);
pointLight.position.set(-3, 3, 3);
scene.add(pointLight);

// ── Rotating Cube ────────────────────────────────────────────────────────────
const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const material = new THREE.MeshStandardMaterial({
  color: 0x44aaff,
  metalness: 0.4,
  roughness: 0.3,
});
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.userData.name = 'main-cube';   // used by Playwright test
scene.add(cube);

// ── Grid helper ──────────────────────────────────────────────────────────────
const grid = new THREE.GridHelper(10, 20, 0x333366, 0x222244);
grid.position.y = -2;
scene.add(grid);

// ── Scroll-to-zoom ───────────────────────────────────────────────────────────
window.addEventListener('wheel', (e) => {
  camera.position.z = Math.max(1.5, Math.min(10, camera.position.z + e.deltaY * 0.005));
});

// ── Resize handler ───────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Animation loop ───────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  cube.rotation.x = t * 0.5;
  cube.rotation.y = t * 0.8;
  renderer.render(scene, camera);
}

animate();
