function createHeader() {
    const header = document.createElement('header');
    header.innerHTML = `
        <div class="logo"><a href="/"><span class="logo-ctrl">ctrl</span><span class="logo-cat">cat</span></a></div>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/tool">Tools</a></li>
                <li><a href="/game">Games</a></li>
            </ul>
        </nav>
        <button id="theme-toggle" aria-label="Toggle theme">☀️</button>
    `;
    return header;
}

function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
        <nav class="footer-nav">
            <a href="/terms.html">Terms of Service</a>
            <a href="/privacy.html">Privacy Policy</a>
            <a href="/licenses.html">Licenses</a>
        </nav>
        <p class="copyright">&copy; 2025 ctrlcat. All rights reserved.</p>
    `;
    return footer;
}

export { createHeader, createFooter };
