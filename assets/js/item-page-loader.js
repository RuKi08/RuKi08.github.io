import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

export async function loadItemPage(itemType, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Error: #${containerId} element not found.`);
        return;
    }

    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const pathParts = window.location.pathname.split('/');
        const itemDir = pathParts[pathParts.length - 2]; // e.g., 'gomoku' from '/game/gomoku/'

        // 1. Fetch all necessary files concurrently from the current directory
        const [metaResponse, contentResponse, descResponse] = await Promise.all([
            fetch('./meta.json'),
            fetch('./content.html'),
            fetch('./description.md')
        ]);

        if (!metaResponse.ok) throw new Error('meta.json not found.');
        if (!contentResponse.ok) throw new Error('content.html not found.');

        const meta = await metaResponse.json();
        const contentHtml = await contentResponse.text();

        let descriptionHtml = '';
        if (descResponse.ok) {
            const markdown = await descResponse.text();
            descriptionHtml = `<div class="tool-card">${marked.parse(markdown)}</div>`;
        }

        // 2. Update page title
        document.title = `${meta.name} | My Web ${itemType === 'game' ? 'Games' : 'Tools'}`;

        // 3. Construct and inject final HTML
        container.innerHTML = `
            <h2>${meta.name}</h2>
            <div class="tool-card">
                ${contentHtml}
            </div>
            ${descriptionHtml}
        `;

        // 4. Load item-specific script if it exists
        if (meta.script) {
            const scriptPath = `../../${itemType}/${itemDir}/${meta.script}`;
            const itemModule = await import(scriptPath);

            const cleanItemName = meta.name.replace(/\s|\(|\)/g, '');
            const initFunctionName = `init${cleanItemName}${itemType === 'game' ? 'Game' : 'Tool'}`;

            if (itemModule[initFunctionName]) {
                itemModule[initFunctionName](container); // Pass the container element
            } else {
                console.error(`Error: Init function ${initFunctionName} not found in ${meta.script}`);
            }
        }

        // 5. Load item-specific stylesheet if it exists
        if (meta.style) {
            const style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = `./${meta.style}`;
            document.head.appendChild(style);
        }

    } catch (error) {
        console.error(`Error loading ${itemType}:`, error);
        container.innerHTML = `<p>Error: Failed to load ${itemType}. Check the console for details.</p>`;
        document.title = `${itemType} Loading Failed | My Web ${itemType === 'game' ? 'Games' : 'Tools'}`;
    }
}
