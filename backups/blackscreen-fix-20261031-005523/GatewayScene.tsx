import { useFrame, useThree } from '@react-three/fiber';
import type { GatewaySceneProps } from "./MissionScene";
import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type {} from 'three';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Gentle ease-out, used to start each reveal slightly before the user reaches it. */
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

// ---------------------------------------------------------------------------
// Shared concrete texture. Micro-noise keeps the "white architectural concrete"
// from reading as flat white on a WebGL surface.
// ---------------------------------------------------------------------------

function makeConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const image = ctx.createImageData(512, 512);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = 58 + Math.random() * 104; // 58..162, grey/concrete
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.6, 1.6);
  texture.anisotropy = 4;
  return texture;
}

const CONCRETE = makeConcreteTexture();

function concreteMaterial(options: {
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  color?: string;
}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: CONCRETE,
    color: options.color ?? '#f5f3ef',
    roughness: options.roughness ?? 0.42,
    metalness: options.metalness ?? 0.04,
    emissive: options.emissive ?? 'rgba(0,0,0,0)',
    emissiveIntensity: options.emissiveIntensity ?? 0,
    envMapIntensity: 0.55,
  });
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** A single white, bevelled architectural step. */
function buildStep(width: number, height: number): THREE.Mesh {
  const shape = new THREE.Shape();
  const r = 0.024;
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);

  shape.quadraticCurveTo(width / 2 + r, -height / 2, width / 2, -height / 2 + r);
  shape.lineTo(width / 2, height / 2 - r);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - r, height / 2);
  shape.lineTo(-width / 2 + r, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - r);
  shape.lineTo(-width / 2, -height / 2);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + r, -height / 2);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.026,
    bevelSize: 0.02,
    bevelSegments: 8,
  });
  geo.translate(0, 0, -0.17);
  const mat = concreteMaterial({
    roughness: 0.36,
    metalness: 0.05,
    emissive: 'rgba(165,216,94,0.04)',
    emissiveIntensity: 0.6,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

/** A bevelled architectural keystone. */
function buildKeystone(): THREE.Mesh {
  const shape = new THREE.Shape();
  const w = 1.45,
    h = 0.56;
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.quadraticCurveTo(w / 2 + 0.06, 0, w / 2, h / 2);
  shape.lineTo(-w / 2, h / 2);
  shape.quadraticCurveTo(-w / 2 - 0.06, 0, -w / 2, -h / 2);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 8,
  });
  geo.translate(0, 0, -0.07);
  const mat = concreteMaterial({ roughness: 0.3, metalness: 0.06 });
  mat.color.setHex(0xfefefe);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

/** Two bevelled "C" letters forming the CampusCode monogram. */
function buildBrandMark(): THREE.Group {
  const group = new THREE.Group();

  const makeC = (base: number): THREE.Mesh => {
    const shape = new THREE.Shape();
    const w = 0.92,
      h = 0.86;
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(base * w / 2, -h / 2);
    shape.quadraticCurveTo(base * w / 2 + 0.03, -h / 2, base * w / 2, -h / 2 + 0.03);
    shape.lineTo(base * w / 2, h / 2 - 0.03);
    shape.quadraticCurveTo(base * w / 2, h / 2, base * w / 2 - 0.03, h / 2);
    shape.lineTo(-w / 2 + 0.03, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 0.03);
    shape.lineTo(-w / 2, -h / 2);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 0.03, -h / 2);
    shape.closePath();

    const hole = new THREE.Path();
    const inner = 0.62;
    hole.moveTo(-inner, -h / 2);
    hole.lineTo(inner, -h / 2);
    hole.quadraticCurveTo(inner + 0.02, -h / 2, inner, -h / 2 + 0.02);
    hole.lineTo(inner, h / 2 - 0.02);
    hole.quadraticCurveTo(inner, h / 2, inner - 0.02, h / 2);
    hole.lineTo(-inner + 0.02, h / 2);
    hole.quadraticCurveTo(-inner, h / 2, -inner, h / 2 - 0.02);
    hole.lineTo(-inner, -h / 2);
    hole.quadraticCurveTo(-inner, -h / 2, -inner + 0.02, -h / 2);
    hole.closePath();
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.13,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 8,
    });
    geo.translate(0, 0, -0.065);
    const mat = concreteMaterial({ roughness: 0.34, metalness: 0.05 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    return mesh;
  };

  const cL = makeC(-1).clone() as THREE.Mesh;
  const cR = makeC(+1).clone() as THREE.Mesh;
  cL.position.x = -0.72;
  cR.position.x = 0.72;
  group.add(cL, cR);

  // Vertical divider between the C's.
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.86, 0.1),
    concreteMaterial({ roughness: 0.32, metalness: 0.06 }),
  );
  bar.position.x = 0;
  bar.castShadow = true;
  group.add(bar);

  return group;
}

