import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Html,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import "./styles.css";

const CAR_MODEL_URL = `${import.meta.env.BASE_URL}models/performance-sedan.glb`;

const PAINTS = [
  { id: "titanium", name: "TITANIUM SILVER", hex: "#7B838A" },
  { id: "gunmetal", name: "GUNMETAL GREY", hex: "#454B50" },
  { id: "obsidian", name: "OBSIDIAN BLACK", hex: "#16181A" },
  { id: "sapphire", name: "SAPPHIRE BLUE", hex: "#174A78" },
  { id: "midnight", name: "MIDNIGHT BLUE", hex: "#17263D" },
  { id: "emerald", name: "EMERALD GREEN", hex: "#1B5B48" },
  { id: "bronze", name: "BRUSHED BRONZE", hex: "#6A4C2F" },
  { id: "copper", name: "COPPER ORANGE", hex: "#A84F24" },
  { id: "crimson", name: "CRIMSON RED", hex: "#8B1F2D" },
  { id: "violet", name: "VIOLET STEEL", hex: "#4D3B66" },
];

const MODS = [
  {
    id: "wheels",
    number: "01",
    title: "FORGED WHEELS",
    tag: "UNSPRUNG MASS",
    price: "FROM ₹48K",
    icon: "wheel",
    text: "Lightweight forged wheel packages with aggressive fitment, stronger road presence and sharper response.",
  },
  {
    id: "brakes",
    number: "02",
    title: "BIG BRAKE KIT",
    tag: "STOPPING POWER",
    price: "FROM ₹65K",
    icon: "brake",
    text: "Performance rotors, pads and caliper packages designed for repeated hard braking and better pedal feel.",
  },
  {
    id: "lighting",
    number: "03",
    title: "LED SIGNATURE",
    tag: "VISION SYSTEM",
    price: "FROM ₹18K",
    icon: "light",
    text: "Sharper projector lighting, signature LEDs and clean visual upgrades that transform the front profile.",
  },
  {
    id: "exhaust",
    number: "04",
    title: "VALVED EXHAUST",
    tag: "SOUND / FLOW",
    price: "FROM ₹32K",
    icon: "exhaust",
    text: "Street-friendly when closed, dramatic when open. Tuned systems for sound, response and flow.",
  },
  {
    id: "suspension",
    number: "05",
    title: "COILOVER SETUP",
    tag: "STANCE / CONTROL",
    price: "FROM ₹42K",
    icon: "spring",
    text: "Dial in ride height, stance and handling with performance suspension matched to the way you drive.",
  },
  {
    id: "aero",
    number: "06",
    title: "AERO PACKAGE",
    tag: "FORM / FUNCTION",
    price: "FROM ₹55K",
    icon: "aero",
    text: "Splitters, side skirts, diffusers and wings shaped around a cleaner and more aggressive silhouette.",
  },
  {
    id: "intake",
    number: "07",
    title: "COLD AIR INTAKE",
    tag: "AIR / RESPONSE",
    price: "FROM ₹24K",
    icon: "intake",
    text: "High-flow intake hardware designed to sharpen throttle response and feed the engine with cooler air.",
  },
  {
    id: "ecu",
    number: "08",
    title: "ECU CALIBRATION",
    tag: "POWER MAP",
    price: "FROM ₹38K",
    icon: "ecu",
    text: "Custom software calibration for smoother delivery, stronger mid-range response and selectable maps.",
  },
  {
    id: "tyres",
    number: "09",
    title: "PERFORMANCE TYRES",
    tag: "GRIP / TRACTION",
    price: "FROM ₹52K",
    icon: "wheel",
    text: "High-grip road and track tyre packages matched to wheel width, suspension geometry and driving style.",
  },
  {
    id: "bodykit",
    number: "10",
    title: "WIDEBODY SYSTEM",
    tag: "STANCE / BODY",
    price: "FROM ₹1.2L",
    icon: "aero",
    text: "Integrated arches, side profiles and bumper extensions for a wider, lower and more purposeful stance.",
  },
  {
    id: "interior",
    number: "11",
    title: "COCKPIT PACKAGE",
    tag: "DRIVER / CABIN",
    price: "FROM ₹45K",
    icon: "interior",
    text: "Steering, seat, trim and ambient upgrades that turn the cabin into a more focused driver environment.",
  },
  {
    id: "protection",
    number: "12",
    title: "PPF + CERAMIC",
    tag: "FINISH / PROTECT",
    price: "FROM ₹60K",
    icon: "shield",
    text: "Paint protection film and ceramic finish systems for gloss, easier maintenance and daily protection.",
  },
];

const SERVICES = [
  { code: "01", title: "WHEELS & TYRES", text: "Alloy and forged wheel upgrades, tyre selection, balancing, hub rings, spacers and fitment planning.", icon: "wheel" },
  { code: "02", title: "SUSPENSION & STANCE", text: "Lowering springs, coilovers, ride-height setup, alignment and road-friendly stance tuning.", icon: "spring" },
  { code: "03", title: "BRAKE UPGRADES", text: "Performance pads, rotors, braided lines, fluids and big-brake packages for stronger, repeatable braking.", icon: "brake" },
  { code: "04", title: "EXHAUST & SOUND", text: "Axle-back, cat-back and valved systems, tips and custom fabrication focused on tone, flow and finish.", icon: "exhaust" },
  { code: "05", title: "INTAKE & ENGINE BAY", text: "High-flow filters, cold-air intake systems, dress-up parts and carefully planned engine-bay upgrades.", icon: "intake" },
  { code: "06", title: "ECU & PERFORMANCE", text: "Vehicle-specific ECU calibration, response tuning and supporting hardware recommendations where suitable.", icon: "ecu" },
  { code: "07", title: "LIGHTING", text: "Projector upgrades, LED signatures, fog lamps, cabin ambient lighting and clean wiring integration.", icon: "light" },
  { code: "08", title: "BODY & AERO", text: "Splitters, skirts, diffusers, spoilers, widebody components and exterior styling installation.", icon: "aero" },
  { code: "09", title: "INTERIOR CUSTOM", text: "Steering, trim, upholstery accents, ambient lighting and driver-focused cabin upgrades.", icon: "interior" },
  { code: "10", title: "WRAP / PPF / CERAMIC", text: "Colour-change wraps, paint-protection film and ceramic protection to finish and preserve the build.", icon: "shield" },
  { code: "11", title: "ALIGNMENT & FITMENT", text: "Wheel clearance checks, alignment, ride-height verification and final fitment inspection after modification.", icon: "wheel" },
  { code: "12", title: "CUSTOM BUILD CONSULT", text: "A complete modification roadmap built around your vehicle, usage, style, priorities and budget.", icon: "ecu" },
];

const RATE_CARD = [
  ["Build consultation", "₹999", "Vehicle + goals review"],
  ["Diagnostic inspection", "₹1,499", "Pre-build health check"],
  ["Wheel fitment package", "₹2,999", "Fitment + balance check"],
  ["Performance alignment", "₹3,499", "Road / stance setup"],
  ["Lowering spring install", "₹6,999", "Labour from"],
  ["Coilover installation", "₹9,999", "Setup labour from"],
  ["Brake pad upgrade labour", "₹3,499", "Per axle from"],
  ["Big-brake kit installation", "₹9,999", "Labour from"],
  ["Cat-back exhaust install", "₹4,999", "Bolt-on labour from"],
  ["Custom exhaust fabrication", "₹12,999", "Fabrication from"],
  ["LED / projector install", "₹2,499", "Labour from"],
  ["Body kit installation", "₹14,999", "Fitment labour from"],
  ["Interior ambient lighting", "₹8,999", "Package from"],
  ["ECU calibration", "₹24,999", "Vehicle dependent"],
  ["PPF package", "₹55,000", "Coverage dependent"],
  ["Ceramic protection", "₹18,000", "Package from"],
];

