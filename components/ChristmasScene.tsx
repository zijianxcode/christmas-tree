import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AppState, Greeting, ParticleData, ElfData } from '../types';

interface ChristmasSceneProps {
  mode: AppState;
  greetingText: Greeting;
  onSceneClick: () => void;
}

const PARTICLE_COUNT = 6000;
const ELF_COUNT = 50;

export const ChristmasScene: React.FC<ChristmasSceneProps> = ({ mode, greetingText, onSceneClick }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Three.js Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particleMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const elfMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const starMeshRef = useRef<THREE.Mesh | null>(null);
  const rafRef = useRef<number | null>(null);
  
  // Data Refs
  const particlesRef = useRef<ParticleData>({
    currentPos: [],
    targetPos: [],
    explodeOffsets: [],
    speeds: [],
    phases: []
  });
  const elvesRef = useRef<ElfData>({
    speeds: [],
    radii: [],
    heights: [],
    phases: [],
    verticalSpeeds: []
  });
  
  // Interaction Refs
  const mouseRef = useRef(new THREE.Vector2());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mousePlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const mouseTargetRef = useRef(new THREE.Vector3());
  const dummyRef = useRef(new THREE.Object3D());

  // Initialization
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.02);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particles
    const geometry = new THREE.IcosahedronGeometry(0.12, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const particleMesh = new THREE.InstancedMesh(geometry, material, PARTICLE_COUNT);
    particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(particleMesh);
    particleMeshRef.current = particleMesh;

    // Elves
    const elfGeo = new THREE.TetrahedronGeometry(0.2, 0);
    const elfMat = new THREE.MeshBasicMaterial({
      color: 0xCCFFFF,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    const elfMesh = new THREE.InstancedMesh(elfGeo, elfMat, ELF_COUNT);
    scene.add(elfMesh);
    elfMeshRef.current = elfMesh;

    // Star
    const starGeo = new THREE.OctahedronGeometry(1.5, 0);
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    starMesh.position.y = 12;
    scene.add(starMesh);
    starMeshRef.current = starMesh;

    // Initialize Data
    initParticles();
    initElves();
    calculateTreeShape(); // Initial shape

    // Event Listeners
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      updateScene();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      // Cleanup geometries/materials ideally
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mode Effect
  useEffect(() => {
    const star = starMeshRef.current;
    const elves = elfMeshRef.current;
    const particles = particleMeshRef.current;

    if (star) star.visible = mode === AppState.TREE;
    if (elves) elves.visible = mode === AppState.TREE;
    if (particles) particles.rotation.set(0, 0, 0); // Reset base rotation

    switch (mode) {
      case AppState.TREE:
        calculateTreeShape();
        break;
      case AppState.EXPLODE:
      case AppState.IMAGE:
        calculateExplodeShape();
        break;
      case AppState.TEXT:
        calculateTextShape(greetingText);
        break;
    }
  }, [mode, greetingText]);

  // --- Helper Functions ---

  const initParticles = () => {
    const colorPalette = [
      new THREE.Color(0xFFD700), // Gold
      new THREE.Color(0xFFEA00), // Bright Yellow
      new THREE.Color(0xC41E3A), // Red
      new THREE.Color(0x165B33), // Green
      new THREE.Color(0x66FF66), // Bright Green
      new THREE.Color(0xFFFFFF)  // White
    ];
    const p = particlesRef.current;
    const mesh = particleMeshRef.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      p.currentPos.push(new THREE.Vector3((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60));
      p.targetPos.push(new THREE.Vector3());
      p.explodeOffsets.push(new THREE.Vector3());
      p.speeds.push(0.015 + Math.random() * 0.04);
      p.phases.push(Math.random() * Math.PI * 2);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      if (mesh) mesh.setColorAt(i, color);
    }
    if (mesh) mesh.instanceColor!.needsUpdate = true;
  };

  const initElves = () => {
    const e = elvesRef.current;
    const mesh = elfMeshRef.current;
    for (let i = 0; i < ELF_COUNT; i++) {
      e.speeds.push((Math.random() - 0.5) * 1.5);
      e.radii.push(5 + Math.random() * 12);
      e.heights.push((Math.random() - 0.5) * 20);
      e.phases.push(Math.random() * Math.PI * 2);
      e.verticalSpeeds.push(1 + Math.random() * 2);
      const elfColor = new THREE.Color().setHSL(0.5 + Math.random() * 0.1, 1, 0.7);
      if (mesh) mesh.setColorAt(i, elfColor);
    }
    if (mesh) mesh.instanceColor!.needsUpdate = true;
  };

  const calculateTreeShape = () => {
    const p = particlesRef.current;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const h = Math.random();
      const y = -10 + h * 22;
      const maxRadius = (1 - h) * 9 + 0.2;
      const angle = Math.random() * Math.PI * 2;
      let r;
      if (Math.random() > 0.3) {
        r = maxRadius * (0.6 + Math.random() * 0.4);
      } else {
        r = maxRadius * Math.sqrt(Math.random());
      }
      const jitter = 0.4;
      p.targetPos[i].set(
        Math.cos(angle) * r + (Math.random() - 0.5) * jitter,
        y + (Math.random() - 0.5) * jitter,
        Math.sin(angle) * r + (Math.random() - 0.5) * jitter
      );
    }
  };

  const calculateExplodeShape = () => {
    const p = particlesRef.current;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 10 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      p.explodeOffsets[i].set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      p.targetPos[i].copy(p.explodeOffsets[i]);
    }
  };

  const calculateTextShape = (text: Greeting) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const w = 400;
    const h = 200;
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';

    const len = Math.max(text.line1.length, text.line2.length);
    const fontSize = len > 6 ? 40 : 60;

    ctx.font = `bold ${fontSize}px "Times New Roman"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.line1, w / 2, h / 3);
    ctx.fillText(text.line2, w / 2, h / 1.5);

    const imgData = ctx.getImageData(0, 0, w, h).data;
    const textCoords: THREE.Vector3[] = [];
    const step = 2;

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (imgData[(y * w + x) * 4] > 128) {
          textCoords.push(new THREE.Vector3((x - w / 2) * 0.1, -(y - h / 2) * 0.1, 0));
        }
      }
    }

    const p = particlesRef.current;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (i < textCoords.length) {
        p.targetPos[i].copy(textCoords[i]);
      } else {
        const r = 30 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        p.targetPos[i].set(Math.cos(theta) * r, (Math.random() - 0.5) * 40, Math.sin(theta) * r);
      }
    }
  };

  const updateScene = () => {
    const time = Date.now() * 0.001;
    const p = particlesRef.current;
    const e = elvesRef.current;
    const mesh = particleMeshRef.current;
    const elfMesh = elfMeshRef.current;
    const camera = cameraRef.current;
    const dummy = dummyRef.current;

    if (!mesh || !camera) return;

    // Mouse Interaction
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const intersect = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(mousePlaneRef.current, intersect);
    if (intersect) mouseTargetRef.current.copy(intersect);

    if (mode === AppState.EXPLODE) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        p.targetPos[i].copy(p.explodeOffsets[i]).add(mouseTargetRef.current);
      }
    }

    // Particles Update
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const current = p.currentPos[i];
      const target = p.targetPos[i];
      current.lerp(target, p.speeds[i]);

      const floatY = Math.sin(time + current.x * 0.5) * 0.02;
      dummy.position.set(current.x, current.y + floatY, current.z);

      const twinkleAmp = mode === AppState.TREE ? 0.6 : 0.4;
      const twinkle = 1.0 + Math.sin(time * 3 + p.phases[i]) * twinkleAmp;
      dummy.scale.setScalar(twinkle);
      dummy.lookAt(camera.position);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    // Elves Update
    if (mode === AppState.TREE && elfMesh) {
      for (let i = 0; i < ELF_COUNT; i++) {
        const hSpeed = e.verticalSpeeds[i] * 0.3;
        const rSpeed = e.speeds[i];
        const h = e.heights[i] + Math.sin(time * hSpeed + e.phases[i]) * 4;
        const r = e.radii[i] + Math.sin(time * 2 + e.phases[i]) * 0.5;
        const angle = time * rSpeed + e.phases[i];

        dummy.position.set(Math.cos(angle) * r, h, Math.sin(angle) * r);
        dummy.rotation.set(time * 2, time * 2, 0);
        dummy.scale.setScalar(1.0 + Math.sin(time * 5 + e.phases[i]) * 0.3);
        dummy.updateMatrix();
        elfMesh.setMatrixAt(i, dummy.matrix);
      }
      elfMesh.instanceMatrix.needsUpdate = true;
    }

    // Global Rotation
    if (mode === AppState.TREE) {
      const autoRotate = time * 0.2;
      const mouseRotateY = mouseRef.current.x * 1.5;
      const mouseTiltX = -mouseRef.current.y * 0.5;

      mesh.rotation.y = autoRotate + mouseRotateY;
      mesh.rotation.x = mouseTiltX;

      if (starMeshRef.current) {
        starMeshRef.current.rotation.y = time * 0.5 + mouseRotateY;
        starMeshRef.current.rotation.x = mouseTiltX;
        const s = 1 + Math.sin(time * 3) * 0.2;
        starMeshRef.current.scale.set(s, s, s);
      }
      if (elfMesh) {
        elfMesh.rotation.y = mouseRotateY * 0.5;
        elfMesh.rotation.x = mouseTiltX * 0.5;
      }
    } else if (mode === AppState.EXPLODE || mode === AppState.IMAGE) {
      mesh.rotation.y = time * 0.05;
      mesh.rotation.x = 0;
    } else {
      mesh.rotation.y = 0;
      mesh.rotation.x = 0;
    }
  };

  return (
    <div 
      ref={mountRef} 
      onClick={onSceneClick}
      className="absolute top-0 left-0 w-full h-full cursor-pointer z-0" 
    />
  );
};