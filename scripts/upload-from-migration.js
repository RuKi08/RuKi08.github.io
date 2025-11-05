
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

// --- Main Upload Function ---
async function uploadFromMigration() {
    console.log(`Starting upload to Firestore from local directory: ${migrationDir}`);

    if (!fs.existsSync(migrationDir)) {
        console.error(`Error: Migration directory not found at ${migrationDir}`);
        console.error('Please run the download script first.');
        return;
    }

    try {
        // 1. Upload tools and games
        const itemTypes = ['tools', 'games'];
        for (const itemType of itemTypes) { // e.g., 'tools'
            const collectionName = itemType.slice(0, -1); // e.g., 'tool'
            const typeDir = path.join(migrationDir, itemType);
            if (!fs.existsSync(typeDir)) continue;

            const itemSlugs = fs.readdirSync(typeDir);
            console.log(`  -> Uploading to '${collectionName}' collection...`);

            for (const slug of itemSlugs) {
                const itemDir = path.join(typeDir, slug);
                const mdPath = path.join(itemDir, 'index.md');
                if (!fs.existsSync(mdPath)) continue;

                const mdFile = fs.readFileSync(mdPath, 'utf-8');
                const { data: frontMatter, content: contentBody } = matter(mdFile);

                let dataToUpload = { ...frontMatter, contentBody };

                // Find and add script/style content
                const otherFiles = fs.readdirSync(itemDir).filter(f => f !== 'index.md');
                for (const file of otherFiles) {
                    if (file.endsWith('.js')) {
                        dataToUpload.scriptContent = fs.readFileSync(path.join(itemDir, file), 'utf-8');
                        dataToUpload.script = file; // Save filename
                    } else if (file.endsWith('.css')) {
                        dataToUpload.styleContent = fs.readFileSync(path.join(itemDir, file), 'utf-8');
                        dataToUpload.style = file; // Save filename
                    }
                }
                
                // Use slug from front-matter as document ID
                const docId = dataToUpload.slug;
                if (!docId) {
                    console.warn(`    - Skipping directory without slug in front-matter: ${itemDir}`)
                    continue;
                }

                await db.collection(collectionName).doc(docId).set(dataToUpload);
                console.log(`    - Uploaded ${collectionName}/${docId}`);
            }
        }

        // 2. Upload blog posts
        const postsDir = path.join(migrationDir, 'posts');
        if (fs.existsSync(postsDir)) {
            const languages = fs.readdirSync(postsDir);
            for (const lang of languages) {
                const collectionName = `post_${lang}`;
                const langDir = path.join(postsDir, lang);
                if (!fs.statSync(langDir).isDirectory()) continue;

                const postSlugs = fs.readdirSync(langDir);
                console.log(`  -> Uploading to '${collectionName}' collection...`);

                for (const slug of postSlugs) {
                    const itemDir = path.join(langDir, slug);
                    const mdPath = path.join(itemDir, 'index.md');
                    if (!fs.existsSync(mdPath)) continue;

                    const mdFile = fs.readFileSync(mdPath, 'utf-8');
                    const { data: frontMatter, content: contentBody } = matter(mdFile);

                    let dataToUpload = { ...frontMatter, contentBody };
                    const docId = dataToUpload.slug;

                     if (!docId) {
                        console.warn(`    - Skipping directory without slug in front-matter: ${itemDir}`)
                        continue;
                    }

                    await db.collection(collectionName).doc(docId).set(dataToUpload);
                    console.log(`    - Uploaded ${collectionName}/${docId}`);
                }
            }
        }

        console.log('Upload complete!');
        console.log(`All content from /content-to-migrate/ has been uploaded to Firestore.`);

        // 3. Clean up the migration directory
        fs.rmSync(migrationDir, { recursive: true, force: true });
        console.log('Successfully removed the /content-to-migrate/ directory.');

    } catch (error) {
        console.error('\nAn error occurred during upload:', error);
    }
}

uploadFromMigration();
