import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';

let scene, camera, renderer;
let mapControls;
let modelGroups = []; // Array of model groups (gltf.scene objects)

// Custom drag state
let isDragging = false;
let draggedGroup = null;
const dragPlane = new THREE.Plane();
const dragOffset = new THREE.Vector3();
const dragRaycaster = new THREE.Raycaster();
const dragMouse = new THREE.Vector2();

init();
animate();

// Basic funcitons
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

    // Drag Controls
    initDragControls();

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Render main menu in #categories
    renderMainMenu();

    // const corePoints = gltf.scene.userData.snapPoints;
}

function animate() {
    requestAnimationFrame(animate);
    if (mapControls) mapControls.update();
    renderer.render(scene, camera);
}

// Custom drag controls that move entire model groups (gltf.scene), not individual meshes
function initDragControls() {
    renderer.domElement.addEventListener('pointerdown', onDragPointerDown);
    renderer.domElement.addEventListener('pointermove', onDragPointerMove);
    renderer.domElement.addEventListener('pointerup', onDragPointerUp);
}

function onDragPointerDown(event) {
    dragMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    dragMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    dragRaycaster.setFromCamera(dragMouse, camera);

    // Collect all meshes from all model groups for raycasting
    const allMeshes = [];
    modelGroups.forEach(g => g.traverse(c => { if (c.isMesh) allMeshes.push(c); }));
    const intersects = dragRaycaster.intersectObjects(allMeshes, false);

    if (intersects.length > 0) {
        // Walk up to find the model group (direct child of scene)
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== scene) {
            obj = obj.parent;
        }
        draggedGroup = obj;

        // Create drag plane perpendicular to camera at intersection point
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        dragPlane.setFromNormalAndCoplanarPoint(cameraDir, intersects[0].point);

        // Compute offset so group doesn't jump to cursor position
        const planeIntersection = new THREE.Vector3();
        dragRaycaster.ray.intersectPlane(dragPlane, planeIntersection);
        dragOffset.copy(planeIntersection).sub(draggedGroup.position);

        isDragging = true;
        mapControls.enabled = false;
    }
}

function onDragPointerMove(event) {
    if (!isDragging || !draggedGroup) return;

    dragMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    dragMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    dragRaycaster.setFromCamera(dragMouse, camera);

    const planeIntersection = new THREE.Vector3();
    if (dragRaycaster.ray.intersectPlane(dragPlane, planeIntersection)) {
        draggedGroup.position.copy(planeIntersection.sub(dragOffset));
    }
}

