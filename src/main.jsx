import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';

import flexibleConveyorIcon from './assets/icons/flexible-conveyor-icon.jpg';
import conveyorGuidesIcon from './assets/icons/conveyor-guides-icon.jpg';
import wlSeriesIcon from './assets/icons/wl-series-icon.jpg';
import profilesIcon from './assets/icons/profiles-icon.png';

// Three.js logic ported from main.js
function ThreeJSScene() {
  useEffect(() => {
    let animationId = null;
    let scene, camera, renderer;
    let mapControls;
    let modelGroups = [];
    let isDragging = false;
    let draggedGroup = null;
    const dragPlane = new THREE.Plane();
    const dragOffset = new THREE.Vector3();
    const dragRaycaster = new THREE.Raycaster();
    const dragMouse = new THREE.Vector2();

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      scene.add(directionalLight);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 5);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      document.body.appendChild(renderer.domElement);

      initMapControls();
      initDragControls();
      window.addEventListener('resize', onWindowResize);
      renderMainMenu();
    }

    function animate() {
      animationId = requestAnimationFrame(animate);
      if (mapControls) mapControls.update();
      renderer.render(scene, camera);
    }

    function initDragControls() {
      renderer.domElement.addEventListener('pointerdown', onDragPointerDown);
      renderer.domElement.addEventListener('pointermove', onDragPointerMove);
      renderer.domElement.addEventListener('pointerup', onDragPointerUp);
    }

    function onDragPointerDown(event) {
      dragMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      dragMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      dragRaycaster.setFromCamera(dragMouse, camera);
      const allMeshes = [];
      modelGroups.forEach(g => g.traverse(c => { if (c.isMesh) allMeshes.push(c); }));
      const intersects = dragRaycaster.intersectObjects(allMeshes, false);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== scene) {
          obj = obj.parent;
        }
        draggedGroup = obj;
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        dragPlane.setFromNormalAndCoplanarPoint(cameraDir, intersects[0].point);
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

    function renderMainMenu() {
      const categoriesDiv = document.getElementById('categories');
      if (categoriesDiv) {
        categoriesDiv.innerHTML = `
          <img src="${flexibleConveyorIcon}" alt="Flexible Conveyor" class="category-icon" id="flexible-conveyor-icon">
          <p>Flexible Conveyor</p>
        `;
        const flexibleConveyorBtn = document.getElementById('flexible-conveyor-icon');
        if (flexibleConveyorBtn) {
          flexibleConveyorBtn.addEventListener('click', flexibleConveyorMenu);
        }
      }
    }

    function flexibleConveyorMenu() {
      const categoriesDiv = document.getElementById('categories');
      if (categoriesDiv) {
        categoriesDiv.innerHTML = `
          <div class="categories">
            <div class="category-container" id="smeb-drive-unit">
              <img src="${conveyorGuidesIcon}" alt="SMEB Drive Unit" class="category-icon">
              <p>SMEB Drive Unit</p>
            </div>
            <div class="category-container" id="smej-315-idler-unit">
              <img src="${wlSeriesIcon}" alt="SMEJ 315 Idler Unit" class="category-icon">
              <p>SMEJ 315 Idler Unit</p>
            </div>
            <div class="category-container" id="d3b1-beam">
              <img src="${profilesIcon}" alt="D3B1 Beam" class="category-icon">
              <p>D3B1 Beam</p>
            </div>
          </div>
          <button class="back-button" id="back-to-main-menu">Back</button>
        `;
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
          <img src="${flexibleConveyorIcon}" alt="Flexible Conveyor" class="category-icon" id="flexible-conveyor-icon">
            <p>Flexible Conveyor</p>
        </div>
        `;
        const flexibleConveyorBtn = document.getElementById('flexible-conveyor-icon');
        if (flexibleConveyorBtn) {
          flexibleConveyorBtn.addEventListener('click', flexibleConveyorMenu);
        }
      }
    }

    function loadSmebDriveUnit() {
      const loader = new GLTFLoader();
      loader.load(
        '/parts/smeb_driveunit.gltf',
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
            new THREE.Vector3(320.3, 10, 0),
            new THREE.Vector3(320.3, -5, 8.66),
            new THREE.Vector3(320.3, -5, -8.66)
          ];
          normalizeModel(gltf.scene);
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
        '/parts/smej_315_idlerunit.gltf',
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
            new THREE.Vector3(320.3, 10, 0),
            new THREE.Vector3(320.3, -5, 8.66),
            new THREE.Vector3(320.3, -5, -8.66)
          ];
          normalizeModel(gltf.scene);
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
        '/parts/D3B1.gltf',
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
            new THREE.Vector3(3190.69, 195.03, 1048.65),
            new THREE.Vector3(3199.35, 180.03, 1048.65),
            new THREE.Vector3(3182.03, 180.03, 1048.65)
          ];
          normalizeModel(gltf.scene);
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
      model.rotation.x = Math.PI / 2;
    }

    function transformSnapPointsToModelLocal(model, snapPoints) {
      model.updateMatrixWorld(true);
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
      if (model.userData.snapHighlightGroup) {
        model.remove(model.userData.snapHighlightGroup);
      }
      const group = new THREE.Group();
      const sphereGeometry = new THREE.SphereGeometry(0.02, 16, 16);
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      snapPoints.forEach(function (pt) {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(pt);
        group.add(sphere);
      });
      const triangleMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, depthTest: false });
      const triangleGeometry = new THREE.BufferGeometry().setFromPoints([
        snapPoints[0], snapPoints[1], snapPoints[2], snapPoints[0]
      ]);
      const triangleLine = new THREE.Line(triangleGeometry, triangleMaterial);
      group.add(triangleLine);
      model.userData.snapHighlightGroup = group;
      model.add(group);
    }

    function snapModuleToCore(corePoints, modulePoints, moduleObject) {
      const coreNormal = getTriangleNormal(corePoints);
      const moduleNormal = getTriangleNormal(modulePoints);
      const axis = moduleNormal.clone().cross(coreNormal).normalize();
      let angle = Math.acos(
        Math.max(-1, Math.min(1, moduleNormal.clone().dot(coreNormal)))
      );
      if (angle < 1e-4) {
        angle = Math.PI;
        axis.copy(moduleNormal.clone().cross(new THREE.Vector3(1, 0, 0)).normalize());
      }
      if (axis.lengthSq() > 1e-6) {
        moduleObject.rotateOnWorldAxis(axis, angle);
      }
      const coreCenter = getTriangleCenter(corePoints);
      const moduleCenter = getTriangleCenter(modulePoints);
      const moduleWorldCenter = moduleObject.localToWorld(moduleCenter.clone());
      const translation = coreCenter.clone().sub(moduleWorldCenter);
      moduleObject.position.add(translation);
      const coreDir = corePoints[0].clone().sub(coreCenter).normalize();
      const moduleVertexWorld = moduleObject.localToWorld(modulePoints[0].clone());
      const moduleDir = moduleVertexWorld.clone().sub(coreCenter).normalize();
      const alignAxis = coreNormal.clone().normalize();
      let alignAngle = Math.acos(
        Math.max(-1, Math.min(1, moduleDir.dot(coreDir)))
      );
      const cross = moduleDir.clone().cross(coreDir);
      if (cross.dot(alignAxis) < 0) alignAngle = -alignAngle;
      moduleObject.rotateOnWorldAxis(alignAxis, alignAngle);
    }

    function getTriangleNormal(points) {
      const v1 = points[1].clone().sub(points[0]);
      const v2 = points[2].clone().sub(points[0]);
      return v1.cross(v2).normalize();
    }

    function getTriangleCenter(points) {
      return points[0].clone().add(points[1]).add(points[2]).multiplyScalar(1 / 3);
    }

    function checkPossibleSnap(draggedGroup) {
      if (!draggedGroup || !draggedGroup.userData.snapPoints) return;
      console.log(draggedGroup.userData.name);
      console.log('Checking for snap...');
      draggedGroup.updateMatrixWorld(true);
      const snapThreshold = 0.9;
      const modulePoints = draggedGroup.userData.snapPoints;
      for (const group of modelGroups) {
        if (group === draggedGroup || !group.userData.snapPoints) continue;
        console.log('Checking against object:', group.userData.name || group.name || group.id);
        group.updateMatrixWorld(true);
        const corePoints = group.userData.snapPoints;
        const moduleCenterWorld = draggedGroup.localToWorld(getTriangleCenter(modulePoints).clone());
        const coreCenterWorld = group.localToWorld(getTriangleCenter(corePoints).clone());
        const dist = moduleCenterWorld.distanceTo(coreCenterWorld);
        if (dist < snapThreshold) {
          console.log('Snap possible! Distance:', dist);
          console.log('Snapping:', draggedGroup.userData.name, '<-->', group.userData.name);
          const coreWorldPoints = corePoints.map(p => group.localToWorld(p.clone()));
          snapModuleToCore(coreWorldPoints, modulePoints, draggedGroup);
          break;
        }
      }
    }

    // Initialize Three.js scene
    init();
    animate();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (renderer?.domElement) {
        renderer.domElement.removeEventListener('pointerdown', onDragPointerDown);
        renderer.domElement.removeEventListener('pointermove', onDragPointerMove);
        renderer.domElement.removeEventListener('pointerup', onDragPointerUp);
      }
      mapControls?.dispose();
      renderer?.dispose();
      if (renderer && renderer.domElement) {
        renderer.domElement.remove();
      }
    };
  }, []);

  return null;
}

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <ThreeJSScene />
  </>
);
