import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, type ReactNode } from "react";
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

/* --------------------------------------------------------------------------
 * Procedural surfaces. Everything is generated locally: no downloads, and the
 * concrete/paving read as real material instead of flat colour.
 * ------------------------------------------------------------------------ */

function concreteTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#f7f6f2";
    ctx.fillRect(0, 0, size, size);

    const image = ctx.getImageData(0, 0, size, size);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 15;
      data[i] = Math.max(0, Math.min(255, data[i] + grain));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
    }
    ctx.putImageData(image, 0, 0);

    // Fair-faced concrete formwork joints.
    ctx.strokeStyle = "rgba(17, 17, 17, 0.055)";
    ctx.lineWidth = 1;
    for (let y = 64; y < size; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function pavingTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#f4f3ef";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(17, 17, 17, 0.10)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (let i = 0; i < 900; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Soft purple wash used inside the entrance. */
function glowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size * 0.42,
      8,
      size / 2,
      size * 0.42,
      size * 0.62,
    );
    gradient.addColorStop(0, "rgba(116, 85, 255, 0.55)");
    gradient.addColorStop(0.45, "rgba(116, 85, 255, 0.22)");
    gradient.addColorStop(1, "rgba(116, 85, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** The wordmark, drawn once to a canvas texture and mounted on the beam. */
function wordmarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 132px Inter, 'Helvetica Neue', Arial, sans-serif";

    const word = "CAMPUSCODE";
    const tracking = -4;
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
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/* --------------------------------------------------------------------------
 * Geometry helpers
 * ------------------------------------------------------------------------ */

/** A slab with a rounded front profile and bevelled extrusion edges. */
function slabGeometry(
  width: number,
  height: number,
  depth: number,
  radius = 0.035,
  bevel = 0.012,
): THREE.ExtrudeGeometry {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w * 0.4, h * 0.4);

  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function slab(
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  radius = 0.035,
  bevel = 0.012,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    slabGeometry(width, height, depth, radius, bevel),
    material,
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A natural-looking tree: tapered trunk plus several uneven foliage clusters. */
function buildTree(
  foliage: THREE.MeshStandardMaterial[],
  bark: THREE.MeshStandardMaterial,
  height: number,
): THREE.Group {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.16, height * 0.8, 12, 3),
    bark,
  );
  trunk.position.y = height * 0.4;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const clusterCount = 10;
  for (let index = 0; index < clusterCount; index += 1) {
    const radius = 0.3 + Math.random() * 0.22;
    const cluster = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 2),
      foliage[index % foliage.length],
    );
    const angle = (index / clusterCount) * Math.PI * 2 + Math.random() * 0.7;
    const spread = index === 0 ? 0 : 0.26 + Math.random() * 0.34;
    cluster.position.set(
      Math.cos(angle) * spread,
      height * 0.7 + Math.random() * 0.45 + (index === 0 ? 0.18 : 0),
      Math.sin(angle) * spread,
    );
    cluster.scale.set(1, 0.84 + Math.random() * 0.2, 1);
    cluster.castShadow = true;
    cluster.receiveShadow = true;
    tree.add(cluster);
  }

  return tree;
}

/* --------------------------------------------------------------------------
 * Scene
 * ------------------------------------------------------------------------ */

