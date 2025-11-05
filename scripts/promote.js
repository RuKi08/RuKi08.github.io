
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

// --- Main Promotion Function ---
async function promote() {
    console.log('--- Running Promotion Script ---');

    // 1. Get data from command line arguments
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node scripts/promote.js <type> <slug>');
        process.exit(1);
    }
    const [type, slug] = args;

    console.log(`Received request to promote:`);
    console.log(`  - Type: ${type}`);
    console.log(`  - Slug: ${slug}`);

    // 2. Determine collection names
    // TODO: Handle multilingual posts more robustly if needed.
    const draftCollectionName = `draft-${type === 'post' ? 'post_en' : type}`;
    const prodCollectionName = type === 'post' ? 'post_en' : type;

    const draftDocRef = db.collection(draftCollectionName).doc(slug);
    const prodDocRef = db.collection(prodCollectionName).doc(slug);

    try {
        // 3. Get the document from the draft collection
        console.log(`Fetching from ${draftDocRef.path}...`);
        const doc = await draftDocRef.get();

        if (!doc.exists) {
            console.error('Error: Document not found in draft collection.');
            process.exit(1);
        }
        const data = doc.data();

        // 4. Write the document to the production collection
        console.log(`Promoting to ${prodDocRef.path}...`);
        await prodDocRef.set(data);
        console.log('Successfully wrote to production collection.');

        // 5. Delete the document from the draft collection
        console.log(`Deleting from ${draftDocRef.path}...`);
        await draftDocRef.delete();
        console.log('Successfully deleted from draft collection.');

        console.log(`\n✅ Promotion complete for ${type}: ${slug}`);

    } catch (error) {
        console.error('\nAn error occurred during promotion:', error);
        process.exit(1);
    }
}

// --- Run the script ---
promote();
