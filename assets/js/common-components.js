function createHeader() {
    const header = document.createElement('header');
    header.innerHTML = `
        <div class="logo"><a href="/">My Web</a></div>
        <nav>
            <ul>
                <li><a href="/home">Home</a></li>
                <li><a href="/portfolio">Portfolio</a></li>
                <li><a href="/tool">AllTheTools</a></li>
                <li><a href="/game">Games</a></li>
            </ul>
        </nav>
        <button id="theme-toggle" aria-label="Toggle theme">☀️</button>
    `;
    return header;
}

function createFooter() {
    const footer = document.createElement('footer');
    footer.innerHTML = `
        <p>&copy; 2024 My Web. All rights reserved.</p>
    `;
    return footer;
}

export { createHeader, createFooter };
