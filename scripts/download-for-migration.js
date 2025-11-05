
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

// --- Main Download Function ---
async function downloadForMigration() {
    console.log(`Starting download from Firestore to local directory: ${migrationDir}`);

    // 1. Clean or create the migration directory
    if (fs.existsSync(migrationDir)) {
        fs.rmSync(migrationDir, { recursive: true, force: true });
    }
    fs.mkdirSync(migrationDir, { recursive: true });

    try {
        // 2. Download tools and games
        const itemCollections = ['tool', 'game'];
        for (const collectionName of itemCollections) {
            const targetDir = path.join(migrationDir, `${collectionName}`);
            fs.mkdirSync(targetDir, { recursive: true });

            const snapshot = await db.collection(collectionName).get();
            if (snapshot.empty) continue;

            console.log(`  -> Downloading '${collectionName}' collection...`);
            for (const doc of snapshot.docs) {
                const data = doc.data();
                const itemDir = path.join(targetDir, data.slug);
                fs.mkdirSync(itemDir, { recursive: true });

                const { contentBody, scriptContent, styleContent, ...frontMatter } = data;

                const mdContent = matter.stringify(contentBody || '', frontMatter);
                fs.writeFileSync(path.join(itemDir, 'index.md'), mdContent);

                if (scriptContent) {
                    fs.writeFileSync(path.join(itemDir, data.script || 'script.js'), scriptContent);
                }
                if (styleContent) {
                    fs.writeFileSync(path.join(itemDir, data.style || 'style.css'), styleContent);
                }
            }
        }

        // 3. Download blog posts
        const languages = ['en', 'ko'];
        const postsTargetDir = path.join(migrationDir, 'posts');
        fs.mkdirSync(postsTargetDir, { recursive: true });

        for (const lang of languages) {
            const collectionName = `post_${lang}`;
            const langDir = path.join(postsTargetDir, lang);
            fs.mkdirSync(langDir, { recursive: true });

            const snapshot = await db.collection(collectionName).get();
            if (snapshot.empty) continue;

            console.log(`  -> Downloading '${collectionName}' collection...`);
            for (const doc of snapshot.docs) {
                const data = doc.data();
                const itemDir = path.join(langDir, data.slug);
                fs.mkdirSync(itemDir, { recursive: true });

                const { contentBody, ...frontMatter } = data;

                const mdContent = matter.stringify(contentBody || '', frontMatter);
                fs.writeFileSync(path.join(itemDir, 'index.md'), mdContent);
            }
        }

        console.log('\nDownload for migration complete!');
        console.log(`All content from Firestore has been saved to the /content-to-migrate/ directory.`);

    } catch (error) {
        console.error('\nAn error occurred during download:', error);
    }
}

downloadForMigration();
