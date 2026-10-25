import './style.css';
import { App } from './app';

// Accepted in the hash too, since some wallpaper hosts drop the query string from local file URLs.
const ambient = new URLSearchParams(location.search).has('ambient') || location.hash === '#ambient';
document.body.classList.toggle('ambient', ambient);

new App(document.getElementById('scene') as HTMLCanvasElement, { ambient }).start();
