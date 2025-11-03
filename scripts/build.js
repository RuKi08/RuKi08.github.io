const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// --- Configuration ---
const distDir = path.join(__dirname, '..', 'dist');
const srcDir = path.join(__dirname, '..', 'src');
const contentDir = path.join(srcDir, 'content');
const assetsDir = path.join(srcDir, 'assets');
const includesDir = path.join(srcDir, '_includes');
const i18nDir = path.join(srcDir, 'i18n');
const languages = ['en', 'ko'];
const defaultLang = 'en';

// --- Main Build Function ---
function build() {
    console.log('[BUILD] Starting build...');

    // 1. Clean destination directory
    console.log('[BUILD] Cleaning dist directory...');
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    // 2. Load all translations
    console.log('[BUILD] Loading translations...');
    const translations = {};
    languages.forEach(lang => {
        const langPath = path.join(i18nDir, `${lang}.json`);
        if (fs.existsSync(langPath)) {
            translations[lang] = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
        }
    });

    // 3. Copy assets (once)
    console.log('[BUILD] Copying assets...');
    copyRecursive(assetsDir, path.join(distDir, 'assets'));

    // 4. Build pages for each language
    languages.forEach(lang => {
        const langDistDir = lang === defaultLang ? distDir : path.join(distDir, lang);
        console.log(`[BUILD] Building pages for language: ${lang} into ${langDistDir}`);
        if (!fs.existsSync(langDistDir)) {
            fs.mkdirSync(langDistDir, { recursive: true });
        }
        const allItems = buildContentPages(contentDir, langDistDir, lang, translations);
        buildLegalPages(langDistDir, lang, translations);

        // Build data file for list pages
        const dataOutputDir = path.join(langDistDir, 'assets', 'data');
        if (!fs.existsSync(dataOutputDir)) {
            fs.mkdirSync(dataOutputDir, { recursive: true });
        }
        fs.writeFileSync(path.join(dataOutputDir, 'items.json'), JSON.stringify(allItems, null, 2));
    });

    console.log('[BUILD] Build complete! Your site is ready in the /dist directory.');
}

// --- Helper Functions ---

function translate(content, lang, translations, itemSlug = null) {
    if (!content || !translations[lang]) return content || '';

    const langTranslations = translations[lang];

    return content.replace(/{{__i18n\.(.*?)__}}/g, (match, key) => {
        const keys = key.split('.');
        let result = null;

        // Try item-specific translation first if slug is available
        if (itemSlug && langTranslations[itemSlug]) {
            let current = langTranslations[itemSlug];
            for (const k of keys) {
                current = current ? current[k] : undefined;
            }
            result = current;
        }

        // If not found, try global translation
        if (result === undefined || result === null) {
            let current = langTranslations;
            for (const k of keys) {
                current = current ? current[k] : undefined;
            }
            result = current;
        }

        if (typeof result === 'object' && result !== null) {
            return JSON.stringify(result);
        }

        return result || match;
    });
}

function renderPageContent(contentData) {
    let html = '';
    if (Array.isArray(contentData)) {
        contentData.forEach(block => {
            if (typeof block === 'string') {
                html += `<p>${block}</p>`;
            } else if (typeof block === 'object' && block.type === 'list' && Array.isArray(block.items)) {
                html += '<ul>';
                block.items.forEach(item => {
                    html += `<li>${item}</li>`;
                });
                html += '</ul>';
            }
        });
    } else if (typeof contentData === 'string') {
        html += `<p>${contentData}</p>`;
    }
    return html;
}

function buildLegalPages(outDir, lang, translations) {
    const pageTemplate = fs.readFileSync(path.join(includesDir, 'page-template.html'), 'utf-8');
    const pageSlugs = ['licenses', 'privacy', 'terms'];

    pageSlugs.forEach(slug => {
        const pageData = translations[lang]?.pages?.[slug];
        if (!pageData) {
            console.warn(`  -> No page data found for ${slug} in ${lang}`);
            return;
        }

        let contentHtml = '';
        if (pageData.intro) {
            contentHtml += `<p>${pageData.intro}</p>`;
        }
        if (pageData.last_updated) {
            contentHtml += `<p><strong>Last updated: ${pageData.last_updated}</strong></p>`;
        }

        if (pageData.items) {
            pageData.items.forEach(item => {
                contentHtml += '<hr>';
                contentHtml += '<div class="license-item">';
                contentHtml += `<h3>${item.name}</h3>`;
                contentHtml += `<p><strong>License:</strong> ${item.license}</p>`;
                contentHtml += `<p>${item.description}</p>`;
                contentHtml += `<p><a href="${item.url}" target="_blank">View License</a></p>`;
                contentHtml += '</div>';
            });
        } else if (pageData.sections) {
            pageData.sections.forEach(section => {
                contentHtml += `<h3>${section.title}</h3>`;
                contentHtml += renderPageContent(section.content);
            });
        }

        let outputHtml = pageTemplate;
        outputHtml = outputHtml.replace(/{{lang}}/g, lang);
        outputHtml = outputHtml.replace(/{{title}}/g, pageData.title);
        outputHtml = outputHtml.replace(/{{content_html}}/g, contentHtml);

        // Translate global placeholders in the template itself
        outputHtml = translate(outputHtml, lang, translations);

        const destPath = path.join(outDir, `${slug}.html`);
        fs.writeFileSync(destPath, outputHtml);
        console.log(`  -> Built legal page: /${slug}.html for ${lang}`);
    });
}

