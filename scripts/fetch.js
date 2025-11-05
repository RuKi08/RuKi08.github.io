
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getDocReference(type, lang, slug) {
    if (type === 'post') {
        const collectionName = `post_${lang}`;
        return db.collection(collectionName).doc(slug);
    } else {
        return db.collection(type).doc(slug);
    }
}

function saveItemToLocal(targetDir, data) {
    // Create item directory
    fs.mkdirSync(targetDir, { recursive: true });

    const { contentBody, scriptContent, styleContent, ...frontMatter } = data;

    // Create index.md
    const mdContent = matter.stringify(contentBody || '', frontMatter);
    fs.writeFileSync(path.join(targetDir, 'index.md'), mdContent);
    console.log(`  -> Created index.md`);

    // Create script.js if content exists
    if (scriptContent) {
        fs.writeFileSync(path.join(targetDir, frontMatter.script || 'script.js'), scriptContent);
        console.log(`  -> Created ${frontMatter.script || 'script.js'}`);
    }

    // Create style.css if content exists
    if (styleContent) {
        fs.writeFileSync(path.join(targetDir, frontMatter.style || 'style.css'), styleContent);
        console.log(`  -> Created ${frontMatter.style || 'style.css'}`);
    }
}

// --- Main Fetch Function ---
async function fetch() {
    const args = process.argv.slice(2);
    const itemType = args[0];

    let docRef, itemSlug, targetDir;

    if (itemType === 'post') {
        if (args.length < 3) {
            console.error('Usage: node scripts/fetch.js post <en|ko> <item-slug>');
            rl.close();
            return;
        }
        const [, lang, slug] = args;
        if (!['en', 'ko'].includes(lang)) {
            console.error('Error: Invalid language. Must be "en" or "ko".');
            rl.close();
            return;
        }
        itemSlug = slug;
        docRef = getDocReference(itemType, lang, itemSlug);
        targetDir = path.join(migrationDir, 'posts', lang, itemSlug);
    } else if (['game', 'tool'].includes(itemType)) {
        if (args.length < 2) {
            console.error(`Usage: node scripts/fetch.js ${itemType} <item-slug>`);
            rl.close();
            return;
        }
        const [, slug] = args;
        itemSlug = slug;
        docRef = getDocReference(itemType, null, itemSlug);
        targetDir = path.join(migrationDir, `${itemType}s`, itemSlug);
    } else {
        console.error('Usage: node scripts/fetch.js <game|tool|post> ...');
        rl.close();
        return;
    }

    // Check if directory already exists
    if (fs.existsSync(targetDir)) {
        rl.question(`Warning: Directory "${targetDir}" already exists. Overwrite? (y/N) `, (answer) => {
            if (answer.toLowerCase() === 'y') {
                fs.rmSync(targetDir, { recursive: true, force: true });
                console.log('Removed existing directory.');
                proceedWithFetch(docRef, targetDir);
            } else {
                console.log('Operation cancelled.');
                rl.close();
            }
        });
    } else {
        proceedWithFetch(docRef, targetDir);
    }
}

async function proceedWithFetch(docRef, targetDir) {
    try {
        const doc = await docRef.get();
        if (!doc.exists) {
            console.error(`Error: Document not found at path: ${docRef.path}`);
            return;
        }
        const data = doc.data();

        console.log(`
Fetching document from ${docRef.path}...
`);
        saveItemToLocal(targetDir, data);

        console.log(`
✨ Successfully fetched item to ${targetDir}`);
        console.log('1. Edit the files in the directory.');
        console.log(`2. Run the individual upload command to apply changes.`);

    } catch (error) {
        console.error('\nAn error occurred during fetch:', error);
    } finally {
        rl.close();
    }
}

fetch();