function onDragPointerUp() {
    if (isDragging && draggedGroup) {
        checkPossibleSnap(draggedGroup);
    }
    isDragging = false;
    draggedGroup = null;
    mapControls.enabled = true;
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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// UI Functions
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
            <div class="category-container" id="d3b1-beam">
              <img src="/icons/profiles-icon.png" alt="D3B1 Beam" class="category-icon">
              <p>D3B1 Beam</p>
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
        const d3b1Btn = document.getElementById('d3b1-beam');
        if (d3b1Btn) {
            d3b1Btn.addEventListener('click', loadD3B1);
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

// Load models
function loadSmebDriveUnit() {
    const loader = new GLTFLoader();
    loader.load(
        'parts/smeb_driveunit.gltf',
        function (gltf) {
            const material = new THREE.MeshStandardMaterial({ color: 0x175b74 });
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material = material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            const moduleSnapPoints = [
                new THREE.Vector3(320.3, 10, 0), // Vertex 1
                new THREE.Vector3(320.3, -5, 8.66), // Vertex 2
                new THREE.Vector3(320.3, -5, -8.66)  // Vertex 3
            ];

            // Normalize and center model
            normalizeModel(gltf.scene);
            // Transform snap points from geometry (mm) space to gltf.scene local space
            transformSnapPointsToModelLocal(gltf.scene, moduleSnapPoints);

            gltf.scene.userData.snapPoints = moduleSnapPoints;
            gltf.scene.userData.name = "SmebDriveUnit";

            scene.add(gltf.scene);
            modelGroups.push(gltf.scene);
            highlightSnapPointsAndTriangle(gltf.scene, moduleSnapPoints);
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );
}

function loadSmej315IdlerUnit() {
    const loader = new GLTFLoader();
    loader.load(
        'parts/smej_315_idlerunit.gltf',
        function (gltf) {
            const material = new THREE.MeshStandardMaterial({ color: 0x175b74 });
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material = material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            const moduleSnapPoints = [
                new THREE.Vector3(320.3, 10, 0), // Vertex 1
                new THREE.Vector3(320.3, -5, 8.66), // Vertex 2
                new THREE.Vector3(320.3, -5, -8.66)  // Vertex 3
            ];

            // Normalize and center model
            normalizeModel(gltf.scene);
            // Transform snap points from geometry (mm) space to gltf.scene local space
            transformSnapPointsToModelLocal(gltf.scene, moduleSnapPoints);

            gltf.scene.userData.snapPoints = moduleSnapPoints;
            gltf.scene.userData.name = "Smej315IdlerUnit";

            scene.add(gltf.scene);
            modelGroups.push(gltf.scene);
            highlightSnapPointsAndTriangle(gltf.scene, moduleSnapPoints);
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );
}

function loadD3B1() {
    const loader = new GLTFLoader();
    loader.load(
        'parts/D3B1.gltf',
        function (gltf) {
            const material = new THREE.MeshStandardMaterial({ color: 0x175b74 });
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material = material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            const moduleSnapPoints = [
                new THREE.Vector3(3190.69, 195.03, 1048.65), // Vertex 1
                new THREE.Vector3(3199.35, 180.03, 1048.65), // Vertex 2
                new THREE.Vector3(3182.03, 180.03, 1048.65)  // Vertex 3
            ];

            // Normalize and center model
            normalizeModel(gltf.scene);
            // Transform snap points from geometry (mm) space to gltf.scene local space
            transformSnapPointsToModelLocal(gltf.scene, moduleSnapPoints);

            gltf.scene.userData.snapPoints = moduleSnapPoints;
            gltf.scene.userData.name = "D3B1";

            scene.add(gltf.scene);
            modelGroups.push(gltf.scene);
            highlightSnapPointsAndTriangle(gltf.scene, moduleSnapPoints);
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

// Convert snap points from mesh-geometry space (mm) to gltf.scene's local space
// by computing the relative transform through the GLTF node hierarchy.
// The GLTF node tree typically has intermediate transforms (e.g. 0.001 scale for mm→m).
function transformSnapPointsToModelLocal(model, snapPoints) {
    model.updateMatrixWorld(true);

    // Find the relative transform: model.matrixWorld⁻¹ × mesh.matrixWorld
    // This maps from mesh-local (geometry) space into model-local space
    let relMatrix = null;
    model.traverse(function (child) {
        if (child.isMesh && !relMatrix) {
            relMatrix = new THREE.Matrix4()
                .copy(model.matrixWorld)
                .invert()
                .multiply(child.matrixWorld);
        }
    });

    if (relMatrix) {
        snapPoints.forEach(function (pt) {
            pt.applyMatrix4(relMatrix);
        });
    }
}

function highlightSnapPointsAndTriangle(model, snapPoints) {
    // Remove previous highlights if any
    if (model.userData.snapHighlightGroup) {
        model.remove(model.userData.snapHighlightGroup);
    }
    const group = new THREE.Group();

    // Place highlights in model-local space as children of the model.
    // They will automatically transform with the model when it moves.
    const sphereGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    snapPoints.forEach(function (pt) {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(pt);
        group.add(sphere);
    });

    // Draw triangle edges in model-local space
    const triangleMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, depthTest: false });
    const triangleGeometry = new THREE.BufferGeometry().setFromPoints([
        snapPoints[0], snapPoints[1], snapPoints[2], snapPoints[0]
    ]);
    const triangleLine = new THREE.Line(triangleGeometry, triangleMaterial);
    group.add(triangleLine);

    model.userData.snapHighlightGroup = group;
    model.add(group); // Child of model — moves with it automatically
}

// Snap functions
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

function checkPossibleSnap(draggedGroup) {
    if (!draggedGroup || !draggedGroup.userData.snapPoints) return;
    console.log(draggedGroup.userData.name);
    console.log('Checking for snap...');

    // Ensure matrices are current after drag
    draggedGroup.updateMatrixWorld(true);

    const snapThreshold = 0.9; // in world units
    const modulePoints = draggedGroup.userData.snapPoints;

    // Check against all other model groups
    for (const group of modelGroups) {
        if (group === draggedGroup || !group.userData.snapPoints) continue;
        console.log('Checking against object:', group.userData.name || group.name || group.id);
        group.updateMatrixWorld(true);
        const corePoints = group.userData.snapPoints;

        // Compare center points in world space
        const moduleCenterWorld = draggedGroup.localToWorld(getTriangleCenter(modulePoints).clone());
        const coreCenterWorld = group.localToWorld(getTriangleCenter(corePoints).clone());
        const dist = moduleCenterWorld.distanceTo(coreCenterWorld);

        if (dist < snapThreshold) {
            console.log('Snap possible! Distance:', dist);
            console.log('Snapping:', draggedGroup.userData.name, '<-->', group.userData.name);
            // Convert core points to world space (snapModuleToCore expects core in world, module in local)
            const coreWorldPoints = corePoints.map(p => group.localToWorld(p.clone()));
            snapModuleToCore(coreWorldPoints, modulePoints, draggedGroup);
            break;
        }
    }
}