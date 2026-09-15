import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, RoundedBox, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import "./styles.css";

const CAR_MODEL_URL = `${import.meta.env.BASE_URL}models/generic_sedan_car.glb`;

const PAINTS = [
  { id: "black", name: "JET BLACK", hex: "#08090a" },
  { id: "white", name: "PEARL WHITE", hex: "#ecebe6" },
  { id: "grey", name: "NARDO GREY", hex: "#777d80" },
  { id: "silver", name: "TITANIUM SILVER", hex: "#aeb3b6" },
  { id: "red", name: "RACING RED", hex: "#a9151c" },
  { id: "blue", name: "MIDNIGHT BLUE", hex: "#102a55" },
  { id: "green", name: "BRITISH GREEN", hex: "#123c2c" },
  { id: "orange", name: "SUNSET ORANGE", hex: "#b94d1d" },
  { id: "champagne", name: "CHAMPAGNE", hex: "#9b805b" },
  { id: "purple", name: "DEEP PURPLE", hex: "#3e2858" },
];

const FINISHES = [
  { id: "solid", name: "SOLID", metalness: .12, roughness: .24, clearcoat: .9 },
  { id: "metallic", name: "METALLIC", metalness: .78, roughness: .19, clearcoat: 1 },
  { id: "matte", name: "MATTE", metalness: .18, roughness: .72, clearcoat: .06 },
  { id: "satin", name: "SATIN", metalness: .42, roughness: .46, clearcoat: .28 },
  { id: "pearl", name: "PEARL", metalness: .58, roughness: .16, clearcoat: 1 },
];

const RIMS = [
  { id: "oem", name: "OEM GRAPHITE", hex: "#24272b", metalness: .56, roughness: .44, env: .24 },
  { id: "black", name: "SATIN BLACK", hex: "#070809", metalness: .42, roughness: .52, env: .18 },
  { id: "gunmetal", name: "DARK GUNMETAL", hex: "#30343a", metalness: .62, roughness: .40, env: .24 },
  { id: "titanium", name: "TITANIUM", hex: "#666b70", metalness: .68, roughness: .36, env: .28 },
  { id: "silver", name: "FORGED SILVER", hex: "#9aa0a5", metalness: .72, roughness: .32, env: .30 },
  { id: "bronze", name: "FORGED BRONZE", hex: "#5b4029", metalness: .58, roughness: .42, env: .22 },
  { id: "gold", name: "CHAMPAGNE", hex: "#9a7740", metalness: .62, roughness: .38, env: .24 },
  { id: "white", name: "CERAMIC WHITE", hex: "#d9d9d4", metalness: .34, roughness: .42, env: .24 },
];

const CALIPERS = [
  { id: "red", name: "RACING RED", hex: "#d4141d" },
  { id: "yellow", name: "ACID YELLOW", hex: "#f0bd18" },
  { id: "blue", name: "ELECTRIC BLUE", hex: "#155bda" },
  { id: "orange", name: "ORANGE", hex: "#ef6c19" },
  { id: "lime", name: "LIME", hex: "#82d522" },
  { id: "silver", name: "SILVER", hex: "#a8adb1" },
  { id: "white", name: "WHITE", hex: "#e7e7e2" },
  { id: "black", name: "BLACK", hex: "#111214" },
];

const TINTS = [
  { id: "crystal", name: "CRYSTAL", opacity: .62 },
  { id: "clear", name: "CLEAR", opacity: .52 },
  { id: "light", name: "LIGHT SMOKE", opacity: .42 },
  { id: "smoke", name: "SMOKE", opacity: .32 },
  { id: "privacy", name: "PRIVACY", opacity: .24 },
  { id: "dark", name: "DARK", opacity: .18 },
  { id: "limo", name: "LIMO", opacity: .10 },
  { id: "blackout", name: "BLACKOUT", opacity: .055 },
];

const CATEGORIES = [
  ["paint", "✦", "PAINT"],
  ["wheels", "◉", "WHEELS"],
  ["brakes", "◎", "BRAKES"],
  ["glass", "▱", "GLASS"],
  ["carbon", "◆", "CARBON"],
  ["interior", "▣", "INTERIOR"],
];


const BUILD_PRESETS = [
  {
    id: "oemplus",
    name: "OEM+",
    description: "Factory elegance with a sharper stance.",
    paint: "silver", finish: "metallic", rim: "titanium",
    caliper: "silver", tint: "smoke", carbon: false,
    stance: .18, aero: { wing:false, lip:true, skirts:false, diffuser:false },
  },
  {
    id: "stealth",
    name: "Stealth",
    description: "Dark, restrained and technical.",
    paint: "black", finish: "satin", rim: "black",
    caliper: "red", tint: "dark", carbon: true,
    stance: .34, aero: { wing:false, lip:true, skirts:true, diffuser:true },
  },
  {
    id: "street",
    name: "Street Performance",
    description: "Aggressive road-focused configuration.",
    paint: "red", finish: "metallic", rim: "gunmetal",
    caliper: "yellow", tint: "smoke", carbon: true,
    stance: .42, aero: { wing:true, lip:true, skirts:true, diffuser:true },
  },
  {
    id: "luxury",
    name: "Grand Touring",
    description: "Premium finish with understated details.",
    paint: "blue", finish: "pearl", rim: "silver",
    caliper: "silver", tint: "smoke", carbon: false,
    stance: .14, aero: { wing:false, lip:false, skirts:false, diffuser:false },
  },
];

const AERO_PRESETS = [
  ["stock","Stock","Factory bodywork",{ wing:false, lip:false, skirts:false, diffuser:false, splitter:false, canards:false }],
  ["street","Street","Front lip + side skirts",{ wing:false, lip:true, skirts:true, diffuser:false, splitter:true, canards:false }],
  ["sport","Sport","Balanced full aero",{ wing:false, lip:true, skirts:true, diffuser:true, splitter:true, canards:false }],
  ["track","Track","Maximum visual aero",{ wing:true, lip:true, skirts:true, diffuser:true, splitter:true, canards:true }],
];

const CATEGORY_INFO = {
  paint:{title:"Paint",description:"Colour & paint finish",accent:"#C7A66B"},
  wheels:{title:"Wheels",description:"Rim colour & size",accent:"#AEB7C0"},
  brakes:{title:"Brakes",description:"Caliper colour & gloss",accent:"#B94D4D"},
  glass:{title:"Glass",description:"Window tint level",accent:"#708696"},
  lights:{title:"Lights",description:"Headlights & light colour",accent:"#E2C27B"},
  suspension:{title:"Stance",description:"Ride height & steering",accent:"#8EA79A"},
  aero:{title:"Aero",description:"Lip, skirts, diffuser & wing",accent:"#B87A55"},
  carbon:{title:"Carbon",description:"Carbon finish & surface",accent:"#777777"},
  interior:{title:"Interior",description:"Seats, dash, console & door panels",accent:"#9A6A4A"},
};

const INTERIOR_COLORS = [
  { id:"black", name:"OBSIDIAN BLACK", hex:"#111214" },
  { id:"charcoal", name:"CHARCOAL", hex:"#343638" },
  { id:"ivory", name:"IVORY", hex:"#E8E0D2" },
  { id:"cognac", name:"COGNAC", hex:"#9A542F" },
  { id:"saddle", name:"SADDLE BROWN", hex:"#70452F" },
  { id:"mocha", name:"MOCHA", hex:"#49352D" },
  { id:"burgundy", name:"BURGUNDY", hex:"#651F2A" },
  { id:"navy", name:"DEEP NAVY", hex:"#18273B" },
  { id:"red", name:"RACING RED", hex:"#9E2026" },
  { id:"stone", name:"STONE GREY", hex:"#8B8983" },
];

const UPGRADES = [
  ["01", "FORGED WHEELS", "UNSPRUNG MASS", "₹48,000", "◉"],
  ["02", "BIG BRAKE KIT", "STOPPING POWER", "₹65,000", "◎"],
  ["03", "LED SIGNATURE", "VISION SYSTEM", "₹18,000", "◈"],
  ["04", "VALVED EXHAUST", "SOUND / FLOW", "₹32,000", "▰"],
  ["05", "COILOVER SETUP", "STANCE / CONTROL", "₹42,000", "↕"],
  ["06", "AERO PACKAGE", "FORM / FUNCTION", "₹55,000", "◢"],
];

const SERVICES = [
  ["PRECISION FITMENT", "Wheel width, offset, tyre profile and clearance checked before installation."],
  ["PERFORMANCE SETUP", "Suspension, brakes and alignment configured around how the car is actually used."],
  ["CUSTOM FABRICATION", "Aero, exhaust and styling components installed with an OEM-level visual finish."],
  ["FINISH & PROTECTION", "Wrap, PPF and ceramic options to complete and protect the finished build."],
];

const PACKAGES = [
  ["DAILY+", "CLEAN / COMFORTABLE", "₹65K", ["Wheels / tyres", "Mild stance", "Lighting refresh", "Alignment"]],
  ["STREET SPORT", "LOOK / SOUND / RESPONSE", "₹1.65L", ["Forged wheels", "Coilovers", "Valved exhaust", "Brake upgrade"]],
  ["SHOW SPEC", "VISUAL IMPACT", "₹2.75L", ["Carbon aero", "Aggressive fitment", "Lighting / interior", "Protection"]],
];

const WORKSHOP_CAPABILITIES = [
  ["01", "3D BUILD PREVIEW", "SEE IT FIRST", "Configure the visual direction before discussing the physical build.", "◎"],
  ["02", "FITMENT ENGINEERING", "MEASURE TWICE", "Wheel, tyre, stance and clearance decisions planned as one system.", "⌁"],
  ["03", "PERFORMANCE BAY", "DRIVE BETTER", "Brakes, suspension and supporting upgrades selected around real use.", "⚙"],
  ["04", "DETAIL STUDIO", "FINISH MATTERS", "Paint direction, carbon, tint and protection brought into one visual language.", "✦"],
];

const BUILD_STEPS = [
  ["01", "DISCOVER", "Tell us the car, the goal, the daily use and the budget."],
  ["02", "VISUALIZE", "Use the live configurator to establish colour, stance and styling direction."],
  ["03", "ENGINEER", "We check compatibility, fitment, practical clearance and installation scope."],
  ["04", "BUILD", "Approved parts are installed, aligned and visually finished as one package."],
  ["05", "HANDOVER", "Final inspection, setup explanation and a clear route for future upgrades."],
];

const STATS = [
  ["300+", "PERFORMANCE PARTS"],
  ["50+", "PREMIUM BRANDS"],
  ["8", "LIVE EDITABLE SYSTEMS"],
  ["360°", "INTERACTIVE PREVIEW"],
];

const GALLERY_IMAGES = [
  { src: `${import.meta.env.BASE_URL}gallery/build-01.jpg`, title: "MIDNIGHT GT", tag: "WHEELS / STANCE / AERO" },
  { src: `${import.meta.env.BASE_URL}gallery/build-02.jpg`, title: "URBAN SPEC", tag: "PAINT / BRAKES / DETAIL" },
  { src: `${import.meta.env.BASE_URL}gallery/build-03.jpg`, title: "TRACK INSPIRED", tag: "CARBON / AERO / FITMENT" },
  { src: `${import.meta.env.BASE_URL}gallery/build-04.jpg`, title: "BLACK SERIES", tag: "SATIN / TINT / WHEELS" },
  { src: `${import.meta.env.BASE_URL}gallery/build-05.jpg`, title: "SHOWROOM ONE", tag: "FULL VISUAL PACKAGE" },
  { src: `${import.meta.env.BASE_URL}gallery/build-06.jpg`, title: "STREET FORM", tag: "DAILY / PERFORMANCE" },
];

const FAQS = [
  ["Can I see modifications live?", "Yes. Paint, wheel finish, brake colour, tint, stance and supported aero parts update directly on the 3D model."],
  ["Are the prices final?", "No. The configurator gives an indicative build value. Final pricing depends on the exact vehicle, parts and installation scope."],
  ["Can I build in stages?", "Yes. Save the visual direction first, then split the real build into sensible stages."],
  ["Will it work on mobile?", "Yes. The configurator uses swipe-friendly controls, touch rotation and responsive panels."],
  ["Can the garage build around my budget?", "Yes. Start with the upgrades that create the biggest visual or driving improvement, then expand later."],
  ["Can you help me choose the right wheel fitment?", "Yes. Wheel width, offset, tyre profile and practical clearance should be checked together before installation."],
  ["Can I change the colour after saving a build?", "Yes. Reopen the configurator, change the visual direction and save the updated build on the same device."],
  ["Do you install suspension and coilovers?", "Yes. Suspension upgrades can be planned around stance, road use, comfort and clearance requirements."],
  ["Can I combine wheels, brakes and aero in one build?", "Yes. The goal is to plan the modifications as one connected package rather than unrelated individual parts."],
  ["Do you offer carbon-fibre styling upgrades?", "Yes. Supported carbon and aero options can be previewed in the configurator and discussed as part of the final build."],
  ["Can you help with a daily-driven car?", "Yes. A build can stay practical for daily use while improving stance, wheels, braking, lighting and visual finish."],
  ["How do I start a build consultation?", "Use the WhatsApp build-support button and send your vehicle details, goals, preferred style and approximate budget."],
  ["Can I use my saved 3D configuration as a reference?", "Yes. Your live configuration can be used as the visual starting point when discussing the real modification plan."],
];

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loader">
        <span>{Math.round(progress)}%</span>
        <small>LOADING DRIVE MODS</small>
      </div>
    </Html>
  );
}

