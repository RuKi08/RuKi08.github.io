
const admin = require('firebase-admin');

// --- Configuration ---
const serviceAccount = require('../serviceAccountKey.json');

// --- Initialize Firebase Admin ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- Main Patch Function ---
async function patchPlaceholders() {
    console.log('Starting to patch placeholders in Firestore documents...');

    const collectionsToPatch = ['tool', 'game'];
    const allPromises = [];

    for (const collectionName of collectionsToPatch) {
        console.log(`--- Processing collection: ${collectionName} ---`);
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
            console.log(`  -> No documents found in '${collectionName}'. Skipping.`);
            continue;
        }

        snapshot.forEach(doc => {
            const slug = doc.id;
            const data = doc.data();
            
            if (data.contentBody && data.contentBody.includes('__i18n.content.')) {
                console.log(`  -> Found old placeholders in '${slug}'. Patching...`);
                const newContentBody = data.contentBody.replace(/__i18n\.content\./g, '__content.');
                
                const promise = doc.ref.update({ contentBody: newContentBody });
                allPromises.push(promise);
            } else {
                console.log(`  -> No old placeholders found in '${slug}'. Skipping.`);
            }
        });
    }

    if (allPromises.length === 0) {
        console.log('\nNo documents needed patching.');
        return;
    }

    try {
        await Promise.all(allPromises);
        console.log(`\nSuccessfully patched ${allPromises.length} documents!`);
    } catch (error) {
        console.error('\nAn error occurred while updating documents:', error);
    }
}

patchPlaceholders();
