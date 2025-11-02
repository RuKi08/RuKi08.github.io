import { initNavigation } from './modules/navigation.js';
import { initTheme } from './modules/theme.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTheme();
});