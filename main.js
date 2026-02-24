import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { MapControls } from 'three/addons/controls/MapControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Set background to white
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();
let objects = [];
let controls;

loader.load('smeb_driveunit/smeb_driveunit.gltf', function (gltf) {
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    gltf.scene.traverse(function (child) {
        if (child.isMesh) {
            child.material = material;
            objects.push(child); // Add mesh to objects array
        }
        var mroot = gltf.scene;
        var bbox = new THREE.Box3().setFromObject(mroot);
        var cent = bbox.getCenter(new THREE.Vector3());
        var size = bbox.getSize(new THREE.Vector3());

        // Rescale object to normalized space
        var maxAxis = Math.max(size.x, size.y, size.z);
        mroot.scale.multiplyScalar(1.0 / maxAxis);
        bbox.setFromObject(mroot);
        bbox.getCenter(cent);
        bbox.getSize(size);
        // Reposition to 0,halfY,0
        mroot.position.copy(cent).multiplyScalar(-1);
        mroot.position.y -= (size.y * 0.5);

    });
    scene.add(gltf.scene);

    // Initialize DragControls after objects are ready
    controls = new DragControls(objects, camera, renderer.domElement);
    controls.addEventListener('dragstart', function (event) {
        if (event.object.material.emissive) {
            event.object.material.emissive.set(0xaaaaaa);
        }
        mapControls.enabled = false; // Disable map controls while dragging
    });
    controls.addEventListener('dragend', function (event) {
        if (event.object.material.emissive) {
            event.object.material.emissive.set(0x000000);
        }
        mapControls.enabled = true; // Re-enable map controls after dragging
    });
}, undefined, function (error) {
    console.error(error);
});

camera.position.z = 5;

const mapControls = new MapControls(camera, renderer.domElement);
mapControls.enableDamping = true;
mapControls.dampingFactor = 0.05;
mapControls.screenSpacePanning = false;
mapControls.minDistance = 1;
mapControls.maxDistance = 100;
mapControls.maxPolarAngle = Math.PI / 2;

function animate(time) {
    mapControls.update();
    renderer.render(scene, camera);
}