import type { Organism } from '../sim/simulation';
import { Stage } from '../sim/stages';
import { $, fitCanvas } from './dom';

const BINS = 72;

/**
 * Histogram of lineage hues among the living. Hue drifts by mutation, so a
 * single founder's descendants slowly smear across the wheel; distinct peaks
 * mean distinct sub-lineages.
 */
export class Spectrum {
  private readonly canvas = $<HTMLCanvasElement>('spectrum');
  private readonly note = $('spectrum-note');
  private readonly bins = new Float32Array(BINS);

  draw(organisms: readonly Organism[]): void {
    if (!this.canvas.offsetParent) return;
    this.bins.fill(0);
    let living = 0;
    for (const o of organisms) {
      if (o.stage === Stage.Husk) continue;
      this.bins[Math.floor(o.genome.hue * BINS) % BINS]++;
      living++;
    }
    let max = 1;
    let occupied = 0;
    for (const b of this.bins) {
      max = Math.max(max, b);
      if (b > 0) occupied++;
    }

    const ctx = fitCanvas(this.canvas);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const bw = w / BINS;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < BINS; i++) {
      const hue = (i / BINS) * 360;
      ctx.fillStyle = `hsla(${hue}, 90%, 60%, 0.1)`;
      ctx.fillRect(i * bw, h - 2, bw - 1, 2);
      const v = this.bins[i] / max;
      if (v <= 0) continue;
      const bh = Math.max(2, Math.sqrt(v) * (h - 3));
      ctx.fillStyle = `hsla(${hue}, 95%, 62%, ${0.35 + v * 0.65})`;
      ctx.shadowColor = `hsl(${hue}, 95%, 60%)`;
      ctx.shadowBlur = 6;
      ctx.fillRect(i * bw, h - bh, bw - 1, bh);
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
    this.note.textContent = living ? `${Math.round((occupied / BINS) * 360)}° spread` : '';
  }
}