function buildContentPages(sourceDir, outDir, lang, translations) {
    const template = fs.readFileSync(path.join(includesDir, 'item-template.html'), 'utf-8');
    const allItems = { games: [], tools: [] };

    const itemTypes = ['game', 'tool'];
    itemTypes.forEach(type => {
        const typeDir = path.join(sourceDir, type);
        if (!fs.existsSync(typeDir)) return;

        const listPageIndexSource = path.join(typeDir, 'index.html');
        if (fs.existsSync(listPageIndexSource)) {
            const listPageContent = fs.readFileSync(listPageIndexSource, 'utf-8');
            let processedContent = listPageContent.replace(/{{lang}}/g, lang);
            processedContent = translate(processedContent, lang, translations); // Global translations

            const listPageIndexDest = path.join(outDir, type, 'index.html');
            fs.mkdirSync(path.join(outDir, type), { recursive: true });
            fs.writeFileSync(listPageIndexDest, processedContent);
            console.log(`  -> Built list page: /${type}/ for ${lang}`);
        }

        const items = fs.readdirSync(typeDir).filter(file => fs.statSync(path.join(typeDir, file)).isDirectory());

        items.forEach(itemName => {
            const itemPath = path.join(typeDir, itemName);
            const metaPath = path.join(itemPath, 'meta.json');

            if (!fs.existsSync(metaPath)) return;

            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            const contentHtml = fs.readFileSync(path.join(itemPath, 'content.html'), 'utf-8');

            const itemTranslations = translations[lang]?.[itemName] || {};

            const translatedName = itemTranslations.name || meta.name;
            const translatedDescription = itemTranslations.description || meta.description;
            const translatedContentHtml = translate(contentHtml, lang, translations, itemName);

            let descriptionHtml = '';
            if (itemTranslations.desc) {
                const descContent = Object.values(itemTranslations.desc).join('\n\n');
                descriptionHtml = marked.parse(descContent);
            }

            allItems[type + 's'].push({
                dir: itemName,
                ...meta,
                name: translatedName,
                description: translatedDescription
            });

            let outputHtml = template;
            outputHtml = outputHtml.replace(/{{lang}}/g, lang);
            outputHtml = outputHtml.replace(/{{title}}/g, `${translatedName} | My Web`);
            outputHtml = outputHtml.replace(/{{name}}/g, translatedName);
            outputHtml = outputHtml.replace(/{{content_html}}/g, translatedContentHtml);
            outputHtml = outputHtml.replace(/{{description_html}}/g, descriptionHtml);

            let scriptLoader = '';
            if (meta.script) {
                const scriptPath = `/${type}/${itemName}/${meta.script}`;
                scriptLoader = `import('${scriptPath}').then(module => { if (module.init) { module.init(); } });`;
            }
            outputHtml = outputHtml.replace('{{script_loader}}', scriptLoader);

            let styleBlock = '';
            if (type === 'tool') {
                styleBlock = '<link rel="stylesheet" href="/assets/css/tool-main.css">';
            } else if (meta.style) {
                const stylePath = `/${type}/${itemName}/${meta.style}`;
                styleBlock = `<link rel="stylesheet" href="${stylePath}">`;
            }
            outputHtml = outputHtml.replace('{{style_block}}', styleBlock);

            // Translate global placeholders in the template itself
            outputHtml = translate(outputHtml, lang, translations);


            const itemOutDir = path.join(outDir, type, itemName);
            fs.mkdirSync(itemOutDir, { recursive: true });
            fs.writeFileSync(path.join(itemOutDir, 'index.html'), outputHtml);
            console.log(`  -> Built page: /${type}/${itemName}/ for ${lang}`);

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

    const otherDirs = fs.readdirSync(sourceDir).filter(file => {
        const filePath = path.join(sourceDir, file);
        return fs.statSync(filePath).isDirectory() && !itemTypes.includes(file) && !languages.includes(file);
    });

    otherDirs.forEach(dir => {
        const srcDirPath = path.join(sourceDir, dir);
        const destDirPath = path.join(outDir, dir);
        copyRecursive(srcDirPath, destDirPath);
        console.log(`  -> Copied static directory: /${dir}/ for ${lang}`);
    });

    const staticRootFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.html') && !fs.statSync(path.join(sourceDir, file)).isDirectory());
    staticRootFiles.forEach(page => {
        const pagePath = path.join(sourceDir, page);
        const pageContent = fs.readFileSync(pagePath, 'utf-8');
        let processedContent = pageContent.replace(/{{lang}}/g, lang);
        processedContent = translate(processedContent, lang, translations);

        const destPath = path.join(outDir, page);
        fs.writeFileSync(destPath, processedContent);
        console.log(`  -> Built static file: /${page} for ${lang}`);
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