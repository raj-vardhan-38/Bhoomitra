import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rotate3d, Layers } from 'lucide-react';

export default function Bhoomi3DParcel() {
  const containerRef = useRef(null);
  const [activePlot, setActivePlot] = useState('khesra-311');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    
    // Orthographic or high-FOV isometric perspective
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(24, 20, 24);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Lighting (Warm Indian sunlight & emerald civic ambiance)
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x86efac, 1.2);
    rimLight.position.set(-20, 10, -20);
    scene.add(rimLight);

    // 4. Main Island Root Group
    const islandGroup = new THREE.Group();
    scene.add(islandGroup);

    // Base Floating Soil Stratum (Clay + Earth layers)
    // Top Grass layer
    const topGeo = new THREE.BoxGeometry(16, 1.2, 16);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Emerald green
      roughness: 0.6,
      metalness: 0.1,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = 0;
    topMesh.receiveShadow = true;
    islandGroup.add(topMesh);

    // Lower Soil/Clay layer
    const soilGeo = new THREE.CylinderGeometry(11, 7, 5, 4);
    soilGeo.rotateY(Math.PI / 4);
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e, // Rich loam / clay soil
      roughness: 0.9,
    });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = -3;
    soilMesh.receiveShadow = true;
    islandGroup.add(soilMesh);

    // 5. Individual Plots (Khesra divisions with boundary ridges)
    // Plot 1: Agriculture (Dhanhar / Rice field)
    const plot1Geo = new THREE.BoxGeometry(7, 0.25, 14);
    const plot1Mat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Vibrant lush field
      roughness: 0.4,
    });
    const plot1 = new THREE.Mesh(plot1Geo, plot1Mat);
    plot1.position.set(-3.8, 0.7, 0);
    plot1.receiveShadow = true;
    plot1.castShadow = true;
    islandGroup.add(plot1);

    // Plot 2: Homestead / Garden Plot
    const plot2Geo = new THREE.BoxGeometry(6.5, 0.25, 7.5);
    const plot2Mat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.5,
    });
    const plot2 = new THREE.Mesh(plot2Geo, plot2Mat);
    plot2.position.set(3.8, 0.7, -3.2);
    plot2.receiveShadow = true;
    plot2.castShadow = true;
    islandGroup.add(plot2);

    // Plot 3: Water Pond (Talab / Water Body)
    const pondGeo = new THREE.BoxGeometry(6.5, 0.15, 5.5);
    const pondMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sparkling water
      roughness: 0.1,
      metalness: 0.8,
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.position.set(3.8, 0.65, 4.2);
    islandGroup.add(pond);

    // 6. Survey Boundary Pillars (Seema Stambh at 4 corners)
    const pillarGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.8, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
    });

    const pillars = [
      [-7.5, 7.5],
      [-7.5, -7.5],
      [7.5, 7.5],
      [7.5, -7.5],
      [0.2, 7.5],
      [0.2, -7.5],
    ];

    pillars.forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(px, 1.2, pz);
      p.castShadow = true;
      islandGroup.add(p);

      // Top glowing indicator tip
      const tipGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(px, 2.2, pz);
      islandGroup.add(tip);
    });

    // 7. Small Panchayat Shivir / Camp Tent Model
    const tentRoofGeo = new THREE.ConeGeometry(1.6, 1.8, 4);
    tentRoofGeo.rotateY(Math.PI / 4);
    const tentRoofMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Warm terracotta / saffron shivir tent
      roughness: 0.5,
    });
    const tentRoof = new THREE.Mesh(tentRoofGeo, tentRoofMat);
    tentRoof.position.set(4, 2.3, -3.5);
    tentRoof.castShadow = true;
    islandGroup.add(tentRoof);

    // Tent base
    const tentBaseGeo = new THREE.BoxGeometry(2.2, 1.2, 2.2);
    const tentBaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const tentBase = new THREE.Mesh(tentBaseGeo, tentBaseMat);
    tentBase.position.set(4, 1.2, -3.5);
    tentBase.castShadow = true;
    islandGroup.add(tentBase);

    // Flag pole
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 3, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(5.5, 2.2, -3.5);
    islandGroup.add(pole);

    const flagGeo = new THREE.BoxGeometry(0.8, 0.5, 0.05);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0x16a34a });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(5.9, 3.4, -3.5);
    islandGroup.add(flag);

    // 8. Trees / Vegetation on agricultural ridges
    const treeTrunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.9, 6);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const foliageGeo = new THREE.DodecahedronGeometry(0.65, 1);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

    const treePositions = [
      [-6.5, 1.2, -5],
      [-6.2, 1.2, 4],
      [1.5, 1.2, -6],
      [6.5, 1.2, 1.2],
    ];

    treePositions.forEach(([tx, ty, tz]) => {
      const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunk.position.set(tx, ty, tz);
      trunk.castShadow = true;
      islandGroup.add(trunk);

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(tx, ty + 0.8, tz);
      foliage.castShadow = true;
      islandGroup.add(foliage);
    });

    // 9. Floating Golden Sun Dust / Survey Particles
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 20;
      particlePositions[i + 1] = Math.random() * 8 + 1;
      particlePositions[i + 2] = (Math.random() - 0.5) * 20;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.25,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    islandGroup.add(particles);

    // Initial slight angle
    islandGroup.rotation.y = Math.PI / 6;

    // 10. Interactive Mouse Orbit / Gyroscope
    let targetRotationY = Math.PI / 6;
    let targetRotationX = 0;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.005;
        targetRotationX = Math.max(-0.4, Math.min(0.4, targetRotationX));
      } else {
        // Subtle parallax
        targetRotationY = Math.PI / 6 + x * 0.45;
        targetRotationX = y * 0.2;
      }

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    // 11. Resize handling
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 420;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // 12. Animation Loop (60 FPS)
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp to target rotation
      islandGroup.rotation.y += (targetRotationY - islandGroup.rotation.y) * 0.05;
      islandGroup.rotation.x += (targetRotationX - islandGroup.rotation.x) * 0.05;

      // Gentle floating bob
      islandGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.4;

      // Shimmer water
      pond.material.opacity = 0.85 + Math.sin(elapsedTime * 3) * 0.1;

      // Rotate particles slowly
      particles.rotation.y = elapsedTime * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] rounded-3xl overflow-hidden bg-gradient-to-b from-stone-50/60 via-emerald-50/30 to-amber-50/20 border border-stone-200/90 shadow-md group">
      {/* Interactive 3D Canvas Mount */}
      <div 
        ref={containerRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating 3D Metadata Overlays */}
      <div className="absolute top-4 left-4 pointer-events-none space-y-2">
        <div className="px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold text-stone-900">
            3D भूमि खंड (Digital Khesra Model)
          </span>
        </div>
        <div className="text-[11px] text-stone-500 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-100">
          माउस से घुमाएं और 3D में भूखंड देखें
        </div>
      </div>

      {/* Dynamic Plot Tag Highlights */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePlot('khesra-311')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              activePlot === 'khesra-311'
                ? 'bg-emerald-700 text-white ring-2 ring-emerald-500/30'
                : 'bg-white/90 text-stone-700 hover:bg-white border border-stone-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>खेसरा #311 (42 डिसमिल धनहर)</span>
          </button>

          <button
            onClick={() => setActivePlot('khesra-312')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              activePlot === 'khesra-312'
                ? 'bg-amber-700 text-white ring-2 ring-amber-500/30'
                : 'bg-white/90 text-stone-700 hover:bg-white border border-stone-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>पंचायत शिविर (Panchayat Shivir)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-stone-500 bg-white/90 px-3 py-1.5 rounded-xl border border-stone-200">
          <Rotate3d className="w-3.5 h-3.5 text-stone-400" />
          <span>360° घूर्णन उपलब्ध</span>
        </div>
      </div>
    </div>
  );
}

