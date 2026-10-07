import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { createAnimationLoop } from '../utils/animation-loop';

const VectorSodaCan = ({ isPlaying, currentSong, audioAnalyser }) => {
  const shouldReduceMotion = useReducedMotion();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const canRef = useRef(null);
  const liquidRef = useRef(null);
  const bubblesRef = useRef(null);
  const loopRef = useRef(null);
  const initialColor = useRef(currentSong.color);
  const dataArrayRef = useRef(new Uint8Array(0));
  const isPlayingRef = useRef(isPlaying);
  const analyserRef = useRef(audioAnalyser);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    analyserRef.current = audioAnalyser;
    if (audioAnalyser && dataArrayRef.current.length !== audioAnalyser.frequencyBinCount) {
      dataArrayRef.current = new Uint8Array(audioAnalyser.frequencyBinCount);
    }
    loopRef.current?.invalidate();
  }, [isPlaying, audioAnalyser]);

  useEffect(() => {
    liquidRef.current?.material.color.set(currentSong.color);
    loopRef.current?.invalidate();
  }, [currentSong.color]);

  // Helper to create outlines
  const createOutline = (geometry, color = 0x000000, thresholdAngle = 15) => {
    const edges = new THREE.EdgesGeometry(geometry, thresholdAngle);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: color, linewidth: 2 }) // linewidth is mostly ignored by WebGL, but good intent
    );
    return line;
  };

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const width = mountNode.clientWidth;
    const height = mountNode.clientHeight;

    // --- SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    // カメラ位置を調整して、パースを少し弱め、アイソメトリックに近い雰囲気に
    camera.position.set(0, 1, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountNode.appendChild(renderer.domElement);

    sceneRef.current = { scene, camera, renderer };

    // --- LIGHTING (FLAT / NO SHADOWS NEEDED FOR BASIC MAT, BUT ADDING FOR SAFETY) ---
    // 基本的にMeshBasicMaterialを使うのでライティングは影響しないが、念のため
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // --- CREATE CAN GROUP ---
    const canGroup = new THREE.Group();
    scene.add(canGroup);
    canRef.current = canGroup;

    // Common Geometry Settings
    const SEGMENTS = 32;

    // 1. LIQUID (中身)
    // ベタ塗り + アウトライン
    const liquidColor = new THREE.Color(initialColor.current);
    const liquidGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.4, SEGMENTS);
    liquidGeo.translate(0, 0.7, 0); // Pivot at bottom

    const liquidMat = new THREE.MeshBasicMaterial({
      color: liquidColor,
      transparent: true,
      opacity: 0.8, // 少し透けさせて後ろの線を見せる
      side: THREE.DoubleSide,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = -1.4;

    // Liquid Outline
    const liquidOutline = createOutline(liquidGeo, 0x000000, 10);
    liquidMesh.add(liquidOutline);

    canGroup.add(liquidMesh);
    liquidRef.current = liquidMesh;


    // 2. SHELL (外側の容器)
    // 透明なガラス感ではなく、白いワイヤーフレーム的な表現にする
    const shellGeo = new THREE.CylinderGeometry(0.9, 0.9, 3.0, SEGMENTS, 1, true);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false // 中身が透けて見えるように
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);

    // Main Outline (The Can Shape)
    // 角度の閾値を調整して、縦の線が出ないようにし、上下の円だけ線を出す
    const shellOutline = createOutline(shellGeo, 0x000000, 80);
    shellMesh.add(shellOutline);

    // 側面の縦線を2本だけ追加してイラスト感を出す
    const sideLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.9, 1.5, 0), new THREE.Vector3(-0.9, -1.5, 0),
        new THREE.Vector3(0.9, 1.5, 0), new THREE.Vector3(0.9, -1.5, 0)
    ]);
    const sideLines = new THREE.LineSegments(sideLineGeo, new THREE.LineBasicMaterial({ color: 0x000000 }));
    shellMesh.add(sideLines);

    canGroup.add(shellMesh);


    // 3. RIMS (上下のフチ)
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White flat

    // Top Rim
    const topRimGeo = new THREE.TorusGeometry(0.9, 0.05, 8, SEGMENTS);
    const topRim = new THREE.Mesh(topRimGeo, rimMat);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = 1.5;
    topRim.add(createOutline(topRimGeo, 0x000000, 40));
    canGroup.add(topRim);

    // Bottom Rim
    const bottomRimGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.1, SEGMENTS);
    const bottomRim = new THREE.Mesh(bottomRimGeo, rimMat);
    bottomRim.position.y = -1.5;
    bottomRim.add(createOutline(bottomRimGeo, 0x000000, 40));
    canGroup.add(bottomRim);

    // 4. TAB (プルタブ)
    const tabGeo = new THREE.BoxGeometry(0.3, 0.02, 0.5);
    const tabMesh = new THREE.Mesh(tabGeo, rimMat);
    tabMesh.position.set(0, 1.52, 0);
    tabMesh.add(createOutline(tabGeo, 0x000000, 1)); // Boxは全部線を描く
    canGroup.add(tabMesh);


    // --- BUBBLES (Vector Dots) ---
    // Canvasで丸いテクスチャを動的に生成（綺麗な黒縁取りの円）
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    const dotTexture = new THREE.CanvasTexture(canvas);

    const particlesCount = 40; // 少なくして目立たせる
    const posArray = new Float32Array(particlesCount * 3);
    const speedArray = new Float32Array(particlesCount);

    for(let i = 0; i < particlesCount; i++) {
        const r = Math.random() * 0.6;
        const theta = Math.random() * Math.PI * 2;
        posArray[i * 3] = r * Math.cos(theta);
        posArray[i * 3 + 1] = -1.4 + Math.random() * 2.0;
        posArray[i * 3 + 2] = r * Math.sin(theta);
        speedArray[i] = 0.02 + Math.random() * 0.05;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speedArray, 1));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.25, // 大きめのドット
        map: dotTexture,
        transparent: true,
        alphaTest: 0.5,
        sizeAttenuation: true
    });

    const bubbles = new THREE.Points(particlesGeo, particlesMat);
    canGroup.add(bubbles);
    bubblesRef.current = bubbles;

    if (analyserRef.current) {
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }

    // --- ANIMATION LOOP ---
    const animate = (elapsed) => {
      const step = elapsed / (1000 / 60);
      if (!mountRef.current) return;
      const time = Date.now() * 0.001;

      // Audio Data
      let kick = 0;
      const activeAnalyser = analyserRef.current;
      if (isPlayingRef.current && activeAnalyser) {
          activeAnalyser.getByteFrequencyData(dataArrayRef.current);
          let bassSum = 0;
          for (let i = 0; i < 10; i++) bassSum += dataArrayRef.current[i];
          kick = (bassSum / 10) / 255;
      }
      const effectiveKick = Math.max(0, (kick - 0.3) * 1.5);

      // 1. Liquid Bounce (Cartoon physics)
      if (liquidRef.current) {
          const targetScale = 1.0 + effectiveKick * 0.8;
          liquidRef.current.scale.y += (targetScale - liquidRef.current.scale.y) * 0.2;
      }

      // 2. Bubbles
      const positions = bubbles.geometry.attributes.position.array;
      const speeds = bubbles.geometry.attributes.aSpeed.array;

      for(let i = 0; i < particlesCount; i++) {
          let y = positions[i * 3 + 1];
          y += (speeds[i] * (isPlayingRef.current ? 2.0 : 1.0) + effectiveKick * 0.1) * step;

          if (y > 1.2) {
              y = -1.4;
              const r = Math.random() * 0.6;
              const theta = Math.random() * Math.PI * 2;
              positions[i * 3] = r * Math.cos(theta);
              positions[i * 3 + 2] = r * Math.sin(theta);
          }
          positions[i * 3 + 1] = y;
      }
      bubbles.geometry.attributes.position.needsUpdate = true;

      // 3. Can Motion
      canGroup.rotation.y += 0.005 * step;
      // 傾きを少し大げさにしてイラストっぽく
      canGroup.rotation.z = Math.sin(time * 2) * 0.05 + (effectiveKick * 0.1);
      canGroup.position.y = Math.sin(time * 1.5) * 0.1;

      renderer.render(scene, camera);

    };

    const loop = createAnimationLoop(animate, {
      element: mountNode,
      active: () => !shouldReduceMotion,
      fps: () => isPlayingRef.current ? 60 : 12,
    });
    loopRef.current = loop;

    const handleResize = () => {
      if (!mountRef.current) return;
      const nextWidth = mountRef.current.clientWidth;
      const nextHeight = mountRef.current.clientHeight;
      if (!nextWidth || !nextHeight) return;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      loop.invalidate();
    };
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(handleResize)
      : null;
    resizeObserver?.observe(mountNode);
    if (!resizeObserver) window.addEventListener('resize', handleResize);

    return () => {
      loop.dispose();
      loopRef.current = null;
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener('resize', handleResize);
      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }
      const disposedGeometries = new Set();
      const disposedMaterials = new Set();
      scene.traverse(object => {
        if (object.geometry && !disposedGeometries.has(object.geometry)) {
          disposedGeometries.add(object.geometry);
          object.geometry.dispose();
        }
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach(material => {
          if (disposedMaterials.has(material)) return;
          disposedMaterials.add(material);
          Object.values(material).forEach(value => {
            if (value?.isTexture) value.dispose();
          });
          material.dispose();
        });
      });
      dotTexture.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      scene.clear();
      sceneRef.current = null;
      canRef.current = null;
      liquidRef.current = null;
      bubblesRef.current = null;
    };
  }, [shouldReduceMotion]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default VectorSodaCan;
