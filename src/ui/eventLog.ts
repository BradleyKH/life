import { $ } from './dom';

const MAX_ENTRIES = 4;
const LINGER_MS = 5200;

/** Transient narration of notable moments: extinctions, blights, new epochs. */
export class EventLog {
  private readonly list = $('log');

  /** `html` is trusted markup built by the app, never user input. */
  post(html: string, color?: string): void {
    const li = document.createElement('li');
    li.innerHTML = html;
    if (color) li.style.setProperty('--c', color);
    this.list.prepend(li);
    while (this.list.children.length > MAX_ENTRIES) this.list.lastElementChild!.remove();
    window.setTimeout(() => {
      li.classList.add('fading');
      window.setTimeout(() => li.remove(), 1000);
    }, LINGER_MS);
  }
}
