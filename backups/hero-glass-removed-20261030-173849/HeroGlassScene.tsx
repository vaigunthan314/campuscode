import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import "../styles/hero-glass.css";

let rectAreaLightsReady = false;

function ensureRectAreaLights() {
  if (rectAreaLightsReady) return;
  RectAreaLightUniformsLib.init();
  rectAreaLightsReady = true;
}

type ProgressRef = { current: number };

type HeroGlassSceneProps = {
  progress: ProgressRef;
  reducedMotion?: boolean;
};

type SlashSpec = {
  id: "white" | "purple" | "lime";
  color: string;
  attenuation: string;
  attenuationDistance: number;
  transmission: number;
  thickness: number;
  roughness: number;
  envMapIntensity: number;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: number;
};

const SLASHES: readonly SlashSpec[] = [
  {
    id: "white",
    color: "#ffffff",
    attenuation: "#dfe4f2",
    attenuationDistance: 1.4,
    transmission: 0.985,
    thickness: 1.35,
    roughness: 0.045,
    envMapIntensity: 2.35,
    position: [-0.98, -0.18, 0.36],
    rotation: [-0.03, 0.16, -0.26],
    scale: 0.94,
  },
  {
    id: "purple",
    color: "#ffffff",
    attenuation: "#6440ff",
    attenuationDistance: 0.95,
    transmission: 0.965,
    thickness: 1.55,
    roughness: 0.04,
    envMapIntensity: 2.15,
    position: [0.04, 0.12, 0.64],
    rotation: [-0.02, 0.04, -0.215],
    scale: 1.0,
  },
  {
    id: "lime",
    color: "#ffffff",
    attenuation: "#8ecb3d",
    attenuationDistance: 0.9,
    transmission: 0.955,
    thickness: 1.5,
    roughness: 0.045,
    envMapIntensity: 2.05,
    position: [1.04, -0.08, 0.18],
    rotation: [-0.04, -0.08, -0.25],
    scale: 0.96,
  },
];

function roundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

function createSlashGeometry() {
  const shape = roundedRectShape(0.92, 2.76, 0.19);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelThickness: 0.085,
    bevelSize: 0.075,
    bevelSegments: 8,
    curveSegments: 32,
    steps: 1,
  });

  // A slight shear turns the rounded slab into a slash without changing its
  // physical cross-section.
  geometry.applyMatrix4(
    new THREE.Matrix4().set(
      1, 0.085, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ),
  );
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function createGlassMaterial(spec: SlashSpec) {
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(spec.color),
    transmission: spec.transmission,
    thickness: spec.thickness,
    roughness: spec.roughness,
    metalness: 0,
    ior: 1.47,
    clearcoat: 1,
    clearcoatRoughness: 0.055,
    attenuationColor: new THREE.Color(spec.attenuation),
    attenuationDistance: spec.attenuationDistance,
    envMapIntensity: spec.envMapIntensity,
    specularIntensity: 1,
    transparent: true,
    opacity: 1,
    side: THREE.FrontSide,
    depthWrite: true,
  });

  return material;
}

function createBackdropTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;

  // White studio sweep: soft neutral mass in the middle, pure white at the
  // perimeter so the canvas blends into the hero.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);

  const core = context.createRadialGradient(
    size * 0.47,
    size * 0.48,
    size * 0.01,
    size * 0.5,
    size * 0.5,
    size * 0.34,
  );
  core.addColorStop(0, "rgba(196, 200, 214, 0.88)");
  core.addColorStop(0.46, "rgba(220, 223, 232, 0.62)");
  core.addColorStop(0.78, "rgba(246, 247, 250, 0.22)");
  core.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = core;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => material?.dispose());
  });
}

