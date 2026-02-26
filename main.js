import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';

let scene, camera, renderer;
let mapControls, dragControls;
let objects = [];

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 5);

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Controls
    mapControls = new MapControls(camera, renderer.domElement);
    mapControls.enableDamping = true;
    mapControls.dampingFactor = 0.05;
    mapControls.screenSpacePanning = false;
    mapControls.minDistance = 1;
    mapControls.maxDistance = 100;
    mapControls.maxPolarAngle = Math.PI / 2;

    // Load GLTF
    loadModel();

    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function loadModel() {
    const loader = new GLTFLoader();
    loader.load(
        'smeb_driveunit/smeb_driveunit.gltf',
        function (gltf) {
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material = material;
                    objects.push(child);
                }
            });

            // Normalize and center model
            normalizeModel(gltf.scene);
            scene.add(gltf.scene);

            // Drag controls
            dragControls = new DragControls(objects, camera, renderer.domElement);
            dragControls.transformGroup = true;
            dragControls.addEventListener('dragstart', function (event) {
                mapControls.enabled = false;
            });
            dragControls.addEventListener('dragend', function (event) {
                mapControls.enabled = true;
            });
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