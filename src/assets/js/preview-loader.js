import { db, doc, getDoc } from './firebase-config.js';
import { processItemData } from '/shared/content-processor.js';

let marked;

// Dynamically loads the marked.js library from a CDN.
async function loadMarked() {
    if (!marked) {
        try {
            const module = await import('https://cdn.jsdelivr.net/npm/marked@13.0.0/lib/marked.esm.js');
            marked = module.marked;
        } catch (error) {
            console.error("Failed to load Marked.js:", error);
            document.body.innerHTML = 'Error: Could not load Markdown parser.';
        }
    }
}

export async function initPreview() {
    await loadMarked(); // Ensure marked is loaded before proceeding

    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const slug = params.get('slug');

    if (!type || !slug) {
        document.body.innerHTML = 'Error: Missing type or slug in URL.';
        return;
    }

    const pathParts = window.location.pathname.split('/').filter(p => p);
    const lang = (pathParts.length > 1 && pathParts[1] === 'preview') ? pathParts[0] : 'en';
    const collectionName = `draft-${type === 'post' ? `post_${lang}` : type}`;
    
    try {
        const docRef = doc(db, collectionName, slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Fetched draft data:", data);
            renderPreview(data, lang);
        } else {
            document.body.innerHTML = `Error: Document not found in ${collectionName}`;
            console.error("No such document!");
        }
    } catch (error) {
        document.body.innerHTML = 'Error fetching document. Check console for details (likely Firestore permissions).';
        console.error("Error fetching document:", error);
    }
}

function renderPreview(data, lang) {
    // Use the shared processor to get computed HTML fields
    const processed = processItemData(data, lang, marked);

    let html = document.body.innerHTML;

    // Replace content placeholders with processed data
    html = html.replace(/{{title}}/g, `${processed.name} (Preview) | ctrlcat`);
    html = html.replace('{{name}}', processed.name);
    html = html.replace('{{description}}', processed.description);
    html = html.replace('{{tags}}', processed.tagsHtml);
    html = html.replace('{{content_html}}', processed.contentHtml);
    html = html.replace('{{description_html}}', processed.descriptionHtml);

    // A simple breadcrumb for preview
    const breadcrumbs = `<a href="/">Home</a> / <span>Preview</span>`;
    html = html.replace('{{breadcrumbs}}', breadcrumbs);

    // Apply the new HTML
    document.body.innerHTML = html;

    // Inject style content
    if (data.styleContent) {
        const styleBlock = document.getElementById('preview-style-block');
        if (styleBlock) {
            styleBlock.textContent = data.styleContent;
        }
    }

    // Inject script content
    if (data.scriptContent) {
        const script = document.createElement('script');
        script.type = 'module';
        script.innerHTML = data.scriptContent;
        document.body.appendChild(script);
    }
}