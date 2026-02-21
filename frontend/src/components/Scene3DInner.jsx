/**
 * Scene3DInner.jsx
 * ----------------
 * The actual react-three-fiber canvas scene.
 * Lazy-loaded from ThreeDParallaxHero to keep the initial bundle small.
 *
 * Scene: a softly illuminated floating torus knot + sphere that
 * rotate slowly and tilt toward the user's mouse pointer.
 */
import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';

/** Floating geometry that responds to pointer position */
function FloatingMesh() {
  const meshRef = useRef();
  const pointer = useThree((s) => s.pointer); // normalised [-1, 1]

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    // Slow auto-rotation
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.25;
    // Subtle parallax tilt toward pointer
    meshRef.current.rotation.x = pointer.y * 0.18;
    meshRef.current.rotation.z = -pointer.x * 0.10;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <meshStandardMaterial
          color="#2563eb"
          emissive="#1d4ed8"
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      role="img"
      aria-label="Decorative 3D parallax animation"
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#60a5fa" />
      <pointLight position={[-4, -4, 2]} intensity={0.8} color="#818cf8" />

      {/* Background stars (drei) */}
      <Stars radius={80} depth={50} count={800} factor={3} saturation={0} fade speed={0.5} />

      {/* Scene geometry */}
      <FloatingMesh />
    </Canvas>
  );
}
