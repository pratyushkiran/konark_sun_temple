import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(15, 15, 30);

//#region Loaders & Models
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
);
dracoLoader.setDecoderConfig({ type: "js" }); // Use JavaScript decoder
loader.setDRACOLoader(dracoLoader);

const loadingContainer = document.getElementById("loading-container");
const threejsContainer = document.getElementById("threejs-container");

const models = [];
let mixer; // for birds animation

// Temple Model
loader.load(
  "assets/3D Models/konark_optimised_13mb.glb",
  (gltf) => {
    let templeModel = gltf.scene;
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

    models.push({
      name: "Temple",
      model: templeModel,
      isLoaded: true,
    });

    checkLoadingComplete();
  },
  undefined,
  (error) => {
    console.error("Temple loading failed:", error);
  }
);

// Bird
loader.load(
  "assets/3D Models/konark-sun-temple_animated1.glb",
  (gltf) => {
    let birdsModel = gltf.scene;
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

    models.push({ 
      name: "Bird", 
      model: birdsModel, 
      isLoaded: true 
    });

  },
  undefined,
  (error) => {
    console.error("Birds loading failed:", error);
  }
);

// Function to check if models are loaded or not
function checkLoadingComplete() {
  let isEverythingLoaded = true;

  models.forEach(model => {
    if(!model.isLoaded)
      isEverythingLoaded = false;
  })

  if (isEverythingLoaded && models.length == 2) {
    loadingContainer.style.display = "none";
    threejsContainer.classList.add("loaded");
  }
}

//#endregion

//#region HDRI, Lighting & Fog Setup
const rgbeLoader = new RGBELoader();
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

const ambientLight = new THREE.AmbientLight(0xffffff, 2);
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

//#endregion

//#region hotspot annotation
const hotspots = [
  {
    name: "Front Gate",
    position: new THREE.Vector3(5, 6, 9), // Adjust based on model
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
  {
    name: "Wheel",
    position: new THREE.Vector3(-12, 2, 8), // Adjust based on model
    info: {
      title: "Wheel",
      content:
        "The wheels of the Konark Sun Temple, also called chakras, are not only symbolic but also function as sandhyals. There are 24 intricately carved stone wheels which represent the hours of the day. These wheels can be used to tell time by observing the shadows cast by the spokes of the wheel as the sun moves across the sky.",
    },
  },
];

function createHotspot(position, name) {
  // Create a sprite for the hotspot
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  // Draw rounded rectangle
  const cornerRadius = 25;
  context.beginPath();
  context.moveTo(cornerRadius, 0);
  context.lineTo(canvas.width - cornerRadius, 0);
  context.arcTo(canvas.width, 0, canvas.width, cornerRadius, cornerRadius);
  context.lineTo(canvas.width, canvas.height - cornerRadius);
  context.arcTo(
    canvas.width,
    canvas.height,
    canvas.width - cornerRadius,
    canvas.height,
    cornerRadius
  );
  context.lineTo(cornerRadius, canvas.height);
  context.arcTo(
    0,
    canvas.height,
    0,
    canvas.height - cornerRadius,
    cornerRadius
  );
  context.lineTo(0, cornerRadius);
  context.arcTo(0, 0, cornerRadius, 0, cornerRadius);
  context.closePath();
  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.fill();

  // Draw bold text
  context.textAlign = "center";

  context.fillStyle = "white";
  context.font = "bold 45px Calibri";
  context.fillText(name, 128, 80);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(4, 2, 1);
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

  if (info.title === "Front Gate") {
    setCameraView(new THREE.Vector3(2, 15, 26), new THREE.Vector3(0, 0, 0));
  }
  if (info.title === "Back Gate") {
    setCameraView(new THREE.Vector3(-8, 20, -26), new THREE.Vector3(0, 0, 0));
  }
  if (info.title === "Wheel") {
    setCameraView(new THREE.Vector3(-10, 0, 12), new THREE.Vector3(0, 0, 0));
  }
}

function closeInfoPanel() {
  document.getElementById("info-panel").style.display = "none";
}

//  event listener to close button
document
  .querySelector("#info-panel .close-btn")
  .addEventListener("click", closeInfoPanel);
//#endregion

//#region Render & Animation
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  physicallyCorrectLights: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.4; // Reduced exposure (default was 1.0)
renderer.outputEncoding = THREE.sRGBEncoding;
document.querySelector("#threejs-container").append(renderer.domElement)

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();

  if (mixer) 
    mixer.update(delta);

  controls.update();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;
  renderer.render(scene, camera);
})
//#endregion

//#region Orbit Controls & Resize Handler
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 50;
controls.minPolarAngle = Math.PI / 12;
controls.maxPolarAngle = Math.PI / 2 - Math.PI / 12;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
//#endregion

//#region Button Events & Camera View Transition Function
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

const maxDim = 14;
// document.getElementById("wheelView").addEventListener("click", () => {
//   setCameraView(new THREE.Vector3(-7, 5, 7), new THREE.Vector3(0, 0, 0));
// });

document.getElementById("topView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 4, 0),
    new THREE.Vector3(0, 0, 0)
  );
});

document.getElementById("frontView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(0, maxDim * 0.8, maxDim * 3),
    new THREE.Vector3(0, 0, 0)
  );
});

document.getElementById("sideView").addEventListener("click", () => {
  setCameraView(
    new THREE.Vector3(maxDim * 2, maxDim * 0.8, 0),
    new THREE.Vector3(0, 0, 0)
  );
});
//#endregion