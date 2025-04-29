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

scene.fog = new THREE.Fog(0x625653, 50, 110); // Add linear fog

//#endregion

//#region Renderer & Animation
const clock = new THREE.Clock();
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  physicallyCorrectLights: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();

  if (mixer) 
    mixer.update(delta);

  controls.update();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;
  renderer.render(scene, camera);
});
document.getElementById("threejs-container").appendChild(renderer.domElement);
//#endregion

//#region Orbit controls & Resize
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
//#endregion