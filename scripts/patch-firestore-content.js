
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const serviceAccount = require('../serviceAccountKey.json');
const i18nDir = path.join(__dirname, '..', 'src', 'i18n');
const languages = ['en', 'ko'];

// --- Initialize Firebase Admin ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- Main Patch Function ---
async function patchFirestoreContent() {
    console.log('Starting to move and patch Firestore documents with content translations...');

    // 1. Load all translations from local i18n files
    const translations = {};
    for (const lang of languages) {
        const langPath = path.join(i18nDir, `${lang}.json`);
        if (fs.existsSync(langPath)) {
            translations[lang] = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
            console.log(`  -> Loaded ${lang}.json`);
        }
    }

    const sourceCollections = ['tools', 'games']; // Collections to read from
    const allPromises = [];

    for (const sourceCollectionName of sourceCollections) {
        const targetCollectionName = sourceCollectionName.slice(0, -1); // 'tools' -> 'tool'
        console.log(`--- Processing collection: ${sourceCollectionName} -> ${targetCollectionName} ---`);
        const snapshot = await db.collection(sourceCollectionName).get();

        if (snapshot.empty) {
            console.log(`  -> No documents found in '${sourceCollectionName}'. Skipping.`);
            continue;
        }

        snapshot.forEach(doc => {
            const slug = doc.id;
            const existingData = doc.data();
            console.log(`  -> Found document: ${slug} in ${sourceCollectionName}`);

            const contentForFirestore = {};
            let contentWasAdded = false;

            for (const lang of languages) {
                const itemTranslations = translations[lang]?.[slug];
                if (itemTranslations?.content) {
                    contentForFirestore[lang] = itemTranslations.content;
                    contentWasAdded = true;
                }
            }

            // Create the new document data by merging existing data with new content translations
            const newDocData = {
                ...existingData,
                content: contentForFirestore // This will overwrite or add the content field
            };

            // Write to the new singular collection
            console.log(`    -> Creating document '${slug}' in new collection '${targetCollectionName}'.`);
            const promise = db.collection(targetCollectionName).doc(slug).set(newDocData);
            allPromises.push(promise);
        });
    }

    try {
        await Promise.all(allPromises);
        console.log('\nSuccessfully moved and patched all documents!');
    } catch (error) {
        console.error('\nAn error occurred while updating documents:', error);
    }
}

patchFirestoreContent();