function CameraRig({ view, zoom, mobileCustomizerOpen = false }) {
  const { camera, size } = useThree();
  const mobile = size.width < 760;

  const positions = useMemo(
    () => ({
      "360": mobile
        ? mobileCustomizerOpen
          ? [8.4, 3.0, 12.0]
          : [7.45, 2.20, 9.80]
        : [5.95, 1.78, 7.10],

      front: mobile
        ? mobileCustomizerOpen
          ? [0, 2.25, 12.8]
          : [0, 1.25, 10.2]
        : [0, 1.05, 7.7],

      rear: mobile
        ? mobileCustomizerOpen
          ? [0, 2.25, -12.8]
          : [0, 1.35, -10.2]
        : [0, 1.1, -7.7],

      left: mobile
        ? mobileCustomizerOpen
          ? [-12.2, 2.25, 0]
          : [-9.5, 1.45, 0]
        : [-7.3, 1.25, 0],

      right: mobile
        ? mobileCustomizerOpen
          ? [12.2, 2.25, 0]
          : [9.5, 1.45, 0]
        : [7.3, 1.25, 0],

      top: mobile
        ? mobileCustomizerOpen
          ? [0, 12.5, 0.1]
          : [0, 11, 0.1]
        : [0, 9, 0.1],

      wheels: mobile
        ? mobileCustomizerOpen
          ? [8.2, 1.7, 10.0]
          : [6.4, .85, 7.4]
        : [5.0, .65, 5.2],

      brakes: mobile
        ? mobileCustomizerOpen
          ? [7.8, 1.7, 9.6]
          : [5.9, .75, 7.0]
        : [4.6, .55, 4.8],

      aero: mobile
        ? mobileCustomizerOpen
          ? [-8.6, 2.0, -10.0]
          : [-6.6, 1.2, -7.4]
        : [-5.1, 1.0, -5.2],

      glass: mobile
        ? mobileCustomizerOpen
          ? [8.0, 3.35, 10.0]
          : [6.0, 2.7, 7.4]
        : [4.7, 2.25, 5.4],
    }),
    [mobile, mobileCustomizerOpen]
  );

  useFrame(() => {
    const base = new THREE.Vector3(...(positions[view] || positions["360"]));

    // While editing on mobile, keep the whole car in frame.
    const editZoom = mobile && mobileCustomizerOpen ? Math.min(zoom, 0.22) : zoom;
    base.multiplyScalar(THREE.MathUtils.lerp(1.00, .78, editZoom));

    camera.position.lerp(base, mobile && mobileCustomizerOpen ? .085 : .065);

    const targetY =
      mobile && mobileCustomizerOpen
        ? 0.38
        : view === "top"
          ? -.2
          : -.35;

    camera.lookAt(0, targetY, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

function PerformanceController({ lightsOn }) {
  const { gl, size } = useThree();

  useEffect(() => {
    const mobile = size.width <= 760;
    const tablet = size.width <= 1100;

    // Keep desktop crisp, but avoid rendering millions of unnecessary
    // pixels on high-DPI phones/tablets.
    const maxDpr = mobile ? 1.2 : tablet ? 1.4 : 1.65;
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));

    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.78;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl, size.width, lightsOn]);

  return null;
}

function CarModel({
  rotation, autoRotate, lightsOn, paintTone, customPaint, finish, rim, customRimColor,
  caliper, customCaliperColor, tint, glassColor, carbon, aero, stance, steering, wheelSpin, before,
  lightColor, lightIntensity, paintGloss, metallicBoost, rimScale, caliperGloss, carbonFinish,
  beforeMode, openParts, interiorSettings, customInteriorColors
}) {
  const group = useRef();
  const { scene } = useGLTF(CAR_MODEL_URL);
  const car = useMemo(() => scene.clone(true), [scene]);
  const paints = useRef([]);
  const rims = useRef([]);
  const wheelInners = useRef([]);
  const calipers = useRef([]);
  const glasses = useRef([]);
  const carbons = useRef([]);
  const emissives = useRef([]);
  const interiorSeats = useRef([]);
  const interiorDashboard = useRef([]);
  const interiorConsole = useRef([]);
  const interiorDoorPanels = useRef([]);
  const wheelRotators = useRef([]);
  const wheelSpinAngle = useRef(0);
  const frontSteer = useRef([]);
  const pivots = useRef({});

  useEffect(() => {
    paints.current = [];
    rims.current = [];
    wheelInners.current = [];
    calipers.current = [];
    glasses.current = [];
    carbons.current = [];
    emissives.current = [];
    interiorSeats.current = [];
    interiorDashboard.current = [];
    interiorConsole.current = [];
    interiorDoorPanels.current = [];

    const ancestorNames = (obj) => {
      const names = [];
      let node = obj;
      while (node) {
        names.push(node.name || "");
        node = node.parent;
      }
      return names.join(" ").toLowerCase();
    };

    // WHEELS ONLY — rotate the eight actual render meshes directly.
    // The uploaded GLB geometry proves each wheel mesh is thin on local X
    // and circular on Y/Z, so local X is the true axle/spin axis.
    wheelSpinAngle.current = 0;
    wheelRotators.current = [
      "Object_241", "Object_243", // front left: tyre + rim
      "Object_247", "Object_249", // front right: tyre + rim
      "Object_253", "Object_255", // rear left: tyre + rim
      "Object_259", "Object_261", // rear right: tyre + rim
    ].map((name) => {
      const node = car.getObjectByName(name);
      return node ? {
        node,
        baseQuaternion: node.quaternion.clone(),
      } : null;
    }).filter(Boolean);

    frontSteer.current = [
      "DEF-Wheel.Ft.L_124", "DEF-Wheel.Ft.R_128",
    ].map(n => car.getObjectByName(n)).filter(Boolean);

    car.traverse(obj => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;

      const hierarchy = ancestorNames(obj);
      const source = Array.isArray(obj.material) ? obj.material : [obj.material];
      const cloned = source.map(mat => {
        if (!mat) return mat;
        const m = mat.clone();
        const mn = (m.name || "").toLowerCase();
        const context = `${hierarchy} ${mn}`;

        if (mn.includes("car_paint") || mn.includes("car paint") || mn.includes("carpaint")) {
          m.map = null;
          m.emissiveMap = null;
          if (m.emissive) m.emissive.set("#000000");
          m.emissiveIntensity = 0;
          m.vertexColors = false;
          paints.current.push(m);
        }

        // Generic Sedan wheel meshes are named Object_243/Object_249/etc.
        // Detecting the parent hierarchy makes wheel colour actually work.
        const isRim = context.includes("generic-wheel");
        const isTyre = context.includes("generic-tire");
        const isCaliper = context.includes("brake-caliper");

        if (isRim) {
          m.map = null;
          m.normalMap = null;
          m.aoMap = null;
          m.emissiveMap = null;
          if (m.emissive) m.emissive.set("#000000");
          m.emissiveIntensity = 0;
          rims.current.push(m);
        }

        if (isCaliper) {
          m.map = null;
          m.emissiveMap = null;
          calipers.current.push(m);
        } else if (!isRim && !isTyre && /disc|rotor|hub|backplate/.test(context)) {
          wheelInners.current.push(m);
        }

        if (mn.includes("glass") || context.includes("window-glass") || context.includes("glass_ext")) glasses.current.push(m);
        if (mn.includes("carbon") || context.includes("carbon") || /side-mirror-trim|bumper-front-grill-frame|wheel-fender/.test(context)) carbons.current.push(m);

        // The model does not use obvious emissive material names for every lamp,
        // so detect the real headlight/taillight hierarchy too.
        if (/headlight|taillight|drl|projector|led/.test(context) && !context.includes("cover") && !context.includes("trim")) {
          emissives.current.push(m);
        }

        // INTERIOR — exact render-mesh targeting from this GLB.
        // Do not infer these zones from parent/hierarchy names: target the
        // actual Object_* render meshes exported by the model. Each material
        // has already been cloned above, so the four zones stay independent.
        const isInteriorMaterial = mn === "interior" || mn.startsWith("interior.");
        const meshName = obj.name || "";

        const SEAT_MESHES = new Set([
          "Object_83",  // front seat
          "Object_85",  // front seat backrest
          "Object_87",  // passenger backrest
          "Object_89",  // passenger seat
          "Object_129", // rear seat
          "Object_131", // rear seat backrest
        ]);

        const DASHBOARD_MESHES = new Set(["Object_33"]);
        const CONSOLE_MESHES = new Set(["Object_29"]);
        const DOOR_PANEL_MESHES = new Set([
          "Object_35", // front-left interior door panel
          "Object_37", // front-right interior door panel
          "Object_47", // rear-left interior door panel
          "Object_49", // rear-right interior door panel
        ]);

        if (isInteriorMaterial) {
          const isSeat = SEAT_MESHES.has(meshName);
          const isDashboard = DASHBOARD_MESHES.has(meshName);
          const isConsole = CONSOLE_MESHES.has(meshName);
          const isDoorPanel = DOOR_PANEL_MESHES.has(meshName);

          if (isSeat || isDashboard || isConsole || isDoorPanel) {
            // The GLB's shared `interior` material contains a dark base-colour
            // texture. That texture multiplies the selected colour and can make
            // colour changes appear to do nothing. Remove ONLY the base-colour
            // map on these exact meshes; keep normal/AO detail intact.
            m.map = null;
            if (m.emissive) m.emissive.set("#000000");
            m.emissiveIntensity = 0;
            m.needsUpdate = true;
          }

          if (isSeat) interiorSeats.current.push(m);
          else if (isDashboard) interiorDashboard.current.push(m);
          else if (isConsole) interiorConsole.current.push(m);
          else if (isDoorPanel) interiorDoorPanels.current.push(m);
        }

        return m;
      });
      obj.material = Array.isArray(obj.material) ? cloned : cloned[0];
    });

    // Exact hinge positions measured from the uploaded Generic Sedan GLB.
    // The model has baked panel geometry, so generic Box3 centres are NOT the
    // physical hinge lines. These coordinates are in car.Body local space.
    const body = car.getObjectByName("car.Body_119") || car;

    const makeExactPivot = (key, names, hinge) => {
      const parts = names.map((name) => car.getObjectByName(name)).filter(Boolean);
      if (!parts.length) return null;

      car.updateMatrixWorld(true);
      body.updateMatrixWorld(true);

      const pivot = new THREE.Group();
      pivot.name = `drive-mods-pivot-${key}`;
      pivot.position.set(hinge[0], hinge[1], hinge[2]);
      body.add(pivot);
      body.updateMatrixWorld(true);

      // attach() keeps every panel exactly where the GLB exported it while
      // moving its rotation origin to the real hinge line.
      parts.forEach((part) => pivot.attach(part));
      return pivot;
    };

    pivots.current = {
      frontL: makeExactPivot("front-left", [
        "door-front-l_16", "door-front-interior-panel-l_14", "door-front-window-glass-l_18"
      ], [0.81808, 0.66074, 1.19870]),

      frontR: makeExactPivot("front-right", [
        "door-front-r_17", "door-front-interior-panel-r_15", "door-front-window-glass-r_19"
      ], [-0.81808, 0.66074, 1.19870]),

      rearL: makeExactPivot("rear-left", [
        "door-rear-l_22", "door-rear-interior-panel-l_20", "door-rear-window-glass-l_26", "door-rear-trim-glass-l_24"
      ], [0.91128, 0.54214, -0.07985]),

      rearR: makeExactPivot("rear-right", [
        "door-rear-r_23", "door-rear-interior-panel-r_21", "door-rear-window-glass-r_27", "door-rear-trim-glass-r_25"
      ], [-0.91246, 0.51675, -0.08060]),

      hood: makeExactPivot("hood", ["hood_60"], [0, 1.01697, 1.14677]),

      trunk: makeExactPivot("trunk", [
        "trunk_99", "taillight-back-trunk-02-l_83", "taillight-back-trunk-02-r_84",
        "taillight-lens-trunk-l_90", "taillight-lens-trunk-r_91"
      ], [0, 1.00821, -1.77706]),
    };
  }, [car]);

  useEffect(() => {
    const color = before ? "#6f7478" : paintTone === "custom" ? customPaint : PAINTS.find(x => x.id === paintTone)?.hex || "#0f2fa8";
    const f = before ? FINISHES[0] : FINISHES.find(x => x.id === finish) || FINISHES[1];
    paints.current.forEach(m => {
      m.color?.set(color);
      m.metalness = beforeMode ? .58 : THREE.MathUtils.clamp(f.metalness * (.55 + metallicBoost), 0, 1);
      m.roughness = f.roughness;
      if ("clearcoat" in m) m.clearcoat = beforeMode ? .82 : THREE.MathUtils.clamp(f.clearcoat * (.35 + paintGloss), 0, 1);
      if ("clearcoatRoughness" in m) m.clearcoatRoughness = f.id === "matte" ? .58 : .045;
      if ("envMapIntensity" in m) m.envMapIntensity = 1.65;
      m.needsUpdate = true;
    });
  }, [paintTone, customPaint, finish, before, lightsOn, beforeMode, metallicBoost, paintGloss]);

  useEffect(() => {
    const colourFor = (zone) => {
      const choice = interiorSettings?.[zone] || "black";
      return choice === "custom"
        ? (customInteriorColors?.[zone] || "#111214")
        : INTERIOR_COLORS.find((x) => x.id === choice)?.hex || "#111214";
    };

    const applyInteriorColour = (materials, colour) => {
      materials.forEach((m) => {
        m.color?.set(colour);
        if ("roughness" in m) m.roughness = .58;
        if ("metalness" in m) m.metalness = .04;
        if ("envMapIntensity" in m) m.envMapIntensity = .72;
        m.needsUpdate = true;
      });
    };

    applyInteriorColour(interiorSeats.current, colourFor("seats"));
    applyInteriorColour(interiorDashboard.current, colourFor("dashboard"));
    applyInteriorColour(interiorConsole.current, colourFor("console"));
    applyInteriorColour(interiorDoorPanels.current, colourFor("doors"));
  }, [interiorSettings, customInteriorColors]);

  useEffect(() => {
    const r = before ? RIMS[0] : rim === "custom"
      ? { hex: customRimColor, metalness: .72, roughness: .28, env: 1.15 }
      : (RIMS.find(x => x.id === rim) || RIMS[0]);
    rims.current.forEach(m => {
      m.color?.set(r.hex);
      m.metalness = r.metalness;
      m.roughness = r.roughness;
      if ("envMapIntensity" in m) m.envMapIntensity = Math.max(r.env || .6, .75);
      if ("clearcoat" in m) m.clearcoat = .35;
      if ("clearcoatRoughness" in m) m.clearcoatRoughness = .18;
      m.needsUpdate = true;
    });

    wheelInners.current.forEach(m => {
      m.map = null;
      m.color?.set("#17191c");
      m.metalness = .72;
      m.roughness = .4;
      m.needsUpdate = true;
    });

    const c = before ? "#343638" : caliper === "custom" ? customCaliperColor : (CALIPERS.find(x => x.id === caliper)?.hex || "#d4141d");
    calipers.current.forEach(m => {
      m.color?.set(c);
      m.metalness = .38;
      m.roughness = THREE.MathUtils.lerp(.56, .14, caliperGloss);
      if ("clearcoat" in m) m.clearcoat = caliperGloss;
      if ("envMapIntensity" in m) m.envMapIntensity = .8;
      m.needsUpdate = true;
    });
  }, [rim, caliper, customRimColor, customCaliperColor, before, caliperGloss]);

  useEffect(() => {
    const t = before ? TINTS[0] : TINTS.find(x => x.id === tint) || TINTS[1];
    glasses.current.forEach(m => {
      m.transparent = true;
      m.opacity = t.opacity;
      m.color?.set(before ? "#a8b2b7" : glassColor);
      m.roughness = .05;
      m.metalness = .02;
      if ("envMapIntensity" in m) m.envMapIntensity = 1.35;
      m.needsUpdate = true;
    });
  }, [tint, before, glassColor]);

  useEffect(() => {
    carbons.current.forEach(m => {
      m.color?.set(before || !carbon ? "#55595d" : "#111315");
      m.metalness = before || !carbon ? .32 : .68;
      m.roughness = carbonFinish === "gloss" ? .16 : carbonFinish === "satin" ? .42 : .31;
      if ("clearcoat" in m) m.clearcoat = carbonFinish === "gloss" ? 1 : .35;
      m.needsUpdate = true;
    });
  }, [carbon, before, carbonFinish]);

  useEffect(() => {
    emissives.current.forEach(m => {
      if (!m.emissive) return;
      m.emissive.set(lightsOn ? lightColor : "#090909");
      m.emissiveIntensity = lightsOn ? 4.8 * lightIntensity : .02;
      m.needsUpdate = true;
    });
  }, [lightsOn, lightColor, lightIntensity]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, rotation + (autoRotate ? state.clock.elapsedTime * .035 : 0), .08);
    const drop = before ? 0 : stance * .16;
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -1.08 - drop, .1);

    // Openable body panels. Angles are deliberately conservative so panels do
    // not clip through the body on desktop or mobile.
    const p = pivots.current;
    if (p.frontL) p.frontL.rotation.y = THREE.MathUtils.damp(p.frontL.rotation.y, openParts?.frontL ? -1.02 : 0, 8, delta);
    if (p.frontR) p.frontR.rotation.y = THREE.MathUtils.damp(p.frontR.rotation.y, openParts?.frontR ? 1.02 : 0, 8, delta);
    if (p.rearL) p.rearL.rotation.y = THREE.MathUtils.damp(p.rearL.rotation.y, openParts?.rearL ? -1.0 : 0, 8, delta);
    if (p.rearR) p.rearR.rotation.y = THREE.MathUtils.damp(p.rearR.rotation.y, openParts?.rearR ? 1.0 : 0, 8, delta);
    if (p.hood) p.hood.rotation.x = THREE.MathUtils.damp(p.hood.rotation.x, openParts?.hood ? -1.0 : 0, 7, delta);
    if (p.trunk) p.trunk.rotation.x = THREE.MathUtils.damp(p.trunk.rotation.x, openParts?.trunk ? .92 : 0, 7, delta);

    const steer = THREE.MathUtils.degToRad((before ? 0 : steering) * 20);
    frontSteer.current.forEach(w => w.rotation.y = THREE.MathUtils.damp(w.rotation.y, steer, 7, delta));

    // WHEELS ONLY — spin the actual tyre/rim render meshes around LOCAL X.
    // Nothing is re-parented, so steering, doors and every body panel stay untouched.
    if (wheelSpin) wheelSpinAngle.current -= delta * 10.5;
    const spinQ = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      wheelSpinAngle.current
    );
    wheelRotators.current.forEach(({ node, baseQuaternion }) => {
      node.quaternion.copy(baseQuaternion).multiply(spinQ);
    });
  });

  return (
    <group ref={group} position={[0, -0.48, 0]} scale={1.38}>
      <primitive object={car} />

      {/* Procedural aero kit. The downloaded sedan has no dedicated lip/skirts/
          diffuser/wing meshes, so these lightweight parts make every aero
          control visibly functional without touching the original body. */}
      {!before && (
        <group>
          {aero?.lip && (
            <mesh position={[0, -0.62, 2.77]} rotation={[0, 0, 0]} castShadow>
              <boxGeometry args={[1.72, .075, .34]} />
              <meshPhysicalMaterial color={carbon ? "#101214" : "#17191c"} metalness={carbon ? .62 : .35} roughness={carbonFinish === "gloss" ? .16 : .34} clearcoat={carbon ? .9 : .35} />
            </mesh>
          )}
          {aero?.splitter && (
            <mesh position={[0, -0.69, 2.88]} castShadow>
              <boxGeometry args={[1.94, .035, .52]} />
              <meshPhysicalMaterial color="#0c0d0f" metalness={.5} roughness={.2} clearcoat={.75} />
            </mesh>
          )}
          {aero?.skirts && (<>
            <mesh position={[.93, -0.63, .05]} castShadow><boxGeometry args={[.10, .10, 3.75]} /><meshPhysicalMaterial color={carbon ? "#101214" : "#191b1e"} metalness={.5} roughness={.24} clearcoat={.7} /></mesh>
            <mesh position={[-.93, -0.63, .05]} castShadow><boxGeometry args={[.10, .10, 3.75]} /><meshPhysicalMaterial color={carbon ? "#101214" : "#191b1e"} metalness={.5} roughness={.24} clearcoat={.7} /></mesh>
          </>)}
          {aero?.diffuser && (
            <group position={[0, -0.55, -2.68]}>
              <mesh castShadow><boxGeometry args={[1.72, .22, .34]} /><meshPhysicalMaterial color={carbon ? "#0d0f10" : "#17191c"} metalness={.48} roughness={.26} clearcoat={.55} /></mesh>
              {[-.55,-.28,0,.28,.55].map(x => <mesh key={x} position={[x,-.12,-.08]}><boxGeometry args={[.035,.25,.36]} /><meshStandardMaterial color="#08090a" roughness={.38} /></mesh>)}
            </group>
          )}
          {aero?.wing && (
            <group position={[0, .72, -2.18]}>
              <mesh position={[0,.20,0]} castShadow><boxGeometry args={[1.78,.075,.34]} /><meshPhysicalMaterial color={carbon ? "#0d0f10" : "#17191c"} metalness={.5} roughness={.2} clearcoat={.8} /></mesh>
              <mesh position={[.58,0,0]}><boxGeometry args={[.055,.42,.10]} /><meshStandardMaterial color="#111315" metalness={.45} roughness={.28} /></mesh>
              <mesh position={[-.58,0,0]}><boxGeometry args={[.055,.42,.10]} /><meshStandardMaterial color="#111315" metalness={.45} roughness={.28} /></mesh>
            </group>
          )}
          {aero?.canards && (<>
            <mesh position={[.88,-.36,2.57]} rotation={[0,.35,.12]}><boxGeometry args={[.34,.035,.20]} /><meshStandardMaterial color="#0d0f10" metalness={.5} roughness={.22} /></mesh>
            <mesh position={[-.88,-.36,2.57]} rotation={[0,-.35,-.12]}><boxGeometry args={[.34,.035,.20]} /><meshStandardMaterial color="#0d0f10" metalness={.5} roughness={.22} /></mesh>
          </>)}
        </group>
      )}

      {lightsOn && (
        <>
          <pointLight position={[.72, .55, 3.15]} intensity={6 * lightIntensity} distance={8} color={lightColor} />
          <pointLight position={[-.72, .55, 3.15]} intensity={6 * lightIntensity} distance={8} color={lightColor} />
        </>
      )}
    </group>
  );
}

