
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

export async function loadToolPage() {
    const container = document.getElementById('tool-container');
    if (!container) {
        console.error('Error: #tool-container element not found.');
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

        if (!metaResponse.ok) throw new Error('tool.json not found.');
        if (!contentResponse.ok) throw new Error('content.html not found.');

        const meta = await metaResponse.json();
        const contentHtml = await contentResponse.text();

        let descriptionHtml = '';
        if (descResponse.ok) {
            const markdown = await descResponse.text();
            descriptionHtml = `<div class="tool-card">${marked.parse(markdown)}</div>`;
        }

        // 2. Update page title
        document.title = `${meta.name} | My Web Tools`;

        // 3. Construct and inject final HTML
        container.innerHTML = `
            <h2>${meta.name}</h2>
            <div class="tool-card">
                ${contentHtml}
            </div>
            ${descriptionHtml}
        `;

        // 4. Load tool-specific script if it exists
        if (meta.script) {
            const script = document.createElement('script');
            // The script path is relative to the tool's directory
            script.src = `./${meta.script}`;
            script.type = 'module';
            document.body.appendChild(script);
        }

    } catch (error) {
        console.error('Error loading tool:', error);
        container.innerHTML = `<p>Error: Failed to load tool. Check the console for details.</p>`;
        document.title = 'Tool Loading Failed | My Web Tools';
    }
}
