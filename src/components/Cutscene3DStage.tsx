import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { CompetitionId, CutscenePhase, Team } from '../game/types';

export type Cutscene3DMode = 'intro' | 'tunnel' | 'goal' | 'trophy';

export interface Cutscene3DStageProps {
  mode: Cutscene3DMode;
  phase?: CutscenePhase | null;
  competitionId: CompetitionId;
  homeTeam: Team;
  awayTeam: Team;
  championTeam?: Team | null;
  goalScoringTeam?: Team | null;
  progress?: number;
}

// Pre-allocated math scratch objects at module scope (Zero GC in render loop)
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _camCurrentLook = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

function createTurfCanvasTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#166534';
      ctx.fillRect(0, i * 32, 256, 32);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 248);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createTunnelStripeTexture(primaryHex: string, accentHex: string, maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = primaryHex;
    ctx.fillRect(0, 12, 128, 10);
    ctx.fillRect(0, 106, 128, 10);
    ctx.fillStyle = accentHex;
    ctx.fillRect(0, 58, 128, 12);
    for (let x = 0; x < 128; x += 16) {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(x, 0, 4, 128);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowMesh(radius = 0.55): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 18);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x020617,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.015;
  return mesh;
}

// Composite 3-12 part Footballer 3D model pivoted at bottom-center (y = 0)
function buildFootballerGroup(team: Team, isCaptain = false): {
  group: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
} {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.72, metalness: 0.02 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.05 });
  const jerseyMat = new THREE.MeshStandardMaterial({ color: team.primaryColor, roughness: 0.55, metalness: 0.06 });
  const shortsMat = new THREE.MeshStandardMaterial({ color: team.secondaryColor, roughness: 0.65, metalness: 0.05 });
  const trimMat = new THREE.MeshStandardMaterial({ color: team.trimColor || '#facc15', roughness: 0.35, metalness: 0.2 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.15 });

  // Ground contact shadow
  group.add(createContactShadowMesh(0.42));

  // Legs + Boots (parts 1-4)
  const legGeo = new THREE.BoxGeometry(0.18, 0.56, 0.18);
  const bootGeo = new THREE.BoxGeometry(0.2, 0.14, 0.28);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.15, 0.62, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, skinMat);
  leftLegMesh.position.y = -0.28;
  leftLegMesh.castShadow = true;
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(0, -0.55, 0.04);
  leftBoot.castShadow = true;
  leftLegPivot.add(leftLegMesh, leftBoot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.15, 0.62, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, skinMat);
  rightLegMesh.position.y = -0.28;
  rightLegMesh.castShadow = true;
  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0, -0.55, 0.04);
  rightBoot.castShadow = true;
  rightLegPivot.add(rightLegMesh, rightBoot);

  // Shorts (part 5)
  const shorts = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.32, 0.34), shortsMat);
  shorts.position.y = 0.72;
  shorts.castShadow = true;

  // Torso + vertical accent stripe (parts 6-7)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.62, 0.36), jerseyMat);
  torso.position.y = 1.16;
  torso.castShadow = true;

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.63, 0.38), trimMat);
  stripe.position.y = 1.16;

  // Arms (parts 8-9)
  const armGeo = new THREE.BoxGeometry(0.16, 0.5, 0.16);
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.39, 1.4, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, jerseyMat);
  leftArmMesh.position.y = -0.22;
  leftArmMesh.castShadow = true;
  leftArmPivot.add(leftArmMesh);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.39, 1.4, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, jerseyMat);
  rightArmMesh.position.y = -0.22;
  rightArmMesh.castShadow = true;
  rightArmPivot.add(rightArmMesh);

  // Head + Hair (parts 10-11)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), skinMat);
  head.position.y = 1.69;
  head.castShadow = true;

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.15, 0.43), hairMat);
  hair.position.y = 1.91;

  group.add(leftLegPivot, rightLegPivot, shorts, torso, stripe, leftArmPivot, rightArmPivot, head, hair);

  if (isCaptain) {
    const armband = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.18), trimMat);
    armband.position.y = -0.15;
    leftArmPivot.add(armband);
  }

  return {
    group,
    leftArm: leftArmPivot,
    rightArm: rightArmPivot,
    leftLeg: leftLegPivot,
    rightLeg: rightLegPivot,
  };
}

