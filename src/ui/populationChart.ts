import type { Snapshot } from '../sim/simulation';
import { STAGES, Stage } from '../sim/stages';
import { $, fitCanvas } from './dom';

/** Draw order bottom to top; husks sit on top as a thin dim crust. */
const ORDER = [Stage.Elder, Stage.Bloom, Stage.Adult, Stage.Larva, Stage.Spore, Stage.Husk];

/** Stacked, glowing area chart of the population by stage over recent generations. */
export class PopulationChart {
  private readonly canvas = $<HTMLCanvasElement>('chart');
  private readonly range = $('chart-range');

  draw(history: readonly Snapshot[], generation: number): void {
    if (!this.canvas.offsetParent) return;
    const ctx = fitCanvas(this.canvas);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(150, 230, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = Math.round((h * i) / 4) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (history.length < 2) return;
    let max = 1;
    for (const s of history) max = Math.max(max, s.counts.reduce((a, b) => a + b, 0));
    max *= 1.08;

    const n = history.length;
    const xAt = (i: number) => (i / (n - 1)) * w;
    const base = new Float32Array(n);

    ctx.globalCompositeOperation = 'lighter';
    for (const stage of ORDER) {
      const top = new Float32Array(n);
      for (let i = 0; i < n; i++) top[i] = base[i] + history[i].counts[stage];

      const color = STAGES[stage].css;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, hexAlpha(color, 0.55));
      grad.addColorStop(1, hexAlpha(color, 0.08));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, h - (top[0] / max) * h);
      for (let i = 1; i < n; i++) ctx.lineTo(xAt(i), h - (top[i] / max) * h);
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(xAt(i), h - (base[i] / max) * h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, h - (top[0] / max) * h);
      for (let i = 1; i < n; i++) ctx.lineTo(xAt(i), h - (top[i] / max) * h);
      ctx.stroke();
      ctx.shadowBlur = 0;

      base.set(top);
    }
    ctx.globalCompositeOperation = 'source-over';

    this.range.textContent = `gen ${Math.max(0, generation - n + 1)}–${generation}`;
  }
}

function hexAlpha(hex: string, alpha: number): string {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
}
