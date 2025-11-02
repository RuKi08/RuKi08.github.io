const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// --- Configuration ---
const rootDir = path.join(__dirname, '..');

// --- Helper Functions ---
function toSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// --- File Content Templates ---
const metaTemplate = (name, itemType) => {
    const styleLine = itemType === 'game' ? `,
  "style": "style.css"` : '';
    return `{ 
  "name": "${name}",
  "description": "A brief description of this item.",
  "icon": "fa-solid fa-star",
  "tags": [],
  "script": "script.js"${styleLine}
}`;
};

const contentTemplate = (slug) => `<!-- The main HTML content for ${slug} goes here -->
<div id="${slug}-container">
    <h2>Welcome to ${slug}!</h2>
</div>
`;

const scriptTemplate = () => `// Standardized init function
export function init() {
    console.log('Item initialized!');
    // Add your logic here
}
`;

const styleTemplate = (slug) => `/* Add styles for ${slug} here */
#${slug}-container {
    /* ... */
}
`;

const descriptionTemplate = (name) => `## About ${name}

More detailed information about this item.
`;

const indexTemplate = () => `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loading...</title>
    <script>
        (async () => {
            try {
                const response = await fetch('../template.html');
                if (!response.ok) {
                    throw new Error('Failed to fetch template: ' + response.statusText);
                }
                const templateHtml = await response.text();
                document.open();
                document.write(templateHtml);
                document.close();
            } catch (error) {
                console.error('Error loading template:', error);
                document.body.innerHTML = '<h2>Error</h2><p>Could not load page content. Please check the console for details.</p>';
            }
        })();
    </script>
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
        <p>Loading...</p>
    </div>
</body>
</html>`;


// --- Main Scaffolding Logic ---
function generate() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node scripts/generate.js <game|tool> "<Item Name>"');
        return;
    }

    const [itemType, itemName] = args;

    if (itemType !== 'game' && itemType !== 'tool') {
        console.error('Error: Invalid item type. Must be "game" or "tool".');
        return;
    }

    const itemSlug = toSlug(itemName);
    const targetDir = path.join(rootDir, itemType, itemSlug);

    console.log(`Generating new ${itemType}: "${itemName}"`);
    console.log(`Directory: ${targetDir}`);

    if (fs.existsSync(targetDir)) {
        console.error(`Error: Directory already exists: ${targetDir}`);
        return;
    }

    try {
        fs.mkdirSync(targetDir, { recursive: true });

        const files = {
            'index.html': indexTemplate(),
            'meta.json': metaTemplate(itemName, itemType),
            'content.html': contentTemplate(itemSlug),
            'script.js': scriptTemplate(),
            'description.md': descriptionTemplate(itemName)
        };

        if (itemType === 'game') {
            files['style.css'] = styleTemplate(itemSlug);
        }

        for (const [fileName, content] of Object.entries(files)) {
            const filePath = path.join(targetDir, fileName);
            fs.writeFileSync(filePath, content);
            console.log(`  -> Created ${filePath}`);
        }

        console.log(`
Successfully created all files for "${itemName}".`);

        console.log('\nRunning build script to update item list...');
        exec('node scripts/build.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error running build script: ${error}`);
                return;
            }
            if (stderr) {
                console.error(`Build script stderr: ${stderr}`);
            }
            console.log(`Build script output: 
${stdout}`);
            console.log('✨ All done! Your new ' + itemType + ' is ready. ✨');
        });

    } catch (error) {
        console.error(`An error occurred during generation:`, error);
    }
}

generate();
