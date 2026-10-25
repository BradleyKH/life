import type { Simulation, TickResult } from '../sim/simulation';
import { Stage } from '../sim/stages';
import { fmt } from './dom';
import type { EventLog } from './eventLog';

const MILESTONES = [100, 1000, 2500, 5000];

/** Watches the simulation and narrates the moments worth noticing. */
export class Narrator {
  private reached = new Set<number>();
  private lineages = new Set<number>();
  private lastTideRising: boolean | null = null;

  constructor(private readonly log: EventLog) {}

  reset(): void {
    this.reached.clear();
    this.lineages.clear();
    this.lastTideRising = null;
  }

  seeded(lineage: number, hue: number): void {
    this.lineages.add(lineage);
    this.log.post(`A new spore drifts down. Lineage <b>#${lineage}</b> begins.`, `hsl(${hue * 360}, 95%, 65%)`);
  }

  observe(sim: Simulation, result: TickResult): void {
    if (result.extinct) {
      this.log.post('<b>Extinction.</b> The deep goes dark.', '#ff6b9a');
    }
    if (result.newEpoch) {
      this.reset();
      this.log.post(`<b>Epoch ${sim.epoch}.</b> A lone spore drifts in from the dark.`, '#9be7ff');
    }
    if (result.blight && result.blight.killed > 0) {
      this.log.post(`A <b>blight</b> sweeps through the colony. ${fmt(result.blight.killed)} lost.`, '#ff4f86');
    }

    const living = sim.livingCount();
    for (const m of MILESTONES) {
      if (living >= m && !this.reached.has(m)) {
        this.reached.add(m);
        this.log.post(`The colony passes <b>${fmt(m)}</b> living.`, '#3ff0d0');
      }
    }

    const rising = sim.tideRising();
    if (this.lastTideRising !== null && rising !== this.lastTideRising && living > 50) {
      this.log.post(rising ? 'The tide turns. Nutrients <b>rise</b>.' : 'The tide <b>ebbs</b>. Lean times ahead.', rising ? '#7ff5e0' : '#9aa9ff');
    }
    this.lastTideRising = rising;

    const alive = new Set<number>();
    for (const o of sim.organisms) if (o.stage !== Stage.Husk) alive.add(o.lineage);
    for (const id of alive) this.lineages.add(id);
    if (alive.size > 0) {
      for (const id of this.lineages) {
        if (!alive.has(id)) {
          this.log.post(`Lineage <b>#${id}</b> has died out.`, '#a68bff');
          this.lineages.delete(id);
        }
      }
    }
  }
}
