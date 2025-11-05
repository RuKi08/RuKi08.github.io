
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// --- Configuration ---
const serviceAccount = require('../serviceAccountKey.json');
const migrationDir = path.join(__dirname, '..', 'content-to-migrate');

// --- Initialize Firebase Admin ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

function getDocReference(type, lang, slug) {
    if (type === 'post') {
        const collectionName = `post_${lang}`;
        return db.collection(collectionName).doc(slug);
    } else {
        return db.collection(type).doc(slug);
    }
}

// --- Main Upload Function ---
async function upload() {
    const args = process.argv.slice(2);
    const itemType = args[0];

    let docRef, itemSlug, itemDir;

    if (itemType === 'post') {
        if (args.length < 3) {
            console.error('Usage: node scripts/upload.js post <en|ko> <item-slug>');
            return;
        }
        const [, lang, slug] = args;
        if (!['en', 'ko'].includes(lang)) {
            console.error('Error: Invalid language. Must be "en" or "ko".');
            return;
        }
        itemSlug = slug;
        docRef = getDocReference(itemType, lang, itemSlug);
        itemDir = path.join(migrationDir, 'posts', lang, itemSlug);
    } else if (['game', 'tool'].includes(itemType)) {
        if (args.length < 2) {
            console.error(`Usage: node scripts/upload.js ${itemType} <item-slug>`);
            return;
        }
        const [, slug] = args;
        itemSlug = slug;
        docRef = getDocReference(itemType, null, itemSlug);
        itemDir = path.join(migrationDir, itemType, itemSlug);
    } else {
        console.error('Usage: node scripts/upload.js <game|tool|post> ...');
        return;
    }

    if (!fs.existsSync(itemDir)) {
        console.error(`Error: Source directory not found at ${itemDir}`);
        console.error('Did you generate or fetch the item first?');
        return;
    }

    try {
        console.log(`Reading files from ${itemDir}...`);
        const mdPath = path.join(itemDir, 'index.md');
        if (!fs.existsSync(mdPath)) {
            console.error(`Error: index.md not found in ${itemDir}`);
            return;
        }

        const mdFile = fs.readFileSync(mdPath, 'utf-8');
        const { data: frontMatter, content: contentBody } = matter(mdFile);

        let dataToUpload = { ...frontMatter, contentBody: contentBody || '' };

        // Find and add script/style content
        const scriptPath = path.join(itemDir, frontMatter.script || 'script.js');
        if (fs.existsSync(scriptPath)) {
            dataToUpload.scriptContent = fs.readFileSync(scriptPath, 'utf-8');
        }

        const stylePath = path.join(itemDir, frontMatter.style || 'style.css');
        if (fs.existsSync(stylePath)) {
            dataToUpload.styleContent = fs.readFileSync(stylePath, 'utf-8');
        }

        console.log(`Uploading to Firestore path: ${docRef.path}`);
        await docRef.set(dataToUpload);

        console.log(`
✨ Successfully uploaded ${itemType}: ${itemSlug}`);

    } catch (error) {
        console.error('\nAn error occurred during upload:', error);
    }
}

upload();
