"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CubeScene = CubeScene;
var react_1 = require("react");
var fiber_1 = require("@react-three/fiber");
var drei_1 = require("@react-three/drei");
var THREE = require("three");
var CanvasErrorBoundary = /** @class */ (function (_super) {
    __extends(CanvasErrorBoundary, _super);
    function CanvasErrorBoundary() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = { failed: false };
        return _this;
    }
    CanvasErrorBoundary.getDerivedStateFromError = function () {
        return { failed: true };
    };
    CanvasErrorBoundary.prototype.componentDidCatch = function (error, info) {
        console.error("Unable to initialize 3D scene; using the static fallback.", error, info);
    };
    CanvasErrorBoundary.prototype.render = function () {
        return this.state.failed ? this.props.fallback : this.props.children;
    };
    return CanvasErrorBoundary;
}(react_1.Component));
function CampusCodeBars() {
    var barShape = (0, react_1.useMemo)(function () {
        var shape = new THREE.Shape();
        var width = 0.115;
        var height = 0.7;
        var skew = 0.075;
        shape.moveTo(0, -height / 2);
        shape.lineTo(width, -height / 2);
        shape.lineTo(width + skew, height / 2);
        shape.lineTo(skew, height / 2);
        shape.closePath();
        return shape;
    }, []);
    var colors = ["#141414", "#7566ff", "#8bcf19"];
    return (<group position={[0, 0, 0.76]}>
      {[-0.19, 0, 0.19].map(function (x, index) { return (<mesh key={colors[index]} position={[x, 0, 0]} castShadow>
          <extrudeGeometry args={[
                barShape,
                {
                    depth: 0.026,
                    bevelEnabled: true,
                    bevelThickness: 0.008,
                    bevelSize: 0.008,
                    bevelSegments: 2,
                    curveSegments: 1,
                },
            ]}/>
          <meshStandardMaterial color={colors[index]} roughness={index === 0 ? 0.32 : 0.26} metalness={index === 0 ? 0.2 : 0.32} envMapIntensity={0.85}/>
        </mesh>); })}
    </group>);
}
function OrbitalRings() {
    var silver = (<meshStandardMaterial color="#d8d8d1" roughness={0.16} metalness={1} envMapIntensity={1.35}/>);
    return (<group>
      <mesh rotation={[Math.PI / 2.22, 0.1, 0.44]}>
        <torusGeometry args={[1.38, 0.011, 8, 220]}/>
        {silver}
      </mesh>
      <mesh rotation={[1.14, 0.52, -0.7]}>
        <torusGeometry args={[1.66, 0.008, 8, 240]}/>
        {silver}
      </mesh>
      <mesh rotation={[Math.PI / 2.85, 1.04, 0.2]}>
        <torusGeometry args={[1.16, 0.009, 8, 200]}/>
        {silver}
      </mesh>
    </group>);
}
function Satellites() {
    return (<group>
      <mesh position={[1.3, 0.68, 0.58]} castShadow>
        <sphereGeometry args={[0.165, 48, 48]}/>
        <meshPhysicalMaterial color="#7665ff" roughness={0.08} metalness={0.18} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={1.4}/>
      </mesh>
      <mesh position={[-1.14, -0.56, 0.82]} castShadow>
        <sphereGeometry args={[0.125, 40, 40]}/>
        <meshPhysicalMaterial color="#a8e62e" roughness={0.12} metalness={0.08} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={1.3}/>
      </mesh>
      <mesh position={[0.38, -1.26, 0.55]} castShadow>
        <sphereGeometry args={[0.105, 36, 36]}/>
        <meshStandardMaterial color="#cfcfca" roughness={0.08} metalness={1} envMapIntensity={1.5}/>
      </mesh>
      <mesh position={[-0.62, 1.34, -0.32]} castShadow>
        <sphereGeometry args={[0.075, 32, 32]}/>
        <meshStandardMaterial color="#e8e8e2" roughness={0.13} metalness={0.95} envMapIntensity={1.2}/>
      </mesh>
    </group>);
}
function SceneContent(_a) {
    var progress = _a.progress, reducedMotion = _a.reducedMotion;
    var floatGroup = (0, react_1.useRef)(null);
    var markGroup = (0, react_1.useRef)(null);
    var ringsGroup = (0, react_1.useRef)(null);
    var satellitesGroup = (0, react_1.useRef)(null);
    var smoothProgress = (0, react_1.useRef)(0);
    (0, fiber_1.useFrame)(function (state, delta) {
        var group = floatGroup.current;
        if (!group)
            return;
        var p = progress.current;
        smoothProgress.current = THREE.MathUtils.damp(smoothProgress.current, p, 4.5, Math.min(delta, 0.05));
        var eased = THREE.MathUtils.smoothstep(smoothProgress.current, 0.08, 0.92);
        if (reducedMotion) {
            group.position.set(0, 0, 0);
            group.rotation.set(-0.08, 0.42, 0.03);
            group.scale.setScalar(1);
            return;
        }
        var time = state.clock.elapsedTime;
        var float = Math.sin(time * 0.66) * 0.055;
        group.position.x = eased * 0.36 + Math.sin(time * 0.32) * 0.025;
        group.position.y = float - eased * 0.1;
        group.position.z = eased * 0.28;
        // The cube turns just enough to catch the light while keeping the CC mark
        // readable; the orbital rings carry the continuous rotation instead.
        group.rotation.x = -0.1 + Math.sin(time * 0.44) * 0.055 + eased * 0.24;
        group.rotation.y = 0.26 + Math.sin(time * 0.24) * 0.3 + eased * 0.38;
        group.rotation.z = Math.sin(time * 0.26) * 0.025 + eased * 0.05;
        var scale = 1 + Math.sin(time * 0.5) * 0.008 + eased * 0.07;
        group.scale.setScalar(scale);
        if (markGroup.current) {
            markGroup.current.rotation.z = Math.sin(time * 0.5) * 0.006;
        }
        if (ringsGroup.current) {
            ringsGroup.current.rotation.y = time * 0.055 + eased * 0.45;
            ringsGroup.current.rotation.z = -time * 0.035 - eased * 0.25;
        }
        if (satellitesGroup.current) {
            satellitesGroup.current.rotation.y = time * 0.22 + eased * 0.5;
            satellitesGroup.current.rotation.z = Math.sin(time * 0.3) * 0.07;
        }
    });
    return (<>
      <ambientLight intensity={0.42}/>
      <directionalLight position={[4.5, 5.5, 4.5]} intensity={2.5} color="#fffdf6"/>
      <directionalLight position={[-4, -1.5, 3]} intensity={0.7} color="#9c8fff"/>
      <pointLight position={[3.5, -2.5, 2.5]} intensity={2.2} color="#a8e62e" distance={9}/>

      <drei_1.Environment resolution={96} frames={1}>
        <drei_1.Lightformer intensity={4.5} position={[0, 4, 3]} scale={[8, 8, 1]} color="#ffffff"/>
        <drei_1.Lightformer intensity={2} position={[-4, 1, 3]} scale={[4, 4, 1]} color="#efeaff"/>
        <drei_1.Lightformer intensity={1.6} position={[4, 1.5, 1]} scale={[3, 3, 1]} color="#f4ffde"/>
        <drei_1.Lightformer intensity={1.2} position={[0, -4, 1]} scale={[6, 3, 1]} color="#ffffff"/>
      </drei_1.Environment>

      <group ref={floatGroup}>
        <drei_1.RoundedBox args={[1.5, 1.5, 1.5]} radius={0.065} smoothness={5} castShadow receiveShadow>
          <meshPhysicalMaterial color="#fbfbf7" roughness={0.36} metalness={0.02} clearcoat={0.4} clearcoatRoughness={0.28} envMapIntensity={0.8}/>
        </drei_1.RoundedBox>

        <group ref={markGroup} scale={1.08}>
          <CampusCodeBars />
        </group>

        <group ref={ringsGroup}>
          <OrbitalRings />
        </group>

        <group ref={satellitesGroup}>
          <Satellites />
        </group>
      </group>

      <drei_1.ContactShadows position={[0, -1.75, 0]} opacity={0.28} scale={9} blur={2.8} far={4.5} resolution={256} color="#22221e"/>
    </>);
}
function CubeScene(_a) {
    var progress = _a.progress, _b = _a.reducedMotion, reducedMotion = _b === void 0 ? false : _b;
    var wrapRef = (0, react_1.useRef)(null);
    var _c = (0, react_1.useState)(true), inView = _c[0], setInView = _c[1];
    (0, react_1.useEffect)(function () {
        var node = wrapRef.current;
        if (!node)
            return;
        var observer = new IntersectionObserver(function (entries) { var _a, _b; return setInView((_b = (_a = entries[0]) === null || _a === void 0 ? void 0 : _a.isIntersecting) !== null && _b !== void 0 ? _b : false); }, { rootMargin: "120px" });
        observer.observe(node);
        return function () { return observer.disconnect(); };
    }, []);
    var fallback = <div className="hero-object-fallback" aria-hidden="true"/>;
    return (<div className="hero-object-inner" ref={wrapRef}>
      <CanvasErrorBoundary fallback={fallback}>
        <fiber_1.Canvas fallback={fallback} shadows dpr={[1, 1.5]} camera={{ position: [0, 0.15, 7.2], fov: 34 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} frameloop={inView ? "always" : "never"} style={{ background: "transparent" }}>
          <react_1.Suspense fallback={null}>
            <SceneContent progress={progress} reducedMotion={reducedMotion}/>
          </react_1.Suspense>
        </fiber_1.Canvas>
      </CanvasErrorBoundary>
    </div>);
}
