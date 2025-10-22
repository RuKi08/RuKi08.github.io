import { initNavigation } from './modules/navigation.js';
import { initThemeToggle } from './modules/theme.js';
import { initTextReverser } from './modules/tools.js';
import { initSecretBox } from './modules/secretbox.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initThemeToggle();
    initTextReverser();
    initSecretBox();
});