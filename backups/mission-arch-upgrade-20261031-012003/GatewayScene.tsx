import { Canvas, useFrame } from "@react-three/fiber";
import { Component, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import type { GatewaySceneProps } from "./MissionScene";

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

const INK = "#111111";
const PURPLE = "#7455ff";
const LIME = "#a5d85e";
const LEAF = "#6f8a52";
const STONE = "#f8f7f4";

function shellMaterial(roughness = 0.6): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: STONE,
    roughness,
    metalness: 0.03,
    envMapIntensity: 0.4,
  });
}

function box(width: number, height: number, depth: number, roughness = 0.6) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    shellMaterial(roughness),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** The wordmark, drawn once to a canvas texture and mounted on the beam. */
function makeWordmarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 130px Inter, 'Helvetica Neue', Arial, sans-serif";

    const word = "CAMPUSCODE";
    const tracking = -6;
    const widths = [...word].map((char) => ctx.measureText(char).width);
    const total =
      widths.reduce((sum, width) => sum + width, 0) +
      tracking * (word.length - 1);

    let x = (canvas.width - total) / 2;
    for (let index = 0; index < word.length; index += 1) {
      ctx.fillText(word[index], x + widths[index] / 2, canvas.height / 2 + 4);
      x += widths[index] + tracking;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** The complete gateway: steps, podium, columns, beam, entrance, greenery. */
function buildGateway(wordmark: THREE.Texture): THREE.Group {
  const group = new THREE.Group();

  // Floor - bright, flat and far below the camera so it can never occlude it.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.92,
      metalness: 0,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  group.add(floor);

  // Five wide steps climbing towards the portal.
  for (let index = 0; index < 5; index += 1) {
    const height = (index + 1) * 0.15;
    const step = box(5.7 - index * 0.14, height, 0.62, 0.7);
    step.position.set(0, height / 2, 2.05 - index * 0.62);
    group.add(step);
  }

  // Podium the gateway stands on.
  const podium = box(5.7, 0.3, 3.6, 0.68);
  podium.position.set(0, 0.15, -0.55);
  group.add(podium);

  // Columns.
  const columnX = 1.85;
  for (const x of [columnX, -columnX]) {
    const shaft = box(0.72, 3.1, 1.1, 0.5);
    shaft.position.set(x, 1.85, -0.55);
    group.add(shaft);

    const base = box(0.95, 0.18, 1.32, 0.62);
    base.position.set(x, 0.39, -0.55);
    group.add(base);
  }

  // Lintel beam and roof slab.
  const beam = box(4.95, 0.62, 1.35, 0.48);
  beam.position.set(0, 3.7, -0.55);
  group.add(beam);

  const slab = box(5.55, 0.16, 1.8, 0.46);
  slab.position.set(0, 4.1, -0.55);
  group.add(slab);

  // Entrance: a real opening with jambs, a shadowed back wall and a restrained
  // purple light wash - architecture you could walk through, not a purple slab.
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(2.98, 2.9),
    new THREE.MeshStandardMaterial({
      color: "#2b2440",
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
  backWall.position.set(0, 2.05, -1.06);
  group.add(backWall);

  const lightWash = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 2.7),
    new THREE.MeshStandardMaterial({
      color: "#b2a2ff",
      emissive: PURPLE,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      roughness: 1,
      side: THREE.DoubleSide,
    }),
  );
  lightWash.position.set(0, 2.05, -0.98);
  group.add(lightWash);

  // Jamb returns give the opening its physical depth.
  for (const x of [1.6, -1.6]) {
    const jamb = box(0.14, 2.95, 0.95, 0.55);
    jamb.position.set(x, 2.05, -0.62);
    group.add(jamb);
  }

  // Linear light in the top of the opening.
  const portalLight = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.06, 0.06),
    new THREE.MeshStandardMaterial({
      color: "#f4f0ff",
      emissive: "#c9bcff",
      emissiveIntensity: 1.1,
      roughness: 0.4,
    }),
  );
  portalLight.position.set(0, 3.33, -0.9);
  group.add(portalLight);

  const threshold = new THREE.Mesh(
    new THREE.PlaneGeometry(2.98, 0.5),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#f0eaff",
      emissiveIntensity: 0.55,
      roughness: 0.45,
    }),
  );
  threshold.rotation.x = -Math.PI / 2;
  threshold.position.set(0, 1.02, -0.9);
  group.add(threshold);

  // Lime architectural details: a strip on each column, a line under the slab.
  for (const x of [1.52, -1.52]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 2.55, 0.05),
      new THREE.MeshStandardMaterial({
        color: LIME,
        roughness: 0.55,
        metalness: 0.08,
      }),
    );
    strip.position.set(x, 1.95, 0.06);
    strip.castShadow = true;
    group.add(strip);
  }

  const limeLine = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.05, 0.05),
    new THREE.MeshStandardMaterial({
      color: LIME,
      roughness: 0.5,
      metalness: 0.08,
    }),
  );
  limeLine.position.set(0, 3.98, 0.36);
  group.add(limeLine);

  // CampusCode wordmark integrated into the beam.
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 0.675),
    new THREE.MeshStandardMaterial({
      map: wordmark,
      transparent: true,
      alphaTest: 0.15,
      roughness: 0.45,
      metalness: 0,
    }),
  );
  sign.position.set(0, 3.7, 0.19);
  group.add(sign);

  // Restrained planting: two clipped hedges and two young trees.
  const hedgeMaterial = new THREE.MeshStandardMaterial({
    color: LEAF,
    roughness: 1,
    metalness: 0,
  });

  for (const x of [3.0, -3.0]) {
    const hedge = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.52, 0.95),
      hedgeMaterial,
    );
    hedge.position.set(x, 0.26, 1.7);
    hedge.castShadow = true;
    hedge.receiveShadow = true;
    group.add(hedge);
  }

  for (const x of [4.3, -4.3]) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.095, 1.25, 10),
      new THREE.MeshStandardMaterial({ color: "#8d8477", roughness: 0.95 }),
    );
    trunk.position.set(x, 0.62, -1.2);
    trunk.castShadow = true;
    group.add(trunk);

    const canopy = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.6, 1),
      new THREE.MeshStandardMaterial({
        color: "#74915a",
        roughness: 1,
        metalness: 0,
        flatShading: true,
      }),
    );
    canopy.position.set(x, 1.55, -1.2);
    canopy.castShadow = true;
    group.add(canopy);
  }

  return group;
}