export function HeroGlassScene({ progress, reducedMotion = false }: HeroGlassSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      console.error("Hero glass scene could not start WebGL; using the static fallback.", error);
      setFailed(true);
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.transmissionResolutionScale = 0.9;

    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
    camera.position.set(1.62, 0.82, 8.4);
    camera.lookAt(0, -0.02, 0);

    ensureRectAreaLights();

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentScene = new RoomEnvironment();

    // Narrow, dark studio flags. They are only ever seen as reflections in the
    // glass; the page itself stays white.
    const addFlag = (
      color: THREE.ColorRepresentation,
      width: number,
      height: number,
      position: readonly [number, number, number],
      rotation: readonly [number, number, number],
      luminance = 1,
    ) => {
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(color).multiplyScalar(luminance),
          side: THREE.DoubleSide,
        }),
      );
      flag.position.set(...position);
      flag.rotation.set(...rotation);
      environmentScene.add(flag);
    };
    addFlag(0x3b3b46, 2.4, 9.5, [-7.4, 4.2, 7.2], [0, 0.5, 0]);
    addFlag(0x4a4a56, 1.1, 12, [8.4, 3.4, -1.8], [0, -0.62, 0]);
    addFlag(0x2f2f38, 9.5, 1.2, [0, 10.4, 5.8], [Math.PI / 2, 0, 0]);

    const environmentTarget = pmrem.fromScene(environmentScene, 0.04);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 1.02;
    disposeScene(environmentScene);
    pmrem.dispose();

    const backdropTexture = createBackdropTexture();
    if (backdropTexture) {
      const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshBasicMaterial({
          map: backdropTexture,
          toneMapped: false,
        }),
      );
      backdrop.position.set(0, 0, -4);
      scene.add(backdrop);
    }

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.ShadowMaterial({
        color: 0x1b1b23,
        opacity: 0.26,
        transparent: true,
        depthWrite: false,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    scene.add(floor);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xdde1ee, 1.05));
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(4.6, 7.4, 5.6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 24;
    keyLight.shadow.camera.left = -5.5;
    keyLight.shadow.camera.right = 5.5;
    keyLight.shadow.camera.top = 6.5;
    keyLight.shadow.camera.bottom = -4.5;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.025;
    keyLight.shadow.radius = 5;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xeae5ff, 1.15);
    fillLight.position.set(-6, 2.2, 4.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    rimLight.position.set(-1.5, -3.2, -5);
    scene.add(rimLight);

    // Long, narrow studio strips produce the crisp vertical highlights that
    // make the acrylic edges read as polished glass.
    const overStrip = new THREE.RectAreaLight(0xffffff, 5.2, 3.4, 0.24);
    overStrip.position.set(3.2, 3.7, 3.8);
    overStrip.lookAt(0, 0, 0);
    scene.add(overStrip);

    const sideStrip = new THREE.RectAreaLight(0xffffff, 7.5, 0.32, 3.6);
    sideStrip.position.set(-3.8, 0.75, 4.4);
    sideStrip.lookAt(0, 0, 0);
    scene.add(sideStrip);

    const geometry = createSlashGeometry();
    const group = new THREE.Group();
    scene.add(group);

    const built = SLASHES.map((spec) => {
      const material = createGlassMaterial(spec);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...spec.position);
      mesh.rotation.set(...spec.rotation);
      mesh.scale.setScalar(spec.scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return { mesh, spec };
    });

    const state = {
      smooth: reducedMotion ? 1 : 0,
      pointerX: 0,
      pointerY: 0,
      targetX: 0,
      targetY: 0,
      running: false,
      frame: 0,
      visible: true,
    };

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const clock = new THREE.Clock();

    const render = () => {
      if (!state.running) return;
      state.frame = window.requestAnimationFrame(render);

      const delta = Math.min(clock.getDelta(), 0.05);
      const target = reducedMotion ? 1 : THREE.MathUtils.clamp(progress.current, 0, 1);
      state.smooth = reducedMotion
        ? 1
        : THREE.MathUtils.damp(state.smooth, target, 5.4, delta);

      state.pointerX = reducedMotion
        ? 0
        : THREE.MathUtils.damp(state.pointerX, state.targetX, 3.4, delta);
      state.pointerY = reducedMotion
        ? 0
        : THREE.MathUtils.damp(state.pointerY, state.targetY, 3.4, delta);

      const entry = THREE.MathUtils.smoothstep(state.smooth, 0.12, 0.52);

      group.position.z = -0.88 + entry * 0.98;
      group.position.y = -0.2 + entry * 0.15;
      group.rotation.x = -0.02 + state.pointerY * 0.03;
      group.rotation.y = 0.17 - entry * 0.1 + state.pointerX * 0.055;
      group.rotation.z = 0.015 - entry * 0.015;

      camera.position.x = 1.62 + (1 - entry) * 0.62 + state.pointerX * 0.22;
      camera.position.y = 0.82 + (1 - entry) * 0.3 - state.pointerY * 0.14;
      camera.position.z = 7.56 + (1 - entry) * 0.92;
      camera.lookAt(0, -0.02, 0);

      built.forEach(({ mesh, spec }, index) => {
        const offset = index * 0.022;
        const stagger = THREE.MathUtils.smoothstep(
          state.smooth,
          0.12 + offset,
          0.52 + offset,
        );
        const spread = 0.9 + stagger * 0.1;

        mesh.position.x = spec.position[0] * spread;
        mesh.position.y = spec.position[1] + (1 - stagger) * -0.07;
        mesh.position.z = spec.position[2] + (1 - stagger) * -0.34;
        mesh.rotation.x = spec.rotation[0] + state.pointerY * 0.025;
        mesh.rotation.y = spec.rotation[1] + state.pointerX * 0.035;
        mesh.rotation.z =
          spec.rotation[2] + (1 - stagger) * 0.045 * (index - 1) + state.pointerX * 0.012 * (index - 1);
      });

      renderer.render(scene, camera);
    };

    const updateRunning = () => {
      const shouldRun = state.visible && document.visibilityState === "visible";
      if (shouldRun && !state.running) {
        state.running = true;
        clock.start();
        state.frame = window.requestAnimationFrame(render);
      } else if (!shouldRun && state.running) {
        state.running = false;
        window.cancelAnimationFrame(state.frame);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!state.visible || reducedMotion) return;
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const margin = 220;
      if (
        event.clientX < rect.left - margin ||
        event.clientX > rect.right + margin ||
        event.clientY < rect.top - margin ||
        event.clientY > rect.bottom + margin
      ) {
        state.targetX = 0;
        state.targetY = 0;
        return;
      }

      state.targetX = THREE.MathUtils.clamp(
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.5),
        -1,
        1,
      );
      state.targetY = THREE.MathUtils.clamp(
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.5),
        -1,
        1,
      );
    };

    const onPointerLeave = () => {
      state.targetX = 0;
      state.targetY = 0;
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      state.running = false;
      window.cancelAnimationFrame(state.frame);
      setFailed(true);
    };

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        state.visible = entries[0]?.isIntersecting ?? false;
        updateRunning();
      },
      { rootMargin: "140px" },
    );
    visibilityObserver.observe(host);

    document.addEventListener("visibilitychange", updateRunning);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("webglcontextlost", onContextLost);
    updateRunning();

    return () => {
      state.running = false;
      window.cancelAnimationFrame(state.frame);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", updateRunning);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);

      geometry.dispose();
      built.forEach(({ mesh }) => {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => material.dispose());
      });
      backdropTexture?.dispose();
      environmentTarget.dispose();
      disposeScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [progress, reducedMotion]);

  return (
    <div className="hero-glass-scene" ref={hostRef}>
      {failed ? (
        <div className="hero-glass-fallback" aria-hidden="true">
          <span className="hero-glass-fallback-slash hero-glass-fallback-slash--white" />
          <span className="hero-glass-fallback-slash hero-glass-fallback-slash--purple" />
          <span className="hero-glass-fallback-slash hero-glass-fallback-slash--lime" />
        </div>
      ) : null}
    </div>
  );
}
