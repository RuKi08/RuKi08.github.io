const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// --- Configuration ---
const rootDir = path.join(__dirname, '..', 'src');
const i18nDir = path.join(rootDir, 'i18n');

// --- Helper Functions ---
function toSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// --- File Content Templates ---
const metaTemplate = (itemType) => {
    const styleLine = itemType === 'game' ? `,
  "style": "style.css"` : '';
    return `{ 
  "name": "{{__i18n.name__}}",
  "description": "{{__i18n.description__}}",
  "icon": "fa-solid fa-star",
  "tags": [],
  "script": "script.js"${styleLine}
}`;
};

const contentTemplate = (slug) => `<!-- The main HTML content for ${slug} goes here -->
<div id="${slug}-container">
    <h2>{{__i18n.content.title__}}</h2>
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

const i18nEntryTemplate = (name) => ({
    name: name,
    description: `A brief description of ${name}.`,
    content: {
        title: `Welcome to ${name}!`
    },
    desc: {
        title: `### About ${name}`,
        main: `More detailed information about this item.`
    }
});

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
    const targetDir = path.join(rootDir, 'content', itemType, itemSlug);

    console.log(`Generating new ${itemType}: "${itemName}"`);
    console.log(`Directory: ${targetDir}`);

    if (fs.existsSync(targetDir)) {
        console.error(`Error: Directory already exists: ${targetDir}`);
        return;
    }

    try {
        // 1. Create item directory and files
        fs.mkdirSync(targetDir, { recursive: true });

        const files = {
            'meta.json': metaTemplate(itemType),
            'content.html': contentTemplate(itemSlug),
            'script.js': scriptTemplate(),
        };

        if (itemType === 'game') {
            files['style.css'] = styleTemplate(itemSlug);
        }

        for (const [fileName, content] of Object.entries(files)) {
            const filePath = path.join(targetDir, fileName);
            fs.writeFileSync(filePath, content);
            console.log(`  -> Created ${filePath}`);
        }

        // 2. Update i18n files
        console.log('Updating i18n files...');
        const languages = ['en', 'ko'];
        languages.forEach(lang => {
            const langPath = path.join(i18nDir, `${lang}.json`);
            if (fs.existsSync(langPath)) {
                const translations = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
                translations[itemSlug] = i18nEntryTemplate(itemName);
                fs.writeFileSync(langPath, JSON.stringify(translations, null, 4));
                console.log(`  -> Updated ${lang}.json with entry for '${itemSlug}'`);
            }
        });

        console.log(`
Successfully created all files for "${itemName}".`);

        // 3. Run build script
        console.log('\nRunning build script to update item list...');
        exec('npm run build', (error, stdout, stderr) => {
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
