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

/** Entrance floor level: the whole structure stands on the upper plaza. */
const LEVEL = 0.6;

/* --------------------------------------------------------------------------
 * Procedural surfaces (generated locally, no downloads).
 * ------------------------------------------------------------------------ */

function concreteTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#f8f7f4";
    ctx.fillRect(0, 0, size, size);

    const image = ctx.getImageData(0, 0, size, size);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 12;
      data[i] = Math.max(0, Math.min(255, data[i] + grain));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
    }
    ctx.putImageData(image, 0, 0);

    ctx.strokeStyle = "rgba(17, 17, 17, 0.04)";
    ctx.lineWidth = 1;
    for (let y = 72; y < size; y += 144) {
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
    ctx.fillStyle = "#f6f5f1";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(17, 17, 17, 0.075)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += 170) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    for (let i = 0; i < 1400; i += 1) {
      const tone = Math.random() > 0.5 ? "rgba(255,255,255,0.45)" : "rgba(17,17,17,0.05)";
      ctx.fillStyle = tone;
      ctx.fillRect(Math.random() * size, Math.random() * size, 1.4, 1.4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 14);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function glowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size * 0.45,
      6,
      size / 2,
      size * 0.45,
      size * 0.6,
    );
    gradient.addColorStop(0, "rgba(116, 85, 255, 0.5)");
    gradient.addColorStop(0.5, "rgba(116, 85, 255, 0.18)");
    gradient.addColorStop(1, "rgba(116, 85, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

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
    ctx.font = "900 128px Inter, 'Helvetica Neue', Arial, sans-serif";

    const word = "CAMPUSCODE";
    const tracking = -2;
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
 * Geometry helpers: everything is extruded from drawn profiles so the
 * architecture has real curves, tapers and bevels - not stacked boxes.
 * ------------------------------------------------------------------------ */

/** Extrude a plan (X/Y) profile upwards in Y. Y+ points away from the viewer. */
function planGeometry(
  shape: THREE.Shape,
  height: number,
  bevel = 0.015,
): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 28,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** A tread whose front edge bows toward the visitor: a flowing fan step. */
function treadShape(width: number, depth: number, bulge: number): THREE.Shape {
  const half = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half, 0);
  shape.quadraticCurveTo(0, -bulge, half, 0);
  shape.lineTo(half, depth);
  shape.lineTo(-half, depth);
  shape.closePath();
  return shape;
}

/** A tapered structural blade, extruded through its thickness. */
function bladeGeometry(
  baseWidth: number,
  topWidth: number,
  height: number,
  depth: number,
): THREE.ExtrudeGeometry {
  const b = baseWidth / 2;
  const t = topWidth / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-b, 0);
  shape.lineTo(b, 0);
  shape.quadraticCurveTo(b * 0.94, height * 0.52, t, height);
  shape.lineTo(-t, height);
  shape.quadraticCurveTo(-b * 0.94, height * 0.52, -b, 0);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 3,
    curveSegments: 18,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** Organic tree: tapered trunk, layered irregular canopy, three green tones. */
function buildTree(
  foliage: THREE.MeshStandardMaterial[],
  bark: THREE.MeshStandardMaterial,
  height: number,
): THREE.Group {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.17, height * 0.78, 12, 4),
    bark,
  );
  trunk.position.y = height * 0.39;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const branches = 3;
  for (let index = 0; index < branches; index += 1) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.07, height * 0.34, 8),
      bark,
    );
    const angle = (index / branches) * Math.PI * 2 + 0.4;
    branch.position.set(
      Math.cos(angle) * 0.16,
      height * 0.62,
      Math.sin(angle) * 0.16,
    );
    branch.rotation.set(
      Math.sin(angle) * 0.5,
      0,
      -Math.cos(angle) * 0.5,
    );
    branch.castShadow = true;
    tree.add(branch);
  }

  const clusterCount = 13;
  for (let index = 0; index < clusterCount; index += 1) {
    const radius = 0.22 + Math.random() * 0.2;
    const cluster = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 2),
      foliage[index % foliage.length],
    );
    const angle = (index / clusterCount) * Math.PI * 2 + Math.random() * 0.8;
    const spread = index < 4 ? 0.18 + Math.random() * 0.18 : 0.3 + Math.random() * 0.34;
    cluster.position.set(
      Math.cos(angle) * spread,
      height * 0.74 + Math.random() * 0.4,
      Math.sin(angle) * spread,
    );
    cluster.scale.set(1, 0.82 + Math.random() * 0.22, 1);
    cluster.castShadow = true;
    cluster.receiveShadow = true;
    tree.add(cluster);
  }

  return tree;
}

/* --------------------------------------------------------------------------
 * Scene assembly
 * ------------------------------------------------------------------------ */

