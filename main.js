import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

let scene, camera, renderer;
let mapControls, transformControls;
let objects = [];

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Lighting: Directional light at top right (white)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5); // Top right
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Ambient light (white)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 5);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Controls
    initMapControls();

    // // Transform Controls
    // initTransformControls();

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Render main menu in #categories
    renderMainMenu();

    // const corePoints = gltf.scene.userData.snapPoints;
}

function renderMainMenu() {
    const categoriesDiv = document.getElementById('categories');
    if (categoriesDiv) {
        categoriesDiv.innerHTML = `
          <img src="/icons/flexible-conveyor-icon.jpg" alt="Flexible Conveyor" class="category-icon" id="flexible-conveyor-icon">
          <p>Flexible Conveyor</p>
        `;
        // Attach event listener for flexible conveyor icon
        const flexibleConveyorBtn = document.getElementById('flexible-conveyor-icon');
        if (flexibleConveyorBtn) {
            flexibleConveyorBtn.addEventListener('click', flexibleConveyorMenu);
        }
    }
}

function loadSmebDriveUnit() {
    const loader = new STLLoader();
    loader.load(
        'parts/smeb-driveunit.STL',
        function (geometry) {
            const material = new THREE.MeshStandardMaterial({ color: 0x175b74 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            normalizeModel(mesh);
            scene.add(mesh);
            objects.push(mesh);
            // Add and attach transform controls to the newly loaded mesh
            if (transformControls && !scene.children.includes(transformControls)) {
                scene.add(transformControls);
            }
            if (transformControls) {
                transformControls.attach(mesh);
            }
            // Example snap points (update with real values)
            const moduleSnapPoints = [
                new THREE.Vector3(320.3, 10, 0),
                new THREE.Vector3(320.3, -5, 8.66),
                new THREE.Vector3(320.3, -5, -8.66)
            ];
            mesh.userData.snapPoints = moduleSnapPoints;
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );
}

function loadSmej315IdlerUnit() {
    const loader = new STLLoader();
    loader.load(
        'parts/smej_315_idlerunit.STL',
        function (geometry) {
            const material = new THREE.MeshStandardMaterial({ color: 0x175b74 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            normalizeModel(mesh);
            scene.add(mesh);
            objects.push(mesh);
            // Add and attach transform controls to the newly loaded mesh
            if (transformControls && !scene.children.includes(transformControls)) {
                scene.add(transformControls);
            }
            if (transformControls) {
                transformControls.attach(mesh);
            }
            // Example: mesh.userData.snapPoints = [...] if needed
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );
}

function normalizeModel(model) {
    const bbox = new THREE.Box3().setFromObject(model);
    const cent = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z);
    model.scale.multiplyScalar(1.0 / maxAxis);
    bbox.setFromObject(model);
    bbox.getCenter(cent);
    bbox.getSize(size);
    model.position.copy(cent).multiplyScalar(-1);
    model.position.y -= (size.y * 0.5);
    // Rotate 90 degrees upwards (around X axis)
    model.rotation.x = Math.PI / 2;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (mapControls) mapControls.update();
    renderer.render(scene, camera);
}

function initMapControls() {
    mapControls = new MapControls(camera, renderer.domElement);
    mapControls.enableDamping = true;
    mapControls.dampingFactor = 0.05;
    mapControls.screenSpacePanning = false;
    mapControls.minDistance = 1;
    mapControls.maxDistance = 100;
    mapControls.maxPolarAngle = Math.PI / 2;
}

function initTransformControls() {
    transformControls = new TransformControls(camera, renderer.domElement);
    // Only add to scene when an object is loaded
    // Enable/disable orbit controls when transforming
    transformControls.addEventListener('mouseDown', function () {
        orbitControls.enabled = false;
    });
    transformControls.addEventListener('mouseUp', function () {
        orbitControls.enabled = true;
    });
}

function flexibleConveyorMenu() {
    // Replace #categories content with the provided HTML
    const categoriesDiv = document.getElementById('categories');
    if (categoriesDiv) {
        categoriesDiv.innerHTML = `
          <div class="categories">
            <div class="category-container" id="smeb-drive-unit">
              <img src="/icons/conveyor-guides-icon.jpg" alt="SMEB Drive Unit" class="category-icon">
              <p>SMEB Drive Unit</p>
            </div>
            <div class="category-container" id="smej-315-idler-unit">
              <img src="/icons/wl-series-icon.jpg" alt="SMEJ 315 Idler Unit" class="category-icon">
              <p>SMEJ 315 Idler Unit</p>
            </div>
          </div>
          <button class="back-button" id="back-to-main-menu">Back</button>
        `;
        // Re-attach event listeners for new buttons
        const driveUnitBtn = document.getElementById('smeb-drive-unit');
        if (driveUnitBtn) {
            driveUnitBtn.addEventListener('click', loadSmebDriveUnit);
        }
        const idlerUnitBtn = document.getElementById('smej-315-idler-unit');
        if (idlerUnitBtn) {
            idlerUnitBtn.addEventListener('click', loadSmej315IdlerUnit);
        }
        // Add back button functionality
        const backBtn = document.getElementById('back-to-main-menu');
        if (backBtn) {
            backBtn.addEventListener('click', mainMenu);
        }
    }
}

function mainMenu() {
    const categoriesDiv = document.getElementById('categories');
    if (categoriesDiv) {
        categoriesDiv.innerHTML = `
        <div class="category-container" id="flexible-conveyor">
            <img src="/icons/flexible-conveyor-icon.jpg" alt="Flexible Conveyor" class="category-icon" id="flexible-conveyor-icon">
            <p>Flexible Conveyor</p>
        </div>
        `;
        // Re-attach event listener for flexible conveyor icon
        const flexibleConveyorBtn = document.getElementById('flexible-conveyor-icon');
        if (flexibleConveyorBtn) {
            flexibleConveyorBtn.addEventListener('click', flexibleConveyorMenu);
        }
    }
}

// Snap module to core using snap hooks algorithm
// corePoints: [THREE.Vector3, THREE.Vector3, THREE.Vector3] (clockwise)
// modulePoints: [THREE.Vector3, THREE.Vector3, THREE.Vector3] (clockwise)
// moduleObject: THREE.Object3D to transform
function snapModuleToCore(corePoints, modulePoints, moduleObject) {
    // 1. Calculate planes and normals
    const coreNormal = getTriangleNormal(corePoints);
    const moduleNormal = getTriangleNormal(modulePoints);

    // 2. Align planes: rotate module so its normal opposes core's normal
    // Find rotation axis and angle
    const axis = moduleNormal.clone().cross(coreNormal).normalize();
    let angle = Math.acos(
        Math.max(-1, Math.min(1, moduleNormal.clone().dot(coreNormal)))
    );
    // We want normals to face each other, so rotate by PI if already aligned
    if (angle < 1e-4) {
        angle = Math.PI;
        axis.copy(moduleNormal.clone().cross(new THREE.Vector3(1, 0, 0)).normalize());
    }
    if (axis.lengthSq() > 1e-6) {
        moduleObject.rotateOnWorldAxis(axis, angle);
    }

    // 3. Move module so snap hook centers coincide
    const coreCenter = getTriangleCenter(corePoints);
    const moduleCenter = getTriangleCenter(modulePoints);
    // Calculate world position of module snap hook center
    const moduleWorldCenter = moduleObject.localToWorld(moduleCenter.clone());
    const translation = coreCenter.clone().sub(moduleWorldCenter);
    moduleObject.position.add(translation);

    // 4. Align vertex 1 direction
    // Get direction from center to vertex 1 for both
    const coreDir = corePoints[0].clone().sub(coreCenter).normalize();
    // After transform, get module vertex 1 world position
    const moduleVertexWorld = moduleObject.localToWorld(modulePoints[0].clone());
    const moduleDir = moduleVertexWorld.clone().sub(coreCenter).normalize();
    // Find rotation to align these directions around the normal axis
    const alignAxis = coreNormal.clone().normalize();
    let alignAngle = Math.acos(
        Math.max(-1, Math.min(1, moduleDir.dot(coreDir)))
    );
    // Determine direction of rotation
    const cross = moduleDir.clone().cross(coreDir);
    if (cross.dot(alignAxis) < 0) alignAngle = -alignAngle;
    moduleObject.rotateOnWorldAxis(alignAxis, alignAngle);
}

// Helper: get normal of triangle (clockwise order)
function getTriangleNormal(points) {
    const v1 = points[1].clone().sub(points[0]);
    const v2 = points[2].clone().sub(points[0]);
    return v1.cross(v2).normalize();
}

// Helper: get center of triangle
function getTriangleCenter(points) {
    return points[0].clone().add(points[1]).add(points[2]).multiplyScalar(1 / 3);
}