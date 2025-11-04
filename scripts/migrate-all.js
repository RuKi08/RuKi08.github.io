const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// --- Configuration ---
const serviceAccount = require('../serviceAccountKey.json');
const contentDir = path.join(__dirname, '..', 'src', 'content-new');

// --- Initialize Firebase Admin ---
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();
console.log('Firebase Admin initialized.');

// --- Main Migration Function ---
async function migrateAll() {
    console.log('Starting full content migration to Firestore (with file contents)...');
    const batchSize = 10;
    let batch = db.batch();
    let writeCount = 0;

    async function commitBatch() {
        if (writeCount === 0) return;
        await batch.commit();
        console.log(`  -> Committed ${writeCount} writes to Firestore.`);
        batch = db.batch();
        writeCount = 0;
    }

    try {
        // --- Migrate Tools and Games ---
        const itemTypes = ['tools', 'games'];
        for (const type of itemTypes) {
            const typeDir = path.join(contentDir, type);
            if (!fs.existsSync(typeDir)) continue;

            const items = fs.readdirSync(typeDir).filter(file =>
                fs.statSync(path.join(typeDir, file)).isDirectory()
            );

            for (const slug of items) {
                const itemPath = path.join(typeDir, slug);
                const mdPath = path.join(itemPath, 'index.md');
                if (!fs.existsSync(mdPath)) continue;

                const fileContent = fs.readFileSync(mdPath, 'utf-8');
                const { data: frontMatter, content } = matter(fileContent);

                const docData = { ...frontMatter, contentBody: content };

                // Read and add script content if it exists
                if (frontMatter.script) {
                    const scriptPath = path.join(itemPath, frontMatter.script);
                    if (fs.existsSync(scriptPath)) {
                        docData.scriptContent = fs.readFileSync(scriptPath, 'utf-8');
                    }
                }

                // Read and add style content if it exists
                if (frontMatter.style) {
                    const stylePath = path.join(itemPath, frontMatter.style);
                    if (fs.existsSync(stylePath)) {
                        docData.styleContent = fs.readFileSync(stylePath, 'utf-8');
                    }
                }

                docData.migratedAt = admin.firestore.FieldValue.serverTimestamp();

                const docRef = db.collection(type).doc(slug);
                batch.set(docRef, docData);
                writeCount++;

                if (writeCount >= batchSize) await commitBatch();
            }
        }
        await commitBatch(); // Commit remaining tool/game items

        // --- Migrate Blog Posts ---
        const postsRoot = path.join(contentDir, 'posts');
        if (fs.existsSync(postsRoot)) {
            const languages = fs.readdirSync(postsRoot);
            for (const lang of languages) {
                const langDir = path.join(postsRoot, lang);
                if (!fs.statSync(langDir).isDirectory()) continue;

                const collectionName = `posts_${lang}`;
                const posts = fs.readdirSync(langDir);

                for (const slug of posts) {
                    const mdPath = path.join(langDir, slug, 'index.md');
                    if (!fs.existsSync(mdPath)) continue;

                    const fileContent = fs.readFileSync(mdPath, 'utf-8');
                    const { data: frontMatter, content } = matter(fileContent);

                    const docData = { ...frontMatter, contentBody: content, migratedAt: admin.firestore.FieldValue.serverTimestamp() };
                    const docRef = db.collection(collectionName).doc(slug);
                    batch.set(docRef, docData);
                    writeCount++;

                    if (writeCount >= batchSize) await commitBatch();
                }
            }
        }

        // Commit any remaining writes
        if (writeCount > 0) {
            await commitBatch();
        }

        console.log('\nFull content migration to Firestore complete!');

    } catch (error) {
        console.error('\nError during migration:', error);
    }
}

// --- Run Migration ---
migrateAll();