/**
 * A failed WebGL context must never blank the site: if the Canvas throws, this
 * boundary swaps in a flat white mount instead of unmounting the whole tree.
 */
class GatewayErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[mission] WebGL gateway unavailable - flat fallback.", error);
  }

  render() {
    return this.state.failed ? (
      <div className="mission-scene-fallback" aria-hidden="true" />
    ) : (
      this.props.children
    );
  }
}

export function GatewayScene({
  progress = 0,
  reducedMotion = false,
}: GatewaySceneProps) {
  return (
    <GatewayErrorBoundary>
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [0, 3.1, 11.8], fov: 38, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <GatewayStructure progress={progress} reducedMotion={reducedMotion} />
      </Canvas>
    </GatewayErrorBoundary>
  );
}

function GatewayStructure({ progress = 0, reducedMotion = false }: GatewaySceneProps) {
  const wordmark = useMemo(() => makeWordmarkTexture(), []);
  const structure = useMemo(() => buildGateway(wordmark), [wordmark]);

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta ?? 0);

    // Reduced motion: hold the settled, correctly framed position.
    const t = reducedMotion ? 1 : easeOutCubic(clamp01(progress));
    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = state.viewport.aspect || 1;
    // Narrow mounts need a little more distance to keep the whole portal in frame.
    const widen = aspect < 1.35 ? 1.18 : 1;

    const targetZ = lerp(11.8, 8.05, t) * widen;
    const targetY = lerp(3.1, 2.35, t);
    const targetX = Math.sin(state.clock.elapsedTime * 0.45) * 0.1;

    camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 2.2);
    camera.position.y += (targetY - camera.position.y) * Math.min(1, dt * 3);
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, dt * 3);
    camera.lookAt(0, 1.8, -0.55);
  });

  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      {/* Fog dissolves the far floor into the white studio background so no
          grey horizon band cuts across the composition. */}
      <fog attach="fog" args={["#ffffff", 14, 38]} />

      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#ffffff", "#ece9e2", 1.1]} />

      <directionalLight
        position={[7, 12, 9]}
        intensity={1.6}
        color="#fffdf8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={8}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-8, 6, 5]} intensity={0.5} color="#f3eeff" />

      {/* Purple light inside the entrance, lime light grazing the beam. */}
      <pointLight position={[0, 3.0, -0.95]} intensity={4.5} distance={4.2} color={PURPLE} />
      <pointLight position={[0, 4.2, 0.8]} intensity={1.4} distance={5} color={LIME} />

      <primitive object={structure} />
    </>
  );
}
