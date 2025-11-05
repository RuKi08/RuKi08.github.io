
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// --- Configuration ---
const serviceAccount = require('../serviceAccountKey.json');
const deletedDir = path.join(__dirname, '..', 'content-deleted');

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

// --- Main Remove Function ---
async function remove() {
    const args = process.argv.slice(2);
    const itemType = args[0];

    let docRef, itemSlug, itemLang;

    if (itemType === 'post') {
        if (args.length < 3) {
            console.error('Usage: node scripts/remove.js post <en|ko> <item-slug>');
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
        itemLang = lang;
        docRef = getDocReference(itemType, itemLang, itemSlug);
    } else if (['game', 'tool'].includes(itemType)) {
        if (args.length < 2) {
            console.error(`Usage: node scripts/remove.js ${itemType} <item-slug>`);
            rl.close();
            return;
        }
        const [, slug] = args;
        itemSlug = slug;
        docRef = getDocReference(itemType, null, itemSlug);
    } else {
        console.error('Usage: node scripts/remove.js <game|tool|post> ...');
        rl.close();
        return;
    }

    try {
        // 1. Fetch the document first
        const doc = await docRef.get();
        if (!doc.exists) {
            console.error(`Error: Document not found at path: ${docRef.path}`);
            rl.close();
            return;
        }
        const data = doc.data();

        // 2. Ask for confirmation
        console.log(`You are about to delete the following item from Firestore:`);
        console.log(`  - Path: ${docRef.path}`);
        console.log(`  - Name: ${data.name?.en || data.title}`);
        rl.question('Are you sure you want to proceed? (y/N) ', async (answer) => {
            if (answer.toLowerCase() !== 'y') {
                console.log('Operation cancelled.');
                rl.close();
                return;
            }

            try {
                // 3. Backup before deleting
                if (!fs.existsSync(deletedDir)) {
                    fs.mkdirSync(deletedDir, { recursive: true });
                }
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFileName = `${itemType}${itemLang ? '-' + itemLang : ''}-${itemSlug}-${timestamp}.json`;
                const backupPath = path.join(deletedDir, backupFileName);
                fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
                console.log(`\nSuccessfully backed up document to: ${backupPath}`);

                // 4. Delete the document
                await docRef.delete();
                console.log(`Successfully deleted document: ${docRef.path}`);

            } catch (e) {
                console.error('\nAn error occurred during the delete operation:', e);
            } finally {
                rl.close();
            }
        });

    } catch (error) {
        console.error('\nAn error occurred while fetching the document:', error);
        rl.close();
    }
}

remove();
