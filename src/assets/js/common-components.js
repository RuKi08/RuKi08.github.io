const siteConfig = {
    defaultLang: 'en',
    languages: ['en', 'ko']
};

function getPathContext() {
    const path = window.location.pathname;
    const pathParts = path.split('/');
    const langCode = pathParts[1];

    if (siteConfig.languages.includes(langCode) && langCode !== siteConfig.defaultLang) {
        return {
            lang: langCode,
            langPrefix: `/${langCode}`,
            basePath: path.replace(`/${langCode}`, '') || '/'
        };
    }

    return {
        lang: siteConfig.defaultLang,
        langPrefix: '',
        basePath: path
    };
}

function initializeHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    const { lang, langPrefix, basePath } = getPathContext();

    // Update nav links
    const navLinks = header.querySelectorAll('nav a');
    navLinks.forEach(link => {
        const originalHref = link.getAttribute('href');
        if (originalHref === '/') {
            link.href = langPrefix || '/';
        } else {
            link.href = `${langPrefix}${originalHref}`;
        }
    });
    // Also update the logo link
    header.querySelector('.logo a').href = langPrefix || '/';

    // Update language switcher links
    const enLink = header.querySelector('.lang-dropdown a[data-lang="en"]');
    const koLink = header.querySelector('.lang-dropdown a[data-lang="ko"]');
    
    if (enLink) {
        enLink.href = basePath;
    }
    if (koLink) {
        koLink.href = `/ko${basePath}`;
    }
}

function initializeFooter() {
    const footer = document.querySelector('footer.site-footer');
    if (!footer) return;

    const { langPrefix } = getPathContext();
    if (langPrefix) {
        const footerLinks = footer.querySelectorAll('.footer-nav a');
        footerLinks.forEach(link => {
            const originalHref = link.getAttribute('href');
            link.href = `${langPrefix}${originalHref}`;
        });
    }
}

export { initializeHeader, initializeFooter };