const BUILD_PACKAGES = [
  {
    name: "DAILY+",
    tag: "CLEAN / COMFORTABLE",
    price: "FROM ₹65K",
    items: ["Wheels / tyres", "Mild stance", "Lighting refresh", "Alignment & fitment"],
  },
  {
    name: "STREET SPORT",
    tag: "LOOK / SOUND / RESPONSE",
    price: "FROM ₹1.65L",
    items: ["Wheel package", "Coilovers", "Valved exhaust", "Intake / braking"],
  },
  {
    name: "SHOW SPEC",
    tag: "VISUAL IMPACT",
    price: "FROM ₹2.75L",
    items: ["Aero / body", "Aggressive fitment", "Lighting / interior", "Wrap / protection"],
  },
];

const FAQS = [
  ["Can I modify a daily-driven car?", "Yes. The build can be planned around comfort, reliability and daily road use instead of maximum aggression."],
  ["Do I need to modify everything at once?", "No. A staged build can begin with wheels, tyres or suspension and expand later into braking, exhaust, lighting and aero."],
  ["How do you choose compatible parts?", "Vehicle specification, fitment, clearance, intended use and the overall build direction are considered before parts are approved."],
  ["Can the workshop build around a budget?", "Yes. A budget range helps prioritise the upgrades that create the strongest visual or driving improvement first."],
  ["Can I focus only on appearance?", "Yes. Cosmetic builds can centre on wheels, stance, lighting, aero, interior trim and paint protection without performance tuning."],
  ["Will lowering my car make it uncomfortable?", "Not necessarily. Spring rate, damper setup, tyre profile and ride height can be chosen to keep a road-friendly balance."],
  ["Can you help me choose wheel size and offset?", "Yes. Fitment planning considers wheel width, offset, tyre size, suspension clearance and the look you want."],
  ["Do performance upgrades need supporting hardware?", "Sometimes. Intake, exhaust, cooling, tyres or braking may be recommended before or alongside power-focused upgrades."],
  ["Can I bring my own parts?", "That can be discussed before booking. Parts should be verified for quality, compatibility and completeness before installation."],
  ["How long does a modification build take?", "Timing depends on parts availability and job complexity. Simple fitment may take hours, while fabrication or complete builds can take several days."],
  ["Do you offer paint protection after modification?", "Yes. PPF and ceramic options can be planned after body, aero and detailing work so the finished build is easier to maintain."],
  ["Can I plan future upgrades before I start?", "Yes. A staged roadmap can prevent duplicated labour and help make sure wheels, suspension, brakes, power and aero work together."],
];

