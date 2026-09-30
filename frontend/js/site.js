import { setBg, watchSections, reveal } from './bg.js';
setBg(document.body.dataset.bg || 'landing'); watchSections(); reveal();