// Composite 6-part Championship Trophy pivoted at bottom-center (y = 0)
function buildTrophyGroup(): THREE.Group {
  const group = new THREE.Group();

  const marbleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72, metalness: 0.15 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.18, metalness: 0.92 });
  const brightGoldMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.14, metalness: 0.95 });

  group.add(createContactShadowMesh(0.75));

  // Beveled stone plinth base
  const baseLower = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.24, 24), marbleMat);
  baseLower.position.y = 0.12;
  baseLower.castShadow = true;

  const basePlaque = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.75), goldMat);
  basePlaque.position.y = 0.32;
  basePlaque.castShadow = true;

  // Lathe chalice body & stem
  const lathePoints = [
    new THREE.Vector2(0.0, 0.4),
    new THREE.Vector2(0.36, 0.4),
    new THREE.Vector2(0.2, 0.65),
    new THREE.Vector2(0.16, 1.05),
    new THREE.Vector2(0.58, 1.48),
    new THREE.Vector2(0.74, 2.02),
    new THREE.Vector2(0.64, 2.02),
    new THREE.Vector2(0.45, 1.5),
    new THREE.Vector2(0.0, 1.32),
  ];
  const cupGeo = new THREE.LatheGeometry(lathePoints, 28);
  const cupMesh = new THREE.Mesh(cupGeo, goldMat);
  cupMesh.castShadow = true;

  // Rim ring
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.055, 12, 28), brightGoldMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 2.02;

  // Twin TubeGeometry handles
  const leftCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.62, 1.92, 0),
    new THREE.Vector3(-1.02, 1.72, 0),
    new THREE.Vector3(-0.92, 1.24, 0),
    new THREE.Vector3(-0.34, 1.15, 0),
  ]);
  const rightCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.62, 1.92, 0),
    new THREE.Vector3(1.02, 1.72, 0),
    new THREE.Vector3(0.92, 1.24, 0),
    new THREE.Vector3(0.34, 1.15, 0),
  ]);
  const leftHandle = new THREE.Mesh(new THREE.TubeGeometry(leftCurve, 18, 0.06, 8, false), brightGoldMat);
  const rightHandle = new THREE.Mesh(new THREE.TubeGeometry(rightCurve, 18, 0.06, 8, false), brightGoldMat);
  leftHandle.castShadow = true;
  rightHandle.castShadow = true;

  // Top star finisher
  const topOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), brightGoldMat);
  topOrb.position.y = 2.24;

  group.add(baseLower, basePlaque, cupMesh, rim, leftHandle, rightHandle, topOrb);
  return group;
}

// Composite 4-part Soccer Ball pivoted at center (radius r)
function buildSoccerBallGroup(r = 0.32): THREE.Group {
  const group = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.05 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.1 });
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.4 });

  const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), whiteMat);
  sphere.castShadow = true;

  const seamRingA = new THREE.Mesh(new THREE.TorusGeometry(r * 0.99, r * 0.06, 6, 18), darkMat);
  const seamRingB = new THREE.Mesh(new THREE.TorusGeometry(r * 0.99, r * 0.055, 6, 18), darkMat);
  seamRingB.rotation.y = Math.PI / 2;
  const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.005, r * 0.045, 6, 18), ringMat);
  band.rotation.x = Math.PI / 2;

  group.add(sphere, seamRingA, seamRingB, band);
  return group;
}

