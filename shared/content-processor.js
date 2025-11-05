/**
 * Processes raw item data from Firestore to generate computed fields for rendering.
 * @param {object} data The raw data object from Firestore.
 * @param {string} lang The language code (e.g., 'en', 'ko').
 * @param {function} marked The imported 'marked' library instance.
 * @returns {object} An object containing processed, ready-to-render HTML strings.
 */
export function processItemData(data, lang, marked) {
    if (!marked) {
        console.error('Marked library instance is required for processItemData');
        return {};
    }
    const name = data.name?.[lang] || data.title || `AutoGen #${data.slug}`;
    const description = data.description?.[lang] || data.summary?.[lang] || '';
    const tagsHtml = (data.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');

    let contentHtml = (data.content && data.content[lang] && data.contentBody)
        ? data.contentBody.replace(/{{__content\.(.*?)__}}/g, (match, key) => {
            const keys = key.split('.');
            let value = data.content[lang];
            for (const k of keys) {
                if (value === undefined) break;
                value = value[k];
            }
            if (typeof value === 'object') return JSON.stringify(value);
            return value !== undefined ? value : match;
        })
        : (data.contentBody || '');

    // For blog posts, the contentBody is Markdown and needs to be parsed.
    if (data.type === 'blog') {
        contentHtml = marked.parse(contentHtml);
    }

    const descriptionHtml = data.desc?.[lang] ? marked.parse(data.desc[lang]) : '';

    return {
        name,
        description,
        tagsHtml,
        contentHtml,
        descriptionHtml
    };
}
