// Core Three.js Setup
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
renderer.toneMappingExposure = 0.4; // Reduced exposure (default was 1.0)
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById("threejs-container").appendChild(renderer.domElement);

const clock = new THREE.Clock();

const loader = new THREE.GLTFLoader();
const loadingContainer = document.getElementById("loading-container");
const threejsContainer = document.getElementById("threejs-container");

// Track loading status
let templeLoaded = false;
let birdsLoaded = false;

// Animation Mixer Variable
let mixer;

// Grass-related variables
// let grassStuff;
// const GRASS_COUNT = 5000; // Reduced count since we're placing selectively

// Grass Shader Material
// class GrassMaterial extends THREE.ShaderMaterial {
//   uniforms = {
//     fTime: { value: 0.0 },
//     vPlayerPosition: { value: new THREE.Vector3(0.0, -1.0, 0.0) },
//     fPlayerColliderRadius: { value: 1.1 },
//   };

//   vertexShader = `
//       uniform float fTime;
//       uniform vec3 vPlayerPosition;
//       uniform float fPlayerColliderRadius;
//       varying float fDistanceFromGround;
//       varying vec3 vInstanceColor;

//       float rand(float n){return fract(sin(n) * 43758.5453123);}
//       float rand(vec2 n) {
//           return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
//       }
//       float createNoise(vec2 n) {
//           vec2 d = vec2(0.0, 1.0);
//           vec2 b = floor(n);
//           vec2 f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
//           return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
//       }
//       vec3 localToWorld(vec3 target) {
//           return (modelMatrix * instanceMatrix * vec4(target, 1.0)).xyz;
//       }
//       void main() {
//           fDistanceFromGround = max(0.0, position.y);
//           vInstanceColor = instanceColor;
//           vec3 worldPosition = localToWorld(position);
//           float noise = createNoise(vec2(position.x, position.z)) * 0.6 + 0.4;
//           float distanceFromPlayer = length(vPlayerPosition - worldPosition);
//           vec3 sway = 0.3 * vec3(cos(fTime) * noise * fDistanceFromGround, 0.0, 0.0);
//           vec3 vNormal = normalize(vPlayerPosition - worldPosition);
//           vNormal.y = abs(vNormal.y);
//           float fOffset = fPlayerColliderRadius - distanceFromPlayer;
//           vec3 vPlayerOffset = -(vNormal * fOffset);
//           worldPosition += mix(
//               sway * min(1.0, distanceFromPlayer / 4.0),
//               vPlayerOffset,
//               float(distanceFromPlayer < fPlayerColliderRadius)
//           );
//           gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
//       }
//   `;

//   fragmentShader = `
//       varying float fDistanceFromGround;
//       varying vec3 vInstanceColor;
//       void main() {
//           vec3 colorDarkest = vec3(24.0/255.0, 30.0/255.0, 41.0/255.0);
//           vec3 colorBrightest = vec3(88.0/255.0, 176.0/255.0, 110.0/255.0);
//           vec3 color = mix(colorDarkest, colorBrightest, fDistanceFromGround / 2.0);
//           color = clamp(color, 0.0, 1.0);
//           gl_FragColor = vec4(color, 1.);
//       }
//   `;

//   constructor(props) {
//     super(props);
//   }
// }

// // Player (Pokeball) setup
// let player,
//   raycaster,
//   pointer = new THREE.Vector2(0.0, 0.0);

// Function to check if both models are loaded
function checkLoadingComplete() {
  if (templeLoaded && birdsLoaded) {
    loadingContainer.style.display = "none"; // Hide loading wheel
    threejsContainer.classList.add("loaded"); // Show Three.js container
  }
}

