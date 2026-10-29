import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type {} from 'three';

type CardDef = Readonly<{
  id: string;
  label: string;
  sub: string;
  accent: 'purple' | 'lime';
  offset: number; // 0..1 along the arc
  rotY: number; // resting facing direction in radians
}>;

const CARDS: readonly CardDef[] = [
  {
    id: 'discover',
    label: '01 DISCOVER',
    sub: 'Live radar · active challenges',
    accent: 'lime',
    offset: 0.0,
    rotY: Math.PI * 0.5,
  },
  {
    id: 'teamup',
    label: '02 TEAM UP',
    sub: 'Find teammates · role tags',
    accent: 'purple',
    offset: 0.33,
    rotY: -Math.PI * 0.25,
  },
  {
    id: 'build',
    label: '03 BUILD',
    sub: 'Shared tools · live IDE',
    accent: 'lime',
    offset: 0.66,
    rotY: -Math.PI * 0.75,
  },
  {
    id: 'ship',
    label: '04 SHIP',
    sub: 'Verify · submit · demo live',
    accent: 'purple',
    offset: 1.0,
    rotY: Math.PI * 0.75,
  },
];

const CARD_RADIUS = 3.9;
const CARD_HEIGHT = 1.7;
const CARD_WIDTH = 2.1;
const CORE_SIZE = 1.18;
const PEDESTAL_BASE_RADIUS = 3.15;
const PEDESTAL_STEPS = 4;
const PEDESTAL_STEP_HEIGHT = 0.16;
const BEVEL_TICK_COUNT = 48;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clampf(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function cardTextureProvider() {
  const t1 = new THREE.CanvasTexture(generateCardCanvas('discover', 0));
  const t2 = new THREE.CanvasTexture(generateCardCanvas('teamup', 0));
  const t3 = new THREE.CanvasTexture(generateCardCanvas('build', 0));
  const t4 = new THREE.CanvasTexture(generateCardCanvas('ship', 0));
  return [t1, t2, t3, t4] as const;
}

function generateCardCanvas(stage: 'discover' | 'teamup' | 'build' | 'ship', maturity: number) {
  const w = 512;
  const h = 400;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#f8f8fb');
  grad.addColorStop(1, '#eef0f6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#d6d7de';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = stage === 'discover' || stage === 'build' ? '#a5d85e' : '#7455ff';
  ctx.fillRect(0, 0, 8, h);
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.beginPath();
  const rx = 14, ry = 10;
  const px = 18, py = 16, pw = 168, ph = 24;
  ctx.beginPath();
  ctx.moveTo(px + rx, py);
  ctx.lineTo(px + pw - rx, py);
  ctx.quadraticCurveTo(px + pw, py, px + pw, py + ry);
  ctx.lineTo(px + pw, py + ph - ry);
  ctx.quadraticCurveTo(px + pw, py + ph, px + pw - rx, py + ph);
  ctx.lineTo(px + rx, py + ph);
  ctx.quadraticCurveTo(px, py + ph, px, py + ph - ry);
  ctx.lineTo(px, py + ry);
  ctx.quadraticCurveTo(px, py, px + rx, py);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = stage === 'discover' || stage === 'build' ? '#a5d85e' : '#7455ff';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = stage === 'discover' || stage === 'build' ? '#3f5d24' : '#3a2c7e';
  ctx.font = '600 11px "DM Mono", "SFMono-Regular", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(stage === 'discover' ? 'LIVE CHALLENGE' : stage === 'teamup' ? 'FIND TEAMMATES' : stage === 'build' ? 'SHARED TOOLS' : 'VERIFIED', 26, py + ph / 2);

  ctx.fillStyle = '#111111';
  ctx.font = '700 46px "Inter", "Helvetica Neue", Arial, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(stage === 'discover' ? 'DISCOVER' : stage === 'teamup' ? 'TEAM UP' : stage === 'build' ? 'BUILD' : 'SHIP', 56, 150);

  ctx.fillStyle = '#777777';
  ctx.font = '400 11px "DM Mono", "SFMono-Regular", monospace';
  ctx.fillText(stage === 'discover' ? 'Hackathon radar pulse' : stage === 'teamup' ? 'Student builder avatars' : stage === 'build' ? 'Dark mini-IDE terminal' : 'Project submitted', 58, 176);

  ctx.save();
  ctx.globalAlpha = Math.min(1, maturity * 1.4);
  const panelY = 210;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.roundRect(40, panelY, w - 80, 138, 10);
  ctx.fill();
  ctx.strokeStyle = '#e2e3ea';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (stage === 'discover') {
    ctx.strokeStyle = '#a5d85e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(120, panelY + 60, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(120, panelY + 60, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(120, panelY + 60, 46, 0, Math.PI * 2);
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = Math.min(1, maturity * 1.4);

    ctx.fillStyle = 'rgba(165,216,94,0.16)';
    ctx.beginPath();
    ctx.roundRect(200, panelY + 20, 150, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#3f5d24';
    ctx.font = '500 10px "DM Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText('LIVE', 212, panelY + 35);

    ctx.fillStyle = '#e2e3ea';
    ctx.beginPath();
    ctx.roundRect(200, panelY + 64, 150, 52, 8);
    ctx.fill();
    ctx.fillStyle = '#b9bcc8';
    ctx.font = '400 9px "DM Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText('PHOTO TEASER', 220, panelY + 90);
  } else if (stage === 'teamup') {
    for (let i = 0; i < 4; i++) {
      const ax = 92 + i * 56;
      const ay = panelY + 38;
      ctx.fillStyle = i % 2 === 0 ? '#7455ff' : '#a5d85e';
      ctx.beginPath();
      ctx.arc(ax, ay, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ax, ay - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ax - 6, ay + 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ax + 6, ay + 5, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '500 9px "DM Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText('FRONTEND', 70, panelY + 86);
    ctx.fillText('DESIGN', 132, panelY + 86);
    ctx.fillText('BACKEND', 194, panelY + 86);
    ctx.fillText('PM', 256, panelY + 86);
    ctx.fillStyle = '#3a2c7e';
    ctx.font = '400 10px "DM Mono", monospace';
    ctx.fillText('Find Teammates', 300, panelY + 86);
  } else if (stage === 'build') {
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.roundRect(48, panelY + 8, w - 96, 96, 8);
    ctx.fill();
    ctx.fillStyle = '#7455ff';
    ctx.font = '400 10px "DM Mono", monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('> campus build --watch', 60, panelY + 18);
    ctx.fillStyle = '#a5d85e';
    ctx.fillText('√ compiled 3.2s', 60, panelY + 32);
    ctx.fillStyle = '#777777';
    ctx.font = '400 9px "DM Mono", monospace';
    ctx.fillText('src/App.tsx · line 142', 60, panelY + 48);
    ctx.fillText('shared-tools/lib/utils.ts', 60, panelY + 60);
    ctx.fillStyle = '#a5d85e';
    ctx.fillRect(60, panelY + 74, 7, 11);
  } else if (stage === 'ship') {
    ctx.fillStyle = '#a5d85e';
    ctx.beginPath();
    ctx.roundRect(56, panelY + 20, 70, 56, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(72, panelY + 50);
    ctx.lineTo(86, panelY + 64);
    ctx.lineTo(102, panelY + 38);
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('Project Submitted!', 150, panelY + 26);

    ctx.fillStyle = '#777777';
    ctx.font = '400 11px "DM Mono", monospace';
    ctx.fillText('Live Demo', 152, panelY + 50);

    ctx.fillStyle = '#a5d85e';
    ctx.beginPath();
    ctx.roundRect(150, panelY + 60, 120, 26, 13);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillText('LIVE DEMO', 170, panelY + 73);
  }

  ctx.restore();

  ctx.fillStyle = 'rgba(17,17,17,0.04)';
  ctx.beginPath();
  ctx.roundRect(2, h - 3, w - 4, 2, 1);
  ctx.fill();

  return canvas;
}

function generateGlyphCanvas(glyph: string) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(245, 246, 252, 0.85)';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#7455ff';
  ctx.lineWidth = 6;
  ctx.strokeRect(1, 1, 126, 126);
  ctx.fillStyle = '#111111';
  ctx.font = '700 64px "Inter", "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, 64, 66);
  return c;
}

function makeGlyphTexture(glyph: string) {
  const tex = new THREE.CanvasTexture(generateGlyphCanvas(glyph));
  tex.anisotropy = 4;
  return tex;
}

function Pedestal({ activeStage }: { activeStage: number }) {
  const meshRef = useRef<THREE.Group>(null);

  const rimColor = (i: number) => {
    if (i === activeStage) return '#a5d85e';
    if (i < activeStage) return '#7455ff';
    return '#e6e6e6';
  };

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.06;
  });

  const rings = Array.from({ length: PEDESTAL_STEPS }, (_, i) => {
    const radius = PEDESTAL_BASE_RADIUS - i * 0.52;
    const y = i * PEDESTAL_STEP_HEIGHT;
    const rim = rimColor(i);
    const ticks: THREE.Vector3[] = [];
    for (let k = 0; k < BEVEL_TICK_COUNT; k++) {
      const a = (k / BEVEL_TICK_COUNT) * Math.PI * 2;
      ticks.push(new THREE.Vector3(Math.cos(a) * (radius - 0.04), y + 0.035, Math.sin(a) * (radius - 0.04)));
      ticks.push(new THREE.Vector3(Math.cos(a) * radius, y + 0.035, Math.sin(a) * radius));
    }
    return { radius, y, rim, ticks };
  });

  return (
    <group ref={meshRef}>
      {rings.map(({ radius, y, rim, ticks }, i) => (
        <primitive
          key={i}
          object={new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, PEDESTAL_STEP_HEIGHT, 64, 1, false),
            new THREE.MeshStandardMaterial({
              color: i % 2 === 0 ? '#ffffff' : '#f2f2f6',
              metalness: 0.82,
              roughness: 0.28,
              envMapIntensity: 0.6,
            }),
          )}
        />
      ))}

      {rings.map(({ y }, i) => {
        const r = PEDESTAL_BASE_RADIUS - i * 0.52 + 0.04;
        const geo = new THREE.TorusGeometry(r, 0.07, 4, 80);
        return (
          <mesh key={`bevel-${i}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <primitive object={geo} attach="geometry" />
            <meshStandardMaterial color={0xffffff} metalness={0.92} roughness={0.18} envMapIntensity={0.8} attach="material" />
          </mesh>
        );
      })}

      {rings.map(({ ticks, y }, i) => (
        <lineSegments
          key={`ticks-${i}`}
          geometry={new THREE.BufferGeometry().setFromPoints(ticks)}
          position={[0, y, 0]}
        >
          <lineBasicMaterial color="#111111" transparent opacity={0.35} />
        </lineSegments>
      ))}

      {rings.map(({ y }, i) => {
        const inner = PEDESTAL_BASE_RADIUS - i * 0.52 + 0.12;
        const outer = inner + 0.34;
        const hue = i % 2 === 0 ? '#7455ff' : '#a5d85e';
        const ringGeo = new THREE.RingGeometry(inner, outer, 80);
        const ringMat = new THREE.MeshStandardMaterial({
          color: hue,
          transparent: true,
          opacity: i === activeStage ? 0.9 : i < activeStage ? 0.35 : 0.12,
          side: THREE.DoubleSide,
          emissive: hue,
          emissiveIntensity: i === activeStage ? 1.1 : 0.3,
          depthWrite: false,
        });
        return (
          <mesh
            key={`led-${i}`}
            position={[0, y + PEDESTAL_STEP_HEIGHT + 0.02, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <primitive object={ringGeo} attach="geometry" />
            <primitive object={ringMat} attach="material" />
          </mesh>
        );
      })}

      {rings.slice(0, 2).map(({ y }, i) => {
        const word = i === 0 ? 'STUDENTS' : 'IMPACT';
        const ang = -Math.PI / 2;
        const pos = new THREE.Vector3(
          Math.cos(ang) * (PEDESTAL_BASE_RADIUS - i * 0.52 - 0.2),
          y + PEDESTAL_STEP_HEIGHT / 2 + 0.03,
          Math.sin(ang) * (PEDESTAL_BASE_RADIUS - i * 0.52 - 0.2),
        );
        return (
          <Text
            key={`label-${i}`}
            position={pos}
            rotation={[0, -ang, 0]}
            fontSize={0.32}
            color="#111111"
            font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2"
            letterSpacing={0.08}
          >
            {word}
          </Text>
        );
      })}
    </group>
  );
}

function MonolithCore({
  activeStage,
  scrollVelocity,
  mouseX,
  mouseY,
}: {
  activeStage: number;
  scrollVelocity: number;
  mouseX: number;
  mouseY: number;
}) {
  const group = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.Mesh>(null);
  const light2Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const breathe = Math.sin(t * 1.2) * 0.08 + 0.02;
    group.current.position.y = breathe;
    group.current.position.x = mouseX * 0.12;
    group.current.position.z = mouseY * 0.06;

    const rotTarget = scrollVelocity * 0.6 + mouseX * 0.5 + mouseY * 0.2;
    group.current.rotation.y += (rotTarget - group.current.rotation.y) * delta * 1.2;
    group.current.rotation.x += (scrollVelocity * 0.18 + mouseY * 0.18 - group.current.rotation.x) * delta * 1.0;
    group.current.rotation.z += (mouseX * 0.16 - group.current.rotation.z) * delta * 0.8;

    if (lightRef.current?.material) {
      (lightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.1 + Math.sin(t * 3.2) * 0.4;
    }
    if (light2Ref.current?.material) {
      (light2Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 + Math.cos(t * 2.7) * 0.5;
    }
  });

  return (
    <group ref={group}>
      <mesh castShadow>
        <boxGeometry args={[CORE_SIZE, CORE_SIZE, CORE_SIZE]} />
        <meshStandardMaterial color="#111111" metalness={0.45} roughness={0.55} envMapIntensity={0.4} />
      </mesh>

      <mesh rotation={[0, 0, 0]} position={[-0.03, -0.03, -0.03]}>
        <boxGeometry args={[CORE_SIZE - 0.06, CORE_SIZE - 0.06, CORE_SIZE - 0.06]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.6} roughness={0.4} />
      </mesh>

      <mesh ref={lightRef} position={[0, 0, CORE_SIZE * 0.42]}>
        <boxGeometry args={[CORE_SIZE * 0.9, CORE_SIZE * 1.1, 0.05]} />
        <meshStandardMaterial
          color="#7455ff"
          emissive="#7455ff"
          emissiveIntensity={1.1}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={light2Ref} position={[0, 0, -CORE_SIZE * 0.42]}>
        <boxGeometry args={[CORE_SIZE * 0.9, CORE_SIZE * 1.1, 0.05]} />
        <meshStandardMaterial
          color="#a5d85e"
          emissive="#a5d85e"
          emissiveIntensity={1.0}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial
          color="#7455ff"
          emissive="#7455ff"
          emissiveIntensity={2.2}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function GlassCard({
  def,
  index,
  active,
  maturity,
  tex,
}: {
  def: CardDef;
  index: number;
  active: boolean;
  maturity: number;
  tex: THREE.Texture;
}) {
  const group = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!group.current || !planeRef.current) return;
    const t = state.clock.elapsedTime;
    const bob = Math.sin(t * 0.9 + index * 1.3) * 0.06;
    group.current.position.y = bob;
    group.current.rotation.z = Math.sin(t * 0.5 + index) * 0.01;
    if (active) {
      group.current.rotation.y += (def.rotY - group.current.rotation.y) * delta * 2.2;
    }
  });

  const pos = new THREE.Vector3(
    Math.cos(def.rotY) * CARD_RADIUS,
    0.2 + Math.sin(index * 1.7) * 0.1,
    Math.sin(def.rotY) * CARD_RADIUS,
  );

  return (
    <group ref={group} position={pos}>
      <mesh ref={planeRef} rotation={[0, 0, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial
          map={tex}
          transparent
          opacity={0.92}
          roughness={0.35}
          metalness={0.05}
          side={THREE.DoubleSide}
          depthWrite={true}
          envMapIntensity={0.3}
        />
      </mesh>

      <lineSegments geometry={new THREE.EdgesGeometry(new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT))}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </lineSegments>

      {def.accent === 'lime' ? (
        <mesh position={[CARD_WIDTH / 2 - 0.04, CARD_HEIGHT / 2 - 0.04, 0.01]}>
          <planeGeometry args={[0.34, 0.34]} />
          <meshBasicMaterial color="#a5d85e" transparent opacity={0.9} />
        </mesh>
      ) : (
        <mesh position={[CARD_WIDTH / 2 - 0.04, CARD_HEIGHT / 2 - 0.04, 0.01]}>
          <planeGeometry args={[0.34, 0.34]} />
          <meshBasicMaterial color="#7455ff" transparent opacity={0.9} />
        </mesh>
      )}

      {active && (
        <mesh position={[0, -CARD_HEIGHT / 2 - 0.05, 0.02]}>
          <planeGeometry args={[CARD_WIDTH * 0.7, 0.12]} />
          <meshBasicMaterial
            color={def.accent === 'lime' ? '#a5d85e' : '#7455ff'}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      )}

      {active && (
        <group position={[CARD_WIDTH / 2 + 0.55, CARD_HEIGHT / 2 - 0.2, 0.1]}>
          <mesh>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial
              map={makeGlyphTexture(def.id === 'discover' ? '</>' : def.id === 'ship' ? '✓' : '★')}
              transparent
              opacity={0.95}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

function ConnectiveSpline({ activeIndex }: { activeIndex: number }) {
  const ref = useRef<THREE.Line>(null);
  const pointsRef = useRef<THREE.Vector3[]>([]);
  const progressRef = useRef(0);
  const pulseRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current || !pulseRef.current) return;
    const pts: THREE.Vector3[] = [];
    const steps = 120;
    const t = state.clock.elapsedTime;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const angle = lerp(CARDS[0].rotY, CARDS[3].rotY, u) + 0.35;
      const r = CARD_RADIUS + 0.6 + Math.sin(u * Math.PI) * 0.25;
      const y = Math.sin(u * Math.PI) * 0.35 + 0.15 + Math.sin(t * 1.2 + u * 4) * 0.04;
      pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    pointsRef.current = pts;

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    ref.current.geometry.dispose();
    ref.current.geometry = geo;

    // pulses flowing along spline
    pulseRef.current.clear();
    progressRef.current += delta * 0.18;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const p = (progressRef.current + i / n) % 1;
      const idx = Math.floor(p * (pts.length - 1));
      const frac = p * (pts.length - 1) - idx;
      const a = pts[idx] || pts[0];
      const b = pts[Math.min(idx + 1, pts.length - 1)] || pts[pts.length - 1];
      const pos = new THREE.Vector3().lerpVectors(a, b, frac);
      const hue = i % 2 === 0 ? '#7455ff' : '#a5d85e';
      const size = 0.1 + Math.sin(t * 4 + i * 1.3) * 0.02;
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(size, 12, 12),
        new THREE.MeshBasicMaterial({ color: hue, transparent: true, opacity: 0.9, depthWrite: false }),
      );
      m.position.copy(pos);
      pulseRef.current.add(m);
    }
  });

  return (
    <group>
      <line ref={ref}>
        <bufferGeometry />
        <lineBasicMaterial color="#7455ff" transparent opacity={0.45} linewidth={2} />
      </line>
      <group ref={pulseRef} />
    </group>
  );
}

function MissionSceneInner({
  stage,
  reducedMotion,
  scrollVelocity,
}: {
  stage: number;
  reducedMotion: boolean;
  scrollVelocity: number;
}) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const lastRef = useRef(0);
  const cardTextures = cardTextureProvider();
  const [scrollVel, setScrollVel] = useState(scrollVelocity);
  const [stageVel, setStageVel] = useState(0);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  const onMouse = useCallback((e: { clientX: number; clientY: number }) => {
    setMouse({ x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 });
  }, []);

  useEffect(() => {
    setScrollVel(scrollVelocity);
    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastRef.current);
      lastRef.current = now;
      const v = Math.abs(window.scrollY - lastRef.current) * 0.0002 / (dt || 1);
      void v;
      setScrollVel(v);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollVelocity]);

  const cameraTarget = useCallback(() => {
    const s = clampf(stage, 0, 1);
    const rawIndex = s * (CARDS.length - 1);
    const i0 = Math.floor(rawIndex);
    const i1 = Math.min(i0 + 1, CARDS.length - 1);
    const frac = easeInOutCubic(clampf(rawIndex - i0, 0, 1));
    const c0 = CARDS[i0];
    const c1 = CARDS[i1];
    const angle = lerp(c0.rotY, c1.rotY, frac);
    const r = CARD_RADIUS * 1.7 + Math.sin(lerp(c0.offset, c1.offset, frac) * Math.PI) * 0.4;
    return {
      pos: new THREE.Vector3(
        Math.cos(angle) * r,
        lerp(0.4, 0.15, frac) + Math.cos(lerp(c0.offset, c1.offset, frac) * Math.PI) * 0.25,
        Math.sin(angle) * r,
      ),
      target: new THREE.Vector3(0, 0.15, 0),
    };
  }, [stage]);

  const cameraPos = cameraTarget();

  return (
    <group onPointerMove={onMouse}>
      <color attach="background" args={['#ffffff']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[8, 12, 6]} intensity={1.1} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-6, 4, -8]} intensity={0.5} color="#a5d85e" />
      <pointLight position={[0, 2, 3]} intensity={0.6} color="#7455ff" />

      <Pedestal activeStage={stage} />

      <MonolithCore
        activeStage={stage}
        scrollVelocity={reducedMotion ? 0 : scrollVel}
        mouseX={mouse.x}
        mouseY={mouse.y}
      />

      {CARDS.map((def, i) => (
        <GlassCard
          key={def.id}
          def={def}
          index={i}
          active={i === stage}
          maturity={i < stage ? 1 : i === stage ? 0.9 : 0.25}
          tex={cardTextures[i]}
        />
      ))}

      <ConnectiveSpline activeIndex={stage} />

      <perspectiveCamera makeDefault position={cameraPos.pos} fov={48} near={0.1} far={100} />

      {reducedMotion && <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0.6} maxPolarAngle={1.4} />}
    </group>
  );
}

export function MissionScene({
  stage: controlledStage,
  reducedMotion,
  scrollVelocity = 0,
}: {
  stage: number;
  reducedMotion: boolean;
  scrollVelocity?: number;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [orbitMode, setOrbitMode] = useState(false);
  const [manualStage, setManualStage] = useState(0);
  const [pillGlow, setPillGlow] = useState(0);

  useEffect(() => {
    if (!orbitMode) {
      setManualStage(controlledStage);
    }
  }, [controlledStage, orbitMode]);

  useEffect(() => {
    const id = setInterval(() => {
      setPillGlow((p) => (p + 0.02) % 1);
    }, 16);
    return () => clearInterval(id);
  }, []);

  const stageToUse = orbitMode ? controlledStage : manualStage;

  return (
    <div
      ref={canvasRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        onPointerMissedCapture={undefined as any}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>

        <MissionSceneInner stage={stageToUse} reducedMotion={reducedMotion} scrollVelocity={scrollVelocity} />
      </Canvas>

      {/* Stage timeline scrubber overlay */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '2.4rem',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-end',
          pointerEvents: orbitMode ? 'none' : 'auto',
          userSelect: 'none',
        }}
      >
        {CARDS.map((def, i) => {
          const active = i === stageToUse;
          const done = i < stageToUse;
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => {
                setManualStage(i);
                setPillGlow(0);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                padding: '0',
                cursor: orbitMode ? 'default' : 'pointer',
              }}
              onMouseEnter={() => !orbitMode && setPillGlow(1)}
              onMouseLeave={() => !orbitMode && setPillGlow(0)}
            >
              <span
                style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '999px',
                  background: done || active ? (def.accent === 'lime' ? '#a5d85e' : '#7455ff') : '#e6e6e6',
                  boxShadow: active
                    ? `0 0 0.5rem ${def.accent === 'lime' ? '#a5d85e' : '#7455ff'}, 0 0 1rem ${def.accent === 'lime' ? '#a5d85e' : '#7455ff'}`
                    : 'none',
                  transition: 'background 0.2s ease, box-shadow 0.2s ease',
                  opacity: 0.5 + pillGlow * 0.5,
                }}
              />
              <span
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.08em',
                  color: active ? (def.accent === 'lime' ? '#3f5d24' : '#3a2c7e') : '#777777',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {def.label}
              </span>
              <span
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '0.55rem',
                  color: '#b9bcc8',
                  letterSpacing: '0.04em',
                }}
              >
                {def.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* orbit mode toggle */}
      <div
        style={{
          position: 'absolute',
          top: '1.6rem',
          right: '1.6rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => setOrbitMode((o) => !o)}
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: orbitMode ? '#7455ff' : '#777777',
            background: orbitMode ? 'rgba(116,85,255,0.08)' : 'transparent',
            border: `1px solid ${orbitMode ? '#7455ff' : '#e6e6e6'}`,
            borderRadius: '999px',
            padding: '0.4rem 0.9rem',
            cursor: 'pointer',
            transition: 'color 0.2s ease, background 0.2s ease, border-color 0.2s ease',
          }}
        >
          {orbitMode ? 'EXIT ORBIT' : '360° INSPECT'}
        </button>
      </div>
    </div>
  );
}

export type { CardDef };
