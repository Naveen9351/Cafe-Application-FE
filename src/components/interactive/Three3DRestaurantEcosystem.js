import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Play, Pause, RotateCcw, Zap, Compass } from "lucide-react";

export default function Three3DRestaurantEcosystem({ activeStage = 0 }) {
  const mountRef = useRef(null);
  const [isRotating, setIsRotating] = useState(true);
  const [cameraView, setCameraView] = useState("isometric");
  const sceneObjectsRef = useRef({});

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Dimensions
    const width = currentMount.clientWidth || 800;
    const height = 360;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfafcff, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 14, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    currentMount.innerHTML = "";
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x2563eb, 1.8);
    dirLight.position.set(15, 25, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x4f46e5, 2.5, 50);
    pointLight.position.set(0, 4, 0);
    scene.add(pointLight);

    // Group for all interactive nodes
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Central Holographic Core Platform
    const baseGeo = new THREE.CylinderGeometry(5.5, 6, 0.4, 32);
    const baseMat = new THREE.MeshPhongMaterial({
      color: 0xe2e8f0,
      shininess: 90,
      transparent: true,
      opacity: 0.85
    });
    const basePlatform = new THREE.Mesh(baseGeo, baseMat);
    basePlatform.position.y = -0.2;
    masterGroup.add(basePlatform);

    // Outer grid ring
    const ringGeo = new THREE.RingGeometry(6.2, 6.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
    const outerRing = new THREE.Mesh(ringGeo, ringMat);
    outerRing.rotation.x = -Math.PI / 2;
    masterGroup.add(outerRing);

    // 2. Central AI Engine Sphere
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true
    });
    const centralCore = new THREE.Mesh(coreGeo, coreMat);
    centralCore.position.y = 1.8;
    masterGroup.add(centralCore);

    // Inner glowing core nucleus
    const nucGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const nucMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
    const nucleus = new THREE.Mesh(nucGeo, nucMat);
    nucleus.position.y = 1.8;
    masterGroup.add(nucleus);

    // 3. Orbiting Nodes (The 5 Key Restaurant Systems)
    const nodeConfigs = [
      { name: "Table QR", color: 0x10b981, angle: 0, rad: 4.2, height: 1.0, shape: "cylinder" },
      { name: "Kitchen KDS", color: 0x4f46e5, angle: (Math.PI * 2) / 5, rad: 4.2, height: 1.2, shape: "box" },
      { name: "Recipe Stock", color: 0x2563eb, angle: ((Math.PI * 2) / 5) * 2, rad: 4.2, height: 0.9, shape: "cylinder" },
      { name: "POS & Billing", color: 0x06b6d4, angle: ((Math.PI * 2) / 5) * 3, rad: 4.2, height: 1.1, shape: "box" },
      { name: "CRM & BI", color: 0x7c3aed, angle: ((Math.PI * 2) / 5) * 4, rad: 4.2, height: 1.0, shape: "sphere" }
    ];

    const nodeMeshes = [];

    nodeConfigs.forEach((cfg, idx) => {
      let geo;
      if (cfg.shape === "cylinder") geo = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 16);
      else if (cfg.shape === "box") geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      else geo = new THREE.SphereGeometry(0.55, 16, 16);

      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.7
      });

      const mesh = new THREE.Mesh(geo, mat);
      const x = Math.cos(cfg.angle) * cfg.rad;
      const z = Math.sin(cfg.angle) * cfg.rad;
      mesh.position.set(x, cfg.height, z);
      masterGroup.add(mesh);

      // Node pedestal
      const pedGeo = new THREE.CylinderGeometry(0.65, 0.7, 0.2, 16);
      const pedMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.set(x, 0.1, z);
      masterGroup.add(ped);

      // Connecting laser line to center core
      const points = [new THREE.Vector3(x, cfg.height, z), new THREE.Vector3(0, 1.8, 0)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.6 });
      const line = new THREE.Line(lineGeo, lineMat);
      masterGroup.add(line);

      nodeMeshes.push({ mesh, cfg, line });
    });

    // 4. Traveling Photon Energy Particles
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.0 + Math.random() * 3.5;
      particlePositions[i * 3] = Math.cos(angle) * r;
      particlePositions[i * 3 + 1] = 0.5 + Math.random() * 2.5;
      particlePositions[i * 3 + 2] = Math.sin(angle) * r;

      particleVelocities.push({
        angle,
        radius: r,
        speed: 0.015 + Math.random() * 0.02,
        y: particlePositions[i * 3 + 1],
        yRange: 0.4 + Math.random() * 0.8
      });
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particleSystem);

    sceneObjectsRef.current = {
      masterGroup,
      centralCore,
      nucleus,
      nodeMeshes,
      particleSystem,
      particlePositions,
      particleVelocities
    };

    // Mouse Parallax Interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      const rect = currentMount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / height) * 2 - 1);
    };
    currentMount.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth central core rotation
      centralCore.rotation.x = elapsedTime * 0.5;
      centralCore.rotation.y = elapsedTime * 0.7;

      const scalePulse = 1 + Math.sin(elapsedTime * 3) * 0.06;
      nucleus.scale.set(scalePulse, scalePulse, scalePulse);

      // Auto rotation of entire ecosystem
      if (isRotating) {
        masterGroup.rotation.y += 0.004;
      }

      // Parallax camera tilt
      camera.position.x += (12 + mouseX * 3 - camera.position.x) * 0.05;
      camera.position.y += (14 + mouseY * 2.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 0.8, 0);

      // Floating nodes bounce
      nodeMeshes.forEach((item, idx) => {
        const bounce = Math.sin(elapsedTime * 2 + idx) * 0.12;
        item.mesh.position.y = item.cfg.height + bounce;
        item.mesh.rotation.y += 0.015;
      });

      // Update particle positions
      const positions = particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const vel = particleVelocities[i];
        vel.angle += vel.speed;
        positions[i * 3] = Math.cos(vel.angle) * vel.radius;
        positions[i * 3 + 1] = vel.y + Math.sin(elapsedTime * 3 + i) * 0.2;
        positions[i * 3 + 2] = Math.sin(vel.angle) * vel.radius;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!currentMount) return;
      const newWidth = currentMount.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      currentMount.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [isRotating]);

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: "var(--radius-xl)", overflow: "hidden", background: "linear-gradient(135deg, #0b1329 0%, #0f172a 60%, #1e1b4b 100%)", border: "1.5px solid rgba(59, 130, 246, 0.3)", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.3)" }}>
      
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} style={{ width: "100%", height: 360, cursor: "grab" }} />

      {/* Top Floating Controls Bar */}
      <div style={{ position: "absolute", top: 16, left: 20, right: 20, display: "flex", alignItems: "center", justifyContent: "space-between", pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(12px)", padding: "6px 14px", borderRadius: "var(--radius-full)", border: "1px solid rgba(255, 255, 255, 0.15)", color: "#ffffff", fontSize: 12, fontWeight: 800 }}>
          <Zap style={{ width: 14, height: 14, color: "#38bdf8" }} />
          <span>Interactive 3D Autonomous WebGL Mesh</span>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#ffffff", padding: "6px 12px", borderRadius: "var(--radius-md)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            {isRotating ? <Pause style={{ width: 12, height: 12 }} /> : <Play style={{ width: 12, height: 12 }} />}
            <span>{isRotating ? "Pause Orbit" : "Resume Orbit"}</span>
          </button>
        </div>
      </div>

      {/* Bottom Live System Legend Bar */}
      <div style={{ position: "absolute", bottom: 12, left: 16, right: 16, display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 14, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(12px)", padding: "8px 16px", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Active Nodes:
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#10b981" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} /> Table QR
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#60a5fa" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} /> AI Routing Core
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#818cf8" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4f46e5" }} /> Kitchen KDS
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#22d3ee" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#06b6d4" }} /> POS & UPI
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#c084fc" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} /> Stock BI
        </div>
      </div>
    </div>
  );
}
