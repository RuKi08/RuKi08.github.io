const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Dynamically import the shared content processor
let processItemDataModule;
async function loadContentProcessor() {
    if (!processItemDataModule) {
        processItemDataModule = await import('../shared/content-processor.js');
    }
}

// --- Configuration ---
const serviceAccount = require('../serviceAccountKey.json');
const distDir = path.join(__dirname, '..', 'dist');
const srcDir = path.join(__dirname, '..', 'src');
const assetsDir = path.join(srcDir, 'assets');
const includesDir = path.join(srcDir, '_includes');
const i18nDir = path.join(srcDir, 'i18n');
const languages = ['en', 'ko'];
const defaultLang = 'en';

// --- Initialize Firebase Admin ---
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// --- Main Build Function ---
async function build() {
    await loadContentProcessor();
    console.log('[BUILD-FIREBASE] Starting build from Firestore...');

    const headerHtml = fs.readFileSync(path.join(includesDir, 'header.html'), 'utf-8');
    const footerHtml = fs.readFileSync(path.join(includesDir, 'footer.html'), 'utf-8');

    console.log('[BUILD-FIREBASE] Cleaning dist directory...');
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    console.log('[BUILD-FIREBASE] Loading translations...');
    const translations = {};
    languages.forEach(lang => {
        const langPath = path.join(i18nDir, `${lang}.json`);
        if (fs.existsSync(langPath)) {
            translations[lang] = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
        }
    });

    console.log('[BUILD-FIREBASE] Copying global assets...');
    copyRecursive(assetsDir, path.join(distDir, 'assets'));
    copyRecursive(path.join(__dirname, '..', 'shared'), path.join(distDir, 'shared'));

    const allItems = { game: {}, tool: {} };
    const allPosts = [];

    await buildItems(db, allItems, headerHtml, footerHtml, translations);
    await buildBlog(db, allPosts, headerHtml, footerHtml, translations);
    await generateDataFiles(db, allItems, allPosts, distDir, translations);

    buildStaticPages(distDir, headerHtml, footerHtml, translations);
    buildPreviewPages(distDir, headerHtml, footerHtml, translations);
    buildLegalPages(distDir, headerHtml, footerHtml, translations);

    console.log('[BUILD-FIREBASE] Build from Firestore complete! Your site is ready in the /dist directory.');
}

async function buildItems(db, allItems, headerHtml, footerHtml, translations) {
    const itemTypes = ['tool', 'game'];
    for (const type of itemTypes) {
        console.log(`[BUILD-FIREBASE] Fetching '${type}' from Firestore...`);
        const snapshot = await db.collection(type).get();
        if (snapshot.empty) continue;

        for (const doc of snapshot.docs) {
            const item = doc.data();
            const listData = { dir: item.slug, type: item.type, icon: item.icon, tags: item.tags };

            for (const lang of languages) {
                const langDistDir = lang === defaultLang ? distDir : path.join(distDir, lang);
                if (!fs.existsSync(langDistDir)) fs.mkdirSync(langDistDir, { recursive: true });

                const itemOutDir = path.join(langDistDir, item.type, item.slug);
                if (!fs.existsSync(itemOutDir)) fs.mkdirSync(itemOutDir, { recursive: true });

                const processed = processItemDataModule.processItemData(item, lang, marked);

                if (!allItems[type][item.slug]) {
                    allItems[type][item.slug] = { ...listData, name: {}, description: {} };
                }
                allItems[type][item.slug].name[lang] = processed.name;
                allItems[type][item.slug].description[lang] = processed.description;

                buildItemPage(lang, langDistDir, {
                    ...item,
                    name: processed.name,
                    description: processed.description,
                    content_html: processed.contentHtml,
                    description_html: processed.descriptionHtml,
                }, headerHtml, footerHtml, translations);

                if (item.scriptContent) fs.writeFileSync(path.join(itemOutDir, item.script), item.scriptContent);
                if (item.styleContent) fs.writeFileSync(path.join(itemOutDir, item.style), item.styleContent);
            }
        }
    }
}

async function buildBlog(db, allPosts, headerHtml, footerHtml, translations) {
    console.log(`[BUILD-FIREBASE] Fetching 'posts' from Firestore...`);
    for (const lang of languages) {
        const collectionName = `post_${lang}`;
        const snapshot = await db.collection(collectionName).get();
        if (snapshot.empty) continue;

        for (const doc of snapshot.docs) {
            const item = doc.data();
            const langDistDir = lang === defaultLang ? distDir : path.join(distDir, lang);
            if (!fs.existsSync(langDistDir)) fs.mkdirSync(langDistDir, { recursive: true });

            if (lang === defaultLang) {
                allPosts.push({ ...item, dir: item.slug, type: 'blog' });
            }

            buildItemPage(lang, langDistDir, {
                ...item,
                name: item.title,
                content_html: marked.parse(translate(item.contentBody, lang, translations, item.slug)),
                description_html: '',
            }, headerHtml, footerHtml, translations);
        }
    }
}