function buildScene(): {
  group: THREE.Group;
  concrete: THREE.MeshStandardMaterial;
  paving: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial[];
} {
  const group = new THREE.Group();

  const concreteMap = concreteTexture();
  const pavingMap = pavingTexture();
  const glowMap = glowTexture();
  const wordmark = wordmarkTexture();

  const concrete = new THREE.MeshStandardMaterial({
    map: concreteMap,
    color: "#f1eee6",
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.45,
  });

  const concreteMatte = new THREE.MeshStandardMaterial({
    map: concreteMap,
    color: "#eae6dc",
    roughness: 0.66,
    metalness: 0.02,
    envMapIntensity: 0.35,
  });

  const paving = new THREE.MeshStandardMaterial({
    map: pavingMap,
    color: "#efece4",
    roughness: 0.26,
    metalness: 0.1,
    envMapIntensity: 0.9,
  });

  const stepMaterial = new THREE.MeshStandardMaterial({
    map: concreteMap,
    color: "#e4dfd4",
    roughness: 0.62,
    metalness: 0.02,
    envMapIntensity: 0.3,
  });

  const limeMaterial = new THREE.MeshStandardMaterial({
    color: "#a5d85e",
    roughness: 0.5,
    metalness: 0.05,
  });

  const purpleMaterial = new THREE.MeshStandardMaterial({
    color: "#7455ff",
    emissive: "#7455ff",
    emissiveIntensity: 0.6,
    roughness: 0.8,
  });

  /* --- polished campus floor ------------------------------------------- */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), paving);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  /* --- podium + steps --------------------------------------------------- */
  const podium = slab(9.4, 0.32, 4.8, concrete, 0.05, 0.016);
  podium.position.set(0, 0.16, -0.4);
  group.add(podium);

  const stepCount = 6;
  for (let index = 0; index < stepCount; index += 1) {
    const height = (index + 1) * 0.16;
    const step = slab(8.5 - index * 0.22, height, 0.56, stepMaterial, 0.03, 0.01);
    step.position.set(0, height / 2, 3.0 - index * 0.56);
    group.add(step);

    // Lime nosing on the lowest tread only: one restrained accent line.
    if (index === 0) {
      const nosing = new THREE.Mesh(
        new THREE.BoxGeometry(8.4, 0.025, 0.05),
        limeMaterial,
      );
      nosing.position.set(0, height + 0.012, 2.72);
      group.add(nosing);
    }
  }

  /* --- pillars ---------------------------------------------------------- */
  const pillarX = 3.1;
  for (const x of [pillarX, -pillarX]) {
    const shaft = slab(1.16, 4.15, 1.55, concrete, 0.05, 0.018);
    shaft.position.set(x, 0.32 + 4.15 / 2, -0.95);
    group.add(shaft);

    const plinth = slab(1.48, 0.3, 1.92, concreteMatte, 0.04, 0.014);
    plinth.position.set(x, 0.47, -0.95);
    group.add(plinth);

    const capital = slab(1.46, 0.24, 1.86, concreteMatte, 0.04, 0.014);
    capital.position.set(x, 4.55, -0.95);
    group.add(capital);
  }

  /* --- beam, roof slab, wordmark --------------------------------------- */
  const beam = slab(8.7, 1.0, 1.8, concrete, 0.05, 0.018);
  beam.position.set(0, 5.17, -0.95);
  group.add(beam);

  const roof = slab(9.3, 0.2, 2.12, concreteMatte, 0.04, 0.014);
  roof.position.set(0, 5.77, -0.95);
  group.add(roof);

  const limeReveal = new THREE.Mesh(
    new THREE.BoxGeometry(8.4, 0.045, 0.06),
    limeMaterial,
  );
  limeReveal.position.set(0, 4.69, -0.04);
  group.add(limeReveal);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.9),
    new THREE.MeshStandardMaterial({
      map: wordmark,
      transparent: true,
      alphaTest: 0.12,
      roughness: 0.45,
      metalness: 0,
    }),
  );
  sign.position.set(0, 5.15, 0.02);
  group.add(sign);

  /* --- entrance interior ------------------------------------------------ */
  const interiorFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(5.05, 2.6),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.14,
      metalness: 0.12,
      envMapIntensity: 1.2,
    }),
  );
  interiorFloor.rotation.x = -Math.PI / 2;
  interiorFloor.position.set(0, 0.34, -1.6);
  interiorFloor.receiveShadow = true;
  group.add(interiorFloor);

  // Reveal walls give the opening real thickness.
  for (const x of [2.55, -2.55]) {
    const reveal = slab(0.12, 4.15, 2.6, concreteMatte, 0.02, 0.008);
    reveal.position.set(x, 2.4, -1.6);
    group.add(reveal);
  }

  const ceiling = slab(5.2, 0.16, 2.7, concreteMatte, 0.02, 0.008);
  ceiling.position.set(0, 4.47, -1.6);
  group.add(ceiling);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(5.1, 4.2),
    new THREE.MeshStandardMaterial({
      color: "#e7e2f4",
      roughness: 0.9,
      metalness: 0,
    }),
  );
  backWall.position.set(0, 2.4, -2.9);
  group.add(backWall);

  const wash = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 3.2),
    new THREE.MeshBasicMaterial({
      map: glowMap,
      transparent: true,
      depthWrite: false,
    }),
  );
  wash.position.set(0, 2.4, -2.88);
  group.add(wash);

  // Two linear lights in the soffit.
  for (const z of [-1.3, -2.1]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.045, 0.09),
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#ddd4ff",
        emissiveIntensity: 2.2,
        roughness: 0.4,
      }),
    );
    strip.position.set(0, 4.38, z);
    group.add(strip);
  }

  // Purple threshold detail, kept to a single quiet line.
  const purpleLine = new THREE.Mesh(
    new THREE.BoxGeometry(5.0, 0.03, 0.06),
    purpleMaterial,
  );
  purpleLine.position.set(0, 0.35, -0.3);
  group.add(purpleLine);

  /* --- landscaping ------------------------------------------------------ */
  const leafMaterials = [
    new THREE.MeshStandardMaterial({ color: "#5d7a44", roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: "#6c8b50", roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: "#4e6839", roughness: 0.95 }),
  ];
  const barkMaterial = new THREE.MeshStandardMaterial({
    color: "#8a7f6d",
    roughness: 0.95,
  });

  const planterMaterial = new THREE.MeshStandardMaterial({
    map: concreteMap,
    color: "#f2f1ec",
    roughness: 0.7,
    metalness: 0.02,
  });

  for (const x of [4.05, -4.05]) {
    const planter = slab(2.7, 0.4, 2.1, planterMaterial, 0.05, 0.012);
    planter.position.set(x, 0.2, 1.85);
    group.add(planter);

    const hedge = slab(2.4, 0.55, 1.4, leafMaterials[2], 0.16, 0.03);
    hedge.position.set(x, 0.52, 1.85);
    group.add(hedge);

    const tree = buildTree(leafMaterials, barkMaterial, index_height(x));
    tree.position.set(x, 0.3, 1.1);
    group.add(tree);
  }

  // Smaller trees flanking the portal, behind the hedges.
  for (const x of [5.35, -5.35]) {
    const tree = buildTree(leafMaterials, barkMaterial, 2.1);
    tree.position.set(x, 0.05, 0.1);
    group.add(tree);
  }

  // Low shrubs along the podium edge.
  for (const x of [3.55, -3.55, 4.55, -4.55]) {
    const shrub = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.3, 1),
      leafMaterials[0],
    );
    shrub.position.set(x, 0.36, 2.9);
    shrub.scale.set(1.2, 0.8, 1.1);
    shrub.castShadow = true;
    shrub.receiveShadow = true;
    group.add(shrub);
  }

  return { group, concrete, paving, foliage: leafMaterials };
}

