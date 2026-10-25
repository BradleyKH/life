import { describe, expect, it } from 'vitest';
import { Simulation } from './simulation';
import { HUSK_GENERATIONS, Stage } from './stages';

const settings = { capacity: 800, mutationRate: 1 };

describe('Simulation', () => {
  it('starts from a single founding spore, like the original', () => {
    const sim = new Simulation(settings, 1);
    expect(sim.organisms).toHaveLength(1);
    expect(sim.organisms[0].stage).toBe(Stage.Spore);
    expect(sim.generation).toBe(0);
  });

  it('advances survivors one stage per generation', () => {
    const sim = new Simulation(settings, 7);
    const founder = sim.organisms[0];
    sim.tick();
    expect([Stage.Larva, Stage.Husk]).toContain(founder.stage);
  });

  it('dissolves husks after they linger', () => {
    const sim = new Simulation(settings, 3);
    const founder = sim.organisms[0];
    founder.stage = Stage.Elder;
    sim.tick();
    expect(founder.stage).toBe(Stage.Husk);
    for (let i = 0; i < HUSK_GENERATIONS; i++) sim.tick();
    expect(sim.organisms).not.toContain(founder);
  });

  it('never grows far past its carrying capacity', () => {
    for (const seed of [11, 12, 13]) {
      const sim = new Simulation(settings, seed);
      for (let i = 0; i < 400; i++) sim.tick();
      // Tides can lift capacity by up to 35%.
      expect(sim.peak).toBeLessThanOrEqual(settings.capacity * 1.5);
    }
  });

  it('usually establishes a thriving population', () => {
    let thriving = 0;
    for (let seed = 100; seed < 120; seed++) {
      const sim = new Simulation(settings, seed);
      for (let i = 0; i < 120; i++) sim.tick();
      if (sim.peak > settings.capacity * 0.3) thriving++;
    }
    expect(thriving).toBeGreaterThan(12);
  });

  it('refounds a new epoch after extinction', () => {
    const sim = new Simulation(settings, 5);
    sim.organisms = [];
    const first = sim.tick();
    expect(first.extinct).toBe(true);
    let refounded = false;
    for (let i = 0; i < 10 && !refounded; i++) refounded = sim.tick().newEpoch;
    expect(refounded).toBe(true);
    expect(sim.epoch).toBe(2);
    expect(sim.organisms.some((o) => o.stage === Stage.Spore && o.parentId === null)).toBe(true);
  });

  it('children inherit lineage and descend one generation deeper', () => {
    const sim = new Simulation(settings, 21);
    for (let i = 0; i < 30; i++) {
      for (const { parent, child } of sim.tick().births) {
        expect(child.lineage).toBe(parent.lineage);
        expect(child.depth).toBe(parent.depth + 1);
      }
    }
  });
});