function buildScene() {
  const group = new THREE.Group();

  const concreteMap = concreteTexture();
  const pavingMap = pavingTexture();
  const glowMap = glowTexture();
  const wordmark = wordmarkTexture();

  const whiteConcrete = new THREE.MeshStandardMaterial({
    map: concreteMap,
    color: "#f4f2ec",
    roughness: 0.44,
    metalness: 0.02,
    envMapIntensity: 0.5,
  });

  const stone = new THREE.MeshStandardMaterial({
    map: pavingMap,
    color: "#e6e1d6",
    roughness: 0.55,
    metalness: 0.03,
    envMapIntensity: 0.4,
  });

  const stepStone = new THREE.MeshStandardMaterial({
    map: pavingMap,
    color: "#ded8cb",
    roughness: 0.6,
    metalness: 0.02,
    envMapIntensity: 0.3,
  });

  const paving = new THREE.MeshStandardMaterial({
    map: pavingMap,
    color: "#f1eee7",
    roughness: 0.28,
    metalness: 0.08,
    envMapIntensity: 0.85,
  });

  const glass = new THREE.MeshStandardMaterial({
    color: "#c7d8dc",
    roughness: 0.05,
    metalness: 0.28,
    transparent: true,
    opacity: 0.42,
    envMapIntensity: 1.5,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mullion = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.35,
    metalness: 0.2,
    envMapIntensity: 0.5,
  });

  const lime = new THREE.MeshStandardMaterial({
    color: "#a5d85e",
    roughness: 0.5,
    metalness: 0.05,
  });

  const purple = new THREE.MeshStandardMaterial({
    color: "#7455ff",
    emissive: "#7455ff",
    emissiveIntensity: 0.8,
    roughness: 0.7,
  });

  const grass = new THREE.MeshStandardMaterial({
    color: "#6d8a4e",
    roughness: 1,
    metalness: 0,
  });

  /* --- ground + plaza ---------------------------------------------------- */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), paving);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const plazaShape = new THREE.Shape();
  plazaShape.moveTo(-11, 9);
  plazaShape.lineTo(11, 9);
  plazaShape.lineTo(11, -1.9);
  plazaShape.quadraticCurveTo(0, -3.5, -11, -1.9);
  plazaShape.closePath();

  const plaza = new THREE.Mesh(planGeometry(plazaShape, LEVEL, 0.02), stone);
  plaza.position.z = 0.2;
  plaza.receiveShadow = true;
  group.add(plaza);

  /* --- flowing entrance steps -------------------------------------------- */
  const stepCount = 6;
  for (let index = 0; index < stepCount; index += 1) {
    const width = 13.4 - index * 0.42;
    const depth = 0.62;
    const bulge = 0.7 - index * 0.08;
    const height = (index + 1) * (LEVEL / stepCount);

    const step = new THREE.Mesh(
      planGeometry(treadShape(width, depth, bulge), height, 0.012),
      stepStone,
    );
    step.position.set(0, 0, 4.9 - index * 0.62);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);

    if (index === 0) {
      const nosing = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.82, 0.025, 0.07),
        lime,
      );
      nosing.position.set(0, height + 0.012, 4.9 + 0.03);
      group.add(nosing);
    }
  }

  /* --- two tapered blades (asymmetric silhouette) ------------------------ */
  const leftBlade = new THREE.Mesh(
    bladeGeometry(1.25, 0.52, 6.25, 1.05),
    whiteConcrete,
  );
  leftBlade.position.set(-3.15, LEVEL, -1.15);
  leftBlade.rotation.z = 0.012;
  leftBlade.castShadow = true;
  leftBlade.receiveShadow = true;
  group.add(leftBlade);

  const rightBlade = new THREE.Mesh(
    bladeGeometry(1.05, 0.44, 5.35, 0.9),
    whiteConcrete,
  );
  rightBlade.position.set(3.35, LEVEL, -1.35);
  rightBlade.rotation.z = -0.02;
  rightBlade.castShadow = true;
  rightBlade.receiveShadow = true;
  group.add(rightBlade);

  // Thin lime inlay on the inner face of the taller blade.
  const inlay = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.4, 0.06), lime);
  inlay.position.set(-2.72, LEVEL + 3.3, -0.6);
  group.add(inlay);

  /* --- cantilevered roof ------------------------------------------------- */
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-6.2, -2.1);
  roofShape.quadraticCurveTo(0, -3.35, 6.5, -1.95);
  roofShape.lineTo(6.9, 1.5);
  roofShape.quadraticCurveTo(0.4, 2.7, -6.4, 1.6);
  roofShape.closePath();

  const roof = new THREE.Mesh(planGeometry(roofShape, 0.28, 0.02), whiteConcrete);
  roof.position.set(0, 6.36, 0.1);
  roof.rotation.z = -0.092;
  roof.rotation.x = 0.012;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  const soffit = new THREE.Mesh(
    new THREE.PlaneGeometry(11.6, 4.0),
    new THREE.MeshStandardMaterial({
      color: "#d6d1c6",
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
  soffit.rotation.x = Math.PI / 2;
  soffit.position.set(0.1, 6.22, 0.1);
  soffit.rotation.z = -0.092;
  group.add(soffit);

  // Lime reveal along the leading edge of the canopy.
  const canopyEdge = new THREE.Mesh(
    new THREE.BoxGeometry(11.9, 0.045, 0.07),
    lime,
  );
  canopyEdge.position.set(0.1, 6.16, 3.26);
  canopyEdge.rotation.z = -0.092;
  group.add(canopyEdge);

  /* --- glazed lobby behind the blades ------------------------------------ */
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(7.1, 4.15, 4.4), glass);
  lobby.position.set(0.05, LEVEL + 2.07, -3.4);
  group.add(lobby);

  for (let index = -3; index <= 3; index += 1) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.15, 0.1), mullion);
    bar.position.set(0.05 + index * 1.12, LEVEL + 2.07, -1.2);
    bar.castShadow = true;
    group.add(bar);
  }

  // Head beam carries the wordmark.
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.72, 0.34), whiteConcrete);
  fascia.position.set(0.05, LEVEL + 4.52, -1.16);
  fascia.castShadow = true;
  fascia.receiveShadow = true;
  group.add(fascia);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.85),
    new THREE.MeshStandardMaterial({
      map: wordmark,
      transparent: true,
      alphaTest: 0.12,
      roughness: 0.4,
      metalness: 0,
    }),
  );
  sign.position.set(0.05, LEVEL + 4.52, -0.98);
  group.add(sign);

  /* --- interior seen through the glass ----------------------------------- */
  const interiorFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(6.9, 4.2),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.15,
      metalness: 0.1,
      envMapIntensity: 1.4,
    }),
  );
  interiorFloor.rotation.x = -Math.PI / 2;
  interiorFloor.position.set(0.05, LEVEL + 0.01, -3.4);
  interiorFloor.receiveShadow = true;
  group.add(interiorFloor);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(7.0, 4.1),
    new THREE.MeshStandardMaterial({ color: "#eeeaf8", roughness: 0.9 }),
  );
  backWall.position.set(0.05, LEVEL + 2.05, -5.55);
  group.add(backWall);

  const wash = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 3.0),
    new THREE.MeshBasicMaterial({
      map: glowMap,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  );
  wash.position.set(0.05, LEVEL + 2.15, -5.5);
  group.add(wash);

  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.95, 0.7), mullion);
  desk.position.set(0.05, LEVEL + 0.48, -4.5);
  desk.castShadow = true;
  group.add(desk);

  // Two slim indoor trees visible through the glazing.
  const indoorLeaf = new THREE.MeshStandardMaterial({ color: "#6c8b50", roughness: 0.95 });
  const indoorBark = new THREE.MeshStandardMaterial({ color: "#8a7f6d", roughness: 0.95 });
  for (const x of [-2.35, 2.45]) {
    const indoorTree = buildTree([indoorLeaf], indoorBark, 1.7);
    indoorTree.position.set(x, LEVEL + 0.02, -4.6);
    indoorTree.scale.setScalar(0.85);
    group.add(indoorTree);
  }

  /* --- purple illumination under the canopy ------------------------------ */
  const soffitLight = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.05, 0.12), purple);
  soffitLight.position.set(0.05, LEVEL + 4.98, -1.5);
  group.add(soffitLight);

  for (const x of [-2.4, 2.4]) {
    const downlight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.18), purple);
    downlight.position.set(x, LEVEL + 4.95, -1.9);
    group.add(downlight);
  }

  /* --- campus beyond the gateway ---------------------------------------- */
  const rearPlaza = new THREE.Mesh(new THREE.PlaneGeometry(46, 22), paving);
  rearPlaza.rotation.x = -Math.PI / 2;
  rearPlaza.position.set(0, 0.02, -16);
  rearPlaza.receiveShadow = true;
  group.add(rearPlaza);

  const campusVolume = (width: number, height: number, depth: number, x: number, z: number) => {
    const volume = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), whiteConcrete);
    volume.position.set(x, height / 2, z);
    volume.castShadow = true;
    volume.receiveShadow = true;
    group.add(volume);
  };
  campusVolume(9, 3.4, 5, -9, -24);
  campusVolume(7, 4.2, 5, 8, -26);

  /* --- landscaping ------------------------------------------------------- */
  const leafMaterials = [
    new THREE.MeshStandardMaterial({ color: "#5d7a44", roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: "#6f8f52", roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: "#4c6638", roughness: 0.95 }),
  ];
  const barkMaterial = new THREE.MeshStandardMaterial({
    color: "#8a7f6d",
    roughness: 0.95,
  });

  // Curved green banks flanking the steps.
  for (const side of [-1, 1]) {
    const bankShape = new THREE.Shape();
    bankShape.moveTo(0, 0);
    bankShape.quadraticCurveTo(1.9, 0.2, 2.6, 2.4);
    bankShape.quadraticCurveTo(2.9, 3.6, 1.4, 4.0);
    bankShape.quadraticCurveTo(-0.4, 3.4, -0.2, 1.8);
    bankShape.closePath();

    const bankGeometry = planGeometry(bankShape, 0.34, 0.03);
    const bank = new THREE.Mesh(bankGeometry, grass);
    bank.scale.x = side;
    bank.position.set(side * 4.9, 0, 0.6);
    bank.castShadow = true;
    bank.receiveShadow = true;
    group.add(bank);

    const curb = new THREE.Mesh(
      planGeometry(bankShape, 0.38, 0.03),
      stone,
    );
    curb.scale.set(side * 1.02, 1, 1.02);
    curb.position.set(side * 4.9, -0.02, 0.6);
    curb.receiveShadow = true;
    group.add(curb);
  }

  const treeSpots: Array<[number, number, number]> = [
    [-5.6, -2.6, 3.4],
    [5.7, -3.0, 3.1],
    [-7.6, -6.5, 3.8],
    [7.4, -7.2, 3.5],
    [-4.9, 2.6, 2.7],
    [5.0, 2.9, 2.5],
  ];
  for (const [x, z, height] of treeSpots) {
    const tree = buildTree(leafMaterials, barkMaterial, height);
    tree.position.set(x, 0.02, z);
    group.add(tree);
  }

  // Low planting along the banks.
  for (const [x, z] of [
    [-4.6, 2.9], [-5.5, 1.6], [-4.9, 0.3],
    [4.7, 3.0], [5.6, 1.7], [5.0, 0.4],
  ]) {
    const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 2), leafMaterials[1]);
    shrub.position.set(x, 0.42, z);
    shrub.scale.set(1.15, 0.85, 1.05);
    shrub.castShadow = true;
    shrub.receiveShadow = true;
    group.add(shrub);
  }

  return {
    group,
    materials: [whiteConcrete, stone, stepStone, paving, glass, mullion, lime, purple, grass, ...leafMaterials, barkMaterial],
  };
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

    panel(20, 14, "#ffffff", 0, 11, 0, 0, Math.PI / 2);
    panel(9, 11, "#fff5e7", -10, 5, 4, Math.PI / 2);
    panel(9, 11, "#f1eeff", 10, 5, 4, -Math.PI / 2);
    panel(14, 14, "#f7f5ef", 0, -2, -16, 0);
    panel(14, 10, "#ffffff", 0, 1, 18, Math.PI);

    const target = pmrem.fromScene(environment, 0.5);
    const previous = scene.environment;
    scene.environment = target.texture;
    scene.environmentIntensity = 0.8;

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
        camera={{ position: [0, 5.2, 20.5], fov: 40, near: 0.1, far: 220 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMappingExposure: 0.92,
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

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta ?? 0);
    const t = reducedMotion ? 1 : easeOutCubic(clamp01(progress));
    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = state.viewport.aspect || 1;
    const widen = aspect < 1.35 ? 1.14 : 1;

    const pointerX = reducedMotion ? 0 : state.pointer.x * 0.3;
    const pointerY = reducedMotion ? 0 : state.pointer.y * 0.14;

    const targetX = pointerX;
    const targetY = lerp(5.2, 4.1, t) + pointerY;
    const targetZ = lerp(20.5, 16.2, t) * widen;

    camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 2);
    camera.position.y += (targetY - camera.position.y) * Math.min(1, dt * 2.4);
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, dt * 2.6);
    camera.lookAt(0, 3.05, -0.9);
  });

  useEffect(() => {
    return () => {
      built.group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
      });
      built.materials.forEach((material) => material.dispose());
    };
  }, [built]);

  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#ffffff", 34, 82]} />

      <ambientLight intensity={0.18} />
      <hemisphereLight args={["#ffffff", "#e5dfd0", 0.42]} />

      <directionalLight
        position={[-11, 16, 9]}
        intensity={1.55}
        color="#fff7ec"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={16}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.5}
        shadow-camera-far={70}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[10, 8, 7]} intensity={0.34} color="#f3eeff" />
      <directionalLight position={[0, 6, -14]} intensity={0.4} color="#ffffff" />

      <pointLight
        position={[0, 3.4, -2.4]}
        intensity={20}
        distance={11}
        decay={2}
        color="#7455ff"
      />
      <pointLight position={[0, 5.1, -1.2]} intensity={2} distance={6} color="#a5d85e" />

      <primitive object={built.group} />
    </>
  );
}
