
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

// --- Main Rename Function ---
async function renameCollections() {
    console.log('Starting to rename collections...');

    const languages = ['en', 'ko'];

    for (const lang of languages) {
        const oldCollectionName = `posts_${lang}`;
        const newCollectionName = `post_${lang}`;
        console.log(`--- Renaming ${oldCollectionName} -> ${newCollectionName} ---`);

        const oldCollectionRef = db.collection(oldCollectionName);
        const snapshot = await oldCollectionRef.get();

        if (snapshot.empty) {
            console.log(`  -> Source collection '${oldCollectionName}' is empty. Skipping.`);
            continue;
        }

        // Batch write to new collection
        let writeBatch = db.batch();
        let count = 0;
        snapshot.forEach(doc => {
            const docData = doc.data();
            const newDocRef = db.collection(newCollectionName).doc(doc.id);
            writeBatch.set(newDocRef, docData);
            count++;
        });

        await writeBatch.commit();
        console.log(`  -> Successfully copied ${count} documents to '${newCollectionName}'.`);

        // Batch delete from old collection
        let deleteBatch = db.batch();
        snapshot.forEach(doc => {
            deleteBatch.delete(doc.ref);
        });

        await deleteBatch.commit();
        console.log(`  -> Successfully deleted ${count} documents from old collection '${oldCollectionName}'.`);
    }

    console.log('\nCollection renaming process complete!');
}

renameCollections();