export const Cutscene3DStage: React.FC<Cutscene3DStageProps> = ({
  mode,
  phase,
  competitionId,
  homeTeam,
  awayTeam,
  championTeam,
  goalScoringTeam,
  progress = 0,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const latestPropsRef = useRef({
    mode,
    phase,
    competitionId,
    homeTeam,
    awayTeam,
    championTeam,
    goalScoringTeam,
    progress,
  });
  latestPropsRef.current = {
    mode,
    phase,
    competitionId,
    homeTeam,
    awayTeam,
    championTeam,
    goalScoringTeam,
    progress,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isTrophy = mode === 'trophy';
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: isTrophy,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (isTrophy) {
      renderer.setClearColor(0x000000, 0);
    }

    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const compAccentHex =
      competitionId === 'king_cup'
        ? '#facc15'
        : competitionId === 'super_cup'
        ? '#ef4444'
        : competitionId === 'anime_cup'
        ? '#a855f7'
        : '#22c55e';

    const bgHex = isTrophy ? null : mode === 'tunnel' ? '#050816' : '#091124';
    if (bgHex) {
      scene.background = new THREE.Color(bgHex);
      scene.fog = new THREE.FogExp2(bgHex, mode === 'tunnel' ? 0.042 : 0.018);
    }

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 160);
    if (mode === 'tunnel') {
      camera.position.set(0, 1.65, 8.2);
      _camCurrentLook.set(0, 1.35, -1.0);
    } else if (mode === 'intro') {
      camera.position.set(0, 4.2, 9.5);
      _camCurrentLook.set(0, 1.4, 0);
    } else if (mode === 'goal') {
      camera.position.set(0, 2.35, 5.4);
      _camCurrentLook.set(0, 1.2, 0.2);
    } else {
      camera.position.set(0, 2.75, 6.4);
      _camCurrentLook.set(0, 1.55, 0);
    }
    camera.lookAt(_camCurrentLook);

    // 3-Point Warm Key + Cool Hemi Fill + Rim Lighting
    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    keyLight.position.set(7, 12, 9);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 34;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(compAccentHex, 1.15);
    rimLight.position.set(-8, 6, -9);
    scene.add(rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const disposables: { dispose: () => void }[] = [envTarget, envTarget.texture];
    const animatedRigs: {
      rig: ReturnType<typeof buildFootballerGroup>;
      baseX: number;
      baseZ: number;
      phaseOffset: number;
    }[] = [];

    let trophyObj: THREE.Group | null = null;
    let heroBall: THREE.Group | null = null;
    let confettiMesh: THREE.InstancedMesh | null = null;
    let confettiSeeds: { x: number; y: number; z: number; vy: number; spin: number }[] = [];

    if (!isTrophy) {
      // Extended grass arena ground
      const turfTex = createTurfCanvasTexture(maxAnisotropy);
      disposables.push(turfTex);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: turfTex,
        roughness: 0.88,
        metalness: 0.02,
      });
      const groundGeo = new THREE.PlaneGeometry(84, 84);
      groundGeo.rotateX(-Math.PI / 2);
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.receiveShadow = true;
      scene.add(ground);
      disposables.push(groundGeo, groundMat);
    }

    if (mode === 'tunnel') {
      // 3D Stadium Tunnel Ribs leading out onto floodlit pitch
      const tunnelMat = new THREE.MeshStandardMaterial({
        map: createTunnelStripeTexture(homeTeam.primaryColor, compAccentHex, maxAnisotropy),
        roughness: 0.52,
        metalness: 0.25,
      });
      if (tunnelMat.map) disposables.push(tunnelMat.map);
      disposables.push(tunnelMat);

      const floorGeo = new THREE.BoxGeometry(5.6, 0.08, 22);
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72, metalness: 0.1 });
      const tunnelFloor = new THREE.Mesh(floorGeo, floorMat);
      tunnelFloor.position.set(0, 0.04, 1);
      tunnelFloor.receiveShadow = true;
      scene.add(tunnelFloor);
      disposables.push(floorGeo, floorMat);

      const pillarGeo = new THREE.BoxGeometry(0.45, 4.8, 1.15);
      const lintelGeo = new THREE.BoxGeometry(6.4, 0.45, 1.15);
      const stripGeo = new THREE.BoxGeometry(5.5, 0.12, 0.18);
      const stripMat = new THREE.MeshStandardMaterial({
        color: compAccentHex,
        emissive: compAccentHex,
        emissiveIntensity: 1.5,
        roughness: 0.3,
      });
      disposables.push(pillarGeo, lintelGeo, stripGeo, stripMat);

      for (let i = 0; i < 8; i++) {
        const z = -9 + i * 2.4;
        const arch = new THREE.Group();
        const lp = new THREE.Mesh(pillarGeo, tunnelMat);
        lp.position.set(-2.95, 2.4, z);
        const rp = new THREE.Mesh(pillarGeo, tunnelMat);
        rp.position.set(2.95, 2.4, z);
        const top = new THREE.Mesh(lintelGeo, tunnelMat);
        top.position.set(0, 4.95, z);
        const neon = new THREE.Mesh(stripGeo, stripMat);
        neon.position.set(0, 4.66, z);
        arch.add(lp, rp, top, neon);
        scene.add(arch);
      }

      // Two teams walking out side-by-side toward the camera onto the floodlit pitch
      for (let i = 0; i < 3; i++) {
        const hRig = buildFootballerGroup(homeTeam, i === 0);
        const z = 1.6 - i * 2.3;
        hRig.group.position.set(-1.15, 0.08, z);
        hRig.group.rotation.y = 0;
        scene.add(hRig.group);
        animatedRigs.push({ rig: hRig, baseX: -1.15, baseZ: z, phaseOffset: i * 1.1 });

        const aRig = buildFootballerGroup(awayTeam, i === 0);
        aRig.group.position.set(1.15, 0.08, z);
        aRig.group.rotation.y = 0;
        scene.add(aRig.group);
        animatedRigs.push({ rig: aRig, baseX: 1.15, baseZ: z, phaseOffset: i * 1.1 + 0.5 });
      }
    } else if (mode === 'intro') {
      // 3D Arena Intro Showcase: stands ring + trophy + spinning ball + home vs away captains
      const ringGeo = new THREE.CylinderGeometry(16, 18.5, 4.2, 24, 1, true);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        side: THREE.DoubleSide,
        roughness: 0.78,
        metalness: 0.15,
      });
      const bowl = new THREE.Mesh(ringGeo, ringMat);
      bowl.position.y = 2.1;
      scene.add(bowl);
      disposables.push(ringGeo, ringMat);

      const ledRimGeo = new THREE.TorusGeometry(14.5, 0.28, 8, 36);
      const ledRimMat = new THREE.MeshStandardMaterial({
        color: compAccentHex,
        emissive: compAccentHex,
        emissiveIntensity: 1.25,
        roughness: 0.3,
      });
      const ledRim = new THREE.Mesh(ledRimGeo, ledRimMat);
      ledRim.rotation.x = Math.PI / 2;
      ledRim.position.y = 0.65;
      scene.add(ledRim);
      disposables.push(ledRimGeo, ledRimMat);

      trophyObj = buildTrophyGroup();
      trophyObj.position.set(0, 0.02, 0);
      trophyObj.scale.setScalar(1.25);
      scene.add(trophyObj);

      heroBall = buildSoccerBallGroup(0.45);
      heroBall.position.set(0, 3.25, 0);
      scene.add(heroBall);

      const homeCap = buildFootballerGroup(homeTeam, true);
      homeCap.group.position.set(-2.3, 0, 1.1);
      homeCap.group.rotation.y = 0.45;
      scene.add(homeCap.group);
      animatedRigs.push({ rig: homeCap, baseX: -2.3, baseZ: 1.1, phaseOffset: 0 });

      const awayCap = buildFootballerGroup(awayTeam, true);
      awayCap.group.position.set(2.3, 0, 1.1);
      awayCap.group.rotation.y = -0.45;
      scene.add(awayCap.group);
      animatedRigs.push({ rig: awayCap, baseX: 2.3, baseZ: 1.1, phaseOffset: 1.4 });
    } else if (mode === 'goal') {
      // 3D Goal Celebration Scene: goalposts behind celebrating scoring striker + club-colored lights + confetti
      const scorer = goalScoringTeam ?? homeTeam;
      const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2 });
      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 12);
      const crossbarGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.2, 12);
      crossbarGeo.rotateZ(Math.PI / 2);
      disposables.push(postMat, postGeo, crossbarGeo);

      const goalGroup = new THREE.Group();
      const lPost = new THREE.Mesh(postGeo, postMat);
      lPost.position.set(-3.0, 1.25, -3.2);
      const rPost = new THREE.Mesh(postGeo, postMat);
      rPost.position.set(3.0, 1.25, -3.2);
      const bar = new THREE.Mesh(crossbarGeo, postMat);
      bar.position.set(0, 2.5, -3.2);
      goalGroup.add(lPost, rPost, bar);
      scene.add(goalGroup);

      const scorerRig = buildFootballerGroup(scorer, true);
      scorerRig.group.position.set(0, 0, 0.8);
      scene.add(scorerRig.group);
      animatedRigs.push({ rig: scorerRig, baseX: 0, baseZ: 0.8, phaseOffset: 0 });

      const mateA = buildFootballerGroup(scorer, false);
      mateA.group.position.set(-1.7, 0, -0.2);
      mateA.group.rotation.y = 0.5;
      scene.add(mateA.group);
      animatedRigs.push({ rig: mateA, baseX: -1.7, baseZ: -0.2, phaseOffset: 1.2 });

      const mateB = buildFootballerGroup(scorer, false);
      mateB.group.position.set(1.7, 0, -0.2);
      mateB.group.rotation.y = -0.5;
      scene.add(mateB.group);
      animatedRigs.push({ rig: mateB, baseX: 1.7, baseZ: -0.2, phaseOffset: 2.4 });

      heroBall = buildSoccerBallGroup(0.36);
      heroBall.position.set(0, 1.35, -2.5);
      scene.add(heroBall);

      // Confetti burst in club colors
      const count = 90;
      const cGeo = new THREE.BoxGeometry(0.14, 0.14, 0.04);
      const cMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.2 });
      disposables.push(cGeo, cMat);
      confettiMesh = new THREE.InstancedMesh(cGeo, cMat, count);
      confettiMesh.frustumCulled = false;
      confettiSeeds = [];
      const palette = [scorer.primaryColor, scorer.secondaryColor, scorer.trimColor || '#facc15', '#ffffff'];
      for (let i = 0; i < count; i++) {
        _color.set(palette[i % palette.length]);
        confettiMesh.setColorAt(i, _color);
        confettiSeeds.push({
          x: ((i * 17) % 100) / 10 - 5,
          y: ((i * 13) % 45) / 10 + 1.5,
          z: ((i * 23) % 70) / 10 - 3.5,
          vy: 1.4 + (i % 4) * 0.45,
          spin: 2 + (i % 5),
        });
      }
      if (confettiMesh.instanceColor) confettiMesh.instanceColor.needsUpdate = true;
      scene.add(confettiMesh);
    } else {
      // 'trophy': Transparent-backdrop 3D Championship Podium + Trophy + Cheering Squad + Confetti
      const winner = championTeam ?? homeTeam;
      const podiumBaseGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.45, 24);
      const podiumMidGeo = new THREE.CylinderGeometry(1.5, 1.7, 0.35, 24);
      const podiumMat = new THREE.MeshStandardMaterial({
        color: winner.primaryColor,
        roughness: 0.45,
        metalness: 0.25,
      });
      const goldTrimGeo = new THREE.TorusGeometry(2.42, 0.08, 8, 32);
      const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.9 });
      disposables.push(podiumBaseGeo, podiumMidGeo, podiumMat, goldTrimGeo, goldTrimMat);

      const podiumGroup = new THREE.Group();
      const baseTier = new THREE.Mesh(podiumBaseGeo, podiumMat);
      baseTier.position.y = 0.225;
      const topTier = new THREE.Mesh(podiumMidGeo, podiumMat);
      topTier.position.y = 0.625;
      const trim = new THREE.Mesh(goldTrimGeo, goldTrimMat);
      trim.rotation.x = Math.PI / 2;
      trim.position.y = 0.44;
      podiumGroup.add(baseTier, topTier, trim);
      scene.add(podiumGroup);

      trophyObj = buildTrophyGroup();
      trophyObj.position.set(0, 0.8, 0);
      trophyObj.scale.setScalar(1.3);
      scene.add(trophyObj);

      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 1.4 - Math.PI * 0.7;
        const r = 2.0;
        const px = Math.sin(angle) * r;
        const pz = Math.cos(angle) * r;
        const player = buildFootballerGroup(winner, i === 1);
        player.group.position.set(px, 0.45, pz);
        player.group.lookAt(0, 0.45, 3.5);
        scene.add(player.group);
        animatedRigs.push({ rig: player, baseX: px, baseZ: pz, phaseOffset: i * 1.3 });
      }

      // Gold & club-color confetti
      const count = 110;
      const cGeo = new THREE.BoxGeometry(0.14, 0.14, 0.04);
      const cMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.3 });
      disposables.push(cGeo, cMat);
      confettiMesh = new THREE.InstancedMesh(cGeo, cMat, count);
      confettiMesh.frustumCulled = false;
      confettiSeeds = [];
      const palette = ['#facc15', winner.primaryColor, winner.secondaryColor, '#ffffff'];
      for (let i = 0; i < count; i++) {
        _color.set(palette[i % palette.length]);
        confettiMesh.setColorAt(i, _color);
        confettiSeeds.push({
          x: ((i * 19) % 100) / 10 - 5,
          y: ((i * 11) % 50) / 10 + 1.5,
          z: ((i * 29) % 70) / 10 - 3.5,
          vy: 1.2 + (i % 5) * 0.4,
          spin: 2.5 + (i % 4),
        });
      }
      if (confettiMesh.instanceColor) confettiMesh.instanceColor.needsUpdate = true;
      scene.add(confettiMesh);
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(0.1, clock.getDelta());
      const elapsed = clock.getElapsedTime();
      const props = latestPropsRef.current;

      // Update camera with smooth exponential damping
      if (props.mode === 'tunnel') {
        const walkProgress = Math.min(1, props.progress || (elapsed % 20) / 20);
        _camTargetPos.set(Math.sin(elapsed * 0.5) * 0.55, 1.68, 8.2 + walkProgress * 2.4);
        _camLookTarget.set(0, 1.25, -1.5 + walkProgress * 3.8);
      } else if (props.mode === 'intro') {
        const theta = elapsed * 0.35;
        _camTargetPos.set(Math.sin(theta) * 9.5, 4.2 + Math.sin(elapsed * 0.5) * 0.5, Math.cos(theta) * 9.5);
        _camLookTarget.set(0, 1.4, 0);
      } else if (props.mode === 'goal') {
        const theta = Math.sin(elapsed * 0.45) * 0.75;
        _camTargetPos.set(Math.sin(theta) * 5.2, 2.35, Math.cos(theta) * 5.4);
        _camLookTarget.set(0, 1.2, 0.2);
      } else {
        const theta = Math.sin(elapsed * 0.4) * 0.6;
        _camTargetPos.set(Math.sin(theta) * 6.4, 2.75, Math.cos(theta) * 6.4);
        _camLookTarget.set(0, 1.55, 0);
      }

      const dampAlpha = 1 - Math.exp(-5.0 * delta);
      camera.position.lerp(_camTargetPos, dampAlpha);
      _camCurrentLook.lerp(_camLookTarget, dampAlpha);
      camera.lookAt(_camCurrentLook);

      if (trophyObj) {
        trophyObj.rotation.y = elapsed * (props.mode === 'trophy' ? 1.5 : 1.0);
      }
      if (heroBall) {
        heroBall.rotation.x += delta * 2.2;
        heroBall.rotation.y += delta * 1.7;
        heroBall.position.y = (props.mode === 'intro' ? 3.25 : 1.45) + Math.sin(elapsed * 3.0) * 0.22;
      }

      for (const item of animatedRigs) {
        const t = elapsed * 6.0 + item.phaseOffset;
        if (props.mode === 'tunnel') {
          item.rig.leftLeg.rotation.x = Math.sin(t) * 0.55;
          item.rig.rightLeg.rotation.x = -Math.sin(t) * 0.55;
          item.rig.leftArm.rotation.x = -Math.sin(t) * 0.45;
          item.rig.rightArm.rotation.x = Math.sin(t) * 0.45;
          item.rig.group.position.z = item.baseZ + Math.min(5.2, (elapsed % 20) * 0.28);
        } else if (props.mode === 'goal' || props.mode === 'trophy') {
          const jump = Math.max(0, Math.sin(elapsed * 4.5 + item.phaseOffset)) * 0.35;
          item.rig.group.position.y = (props.mode === 'trophy' ? 0.45 : 0) + jump;
          item.rig.leftArm.rotation.z = -2.3 + Math.sin(t) * 0.25;
          item.rig.rightArm.rotation.z = 2.3 - Math.sin(t) * 0.25;
        } else {
          item.rig.leftArm.rotation.x = Math.sin(t * 0.4) * 0.15;
          item.rig.rightArm.rotation.x = -Math.sin(t * 0.4) * 0.15;
        }
      }

      if (confettiMesh) {
        for (let i = 0; i < confettiSeeds.length; i++) {
          const s = confettiSeeds[i];
          const fallY = ((s.y + 6 - ((elapsed * s.vy) % 6)) % 6);
          _dummy.position.set(
            s.x + Math.sin(elapsed * 2 + i) * 0.25,
            fallY,
            s.z + Math.cos(elapsed * 1.8 + i) * 0.2
          );
          _dummy.rotation.set(elapsed * s.spin, elapsed * s.spin * 0.8, 0);
          _dummy.scale.setScalar(1);
          _dummy.updateMatrix();
          confettiMesh.setMatrixAt(i, _dummy.matrix);
        }
        confettiMesh.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material.dispose();
        }
      });
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mode, competitionId, homeTeam.id, awayTeam.id, championTeam?.id, goalScoringTeam?.id]);

  // For trophy ceremony, occupy the center pitch window cleanly between top and bottom 2D pitch-side LED boards
  const containerClass =
    mode === 'trophy'
      ? 'pointer-events-none absolute inset-x-0 top-[23.5%] bottom-[12%] z-[5]'
      : 'pointer-events-none absolute inset-0 z-10';

  return (
    <div
      ref={mountRef}
      data-testid={`cutscene-3d-${mode}`}
      className={containerClass}
      aria-hidden="true"
    />
  );
};
