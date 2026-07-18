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
      className="relative h-[17rem] overflow-hidden rounded-xl bg-[#0b0a09] sm:h-[19rem]"
      role="img"
      aria-label="Interactive ASCII rendering of a rotating rubber stamp"
    >
      <div className="absolute inset-0 z-[1] sm:hidden">
        <StaticStamp />
      </div>
      <div className="hidden h-full sm:block">
        <Canvas
          camera={{ position: [3.4, 2.3, 4.2], fov: 36 }}
          dpr={[1, 1.25]}
          gl={{ antialias: false, alpha: false }}
          fallback={<StaticStamp />}
        >
          <color attach="background" args={["#060708"]} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 6, 5]} intensity={2.4} />
          <pointLight position={[-4, -2, 3]} intensity={1.2} />
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
    <group ref={group} rotation={[-0.16, -0.55, 0.08]} scale={1.08}>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.34, 0.54, 0.86, 28]} />
        <meshStandardMaterial color="#f1eee6" roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.32, 24]} />
        <meshStandardMaterial color="#f1eee6" roughness={0.58} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.62, 0.36, 1.08]} />
        <meshStandardMaterial color="#e76f51" roughness={0.65} />
      </mesh>
      <mesh position={[0, -0.38, 0]}>
        <boxGeometry args={[1.84, 0.16, 1.28]} />
        <meshStandardMaterial color="#f1eee6" roughness={0.72} />
      </mesh>
    </group>
  );
}

function AsciiPass() {
  const { gl, scene, camera, size } = useThree();
  const effect = useRef<AsciiEffect | null>(null);

  useEffect(() => {
    const ascii = new AsciiEffect(gl, ASCII_RAMP, {
      resolution: 0.18,
    });
    const element = ascii.domElement;
    const container = gl.domElement.parentElement;

    element.style.position = "absolute";
    element.style.inset = "0";
    element.style.color = "#d9d1c6";
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
      className="flex h-full items-center justify-center font-mono text-[0.7rem] leading-[0.78rem] text-foreground/80"
      aria-hidden="true"
    >
      {`          .::::.
        .========.
       :==========:
       :==========:
        '========'
           ||
      .----++----.
     :============:
     '------------'`}
    </pre>
  );
}
