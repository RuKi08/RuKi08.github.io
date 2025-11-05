const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

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

    const allItems = { game: {}, tool: {} };
    const allPosts = [];

    // --- Fetch and Build Tools and Games ---
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

                const translatedName = item.name[lang];
                const translatedDescription = item.description[lang];

                if (!allItems[type][item.slug]) {
                    allItems[type][item.slug] = { ...listData, name: {}, description: {} };
                }
                allItems[type][item.slug].name[lang] = translatedName;
                allItems[type][item.slug].description[lang] = translatedDescription;

                buildItemPage(lang, langDistDir, {
                    ...item,
                    name: translatedName,
                    description: translatedDescription,
                    content_html: (item.content && item.content[lang]) 
                    ? item.contentBody.replace(/{{__content\.(.*?)__}}/g, (match, key) => {
                        const keys = key.split('.');
                        let value = item.content[lang];
                        for (const k of keys) {
                            if (value === undefined) break;
                            value = value[k];
                        }

                        if (typeof value === 'object') return JSON.stringify(value);
                        return value || match;
                    })
                    : item.contentBody,
                    description_html: marked.parse(item.desc[lang] || ''),
                }, headerHtml, footerHtml, translations);

                // Create script/style files from content
                if (item.scriptContent) {
                    fs.writeFileSync(path.join(itemOutDir, item.script), item.scriptContent);
                }
                if (item.styleContent) {
                    fs.writeFileSync(path.join(itemOutDir, item.style), item.styleContent);
                }
            }
        }
    }

    // --- Fetch and Build Blog Posts ---
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

    // --- Finalize Data Files ---
    const allPostsByLang = {};
    for (const lang of languages) {
        const snapshot = await db.collection(`post_${lang}`).get();
        const posts = snapshot.docs.map(doc => ({...doc.data(), dir: doc.id, type: 'blog'}));
        allPostsByLang[lang] = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    languages.forEach(lang => {
        const langDistDir = lang === defaultLang ? distDir : path.join(distDir, lang);
        const dataOutputDir = path.join(langDistDir, 'assets', 'data');
        if (!fs.existsSync(dataOutputDir)) fs.mkdirSync(dataOutputDir, { recursive: true });

        const finalItems = {
            games: Object.values(allItems.game),
            tools: Object.values(allItems.tool),
            blogs: allPostsByLang[lang]
        };
        fs.writeFileSync(path.join(dataOutputDir, 'items.json'), JSON.stringify(finalItems, null, 2));

        // Note: generateBlogTree relies on the old file structure. This needs to be adapted or re-enabled if needed.
        // For now, we will create an empty tree.
        const blogTree = []; // Simplified for now
        fs.writeFileSync(path.join(dataOutputDir, 'blog-tree.json'), JSON.stringify(blogTree, null, 2));
    });

    // For the root homepage, create a combined, sorted list of default language blog posts.
    const rootDataDir = path.join(distDir, 'assets', 'data');
    fs.writeFileSync(path.join(rootDataDir, 'blog-posts.json'), JSON.stringify(allPostsByLang[defaultLang], null, 2));

    console.log('[BUILD-FIREBASE] Created data files (items.json, blog-tree.json, blog-posts.json).');

    // --- Build Static/List Pages ---
    buildStaticPages(distDir, headerHtml, footerHtml, translations);

    // --- Build Preview Page ---
    const previewPagePath = path.join(srcDir, 'pages', 'preview.html');
    if (fs.existsSync(previewPagePath)) {
        console.log('[BUILD-FIREBASE] Building preview page...');
        let previewContent = fs.readFileSync(previewPagePath, 'utf-8');
        previewContent = previewContent.replace('{{__header__}}', headerHtml);
        previewContent = previewContent.replace('{{__footer__}}', footerHtml);
        // Preview page does not need translation, so we write it directly.
        fs.writeFileSync(path.join(distDir, 'preview.html'), previewContent);
        console.log('  -> Built page: /preview.html');
    }

    // --- Build Legal Pages ---
    languages.forEach(lang => {
        const langDistDir = lang === defaultLang ? distDir : path.join(distDir, lang);
        buildLegalPages(langDistDir, lang, translations, headerHtml, footerHtml);
    });

    console.log('[BUILD-FIREBASE] Build from Firestore complete! Your site is ready in the /dist directory.');
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

function buildLegalPages(outDir, lang, translations, headerHtml, footerHtml) {
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
        outputHtml = outputHtml.replace('{{__header__}}', headerHtml);
        outputHtml = outputHtml.replace('{{__footer__}}', footerHtml);

        outputHtml = outputHtml.replace(/{{lang}}/g, lang);
        outputHtml = outputHtml.replace(/{{title}}/g, `${pageData.title} | ctrlcat`);
        outputHtml = outputHtml.replace(/{{page_heading}}/g, pageData.title);
        outputHtml = outputHtml.replace(/{{content_html}}/g, contentHtml);

        outputHtml = translate(outputHtml, lang, translations);

        const destDir = path.join(outDir, slug);
        fs.mkdirSync(destDir, { recursive: true });
        fs.writeFileSync(path.join(destDir, 'index.html'), outputHtml);
        console.log(`  -> Built legal page: /${slug}/ for ${lang}`);
    });
}

function generateBlogTree(dir, fullPath, lang, langTranslations) {
    const stats = fs.statSync(fullPath);
    const name = path.basename(dir);

    if (!stats.isDirectory()) {
        return null;
    }

    const children = fs.readdirSync(fullPath);
    // It's a post directory if it contains language subdirectories (en, ko)
    if (children.includes(lang)) {
        const langPath = path.join(fullPath, lang);
        const metaPath = path.join(langPath, 'meta.json');
        let meta = {};
        if (fs.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        }

        return {
            type: 'post',
            name: meta.title || name,
            dir: name,
            date: meta.date
        };
    }

    // It's a category directory
    const translatedName = langTranslations?.blog_categories?.[name] || name;
    const items = children
        .map(child => generateBlogTree(path.join(dir, child), path.join(fullPath, child), lang, langTranslations))
        .filter(item => item !== null)
        .sort((a, b) => {
            if (a.type === 'category' && b.type === 'post') return -1;
            if (a.type === 'post' && b.type === 'category') return 1;
            return a.name.localeCompare(b.name);
        });

    if (items.length === 0) {
        return null;
    }

    return {
        type: 'category',
        name: translatedName,
        children: items
    };
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