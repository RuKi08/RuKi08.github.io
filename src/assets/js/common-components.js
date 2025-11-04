const siteConfig = {
    defaultLang: 'en',
    languages: ['en', 'ko']
};

function getPathContext() {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(p => p); // Filter out empty strings

    let lang = siteConfig.defaultLang;
    let langPrefix = '';
    let basePath = path;

    if (pathParts.length > 0 && siteConfig.languages.includes(pathParts[0]) && pathParts[0] !== siteConfig.defaultLang) {
        lang = pathParts[0];
        langPrefix = `/${lang}`;
        // Reconstruct basePath without the language part
        basePath = '/' + pathParts.slice(1).join('/');
    }

    return { lang, langPrefix, basePath };
}

function initializeHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    // --- Hide header on scroll ---
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        if (window.scrollY > lastScrollY) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
        lastScrollY = window.scrollY;
    });

    const { lang, langPrefix, basePath } = getPathContext();

    // Update nav links
    const navLinks = header.querySelectorAll('nav a');
    navLinks.forEach(link => {
        let originalHref = link.dataset.originalHref;
        if (!originalHref) {
            originalHref = link.getAttribute('href');
            link.dataset.originalHref = originalHref;
        }
        // Ensure we don't double-prefix
        const newHref = originalHref === '/' ? (langPrefix || '/') : `${langPrefix}${originalHref}`;
        link.href = newHref;
    });
    header.querySelector('.logo a').href = langPrefix || '/';

    // Update language switcher links
    const enLink = header.querySelector('.lang-dropdown a[data-lang="en"]');
    const koLink = header.querySelector('.lang-dropdown a[data-lang="ko"]');

    // Ensure basePath doesn't have double slashes if it's not just "/"
    const cleanBasePath = (basePath !== '/' && basePath.endsWith('/')) ? basePath.slice(0, -1) : basePath;

    if (enLink) {
        enLink.href = cleanBasePath;
    }
    if (koLink) {
        // Prevent /ko//path issues
        koLink.href = cleanBasePath === '/' ? '/ko' : `/ko${cleanBasePath}`;
    }
}

function initializeFooter() {
    const footer = document.querySelector('footer.site-footer');
    if (!footer) return;

    const { langPrefix } = getPathContext();
    const footerLinks = footer.querySelectorAll('.footer-nav a');
    footerLinks.forEach(link => {
        let originalHref = link.dataset.originalHref;
        if (!originalHref) {
            originalHref = link.getAttribute('href');
            link.dataset.originalHref = originalHref;
        }
        link.href = `${langPrefix}${originalHref}`;
    });
}

export { initializeHeader, initializeFooter };
