const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// --- Configuration ---
const repoName = 'my-web'; // CHANGE THIS if your repository name is different
const isProduction = process.env.GITHUB_PAGES === 'true';
const basePath = isProduction ? `/${repoName}/` : '/';

const distDir = path.join(__dirname, '..', 'dist');
const srcDir = path.join(__dirname, '..', 'src');
const contentDir = path.join(srcDir, 'content');
const assetsDir = path.join(srcDir, 'assets');
const includesDir = path.join(srcDir, '_includes');

// --- Main Build Function ---
function build() {
    console.log(`[BUILD] Starting build with base path: "${basePath}"`);

    // 1. Clean & Create Directories
    console.log('[BUILD] Cleaning dist directory...');
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    // 2. Copy Assets
    console.log('[BUILD] Copying assets...');
    copyRecursive(assetsDir, path.join(distDir, 'assets'));

    // 3. Build Pages & Collect Data
    console.log('[BUILD] Building pages and collecting data...');
    const allItems = buildAllPages();

    // 4. Write Data File
    console.log('[BUILD] Writing data file...');
    const dataOutputDir = path.join(distDir, 'assets', 'data');
    if (!fs.existsSync(dataOutputDir)) {
        fs.mkdirSync(dataOutputDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataOutputDir, 'items.json'), JSON.stringify(allItems, null, 2));

    console.log('[BUILD] Build complete! Your site is ready in the /dist directory.');
}

function buildAllPages() {
    const itemTemplate = fs.readFileSync(path.join(includesDir, 'item-template.html'), 'utf-8');
    const allItems = { games: [], tools: [] };

    // Process special directories: game and tool
    ['game', 'tool'].forEach(itemType => {
        const typeDir = path.join(contentDir, itemType);
        if (!fs.existsSync(typeDir)) return;

        // Process each item (e.g., /game/2048)
        fs.readdirSync(typeDir)
            .filter(file => fs.statSync(path.join(typeDir, file)).isDirectory())
            .forEach(itemName => {
                buildItemPage(itemType, itemName, itemTemplate, allItems);
            });
        
        // Process the list page (e.g., /game/index.html)
        const listPagePath = path.join(typeDir, 'index.html');
        if(fs.existsSync(listPagePath)) {
            processHtmlFile(listPagePath, path.join(distDir, itemType));
        }
    });

    // Process all other root-level files and directories from /content
    fs.readdirSync(contentDir).forEach(dirOrFile => {
        // Skip special dirs, they are already processed
        if (['game', 'tool'].includes(dirOrFile)) return;

        const fullPath = path.join(contentDir, dirOrFile);
        const destPath = path.join(distDir, dirOrFile);

        if (fs.statSync(fullPath).isDirectory()) {
            console.log(`[COPY]  Copying static directory: /${dirOrFile}`)
            processDirectory(fullPath, destPath);
        } else {
            processHtmlFile(fullPath, distDir);
        }
    });

    return allItems;
}

function buildItemPage(type, itemName, template, allItems) {
    const itemPath = path.join(contentDir, type, itemName);
    const metaPath = path.join(itemPath, 'meta.json');
    if (!fs.existsSync(metaPath)) return;

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const contentHtml = fs.readFileSync(path.join(itemPath, 'content.html'), 'utf-8');
    const descriptionMd = fs.readFileSync(path.join(itemPath, 'description.md'), 'utf-8');
    const descriptionHtml = marked.parse(descriptionMd);

    allItems[type + 's'].push({ dir: itemName, ...meta });

    let outputHtml = template.replace(/{{base_href}}/g, basePath);
    outputHtml = outputHtml.replace(/{{title}}/g, `${meta.name} | My Web`);
    outputHtml = outputHtml.replace(/{{name}}/g, meta.name);
    outputHtml = outputHtml.replace(/{{content_html}}/g, contentHtml);
    outputHtml = outputHtml.replace(/{{description_html}}/g, descriptionHtml);

    let scriptLoader = '';
    if (meta.script) {
        const scriptPath = `${basePath}${type}/${itemName}/${meta.script}`;
        scriptLoader = `import('${scriptPath}').then(module => { if (module.init) { module.init(); } });`;
    }
    outputHtml = outputHtml.replace('{{script_loader}}', scriptLoader);

    let styleBlock = '';
    if (type === 'tool') {
        styleBlock = `<link rel="stylesheet" href="${basePath}assets/css/tool-main.css">`;
    } else if (meta.style) {
        const stylePath = `${basePath}${type}/${itemName}/${meta.style}`;
        styleBlock = `<link rel="stylesheet" href="${stylePath}">`;
    }
    outputHtml = outputHtml.replace('{{style_block}}', styleBlock);

    const itemOutDir = path.join(distDir, type, itemName);
    fs.mkdirSync(itemOutDir, { recursive: true });
    fs.writeFileSync(path.join(itemOutDir, 'index.html'), outputHtml);
    console.log(`[BUILD] Built page: /${type}/${itemName}/
`);

    if (meta.script) copyItemAsset(itemPath, itemOutDir, meta.script);
    if (meta.style) copyItemAsset(itemPath, itemOutDir, meta.style);
}

function processDirectory(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        if (fs.statSync(srcFile).isDirectory()) {
            processDirectory(srcFile, destFile);
        } else if (srcFile.endsWith('.html')) {
            processHtmlFile(srcFile, destDir);
        } else {
            fs.copyFileSync(srcFile, destFile);
        }
    }
}

function processHtmlFile(srcFile, outDir) {
    const content = fs.readFileSync(srcFile, 'utf-8');
    const processedContent = content.replace(/{{base_href}}/g, basePath);
    const destFile = path.join(outDir, path.basename(srcFile));
    fs.writeFileSync(destFile, processedContent);
    const relativePath = path.relative(distDir, destFile).replace(/\\/g, '/');
    console.log(`[BUILD] Processed HTML: ${relativePath}`);
}

function copyItemAsset(itemPath, itemOutDir, fileName) {
    const srcPath = path.join(itemPath, fileName);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(itemOutDir, fileName));
    }
}

function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(child => {
            copyRecursive(path.join(src, child), path.join(dest, child));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

build();
