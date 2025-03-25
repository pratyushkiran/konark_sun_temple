// Core Three.js Setup (unchanged)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(15, 15, 30);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  physicallyCorrectLights: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById("threejs-container").appendChild(renderer.domElement);

const clock = new THREE.Clock();

// Draco Loader Configuration (unchanged)
// const dracoLoader = new THREE.DRACOLoader();
// dracoLoader.setDecoderPath(
//   "https://cdn.jsdelivr.net/npm/three@0.134/examples/js/libs/draco/"
// );

// GLTF Loader Configuration (unchanged)
const loader = new THREE.GLTFLoader();
// loader.setDRACOLoader(dracoLoader);
const loadingIndicator = document.getElementById("loading");
loadingIndicator.style.display = "block";

// Animation Mixer Variable
let mixer; // For bird animations

// Load Static Temple Model
let templeModel;
loader.load(
  "assets/3D Models/konark-sun-temple_static.glb",
  (gltf) => {
    templeModel = gltf.scene;
    scene.add(templeModel);

    // Center and scale temple
    const box = new THREE.Box3().setFromObject(templeModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    templeModel.position.sub(center);
    templeModel.scale.set(1, 1, 1);
    templeModel.position.set(0, 0, 0);

    // Configure mesh properties
    templeModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.envMap = scene.environment;
        child.material.envMapIntensity = 1.0;
        child.material.needsUpdate = true;
      }
    });
  },
  (progress) => {
    console.log(
      `Loading temple: ${((progress.loaded / progress.total) * 100).toFixed(
        2
      )}%`
    );
  },
  (error) => {
    console.error("Temple loading failed:", error);
    loadingIndicator.textContent = "Error loading temple";
  }
);

// Load Animated Birds Model
let birdsModel;
loader.load(
  "assets/3D Models/konark-sun-temple_animated1.glb",
  (gltf) => {
    birdsModel = gltf.scene;
    scene.add(birdsModel);
    // Position birds relative to temple (adjust as needed)
    birdsModel.position.set(0, 1, 0); // Example: birds slightly above temple

    // Configure mesh properties
    birdsModel.traverse((child) => {
      if (child.isMesh) {
        child.frustumCulled = false; // Disable culling for testing
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.envMap = scene.environment;
        child.material.envMapIntensity = 1.0;
        child.material.needsUpdate = true;
      }
    });

    // Set up Animation Mixer and Play Animations
    mixer = new THREE.AnimationMixer(birdsModel);
    const animations = gltf.animations;
    if (animations && animations.length > 0) {
      animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
      });
    } else {
      console.log("No animations found in birds_animated.glb.");
    }

    loadingIndicator.style.display = "none"; // Hide when both models are loaded
  },
  (progress) => {
    console.log(
      `Loading birds Model: ${(
        (progress.loaded / progress.total) *
        100
      ).toFixed(2)}%`
    );
  },
  (error) => {
    console.error("Birds loading failed:", error);
    loadingIndicator.textContent = "Error loading birds";
  }
);

// HDRI Environment Setup (unchanged)
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.setDataType(THREE.FloatType);
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/belfast_sunset_puresky_1k.hdr",
  // "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
  },
  undefined,
  (error) => {
    console.error("HDRI loading failed:", error);
  }
);

// Lighting Setup (unchanged)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, -6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);

// Add linear fog (unchanged)
scene.fog = new THREE.Fog(0x78778a, 40, 110);

// Orbit Controls Configuration (unchanged)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 50;
controls.minPolarAngle = Math.PI / 12;
controls.maxPolarAngle = Math.PI / 2 - Math.PI / 12;

// Animation Loop (unchanged)
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  controls.update();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;
  renderer.render(scene, camera);
}
animate();

// Window Resize Handler (unchanged)
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Camera View Transition Function (unchanged)
function setCameraView(position, target) {
  gsap.to(camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration: 1.5,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.lookAt(target);
      controls.target.copy(target);
      controls.update();
    },
  });
  controls.autoRotate = false;
}

// Button Event Listeners (unchanged)
const maxDim = 14;
document.getElementById("wheelView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 0.5, maxDim * 1.2),
    new THREE.Vector3(0, 0, 0)
  );
});

document.getElementById("topView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 4, 0),
    new THREE.Vector3(0, 0, 0)
  );
});

document.getElementById("frontView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 0.8, maxDim * 2),
    new THREE.Vector3(0, 0, 0)
  );
});

document.getElementById("sideView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(maxDim * 2, maxDim * 0.8, 0),
    new THREE.Vector3(0, 0, 0)
  );
});
