import { Plane, Raycaster, Timer, Vector2, Vector3 } from 'three';
import { Backdrop } from './render/backdrop';
import { OrganismLayer } from './render/organismLayer';
import { SnowLayer } from './render/snowLayer';
import { SparkLayer } from './render/sparkLayer';
import { ThreadLayer } from './render/threadLayer';
import { playTickEffects } from './render/tickEffects';
import { HOME_DISTANCE, Viewport } from './render/viewport';
import { Motion, WORLD_RADIUS } from './sim/motion';
import { Simulation } from './sim/simulation';
import { Stage } from './sim/stages';
import { bindControls } from './ui/controls';
import { $ } from './ui/dom';
import { EventLog } from './ui/eventLog';
import { Hud } from './ui/hud';
import { Narrator } from './ui/narrator';
import { PopulationChart } from './ui/populationChart';
import { Spectrum } from './ui/spectrum';

/** Generations simulated per frame at most, so a slow frame never snowballs. */
const MAX_TICKS_PER_FRAME = 3;
const OPENING_SECONDS = 16;
const CLICK_SLOP_PX = 5;

export interface AppOptions {
  /** Wallpaper use: no interface and no pointer input, so clicks meant for other windows never steer the scene. */
  ambient?: boolean;
}

export class App {
  private readonly viewport: Viewport;
  private readonly sim = new Simulation({ capacity: 5000, mutationRate: 4 });
  private readonly motion = new Motion();
  private readonly organisms = new OrganismLayer();
  private readonly threads = new ThreadLayer();
  private readonly sparks = new SparkLayer();
  private readonly snow = new SnowLayer();
  private readonly backdrop = new Backdrop();
  private readonly hud = new Hud();
  private readonly chart = new PopulationChart();
  private readonly spectrum = new Spectrum();
  private readonly narrator = new Narrator(new EventLog());
  private readonly timer = new Timer();
  private readonly centroid = new Vector3();

