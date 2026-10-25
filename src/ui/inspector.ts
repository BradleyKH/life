import { Vector3, type Camera } from 'three';
import type { Organism } from '../sim/simulation';
import { STAGES, Stage } from '../sim/stages';
import { $ } from './dom';

const PICK_RADIUS_PX = 18;

/** Hover picking in screen space, with a tracking reticle and an info card. */
export class Inspector {
  private readonly reticle = $('reticle');
  private readonly tooltip = $('tooltip');
  private readonly projected = new Vector3();
  private pointer: { x: number; y: number } | null = null;
  private target: Organism | null = null;
  private lastHtml = '';

  constructor(canvas: HTMLCanvasElement) {
    canvas.addEventListener('pointermove', (e) => {
      this.pointer = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null;
    });
    canvas.addEventListener('pointerleave', () => (this.pointer = null));
  }

  get hovered(): Organism | null {
    return this.target;
  }

  update(organisms: readonly Organism[], camera: Camera, dragging: boolean): void {
    if (this.target && (this.target.stage === Stage.Husk || !organisms.includes(this.target))) this.target = null;
    if (this.pointer && !dragging) this.target = this.pick(organisms, camera, this.pointer);
    else if (!this.pointer) this.target = null;

    const o = this.target;
    if (!o) {
      this.reticle.classList.remove('on');
      this.tooltip.classList.remove('on');
      return;
    }

    const { x, y } = this.toScreen(o, camera);
    this.reticle.style.transform = `translate(${x}px, ${y}px)`;
    this.reticle.classList.add('on');

    const html = this.describe(o);
    if (html !== this.lastHtml) {
      this.tooltip.innerHTML = html;
      this.lastHtml = html;
    }
    const tw = this.tooltip.offsetWidth;
    const th = this.tooltip.offsetHeight;
    const tx = x + 24 + tw > window.innerWidth ? x - 24 - tw : x + 24;
    const ty = Math.min(window.innerHeight - th - 8, Math.max(8, y - th / 2));
    this.tooltip.style.transform = `translate(${tx}px, ${ty}px)`;
    this.tooltip.classList.add('on');
  }

  private pick(organisms: readonly Organism[], camera: Camera, p: { x: number; y: number }): Organism | null {
    let best: Organism | null = null;
    let bestScore = PICK_RADIUS_PX * PICK_RADIUS_PX;
    for (const o of organisms) {
      if (o.stage === Stage.Husk) continue;
      this.projected.set(o.x, o.y, o.z).project(camera);
      if (this.projected.z > 1) continue;
      const dx = ((this.projected.x + 1) / 2) * window.innerWidth - p.x;
      const dy = ((1 - this.projected.y) / 2) * window.innerHeight - p.y;
      // Slight preference for nearer organisms when several overlap.
      const score = (dx * dx + dy * dy) * (0.8 + this.projected.z * 0.2);
      if (score < bestScore) {
        bestScore = score;
        best = o;
      }
    }
    return best;
  }

  private toScreen(o: Organism, camera: Camera): { x: number; y: number } {
    this.projected.set(o.x, o.y, o.z).project(camera);
    return {
      x: ((this.projected.x + 1) / 2) * window.innerWidth,
      y: ((1 - this.projected.y) / 2) * window.innerHeight,
    };
  }

  private describe(o: Organism): string {
    const stage = STAGES[o.stage];
    const hue = Math.round(o.genome.hue * 360);
    const s = o.genome.strategy;
    const temperament = s < 0.35 ? 'hardy' : s > 0.65 ? 'prolific' : 'balanced';
    return `
      <h3 style="--c:${stage.css}"><span class="g">${stage.glyph}</span>${stage.name}</h3>
      <dl>
        <dt>Lineage</dt><dd><span class="swatch" style="--h:hsl(${hue},95%,62%)"></span>#${o.lineage}</dd>
        <dt>Descent</dt><dd>${o.depth}</dd>
        <dt>Age</dt><dd>${o.age} gen</dd>
        <dt>Strategy</dt><dd>${temperament} ${Math.round(s * 100)}</dd>
      </dl>`;
  }
}
