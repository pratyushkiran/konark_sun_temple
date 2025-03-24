// Core Three.js Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);
camera.position.set(15, 15, 30); // Initial camera position

const renderer = new THREE.WebGLRenderer({
  antialias: true, // Smooth edges
  physicallyCorrectLights: true, // Accurate lighting calculations
});
renderer.setSize(window.innerWidth, window.innerHeight); // Set renderer size to window
renderer.shadowMap.enabled = true; // Enable shadow mapping
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadow type
renderer.outputEncoding = THREE.sRGBEncoding; // Color encoding for realism
document.getElementById("threejs-container").appendChild(renderer.domElement); // Attach renderer to DOM

// Draco Loader Configuration
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.134/examples/js/libs/draco/" // Path to Draco decoder
);

// GLTF Loader Configuration
const loader = new THREE.GLTFLoader();
loader.setDRACOLoader(dracoLoader); // Enable Draco compression
const loadingIndicator = document.getElementById("loading"); // Loading UI element
loadingIndicator.style.display = "block"; // Show loading indicator

// Model Loading
loader.load(
  "assets/3D Models/konark_texture_reprojected_8k_8.glb", // Model file path
  (gltf) => {
    const model = gltf.scene;
    scene.add(model); // Add model to scene

    // Center and scale model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center); // Center model at origin
    const maxDim = Math.max(size.x, size.y, size.z); // Calculate maximum dimension
    model.scale.set(1, 1, 1); // Uniform scaling
    model.position.set(0, -1, 0); // Slight downward adjustment

    // Configure mesh properties for shadows and environment mapping
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true; // Enable shadow casting
        child.receiveShadow = true; // Enable shadow receiving
        child.material.envMap = scene.environment; // Apply environment map
        child.material.envMapIntensity = 1.0; // Environment map intensity
        child.material.needsUpdate = true; // Update material
      }
    });

    loadingIndicator.style.display = "none"; // Hide loading indicator on success
  },
  (progress) => {
    // Log loading progress
    console.log(
      `Loading model: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`
    );
  },
  (error) => {
    // Handle loading errors
    console.error("Model loading failed:", error);
    loadingIndicator.textContent = "Error loading model"; // Update UI with error
  }
);

// HDRI Environment Setup
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.setDataType(THREE.FloatType); // High precision texture data
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr", // HDRI file path
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping; // Map texture as environment
    scene.environment = texture; // Set as scene environment
    scene.background = texture; // Set as scene background
  },
  undefined,
  (error) => {
    console.error("HDRI loading failed:", error); // Log HDRI loading errors
  }
);

// Debug Helpers (Uncomment to use)
// const axesHelper = new THREE.AxesHelper(100); // Axes visualization
// scene.add(axesHelper);
// const gridHelper = new THREE.GridHelper(100, 100); // Grid visualization (100x100 units, 10 divisions)
// scene.add(gridHelper);

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Main directional light
directionalLight.position.set(5, 10, -6); // Light position
directionalLight.castShadow = true; // Enable shadows
directionalLight.shadow.mapSize.set(1024, 1024); // Shadow map resolution
directionalLight.shadow.camera.near = 0.1; // Shadow camera near plane
directionalLight.shadow.camera.far = 50; // Shadow camera far plane
directionalLight.shadow.camera.left = -20; // Shadow camera bounds
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
directionalLight.shadow.bias = -0.0001; // Reduce shadow artifacts
scene.add(directionalLight);

// Orbit Controls Configuration
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement
controls.dampingFactor = 0.05; // Damping intensity
controls.minDistance = 20; // Minimum zoom distance
controls.maxDistance = 50; // Maximum zoom distance
controls.minPolarAngle = Math.PI / 12; // Limit vertical rotation (min)
controls.maxPolarAngle = Math.PI / 2 - Math.PI / 12; // Limit vertical rotation (max)

// Animation Loop
function animate() {
  requestAnimationFrame(animate); // Recursive animation frame request
  controls.update(); // Update orbit controls
  controls.autoRotate = true; // Enable auto-rotation
  controls.autoRotateSpeed = 0.1; // Rotation speed
  renderer.render(scene, camera); // Render the scene
}
animate(); // Start animation loop

// Window Resize Handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight; // Update aspect ratio
  camera.updateProjectionMatrix(); // Apply updated projection
  renderer.setSize(window.innerWidth, window.innerHeight); // Resize renderer
});

// Camera View Transition Function
function setCameraView(position, target) {
  gsap.to(camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration: 1.5, // Animation duration
    ease: "power2.inOut", // Smooth easing
    onUpdate: () => {
      camera.lookAt(target); // Keep camera focused on target
      controls.target.copy(target); // Update control target
      controls.update(); // Apply control updates
    },
  });
  controls.autoRotate = false; // Disable auto-rotation during transition
}

// Button Event Listeners for Camera Views
const maxDim = 14; // Model's maximum dimension for positioning
document.getElementById("wheelView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 0.5, maxDim * 1.2), // Closer to wheel details
    new THREE.Vector3(0, 0, 0) // Target center
  );
});

document.getElementById("topView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 4, 0), // Directly above
    new THREE.Vector3(0, 0, 0) // Target center
  );
});

document.getElementById("frontView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 0.8, maxDim * 2), // Front-facing view
    new THREE.Vector3(0, 0, 0) // Target center
  );
});

document.getElementById("sideView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(maxDim * 2, maxDim * 0.8, 0), // Side-facing view
    new THREE.Vector3(0, 0, 0) // Target center
  );
});