useGLTF.preload(CAR_MODEL_URL);

function GarageEnvironment({ lightsOn }) {
  const led = lightsOn ? "#fff4d8" : "#242424";
  const gold = lightsOn ? "#d7aa49" : "#4b3a1d";

  const Cabinet = ({ position, width = 2.8 }) => (
    <group position={position}>
      <RoundedBox args={[width, 1.75, .72]} radius={.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#151719" roughness={.38} metalness={.55} />
      </RoundedBox>
      {[.48, .12, -.24, -.60].map((y) => (
        <mesh key={y} position={[0, y, .37]} castShadow>
          <boxGeometry args={[width - .25, .025, .025]} />
          <meshStandardMaterial color="#4b4e50" metalness={.8} roughness={.28} />
        </mesh>
      ))}
      {[-.8, 0, .8].map((x) => (
        <mesh key={x} position={[x, .67, .39]}>
          <boxGeometry args={[.42, .045, .025]} />
          <meshStandardMaterial color="#b88a38" metalness={.72} roughness={.28} />
        </mesh>
      ))}
    </group>
  );

  const Tyre = ({ y, x = 0 }) => (
    <mesh position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <torusGeometry args={[.54, .19, 18, 42]} />
      <meshStandardMaterial color="#08090a" roughness={.86} metalness={.02} />
    </mesh>
  );

  return (
    <group>
      {/* epoxy workshop floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.105, 0]} receiveShadow>
        <planeGeometry args={[34, 30]} />
        <meshStandardMaterial color="#17191b" roughness={.56} metalness={.18} envMapIntensity={.62} />
      </mesh>

      {/* slightly polished service bay under the car */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.095, -.15]} receiveShadow>
        <planeGeometry args={[11.5, 7.4]} />
        <meshPhysicalMaterial
          color="#232527"
          roughness={.34}
          metalness={.32}
          clearcoat={.25}
          clearcoatRoughness={.38}
          envMapIntensity={.9}
        />
      </mesh>

      {/* rear concrete wall */}
      <mesh position={[0, 3.4, -7.4]} receiveShadow>
        <boxGeometry args={[22, 9, .35]} />
        <meshStandardMaterial color="#17191b" roughness={.9} metalness={.04} />
      </mesh>

      {/* side walls */}
      <mesh position={[-10.7, 3.4, -.4]} receiveShadow>
        <boxGeometry args={[.35, 9, 14]} />
        <meshStandardMaterial color="#111315" roughness={.92} />
      </mesh>
      <mesh position={[10.7, 3.4, -.4]} receiveShadow>
        <boxGeometry args={[.35, 9, 14]} />
        <meshStandardMaterial color="#111315" roughness={.92} />
      </mesh>

      {/* ceiling */}
      <mesh position={[0, 7.85, -.2]} receiveShadow>
        <boxGeometry args={[22, .28, 15]} />
        <meshStandardMaterial color="#090a0b" roughness={.92} />
      </mesh>

      {/* ceiling beams */}
      {[-6.8, -3.4, 0, 3.4, 6.8].map((x) => (
        <mesh key={`beam-${x}`} position={[x, 7.55, -.3]} castShadow>
          <boxGeometry args={[.22, .32, 14]} />
          <meshStandardMaterial color="#202326" metalness={.38} roughness={.55} />
        </mesh>
      ))}

      {/* long LED workshop fixtures */}
      {[-5.4, -1.8, 1.8, 5.4].map((x) => (
        <group key={`led-${x}`}>
          <mesh position={[x, 7.34, -.2]}>
            <boxGeometry args={[.15, .06, 10.8]} />
            <meshBasicMaterial color={led} toneMapped={false} />
          </mesh>
          {lightsOn && (
            <pointLight
              position={[x, 5.7, -.1]}
              intensity={11}
              distance={8.5}
              decay={2}
              color="#fff2d3"
            />
          )}
        </group>
      ))}

      {/* rear wall architectural light bars */}
      {[-5.9, -3.0, 3.0, 5.9].map((x) => (
        <group key={`wall-light-${x}`}>
          <mesh position={[x, 3.55, -7.19]}>
            <boxGeometry args={[.055, 4.4, .05]} />
            <meshBasicMaterial color={gold} toneMapped={false} />
          </mesh>
          {lightsOn && (
            <pointLight position={[x, 3.3, -6.5]} intensity={4.2} distance={4.2} color="#d7aa49" />
          )}
        </group>
      ))}

      {/* illuminated centre workshop sign */}
      <RoundedBox
        args={[5.3, 1.28, .16]}
        radius={.08}
        smoothness={4}
        position={[0, 4.75, -7.08]}
        castShadow
      >
        <meshPhysicalMaterial color="#070809" metalness={.62} roughness={.28} clearcoat={.5} />
      </RoundedBox>
      <mesh position={[0, 4.75, -6.985]}>
        <boxGeometry args={[4.72, .07, .03]} />
        <meshBasicMaterial color={gold} toneMapped={false} />
      </mesh>
      {lightsOn && (
        <pointLight position={[0, 4.65, -5.9]} intensity={10} distance={5.5} color="#d7aa49" />
      )}

      {/* concrete pillars */}
      {[-8.1, 8.1].map((x) => (
        <group key={`pillar-${x}`}>
          <mesh position={[x, 2.9, -6.7]} castShadow receiveShadow>
            <boxGeometry args={[.82, 8, .82]} />
            <meshStandardMaterial color="#25282a" roughness={.78} metalness={.08} />
          </mesh>
          <mesh position={[x, .15, -6.25]}>
            <boxGeometry args={[.84, .14, .035]} />
            <meshBasicMaterial color="#d0a13f" />
          </mesh>
        </group>
      ))}

      {/* tool cabinets */}
      <Cabinet position={[-6.15, -.20, -6.72]} width={3.25} />
      <Cabinet position={[5.1, -.20, -6.72]} width={2.5} />

      {/* work bench */}
      <group position={[-3.8, .08, -6.45]}>
        <mesh castShadow>
          <boxGeometry args={[2.7, .18, .95]} />
          <meshStandardMaterial color="#303336" metalness={.58} roughness={.38} />
        </mesh>
        {[-1.05, 1.05].map((x) => (
          <mesh key={x} position={[x, -.75, 0]} castShadow>
            <boxGeometry args={[.13, 1.55, .13]} />
            <meshStandardMaterial color="#151719" metalness={.55} roughness={.45} />
          </mesh>
        ))}
      </group>

      {/* wheel / tyre rack */}
      <group position={[7.15, -.15, -6.15]}>
        <mesh position={[0, 1.55, -.22]} castShadow>
          <boxGeometry args={[2.5, 3.7, .14]} />
          <meshStandardMaterial color="#1e2123" metalness={.58} roughness={.48} />
        </mesh>
        <Tyre y={.1} x={-.62} />
        <Tyre y={.1} x={.62} />
        <Tyre y={1.35} x={-.62} />
        <Tyre y={1.35} x={.62} />
        <Tyre y={2.6} x={-.62} />
        <Tyre y={2.6} x={.62} />
      </group>

      {/* hydraulic lift posts */}
      {[-4.8, 4.8].map((x) => (
        <group key={`lift-${x}`} position={[x, 0, .35]}>
          <mesh position={[0, .65, 0]} castShadow>
            <boxGeometry args={[.32, 3.5, .46]} />
            <meshStandardMaterial color="#202326" metalness={.68} roughness={.38} />
          </mesh>
          <mesh position={[0, -1.01, 0]} castShadow>
            <boxGeometry args={[1.15, .16, .9]} />
            <meshStandardMaterial color="#bd913b" metalness={.5} roughness={.38} />
          </mesh>
        </group>
      ))}

      {/* floor lift rails */}
      {[-2.45, 2.45].map((x) => (
        <mesh key={`rail-${x}`} position={[x, -1.065, .05]} receiveShadow>
          <boxGeometry args={[.13, .045, 7.4]} />
          <meshStandardMaterial color="#777a7c" metalness={.86} roughness={.28} />
        </mesh>
      ))}

      {/* floor bay markings */}
      {[-5.5, 5.5].map((x) => (
        <mesh key={`line-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -1.075, -.1]}>
          <planeGeometry args={[.055, 10.5]} />
          <meshBasicMaterial color="#b58b3b" transparent opacity={.55} />
        </mesh>
      ))}

      {/* garage door panels in rear */}
      <group position={[0, 2.45, -7.18]}>
        {[-2.0, -1.3, -.6, .1, .8].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[5.7, .045, .035]} />
            <meshStandardMaterial color="#35383a" metalness={.42} roughness={.52} />
          </mesh>
        ))}
      </group>

      {/* premium architectural wall layered over the workshop shell */}
      <mesh position={[0, 3.45, -7.16]} receiveShadow>
        <boxGeometry args={[7.7, 6.8, .12]} />
        <meshStandardMaterial color="#b8b1a6" roughness={.76} metalness={.01} />
      </mesh>

      {/* stone panel joints */}
      {[-2.9, -1.45, 0, 1.45, 2.9].map((x) => (
        <mesh key={`stone-joint-${x}`} position={[x, 3.45, -7.09]}>
          <boxGeometry args={[.015, 6.7, .018]} />
          <meshBasicMaterial color="#77736c" transparent opacity={.30} />
        </mesh>
      ))}

      {/* fluted dark timber / metal side panels */}
      {[-1, 1].map((side) => (
        <group key={`premium-slats-${side}`}>
          {Array.from({ length: 13 }).map((_, i) => {
            const x = side * (4.25 + i * .23);
            return (
              <mesh key={i} position={[x, 3.45, -7.08]} castShadow>
                <boxGeometry args={[.105, 6.85, .13]} />
                <meshStandardMaterial color={i % 2 ? "#2b2722" : "#17191a"} roughness={.62} metalness={.14} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* warm premium wall wash */}
      {lightsOn && (
        <>
          <pointLight position={[-3.2, 3.8, -5.9]} intensity={3.6} distance={4.5} color="#f1d7a9" />
          <pointLight position={[3.2, 3.8, -5.9]} intensity={3.6} distance={4.5} color="#f1d7a9" />
        </>
      )}

      {/* realistic car grounding */}
      <ContactShadows
        position={[0, -1.075, 0]}
        opacity={lightsOn ? .58 : .72}
        scale={10}
        blur={2.2}
        far={4}
        resolution={512}
        color="#000000"
      />
    </group>
  );
}

function StudioScene(props) {
  return (
    <>
      <CameraRig view="360" zoom={props.zoom} mobileCustomizerOpen={props.mobileCustomizerOpen} />

      {/* Real HDR environment: the warehouse preset is photographic HDRI,
          so reflections on paint, glass and metal look far more natural. */}
      <Suspense fallback={<Loader />}>
        <Environment
          preset="warehouse"
          background
          blur={0.02}
          environmentIntensity={0.92}
        />
        <CarModel {...props} />
      </Suspense>

      {/* Shadow-catching workshop floor keeps the car planted in the HDR scene. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.10, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <meshPhysicalMaterial
          color="#202225"
          roughness={.32}
          metalness={.22}
          clearcoat={.34}
          clearcoatRoughness={.32}
          envMapIntensity={1.15}
        />
      </mesh>

      <ContactShadows
        position={[0, -1.075, 0]}
        opacity={.64}
        scale={10}
        blur={2.1}
        far={4}
        resolution={512}
        color="#000000"
      />

      {/* Soft automotive-photo lighting, layered over the HDRI. */}
      <ambientLight intensity={.12} />
      <directionalLight castShadow position={[5.8, 8.5, 6.5]} intensity={1.35} color="#fff7e9" />
      <directionalLight position={[-6, 4.2, 1]} intensity={.48} color="#c8dcf0" />
      <spotLight position={[0, 7, 3.5]} angle={.62} penumbra={.8} intensity={3.1} distance={15} decay={2} color="#fff4df" />
    </>
  );
}

function ModPanel({
  active, paintTone, setPaintTone, customPaint, setCustomPaint, finish, setFinish,
  rim, setRim, customRimColor, setCustomRimColor, caliper, setCaliper,
  customCaliperColor, setCustomCaliperColor, tint, setTint, glassColor, setGlassColor, carbon, setCarbon,
  aero, setAero, stance, setStance, steering, setSteering, lightsOn, setLightsOn,
  wheelSpin, setWheelSpin, activate,
  lightColor, setLightColor, lightIntensity, setLightIntensity,
  paintGloss, setPaintGloss, metallicBoost, setMetallicBoost,
  rimScale, setRimScale, caliperGloss, setCaliperGloss,
  carbonFinish, setCarbonFinish, demoMode, setDemoMode,
  beforeMode, setBeforeMode, activePreset, applyBuildPreset, applyAeroPreset,
  mobileCustomizerOpen, openParts, setOpenParts,
  interiorSettings, setInteriorSettings, customInteriorColors, setCustomInteriorColors,
}) {
  const info = CATEGORY_INFO[active];
  const [interiorZone, setInteriorZone] = useState("seats");

  const ChoiceHeader = ({ title, text }) => (
    <div className="step2-section-head">
      <strong>{title}</strong>
      {text && <small>{text}</small>}
    </div>
  );

  if (active === "paint") {
    const selectedPaint =
      paintTone === "custom"
        ? { name: "Custom Colour", hex: customPaint }
        : PAINTS.find((x) => x.id === paintTone);

    return (
      <div className="mod-panel simple-step-panel">
        <ChoiceHeader
          title="Choose your body colour"
          text="Tap any colour. The car updates immediately."
        />

        <div className="visual-colour-grid">
          {PAINTS.map((x) => (
            <button
              key={x.id}
              className={`visual-colour-card ${paintTone === x.id ? "active" : ""}`}
              onClick={() => {
                setPaintTone(x.id);
                activate();
              }}
            >
              <span className="colour-disc" style={{ background: x.hex }} />
              <span className="choice-text">
                <strong>{x.name}</strong>
                <small>{paintTone === x.id ? "Selected" : "Choose colour"}</small>
              </span>
              <b>{paintTone === x.id ? "✓" : ""}</b>
            </button>
          ))}

          <label className={`visual-colour-card custom-colour-card ${paintTone === "custom" ? "active" : ""}`}>
            <input
              type="color"
              value={customPaint}
              onChange={(e) => {
                setCustomPaint(e.target.value);
                setPaintTone("custom");
                activate();
              }}
            />
            <span className="colour-disc custom-disc" style={{ background: customPaint }}>+</span>
            <span className="choice-text">
              <strong>Custom Colour</strong>
              <small>{customPaint.toUpperCase()}</small>
            </span>
            <b>{paintTone === "custom" ? "✓" : ""}</b>
          </label>
        </div>

        <ChoiceHeader
          title="Choose the paint finish"
          text="This changes how light reflects from the body."
        />

        <div className="premium-choice-grid finish-choice-grid">
          {FINISHES.map((x) => (
            <button
              key={x.id}
              className={finish === x.id ? "active" : ""}
              onClick={() => {
                setFinish(x.id);
                activate();
              }}
            >
              <span className={`finish-sample finish-${x.id}`} />
              <span className="choice-text">
                <strong>{x.name}</strong>
                <small>{finish === x.id ? "Applied to car" : "Preview finish"}</small>
              </span>
              <b>{finish === x.id ? "✓" : ""}</b>
            </button>
          ))}
        </div>


        <ChoiceHeader
          title="Paint character"
          text="Fine-tune the reflective character of the body finish."
        />
        <div className="clear-range-card">
          <div className="range-card-head">
            <span><small>CLEAR COAT</small><strong>Surface gloss</strong></span>
            <b>{Math.round(paintGloss * 100)}%</b>
          </div>
          <input type="range" min=".15" max="1" step=".01" value={paintGloss}
            onChange={(e) => { setPaintGloss(+e.target.value); activate(); }} />
        </div>
        <div className="clear-range-card">
          <div className="range-card-head">
            <span><small>METALLIC FLAKE</small><strong>Metallic intensity</strong></span>
            <b>{Math.round(metallicBoost * 100)}%</b>
          </div>
          <input type="range" min="0" max="1" step=".01" value={metallicBoost}
            onChange={(e) => { setMetallicBoost(+e.target.value); activate(); }} />
        </div>

        <div className="selected-choice-summary">
          <span className="summary-swatch" style={{ background: selectedPaint?.hex }} />
          <div>
            <small>CURRENT BODY FINISH</small>
            <strong>{selectedPaint?.name} · {FINISHES.find((x) => x.id === finish)?.name}</strong>
          </div>
          <b>LIVE</b>
        </div>
      </div>
    );
  }

  if (active === "interior") {
    const zones = [
      ["seats", "SEATS", "Front + rear seats & backrests"],
      ["dashboard", "DASHBOARD", "Dashboard trim surfaces"],
      ["console", "CENTER CONSOLE", "Center console trim"],
      ["doors", "DOOR PANELS", "All four interior door panels"],
    ];
    const selectedChoice = interiorSettings[interiorZone];
    const customColour = customInteriorColors[interiorZone];

    const chooseInteriorColour = (choice) => {
      setInteriorSettings((prev) => ({ ...prev, [interiorZone]: choice }));
      activate();
    };

    return (
      <div className="mod-panel simple-step-panel interior-panel">
        <ChoiceHeader
          title="Choose an interior area"
          text="Seats, dashboard, center console and door panels can each use a different colour."
        />

        <div className="interior-zone-tabs">
          {zones.map(([id, label, text]) => (
            <button
              key={id}
              className={interiorZone === id ? "active" : ""}
              onClick={() => setInteriorZone(id)}
            >
              <strong>{label}</strong>
              <small>{text}</small>
            </button>
          ))}
        </div>

        <ChoiceHeader
          title={`Choose ${zones.find(([id]) => id === interiorZone)?.[1].toLowerCase()} colour`}
          text="This colour applies only to the selected interior area. Screens and LEDs stay unchanged."
        />

        <div className="visual-colour-grid interior-colour-grid">
          {INTERIOR_COLORS.slice(0, 9).map((x) => (
            <button
              key={x.id}
              className={`visual-colour-card ${selectedChoice === x.id ? "active" : ""}`}
              onClick={() => chooseInteriorColour(x.id)}
            >
              <span className="colour-disc" style={{ background: x.hex }} />
              <span className="choice-text">
                <strong>{x.name}</strong>
                <small>{selectedChoice === x.id ? "Selected" : "Choose colour"}</small>
              </span>
              <b>{selectedChoice === x.id ? "✓" : ""}</b>
            </button>
          ))}

          <label className={`visual-colour-card custom-premium-card ${selectedChoice === "custom" ? "active" : ""}`}>
            <input
              type="color"
              value={customColour}
              onChange={(e) => {
                const value = e.target.value;
                setCustomInteriorColors((prev) => ({ ...prev, [interiorZone]: value }));
                setInteriorSettings((prev) => ({ ...prev, [interiorZone]: "custom" }));
                activate();
              }}
            />
            <span className="colour-disc custom-disc" style={{ background: customColour }}>+</span>
            <span className="choice-text">
              <strong>CUSTOM COLOUR</strong>
              <small>{customColour.toUpperCase()}</small>
            </span>
            <b>{selectedChoice === "custom" ? "✓" : ""}</b>
          </label>
        </div>
      </div>
    );
  }

  if (active === "wheels") {
    return (
      <div className="mod-panel simple-step-panel">
        <ChoiceHeader
          title="Choose your wheel finish"
          text="Select a finish that matches the style of your build."
        />

        <div className="premium-choice-grid">
          {RIMS.map((x) => (
            <button
              key={x.id}
              className={rim === x.id ? "active" : ""}
              onClick={() => {
                setRim(x.id);
                activate();
              }}
            >
              <span className="wheel-sample">
                <i style={{ background: x.hex }} />
              </span>
              <span className="choice-text">
                <strong>{x.name}</strong>
                <small>{rim === x.id ? "Selected" : "Choose finish"}</small>
              </span>
              <b>{rim === x.id ? "✓" : ""}</b>
            </button>
          ))}

          <label className={`premium-choice-card custom-premium-card ${rim === "custom" ? "active" : ""}`}>
            <input
              type="color"
              value={customRimColor}
              onChange={(e) => {
                setCustomRimColor(e.target.value);
                setRim("custom");
                activate();
              }}
            />
            <span className="wheel-sample">
              <i style={{ background: customRimColor }} />
            </span>
            <span className="choice-text">
              <strong>Custom Rim Colour</strong>
              <small>{customRimColor.toUpperCase()}</small>
            </span>
            <b>{rim === "custom" ? "✓" : ""}</b>
          </label>
        </div>


        <ChoiceHeader title="Wheel setup" text="Adjust the visual wheel size and movement preview." />
        <div className="clear-range-card">
          <div className="range-card-head">
            <span><small>WHEEL SIZE</small><strong>Visual wheel scale</strong></span>
            <b>{rimScale < .98 ? "Compact" : rimScale > 1.04 ? "Large" : "OEM"}</b>
          </div>
          <input type="range" min=".94" max="1.08" step=".01" value={rimScale}
            onChange={(e) => { setRimScale(+e.target.value); activate(); }} />
        </div>

        <button
          className={`clear-action-toggle ${wheelSpin ? "active" : ""}`}
          onClick={() => setWheelSpin((v) => !v)}
        >
          <span>Wheel movement preview</span>
          <strong>{wheelSpin ? "STOP SPINNING" : "SPIN WHEELS"}</strong>
        </button>
      </div>
    );
  }

  if (active === "brakes") {
    return (
      <div className="mod-panel simple-step-panel">
        <ChoiceHeader
          title="Choose your brake caliper colour"
          text="Add a visible performance accent behind the wheels."
        />

        <div className="visual-colour-grid">
          {CALIPERS.map((x) => (
            <button
              key={x.id}
              className={`visual-colour-card ${caliper === x.id ? "active" : ""}`}
              onClick={() => {
                setCaliper(x.id);
                activate();
              }}
            >
              <span className="colour-disc" style={{ background: x.hex }} />
              <span className="choice-text">
                <strong>{x.name}</strong>
                <small>{caliper === x.id ? "Selected" : "Choose colour"}</small>
              </span>
              <b>{caliper === x.id ? "✓" : ""}</b>
            </button>
          ))}

          <label className={`visual-colour-card custom-colour-card ${caliper === "custom" ? "active" : ""}`}>
            <input
              type="color"
              value={customCaliperColor}
              onChange={(e) => {
                setCustomCaliperColor(e.target.value);
                setCaliper("custom");
                activate();
              }}
            />
            <span className="colour-disc custom-disc" style={{ background: customCaliperColor }}>+</span>
            <span className="choice-text">
              <strong>Custom Colour</strong>
              <small>{customCaliperColor.toUpperCase()}</small>
            </span>
            <b>{caliper === "custom" ? "✓" : ""}</b>
          </label>
        </div>
        <ChoiceHeader title="Caliper finish" text="Adjust the shine of the brake calipers." />
        <div className="clear-range-card">
          <div className="range-card-head">
            <span><small>CALIPER GLOSS</small><strong>Surface finish</strong></span>
            <b>{Math.round(caliperGloss * 100)}%</b>
          </div>
          <input type="range" min=".1" max="1" step=".01" value={caliperGloss}
            onChange={(e) => { setCaliperGloss(+e.target.value); activate(); }} />
        </div>
      </div>
    );
  }

  if (active === "suspension") {
    return (
      <div className="mod-panel simple-step-panel">
        <ChoiceHeader
          title="Adjust the stance"
          text="Use the sliders below. Values update on the 3D car live."
        />

        <div className="clear-range-card">
          <div className="range-card-head">
            <span>
              <small>RIDE HEIGHT</small>
              <strong>Lower the vehicle</strong>
            </span>
            <b>{Math.round(stance * 45)} mm drop</b>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step=".02"
            value={stance}
            onChange={(e) => {
              setStance(+e.target.value);
              activate();
            }}
          />
          <div className="range-labels"><span>Standard</span><span>Lower</span></div>
        </div>

        <div className="clear-range-card">
          <div className="range-card-head">
            <span>
              <small>FRONT WHEELS</small>
              <strong>Steering preview</strong>
            </span>
            <b>{steering < -.05 ? "Left" : steering > .05 ? "Right" : "Centre"}</b>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step=".02"
            value={steering}
            onChange={(e) => {
              setSteering(+e.target.value);
              activate();
            }}
          />
          <div className="range-labels"><span>Left</span><span>Centre</span><span>Right</span></div>
        </div>
      </div>
    );
  }

  if (active === "aero") {
    const aeroOptions = [
      ["wing", "Rear Wing", "Adds a stronger rear profile"],
      ["lip", "Front Lip", "Sharper front-end appearance"],
      ["skirts", "Side Skirts", "Lower visual body line"],
      ["diffuser", "Rear Diffuser", "Performance rear styling"],
      ["splitter", "Front Splitter", "Wider lower front blade"],
      ["canards", "Front Canards", "Track-inspired corner aero"],
    ];

    return (
      <div className="mod-panel simple-step-panel">
        <ChoiceHeader
          title="Choose an aero package"
          text="Start with a complete setup, then fine-tune individual parts."
        />
        <div className="preset-choice-grid">
          {AERO_PRESETS.map(([id,name,desc,preset]) => (
            <button key={id} onClick={() => applyAeroPreset(preset)}>
              <strong>{name}</strong><small>{desc}</small>
            </button>
          ))}
        </div>
        <ChoiceHeader title="Fine tune aero" text="Switch individual supported GLB aero parts on or off." />
        <div className="large-toggle-list">
          {aeroOptions.map(([key, label, description]) => (
            <button
              key={key}
              className={aero[key] ? "active" : ""}
              onClick={() => {
                setAero((v) => ({ ...v, [key]: !v[key] }));
                activate();
              }}
            >
              <span className="toggle-copy">
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <span className="lux-switch"><i /></span>
              <b>{aero[key] ? "ON" : "OFF"}</b>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (active === "glass") {
    return (
      <div className="mod-panel simple-step-panel">
        <ChoiceHeader
          title="Choose your window tint"
          text="Lower percentages create a darker appearance."
        />

        <div className="premium-choice-grid">
          {TINTS.map((x) => (
            <button
              key={x.id}
              className={tint === x.id ? "active" : ""}
              onClick={() => {
                setTint(x.id);
                activate();
              }}
            >
              <span className="glass-sample" style={{ opacity: Math.max(.28, 1 - x.opacity) }} />
              <span className="choice-text">
                <strong>{x.name}</strong>
                <small>{Math.round(x.opacity * 100)}% visibility</small>
              </span>
              <b>{tint === x.id ? "✓" : ""}</b>
            </button>
          ))}
        </div>

        <ChoiceHeader title="Glass tone" text="Keep a neutral tint or add a subtle custom glass tone." />
        <div className="glass-tone-grid">
          {[
            ["#b9c7cc","Neutral"],["#8fa8b5","Cool Smoke"],["#7d8f86","Olive Smoke"],
            ["#6f8298","Blue Smoke"],["#9a8372","Bronze"],["#596064","Graphite"]
          ].map(([hex,name]) => (
            <button key={hex} className={glassColor === hex ? "active" : ""} onClick={() => { setGlassColor(hex); activate(); }}>
              <i style={{background:hex}} /><span>{name}</span>
            </button>
          ))}
          <label className="glass-custom-color">
            <input type="color" value={glassColor} onChange={(e) => { setGlassColor(e.target.value); activate(); }} />
            <i style={{background:glassColor}}>+</i><span>Custom</span>
          </label>
        </div>
      </div>
    );
  }

  if (active === "carbon") {
    return (
      <div className="mod-panel simple-step-panel">
        <ChoiceHeader
          title="Carbon fibre package"
          text="Apply or remove the carbon detail package."
        />


        <div className="premium-choice-grid carbon-finish-grid">
          {[
            ["gloss","Gloss Carbon"],
            ["satin","Satin Carbon"],
            ["forged","Forged Look"],
          ].map(([id,name]) => (
            <button key={id} className={carbonFinish === id ? "active" : ""}
              onClick={() => { setCarbonFinish(id); setCarbon(true); activate(); }}>
              <span className={`carbon-mini carbon-${id}`} />
              <span className="choice-text"><strong>{name}</strong><small>{carbonFinish === id ? "Selected" : "Preview finish"}</small></span>
              <b>{carbonFinish === id ? "✓" : ""}</b>
            </button>
          ))}
        </div>

        <button
          className={`feature-selection-card carbon-selection ${carbon ? "active" : ""}`}
          onClick={() => {
            setCarbon((v) => !v);
            activate();
          }}
        >
          <span className="feature-visual carbon-pattern" />
          <span className="choice-text">
            <strong>Carbon Fibre Details</strong>
            <small>{carbon ? "Currently applied to your build" : "Tap to add carbon details"}</small>
          </span>
          <span className="lux-switch"><i /></span>
        </button>
      </div>
    );
  }

  if (active === "lights") {
    return (
      <div className="mod-panel simple-step-panel">
        <ChoiceHeader
          title="Lighting preview"
          text="Control the vehicle lights while the photographic garage lighting stays consistent."
        />


        <ChoiceHeader title="Headlight colour" text="Choose the live light colour and brightness." />
        <div className="light-colour-row">
          {[
            ["#fff1d2","Warm White"],
            ["#f5f7ff","Platinum White"],
            ["#d9ecff","Ice White"],
            ["#bdd9ff","Cool Blue"],
            ["#8fc8ff","Xenon Blue"],
            ["#b9a6ff","Violet"],
            ["#ffe08a","Golden"],
            ["#ffb36b","Amber"],
            ["#ff5b5b","Show Red"],
            ["#7dffb2","Mint"],
          ].map(([hex,name]) => (
            <button key={hex} className={lightColor === hex ? "active" : ""}
              onClick={() => { setLightColor(hex); setLightsOn(true); activate(); }}>
              <i style={{background:hex}} /><span>{name}</span>
            </button>
          ))}
          <label className="custom-light-color">
            <input type="color" value={lightColor} onChange={(e) => { setLightColor(e.target.value); setLightsOn(true); activate(); }} />
            <i style={{background:lightColor}}>+</i><span>CUSTOM LIGHT</span>
          </label>
        </div>
        <div className="clear-range-card">
          <div className="range-card-head">
            <span><small>BRIGHTNESS</small><strong>Headlight intensity</strong></span>
            <b>{Math.round(lightIntensity * 100)}%</b>
          </div>
          <input type="range" min=".25" max="1.5" step=".05" value={lightIntensity}
            onChange={(e) => { setLightIntensity(+e.target.value); setLightsOn(true); }} />
        </div>

        <button
          className={`feature-selection-card light-selection ${lightsOn ? "active" : ""}`}
          onClick={() => setLightsOn((v) => !v)}
        >
          <span className="feature-visual light-visual">✦</span>
          <span className="choice-text">
            <strong>{lightsOn ? "Lights On" : "Night Preview"}</strong>
            <small>{lightsOn ? "Vehicle lighting enabled" : "Tap to switch vehicle lights on"}</small>
          </span>
          <span className="lux-switch"><i /></span>
        </button>
      </div>
    );
  }

  if (active === "presets") {
    return (
      <div className="mod-panel simple-step-panel">
        <ChoiceHeader title="Signature build presets" text="Apply a complete premium configuration with one tap." />
        <div className="build-preset-list">
          {BUILD_PRESETS.map((preset) => (
            <button key={preset.id} className={activePreset === preset.id ? "active" : ""}
              onClick={() => applyBuildPreset(preset)}>
              <span><strong>{preset.name}</strong><small>{preset.description}</small></span>
              <b>{activePreset === preset.id ? "APPLIED ✓" : "APPLY"}</b>
            </button>
          ))}
        </div>
        <ChoiceHeader title="Compare your build" text="Switch between factory styling and your current configuration." />
        <button className={`before-after-control ${beforeMode ? "active" : ""}`}
          onClick={() => setBeforeMode((v) => !v)}>
          <span><small>COMPARE MODE</small><strong>{beforeMode ? "Showing factory look" : "Showing your build"}</strong></span>
          <b>{beforeMode ? "SHOW MY BUILD" : "SHOW FACTORY"}</b>
        </button>
        <button className={`clear-action-toggle ${demoMode ? "active" : ""}`}
          onClick={() => { setDemoMode((v) => !v); setWheelSpin(!demoMode);  }}>
          <span>Cinematic presentation</span><strong>{demoMode ? "STOP DEMO" : "START DEMO"}</strong>
        </button>
      </div>
    );
  }

  return (
    <div className="mod-panel simple-step-panel">
      <ChoiceHeader title={info?.title || "Customize"} text="Choose an option to preview it on the car." />
    </div>
  );
}

export default function App() {
  const [rotation, setRotation] = useState(-.35);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [rotationStart, setRotationStart] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [view, setView] = useState("360");
  const [zoom, setZoom] = useState(0);
  const [lightsOn, setLightsOn] = useState(true);
  const [paintTone, setPaintTone] = useState("blue");
  const [customPaint, setCustomPaint] = useState("#ff5a1f");
  const [customRimColor, setCustomRimColor] = useState("#A88752");
  const [customCaliperColor, setCustomCaliperColor] = useState("#d71920");
  const [interiorSettings, setInteriorSettings] = useState({
    seats: "cognac",
    dashboard: "black",
    console: "black",
    doors: "cognac",
  });
  const [customInteriorColors, setCustomInteriorColors] = useState({
    seats: "#9A542F",
    dashboard: "#343638",
    console: "#70452F",
    doors: "#9A542F",
  });
  const [finish, setFinish] = useState("metallic");
  const [rim, setRim] = useState("custom");
  const [caliper, setCaliper] = useState("red");
  const [tint, setTint] = useState("smoke");
  const [glassColor, setGlassColor] = useState("#8fa8b5");
  const [carbon, setCarbon] = useState(true);
  const [aero, setAero] = useState({ wing: true, lip: true, skirts: true, diffuser: true, splitter:false, canards:false });
  const [stance, setStance] = useState(.28);
  const [steering, setSteering] = useState(0);
  const [wheelSpin, setWheelSpin] = useState(false);
  const [openParts, setOpenParts] = useState({ frontL:false, frontR:false, rearL:false, rearR:false, hood:false, trunk:false });
  const [before, setBefore] = useState(false);
  const [activeCategory, setActiveCategory] = useState("paint");
  const [environment, setEnvironment] = useState("studio");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mobileCustomizerOpen, setMobileCustomizerOpen] = useState(false);
  const [lightColor, setLightColor] = useState("#f5f7ff");
  const [lightIntensity, setLightIntensity] = useState(1);
  const [paintGloss, setPaintGloss] = useState(.82);
  const [metallicBoost, setMetallicBoost] = useState(.72);
  const [rimScale, setRimScale] = useState(1);
  const [caliperGloss, setCaliperGloss] = useState(.72);
  const [carbonFinish, setCarbonFinish] = useState("gloss");
  const [demoMode, setDemoMode] = useState(false);
  const [beforeMode, setBeforeMode] = useState(false);
  const [activePreset, setActivePreset] = useState("");

  const [toast, setToast] = useState("");
  const [faqOpen, setFaqOpen] = useState(0);
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2300);
    return () => clearTimeout(t);
  }, [toast]);

  const activate = () => setBefore(false);

  const total = useMemo(() => {
    let n = 0;
    if (finish !== "solid") n += 18000;
    if (rim !== "oem") n += 48000;
    if (caliper !== "black") n += 18000;
    if (tint !== "clear") n += 16000;
    if (carbon) n += 48000;
    if (aero.wing) n += 55000;
    if (aero.lip) n += 28000;
    if (aero.skirts) n += 42000;
    if (aero.diffuser) n += 38000;
    if (stance > .1) n += 42000;
    return n;
  }, [finish, rim, customRimColor, caliper, customCaliperColor, tint, carbon, aero, stance]);

  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(total);

  const reset = () => {
    setPaintTone("blue"); setFinish("metallic"); setRim("custom"); setCustomRimColor("rgb(251, 4, 4)"); setCaliper("red");
    setTint("smoke"); setCarbon(true); setAero({wing:true,lip:true,skirts:true,diffuser:true});
    setStance(.28); setSteering(0); setBefore(false); setView("360"); setZoom(0);
    setOpenParts({ frontL:false, frontR:false, rearL:false, rearR:false, hood:false, trunk:false }); setWheelSpin(false);
    setToast("BUILD RESET");
  };

  const saveBuild = () => {
    const build = { paintTone, customPaint, finish, rim, customRimColor, caliper, customCaliperColor, tint, carbon, aero, stance, steering, total };
    localStorage.setItem("drive-mods-build", JSON.stringify(build));
    setToast("BUILD SAVED TO THIS DEVICE");
  };

  const onPointerDown = e => {
    setDragging(true); setAutoRotate(false); setDragStart(e.clientX); setRotationStart(rotation);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = e => {
    if (!dragging || dragStart == null) return;
    setRotation(rotationStart + (e.clientX - dragStart) * .008);
  };
  const endPointer = e => {
    setDragging(false); setDragStart(null); e.currentTarget.releasePointerCapture?.(e.pointerId);
  };


  const applyBuildPreset = (preset) => {
    setPaintTone(preset.paint);
    setFinish(preset.finish);
    setRim(preset.rim);
    setCaliper(preset.caliper);
    setTint(preset.tint);
    setCarbon(preset.carbon);
    setStance(preset.stance);
    setAero({ ...preset.aero });
    setActivePreset(preset.id);
    setBeforeMode(false);
    activate();
  };

  const applyAeroPreset = (preset) => {
    setAero({ ...preset });
    activate();
  };

  const selectCategory = id => {
    setActiveCategory(id);
    activate();

    // Keep the complete car framed while a part is edited.
    setView("360");
    setZoom(0);
    setAutoRotate(false);

    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileCustomizerOpen(true);
    }
  };


  useEffect(() => {
    const nodes = [...document.querySelectorAll("[data-scroll-reveal]")];
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach(node => observer.observe(node));

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      document.documentElement.style.setProperty("--page-scroll", progress);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);


  useEffect(() => {
    if (!mobileCustomizerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileCustomizerOpen]);

  useEffect(() => {
    if (!mobileMenu) return;

    const closeMenu = (event) => {
      // Do not close on pointerdown inside the hamburger or nav itself.
      // Nav links close the menu from their own click handler after navigation starts.
      if (event.target.closest(".menu") || event.target.closest(".topbar nav")) return;
      setMobileMenu(false);
    };

    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [mobileMenu]);

  const handleNavClick = (event, targetId) => {
    event.preventDefault();

    const target = document.getElementById(targetId);
    setMobileMenu(false);

    if (!target) return;

    // Close the dropdown first, then scroll with sticky-header clearance.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const headerHeight = document.querySelector(".topbar")?.offsetHeight || 70;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        window.history.replaceState(null, "", `#${targetId}`);
      });
    });
  };

  return (
    <div className={`site ${lightsOn ? "lights-on" : "lights-off"} env-${environment}`}>
      {toast && <div className="toast">{toast}</div>}

      <header className="topbar">
        <a href="#home" className="brand">
          <span className="brand-mark">⬡</span>
          <span><strong>DRIVE MODS</strong><small>CUSTOMIZE BEYOND LIMITS</small></span>
        </a>
        <nav className={mobileMenu ? "open" : ""}>
          <a href="#home" onClick={(e) => handleNavClick(e, "home")}>HOME</a>
          <a href="#customize" onClick={(e) => handleNavClick(e, "customize")}>CUSTOMIZE</a>
          <a href="#packages" onClick={(e) => handleNavClick(e, "packages")}>PACKAGES</a>
          <a href="#gallery" onClick={(e) => handleNavClick(e, "gallery")}>GALLERY</a>
          <a href="#services" onClick={(e) => handleNavClick(e, "services")}>SERVICES</a>
          <a href="#about" onClick={(e) => handleNavClick(e, "about")}>ABOUT</a>
          <a href="#contact" onClick={(e) => handleNavClick(e, "contact")}>CONTACT</a>
        </nav>
        <div className="nav-actions">
          <button className={`menu ${mobileMenu ? "active" : ""}`} onClick={() => setMobileMenu(v => !v)} aria-label="Menu" aria-expanded={mobileMenu}><i/><i/><i/></button>
        </div>
      </header>

      <main>
        <section className={`hero ${mobileCustomizerOpen ? "mobile-editing" : ""}`} id="home">
          <div className="hero-copy">
            <small>PERFORMANCE ATELIER // MUMBAI</small>
            <h1>ENGINEERED<br/><span>TO BE DIFFERENT.</span></h1>
            <p>Configure your build inside our interactive performance workshop.</p>
            <a href="#customize" className="gold-button">ENTER THE WORKSHOP <b>→</b></a>
          </div>

          <div className="hero-status" aria-hidden="true">
            <div><i className="status-live" /><span><small>CONFIGURATOR</small><strong>LIVE</strong></span></div>
            <div><span><small>RENDER</small><strong>REAL-TIME 3D</strong></span></div>
            <div><span><small>CONTROL</small><strong>DRAG / ZOOM</strong></span></div>
          </div>

          <div className="hero-corner hero-corner-tl" aria-hidden="true" />
          <div className="hero-corner hero-corner-br" aria-hidden="true" />

          {/* MOBILE: direct left-side entry to the configurator */}
          <button
            type="button"
            className={`mobile-side-customize ${mobileCustomizerOpen ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileCustomizerOpen(true);
            }}
            aria-label="Open car customizer"
            aria-expanded={mobileCustomizerOpen}
            aria-controls="mobile-customizer"
          >
            <span className="mobile-side-customize-icon">⚙</span>
            <span className="mobile-side-customize-text">
              <small>EDIT CAR</small>
              <strong>CUSTOMIZE</strong>
            </span>
            <span className="mobile-side-customize-arrow">›</span>
          </button>
<div
            className={`car-stage ${dragging ? "dragging" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onWheel={e => setZoom(z => THREE.MathUtils.clamp(z + (e.deltaY > 0 ? -.04 : .04), 0, 1))}
          >
            <Canvas
              shadows
              dpr={[1, 1.65]}
              camera={{ position:[6,1.9,7.1], fov:34, near:.1, far:100 }}
              gl={{
                antialias:true,
                alpha:true,
                powerPreference:"high-performance",
              }}
              onCreated={({gl}) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 0.78;
                gl.outputColorSpace = THREE.SRGBColorSpace;
                gl.shadowMap.enabled = true;
                gl.shadowMap.type = THREE.PCFSoftShadowMap;
              }}
            >
              <PerformanceController lightsOn={lightsOn} />
              <StudioScene
                rotation={rotation} autoRotate={autoRotate && view === "360"} lightsOn={lightsOn}
                paintTone={paintTone} customPaint={customPaint} finish={finish} rim={rim}
            customRimColor={customRimColor}
                caliper={caliper} customCaliperColor={customCaliperColor} tint={tint} glassColor={glassColor} carbon={carbon} aero={aero} stance={stance}
                steering={steering} wheelSpin={wheelSpin} before={before} view={view} zoom={zoom}
              
                lightColor={lightColor}
                lightIntensity={lightIntensity}
                paintGloss={paintGloss}
                metallicBoost={metallicBoost}
                rimScale={rimScale}
                caliperGloss={caliperGloss}
                carbonFinish={carbonFinish}
                beforeMode={beforeMode}
                mobileCustomizerOpen={mobileCustomizerOpen}
                openParts={openParts}
                interiorSettings={interiorSettings}
                customInteriorColors={customInteriorColors}
                />
            </Canvas>
          </div>

          {/* Direct garage controls: these are vehicle actions, not customization options. */}
          <div className="garage-action-dock" aria-label="Vehicle opening controls">
            <button className={(openParts.frontL && openParts.frontR && openParts.rearL && openParts.rearR) ? "active" : ""} onClick={() => {
              const allOpen = openParts.frontL && openParts.frontR && openParts.rearL && openParts.rearR;
              setOpenParts(p => ({...p, frontL:!allOpen, frontR:!allOpen, rearL:!allOpen, rearR:!allOpen}));
            }}><i>↔</i><span>DOORS</span></button>
            <button className={openParts.frontL ? "active" : ""} onClick={() => setOpenParts(p => ({...p,frontL:!p.frontL}))}><i>↗</i><span>FL DOOR</span></button>
            <button className={openParts.frontR ? "active" : ""} onClick={() => setOpenParts(p => ({...p,frontR:!p.frontR}))}><i>↖</i><span>FR DOOR</span></button>
            <button className={openParts.rearL ? "active" : ""} onClick={() => setOpenParts(p => ({...p,rearL:!p.rearL}))}><i>↗</i><span>RL DOOR</span></button>
            <button className={openParts.rearR ? "active" : ""} onClick={() => setOpenParts(p => ({...p,rearR:!p.rearR}))}><i>↖</i><span>RR DOOR</span></button>
            <button className={openParts.hood ? "active" : ""} onClick={() => setOpenParts(p => ({...p,hood:!p.hood}))}><i>⌃</i><span>BONNET</span></button>
            <button className={openParts.trunk ? "active" : ""} onClick={() => setOpenParts(p => ({...p,trunk:!p.trunk}))}><i>⌃</i><span>BOOT</span></button>
            <button className={wheelSpin ? "active" : ""} onClick={() => setWheelSpin(v => !v)}><i>◉</i><span>{wheelSpin ? "STOP WHEELS" : "SPIN WHEELS"}</span></button>
          </div>

          <div className="interaction-hint"><span>DRAG TO ROTATE</span><i/><span>SCROLL TO ZOOM</span><i/><span>LIVE WORKSHOP PREVIEW</span></div>

          <div className="compare-reset">
            <button className={before ? "active" : ""} onClick={() => setBefore(v => !v)}>BEFORE / AFTER <span>◐</span></button>
          </div>

          <aside className="desktop-customizer">
            <div className="customizer-header">
              <div>
                <small>DRIVE MODS // CONFIGURATOR</small>
                <strong>CUSTOMIZE YOUR BUILD</strong>
              </div>
              <span className="customizer-live"><i /> LIVE 3D</span>
            </div>

            <div className="customizer-guide">
              <div className="customizer-guide-title">
                <span>STEP 1</span>
                <div><strong>What would you like to change?</strong><small>Choose one area. Changes appear on the car instantly.</small></div>
              </div>
              <div className="customizer-category-list">
                {CATEGORIES.map(([id,icon]) => {
                  const info = CATEGORY_INFO[id];
                  return (
                    <button key={id} className={activeCategory === id ? "active" : ""} onClick={() => selectCategory(id)}>
                      <span className="category-accent" style={{ background: info.accent }} />
                      <i>{icon}</i>
                      <span className="category-copy"><strong>{info.title}</strong><small>{info.description}</small></span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="customizer-choice-head">
              <span>STEP 2</span>
              <div><strong>{CATEGORY_INFO[activeCategory].title}</strong><small>Tap an option below to preview it live.</small></div>
            </div>

            <div className="desktop-control-area">
              <ModPanel
                active={activeCategory}
                paintTone={paintTone} setPaintTone={setPaintTone}
                customPaint={customPaint} setCustomPaint={setCustomPaint}
                finish={finish} setFinish={setFinish}
                rim={rim} setRim={setRim}
                customRimColor={customRimColor} setCustomRimColor={setCustomRimColor}
                caliper={caliper} setCaliper={setCaliper}
                customCaliperColor={customCaliperColor} setCustomCaliperColor={setCustomCaliperColor}
                interiorSettings={interiorSettings} setInteriorSettings={setInteriorSettings}
                customInteriorColors={customInteriorColors} setCustomInteriorColors={setCustomInteriorColors}
                tint={tint} setTint={setTint} glassColor={glassColor} setGlassColor={setGlassColor}
                carbon={carbon} setCarbon={setCarbon}
                aero={aero} setAero={setAero}
                stance={stance} setStance={setStance}
                steering={steering} setSteering={setSteering}
                lightsOn={lightsOn} setLightsOn={setLightsOn}
                wheelSpin={wheelSpin} setWheelSpin={setWheelSpin}
                lightColor={lightColor} setLightColor={setLightColor}
                    lightIntensity={lightIntensity} setLightIntensity={setLightIntensity}
                    paintGloss={paintGloss} setPaintGloss={setPaintGloss}
                    metallicBoost={metallicBoost} setMetallicBoost={setMetallicBoost}
                    rimScale={rimScale} setRimScale={setRimScale}
                    caliperGloss={caliperGloss} setCaliperGloss={setCaliperGloss}
                    carbonFinish={carbonFinish} setCarbonFinish={setCarbonFinish}
                    demoMode={demoMode} setDemoMode={setDemoMode}
                    beforeMode={beforeMode} setBeforeMode={setBeforeMode}
                    activePreset={activePreset}
                    applyBuildPreset={applyBuildPreset}
                    applyAeroPreset={applyAeroPreset}
                    openParts={openParts} setOpenParts={setOpenParts}
                    activate={activate}
              />
            </div>

          </aside>

          <button
            className={`mobile-customize-trigger ${mobileCustomizerOpen ? "is-open" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileCustomizerOpen(v => !v);
            }}
            aria-expanded={mobileCustomizerOpen}
            aria-controls="mobile-customizer"
          >
            <span className="mobile-trigger-icon">⚙</span>
            <span>
              <small>LIVE 3D CONFIGURATOR</small>
              <strong>{mobileCustomizerOpen ? "CLOSE CUSTOMIZER" : "CUSTOMIZE BUILD"}</strong>
            </span>
            <b>{mobileCustomizerOpen ? "×" : "⌃"}</b>
          </button>

          {typeof document !== "undefined" &&
            createPortal(
              <>
                <div
                  className={`mobile-customizer-backdrop ${mobileCustomizerOpen ? "open" : ""}`}
                  onClick={() => setMobileCustomizerOpen(false)}
                  aria-hidden="true"
                />

                <aside
                  className={`mobile-customizer ${mobileCustomizerOpen ? "open" : ""}`}
                  id="mobile-customizer"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Car customizer"
                >
            <div className="mobile-drawer-handle" />

            <div className="mobile-customizer-head">
              <div>
                <small>YOUR CAR // LIVE PREVIEW</small>
                <strong>WHAT DO YOU WANT TO CHANGE?</strong>
              </div>
              <button
                onClick={() => setMobileCustomizerOpen(false)}
                aria-label="Close customizer"
              >
                ×
              </button>
            </div>

            <div className="mobile-category-swipe-wrap">
              <span className="mobile-category-arrow mobile-category-arrow-left" aria-hidden="true">‹</span>
            <div className="mobile-category-tabs">
              {CATEGORIES.map(([id,icon,label]) => (
                <button
                  key={id}
                  className={activeCategory === id ? "active" : ""}
                  onClick={() => selectCategory(id)}
                >
                  <i>{icon}</i>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="mobile-active-category">
              <span>NOW EDITING</span>
              <strong>{CATEGORY_INFO[activeCategory].title}</strong>
              <i>CHANGES APPEAR LIVE</i>
            </div>

              <span className="mobile-category-arrow mobile-category-arrow-right" aria-hidden="true">›</span>
            </div>

            <div className="mobile-control-area">
              <ModPanel
                active={activeCategory}
                paintTone={paintTone} setPaintTone={setPaintTone}
                customPaint={customPaint} setCustomPaint={setCustomPaint}
                finish={finish} setFinish={setFinish}
                rim={rim} setRim={setRim}
                customRimColor={customRimColor} setCustomRimColor={setCustomRimColor}
                caliper={caliper} setCaliper={setCaliper}
                customCaliperColor={customCaliperColor} setCustomCaliperColor={setCustomCaliperColor}
                interiorSettings={interiorSettings} setInteriorSettings={setInteriorSettings}
                customInteriorColors={customInteriorColors} setCustomInteriorColors={setCustomInteriorColors}
                tint={tint} setTint={setTint} glassColor={glassColor} setGlassColor={setGlassColor}
                carbon={carbon} setCarbon={setCarbon}
                aero={aero} setAero={setAero}
                stance={stance} setStance={setStance}
                steering={steering} setSteering={setSteering}
                lightsOn={lightsOn} setLightsOn={setLightsOn}
                wheelSpin={wheelSpin} setWheelSpin={setWheelSpin}
                lightColor={lightColor} setLightColor={setLightColor}
                    lightIntensity={lightIntensity} setLightIntensity={setLightIntensity}
                    paintGloss={paintGloss} setPaintGloss={setPaintGloss}
                    metallicBoost={metallicBoost} setMetallicBoost={setMetallicBoost}
                    rimScale={rimScale} setRimScale={setRimScale}
                    caliperGloss={caliperGloss} setCaliperGloss={setCaliperGloss}
                    carbonFinish={carbonFinish} setCarbonFinish={setCarbonFinish}
                    demoMode={demoMode} setDemoMode={setDemoMode}
                    beforeMode={beforeMode} setBeforeMode={setBeforeMode}
                    activePreset={activePreset}
                    applyBuildPreset={applyBuildPreset}
                    applyAeroPreset={applyAeroPreset}
                    openParts={openParts} setOpenParts={setOpenParts}
                    activate={activate}
              />
            </div>


                </aside>
              </>,
              document.body
            )
          }

        </section>

        <section className="configurator configurator-after-hero" id="customize">
          <div className="feature-strip">
            <div><b>⚙</b><span><strong>300+</strong><small>PERFORMANCE PARTS</small></span></div>
            <div><b>▱</b><span><strong>50+</strong><small>PREMIUM BRANDS</small></span></div>
            <div className="passion">— DRIVEN BY PASSION —</div>
            <div><b>◎</b><span><strong>CUSTOM BUILDS</strong><small>VISUAL FIRST</small></span></div>
            <div><b>◉</b><span><strong>EXPERT SUPPORT</strong><small>BUILD GUIDANCE</small></span></div>
            <a href="#contact">GET A QUOTE →</a>
          </div>
        </section>


        <section className="brand-marquee" aria-label="Drive Mods capabilities">
          <div className="marquee-track">
            {[0,1].map(copy => (
              <div className="marquee-group" key={copy} aria-hidden={copy === 1}>
                <span>FORGED WHEELS</span><i>✦</i><span>PRECISION FITMENT</span><i>✦</i>
                <span>CARBON AERO</span><i>✦</i><span>PERFORMANCE BRAKES</span><i>✦</i>
                <span>COILOVER SETUP</span><i>✦</i><span>PREMIUM FINISH</span><i>✦</i>
              </div>
            ))}
          </div>
        </section>

        <section className="stats-deck section scroll-reveal" data-scroll-reveal>
          <div className="stats-copy">
            <small>DRIVE MODS // PERFORMANCE LAB</small>
            <h2>DESIGNED TO FEEL<br/><span>ONE OF ONE.</span></h2>
            <p>A premium digital-first workshop experience where customers can understand the direction of a build before committing to parts.</p>
          </div>
          <div className="stats-grid">
            {STATS.map(([value,label], index) => (
              <article key={label}>
                <span>0{index + 1}</span>
                <strong>{value}</strong>
                <small>{label}</small>
                <i />
              </article>
            ))}
          </div>
        </section>

        <section className="capabilities section scroll-reveal" data-scroll-reveal>
          <div className="section-head">
            <div><small>THE MODIFICATION EXPERIENCE</small><h2>MORE THAN <span>A PARTS LIST.</span></h2></div>
            <p className="section-lead">Every choice is presented as part of one connected build — visual direction, fitment, performance and finish.</p>
          </div>
          <div className="capability-grid">
            {WORKSHOP_CAPABILITIES.map(([num,title,tag,text,icon]) => (
              <article className="premium-card" key={num}>
                <div className="card-scan" />
                <div className="premium-card-top"><span>{num}</span><b>{tag}</b></div>
                <div className="premium-icon"><i>{icon}</i><span /></div>
                <h3>{title}</h3>
                <p>{text}</p>
                <a href="#customize">EXPLORE SYSTEM <b>↗</b></a>
              </article>
            ))}
          </div>
        </section>

        <section className="upgrades section scroll-reveal" data-scroll-reveal id="gallery">
          <div className="section-head">
            <div><small>FEATURED MODIFICATIONS</small><h2>POPULAR <span>UPGRADES</span></h2></div>
            <a href="#customize">VIEW ALL MODS →</a>
          </div>
          <div className="upgrade-grid">
            {UPGRADES.map(([n,title,tag,price,icon]) => (
              <article key={n}>
                <div className="upgrade-head"><b>{n}</b><span><strong>{title}</strong><small>{tag}</small></span></div>
                <div className="upgrade-visual"><i>{icon}</i><span className="tech-ring"/></div>
                <p>FROM <strong>{price}</strong></p>
                <button onClick={() => { selectCategory(title.includes("WHEEL") ? "wheels" : title.includes("BRAKE") ? "brakes" : title.includes("AERO") ? "aero" : title.includes("COIL") ? "suspension" : "lights"); document.querySelector("#customize")?.scrollIntoView({behavior:"smooth"}); }}>CUSTOMIZE →</button>
              </article>
            ))}
          </div>
        </section>

        <section className="ideas section">
          <div className="ideas-copy">
            <h2>TURN IDEAS<br/><span>INTO REALITY</span></h2>
            <p>Explore real builds, custom styles and inspiration from our community.</p>
            <a href="#gallery" className="gold-button">VIEW GALLERY →</a>
          </div>
          <div className="gallery-mosaic premium-gallery-preview">
            {GALLERY_IMAGES.slice(0,4).map((item, index) => (
              <figure key={item.src} className={index === 0 ? "gallery-main gallery-image-card" : "gallery-detail gallery-image-card"}>
                <img
                  src={item.src}
                  alt={item.title}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="gallery-placeholder"><span>0{index + 1}</span><b>ADD YOUR BUILD IMAGE</b></div>
                <figcaption><small>{item.tag}</small><strong>{item.title}</strong><i>↗</i></figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="build-gallery section scroll-reveal" data-scroll-reveal id="build-gallery">
          <div className="section-head">
            <div><small>SELECTED PROJECTS</small><h2>BUILT TO BE <span>REMEMBERED.</span></h2></div>
            <p className="section-lead">Replace these six image files later with your own workshop photography. The layout is already responsive and animated.</p>
          </div>
          <div className="build-gallery-grid">
            {GALLERY_IMAGES.map((item, index) => (
              <article key={item.src} className={`build-shot shot-${index + 1}`}>
                <img src={item.src} alt={item.title} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div className="shot-placeholder"><b>0{index + 1}</b><span>YOUR PROJECT IMAGE</span></div>
                <div className="shot-overlay">
                  <small>{item.tag}</small>
                  <strong>{item.title}</strong>
                  <span>VIEW BUILD ↗</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="built section scroll-reveal" data-scroll-reveal id="about">
          <div className="built-copy">
            <small>PERFORMANCE · STYLE · PRECISION</small>
            <h2>BUILT <span>DIFFERENT</span></h2>
            <p>High quality components. Expert installation. A team that lives and breathes performance.</p>
          </div>
          <div className="built-points">
            <div><i>⚙</i><strong>GENUINE PARTS</strong><small>Trusted brands only</small></div>
            <div><i>⌁</i><strong>EXPERT FITMENT</strong><small>Vehicle-specific setup</small></div>
            <div><i>▣</i><strong>NATIONWIDE SUPPORT</strong><small>We’ve got you covered</small></div>
          </div>
        </section>

        <section className="craft-banner section scroll-reveal" data-scroll-reveal>
          <div className="craft-number">01</div>
          <div className="craft-copy">
            <small>THE DRIVE MODS STANDARD</small>
            <h2>DETAILS ARE NOT<br/><span>THE DETAIL.</span></h2>
            <p>The complete build is the detail. Fitment, finish, stance and proportion have to work together.</p>
          </div>
          <div className="craft-specs">
            <div><small>FITMENT</small><strong>MEASURED</strong><span>Wheel / tyre / clearance</span></div>
            <div><small>FINISH</small><strong>COHESIVE</strong><span>Paint / carbon / tint</span></div>
            <div><small>SETUP</small><strong>PURPOSEFUL</strong><span>Street / show / performance</span></div>
          </div>
        </section>

        <section className="services section scroll-reveal" data-scroll-reveal id="services">
          <div className="section-head">
            <div><small>WORKSHOP SYSTEMS</small><h2>ONE GARAGE. <span>EVERY UPGRADE.</span></h2></div>
          </div>
          <div className="service-grid">
            {SERVICES.map(([title,text],i) => <article key={title}><b>0{i+1}</b><h3>{title}</h3><p>{text}</p><span>EXPLORE →</span></article>)}
          </div>
        </section>

        <section className="packages section" id="packages">
          <div className="section-head">
            <div><small>BUILD STARTERS</small><h2>CHOOSE YOUR <span>DIRECTION.</span></h2></div>
          </div>
          <div className="package-grid">
            {PACKAGES.map(([name,tag,price,items],i) => (
              <article key={name} className={i===1 ? "featured" : ""}>
                <small>{tag}</small><h3>{name}</h3><strong>FROM {price}</strong>
                {items.map(x => <p key={x}>✓ {x}</p>)}
                <a href="#contact">PLAN THIS BUILD →</a>
              </article>
            ))}
          </div>
        </section>


        <section className="journey section scroll-reveal" data-scroll-reveal>
          <div className="section-head">
            <div><small>FROM SCREEN TO STREET</small><h2>YOUR BUILD <span>JOURNEY.</span></h2></div>
            <p className="section-lead">A clear process keeps an exciting modification project easy to understand.</p>
          </div>
          <div className="journey-grid">
            {BUILD_STEPS.map(([num,title,text], index) => (
              <article key={num}>
                <div className="journey-node"><span>{num}</span><i /></div>
                <small>PHASE {num}</small>
                <h3>{title}</h3>
                <p>{text}</p>
                {index < BUILD_STEPS.length - 1 && <b className="journey-arrow">→</b>}
              </article>
            ))}
          </div>
        </section>

        <section className="quote-banner section scroll-reveal" data-scroll-reveal>
          <div className="quote-glow" />
          <div>
            <small>BUILD CONSULTATION</small>
            <h2>HAVE A CAR.<br/><span>HAVE A VISION?</span></h2>
          </div>
          <p>Send the garage your current car and the look you want. Use your live configuration as the starting point for the conversation.</p>
          <a className="gold-button" href="#contact">START YOUR BUILD <b>→</b></a>
        </section>

        <section className="faq section scroll-reveal" data-scroll-reveal>
          <div className="section-head"><div><small>CLIENT QUESTIONS</small><h2>BEFORE YOU <span>MODIFY.</span></h2></div></div>
          <div className="faq-list">
            {(showAllFaqs ? FAQS : FAQS.slice(0, 5)).map(([q,a],i) => (
              <button
                key={q}
                className={faqOpen===i ? "open" : ""}
                onClick={() => setFaqOpen(faqOpen===i ? -1 : i)}
              >
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span><strong>{q}</strong><p>{a}</p></span>
                <i>{faqOpen===i ? "−" : "+"}</i>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="faq-load-more"
            onClick={() => {
              setShowAllFaqs(v => !v);
              setFaqOpen(-1);
            }}
          >
            {showAllFaqs ? "SHOW LESS" : `LOAD MORE QUESTIONS (${FAQS.length - 5})`}
            <span>{showAllFaqs ? "↑" : "↓"}</span>
          </button>
        </section>

        <section className="contact section" id="contact">
          <small>START A BUILD</small>
          <h2>YOUR CAR.<br/><span>YOUR RULES.</span></h2>
          <p>Send us your vehicle, your goals and your budget. We’ll help turn the configurator concept into a practical modification plan.</p>
          <a className="gold-button" href="https://wa.me/919876543210?text=Hi%20DRIVE%20MODS%2C%20I%20want%20to%20plan%20a%20custom%20build." target="_blank" rel="noreferrer">TALK TO THE GARAGE →</a>
        </section>
      </main>

      <a
        className="floating-whatsapp"
        href="https://wa.me/919876543210?text=Hi%20DRIVE%20MODS%2C%20I%20want%20to%20plan%20a%20custom%20build."
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Drive Mods on WhatsApp"
      >
        <span className="whatsapp-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" role="img">
            <path fill="currentColor" d="M16.02 3.2A12.7 12.7 0 0 0 5.28 22.7L3.6 28.8l6.25-1.64A12.72 12.72 0 1 0 16.02 3.2Zm0 22.96a10.2 10.2 0 0 1-5.2-1.43l-.37-.22-3.7.97.99-3.61-.24-.37a10.22 10.22 0 1 1 8.52 4.66Zm5.6-7.66c-.3-.15-1.8-.89-2.08-.99-.28-.1-.48-.15-.69.15-.2.31-.79.99-.97 1.19-.18.2-.36.23-.66.08-.31-.15-1.3-.48-2.47-1.52a9.24 9.24 0 0 1-1.71-2.13c-.18-.31-.02-.47.13-.62.14-.14.31-.36.46-.54.15-.18.2-.31.31-.51.1-.21.05-.39-.03-.54-.08-.15-.69-1.66-.94-2.27-.25-.6-.5-.52-.69-.53h-.58c-.2 0-.53.08-.81.39-.28.3-1.07 1.04-1.07 2.55s1.1 2.96 1.25 3.17c.15.2 2.16 3.3 5.23 4.63.73.31 1.3.5 1.75.64.74.23 1.4.2 1.93.12.59-.09 1.8-.74 2.06-1.45.25-.72.25-1.33.18-1.46-.08-.13-.28-.2-.59-.36Z"/>
          </svg>
        </span>
        <div><small>BUILD SUPPORT</small><strong>WHATSAPP US</strong></div>
      </a>

      <footer>
        <div className="brand"><span className="brand-mark">⬡</span><span><strong>DRIVE MODS</strong><small>CUSTOMIZE BEYOND LIMITS</small></span></div>
        <span>INTERACTIVE 3D AUTOMOTIVE EXPERIENCE</span><span>© 2026</span>
      </footer>
    </div>
  );
}
