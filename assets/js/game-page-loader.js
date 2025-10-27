
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

export async function loadGamePage() {
    const container = document.getElementById('game-container');
    if (!container) {
        console.error('Error: #game-container element not found.');
        return;
    }

    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        // 1. Fetch all necessary files concurrently from the current directory
        const [metaResponse, contentResponse, descResponse] = await Promise.all([
            fetch('./meta.json'),
            fetch('./content.html'),
            fetch('./description.md')
        ]);

        if (!metaResponse.ok) throw new Error('game.json not found.');
        if (!contentResponse.ok) throw new Error('content.html not found.');

        const meta = await metaResponse.json();
        const contentHtml = await contentResponse.text();

        let descriptionHtml = '';
        if (descResponse.ok) {
            const markdown = await descResponse.text();
            descriptionHtml = `<div class="tool-card">${marked.parse(markdown)}</div>`;
        }

        // 2. Update page title
        document.title = `${meta.name} | My Web Games`;

        // 3. Construct and inject final HTML
        container.innerHTML = `
            <h2>${meta.name}</h2>
            <div class="tool-card">
                ${contentHtml}
            </div>
            ${descriptionHtml}
        `;

        // 4. Load game-specific script if it exists
        if (meta.script) {
            const script = document.createElement('script');
            script.src = `./${meta.script}`;
            script.type = 'module';
            document.body.appendChild(script);
        }

        // 5. Load game-specific stylesheet if it exists
        if (meta.style) {
            const style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = `./${meta.style}`;
            document.head.appendChild(style);
        }

    } catch (error) {
        console.error('Error loading game:', error);
        container.innerHTML = `<p>Error: Failed to load game. Check the console for details.</p>`;
        document.title = 'Game Loading Failed | My Web Games';
    }
}
