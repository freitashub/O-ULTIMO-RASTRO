/**
 * Runtime espacial (Babylon.js) da vertical slice: cena 3D real com piso, paredes, objetos sólidos,
 * luzes/sombras, câmeras fixas por zona, Theo com collider e animação procedural, interação por
 * proximidade + raycast de linha de visão e consulta de oclusão câmera→Theo.
 *
 * Não conhece Phaser: recebe input a cada passo e expõe estado/eventos. Em testes roda com NullEngine.
 */
import { Engine } from '@babylonjs/core/Engines/engine';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Scene } from '@babylonjs/core/scene';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { SpotLight } from '@babylonjs/core/Lights/spotLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { Ray } from '@babylonjs/core/Culling/ray';
import { ImportMeshAsync } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/loaders/glTF';
import {
  BoxCollider2D,
  CameraSpec,
  InteractableSpec,
  SpatialLayout,
  angleDelta,
  approachVelocity,
  collidersFromLayout,
  moveCharacter,
  nearestInteractable,
  selectCamera
} from '@/spatial/garageLayout';

export interface SpatialInput {
  /** eixo horizontal da tela (-1 esquerda … 1 direita) */
  x: number;
  /** eixo vertical da tela (-1 para trás/baixo … 1 para frente/cima) */
  y: number;
  /** direção em coordenadas de mundo (XZ), ignora a câmera — usado por testes/automação */
  world?: { x: number; z: number };
}

export interface SpatialStepEvents {
  footstep: boolean;
  cameraChanged: string | null;
}

export interface SpatialDebugState {
  theo: { x: number; y: number; z: number; yaw: number; speed: number; state: TheoState; touching: string[] };
  camera: string;
  focus: string | null;
  occludedBy: string | null;
  modelSource: 'glb' | 'primitive';
  meshes: number;
  fps: number;
}

export type TheoState = 'idle' | 'walk' | 'interact';

export interface SpatialWorldOptions {
  canvas?: HTMLCanvasElement;
  headless?: boolean;
  theoModelUrl?: string;
  reduceMotion?: boolean;
  width?: number;
  height?: number;
}

const WALK_SPEED = 2.1;
const ACCEL = 9;
const DECEL = 12;
const TURN_SPEED = 11;
const CAMERA_BLEND_S = 0.55;
const THEO_HEAD_Y = 1.3;
const THEO_CHEST_Y = 1.0;
/** raio do collider do Theo no plano (m) */
export const THEO_RADIUS = 0.26;

type RigParts = Record<'hips' | 'torso' | 'head' | 'arm_L' | 'arm_R' | 'leg_L' | 'leg_R', TransformNode | null>;

export class SpatialWorld {
  readonly layout: SpatialLayout;
  readonly engine: AbstractEngine;
  readonly scene: Scene;
  private opts: SpatialWorldOptions;
  private collider!: Mesh;
  private rig!: TransformNode;
  private parts: RigParts = { hips: null, torso: null, head: null, arm_L: null, arm_R: null, leg_L: null, leg_R: null };
  private yaw = 0;
  private yawOffset = 0;
  private speed = 0;
  private state: TheoState = 'idle';
  private walkPhase = 0;
  private idlePhase = 0;
  private interactT = 0;
  private lastStepSign = 1;
  private moveBasis: { fx: number; fz: number; rx: number; rz: number } | null = null;
  private walkTarget: { x: number; z: number } | null = null;
  private camera!: FreeCamera;
  private cameraSpec!: CameraSpec;
  private cameraBlend: { from: Vector3; to: Vector3; t: number } | null = null;
  private lookAt = new Vector3();
  private meshesById = new Map<string, AbstractMesh>();
  private focus: InteractableSpec | null = null;
  private bulbLight: PointLight | null = null;
  private time = 0;
  private modelSource: 'glb' | 'primitive' = 'primitive';
  private colliders: BoxCollider2D[] = [];
  private lastHits: string[] = [];
  private noProgressT = 0;
  private lastTargetDist = Infinity;

