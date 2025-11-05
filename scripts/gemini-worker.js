const admin = require('firebase-admin');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuration ---
const serviceAccount = require('../serviceAccountKey.json');

// --- Initialize Firebase Admin ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- Main Worker Function ---
async function generateContent() {
    console.log('--- Running Gemini Worker ---');

    // 1. Get data from environment variables
    const {
        CONTENT_TYPE, 
        CONTENT_SLUG, 
        ISSUE_BODY, 
        GEMINI_API_KEY, 
        GEMINI_PROMPT, 
        TARGET_LANGUAGE
    } = process.env;

    if (!CONTENT_TYPE || !CONTENT_SLUG) {
        console.error('Error: Missing CONTENT_TYPE or CONTENT_SLUG.');
        process.exit(1);
    }
    if (!GEMINI_API_KEY) {
        console.error('Error: Missing GEMINI_API_KEY.');
        process.exit(1);
    }
    if (!GEMINI_PROMPT) {
        console.error('Error: Missing GEMINI_PROMPT. Check workflow secrets and logic.');
        process.exit(1);
    }

    console.log(`Received request to generate:`);
    console.log(`  - Type: ${CONTENT_TYPE}`);
    console.log(`  - Slug: ${CONTENT_SLUG}`);
    console.log(`  - Target Language: ${TARGET_LANGUAGE || 'default'}`);

    // 2. Call Gemini API to generate content
    let generatedData;
    try {
        console.log('\nInitializing Gemini API...');
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"});

        let finalPrompt = GEMINI_PROMPT.replace('{{USER_PROMPT}}', ISSUE_BODY || 'Please create something interesting.');
        if (TARGET_LANGUAGE) {
            finalPrompt = finalPrompt.replace(/{{TARGET_LANGUAGE}}/g, TARGET_LANGUAGE);
        }

        console.log('Generating content with Gemini...');

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonString = text.replace(/```json\n|```/g, '').trim();
        generatedData = JSON.parse(jsonString);

        console.log('Successfully received and parsed data from Gemini.');

    } catch (error) {
        console.error('\nError during Gemini API call:', error);
        process.exit(1);
    }

    // 3. Prepare data for Firestore
    const firestoreData = {
        ...generatedData,
        type: CONTENT_TYPE.startsWith('post_') ? 'blog' : CONTENT_TYPE,
        slug: CONTENT_SLUG,
        date: new Date().toISOString().split('T')[0],
        icon: 'fa-solid fa-robot',
        tags: ['autogen', ... (generatedData.tags || [])]
    };

    // 4. Save the generated content to the appropriate 'draft' collection
    const draftCollectionName = `draft-${CONTENT_TYPE}`;
    const docRef = db.collection(draftCollectionName).doc(CONTENT_SLUG);

    console.log(`Saving to Firestore path: ${docRef.path}`);
    try {
        await docRef.set(firestoreData);
        console.log('Successfully saved to draft collection in Firestore.');
    } catch (error) {
        console.error('Error saving to Firestore:', error);
        process.exit(1);
    }

    // 5. Output the preview URL for the GitHub Action to use
    const typeForURL = CONTENT_TYPE.startsWith('post_') ? 'post' : CONTENT_TYPE;
    const langPrefix = lang === 'en' ? '' : `/${lang}`;
    const previewUrl = `https://ctrlcat.dev${langPrefix}/preview/?type=${typeForURL}&slug=${CONTENT_SLUG}`;
    console.log(`\nPreview URL: ${previewUrl}`);

    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
        fs.appendFileSync(outputFile, `preview_url=${previewUrl}\n`);
        console.log('Successfully wrote preview_url to GITHUB_OUTPUT.');
    }
}

// --- Run the worker ---
generateContent();