// Load Static Temple Model
let templeModel;
loader.load(
  "assets/3D Models/konark-sun-temple_static3.glb",
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

// Grass Patch Creation
// const createGrassPatch = async (position, rotation, scale) => {
//   if (!grassStuff) {
//     const gltf = await loader.loadAsync(
//       "//cdn.wtlstudio.com/sample.wtlstudio.com/a776537a-3038-4cd0-a90a-dab044a3f7ec.glb"
//     );

//     //scale to 0.1
//     gltf.scene.children[0].geometry.scale(0.2, 0.2, 0.2); // Scale geometry to 10% of original size

//     grassStuff = {
//       clock: new THREE.Clock(),
//       mesh: new THREE.InstancedMesh(
//         gltf.scene.children[0].geometry.clone(),
//         new GrassMaterial({ side: THREE.DoubleSide }),
//         GRASS_COUNT
//       ),
//       instances: [],
//       update: () => {
//         grassStuff.instances.forEach((grass, index) => {
//           grass.updateMatrix();
//           grassStuff.mesh.setMatrixAt(index, grass.matrix);
//         });
//         grassStuff.mesh.instanceMatrix.needsUpdate = true;
//         // grassStuff.mesh.computeBoundingSphere();
//         grassStuff.mesh.material.uniforms.fTime.value =
//           grassStuff.clock.getElapsedTime();
//         if (player) {
//           // Ensure player exists before updating position
//           grassStuff.mesh.material.uniforms.vPlayerPosition.value.copy(
//             player.position
//           );
//         }
//       },
//     };

//     scene.add(grassStuff.mesh);
//     grassStuff.mesh.position.y = 0; // Adjust based on temple ground level

//     const empty = new THREE.Object3D();
//     empty.scale.setScalar(0.0);
//     empty.updateMatrix();

//     for (let i = 0; i < grassStuff.mesh.count; i++) {
//       grassStuff.mesh.setMatrixAt(i, empty.matrix);
//       grassStuff.mesh.setColorAt(i, new THREE.Color(Math.random() * 0xffffff));
//     }

//     grassStuff.mesh.instanceColor.needsUpdate = true;
//     grassStuff.mesh.instanceMatrix.needsUpdate = true;
//     grassStuff.mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
//   }

//   const grass = new THREE.Object3D();
//   grass.position.copy(position);
//   grass.rotation.copy(rotation);
//   grass.scale.copy(scale);
//   grassStuff.instances.push(grass);

//   console.log("Grass patch created.");
//   console.log("Grass patches count:", grassStuff.instances.length);
//   console.log("Grass patches mesh count:", grassStuff.mesh.count);
//   console.log("Grass patches mesh instance count:", grassStuff.mesh.count);
//   console.log(
//     "Grass patches mesh instance matrix count:",
//     grassStuff.mesh.instanceMatrix.count
//   );
//   console.log(
//     "Grass patches mesh instance color count:",
//     grassStuff.mesh.instanceColor.count
//   );
//   console.log(
//     "Grass patches mesh instance matrix usage:",
//     grassStuff.mesh.instanceMatrix.usage
//   );
//   console.log(
//     "Grass patches mesh instance matrix needs update:",
//     grassStuff.mesh.instanceMatrix.needsUpdate
//   );
//   console.log(
//     "Grass patches mesh instance color needs update:",
//     grassStuff.mesh.instanceColor.needsUpdate
//   );
// };

// // Player Creation
// const createPlayer = () => {
//   player = new THREE.Group();
//   loader.load(
//     "//cdn.wtlstudio.com/sample.wtlstudio.com/1e6b7047-1626-4eb6-8344-ce513ec2769f.glb",
//     (gltf) => {
//       gltf.scene.scale.setScalar(0.25); // Scale inside the callback
//       player.add(gltf.scene);
//       player.position.set(5, 1, 5); // Initial position
//       scene.add(player); // Add to scene after loading
//       console.log("Player loaded and added to scene:", player);
//     },
//     (progress) => {
//       // console.log(`Loading player: ${((progress.loaded / progress.total) * 100).toFixed( 2 )}%` );
//     },
//     (error) => {
//       console.error("Player loading failed:", error);
//     }
//   );

//   raycaster = new THREE.Raycaster();
//   setInterval(() => {
//     if (!templeModel) return; // Wait for templeModel to load
//     raycaster.setFromCamera(pointer, camera);
//     const hits = raycaster.intersectObject(templeModel, true);
//     if (hits.length) {
//       const target = hits[0].point.clone();
//       target.y += 1.0;
//       player.position.lerp(target, 0.1);
//     }
//   }, 1000 / 60);
//   console.log("Player created.");
//   console.log("Player position:", player.position);
//   console.log("Player scale:", player.scale);
//   console.log("Player children count:", player.children.length);
//   console.log("Player children:", player.children);
// };

// // Add selective grass patches with clusters
// const addGrassPatches = async () => {
//   const positions = [
//     new THREE.Vector3(20, 0.2, 20),
//     new THREE.Vector3(25, 0.2, 20),
//     new THREE.Vector3(-20, 0.2, -20),
//   ]; // Central positions for grass clusters

//   const clusterRadius = 2; // Radius around each position for the cluster
//   const patchesPerCluster = 100; // Number of grass patches per cluster

//   for (let pos of positions) {
//     // Create a cluster of grass patches around the central position
//     for (let i = 0; i < patchesPerCluster; i++) {
//       // Generate random offset within the cluster radius
//       const offsetX = (Math.random() - 0.5) * clusterRadius * 2; // Random between -radius and +radius
//       const offsetZ = (Math.random() - 0.5) * clusterRadius * 2;

//       // New position for this grass patch
//       const grassPos = new THREE.Vector3(
//         pos.x + offsetX,
//         pos.y, // Keep y at 0 (ground level)
//         pos.z + offsetZ
//       );

//       // Create the grass patch with random rotation and uniform scale
//       await createGrassPatch(
//         grassPos,
//         new THREE.Euler(0, Math.random() * Math.PI * 2, 0), // Random rotation around Y-axis
//         new THREE.Vector3().setScalar(1) // Uniform scale of 1
//       );
//     }
//   }
//   console.log("Grass patch clusters added.");
// };

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
// directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 50;
// directionalLight.shadow.camera.left = -100;
// directionalLight.shadow.camera.right = 100;
// directionalLight.shadow.camera.top = 100;
// directionalLight.shadow.camera.bottom = -200;
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.position.set(-10, 10, -12);
// directionalLight.castShadow = true;
// directionalLight.shadow.mapSize.set(1024, 1024);
// directionalLight.shadow.camera.near = 0.1;
// directionalLight.shadow.camera.far = 50;
// directionalLight.shadow.camera.left = -20;
// directionalLight.shadow.camera.right = 20;
// directionalLight.shadow.camera.top = 20;
// directionalLight.shadow.camera.bottom = -20;
// directionalLight.shadow.bias = -0.0001;
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

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  // if (grassStuff) grassStuff.update();
  controls.update();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;
  renderer.render(scene, camera);
}

// Initialize everything
// createPlayer();
// addGrassPatches();
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

// // Mouse movement for player control
// window.addEventListener("pointermove", (event) => {
//   pointer.set(
//     (event.clientX / window.innerWidth) * 2 - 1,
//     -(event.clientY / window.innerHeight) * 2 + 1
//   );
// });
