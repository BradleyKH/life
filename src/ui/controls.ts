import { $ } from './dom';

export interface ControlHandlers {
  togglePause(): boolean;
  step(): void;
  reset(): void;
  setSpeed(gensPerSecond: number): void;
  setCapacity(capacity: number): void;
  setMutation(rate: number): void;
  toggleLineage(): boolean;
  toggleOrbit(): boolean;
  isOrbiting(): boolean;
}

/** Slider position 0..100 maps exponentially onto 0.25..12 generations per second. */
function speedFromSlider(v: number): number {
  return 0.25 * Math.pow(48, v / 100);
}

function paintFill(input: HTMLInputElement): void {
  const min = Number(input.min);
  const max = Number(input.max);
  input.style.setProperty('--fill', `${((Number(input.value) - min) / (max - min)) * 100}%`);
}

/** Wires the dock's buttons, sliders, and keyboard shortcuts to the app. */
export function bindControls(h: ControlHandlers): void {
  const pause = $('btn-pause');
  const hud = $('hud');
  const lineage = $('tg-lineage');
  const orbit = $('tg-orbit');
  const hideHud = $('tg-hud');

  const doPause = () => {
    const paused = h.togglePause();
    pause.classList.toggle('paused', paused);
    pause.title = paused ? 'Resume (Space)' : 'Pause (Space)';
    pause.setAttribute('aria-label', paused ? 'Resume' : 'Pause');
  };
  const doLineage = () => lineage.classList.toggle('on', h.toggleLineage());
  const doOrbit = () => orbit.classList.toggle('on', h.toggleOrbit());
  const doHud = () => hud.classList.toggle('hidden');

  pause.addEventListener('click', doPause);
  $('btn-step').addEventListener('click', () => h.step());
  $('btn-reset').addEventListener('click', () => h.reset());
  lineage.addEventListener('click', doLineage);
  orbit.addEventListener('click', doOrbit);
  hideHud.addEventListener('click', doHud);
  $('btn-show').addEventListener('click', doHud);
  orbit.classList.toggle('on', h.isOrbiting());

  const slider = (id: string, out: string, map: (v: number) => number, show: (v: number) => string, apply: (v: number) => void) => {
    const input = $<HTMLInputElement>(id);
    const output = $(out);
    const sync = () => {
      const value = map(Number(input.value));
      output.textContent = show(value);
      paintFill(input);
      apply(value);
    };
    input.addEventListener('input', sync);
    sync();
  };

  slider('in-speed', 'out-speed', speedFromSlider, (v) => (v < 1 ? v.toFixed(2) : v.toFixed(1)), h.setSpeed);
  slider('in-capacity', 'out-capacity', (v) => v, (v) => String(v), h.setCapacity);
  slider('in-mutation', 'out-mutation', (v) => v / 10, (v) => v.toFixed(1), h.setMutation);

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        doPause();
        break;
      case 's':
        h.step();
        break;
      case 'r':
        h.reset();
        break;
      case 'l':
        doLineage();
        break;
      case 'o':
        doOrbit();
        break;
      case 'h':
        doHud();
        break;
    }
  });
}