  constructor(layout: SpatialLayout, opts: SpatialWorldOptions = {}) {
    this.layout = layout;
    this.opts = opts;
    if (opts.headless || !opts.canvas) {
      this.engine = new NullEngine();
    } else {
      this.engine = new Engine(opts.canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true }, false);
      this.engine.setSize(opts.width ?? 1280, opts.height ?? 720);
    }
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.02, 0.02, 0.03, 1);
    this.scene.ambientColor = new Color3(0.08, 0.08, 0.1);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.035;
    this.scene.fogColor = new Color3(0.03, 0.03, 0.045);
  }

  /** Monta a cena. Carrega o GLB do Theo quando houver URL e engine real; senão usa o rig primitivo. */
  async build(): Promise<void> {
    const shadows = this.buildLights();
    this.buildRoom(shadows);
    this.colliders = collidersFromLayout(this.layout);
    this.buildTheoCollider();
    let loaded = false;
    if (this.opts.theoModelUrl && !this.opts.headless) loaded = await this.loadTheoModel(this.opts.theoModelUrl);
    if (!loaded) this.buildPrimitiveTheo();
    this.modelSource = loaded ? 'glb' : 'primitive';
    for (const m of this.rig.getChildMeshes(false)) {
      m.isPickable = false;
      shadows?.addShadowCaster(m, false);
    }
    this.setYaw(this.layout.spawn.yaw);
    this.buildCamera();
    this.updateRig(0);
    // matrizes de mundo e bounding boxes prontas antes do primeiro render (colisão/raycast corretos desde o 1º passo)
    for (const m of this.scene.meshes) m.computeWorldMatrix(true);
    this.scene.render();
  }

  // ------------------------------------------------------------------ construção
  private material(name: string, rgb: [number, number, number], opts: { emissive?: [number, number, number]; texture?: 'concrete' | 'wood' | 'metal' | 'none'; alpha?: number } = {}): StandardMaterial {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = new Color3(...rgb);
    m.specularColor = new Color3(0.06, 0.06, 0.06);
    if (opts.emissive) m.emissiveColor = new Color3(...opts.emissive);
    if (opts.alpha !== undefined) m.alpha = opts.alpha;
    if (!this.opts.headless && opts.texture && opts.texture !== 'none') m.diffuseTexture = this.noiseTexture(`${name}_tex`, opts.texture);
    return m;
  }

  /** Textura procedural (ruído + manchas) gerada em canvas: sem arquivos externos. */
  private noiseTexture(name: string, kind: 'concrete' | 'wood' | 'metal'): DynamicTexture {
    const size = 256;
    const tex = new DynamicTexture(name, { width: size, height: size }, this.scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    let seed = name.length * 977;
    const rnd = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const n = kind === 'wood' ? 900 : 2600;
    for (let i = 0; i < n; i++) {
      const v = Math.floor(170 + rnd() * 85);
      ctx.fillStyle = `rgba(${v},${v},${v},${kind === 'metal' ? 0.25 : 0.5})`;
      if (kind === 'wood') ctx.fillRect(0, rnd() * size, size, 1 + rnd() * 2);
      else ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1 + rnd() * 3);
    }
    for (let i = 0; i < (kind === 'concrete' ? 7 : 3); i++) {
      const x = rnd() * size, y = rnd() * size, r = 12 + rnd() * 40;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(90,85,80,0.35)');
      g.addColorStop(1, 'rgba(90,85,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    tex.update();
    return tex;
  }

  private buildLights(): ShadowGenerator | null {
    let shadows: ShadowGenerator | null = null;
    for (const l of this.layout.lights) {
      const color = new Color3(...l.color);
      if (l.kind === 'fill') {
        const h = new HemisphericLight(l.id, new Vector3(0, 1, 0.2), this.scene);
        h.diffuse = color;
        h.groundColor = new Color3(0.05, 0.05, 0.07);
        h.intensity = l.intensity * 1.4;
      } else if (l.kind === 'bulb') {
        const p = new PointLight(`${l.id}_point`, new Vector3(l.pos.x, l.pos.y, l.pos.z), this.scene);
        p.diffuse = color;
        p.intensity = l.intensity * 0.55;
        p.range = 9;
        this.bulbLight = p;
        // luz de sombra: spot da lâmpada para baixo (sombras reais de objetos e do Theo)
        const s = new SpotLight(`${l.id}_spot`, new Vector3(l.pos.x, l.pos.y, l.pos.z), new Vector3(0, -1, 0), Math.PI * 0.82, 2, this.scene);
        s.diffuse = color;
        s.intensity = l.intensity * 0.8;
        s.range = 10;
        if (!this.opts.headless) {
          shadows = new ShadowGenerator(1024, s);
          shadows.usePercentageCloserFiltering = true;
          shadows.bias = 0.0015;
          shadows.darkness = 0.25;
        }
      } else {
        const s = new SpotLight(l.id, new Vector3(l.pos.x, l.pos.y, l.pos.z), new Vector3(0, -0.45, -1).normalize(), Math.PI * 0.45, 4, this.scene);
        s.diffuse = color;
        s.intensity = l.intensity;
        s.range = 14;
      }
    }
    return shadows;
  }

  private buildRoom(shadows: ShadowGenerator | null): void {
    const { room } = this.layout;
    const w = room.maxX - room.minX;
    const d = room.maxZ - room.minZ;
    const floor = MeshBuilder.CreateGround('floor', { width: w, height: d, subdivisions: 1 }, this.scene);
    const floorMat = this.material('floor_mat', [0.25, 0.245, 0.24], { texture: 'concrete' });
    if (floorMat.diffuseTexture) {
      (floorMat.diffuseTexture as DynamicTexture).uScale = 4;
      (floorMat.diffuseTexture as DynamicTexture).vScale = 3;
    }
    floor.material = floorMat;
    floor.receiveShadows = true;
    floor.checkCollisions = false;
    this.meshesById.set('floor', floor);

    const ceiling = MeshBuilder.CreatePlane('ceiling', { width: w, height: d }, this.scene);
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.position.y = room.height;
    ceiling.material = this.material('ceiling_mat', [0.12, 0.12, 0.13]);
    ceiling.isPickable = false;

    const mats = new Map<string, StandardMaterial>();
    for (const b of this.layout.boxes) {
      const key = `${b.kind}_${b.color.join('_')}`;
      if (!mats.has(key)) {
        const texture = b.kind === 'wall' ? 'concrete' : b.color[0] < 0.3 && b.color[2] > b.color[0] ? 'metal' : 'wood';
        mats.set(key, this.material(`mat_${b.id}`, b.color, { texture: b.id === 'bulb' ? 'none' : texture, emissive: b.id === 'bulb' ? [1, 0.85, 0.6] : undefined }));
      }
      const mesh = MeshBuilder.CreateBox(b.id, { width: b.size.x, height: b.size.y, depth: b.size.z }, this.scene);
      mesh.position.set(b.pos.x, b.pos.y, b.pos.z);
      if (b.rotY) mesh.rotation.y = b.rotY;
      mesh.material = mats.get(key)!;
      mesh.checkCollisions = b.collider;
      mesh.receiveShadows = b.kind !== 'door' || true;
      if (b.id !== 'bulb' && b.kind !== 'wall') shadows?.addShadowCaster(mesh, false);
      this.meshesById.set(b.id, mesh);
      if (b.kind === 'door' && b.id !== 'garage_door') this.addDoorDetails(b.id, mesh, b.size);
    }
    // prateleiras da estante e fio da lâmpada (detalhe visual, sem collider)
    const shelf = this.meshesById.get('shelf');
    if (shelf) {
      const boardMat = this.material('shelf_board', [0.24, 0.17, 0.12], { texture: 'wood' });
      const spec = this.layout.boxes.find((b) => b.id === 'shelf')!;
      for (const y of [-0.6, 0.0, 0.6]) {
        const board = MeshBuilder.CreateBox(`shelf_board_${y}`, { width: spec.size.x - 0.08, height: 0.04, depth: spec.size.z + 0.04 }, this.scene);
        board.parent = shelf;
        board.position.y = y;
        board.material = boardMat;
        board.isPickable = false;
      }
    }
    const cord = MeshBuilder.CreateCylinder('bulb_cord', { height: 0.35, diameter: 0.015 }, this.scene);
    cord.position.set(0.6, room.height - 0.17, -0.4);
    cord.material = this.material('cord_mat', [0.05, 0.05, 0.05]);
    cord.isPickable = false;

    for (const dcl of this.layout.decals) {
      const plane = MeshBuilder.CreateGround(dcl.id, { width: dcl.size.x, height: dcl.size.z }, this.scene);
      plane.position.set(dcl.pos.x, dcl.pos.y, dcl.pos.z);
      const m = new StandardMaterial(`${dcl.id}_mat`, this.scene);
      m.diffuseColor = new Color3(...dcl.color);
      m.specularColor = new Color3(0.25, 0.25, 0.25);
      if (!this.opts.headless) {
        const tex = this.decalTexture(dcl.id);
        m.diffuseTexture = tex;
        m.diffuseTexture.hasAlpha = true;
        m.useAlphaFromDiffuseTexture = true;
      } else {
        m.alpha = dcl.alpha;
      }
      plane.material = m;
      plane.receiveShadows = true;
      this.meshesById.set(dcl.id, plane);
    }
  }

  private addDoorDetails(id: string, door: Mesh, size: { x: number; y: number; z: number }): void {
    const frameMat = this.material(`${id}_frame_mat`, [0.14, 0.1, 0.08], { texture: 'wood' });
    const alongX = size.x > size.z;
    const t = 0.08;
    const parts: Array<[number, number, number, number, number, number]> = alongX
      ? [[-(size.x / 2 + t / 2), 0, 0, t, size.y + t, size.z + 0.06], [size.x / 2 + t / 2, 0, 0, t, size.y + t, size.z + 0.06], [0, size.y / 2 + t / 2, 0, size.x + t * 2, t, size.z + 0.06]]
      : [[0, 0, -(size.z / 2 + t / 2), size.x + 0.06, size.y + t, t], [0, 0, size.z / 2 + t / 2, size.x + 0.06, size.y + t, t], [0, size.y / 2 + t / 2, 0, size.x + 0.06, t, size.z + t * 2]];
    parts.forEach(([x, y, z, sx, sy, sz], i) => {
      const f = MeshBuilder.CreateBox(`${id}_frame_${i}`, { width: sx, height: sy, depth: sz }, this.scene);
      f.parent = door;
      f.position.set(x, y, z);
      f.material = frameMat;
      f.isPickable = false;
    });
    const knob = MeshBuilder.CreateSphere(`${id}_knob`, { diameter: 0.07 }, this.scene);
    knob.parent = door;
    knob.position.set(alongX ? size.x * 0.35 : size.x / 2 + 0.03, -0.05, alongX ? size.z / 2 + 0.03 : size.z * 0.35);
    knob.material = this.material(`${id}_knob_mat`, [0.6, 0.5, 0.3]);
    knob.isPickable = false;
  }

  private decalTexture(id: string): DynamicTexture {
    const size = 256;
    const tex = new DynamicTexture(`${id}_tex`, { width: size, height: size }, this.scene, true);
    tex.hasAlpha = true;
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, size, size);
    if (id === 'tire_mark') {
      // duas trilhas de pneu com sulcos, entrando pela porta da garagem e parando
      for (const x of [58, 198]) {
        for (let y = 0; y < size; y += 6) {
          ctx.fillStyle = `rgba(10,10,12,${0.55 + 0.35 * Math.sin(y * 0.3)})`;
          ctx.fillRect(x - 18, y, 36, 3);
        }
        ctx.fillStyle = 'rgba(8,8,10,0.35)';
        ctx.fillRect(x - 20, 0, 40, size);
      }
    } else {
      const g = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(8,8,10,0.75)');
      g.addColorStop(0.7, 'rgba(8,8,10,0.35)');
      g.addColorStop(1, 'rgba(8,8,10,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    tex.update();
    return tex;
  }

  private buildTheoCollider(): void {
    const { pos } = this.layout.spawn;
    this.collider = MeshBuilder.CreateBox('theo_collider', { width: 0.5, height: 1.44, depth: 0.5 }, this.scene);
    this.collider.isVisible = false;
    this.collider.isPickable = false;
    this.collider.checkCollisions = false;
    this.collider.position.set(pos.x, 0, pos.z);
    this.rig = new TransformNode('theo_rig', this.scene);
    this.rig.position.copyFrom(this.collider.position);
    // luz de personagem (fraca, curta): mantém o Theo legível no escuro sem iluminar a sala
    const charLight = new PointLight('theo_light', new Vector3(0.35, 1.9, 0.9), this.scene);
    charLight.parent = this.rig;
    charLight.diffuse = new Color3(0.95, 0.85, 0.7);
    charLight.intensity = 0.55;
    charLight.range = 2.6;
  }

  private async loadTheoModel(url: string): Promise<boolean> {
    try {
      const result = await ImportMeshAsync(url, this.scene);
      const root = result.meshes.find((m) => m.name === '__root__') ?? result.meshes[0];
      if (!root) return false;
      root.parent = this.rig;
      root.position.set(0, 0, 0);
      // PBR sem mapa de ambiente fica quase preto: converte para material padrão com a mesma cor base
      const converted = new Map<string, StandardMaterial>();
      for (const m of result.meshes) {
        const src = m.material as unknown as { name: string; albedoColor?: Color3; getClassName(): string } | null;
        if (!src || src.getClassName() !== 'PBRMaterial') continue;
        let std = converted.get(src.name);
        if (!std) {
          std = new StandardMaterial(`theo_${src.name}`, this.scene);
          const c = src.albedoColor ?? new Color3(0.5, 0.5, 0.5);
          // albedo do glTF é linear; o material padrão espera gama
          std.diffuseColor = c.toGammaSpace();
          std.specularColor = new Color3(0.08, 0.08, 0.08);
          std.emissiveColor = c.toGammaSpace().scale(0.12);
          converted.set(src.name, std);
        }
        m.material = std;
      }
      const all = [root, ...root.getDescendants(false)] as TransformNode[];
      const find = (n: string): TransformNode | null => all.find((x) => x.name === n) ?? null;
      for (const k of Object.keys(this.parts) as Array<keyof RigParts>) this.parts[k] = find(k);
      // descobre a frente do modelo (nariz − cabeça) para alinhar o yaw independentemente da conversão de eixos
      this.rig.rotation.y = 0;
      this.rig.computeWorldMatrix(true);
      for (const n of all) n.computeWorldMatrix(true);
      const nose = find('nose');
      const head = find('head');
      if (nose && head) {
        const f = nose.getAbsolutePosition().subtract(head.getAbsolutePosition());
        this.yawOffset = -Math.atan2(f.x, f.z);
      }
      return !!(this.parts.leg_L && this.parts.arm_L);
    } catch (err) {
      console.warn('Theo GLB indisponível, usando rig primitivo:', err);
      return false;
    }
  }

  /** Mesmo esqueleto do GLB feito com primitivas (headless/testes ou fallback). */
  private buildPrimitiveTheo(): void {
    const mk = (name: string, parent: TransformNode, t: [number, number, number], size?: [number, number, number], offY = 0, rgb: [number, number, number] = [0.07, 0.16, 0.27]): TransformNode => {
      const node = new TransformNode(name, this.scene);
      node.parent = parent;
      node.position.set(...t);
      if (size) {
        const m = MeshBuilder.CreateBox(`${name}_mesh`, { width: size[0], height: size[1], depth: size[2] }, this.scene);
        m.parent = node;
        m.position.y = offY;
        m.material = this.material(`${name}_m`, rgb);
      }
      return node;
    };
    const hips = mk('hips', this.rig, [0, 0.78, 0], [0.34, 0.16, 0.2], 0, [0.52, 0.45, 0.36]);
    const torso = mk('torso', hips, [0, 0.06, 0], [0.4, 0.44, 0.24], 0.22);
    const neck = mk('neck', torso, [0, 0.46, 0]);
    const head = mk('head', neck, [0, 0.06, 0], [0.26, 0.3, 0.26], 0.15, [0.86, 0.69, 0.56]);
    mk('nose', head, [0, 0.13, 0.14], [0.03, 0.04, 0.03], 0, [0.86, 0.69, 0.56]);
    const armL = mk('arm_L', torso, [0.25, 0.4, 0], [0.1, 0.46, 0.11], -0.21);
    const armR = mk('arm_R', torso, [-0.25, 0.4, 0], [0.1, 0.46, 0.11], -0.21);
    const legL = mk('leg_L', hips, [0.09, -0.04, 0], [0.13, 0.66, 0.14], -0.33, [0.52, 0.45, 0.36]);
    const legR = mk('leg_R', hips, [-0.09, -0.04, 0], [0.13, 0.66, 0.14], -0.33, [0.52, 0.45, 0.36]);
    this.parts = { hips, torso, head, arm_L: armL, arm_R: armR, leg_L: legL, leg_R: legR };
    this.yawOffset = 0;
  }

  private buildCamera(): void {
    this.cameraSpec = selectCamera(this.layout, this.collider.position.x, this.collider.position.z, null);
    const p = this.cameraSpec.pos;
    this.camera = new FreeCamera('main_camera', new Vector3(p.x, p.y, p.z), this.scene);
    this.camera.fov = this.cameraSpec.fov;
    this.camera.minZ = 0.05;
    this.camera.maxZ = 60;
    this.lookAt = this.theoFocusPoint();
    this.camera.setTarget(this.lookAt);
    this.scene.activeCamera = this.camera;
  }

  // ------------------------------------------------------------------ simulação
  private theoFocusPoint(): Vector3 {
    return new Vector3(this.collider.position.x, THEO_CHEST_Y, this.collider.position.z);
  }

  private setYaw(yaw: number): void {
    this.yaw = yaw;
    this.rig.rotation.y = yaw + this.yawOffset;
  }

  /**
   * Desvio local para o clique-para-andar: se a direção desejada está bloqueada, testa direções
   * defletidas (±35°, ±70°, ±105°) com o controlador e escolhe a que mais avança rumo ao alvo.
   */
  private steerAround(dx: number, dz: number): { x: number; z: number } {
    const probe = 0.18;
    const p = this.collider.position;
    const progress = (ax: number, az: number): number => {
      const r = moveCharacter(p.x, p.z, ax * probe, az * probe, THEO_RADIUS, this.colliders);
      return ((r.x - p.x) * dx + (r.z - p.z) * dz) / probe;
    };
    if (progress(dx, dz) > 0.6) return { x: dx, z: dz };
    let best = { x: dx, z: dz, score: progress(dx, dz) };
    for (const deg of [35, -35, 70, -70, 105, -105]) {
      const a = (deg * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const ax = dx * c - dz * s;
      const az = dx * s + dz * c;
      const score = progress(ax, az);
      if (score > best.score + 0.05) best = { x: ax, z: az, score };
    }
    return { x: best.x, z: best.z };
  }

  /** Andar até um ponto do piso (clique). Cancelado por input de teclado. */
  setWalkTarget(x: number, z: number): void {
    this.noProgressT = 0;
    this.lastTargetDist = Infinity;
    const { room } = this.layout;
    this.walkTarget = { x: Math.max(room.minX + 0.3, Math.min(room.maxX - 0.3, x)), z: Math.max(room.minZ + 0.3, Math.min(room.maxZ - 0.3, z)) };
  }

  /** Converte um ponto de tela (px no espaço de render) em ponto do piso. */
  pickFloor(screenX: number, screenY: number): { x: number; z: number } | null {
    const hit = this.scene.pick(screenX, screenY, (m) => m.name === 'floor' || m.name === 'tire_mark' || m.name === 'oil_stain');
    return hit?.hit && hit.pickedPoint ? { x: hit.pickedPoint.x, z: hit.pickedPoint.z } : null;
  }

  startInteract(): void {
    this.state = 'interact';
    this.interactT = 0;
    this.speed = 0;
    this.walkTarget = null;
    if (this.focus) {
      const f = this.focus.target;
      this.setYaw(Math.atan2(f.x - this.collider.position.x, f.z - this.collider.position.z));
    }
  }

  /** Um passo de simulação (dt em segundos). */
  step(dt: number, input: SpatialInput): SpatialStepEvents {
    const events: SpatialStepEvents = { footstep: false, cameraChanged: null };
    this.time += dt;
    // subpassos para manter colisão estável com fps baixo
    let remaining = Math.min(dt, 0.25);
    while (remaining > 1e-6) {
      const h = Math.min(remaining, 1 / 30);
      this.simulate(h, input, events);
      remaining -= h;
    }
    this.updateCamera(dt, events);
    this.updateFocus();
    this.updateLights(dt);
    return events;
  }

  private simulate(dt: number, input: SpatialInput, events: SpatialStepEvents): void {
    if (this.state === 'interact') {
      this.interactT += dt;
      if (this.interactT > 0.55) this.state = 'idle';
      this.updateRig(dt);
      return;
    }
    const len = Math.hypot(input.x, input.y);
    let dirX = 0;
    let dirZ = 0;
    if (input.world && Math.hypot(input.world.x, input.world.z) > 0.1) {
      this.walkTarget = null;
      const wl = Math.hypot(input.world.x, input.world.z);
      dirX = input.world.x / wl;
      dirZ = input.world.z / wl;
    } else if (len > 0.1) {
      this.walkTarget = null;
      if (!this.moveBasis) {
        // base relativa à câmera, congelada enquanto o jogador segura a direção (sem inversão na troca de câmera)
        const fwd = this.theoFocusPoint().subtract(this.camera.position);
        fwd.y = 0;
        fwd.normalize();
        this.moveBasis = { fx: fwd.x, fz: fwd.z, rx: fwd.z, rz: -fwd.x };
      }
      const ix = input.x / Math.max(1, len);
      const iy = input.y / Math.max(1, len);
      dirX = this.moveBasis.fx * iy + this.moveBasis.rx * ix;
      dirZ = this.moveBasis.fz * iy + this.moveBasis.rz * ix;
    } else {
      this.moveBasis = null;
      if (this.walkTarget) {
        const dx = this.walkTarget.x - this.collider.position.x;
        const dz = this.walkTarget.z - this.collider.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.12) this.walkTarget = null;
        else {
          const steer = this.steerAround(dx / dist, dz / dist);
          dirX = steer.x;
          dirZ = steer.z;
          // desiste se não houver progresso por 2,5 s (alvo inalcançável em linha)
          if (dist < this.lastTargetDist - 0.01) {
            this.lastTargetDist = dist;
            this.noProgressT = 0;
          } else if ((this.noProgressT += dt) > 2.5) {
            this.walkTarget = null;
          }
        }
      }
    }
    const moving = Math.hypot(dirX, dirZ) > 0.01;
    this.speed = approachVelocity(this.speed, moving ? WALK_SPEED : 0, ACCEL, DECEL, dt);
    if (moving) {
      const targetYaw = Math.atan2(dirX, dirZ);
      const d = angleDelta(this.yaw, targetYaw);
      this.setYaw(this.yaw + Math.max(-TURN_SPEED * dt, Math.min(TURN_SPEED * dt, d)));
    }
    if (this.speed > 0.001) {
      // anda na direção em que o corpo está virado (curva suave), com colisão real
      const vx = Math.sin(this.yaw) * this.speed * dt;
      const vz = Math.cos(this.yaw) * this.speed * dt;
      const before = this.collider.position.clone();
      const r = moveCharacter(before.x, before.z, vx, vz, THEO_RADIUS, this.colliders);
      this.collider.position.set(r.x, 0, r.z);
      this.lastHits = r.hits;
    }
    this.state = this.speed > 0.15 ? 'walk' : 'idle';
    this.rig.position.copyFrom(this.collider.position);
    this.updateRig(dt, events);
  }

  private updateRig(dt: number, events?: SpatialStepEvents): void {
    const p = this.parts;
    const reduce = !!this.opts.reduceMotion;
    const k = Math.min(1, this.speed / WALK_SPEED);
    if (this.state === 'walk' && !reduce) {
      this.walkPhase += dt * (6.5 + 3 * k);
      const s = Math.sin(this.walkPhase);
      if (p.leg_L) p.leg_L.rotation.x = s * 0.62 * k;
      if (p.leg_R) p.leg_R.rotation.x = -s * 0.62 * k;
      if (p.arm_L) p.arm_L.rotation.x = -s * 0.5 * k;
      if (p.arm_R) p.arm_R.rotation.x = s * 0.5 * k;
      if (p.hips) p.hips.position.y = 0.78 + Math.abs(Math.cos(this.walkPhase)) * 0.035 * k;
      if (p.torso) p.torso.rotation.y = s * 0.08 * k;
      if (p.head) p.head.rotation.x = 0.04;
      const sign = s >= 0 ? 1 : -1;
      if (sign !== this.lastStepSign) {
        this.lastStepSign = sign;
        if (events) events.footstep = true;
      }
    } else {
      this.idlePhase += dt * 1.7;
      const b = Math.sin(this.idlePhase);
      const ease = Math.min(1, dt * 8);
      for (const part of [p.leg_L, p.leg_R, p.arm_L]) if (part) part.rotation.x += (0 - part.rotation.x) * ease;
      if (p.torso) {
        p.torso.rotation.y += (0 - p.torso.rotation.y) * ease;
        p.torso.scaling.y = reduce ? 1 : 1 + b * 0.012;
      }
      if (p.hips) p.hips.position.y += (0.78 - p.hips.position.y) * ease;
      if (p.head) p.head.rotation.x = reduce ? 0 : b * 0.03;
      if (p.arm_R) {
        const lift = this.state === 'interact' ? Math.sin(Math.min(1, this.interactT / 0.55) * Math.PI) * -1.15 : 0;
        p.arm_R.rotation.x += (lift - p.arm_R.rotation.x) * Math.min(1, dt * 14);
      }
    }
  }

  private updateCamera(dt: number, events: SpatialStepEvents): void {
    const next = selectCamera(this.layout, this.collider.position.x, this.collider.position.z, this.cameraSpec.id);
    if (next.id !== this.cameraSpec.id) {
      this.cameraBlend = { from: this.camera.position.clone(), to: new Vector3(next.pos.x, next.pos.y, next.pos.z), t: 0 };
      this.cameraSpec = next;
      this.camera.fov = next.fov;
      events.cameraChanged = next.id;
    }
    if (this.cameraBlend) {
      this.cameraBlend.t = Math.min(1, this.cameraBlend.t + dt / CAMERA_BLEND_S);
      const e = this.cameraBlend.t < 0.5 ? 2 * this.cameraBlend.t ** 2 : 1 - (-2 * this.cameraBlend.t + 2) ** 2 / 2;
      this.camera.position = Vector3.Lerp(this.cameraBlend.from, this.cameraBlend.to, e);
      if (this.cameraBlend.t >= 1) this.cameraBlend = null;
    }
    // alvo semi-fixo: acompanha o Theo com atraso (enquadramento cinematográfico)
    const goal = this.theoFocusPoint();
    this.lookAt = Vector3.Lerp(this.lookAt, goal, Math.min(1, dt * 4));
    this.camera.setTarget(this.lookAt);
  }

  private updateFocus(): void {
    const prev = this.focus;
    const near = nearestInteractable(this.layout, this.collider.position.x, this.collider.position.z, (it) => this.hasLineOfSight(it));
    this.focus = near?.item ?? null;
    if (prev !== this.focus) {
      if (prev) this.setHighlight(prev.meshId, false);
      if (this.focus) this.setHighlight(this.focus.meshId, true);
    }
    if (this.focus) {
      const m = this.meshesById.get(this.focus.meshId)?.material as StandardMaterial | undefined;
      if (m) {
        const pulse = 0.08 + 0.07 * Math.sin(this.time * 5);
        m.emissiveColor = new Color3(pulse * 1.4, pulse * 1.1, pulse * 0.5);
      }
    }
  }

  private setHighlight(meshId: string, on: boolean): void {
    const mesh = this.meshesById.get(meshId);
    if (!mesh?.material) return;
    const m = mesh.material as StandardMaterial;
    if (!on) m.emissiveColor = meshId === 'bulb' ? new Color3(1, 0.85, 0.6) : new Color3(0, 0, 0);
  }

  private updateLights(dt: number): void {
    if (!this.bulbLight || this.opts.reduceMotion) return;
    // lâmpada falhando de leve
    const flicker = Math.sin(this.time * 23) * Math.sin(this.time * 7.3) > 0.93 ? 0.35 : 1;
    const target = this.layout.lights.find((l) => l.kind === 'bulb')!.intensity * 0.55 * flicker;
    this.bulbLight.intensity += (target - this.bulbLight.intensity) * Math.min(1, dt * 30);
  }

  // ------------------------------------------------------------------ consultas
  /** Linha de visão do peito do Theo até o interativo, ignorando o próprio objeto. */
  hasLineOfSight(it: InteractableSpec): boolean {
    const from = new Vector3(this.collider.position.x, THEO_CHEST_Y, this.collider.position.z);
    const to = new Vector3(it.target.x, it.target.y, it.target.z);
    const dir = to.subtract(from);
    const dist = dir.length();
    if (dist < 0.05) return true;
    const ray = new Ray(from, dir.normalize(), dist);
    const own = this.meshesById.get(it.meshId);
    const hit = this.scene.pickWithRay(ray, (m) => m.checkCollisions && m !== own);
    return !(hit?.hit && hit.distance < dist - 0.05);
  }

  /** Mesh entre a câmera ativa e a cabeça do Theo (oclusão real), ou null. */
  occluderBetweenCameraAndTheo(height = THEO_HEAD_Y): string | null {
    const from = this.camera.position.clone();
    const to = new Vector3(this.collider.position.x, height, this.collider.position.z);
    const dir = to.subtract(from);
    const dist = dir.length();
    const ray = new Ray(from, dir.normalize(), dist);
    const hit = this.scene.pickWithRay(ray, (m) => m.isPickable && m.isVisible && m.name !== 'floor' && m.name !== 'ceiling');
    return hit?.hit && hit.pickedMesh && hit.distance < dist - 0.1 ? hit.pickedMesh.name : null;
  }

  /** Reposiciona o Theo (testes/QA). */
  teleport(x: number, z: number, yaw = this.yaw): void {
    const r = moveCharacter(x, z, 0, 0, THEO_RADIUS, this.colliders);
    this.collider.position.set(r.x, 0, r.z);
    this.rig.position.copyFrom(this.collider.position);
    this.speed = 0;
    this.walkTarget = null;
    this.setYaw(yaw);
  }

  getCameraPosition(): { x: number; y: number; z: number } {
    const p = this.camera.position;
    return { x: p.x, y: p.y, z: p.z };
  }

  getFocus(): InteractableSpec | null {
    return this.focus;
  }

  getTheoPosition(): { x: number; y: number; z: number } {
    const p = this.collider.position;
    return { x: p.x, y: p.y, z: p.z };
  }

  /** Posição do Theo projetada na tela (px no espaço de render) — para ancorar HUD. */
  projectTheoHead(): { x: number; y: number } | null {
    if (this.opts.headless) return null;
    const p = Vector3.Project(
      new Vector3(this.collider.position.x, THEO_HEAD_Y + 0.35, this.collider.position.z),
      Matrix.Identity(),
      this.scene.getTransformMatrix(),
      this.camera.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight())
    );
    return { x: p.x, y: p.y };
  }

  /** Projeta um ponto do mundo na tela (px no espaço de render 1280×720). */
  projectPoint(x: number, y: number, z: number): { x: number; y: number } {
    const p = Vector3.Project(
      new Vector3(x, y, z),
      Matrix.Identity(),
      this.scene.getTransformMatrix(),
      this.camera.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight())
    );
    return { x: p.x, y: p.y };
  }

  getDebugState(): SpatialDebugState {
    const p = this.collider.position;
    return {
      theo: { x: +p.x.toFixed(3), y: +p.y.toFixed(3), z: +p.z.toFixed(3), yaw: +this.yaw.toFixed(3), speed: +this.speed.toFixed(3), state: this.state, touching: [...this.lastHits] },
      camera: this.cameraSpec.id,
      focus: this.focus?.id ?? null,
      occludedBy: this.occluderBetweenCameraAndTheo(),
      modelSource: this.modelSource,
      meshes: this.scene.meshes.length,
      fps: +this.engine.getFps().toFixed(1)
    };
  }

  render(): void {
    this.scene.render();
  }

  dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}
