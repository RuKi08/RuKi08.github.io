export function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        // Remove .html for comparison if present
        const linkPath = link.getAttribute('href').replace('.html', '');
        const targetId = link.getAttribute('data-target');

        // Special handling for home page: / or /home.html
        if (targetId === 'home' && (currentPath === '/' || currentPath === '/home.html')) {
            link.classList.add('active');
        } else if (currentPath.includes(linkPath) && targetId !== 'home') {
            link.classList.add('active');
        }
    });
}
