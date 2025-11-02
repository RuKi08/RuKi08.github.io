const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const gameDir = path.join(rootDir, 'game');
const toolDir = path.join(rootDir, 'tool');
const outputDir = path.join(rootDir, 'assets', 'data');
const outputFile = path.join(outputDir, 'items.json');

function getSubdirectories(dir) {
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

function getMetadata(itemDir, itemName) {
    const metaPath = path.join(itemDir, itemName, 'meta.json');
    if (fs.existsSync(metaPath)) {
        try {
            const metaContent = fs.readFileSync(metaPath, 'utf8');
            const meta = JSON.parse(metaContent);
            meta.dir = itemName; // Inject the directory name
            return meta;
        } catch (error) {
            console.error(`Error reading or parsing meta.json for ${itemName}:`, error);
            return null;
        }
    }
    return null;
}

function build() {
    console.log('Starting build process...');

    const gameDirs = getSubdirectories(gameDir);
    const toolDirs = getSubdirectories(toolDir);

    const allItems = {
        games: [],
        tools: []
    };

    console.log('Processing games...');
    for (const dir of gameDirs) {
        const meta = getMetadata(gameDir, dir);
        if (meta) {
            allItems.games.push(meta);
        }
    }

    console.log('Processing tools...');
    for (const dir of toolDirs) {
        const meta = getMetadata(toolDir, dir);
        if (meta) {
            allItems.tools.push(meta);
        }
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        fs.writeFileSync(outputFile, JSON.stringify(allItems, null, 4));
        console.log(`Successfully built ${outputFile}`);
    } catch (error) {
        console.error('Error writing items.json:', error);
    }

    console.log('Build process finished.');
}

build();
