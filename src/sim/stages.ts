export const Stage = {
  Spore: 0,
  Larva: 1,
  Adult: 2,
  Bloom: 3,
  Elder: 4,
  Husk: 5,
} as const;

export type Stage = (typeof Stage)[keyof typeof Stage];

export const STAGE_COUNT = 6;

export interface StageInfo {
  /** The glyph each stage had in the original text version. */
  glyph: string;
  name: string;
  /** Base chance of dying at the end of a generation spent in this stage. */
  deathChance: number;
  /** Representative color for legends and charts. */
  css: string;
}

export const STAGES: readonly StageInfo[] = [
  { glyph: '.', name: 'Spore', deathChance: 0.05, css: '#9be7ff' },
  { glyph: 'o', name: 'Larva', deathChance: 0.05, css: '#3ff0d0' },
  { glyph: 'O', name: 'Adult', deathChance: 0.05, css: '#48b5ff' },
  { glyph: '@', name: 'Bloom', deathChance: 0.1, css: '#ff5fd2' },
  { glyph: '0', name: 'Elder', deathChance: 0.2, css: '#a68bff' },
  { glyph: '-', name: 'Husk', deathChance: 1, css: '#4f6680' },
];

/**
 * Offspring distribution when an organism advances out of a stage, as
 * [count, cumulative probability] pairs. Mirrors the original model: larvae
 * spawn one spore half the time, adults always bloom with 1-3 spores, blooms
 * occasionally release one more.
 */
export const SPAWN_TABLE: Record<number, readonly (readonly [number, number])[]> = {
  [Stage.Larva]: [
    [0, 0.5],
    [1, 1],
  ],
  [Stage.Adult]: [
    [1, 0.26],
    [2, 0.68],
    [3, 1],
  ],
  [Stage.Bloom]: [
    [1, 0.45],
    [0, 1],
  ],
};

/** Generations a husk lingers (sinking and dissolving) before it is gone. */
export const HUSK_GENERATIONS = 4;