/** Slightly different tree heights keep the planting from looking stamped. */
function index_height(x: number): number {
  return x > 0 ? 2.9 : 2.65;
}

function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);

    const environment = new THREE.Scene();
    environment.background = new THREE.Color("#ffffff");

    const panel = (
      width: number,
      height: number,
      color: string,
      x: number,
      y: number,
      z: number,
      rotationY: number,
      rotationX = 0,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({ color }),
      );
      mesh.position.set(x, y, z);
      mesh.rotation.set(rotationX, rotationY, 0);
      environment.add(mesh);
    };

    panel(18, 12, "#ffffff", 0, 10, 0, 0, Math.PI / 2);
    panel(8, 10, "#fff4e4", -9, 5, 4, Math.PI / 2);
    panel(8, 10, "#f1eeff", 9, 5, 4, -Math.PI / 2);
    panel(12, 12, "#f7f5ef", 0, -2, -14, 0);
    panel(12, 9, "#ffffff", 0, 1, 16, Math.PI);

    const target = pmrem.fromScene(environment, 0.55);
    const previous = scene.environment;
    scene.environment = target.texture;
    scene.environmentIntensity = 0.75;

    return () => {
      scene.environment = previous;
      target.dispose();
      pmrem.dispose();
      environment.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
    };
  }, [gl, scene]);

  return null;
}

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
        shadows="soft"
        dpr={[1, 1.8]}
        camera={{ position: [0, 4.9, 16.5], fov: 40, near: 0.1, far: 160 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMappingExposure: 0.9,
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <StudioEnvironment />
        <GatewayStructure progress={progress} reducedMotion={reducedMotion} />
      </Canvas>
    </GatewayErrorBoundary>
  );
}

function GatewayStructure({
  progress = 0,
  reducedMotion = false,
}: GatewaySceneProps) {
  const built = useMemo(() => buildScene(), []);
  const { group } = built;

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta ?? 0);
    const t = reducedMotion ? 1 : easeOutCubic(clamp01(progress));
    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = state.viewport.aspect || 1;
    const widen = aspect < 1.35 ? 1.16 : 1;

    // Pointer parallax is deliberately tiny: the frame never breaks.
    const pointerX = reducedMotion ? 0 : state.pointer.x * 0.35;
    const pointerY = reducedMotion ? 0 : state.pointer.y * 0.16;

    const targetX = lerp(0.0, 0.0, t) + pointerX;
    const targetY = lerp(4.5, 3.0, t) + pointerY;
    const targetZ = lerp(15.0, 10.35, t) * widen;

    camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 2.2);
    camera.position.y += (targetY - camera.position.y) * Math.min(1, dt * 2.6);
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, dt * 2.8);
    camera.lookAt(0, 2.55, -0.8);
  });

  useEffect(() => {
    return () => {
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      built.concrete.dispose();
      built.paving.dispose();
      built.foliage.forEach((material) => material.dispose());
    };
  }, [group, built]);

  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#ffffff", 26, 62]} />

      <ambientLight intensity={0.2} />
      <hemisphereLight args={["#ffffff", "#e7e1d3", 0.5]} />

      <directionalLight
        position={[-10, 13, 8]}
        intensity={1.2}
        color="#fff6ea"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={14}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-bias={-0.00035}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[9, 7, 6]} intensity={0.34} color="#f3eeff" />

      <pointLight
        position={[0, 3.4, -1.6]}
        intensity={9}
        distance={7}
        decay={2}
        color="#7455ff"
      />
      <pointLight position={[0, 4.4, 0.6]} intensity={1.2} distance={6} color="#a5d85e" />

      <primitive object={group} />
    </>
  );
}
