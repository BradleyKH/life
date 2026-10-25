import './style.css';
import { App } from './app';

const ambient = !new URLSearchParams(location.search).has('disableAmbient');
document.body.classList.toggle('ambient', ambient);

new App(document.getElementById('scene') as HTMLCanvasElement, { ambient }).start();
