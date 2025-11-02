const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// --- Configuration ---
const distDir = path.join(__dirname, '..', 'dist');
const srcDir = path.join(__dirname, '..', 'src');
const contentDir = path.join(srcDir, 'content');
const assetsDir = path.join(srcDir, 'assets');
const includesDir = path.join(srcDir, '_includes');

// --- Main Build Function ---
function build() {
    console.log('[BUILD] Starting build...');

    // 1. Clean destination directory
    console.log('[BUILD] Cleaning dist directory...');
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    // 2. Copy assets
    console.log('[BUILD] Copying assets...');
    copyRecursive(assetsDir, path.join(distDir, 'assets'));

    // 3. Build all pages from content
    console.log('[BUILD] Building pages from content...');
    const allItems = buildContentPages(contentDir, distDir);

    // 4. Build data file for list pages
    console.log('[BUILD] Building data file...');
    const dataOutputDir = path.join(distDir, 'assets', 'data');
    if (!fs.existsSync(dataOutputDir)) {
        fs.mkdirSync(dataOutputDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataOutputDir, 'items.json'), JSON.stringify(allItems, null, 2));

    console.log('[BUILD] Build complete! Your site is ready in the /dist directory.');
}

// --- Helper Functions ---

function buildContentPages(sourceDir, outDir) {
    const template = fs.readFileSync(path.join(includesDir, 'item-template.html'), 'utf-8');
    const allItems = { games: [], tools: [] };

    const itemTypes = ['game', 'tool'];
    itemTypes.forEach(type => {
        const typeDir = path.join(sourceDir, type);
        if (!fs.existsSync(typeDir)) return;

        // Copy the list page (index.html) for the type
        const listPageIndexSource = path.join(typeDir, 'index.html');
        const listPageIndexDest = path.join(outDir, type, 'index.html');
        if (fs.existsSync(listPageIndexSource)) {
            fs.mkdirSync(path.join(outDir, type), { recursive: true });
            fs.copyFileSync(listPageIndexSource, listPageIndexDest);
            console.log(`  -> Copied list page: /${type}/`);
        }

        const items = fs.readdirSync(typeDir).filter(file => fs.statSync(path.join(typeDir, file)).isDirectory());

        items.forEach(itemName => {
            const itemPath = path.join(typeDir, itemName);
            const metaPath = path.join(itemPath, 'meta.json');

            if (!fs.existsSync(metaPath)) return;

            // Read content files
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            const contentHtml = fs.readFileSync(path.join(itemPath, 'content.html'), 'utf-8');
            const descriptionMd = fs.readFileSync(path.join(itemPath, 'description.md'), 'utf-8');
            const descriptionHtml = marked.parse(descriptionMd);

            // Add to data for list pages
            allItems[type + 's'].push({ dir: itemName, ...meta });

            // Render the full page
            let outputHtml = template;
            outputHtml = outputHtml.replace(/{{title}}/g, `${meta.name} | My Web`);
            outputHtml = outputHtml.replace(/{{name}}/g, meta.name);
            outputHtml = outputHtml.replace(/{{content_html}}/g, contentHtml);
            outputHtml = outputHtml.replace(/{{description_html}}/g, descriptionHtml);

            // Handle item-specific script
            let scriptLoader = '';
            if (meta.script) {
                const scriptPath = `/${type}/${itemName}/${meta.script}`;
                scriptLoader = `import('${scriptPath}').then(module => { if (module.init) { module.init(); } });`;
            }
            outputHtml = outputHtml.replace('{{script_loader}}', scriptLoader);

            // Handle item-specific style
            let styleBlock = '';
            if (type === 'tool') {
                styleBlock = '<link rel="stylesheet" href="/assets/css/tool-main.css">';
            } else if (meta.style) { // For games
                const stylePath = `/${type}/${itemName}/${meta.style}`;
                styleBlock = `<link rel="stylesheet" href="${stylePath}">`;
            }
            outputHtml = outputHtml.replace('{{style_block}}', styleBlock);

            // Write the final HTML file
            const itemOutDir = path.join(outDir, type, itemName);
            fs.mkdirSync(itemOutDir, { recursive: true });
            fs.writeFileSync(path.join(itemOutDir, 'index.html'), outputHtml);
            console.log(`  -> Built page: /${type}/${itemName}/`);

            // Copy script and style files to dist
            if (meta.script) {
                const srcScriptPath = path.join(itemPath, meta.script);
                const destScriptPath = path.join(itemOutDir, meta.script);
                if (fs.existsSync(srcScriptPath)) {
                    fs.copyFileSync(srcScriptPath, destScriptPath);
                }
            }
            if (meta.style) {
                const srcStylePath = path.join(itemPath, meta.style);
                const destStylePath = path.join(itemOutDir, meta.style);
                if (fs.existsSync(srcStylePath)) {
                    fs.copyFileSync(srcStylePath, destStylePath);
                }
            }
        });
    });

    // Copy other static directories like /home, /portfolio
    const otherDirs = fs.readdirSync(sourceDir).filter(file => {
        const filePath = path.join(sourceDir, file);
        return fs.statSync(filePath).isDirectory() && !itemTypes.includes(file);
    });

    otherDirs.forEach(dir => {
        const srcDirPath = path.join(sourceDir, dir);
        const destDirPath = path.join(outDir, dir);
        copyRecursive(srcDirPath, destDirPath);
        console.log(`  -> Copied static directory: /${dir}/`);
    });

    // Copy over static root and list pages
    const staticRootFiles = fs.readdirSync(sourceDir).filter(file => !fs.statSync(path.join(sourceDir, file)).isDirectory());
    staticRootFiles.forEach(page => {
        copyRecursive(path.join(sourceDir, page), path.join(outDir, page));
        console.log(`  -> Copied static file: /${page}`);
    });

    return allItems;
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

// --- Run Build ---
build();