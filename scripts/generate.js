const fs = require('fs');
const path = require('path');

// --- Configuration ---
const migrationDir = path.join(__dirname, '..', 'content-to-migrate');

// --- File Content Templates ---
const toolTemplate = (slug) => `--- 
type: tool
slug: ${slug}
name:
  en: New Tool ${slug}
  ko: 새 도구 ${slug}
description:
  en: "A description for the new tool."
  ko: "새 도구에 대한 설명입니다."
desc:
  en: "### About\\n\\nDetailed description in English."
  ko: "### 소개\\n\\n한국어 상세 설명입니다."
icon: fa-solid fa-star
tags:
  - new
script: script.js
content:
  en:
    title: "Welcome"
  ko:
    title: "환영합니다"
---
<!-- HTML content for ${slug} goes here -->
`;

const gameTemplate = (slug) => `--- 
type: game
slug: ${slug}
name:
  en: New Game ${slug}
  ko: 새 게임 ${slug}
description:
  en: "A description for the new game."
  ko: "새 게임에 대한 설명입니다."
desc:
  en: "### About\\n\\nDetailed description in English."
  ko: "### 소개\\n\\n한국어 상세 설명입니다."
icon: fa-solid fa-star
tags:
  - new
script: script.js
style: style.css
content:
  en:
    title: "Welcome"
  ko:
    title: "환영합니다"
---
<!-- HTML content for ${slug} goes here -->
`;

const postTemplate = (slug) => `--- 
type: blog
slug: ${slug}
date: ${new Date().toISOString().split('T')[0]}
title: New Post ${slug}
description: A description for the new post.
author: Ctrlcat Staff
tags:
  - new
---
### Title
content starts here.
`;

const scriptTemplate = () => `// Script for the new item
export function init() {
    console.log('Item initialized!');
}
`;

const styleTemplate = () => `/* Styles for the new item */
`;

// --- Main Scaffolding Logic ---
function generate() {
    const args = process.argv.slice(2);
    const itemType = args[0];

    let targetDir, itemSlug;

    if (itemType === 'post') {
        if (args.length < 3) {
            console.error('Usage: node scripts/generate.js post <en|ko> <item-slug>');
            return;
        }
        const [, lang, slug] = args;
        if (!['en', 'ko'].includes(lang)) {
            console.error('Error: Invalid language. Must be "en" or "ko".');
            return;
        }
        itemSlug = slug;
        targetDir = path.join(migrationDir, 'posts', lang, itemSlug);
    } else if (['game', 'tool'].includes(itemType)) {
        if (args.length < 2) {
            console.error(`Usage: node scripts/generate.js ${itemType} <item-slug>`);
            return;
        }
        const [, slug] = args;
        itemSlug = slug;
        targetDir = path.join(migrationDir, itemType + 's', itemSlug);
    } else {
        console.error('Usage: node scripts/generate.js <game|tool|post> ...');
        return;
    }

    console.log('Generating new ' + itemType + ': "' + itemSlug + '"');
    console.log('Target Directory: ' + targetDir);

    if (fs.existsSync(targetDir)) {
        console.error('Error: Directory already exists: ' + targetDir);
        return;
    }

    try {
        fs.mkdirSync(targetDir, { recursive: true });

        const templates = {
            tool: { 'index.md': toolTemplate(itemSlug), 'script.js': scriptTemplate() },
            game: { 'index.md': gameTemplate(itemSlug), 'script.js': scriptTemplate(), 'style.css': styleTemplate() },
            post: { 'index.md': postTemplate(itemSlug) }
        };

        const filesToCreate = templates[itemType];
        for (const [fileName, content] of Object.entries(filesToCreate)) {
            fs.writeFileSync(path.join(targetDir, fileName), content);
            console.log('  -> Created ' + fileName);
        }

        console.log('\n✨ Successfully created files for "' + itemSlug + '".');
        console.log('1. Edit the files in the new directory.');
        const uploadCommand = itemType === 'post' ? 'npm run upload -- post ' + args[1] + ' ' + itemSlug : 'npm run upload -- ' + itemType + ' ' + itemSlug;
        console.log('2. Run "' + uploadCommand + '" to upload to Firestore.');

    } catch (error) {
        console.error('\nAn error occurred during generation:', error);
    }
}

generate();