function PartIcon({ type }) {
  if (type === "wheel") {
    return (
      <div className="part-icon part-wheel" aria-hidden="true">
        <span className="wheel-rim" />
        <span className="wheel-hub" />
      </div>
    );
  }

  if (type === "brake") {
    return (
      <div className="part-icon part-brake" aria-hidden="true">
        <span className="brake-disc" />
        <span className="brake-caliper" />
      </div>
    );
  }

  if (type === "exhaust") {
    return (
      <div className="part-icon part-exhaust" aria-hidden="true">
        <span />
        <span />
      </div>
    );
  }

  if (type === "spring") {
    return (
      <div className="part-icon part-spring" aria-hidden="true">
        <span />
      </div>
    );
  }

  if (type === "aero") {
    return (
      <div className="part-icon part-aero" aria-hidden="true">
        <span />
      </div>
    );
  }

  if (type === "intake") {
    return <div className="part-icon part-intake" aria-hidden="true"><span /><span /></div>;
  }

  if (type === "ecu") {
    return <div className="part-icon part-ecu" aria-hidden="true"><span>ECU</span></div>;
  }

  if (type === "interior") {
    return <div className="part-icon part-interior" aria-hidden="true"><span /><span /></div>;
  }

  if (type === "shield") {
    return <div className="part-icon part-shield" aria-hidden="true"><span /></div>;
  }

  return (
    <div className="part-icon part-light" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}


function HeaderCarLogo() {
  return (
    <span className="header-car-logo" aria-hidden="true">
      <svg viewBox="0 0 64 40">
        <path className="logo-shield" d="M32 3 55 10v10.5C55 30.8 46.4 36.3 32 39 17.6 36.3 9 30.8 9 20.5V10L32 3Z" />
        <path className="logo-speed-line logo-speed-one" d="M5 15h13" />
        <path className="logo-speed-line logo-speed-two" d="M2 21h14" />
        <path className="logo-speed-line logo-speed-three" d="M6 27h11" />
        <path className="logo-am" d="M20 28 27.5 12h5L39 28h-4.8l-1.4-3.6h-6.6L24.8 28H20Zm7.5-7.5h4l-2-5.2-2 5.2ZM40.5 28V12h4.2l5 7.2 5-7.2h4.2v16h-4.5v-9l-4.7 6.5-4.7-6.5v9h-4.5Z" />
        <path className="logo-road" d="M23 32h18" />
      </svg>
    </span>
  );
}

function HeaderLightIcon({ active }) {
  return (
    <span className={`header-light-icon ${active ? "active" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 38 38">
        <path className="light-lamp" d="M7.5 19c0-6.3 5.1-11.5 11.5-11.5S30.5 12.7 30.5 19c0 4-2 7-5.2 9.1H12.7C9.5 26 7.5 23 7.5 19Z" />
        <path className="light-base" d="M13.5 28h11M15.5 31.5h7" />
        <path className="light-ray" d="M19 2v3M5.5 6.5l3 3M32.5 6.5l-3 3M1.5 19h4M32.5 19h4" />
      </svg>
    </span>
  );
}

function HeaderDriveIcon({ returning }) {
  return (
    <span className={`header-drive-icon ${returning ? "returning" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 46 34">
        <path className="drive-road-icon" d="M4 27h38" />
        <path className="drive-car-icon" d="M8 22.5 12 16h5l4.5-5h10l5.5 5h3l3 6.5H8Z" />
        <circle className="drive-wheel-icon" cx="15" cy="24.5" r="3.5" />
        <circle className="drive-wheel-icon" cx="36" cy="24.5" r="3.5" />
        {returning ? (
          <path className="drive-action-icon" d="M27 6h-9m0 0 4-4m-4 4 4 4" />
        ) : (
          <path className="drive-action-icon" d="M18 6h9m0 0-4-4m4 4-4 4" />
        )}
      </svg>
    </span>
  );
}

function Loader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="car-loader">
        <div className="loader-wheel">
          <span />
        </div>
        <strong>{Math.round(progress)}%</strong>
        <small>LOADING PERFORMANCE MACHINE</small>
      </div>
    </Html>
  );
}

function CameraRig({ driveMode }) {
  const { camera, size } = useThree();
  const mobile = size.width < 760;
  const heroCameraDesktop = useMemo(() => new THREE.Vector3(6.4, 2.15, 7.4), []);
  const heroCameraMobile = useMemo(() => new THREE.Vector3(6.9, 2.35, 10.8), []);
  const driveCameraDesktop = useMemo(() => new THREE.Vector3(0, 1.65, 10.6), []);
  const driveCameraMobile = useMemo(() => new THREE.Vector3(0, 1.95, 13.4), []);

  useFrame(() => {
    const heroCamera = mobile ? heroCameraMobile : heroCameraDesktop;
    const driveCamera = mobile ? driveCameraMobile : driveCameraDesktop;
    camera.position.lerp(driveMode ? driveCamera : heroCamera, driveMode ? 0.07 : 0.06);
    camera.lookAt(0, driveMode ? -0.55 : -0.3, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

function findObjectByKeywords(root, keywords) {
  let result = null;

  root.traverse((object) => {
    if (result) return;
    const name = (object.name || "").toLowerCase();
    if (keywords.some((keyword) => name.includes(keyword))) {
      result = object;
    }
  });

  return result;
}

function CarModel({
  rotation,
  leftDoorOpen,
  rightDoorOpen,
  wheelsMoving,
  headlights,
  bonnetOpen,
  bootOpen,
  engineOn,
  driveMode,
  paintTone,
  customPaint,
  onPartClick,
  onCapabilities,
  isMobile,
}) {
  const group = useRef();
  const { scene } = useGLTF(CAR_MODEL_URL);
  const carScene = useMemo(() => scene.clone(true), [scene]);

  const leftDoorPivot = useRef(null);
  const rightDoorPivot = useRef(null);
  const bonnetPivot = useRef(null);
  const bootPivot = useRef(null);
  const wheelPivots = useRef([]);
  const lightMaterials = useRef([]);
  const paintMaterials = useRef([]);
  const driveProgress = useRef(0);

  useEffect(() => {
    carScene.updateMatrixWorld(true);

    const createPivot = (object, worldPosition) => {
      if (!object || !object.parent) return null;

      const pivot = new THREE.Group();
      pivot.name = `${object.name}_WEB_PIVOT`;

      const rootInverse = new THREE.Matrix4()
        .copy(carScene.matrixWorld)
        .invert();
      const localPosition = worldPosition
        .clone()
        .applyMatrix4(rootInverse);

      pivot.position.copy(localPosition);
      carScene.add(pivot);
      carScene.updateMatrixWorld(true);
      pivot.attach(object);
      return pivot;
    };

    const leftDoor = carScene.getObjectByName("DOOR_L");
    const rightDoor = carScene.getObjectByName("DOOR_R");

    if (leftDoor) {
      const box = new THREE.Box3().setFromObject(leftDoor);
      const center = box.getCenter(new THREE.Vector3());
      const hinge = new THREE.Vector3(box.max.x, center.y, box.max.z);
      leftDoorPivot.current = createPivot(leftDoor, hinge);
    }

    if (rightDoor) {
      const box = new THREE.Box3().setFromObject(rightDoor);
      const center = box.getCenter(new THREE.Vector3());
      const hinge = new THREE.Vector3(box.min.x, center.y, box.max.z);
      rightDoorPivot.current = createPivot(rightDoor, hinge);
    }

    const bonnet = findObjectByKeywords(carScene, ["bonnet", "hood"]);
    const boot = findObjectByKeywords(carScene, ["boot", "trunk", "decklid"]);

    if (bonnet) {
      const box = new THREE.Box3().setFromObject(bonnet);
      const center = box.getCenter(new THREE.Vector3());
      const hinge = new THREE.Vector3(center.x, box.max.y, box.min.z);
      bonnetPivot.current = createPivot(bonnet, hinge);
    }

    if (boot) {
      const box = new THREE.Box3().setFromObject(boot);
      const center = box.getCenter(new THREE.Vector3());
      const hinge = new THREE.Vector3(center.x, box.max.y, box.max.z);
      bootPivot.current = createPivot(boot, hinge);
    }

    const wheelNames = ["WHEEL_LF", "WHEEL_RF", "WHEEL_LR", "WHEEL_RR"];
    wheelPivots.current = wheelNames
      .map((name) => {
        const wheel = carScene.getObjectByName(name);
        if (!wheel) return null;
        const box = new THREE.Box3().setFromObject(wheel);
        const center = box.getCenter(new THREE.Vector3());
        const pivot = createPivot(wheel, center);
        if (pivot) pivot.userData.webPart = "wheel";
        return pivot;
      })
      .filter(Boolean);

    lightMaterials.current = [];
    paintMaterials.current = [];

    carScene.traverse((object) => {
      if (!object.isMesh) return;

      const objectName = (object.name || "").toLowerCase();

      // Hide a logo/badge only when the GLB exposes it as its own object.
      // Do NOT hide every object containing the source-car name because many real lights/body parts use it internally.
      const isStandaloneBrandMark = ["logo", "badge", "emblem", "wordmark", "porsche_logo", "porsche_badge"]
        .some((keyword) => objectName.includes(keyword));
      if (isStandaloneBrandMark) {
        object.visible = false;
        return;
      }

      const originalMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      const clonedMaterials = originalMaterials.map((material) => {
        if (!material) return material;

        const cloned = material.clone();
        const materialName = (cloned.name || "").toLowerCase();

        // Keep decals/stickers untouched and only recolour the actual exterior paint.
        if (materialName.includes("ext_carpaint_inst")) {
          paintMaterials.current.push(cloned);
          cloned.metalness = Math.max(cloned.metalness ?? 0, 0.62);
          cloned.roughness = Math.min(cloned.roughness ?? 0.4, 0.24);
        }

        const isFrontLight =
          objectName.includes("emissive_light_front") ||
          objectName.includes("aux_light") ||
          objectName.includes("headlight") ||
          objectName === "l0" ||
          objectName === "l1" ||
          materialName.includes("emissive_light_front") ||
          materialName.includes("aux_light") ||
          materialName.includes("headlight");

        if (isFrontLight && cloned.emissive) {
          cloned.userData.baseEmissive = cloned.emissive.clone();
          cloned.userData.baseEmissiveIntensity = cloned.emissiveIntensity ?? 1;
          lightMaterials.current.push(cloned);
        }

        return cloned;
      });

      object.material = Array.isArray(object.material)
        ? clonedMaterials
        : clonedMaterials[0];
    });

    onCapabilities?.({
      doors: Boolean(leftDoor || rightDoor),
      wheels: wheelPivots.current.length > 0,
      bonnet: Boolean(bonnetPivot.current),
      boot: Boolean(bootPivot.current),
    });

    return () => {
      leftDoorPivot.current = null;
      rightDoorPivot.current = null;
      bonnetPivot.current = null;
      bootPivot.current = null;
      wheelPivots.current = [];
      lightMaterials.current = [];
      paintMaterials.current = [];
    };
  }, [carScene, onCapabilities]);

  useEffect(() => {
    const bodyColor =
      paintTone === "custom"
        ? customPaint
        : PAINTS.find((paint) => paint.id === paintTone)?.hex ?? "#7B838A";

    paintMaterials.current.forEach((material) => {
      material.color.set(bodyColor);

      // Give every preset and custom colour a stronger metallic-car-paint look.
      if ("metalness" in material) material.metalness = Math.max(material.metalness ?? 0, 0.72);
      if ("roughness" in material) material.roughness = Math.min(material.roughness ?? 0.3, 0.24);
      if ("clearcoat" in material) material.clearcoat = 0.92;
      if ("clearcoatRoughness" in material) material.clearcoatRoughness = 0.12;

      material.needsUpdate = true;
    });
  }, [paintTone, customPaint]);

  useEffect(() => {
    lightMaterials.current.forEach((material) => {
      if (!material.emissive) return;

      if (headlights) {
        material.emissive.set("#fff3c4");
        material.emissiveIntensity = 10;
      } else {
        const base = material.userData.baseEmissive;
        if (base) material.emissive.copy(base);
        material.emissiveIntensity =
          material.userData.baseEmissiveIntensity ?? 1;
      }
      material.needsUpdate = true;
    });
  }, [headlights]);

  useFrame((state, delta) => {
    if (group.current) {
      const targetRotation = driveMode ? Math.PI / 2 : rotation;
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        targetRotation,
        0.1
      );

      const idle = engineOn
        ? Math.sin(state.clock.elapsedTime * 24) * 0.008
        : 0;

      // Keep the hero car at its original height, but lower the entire
      // car slightly in DRIVE mode so the road/car sit lower in the hero.
      const targetY = driveMode ? -1.85 : -0.95;

      group.current.position.y = THREE.MathUtils.lerp(
        group.current.position.y,
        targetY + idle,
        0.1
      );

      if (driveMode) {
        driveProgress.current = (driveProgress.current + delta * 3.05) % 18;
        const roadX = -9 + driveProgress.current;
        group.current.position.x = roadX;
        group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, 0.4, 0.08);
        const driveScale = 0.64;
        group.current.scale.lerp(new THREE.Vector3(driveScale, driveScale, driveScale), 0.07);
      } else {
        driveProgress.current = 0;
        group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 0, 0.085);
        group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, 0, 0.085);
        const heroScale = 1.18;
        group.current.scale.lerp(new THREE.Vector3(heroScale, heroScale, heroScale), 0.07);
      }
    }

    const doorAngle = THREE.MathUtils.degToRad(56);

    if (leftDoorPivot.current) {
      leftDoorPivot.current.rotation.y = THREE.MathUtils.lerp(
        leftDoorPivot.current.rotation.y,
        leftDoorOpen ? -doorAngle : 0,
        0.12
      );
    }

    if (rightDoorPivot.current) {
      rightDoorPivot.current.rotation.y = THREE.MathUtils.lerp(
        rightDoorPivot.current.rotation.y,
        rightDoorOpen ? doorAngle : 0,
        0.12
      );
    }

    if (bonnetPivot.current) {
      bonnetPivot.current.rotation.x = THREE.MathUtils.lerp(
        bonnetPivot.current.rotation.x,
        bonnetOpen ? THREE.MathUtils.degToRad(-54) : 0,
        0.1
      );
    }

    if (bootPivot.current) {
      bootPivot.current.rotation.x = THREE.MathUtils.lerp(
        bootPivot.current.rotation.x,
        bootOpen ? THREE.MathUtils.degToRad(52) : 0,
        0.1
      );
    }

    if (wheelsMoving || driveMode) {
      wheelPivots.current.forEach((pivot) => {
        pivot.rotation.x -= delta * 8;
      });
    }
  });

  const handleModelClick = (event) => {
    if (event.delta > 6) return;

    let object = event.object;
    let detected = (object?.name || "").toLowerCase();

    while (object && object !== carScene) {
      const name = (object.name || "").toLowerCase();

      if (name.includes("wheel")) {
        detected = "wheel";
        break;
      }
      if (name.includes("door_l")) {
        detected = "door_l";
        break;
      }
      if (name.includes("door_r")) {
        detected = "door_r";
        break;
      }
      if (name.includes("bonnet") || name.includes("hood")) {
        detected = "bonnet";
        break;
      }
      if (
        name.includes("boot") ||
        name.includes("trunk") ||
        name.includes("decklid")
      ) {
        detected = "boot";
        break;
      }
      if (
        name.includes("engine") ||
        name.includes("motor") ||
        name.includes("intake")
      ) {
        detected = "engine";
        break;
      }
      if (
        name.includes("light_front") ||
        name.includes("aux_light") ||
        name.includes("headlight") ||
        name === "l0" ||
        name === "l1"
      ) {
        detected = "headlight";
        break;
      }

      object = object.parent;
    }

    onPartClick(detected);
  };

  return (
    <group
      ref={group}
      position={[0, -0.95, 0]}
      onClick={handleModelClick}
    >
      <group scale={isMobile ? [104, 104, 104] : [125, 125, 125]}>
        <primitive object={carScene} />
      </group>

      {headlights && (
        <>
          <pointLight
            position={[0.78, 0.55, 2.55]}
            intensity={driveMode ? 18 : 13}
            distance={driveMode ? 10 : 7}
            decay={2}
            color="#fff2bd"
          />
          <pointLight
            position={[-0.78, 0.55, 2.55]}
            intensity={driveMode ? 18 : 13}
            distance={driveMode ? 10 : 7}
            decay={2}
            color="#fff2bd"
          />
          {driveMode && (
            <>
              <mesh position={[0.62, -0.58, 4.55]} rotation-x={Math.PI / 2}>
                <coneGeometry args={[1.15, 4.8, 32, 1, true]} />
                <meshBasicMaterial
                  color="#ffe8a3"
                  transparent
                  opacity={0.10}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              <mesh position={[-0.62, -0.58, 4.55]} rotation-x={Math.PI / 2}>
                <coneGeometry args={[1.15, 4.8, 32, 1, true]} />
                <meshBasicMaterial
                  color="#ffe8a3"
                  transparent
                  opacity={0.10}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </>
          )}
        </>
      )}

      {/* Invisible tap zones sit directly over the physical car areas. */}
      <mesh
        position={[0, 0.18, 1.45]}
        onClick={(event) => { event.stopPropagation(); onPartClick("engine"); }}
      >
        <boxGeometry args={[1.1, 0.34, 0.7]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
      <mesh
        position={[0, 0.42, 2.15]}
        onClick={(event) => { event.stopPropagation(); onPartClick("bonnet"); }}
      >
        <boxGeometry args={[1.7, 0.28, 0.72]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
      <mesh
        position={[0, 0.42, -2.05]}
        onClick={(event) => { event.stopPropagation(); onPartClick("boot"); }}
      >
        <boxGeometry args={[1.65, 0.3, 0.72]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload(CAR_MODEL_URL);

function DriveRoad({ active }) {
  if (!active) return null;

  const dashes = Array.from({ length: 15 }, (_, index) => -10.5 + index * 1.5);

  return (
    <group>
      {/* Real 3D road aligned to the exact X axis used by the moving car. */}
      <mesh position={[0, -1.955, 0]}>
        <boxGeometry args={[22, 0.08, 4.1]} />
        <meshStandardMaterial color="#111519" roughness={0.94} metalness={0.02} />
      </mesh>

      <mesh position={[0, -1.904, 1.72]}>
        <boxGeometry args={[22, 0.012, 0.055]} />
        <meshBasicMaterial color="#f2c44b" />
      </mesh>
      <mesh position={[0, -1.904, -1.72]}>
        <boxGeometry args={[22, 0.012, 0.055]} />
        <meshBasicMaterial color="#f2c44b" />
      </mesh>

      {dashes.map((x) => (
        <mesh key={x} position={[x, -1.903, 0]}>
          <boxGeometry args={[0.74, 0.014, 0.07]} />
          <meshBasicMaterial color="#eef2ee" />
        </mesh>
      ))}
    </group>
  );
}

function CarScene(props) {
  return (
    <>
      <CameraRig driveMode={props.driveMode} />
      <ambientLight intensity={props.headlights ? 2.5 : 1.25} />
      <hemisphereLight
        intensity={props.headlights ? 3.0 : 1.65}
        color="#e9ffff"
        groundColor="#071316"
      />
      <directionalLight position={[7, 7, 6]} intensity={props.headlights ? 7.2 : 4.2} color="#ffffff" />
      <directionalLight position={[-6, 4, -4]} intensity={props.headlights ? 4.2 : 2.4} color="#39f4d4" />
      <pointLight position={[0, 4, -4]} intensity={props.headlights ? 19 : 10} distance={12} color="#795cff" />

      <DriveRoad active={props.driveMode} />

      <Suspense fallback={<Loader />}>
        <CarModel {...props} />
        <Environment preset="city" />
      </Suspense>

      {!props.driveMode && (
        <>
          <mesh rotation-x={-Math.PI / 2} position={[0, -1.04, 0]}>
            <circleGeometry args={[4.8, 96]} />
            <meshBasicMaterial
              color="#0b1f21"
              transparent
              opacity={0.74}
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh rotation-x={-Math.PI / 2} position={[0, -1.03, 0]}>
            <ringGeometry args={[3.35, 3.42, 96]} />
            <meshBasicMaterial color="#5fffe0" transparent opacity={0.7} />
          </mesh>
        </>
      )}
    </>
  );
}

export default function App() {
  const [rotation, setRotation] = useState(-0.36);
  const [autoRotate, setAutoRotate] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [pointerStart, setPointerStart] = useState(null);
  const [rotationStart, setRotationStart] = useState(0);

  const [leftDoorOpen, setLeftDoorOpen] = useState(false);
  const [rightDoorOpen, setRightDoorOpen] = useState(false);
  const [wheelsMoving, setWheelsMoving] = useState(false);
  const [headlights, setHeadlights] = useState(true);
  const [bonnetOpen, setBonnetOpen] = useState(false);
  const [bootOpen, setBootOpen] = useState(false);
  const [engineOn, setEngineOn] = useState(false);
  const [driveMode, setDriveMode] = useState(false);
  const [paintTone, setPaintTone] = useState("titanium");
  const [customPaint, setCustomPaint] = useState("#FF5A1F");
  const [selectedMod, setSelectedMod] = useState("wheels");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [faqOpen, setFaqOpen] = useState(0);
  const [faqExpanded, setFaqExpanded] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const heroControlRef = useRef(null);
  const paintRef = useRef(null);
  const partsRef = useRef(null);
  const systemsRef = useRef(null);
  const servicesRef = useRef(null);
  const packagesRef = useRef(null);
  const processRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [capabilities, setCapabilities] = useState({
    doors: true,
    wheels: true,
    bonnet: false,
    boot: false,
  });

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 760);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useEffect(() => {
    if (!autoRotate || dragging || driveMode) return undefined;

    let frame;
    const animate = () => {
      setRotation((value) => value + 0.0026);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [autoRotate, dragging, driveMode]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const onPointerDown = (event) => {
    setDragging(true);
    setAutoRotate(false);
    setPointerStart({ x: event.clientX });
    setRotationStart(rotation);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragging || !pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    setRotation(rotationStart + dx * 0.0085);
  };

  const endDrag = (event) => {
    if (!dragging) return;
    setDragging(false);
    setPointerStart(null);
    event?.currentTarget?.releasePointerCapture?.(event.pointerId);
    setTimeout(() => setAutoRotate(true), 900);
  };

  const handlePartClick = (part) => {
    if (part.includes("door_l")) {
      setLeftDoorOpen((value) => !value);
      return;
    }

    if (part.includes("door_r")) {
      setRightDoorOpen((value) => !value);
      return;
    }

    if (part.includes("wheel")) {
      setWheelsMoving((value) => !value);
      return;
    }

    if (part.includes("headlight")) {
      setHeadlights((value) => !value);
      return;
    }

    if (part.includes("engine")) {
      setEngineOn((value) => !value);
      return;
    }

    if (part.includes("bonnet")) {
      if (!capabilities.bonnet) {
        setToast("BONNET IS FUSED INTO MAIN_BODY — SEPARATE IT IN BLENDER TO OPEN IT.");
        return;
      }
      setBonnetOpen((value) => !value);
      return;
    }

    if (part.includes("boot")) {
      if (!capabilities.boot) {
        setToast("BOOT IS FUSED INTO MAIN_BODY — SEPARATE IT IN BLENDER TO OPEN IT.");
        return;
      }
      setBootOpen((value) => !value);
    }
  };

  const toggleBothDoors = () => {
    const shouldOpen = !(leftDoorOpen || rightDoorOpen);
    setLeftDoorOpen(shouldOpen);
    setRightDoorOpen(shouldOpen);
  };

  const toggleBonnet = () => {
    if (!capabilities.bonnet) {
      setToast("BONNET IS NOT A SEPARATE GLB OBJECT YET.");
      return;
    }
    setBonnetOpen((value) => !value);
  };

  const toggleBoot = () => {
    if (!capabilities.boot) {
      setToast("BOOT IS NOT A SEPARATE GLB OBJECT YET.");
      return;
    }
    setBootOpen((value) => !value);
  };

  const toggleDrive = () => {
    setDriveMode((value) => {
      const next = !value;
      if (next) {
        setAutoRotate(false);
        setLeftDoorOpen(false);
        setRightDoorOpen(false);
        setBonnetOpen(false);
        setBootOpen(false);
        setEngineOn(true);
      }
      return next;
    });
  };

  const selected = MODS.find((item) => item.id === selectedMod) ?? MODS[0];

  const scrollHeroControls = (direction) => {
    heroControlRef.current?.scrollBy({
      left: direction * Math.min(heroControlRef.current.clientWidth * 0.72, 620),
      behavior: "smooth",
    });
  };

  const scrollRail = (ref, direction) => {
    const rail = ref.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(220, Math.min(rail.clientWidth * 0.82, 560)),
      behavior: "smooth",
    });
  };

  const openDetail = (kind, item) => {
    setDetailModal({ kind, item });
  };

  return (
    <div className={`app ${driveMode ? "driving" : ""} ${headlights ? "lights-on" : "lights-off"}`}>
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="grid-floor" />
      <div className="noise-layer" />

      {toast && <div className="toast">{toast}</div>}

      {detailModal && (
        <div className="detail-modal" role="dialog" aria-modal="true" aria-label={`${detailModal.item.title} details`}>
          <button className="detail-modal-backdrop" aria-label="Close details" onClick={() => setDetailModal(null)} />
          <article className="detail-modal-panel">
            <button className="detail-close" onClick={() => setDetailModal(null)} aria-label="Close details">×</button>
            <div className="detail-visual">
              <span className="detail-index">{detailModal.item.number || detailModal.item.code}</span>
              <PartIcon type={detailModal.item.icon} />
              <small>{detailModal.kind === "part" ? detailModal.item.tag : "AUTO//MODS WORKSHOP SERVICE"}</small>
            </div>
            <div className="detail-copy">
              <span className="section-code">FULL SYSTEM OVERVIEW</span>
              <h2>{detailModal.item.title}</h2>
              <p>{detailModal.item.text}</p>
              <div className="detail-facts">
                <div><small>TYPE</small><strong>{detailModal.kind === "part" ? "UPGRADE" : "WORKSHOP"}</strong></div>
                <div><small>FITMENT</small><strong>VEHICLE SPECIFIC</strong></div>
                <div><small>STATUS</small><strong>BUILD READY</strong></div>
                {detailModal.item.price && <div><small>STARTING</small><strong>{detailModal.item.price.replace("FROM ", "")}</strong></div>}
              </div>
              <div className="detail-explain">
                <h3>WHAT THE CLIENT GETS</h3>
                <p>Vehicle-specific planning, compatibility checks, clear installation scope and a final workshop inspection before handover.</p>
              </div>
              <a href="#contact" className="cta-button" onClick={() => setDetailModal(null)}>PLAN THIS UPGRADE <span>↗</span></a>
            </div>
          </article>
        </div>
      )}

      <header className="navbar">
        <a className="brand" href="#home" aria-label="Auto Mods home">
          <HeaderCarLogo />
          <span className="brand-copy">
            AUTO<span>//</span>MODS
            <small>PERFORMANCE LAB</small>
          </span>
        </a>

        <nav className={mobileMenu ? "nav-links mobile-open" : "nav-links"}>
          <a href="#home">3D CAR</a>
          <a href="#parts">PARTS</a>
          <a href="#services">SERVICES</a>
          <a href="#rates">RATE CARD</a>
          <a href="#process">HOW IT WORKS</a>
          <a href="#contact">CONTACT</a>
        </nav>

        <button
          className={headlights ? "nav-light active" : "nav-light"}
          onClick={() => setHeadlights((value) => !value)}
          aria-pressed={headlights}
          aria-label={headlights ? "Turn workshop lights off" : "Turn workshop lights on"}
        >
          <HeaderLightIcon active={headlights} />
          <span className="nav-light-copy">
            <strong>{headlights ? "ON" : "OFF"}</strong>
          </span>
        </button>

        <button
          className={driveMode ? "nav-drive active" : "nav-drive"}
          onClick={toggleDrive}
          aria-pressed={driveMode}
        >
          <HeaderDriveIcon returning={driveMode} />
          <span className="drive-copy">
            <small>LOOP DRIVE</small>
            <strong>{driveMode ? "RETURN / HERO" : "DRIVE LOOP"}</strong>
          </span>
          <b className="drive-chevron">{driveMode ? "↙" : "→"}</b>
        </button>

        <button
          className="menu-button"
          onClick={() => setMobileMenu((value) => !value)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-kicker">
            <span className="signal-dot" />
            INTERACTIVE PERFORMANCE GARAGE / LIVE
          </div>

          <div className="hero-title-wrap">
            <h1>
              BUILD THE
              <span>MACHINE.</span>
            </h1>
            <p>
              Tap the real 3D car to control wheels, doors, lights and engine. Activate DRIVE LOOP to watch it run left-to-right continuously, then return it to an oversized hero view.
            </p>
            <div className="paint-lab">
              <div className="paint-lab-head">
                <span>METALLIC COLOR LAB</span>
                <strong>
                  {paintTone === "custom"
                    ? `CUSTOM ${customPaint.toUpperCase()}`
                    : PAINTS.find((paint) => paint.id === paintTone)?.name}
                </strong>
              </div>

              <div className="swipe-shell paint-swipe-shell">
                <button className="swipe-arrow swipe-arrow-left" onClick={() => scrollRail(paintRef, -1)} aria-label="Previous paint colours">‹</button>
                <div className="paint-switch" ref={paintRef} aria-label="Metallic exterior colour presets">
                {PAINTS.map((paint) => (
                  <button
                    key={paint.id}
                    className={paintTone === paint.id ? "active" : ""}
                    onClick={() => setPaintTone(paint.id)}
                    title={paint.name}
                    aria-label={`Paint ${paint.name}`}
                  >
                    <span
                      className="paint-dot metallic-dot"
                      style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,.72) 0%, ${paint.hex} 28%, ${paint.hex} 63%, rgba(0,0,0,.7) 100%)`,
                      }}
                    />
                    <small>{paint.name}</small>
                  </button>
                ))}
                </div>
                <button className="swipe-arrow swipe-arrow-right" onClick={() => scrollRail(paintRef, 1)} aria-label="Next paint colours">›</button>
              </div>

              <div className={`custom-paint ${paintTone === "custom" ? "active" : ""}`}>
                <div className="custom-paint-copy">
                  <span>CUSTOM COLOR</span>
                  <strong>CHOOSE ANY SHADE</strong>
                  <small>Tap the wheel, select your colour and see it live on the 3D car.</small>
                </div>

                <label className="color-wheel-control" title="Choose a custom car colour">
                  <input
                    type="color"
                    value={customPaint}
                    onChange={(event) => {
                      setCustomPaint(event.target.value);
                      setPaintTone("custom");
                    }}
                    onClick={() => setPaintTone("custom")}
                    aria-label="Choose custom exterior colour"
                  />
                  <span
                    className="color-wheel-preview"
                    style={{ background: customPaint }}
                  />
                  <b>COLOR WHEEL</b>
                </label>

                <button
                  type="button"
                  className="use-custom-paint"
                  onClick={() => setPaintTone("custom")}
                >
                  USE CUSTOM
                </button>
              </div>
            </div>
          </div>

          <div
            className={`hero-car-stage ${dragging ? "is-dragging" : ""} ${driveMode ? "is-driving" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className={`drive-road ${driveMode ? "active" : ""}`} aria-hidden="true">
              <span className="road-edge road-edge-top" />
              <span className="road-center-line" />
              <span className="road-edge road-edge-bottom" />
              <b>ROAD LOOP // FORWARD →</b>
            </div>
            <Canvas
              dpr={isMobile ? [0.75, 1.1] : [1, 1.7]}
              camera={{ position: [6.4, 2.15, 7.4], fov: 34 }}
              gl={{ antialias: true, alpha: true }}
              onCreated={({ gl }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.2;
                gl.outputColorSpace = THREE.SRGBColorSpace;
              }}
            >
              <CarScene
                rotation={rotation}
                leftDoorOpen={leftDoorOpen}
                rightDoorOpen={rightDoorOpen}
                wheelsMoving={wheelsMoving}
                headlights={headlights}
                bonnetOpen={bonnetOpen}
                bootOpen={bootOpen}
                engineOn={engineOn}
                driveMode={driveMode}
                paintTone={paintTone}
                customPaint={customPaint}
                onPartClick={handlePartClick}
                onCapabilities={setCapabilities}
                isMobile={isMobile}
              />
            </Canvas>

            <div className="stage-ui stage-ui-left">
              <span>DRAG / SWIPE</span>
              <strong>360°</strong>
              <small>AUTO {autoRotate ? "ON" : "PAUSED"}</small>
            </div>

            <div className="stage-ui stage-ui-right">
              <span>LIVE MODEL</span>
              <strong>PROJECT // X</strong>
              <small>
                {paintTone === "custom"
                  ? `CUSTOM ${customPaint.toUpperCase()}`
                  : PAINTS.find((paint) => paint.id === paintTone)?.name} / LIVE PAINT
              </small>
            </div>

            <div className="tap-hint">
              <span className="tap-ring" />
              {driveMode ? "FORWARD ROAD LOOP / TAP RETURN TO HERO" : "TAP THE CAR / CLICK AGAIN TO REVERSE"}
            </div>
          </div>

          <div className="hero-controls-shell">
            <button className="control-arrow control-arrow-left" onClick={() => scrollHeroControls(-1)} aria-label="Previous controls">←</button>
            <div className="hero-controls" ref={heroControlRef}>
            <button
              className={driveMode ? "hero-control drive-card active" : "hero-control drive-card"}
              onClick={toggleDrive}
            >
              <span className="mini-part mini-drive" />
              <div>
                <small>00 / LOOP MODE</small>
                <strong>{driveMode ? "RETURN HERO" : "DRIVE LOOP"}</strong>
              </div>
              <em>{driveMode ? "FORWARD →" : "READY"}</em>
            </button>

            <button
              className={leftDoorOpen || rightDoorOpen ? "hero-control active" : "hero-control"}
              onClick={toggleBothDoors}
            >
              <span className="mini-part mini-door" />
              <div>
                <small>01 / BODY</small>
                <strong>DOORS</strong>
              </div>
              <em>{leftDoorOpen || rightDoorOpen ? "OPEN" : "CLOSED"}</em>
            </button>

            <button
              className={wheelsMoving || driveMode ? "hero-control active" : "hero-control"}
              onClick={() => setWheelsMoving((value) => !value)}
            >
              <span className={`mini-part mini-wheel ${wheelsMoving ? "spin" : ""}`} />
              <div>
                <small>02 / MOTION</small>
                <strong>WHEELS</strong>
              </div>
              <em>{wheelsMoving || driveMode ? "SPINNING" : "STOPPED"}</em>
            </button>

            <button
              className={headlights ? "hero-control active" : "hero-control"}
              onClick={() => setHeadlights((value) => !value)}
            >
              <span className="mini-part mini-light" />
              <div>
                <small>03 / VISION</small>
                <strong>LIGHTS</strong>
              </div>
              <em>{headlights ? "ON" : "OFF"}</em>
            </button>

            <button
              className={engineOn ? "hero-control active" : "hero-control"}
              onClick={() => setEngineOn((value) => !value)}
            >
              <span className="mini-part mini-piston" />
              <div>
                <small>04 / POWER</small>
                <strong>ENGINE</strong>
              </div>
              <em>{engineOn ? "RUNNING" : "OFF"}</em>
            </button>

            <button
              className={`hero-control ${bonnetOpen ? "active" : ""} ${!capabilities.bonnet ? "locked" : ""}`}
              onClick={toggleBonnet}
            >
              <span className="mini-part mini-panel" />
              <div>
                <small>05 / ACCESS</small>
                <strong>BONNET</strong>
              </div>
              <em>{capabilities.bonnet ? (bonnetOpen ? "OPEN" : "CLOSED") : "FUSED"}</em>
            </button>

            <button
              className={`hero-control ${bootOpen ? "active" : ""} ${!capabilities.boot ? "locked" : ""}`}
              onClick={toggleBoot}
            >
              <span className="mini-part mini-panel rear" />
              <div>
                <small>06 / ACCESS</small>
                <strong>BOOT</strong>
              </div>
              <em>{capabilities.boot ? (bootOpen ? "OPEN" : "CLOSED") : "FUSED"}</em>
            </button>
            </div>
            <button className="control-arrow control-arrow-right" onClick={() => scrollHeroControls(1)} aria-label="Next controls">→</button>
          </div>
          <div className="hero-spec-strip">
            <div>
              <small>LIVE POWER</small>
              <strong>{engineOn ? "428" : "000"}<b> HP</b></strong>
            </div>
            <div>
              <small>TORQUE MAP</small>
              <strong>{engineOn ? "510" : "---"}<b> NM</b></strong>
            </div>
            <div>
              <small>WHEEL STATE</small>
              <strong>{wheelsMoving || driveMode ? "ACTIVE" : "READY"}</strong>
            </div>
            <div>
              <small>DRIVE MODE</small>
              <strong>{driveMode ? "LOOPING" : "HERO"}</strong>
            </div>
          </div>
        </section>

        <section className="parts-section" id="parts">
          <div className="section-heading">
            <div>
              <span className="section-code">01 // HARDWARE WALL</span>
              <h2>
                PICK YOUR
                <span>WEAPONRY.</span>
              </h2>
            </div>
            <p>
              Every content block is styled like a real workshop component — wheel, rotor,
              exhaust, spring, light or aero piece — instead of a generic website card.
            </p>
          </div>

          <div className="swipe-shell content-swipe-shell">
            <button className="swipe-arrow swipe-arrow-left" onClick={() => scrollRail(partsRef, -1)} aria-label="Previous modification cards">‹</button>
            <div className="parts-grid" ref={partsRef}>
            {MODS.map((mod) => (
              <button
                className={selectedMod === mod.id ? "part-card selected" : "part-card"}
                key={mod.id}
                onClick={() => {
                  setSelectedMod(mod.id);
                  openDetail("part", mod);
                }}
              >
                <div className="part-card-head">
                  <span>{mod.number}</span>
                  <small>{mod.tag}</small>
                </div>
                <PartIcon type={mod.icon} />
                <h3>{mod.title}</h3>
                <p>{mod.text}</p>
                <div className="part-card-foot">
                  <strong>{mod.price}</strong>
                  <span>OPEN FULL SCREEN ↗</span>
                </div>
              </button>
            ))}
                      </div>
            <button className="swipe-arrow swipe-arrow-right" onClick={() => scrollRail(partsRef, 1)} aria-label="Next modification cards">›</button>
          </div>
        </section>

        <section className="build-lab" id="lab">
          <div className="lab-rotor" aria-hidden="true">
            <span className="rotor-center" />
            <span className="rotor-caliper" />
          </div>

          <div className="lab-copy">
            <span className="section-code">02 // SELECTED SYSTEM</span>
            <small className="selected-tag">{selected.tag}</small>
            <h2>{selected.title}</h2>
            <p>{selected.text}</p>
            <div className="lab-readouts">
              <div>
                <small>PACKAGE</small>
                <strong>{selected.number}</strong>
              </div>
              <div>
                <small>ENTRY</small>
                <strong>{selected.price.replace("FROM ", "")}</strong>
              </div>
              <div>
                <small>STATUS</small>
                <strong>READY</strong>
              </div>
            </div>
            <a href="#contact" className="cta-button">
              ADD TO BUILD <span>↗</span>
            </a>
          </div>
        </section>

        <section className="garage-strip">
          <div className="garage-item">
            <span className="garage-disc" />
            <div>
              <small>PRECISION</small>
              <strong>LASER ALIGNMENT</strong>
            </div>
          </div>
          <div className="garage-item">
            <span className="garage-coil" />
            <div>
              <small>CHASSIS</small>
              <strong>SETUP & CORNER BALANCE</strong>
            </div>
          </div>
          <div className="garage-item">
            <span className="garage-pipe" />
            <div>
              <small>FLOW</small>
              <strong>CUSTOM EXHAUST FABRICATION</strong>
            </div>
          </div>
        </section>

        <section className="systems-section">
          <div className="section-heading compact">
            <div>
              <span className="section-code">03 // GARAGE SYSTEMS</span>
              <h2>MORE THAN <span>PARTS.</span></h2>
            </div>
            <p>Tap each workshop system to understand how the full build comes together.</p>
          </div>
          <div className="swipe-shell content-swipe-shell">\n            <button className="swipe-arrow swipe-arrow-left" onClick={() => scrollRail(systemsRef, -1)} aria-label="Previous garage systems">‹</button>\n            <div className="systems-grid" ref={systemsRef}>
            {[
              ["DYNO", "POWER VALIDATION", "Before/after power runs and safe map verification."],
              ["FITMENT", "WHEEL GEOMETRY", "Offset, clearance and stance checked before installation."],
              ["BRAKE", "HEAT MANAGEMENT", "Rotor, pad and fluid packages built around real usage."],
              ["DETAIL", "FINISH BAY", "PPF, ceramic and final presentation after the mechanical work."],
            ].map(([code, title, text]) => (
              <button className="system-card" key={code} onClick={() => setToast(`${title} // ${text}`)}>
                <span className="system-dial"><i /></span>
                <small>{code}</small>
                <strong>{title}</strong>
                <p>{text}</p>
                <b>TAP DETAILS ↗</b>
              </button>
            ))}
                      </div>\n            <button className="swipe-arrow swipe-arrow-right" onClick={() => scrollRail(systemsRef, 1)} aria-label="Next garage systems">›</button>\n          </div>
        </section>

        <section className="services-section" id="services">
          <div className="section-heading">
            <div>
              <span className="section-code">04 // COMPLETE WORKSHOP SERVICES</span>
              <h2>ONE GARAGE. <span>EVERY UPGRADE.</span></h2>
            </div>
            <p>Clients can understand exactly what the workshop handles before they call — from simple fitment jobs to complete visual and performance builds.</p>
          </div>

          <div className="swipe-shell content-swipe-shell">\n            <button className="swipe-arrow swipe-arrow-left" onClick={() => scrollRail(servicesRef, -1)} aria-label="Previous workshop services">‹</button>\n            <div className="services-grid" ref={servicesRef}>
            {SERVICES.map((service) => (
              <button
                className="service-card"
                key={service.code}
                onClick={() => openDetail("service", service)}
              >
                <span className="service-code">{service.code}</span>
                <PartIcon type={service.icon} />
                <div>
                  <small>WORKSHOP SERVICE</small>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
                <b>OPEN FULL SCREEN ↗</b>
              </button>
            ))}
                      </div>\n            <button className="swipe-arrow swipe-arrow-right" onClick={() => scrollRail(servicesRef, 1)} aria-label="Next workshop services">›</button>\n          </div>
        </section>

        <section className="rate-section" id="rates">
          <div className="rate-intro">
            <span className="section-code">05 // INDICATIVE RATE CARD</span>
            <h2>CLEAR STARTING <span>PRICES.</span></h2>
            <p>Simple starting prices help customers plan a build before visiting. Final pricing depends on the vehicle, parts selected, condition, fabrication and scope of work.</p>
            <div className="rate-note"><span>!</span> DEMO RATE CARD — EDIT THESE PRICES TO MATCH THE WORKSHOP BEFORE PUBLISHING.</div>
          </div>

          <div className="modifier-rate-board">
            <div className="rate-board-top">
              <div><span>SHOP RATE // LIVE MENU</span><strong>MODIFICATION BAY</strong></div>
              <div className="rate-board-status"><i /> QUOTE READY</div>
            </div>
            <div className="rate-card-grid">
              {RATE_CARD.map(([service, price, note], index) => (
                <button className="rate-mod-card" key={service} onClick={() => setToast(`${service.toUpperCase()} // ${price}`)}>
                  <span className="rate-mod-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="rate-mod-copy">
                    <small>{index < 4 ? "SETUP" : index < 8 ? "CHASSIS / BRAKE" : index < 12 ? "PERFORMANCE / STYLE" : "FINISH / CALIBRATION"}</small>
                    <strong>{service}</strong>
                    <p>{note}</p>
                  </div>
                  <div className="rate-mod-price"><small>STARTING</small><b>{price}</b></div>
                  <span className="rate-mod-arrow">↗</span>
                </button>
              ))}
            </div>
            <div className="rate-board-foot"><span>LABOUR + FITMENT + VEHICLE CHECK</span><b>FINAL QUOTE AFTER INSPECTION</b></div>
          </div>
        </section>

        <section className="packages-section">
          <div className="section-heading compact">
            <div>
              <span className="section-code">06 // BUILD STARTERS</span>
              <h2>CHOOSE A <span>DIRECTION.</span></h2>
            </div>
            <p>These packages are conversation starters, not fixed bundles. Every build is adjusted to the vehicle and customer.</p>
          </div>
          <div className="swipe-shell content-swipe-shell">\n            <button className="swipe-arrow swipe-arrow-left" onClick={() => scrollRail(packagesRef, -1)} aria-label="Previous build package">‹</button>\n            <div className="package-grid" ref={packagesRef}>
            {BUILD_PACKAGES.map((pkg, index) => (
              <article className={`package-card package-${index + 1}`} key={pkg.name}>
                <span className="package-index">0{index + 1}</span>
                <small>{pkg.tag}</small>
                <h3>{pkg.name}</h3>
                <strong>{pkg.price}</strong>
                <div className="package-list">
                  {pkg.items.map((item) => <span key={item}><i />{item}</span>)}
                </div>
                <a href="#contact">PLAN THIS BUILD <b>↗</b></a>
              </article>
            ))}
                      </div>\n            <button className="swipe-arrow swipe-arrow-right" onClick={() => scrollRail(packagesRef, 1)} aria-label="Next build package">›</button>\n          </div>
        </section>

        <section className="trust-section">
          <div className="trust-marquee" aria-hidden="true">
            <span>FITMENT CHECK</span><i />
            <span>ROAD-READY SETUP</span><i />
            <span>CLEAR QUOTATION</span><i />
            <span>PARTS GUIDANCE</span><i />
            <span>FINAL INSPECTION</span><i />
            <span>AFTERCARE SUPPORT</span><i />
          </div>
          <div className="trust-grid">
            {[
              ["01", "VEHICLE-FIRST ADVICE", "Recommendations are based on your exact car, not a one-size-fits-all parts list."],
              ["02", "BUDGET PRIORITIES", "We can split a large build into sensible stages so you know what to do first and what can wait."],
              ["03", "FITMENT BEFORE FASHION", "Clearance, tyre size, ride height and usability are checked before chasing an aggressive look."],
              ["04", "HANDOVER EXPLAINED", "Customers leave knowing what changed, how to care for it and what the next upgrade could be."],
            ].map(([num, title, text]) => (
              <article className="trust-card" key={num}>
                <span>{num}</span><strong>{title}</strong><p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="process-section" id="process">
          <div className="section-heading">
            <div>
              <span className="section-code">07 // YOUR BUILD JOURNEY</span>
              <h2>FROM IDEA TO <span>ROAD READY.</span></h2>
            </div>
            <p>A simple client-first process so customers understand what happens before a single part is fitted.</p>
          </div>

          <div className="swipe-shell content-swipe-shell">\n            <button className="swipe-arrow swipe-arrow-left" onClick={() => scrollRail(processRef, -1)} aria-label="Previous build step">‹</button>\n            <div className="process-grid" ref={processRef}>
            {[
              ["01", "DISCOVER", "Tell us your car, daily use, style, budget and what you want to improve."],
              ["02", "PLAN", "We shortlist compatible parts, discuss fitment and build a clear staged recommendation."],
              ["03", "INSTALL", "The workshop completes the approved upgrades with fitment checks throughout the job."],
              ["04", "VERIFY", "Final inspection, road-ready checks and a handover explaining your new setup."],
            ].map(([num, title, text]) => (
              <button className="process-card" key={num} onClick={() => setToast(`${title} // ${text}`)}>
                <span className="process-number">{num}</span>
                <span className="process-line" />
                <strong>{title}</strong>
                <p>{text}</p>
                <b>VIEW STEP ↗</b>
              </button>
            ))}
                      </div>\n            <button className="swipe-arrow swipe-arrow-right" onClick={() => scrollRail(processRef, 1)} aria-label="Next build step">›</button>\n          </div>
        </section>

        <section className="client-section">
          <div className="client-copy">
            <span className="section-code">08 // BUILT AROUND THE OWNER</span>
            <h2>WHAT CLIENTS <span>CAN EXPECT.</span></h2>
            <p>Modification should feel exciting, not confusing. This workshop experience keeps choices understandable from the first conversation to final handover.</p>
          </div>
          <div className="client-points">
            {[
              ["FITMENT FIRST", "Parts are selected around the actual vehicle, wheel clearance and intended use."],
              ["CLEAR OPTIONS", "Street, show and performance routes are explained before you commit."],
              ["STAGED BUILDS", "Start with the essentials and add upgrades later instead of doing everything at once."],
              ["VISUAL DIRECTION", "Colour, stance, wheels, aero and lighting are planned as one connected look."],
              ["FINAL CHECK", "The vehicle gets a practical post-installation inspection before handover."],
              ["AFTERCARE", "Customers receive guidance on maintenance, setup changes and future upgrade paths."],
            ].map(([title, text], index) => (
              <article className="client-point" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{title}</strong><p>{text}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="faq-section">
          <div className="section-heading compact">
            <div>
              <span className="section-code">09 // CLIENT QUESTIONS</span>
              <h2>BEFORE YOU <span>MODIFY.</span></h2>
            </div>
            <p>Tap a question for a quick explanation of the workshop approach.</p>
          </div>
          <div className="faq-list">
            {FAQS.slice(0, faqExpanded ? 12 : 5).map(([q, a], index) => (
              <button className={faqOpen === index ? "faq-item open" : "faq-item"} key={q} onClick={() => setFaqOpen(faqOpen === index ? -1 : index)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{q}</strong><p>{a}</p></div>
                <b>{faqOpen === index ? "−" : "+"}</b>
              </button>
            ))}
          </div>
          <button className="faq-load-more" onClick={() => { setFaqExpanded((value) => !value); setFaqOpen(-1); }}>
            <span>{faqExpanded ? "SHOW FIRST 5" : "LOAD MORE QUESTIONS"}</span>
            <strong>{faqExpanded ? "05 / 12" : "12 TOTAL"}</strong>
            <b>{faqExpanded ? "↑" : "↓"}</b>
          </button>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-tyre" aria-hidden="true">
            <span />
          </div>
          <div>
            <span className="section-code">10 // START A BUILD</span>
            <h2>
              YOUR CAR.
              <span>YOUR RULES.</span>
            </h2>
            <p>
              Build a visual-first performance concept around wheels, stance, lighting,
              sound and aero — with the 3D car staying at the centre of the experience.
            </p>
            <a
              className="cta-button large"
              href="https://wa.me/919876543210?text=Hi%20AUTO%2F%2FMODS%2C%20I%20want%20to%20build%20a%20custom%20car."
              target="_blank"
              rel="noreferrer"
            >
              TALK TO THE GARAGE <span>↗</span>
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="brand-copy">
          AUTO<span>//</span>MODS
          <small>PERFORMANCE LAB</small>
        </div>
        <span>INTERACTIVE 3D AUTOMOTIVE EXPERIENCE</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}
