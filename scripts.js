// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  physicallyCorrectLights: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better color handling for HDRI
renderer.toneMappingExposure = 0.5;
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById("threejs-container").appendChild(renderer.domElement);

// Draco Loader Setup
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.134/examples/js/libs/draco/"
);
dracoLoader.setDecoderConfig({ type: "js" });

// GLTF Loader with Draco
const loader = new THREE.GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load(
  "assets/3D Models/konark_optimised_13mb.glb",
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    model.scale.set(3, 3, 3);
    model.position.set(0, 0, 0);
    model.rotation.set(0, Math.PI - Math.PI / 6, 0);

    // Enable shadows and set environment map for all meshes
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.envMap = scene.environment; // Apply HDRI as environment map
        child.material.envMapIntensity = 1.0; // Adjust reflection intensity
        child.material.needsUpdate = true;
      }
    });

    camera.position.set(0, maxDim, maxDim * 1.5);
    camera.lookAt(0, 0, 0);
  },
  (progress) => {
    console.log(
      `Loading: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`
    );
  },
  (error) => {
    console.error("Error loading model:", error);
  }
);

let maxDim = 14; // Make maxDim globally accessible

// HDRI Loading
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.setDataType(THREE.FloatType); // Better precision for HDRI
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/kloofendal_48d_partly_cloudy_puresky_4k.hdr", // Free 2K HDRI example
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture; // Sets environment map for all materials
    scene.background = texture; // Sets HDRI as background (optional)
    // texture.dispose(); // Uncomment if you don't want to keep the texture in memory after assignment
  },
  undefined,
  (error) => {
    console.error("Error loading HDRI:", error);
  }
);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, -7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);

// Orbit Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 70;
controls.maxDistance = 130;
controls.enablePan = true;
controls.minPolarAngle = Math.PI / 12;
controls.maxPolarAngle = Math.PI / 2 - Math.PI / 12;

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize Handler
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// Add camera view functions
function setCameraView(position, target) {
  camera.position.copy(position);
  camera.lookAt(target);
  controls.target.copy(target);
  controls.update();
  controls.autoRotate = false; // Stop auto-rotation when manually changing view
}

// Button event listeners
document.getElementById("wheelView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 0.5, maxDim * 1.5), // Position
    new THREE.Vector3(0, 0, 0) // Target
  );
  controls.autoRotate = false;
  console.log("Wheel View Selected");
});

document.getElementById("topView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 8, -maxDim * 12), // Position (directly above)
    new THREE.Vector3(0, 0, 0) // Target
  );
  console.log("Top View Selected");
  controls.autoRotate = false;
});

document.getElementById("frontView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 8, -maxDim * 12), // Position
    new THREE.Vector3(0, 0, 0) // Target
  );
});

document.getElementById("sideView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(maxDim * 12, maxDim * 8, 0), // Position
    new THREE.Vector3(0, 0, 0) // Target
  );
});