  private running = true;
  private gensPerSecond = 2;
  private tickDebt = 0;
  private time = 0;
  private hudTimer = 0;
  /** Seconds into the opening dolly-out; null once finished or interrupted. */
  private opening: number | null = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: AppOptions = {},
  ) {
    this.viewport = new Viewport(canvas);
    const { scene } = this.viewport;
    scene.add(this.backdrop.mesh, this.snow.points, this.threads.lines, this.organisms.points);
    scene.add(this.sparks.points);
    this.viewport.onResize((h) => {
      this.organisms.setViewportHeight(h);
      this.sparks.setViewportHeight(h);
      this.snow.setViewportHeight(h);
    });

    if (options.ambient) this.viewport.controls.enabled = false;
    else this.bindPointer();
    bindControls({
      togglePause: () => (this.running = !this.running) === false,
      step: () => this.advance(),
      reset: () => this.reset(),
      setSpeed: (v) => (this.gensPerSecond = v),
      setCapacity: (v) => (this.sim.settings.capacity = v),
      setMutation: (v) => (this.sim.settings.mutationRate = v),
      toggleLineage: () => (this.threads.showLineage = !this.threads.showLineage),
      toggleOrbit: () => (this.viewport.controls.autoRotate = !this.viewport.controls.autoRotate),
      isOrbiting: () => this.viewport.controls.autoRotate,
    });
    window.setTimeout(() => $('hint').classList.add('gone'), 25000);
  }

  start(): void {
    this.hud.update(this.sim);
    this.timer.connect(document);
    this.viewport.renderer.setAnimationLoop((t) => this.frame(t));
  }

  private frame(timestamp?: number): void {
    this.timer.update(timestamp);
    // Clamped at both ends: long stalls (tab switches) and out-of-order timestamps would otherwise destabilize motion.
    const dt = Math.min(Math.max(this.timer.getDelta(), 0), 1 / 20);
    this.time += dt;

    if (this.running) {
      this.tickDebt += dt * this.gensPerSecond;
      let ticks = 0;
      while (this.tickDebt >= 1 && ticks < MAX_TICKS_PER_FRAME) {
        this.advance();
        this.tickDebt -= 1;
        ticks++;
      }
      if (ticks === MAX_TICKS_PER_FRAME) this.tickDebt = 0;
      this.motion.step(this.sim.organisms, dt, this.time);
    }

    this.organisms.update(this.sim.organisms, dt, this.time, 1 / this.gensPerSecond, this.running);
    this.threads.update(this.sim.organisms, (id) => this.organisms.visualOf(id)?.born ?? Infinity);
    this.sparks.update(dt);
    this.snow.update(this.time);
    this.backdrop.update(this.time, this.sim.tideLevel());
    this.backdrop.mesh.position.copy(this.viewport.camera.position);

    this.followColony(dt);
    this.updateOpening(dt);
    this.viewport.controls.update(dt);

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.15;
      this.hud.update(this.sim);
    }

    this.viewport.render(this.time);
  }

  private advance(): void {
    const result = this.sim.tick();
    playTickEffects(result, this.organisms, this.sparks, 1 / this.gensPerSecond);
    this.narrator.observe(this.sim, result);
    if (result.newEpoch) this.organisms.clear();
    this.chart.draw(this.sim.history, this.sim.generation);
    this.spectrum.draw(this.sim.organisms);
  }

  private reset(): void {
    this.sim.reset();
    this.organisms.clear();
    this.sparks.clear();
    this.narrator.reset();
    this.tickDebt = 0;
    this.chart.draw(this.sim.history, this.sim.generation);
    this.spectrum.draw(this.sim.organisms);
    this.hud.update(this.sim);
  }

  /** Eases the orbit pivot toward the living colony's center as the current carries it around. */
  private followColony(dt: number): void {
    let x = 0;
    let y = 0;
    let z = 0;
    let n = 0;
    for (const o of this.sim.organisms) {
      if (o.stage === Stage.Husk) continue;
      x += o.x;
      y += o.y;
      z += o.z;
      n++;
    }
    if (n === 0) return;
    const ease = 1 - Math.exp(-dt * 0.35);
    const target = this.viewport.controls.target;
    const before = target.clone();
    target.lerp(this.centroid.set(x / n, y / n, z / n), ease);
    // Move the camera with the pivot so following never changes the viewing distance.
    this.viewport.camera.position.add(target.clone().sub(before));
  }

  /** Opens close on the lone founding spore, then pulls back as the colony grows. */
  private updateOpening(dt: number): void {
    if (this.opening === null) return;
    this.opening += dt;
    const t = Math.min(1, this.opening / OPENING_SECONDS);
    const eased = t * t * (3 - 2 * t);
    const camera = this.viewport.camera;
    const target = this.viewport.controls.target;
    const offset = camera.position.clone().sub(target).setLength(24 + (HOME_DISTANCE - 24) * eased);
    camera.position.copy(target).add(offset);
    if (t >= 1) this.opening = null;
  }

  private bindPointer(): void {
    const controls = this.viewport.controls;
    controls.addEventListener('start', () => {
      this.opening = null;
      this.canvas.classList.add('grabbing');
    });
    controls.addEventListener('end', () => {
      this.canvas.classList.remove('grabbing');
    });

    let down: { x: number; y: number } | null = null;
    this.canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
    this.canvas.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP_PX) return;
      down = null;
      this.seedAt(e.clientX, e.clientY);
    });
  }

  /** Plants a founder where the click ray crosses the plane through the colony's center, facing the camera. */
  private seedAt(clientX: number, clientY: number): void {
    const camera = this.viewport.camera;
    const ndc = new Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    const ray = new Raycaster();
    ray.setFromCamera(ndc, camera);
    const normal = camera.getWorldDirection(new Vector3());
    const hit = ray.ray.intersectPlane(new Plane(normal, 0), new Vector3());
    if (!hit) return;
    if (hit.length() > WORLD_RADIUS) hit.setLength(WORLD_RADIUS);

    const founder = this.sim.found(hit.x, hit.y, hit.z, {
      hue: Math.random(),
      strategy: 0.3 + Math.random() * 0.4,
    });
    this.narrator.seeded(founder.lineage, founder.genome.hue);
    $('hint').classList.add('gone');
  }
}
