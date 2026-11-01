import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Voice3DVisualizer({ isListening, isSpeaking }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 240;
    const height = mount.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Dynamic Central Audio Sphere
    const sphereGeo = new THREE.IcosahedronGeometry(1.6, 4);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Inner Glowing Core
    const coreGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.6,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Surrounding Harmonic Rings
    const ringGeo = new THREE.TorusGeometry(2.3, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x86efac,
      transparent: true,
      opacity: 0.5,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = Math.PI / 2;
    scene.add(ring1);
    scene.add(ring2);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x22c55e, 2, 20);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    let animationId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // State-based dynamics
      if (isListening) {
        // Red / Pulse alert when listening
        sphereMat.color.setHex(0xef4444);
        coreMat.color.setHex(0xf87171);
        ringMat.color.setHex(0xfca5a5);

        const pulse = 1 + Math.sin(time * 8) * 0.15;
        sphere.scale.set(pulse, pulse, pulse);
        sphere.rotation.y += 0.03;
        sphere.rotation.x += 0.02;

        ring1.rotation.z += 0.04;
        ring2.rotation.y += 0.04;
      } else if (isSpeaking) {
        // Emerald / Harmonic soundwave ripple when speaking
        sphereMat.color.setHex(0x059669);
        coreMat.color.setHex(0x34d399);
        ringMat.color.setHex(0xa7f3d0);

        const wave = 1 + Math.sin(time * 6) * 0.12 + Math.cos(time * 12) * 0.08;
        sphere.scale.set(wave, wave, wave);
        sphere.rotation.y += 0.05;
        sphere.rotation.z += 0.02;

        ring1.rotation.x += 0.03;
        ring2.rotation.z += 0.03;
      } else {
        // Gentle idle breathe
        sphereMat.color.setHex(0x16a34a);
        coreMat.color.setHex(0x4ade80);
        ringMat.color.setHex(0xbbf7d0);

        const breathe = 1 + Math.sin(time * 2) * 0.04;
        sphere.scale.set(breathe, breathe, breathe);
        sphere.rotation.y += 0.008;
        sphere.rotation.x += 0.005;

        ring1.rotation.z += 0.01;
        ring2.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isListening, isSpeaking]);

  return (
    <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full pointer-events-none" />
      {/* Centered Audio State Pill */}
      <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 shadow-xs text-[10px] font-bold text-stone-700">
        {isListening ? '🎙️ आवाज़ सुन रहे हैं...' : isSpeaking ? '🔊 उत्तर सुना रहे हैं...' : '🟢 तैयार है'}
      </div>
    </div>
  );
}