// ---------------------------------------------------------------------------
// Scene assembly
// ---------------------------------------------------------------------------

// GatewayScene (controller) — renders the mount div. Receives progress and
// hands it to the scene component via prop; the scene itself owns the R3F
// context and the useFrame/useThree hooks live inside the <Canvas> so they are
// valid (R3F forbids calling useFrame/useThree outside a Canvas).
export function GatewayScene({ progress = 0, reducedMotion = false }: GatewaySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GatewaySceneScene progress={progress} reducedMotion={reducedMotion} />
    </div>
  );
}

/** The 3D gateway mount rendered INSIDE the <Canvas>. useThree/useFrame are
 * valid here because they run within the Canvas's React context. */
function GatewaySceneScene({ progress = 0, reducedMotion = false }: GatewaySceneProps) {
  const gatewayRef = useRef<THREE.Group>(null);

  // ---- animation loop (runs inside Canvas) ----

  useFrame((_state, delta) => {
    const t = _state.clock.elapsedTime;
    const g = gatewayRef.current;
    if (!g) return;

    const s = easeOutCubic(clamp01(progress));
    const dt = Math.min(0.05, delta ?? 0);

    // Structure: breathes and steps gently forward / up as the gateway centres.
    // When reduced motion is active, hold the structure static.
    const yTarget = reducedMotion ? g.position.y : lerp(0.04, 0.26, s);
    const zTarget = reducedMotion ? g.position.z : lerp(-1.4, 0, s);
    g.position.x = reducedMotion ? 0 : Math.sin(t * 0.8) * 0.014;
    g.position.y += (yTarget - g.position.y) * Math.min(1, dt * 5);
    g.position.z += (zTarget - g.position.z) * Math.min(1, dt * 5);

    // Camera approaches the structure from a low angle, guiding the eye in.
    // When reduced motion is active, hold the camera static.
    const { camera } = useThree();
    if (camera) {
      const camZ = reducedMotion ? camera.position.z : lerp(4.8, 2.5, s);
      const camY = reducedMotion ? camera.position.y : lerp(0.12, 1.05, s);
      const camRotX = reducedMotion ? camera.rotation.x : lerp(0, -0.16, s);
      camera.position.x += (Math.sin(t * 0.6) * 0.03 - camera.position.x) * Math.min(1, dt * 4);
      camera.position.y += (camY - camera.position.y) * Math.min(1, dt * 5);
      camera.position.z += (camZ - camera.position.z) * Math.min(1, dt * 5);
      camera.rotation.x += (camRotX - camera.rotation.x) * Math.min(1, dt * 4);
      camera.lookAt(0, 0, 0);
    }
  });

  // ---- scene ----

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 4.8], fov: 46, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <group ref={gatewayRef}>
          <primitive object={buildGateway()} />

          <ambientLight intensity={0.55} />

          {/* Main studio sky light — bright, directional, from the "studio window". */}
          <directionalLight
            position={[9, 14, 5]}
            intensity={1.35}
            color="#f7f6f1"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={12}
            shadow-camera-bottom={-12}
          />

          {/* Fill from the opposite side for outlook balance. */}
          <directionalLight position={[-6, 5, -8]} intensity={0.45} color="#efeaff" />

          {/* Purple accent wall-light behind the arch face. */}
          <directionalLight
            position={[-2, 4, 7]}
            intensity={0.16}
            color="#7455ff"
            castShadow
            shadow-mapSize={[512, 512]}
          />

          {/* Subtle lime accent down the centre of the lintel. */}
          <pointLight position={[0, 3.6, -1.4]} intensity={0.35} color="#a5d85e" />

          {/* Ground plane + contact shadow under the steps. */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[22, 22]} />
            <meshStandardMaterial color="#ffffff" roughness={0.78} metalness={0.01} envMapIntensity={0.1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[16, 16]} />
            <meshStandardMaterial
              color="#232321"
              roughness={1}
              metalness={0}
              transparent
              opacity={0.22}
            />
          </mesh>
        </group>
      </Canvas>
    </div>
  );
}

