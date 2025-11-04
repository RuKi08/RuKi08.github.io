
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// --- Configuration ---
const serviceAccount = require('../serviceAccountKey.json');
const backupDir = path.join(__dirname, '..', 'content-backup');

// --- Initialize Firebase Admin ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- Main Backup Function ---
async function backupFromFirebase() {
    console.log(`Starting backup from Firestore to local directory: ${backupDir}`);

    // 1. Clean or create the backup directory
    if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true });
    }
    fs.mkdirSync(backupDir, { recursive: true });

    try {
        // 2. Backup tools and games
        const itemCollections = ['tool', 'game'];
        for (const collectionName of itemCollections) {
            const targetDir = path.join(backupDir, `${collectionName}s`); // tool -> tools
            fs.mkdirSync(targetDir, { recursive: true });

            const snapshot = await db.collection(collectionName).get();
            if (snapshot.empty) continue;

            console.log(`  -> Backing up '${collectionName}' collection...`);
            for (const doc of snapshot.docs) {
                const data = doc.data();
                const itemDir = path.join(targetDir, data.slug);
                fs.mkdirSync(itemDir, { recursive: true });

                // Separate front-matter from other data
                const { contentBody, scriptContent, styleContent, migratedAt, ...frontMatter } = data;

                // Create index.md
                const mdContent = matter.stringify(contentBody || '', frontMatter);
                fs.writeFileSync(path.join(itemDir, 'index.md'), mdContent);

                // Create script.js if content exists
                if (scriptContent) {
                    fs.writeFileSync(path.join(itemDir, data.script), scriptContent);
                }

                // Create style.css if content exists
                if (styleContent) {
                    fs.writeFileSync(path.join(itemDir, data.style), styleContent);
                }
            }
        }

        // 3. Backup blog posts
        const languages = ['en', 'ko'];
        const postsTargetDir = path.join(backupDir, 'posts');
        fs.mkdirSync(postsTargetDir, { recursive: true });

        for (const lang of languages) {
            const collectionName = `post_${lang}`;
            const langDir = path.join(postsTargetDir, lang);
            fs.mkdirSync(langDir, { recursive: true });

            const snapshot = await db.collection(collectionName).get();
            if (snapshot.empty) continue;

            console.log(`  -> Backing up '${collectionName}' collection...`);
            for (const doc of snapshot.docs) {
                const data = doc.data();
                const itemDir = path.join(langDir, data.slug);
                fs.mkdirSync(itemDir, { recursive: true });

                const { contentBody, migratedAt, ...frontMatter } = data;

                const mdContent = matter.stringify(contentBody || '', frontMatter);
                fs.writeFileSync(path.join(itemDir, 'index.md'), mdContent);
            }
        }

        console.log('\nBackup complete!');
        console.log(`All content from Firestore has been saved to the /content-backup/ directory.`);

    } catch (error) {
        console.error('\nAn error occurred during backup:', error);
    }
}

backupFromFirebase();