async function generateDataFiles(db, allItems, allPosts, outDir, translations) {
    const allPostsByLang = {};
    for (const lang of languages) {
        const snapshot = await db.collection(`post_${lang}`).get();
        const posts = snapshot.docs.map(doc => ({...doc.data(), dir: doc.id, type: 'blog'}));
        allPostsByLang[lang] = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    languages.forEach(lang => {
        const langDistDir = lang === defaultLang ? outDir : path.join(outDir, lang);
        const dataOutputDir = path.join(langDistDir, 'assets', 'data');
        if (!fs.existsSync(dataOutputDir)) fs.mkdirSync(dataOutputDir, { recursive: true });

        const finalItems = {
            games: Object.values(allItems.game),
            tools: Object.values(allItems.tool),
            blogs: allPostsByLang[lang]
        };
        fs.writeFileSync(path.join(dataOutputDir, 'items.json'), JSON.stringify(finalItems, null, 2));
        fs.writeFileSync(path.join(dataOutputDir, 'blog-tree.json'), JSON.stringify([], null, 2)); // Simplified
    });

    const rootDataDir = path.join(outDir, 'assets', 'data');
    fs.writeFileSync(path.join(rootDataDir, 'blog-posts.json'), JSON.stringify(allPostsByLang[defaultLang], null, 2));
    console.log('[BUILD-FIREBASE] Created data files.');
}

function buildPreviewPages(outDir, headerHtml, footerHtml, translations) {
    console.log('[BUILD-FIREBASE] Building preview pages...');
    const template = fs.readFileSync(path.join(includesDir, 'item-template.html'), 'utf-8');

    languages.forEach(lang => {
        const langDistDir = lang === defaultLang ? outDir : path.join(outDir, lang);
        let outputHtml = template;

        outputHtml = outputHtml.replace('{{__header__}}', headerHtml);
        outputHtml = outputHtml.replace('{{__footer__}}', footerHtml);
        outputHtml = translate(outputHtml, lang, translations);
        outputHtml = outputHtml.replace(/{{lang}}/g, lang);

        outputHtml = outputHtml.replace('{{style_block}}', '<style id="preview-style-block"></style>');
        const previewScript = `
            import { initPreview } from '/assets/js/preview-loader.js';
            initPreview();
        `;
        outputHtml = outputHtml.replace('{{script_loader}}', previewScript);

        const destDir = path.join(langDistDir, 'preview');
        fs.mkdirSync(destDir, { recursive: true });
        fs.writeFileSync(path.join(destDir, 'index.html'), outputHtml);
        console.log(`  -> Built preview page: ${path.relative(outDir, path.join(destDir, 'index.html'))}`);
    });
}

function buildLegalPages(outDir, headerHtml, footerHtml, translations) {
    languages.forEach(lang => {
        const langDistDir = lang === defaultLang ? outDir : path.join(outDir, lang);
        const pageTemplate = fs.readFileSync(path.join(includesDir, 'page-template.html'), 'utf-8');
        const pageSlugs = ['licenses', 'privacy', 'terms'];

        pageSlugs.forEach(slug => {
            const pageData = translations[lang]?.pages?.[slug];
            if (!pageData) return;

            let contentHtml = '';
            if (pageData.intro) contentHtml += `<p>${pageData.intro}</p>`;
            if (pageData.last_updated) contentHtml += `<p><strong>Last updated: ${pageData.last_updated}</strong></p>`;

            if (pageData.items) {
                pageData.items.forEach(item => {
                    contentHtml += '<hr>';
                    contentHtml += `<div class="license-item"><h3>${item.name}</h3><p><strong>License:</strong> ${item.license}</p><p>${item.description}</p><p><a href="${item.url}" target="_blank">View License</a></p></div>`;
                });
            } else if (pageData.sections) {
                pageData.sections.forEach(section => {
                    contentHtml += `<h3>${section.title}</h3>`;
                    contentHtml += renderPageContent(section.content);
                });
            }

            let outputHtml = pageTemplate;
            outputHtml = outputHtml.replace('{{__header__}}', headerHtml);
            outputHtml = outputHtml.replace('{{__footer__}}', footerHtml);
            outputHtml = outputHtml.replace(/{{lang}}/g, lang);
            outputHtml = outputHtml.replace(/{{title}}/g, `${pageData.title} | ctrlcat`);
            outputHtml = outputHtml.replace(/{{page_heading}}/g, pageData.title);
            outputHtml = outputHtml.replace(/{{content_html}}/g, contentHtml);
            outputHtml = translate(outputHtml, lang, translations);

            const destDir = path.join(langDistDir, slug);
            fs.mkdirSync(destDir, { recursive: true });
            fs.writeFileSync(path.join(destDir, 'index.html'), outputHtml);
            console.log(`  -> Built legal page: /${slug}/ for ${lang}`);
        });
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

// --- Page Building Helper ---
function buildItemPage(lang, langDistDir, item, headerHtml, footerHtml, translations) {
    const template = fs.readFileSync(path.join(includesDir, 'item-template.html'), 'utf-8');
    const outDir = path.join(langDistDir, item.type, item.slug);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const langPrefix = lang === defaultLang ? '' : `/${lang}`;
    const homeUrl = langPrefix || '/';
    const typeUrl = `${langPrefix}/${item.type === 'blog' ? 'blog' : item.type}/`;
    const breadcrumbsHtml = `<a href="${homeUrl}">Home</a> / <a href="${typeUrl}">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</a> / <span>${item.name}</span>`;
    const tagsHtml = (item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');

    let outputHtml = template;
    outputHtml = outputHtml.replace('{{__header__}}', headerHtml);
    outputHtml = outputHtml.replace('{{__footer__}}', footerHtml);
    outputHtml = outputHtml.replace(/{{lang}}/g, lang);
    outputHtml = outputHtml.replace(/{{title}}/g, `${item.name} | ctrlcat`);
    outputHtml = outputHtml.replace(/{{name}}/g, item.name);
    outputHtml = outputHtml.replace(/{{breadcrumbs}}/g, breadcrumbsHtml);
    outputHtml = outputHtml.replace(/{{description}}/g, item.description || '');
    outputHtml = outputHtml.replace(/{{tags}}/g, tagsHtml);
    outputHtml = outputHtml.replace(/{{content_html}}/g, item.content_html);
    outputHtml = outputHtml.replace(/{{description_html}}/g, item.description_html);

    let scriptLoader = '';
    if (item.script) {
        const scriptPath = `/${item.type}/${item.slug}/${item.script}`;
        scriptLoader = `import('${scriptPath}').then(module => { if (module.init) { module.init(); } });`;
    }
    outputHtml = outputHtml.replace('{{script_loader}}', scriptLoader);

    let styleBlock = '';
    if (item.type === 'tool') {
        styleBlock = '<link rel="stylesheet" href="/assets/css/tool-main.css">';
    } else if (item.style) {
        const stylePath = `/${item.type}/${item.slug}/${item.style}`;
        styleBlock = `<link rel="stylesheet" href="${stylePath}">`;
    }
    outputHtml = outputHtml.replace('{{style_block}}', styleBlock);

    outputHtml = translate(outputHtml, lang, translations);

    fs.writeFileSync(path.join(outDir, 'index.html'), outputHtml);
    console.log(`  -> Built page: ${path.relative(distDir, path.join(outDir, 'index.html'))}`);
}

function buildStaticPages(outDir, headerHtml, footerHtml, translations) {
    const pagesDir = path.join(srcDir, 'pages');
    const pageMappings = {
        'home.html': '',
        'tool.html': 'tool',
        'game.html': 'game',
        'blog.html': 'blog'
    };

    Object.entries(pageMappings).forEach(([sourceFile, destDirName]) => {
        const sourcePath = path.join(pagesDir, sourceFile);
        if (fs.existsSync(sourcePath)) {
            languages.forEach(lang => {
                const langPrefix = lang === defaultLang ? '' : `/${lang}`;
                const langDistDir = lang === defaultLang ? outDir : path.join(outDir, lang);
                let pageContent = fs.readFileSync(sourcePath, 'utf-8');
                pageContent = pageContent.replace('{{__header__}}', headerHtml);
                pageContent = pageContent.replace('{{__footer__}}', footerHtml);
                let processedContent = pageContent.replace(/{{lang}}/g, lang);
                processedContent = processedContent.replace(/{{langPrefix}}/g, langPrefix);
                processedContent = translate(processedContent, lang, translations);
                
                const finalDestDir = path.join(langDistDir, destDirName);
                if (!fs.existsSync(finalDestDir)) {
                    fs.mkdirSync(finalDestDir, { recursive: true });
                }
                const destPath = path.join(finalDestDir, 'index.html');
                fs.writeFileSync(destPath, processedContent);
                console.log(`  -> Built static page: /${destDirName}/ for ${lang}`);
            });
        }
    });
}

// --- Generic Helper Functions ---
function translate(content, lang, translations, itemSlug = null) {
    if (!content || !translations[lang]) return content || '';
    const langTranslations = translations[lang];
    return content.replace(/{{__i18n\.(.*?)__}}/g, (match, key) => {
        const keys = key.split('.');
        let result = itemSlug && langTranslations[itemSlug] ? keys.reduce((acc, k) => acc && acc[k], langTranslations[itemSlug]) : undefined;
        if (result === undefined) {
            result = keys.reduce((acc, k) => acc && acc[k], langTranslations);
        }
        return result !== undefined ? (typeof result === 'object' ? JSON.stringify(result) : result) : match;
    });
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