/** Builds every gateway mesh as a standalone `<group>`. */
function buildGateway(): THREE.Group {
  const group = new THREE.Group();

  // ---------------------------------------------------------------
  // Steps leading up to the gateway (ramp of wide, elegant steps).
  // ---------------------------------------------------------------
  const stepCount = 4;
  const stepWidth = 12.4;
  const stepRise = 0.24;
  for (let i = 0; i < stepCount; i++) {
    const step = buildStep(stepWidth, stepRise);
    const y = -0.22 + i * stepRise;
    step.position.y = y;
    group.add(step);
  }

  // ---------------------------------------------------------------
  // Ground plane under the steps (concrete).
  // ---------------------------------------------------------------
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(12.8, 0.14, 4.2),
    concreteMaterial({ roughness: 0.45, metalness: 0.05 }),
  );
  ground.position.y = -0.03;
  ground.receiveShadow = true;
  group.add(ground);

  // ---------------------------------------------------------------
  // Arch columns (left + right of the portal).
  // ---------------------------------------------------------------
  const columnX = 4.75;
  const column = (x: number) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 3.45, 1.2),
      concreteMaterial({ roughness: 0.4, metalness: 0.05 }),
    );
    m.position.set(x, 1.7, 0);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);

    // Column capital (top edging) — white, fluted.
    const capital = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.14, 1.2),
      concreteMaterial({ roughness: 0.32, metalness: 0.06 }),
    );
    capital.position.y = 3.46;
    capital.castShadow = true;
    group.add(capital);

    // Column base.
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.14, 1.2),
      concreteMaterial({ roughness: 0.45, metalness: 0.05 }),
    );
    base.position.y = -0.14;
    base.castShadow = true;
    group.add(base);
    return m;
  };
  column(columnX);
  column(-columnX);

  // ---------------------------------------------------------------
  // Lintel (the arch's top beam).
  // ---------------------------------------------------------------
  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(13.0, 0.26, 0.26),
    concreteMaterial({ roughness: 0.38, metalness: 0.05 }),
  );
  lintel.position.set(0, 3.53, 0);
  lintel.castShadow = true;
  lintel.receiveShadow = true;
  group.add(lintel);

  // Lintel edge highlight (raised bevel strip, white).
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(13.04, 0.05, 0.32),
    concreteMaterial({ roughness: 0.28, metalness: 0.08, color: '#ffffff' }),
  );
  edge.position.set(0, 3.66, 0.075);
  edge.castShadow = true;
  group.add(edge);

  // ---------------------------------------------------------------
  // Keystone.
  // ---------------------------------------------------------------
  const keystone = buildKeystone();
  keystone.position.set(0, 3.89, 0);
  keystone.castShadow = true;
  group.add(keystone);

  // ---------------------------------------------------------------
  // Portal face (the arch's interior moulding) — adds depth to the opening.
  // ---------------------------------------------------------------
  const portal = new THREE.Mesh(
    new THREE.BoxGeometry(13.0, 0.024, 0.02),
    concreteMaterial({ roughness: 0.3, metalness: 0.04, color: '#efeaf1' }),
  );
  portal.position.set(0, 3.56, 0);
  group.add(portal);

  // ---------------------------------------------------------------
  // Vertical accent strips: purple (to the left) and lime (to the right).
  // ---------------------------------------------------------------
  const purple = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 3.45, 0.1),
    concreteMaterial({ roughness: 0.3, metalness: 0.1, color: '#7455ff' }),
  );
  purple.position.set(-columnX + 0.06, 1.7, 0.62);
  purple.castShadow = true;
  group.add(purple);

  const lime = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 3.45, 0.1),
    concreteMaterial({ roughness: 0.3, metalness: 0.1, color: '#a5d85e' }),
  );
  lime.position.set(columnX - 0.06, 1.7, 0.62);
  lime.castShadow = true;
  group.add(lime);

  // ---------------------------------------------------------------
  // Centre lime flourish down the lintel.
  // ---------------------------------------------------------------
  const centre = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.26, 0.06),
    concreteMaterial({ roughness: 0.3, metalness: 0.1, color: '#a5d85e' }),
  );
  centre.position.set(0, 3.53, 0.08);
  centre.castShadow = true;
  group.add(centre);

  // ---------------------------------------------------------------
  // CampusCode brand mark, integrated into the lintel.
  // ---------------------------------------------------------------
  const brand = buildBrandMark();
  brand.position.set(0, 3.66, 0);
  brand.scale.set(0.55, 0.55, 0.55);
  group.add(brand);

  // ---------------------------------------------------------------
  // Portal mouth: translucent threshold plane + soft mouth glow.
  // ---------------------------------------------------------------
  const threshold = new THREE.Mesh(
    new THREE.PlaneGeometry(3.7, 4.6),
    new THREE.MeshStandardMaterial({
      color: '#f4f4ee',
      roughness: 0.28,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      envMapIntensity: 0.5,
      depthWrite: false,
    }),
  );
  threshold.rotation.x = -Math.PI / 2;
  threshold.position.set(0, 0.06, 0.02);
  group.add(threshold);

  const mouthGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.3, 0.16, 24, 1, true),
    new THREE.MeshStandardMaterial({
      color: '#7455ff',
      transparent: true,
      opacity: 0.3,
      emissive: '#7455ff',
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  mouthGlow.rotation.x = -Math.PI / 2;
  mouthGlow.position.set(0, 0.0, 0.02);
  group.add(mouthGlow);

  return group;
}
