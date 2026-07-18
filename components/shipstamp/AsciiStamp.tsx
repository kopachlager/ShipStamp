"use client";

import { useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Group } from "three";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect.js";

const ASCII_RAMP = "@80GCLft1i;:,. ";

export function AsciiStamp() {
  return (
    <figure
      className="relative h-[22rem] overflow-hidden rounded-2xl bg-[#020304] sm:h-[30rem] lg:h-[34rem]"
      role="img"
      aria-label="Interactive ASCII rendering of a rotating rubber stamp"
    >
      <div className="absolute inset-0 z-[1] sm:hidden">
        <StaticStamp />
      </div>
      <div className="hidden h-full sm:block">
        <Canvas
          camera={{ position: [2.7, 1.8, 3.35], fov: 32 }}
          dpr={[1, 1.25]}
          gl={{ antialias: false, alpha: false }}
          fallback={<StaticStamp />}
        >
          <color attach="background" args={["#060708"]} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 6, 5]} intensity={2.4} />
          <pointLight position={[-4, -2, 3]} intensity={1.2} />
          <CommitGraph />
          <StampObject />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={(Math.PI * 2) / 3}
          />
          <AsciiPass />
        </Canvas>
      </div>
    </figure>
  );
}

function CommitGraph() {
  return (
    <group position={[-1.45, 0.1, -0.85]} rotation={[0.08, -0.08, 0]}>
      <mesh>
        <cylinderGeometry args={[0.025, 0.025, 3.7, 8]} />
        <meshStandardMaterial color="#66727b" roughness={0.7} />
      </mesh>
      <mesh position={[0.42, 0.78, 0]} rotation={[0, 0, -0.72]}>
        <cylinderGeometry args={[0.025, 0.025, 1.18, 8]} />
        <meshStandardMaterial color="#66727b" roughness={0.7} />
      </mesh>
      <mesh position={[0.84, 1.24, 0]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial
          color="#c8ff3d"
          emissive="#6d8e10"
          emissiveIntensity={0.35}
        />
      </mesh>
      {[-1.5, -0.76, 0, 0.76, 1.5].map((position, index) => (
        <mesh key={position} position={[0, position, 0]}>
          <sphereGeometry args={[index === 2 ? 0.13 : 0.09, 12, 12]} />
          <meshStandardMaterial
            color={index === 2 ? "#c8ff3d" : "#d8e0e5"}
            emissive={index === 2 ? "#6d8e10" : "#000000"}
            emissiveIntensity={index === 2 ? 0.4 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

function StampObject() {
  const group = useRef<Group>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useFrame((state, delta) => {
    if (!group.current || reduceMotion) return;
    group.current.rotation.y += delta * 0.28;
    group.current.rotation.x =
      -0.16 + Math.sin(state.clock.elapsedTime * 0.45) * 0.05;
  });

  return (
    <group ref={group} rotation={[-0.16, -0.55, 0.08]} scale={1.3}>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.34, 0.54, 0.86, 28]} />
        <meshStandardMaterial color="#f4f7f5" roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.32, 24]} />
        <meshStandardMaterial color="#f4f7f5" roughness={0.58} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.62, 0.36, 1.08]} />
        <meshStandardMaterial color="#c8ff3d" roughness={0.65} />
      </mesh>
      <mesh position={[0, -0.38, 0]}>
        <boxGeometry args={[1.84, 0.16, 1.28]} />
        <meshStandardMaterial color="#f4f7f5" roughness={0.72} />
      </mesh>
    </group>
  );
}

function AsciiPass() {
  const { gl, scene, camera, size } = useThree();
  const effect = useRef<AsciiEffect | null>(null);

  useEffect(() => {
    const ascii = new AsciiEffect(gl, ASCII_RAMP, {
      resolution: 0.14,
    });
    const element = ascii.domElement;
    const container = gl.domElement.parentElement;

    element.style.position = "absolute";
    element.style.inset = "0";
    element.style.color = "#c8ff3d";
    element.style.backgroundColor = "#060708";
    element.style.pointerEvents = "none";
    element.style.fontFamily = '"IBM Plex Mono", monospace';
    element.style.fontSize = "8px";
    element.style.lineHeight = "7px";
    element.style.letterSpacing = "0";
    element.setAttribute("aria-hidden", "true");

    if (container) {
      container.appendChild(element);
    }
    effect.current = ascii;

    return () => {
      effect.current = null;
      element.remove();
    };
  }, [gl]);

  useEffect(() => {
    effect.current?.setSize(size.width, size.height);
  }, [size.height, size.width]);

  useFrame(() => {
    effect.current?.render(scene, camera);
  }, 1);

  return null;
}

function StaticStamp() {
  return (
    <pre
      className="flex h-full items-center justify-center font-mono text-[0.82rem] leading-[0.9rem] text-primary"
      aria-hidden="true"
    >
      {`         .::::::::.
       .==========.
      :============:
      :============:
       '=========='
           ||
     .-----++-----.
    :  SHIPSTAMP   :
    '=============='`}
    </pre>
  );
}
