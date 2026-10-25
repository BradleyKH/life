import type { Simulation } from '../sim/simulation';
import { STAGES } from '../sim/stages';
import { $, fmt } from './dom';

/** Live stats panel and per-stage legend. */
export class Hud {
  private readonly epoch = $('stat-epoch');
  private readonly gen = $('stat-gen');
  private readonly living = $('stat-living');
  private readonly peak = $('stat-peak');
  private readonly depth = $('stat-depth');
  private readonly tide = $('stat-tide');
  private readonly strategy = $('strategy-mark');
  private readonly counts: HTMLElement[] = [];
  private readonly bars: HTMLElement[] = [];

  constructor() {
    const legend = $('legend');
    for (const stage of STAGES) {
      const li = document.createElement('li');
      li.style.setProperty('--c', stage.css);
      li.innerHTML = `<span class="glyph">${stage.glyph}</span><span class="name">${stage.name}</span><span class="count">0</span><span class="bar"><i></i></span>`;
      legend.append(li);
      this.counts.push(li.querySelector('.count')!);
      this.bars.push(li.querySelector('.bar i')!);
    }
  }

  update(sim: Simulation): void {
    const counts = sim.counts();
    const total = Math.max(1, counts.reduce((a, b) => a + b, 0));
    const living = sim.livingCount();
    this.epoch.textContent = String(sim.epoch);
    this.gen.textContent = fmt(sim.generation);
    this.living.textContent = fmt(living);
    this.peak.textContent = fmt(sim.peak);
    this.depth.textContent = fmt(sim.maxDepth());

    const tide = sim.effectiveCapacity() / sim.settings.capacity - 1;
    this.tide.textContent = `${tide >= 0 ? '+' : '−'}${Math.abs(Math.round(tide * 100))}%`;
    this.tide.style.color = tide >= 0 ? '#7ff5e0' : '#9aa9ff';

    if (living > 0) this.strategy.style.left = `${sim.meanStrategy() * 100}%`;
    counts.forEach((n, i) => {
      this.counts[i].textContent = fmt(n);
      this.bars[i].style.width = `${(n / total) * 100}%`;
    });
  }
}
