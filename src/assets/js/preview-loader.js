
import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Dynamically import marked.js for Markdown parsing
let marked;
import('https://cdn.jsdelivr.net/npm/marked@13.0.0/lib/marked.esm.js').then(module => {
    marked = module.marked;
});

export async function initPreview() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const slug = params.get('slug');

    if (!type || !slug) {
        document.getElementById('item-name').innerText = 'Error: Missing type or slug in URL.';
        return;
    }

    document.getElementById('item-type').innerText = type;
    document.getElementById('item-slug').innerText = slug;

    // Determine the correct collection name (e.g., draft-tool, draft-post_en)
    // For now, assuming posts are in English for preview.
    const collectionName = `draft-${type === 'post' ? 'post_en' : type}`;
    
    try {
        const docRef = doc(db, collectionName, slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Fetched draft data:", data);
            renderPreview(data);
        } else {
            document.getElementById('item-name').innerText = `Error: Document not found in ${collectionName}`;
            console.error("No such document!");
        }
    } catch (error) {
        document.getElementById('item-name').innerText = 'Error fetching document.';
        console.error("Error fetching document:", error);
    }
}

function renderPreview(data) {
    document.getElementById('item-name').innerText = data.name?.en || data.title || 'No Title';

    const contentHtmlContainer = document.getElementById('content-html-container');
    if (data.contentBody) {
        contentHtmlContainer.innerHTML = data.contentBody;
    } else {
        contentHtmlContainer.innerHTML = '<em>(No content body)</em>';
    }

    const descHtmlContainer = document.getElementById('desc-html-container');
    if (data.desc?.en && marked) {
        descHtmlContainer.innerHTML = marked.parse(data.desc.en);
    } else {
        descHtmlContainer.innerHTML = '<em>(No description)</em>';
    }

    const scriptContentCode = document.querySelector('#script-content code');
    if (data.scriptContent) {
        scriptContentCode.textContent = data.scriptContent;
    } else {
        scriptContentCode.textContent = '// No script content';
    }

    const styleContentCode = document.querySelector('#style-content code');
    if (data.styleContent) {
        styleContentCode.textContent = data.styleContent;
    } else {
        styleContentCode.textContent = '/* No style content */';
    }
}
