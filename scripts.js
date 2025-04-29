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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById("threejs-container").appendChild(renderer.domElement);

const clock = new THREE.Clock();

// Initialize GLTFLoader and DracoLoader
const loader = new THREE.GLTFLoader();
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
);
dracoLoader.setDecoderConfig({ type: "js" }); // Use JavaScript decoder
loader.setDRACOLoader(dracoLoader);

const loadingContainer = document.getElementById("loading-container");
const threejsContainer = document.getElementById("threejs-container");

// Track loading status
let templeLoaded = false;
let birdsLoaded = false;

// Animation Mixer Variable
let mixer;

// Function to check if both models are loaded
function checkLoadingComplete() {
  if (templeLoaded && birdsLoaded) {
    loadingContainer.style.display = "none";
    threejsContainer.classList.add("loaded");
  }
}

// Load Static Temple Model
let templeModel;
loader.load(
  "assets/3D Models/konark_optimised_13mb.glb",
  (gltf) => {
    templeModel = gltf.scene;
    scene.add(templeModel);

    const box = new THREE.Box3().setFromObject(templeModel);
    const center = box.getCenter(new THREE.Vector3());
    templeModel.position.sub(center);
    templeModel.scale.set(1, 1, 1);
    templeModel.position.set(0, 0, 0);

    templeModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.envMap = scene.environment;
        child.material.envMapIntensity = 1.0;
        child.material.needsUpdate = true;
      }
    });

    templeLoaded = true;
    checkLoadingComplete();
  },
  (progress) => {
    // console.log(
    //   `Loading temple: ${((progress.loaded / progress.total) * 100).toFixed(
    //     2
    //   )}%`
    // );
  },
  (error) => {
    console.error("Temple loading failed:", error);
  }
);

// Load Animated Birds Model
let birdsModel;
loader.load(
  "assets/3D Models/konark-sun-temple_animated1.glb",
  (gltf) => {
    birdsModel = gltf.scene;
    scene.add(birdsModel);
    birdsModel.position.set(0, 1, 0);

    birdsModel.traverse((child) => {
      if (child.isMesh) {
        child.frustumCulled = false;
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.envMap = scene.environment;
        child.material.envMapIntensity = 1.0;
        child.material.needsUpdate = true;
      }
    });

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

    birdsLoaded = true;
    checkLoadingComplete();
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
  }
);

// HDRI Environment Setup
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.setDataType(THREE.FloatType);
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/syferfontein_1d_clear_puresky_2k.hdr",
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

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 10, 12);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.position.set(-10, 10, -12);
scene.add(directionalLight2);

// Add linear fog
scene.fog = new THREE.Fog(0x625653, 50, 110);

// Orbit Controls Configuration
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 50;
controls.minPolarAngle = Math.PI / 12;
controls.maxPolarAngle = Math.PI / 2 - Math.PI / 12;

// hotspot annotation

const hotspots = [
  {
    name: "Front Gate",
    position: new THREE.Vector3(4, 6, 9), // Adjust based on model
    info: {
      title: "Front Gate",
      content:
        "The main entrance of the Konark Sun Temple, intricately carved with motifs of lions, elephants, and floral patterns. It leads to the main sanctum.",
    },
  },
  {
    name: "Back Gate",
    position: new THREE.Vector3(-4, 13, -9), // Adjust based on model
    info: {
      title: "Back Gate",
      content:
        "The rear entrance, less ornate but still significant, providing access to the temple's rear sections and surrounding structures.",
    },
  },
];

function createHotspot(position, name) {
  // Create a sprite for the hotspot
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "white";

  context.font = "40px Arial";
  context.textAlign = "center";
  context.fillText(name, 128, 80);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(2, 1, 1);
  sprite.userData = { name };
  scene.add(sprite);
  return sprite;
}

const hotspotSprites = hotspots.map((hotspot) =>
  createHotspot(hotspot.position, hotspot.name)
);

// Raycaster for hotspot interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  controls.update();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;
  renderer.render(scene, camera);
}

function onMouseClick(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hotspotSprites);

  if (intersects.length > 0) {
    const hotspot = intersects[0].object;
    const hotspotData = hotspots.find((h) => h.name === hotspot.userData.name);
    if (hotspotData) {
      showInfoPanel(hotspotData.info);
    }
  }
}

window.addEventListener("click", onMouseClick);

// Info Panel Functions
function showInfoPanel(info) {
  const infoPanel = document.getElementById("info-panel");
  document.getElementById("info-title").textContent = info.title;
  document.getElementById("info-content").textContent = info.content;
  infoPanel.style.display = "block";
}

function closeInfoPanel() {
  document.getElementById("info-panel").style.display = "none";
}

//  event listener to close button
document
  .querySelector("#info-panel .close-btn")
  .addEventListener("click", closeInfoPanel);

// Initialize everything
animate();

// Window Resize Handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Camera View Transition Function
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

// Button Event Listeners
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
