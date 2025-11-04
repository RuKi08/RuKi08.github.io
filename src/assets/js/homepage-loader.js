const siteConfig = {
    defaultLang: 'en',
    languages: ['en', 'ko']
};

function getPathContext() {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(p => p); // Filter out empty strings

    let lang = siteConfig.defaultLang;
    let langPrefix = '';
    let basePath = path;

    if (pathParts.length > 0 && siteConfig.languages.includes(pathParts[0]) && pathParts[0] !== siteConfig.defaultLang) {
        lang = pathParts[0];
        langPrefix = `/${lang}`;
        // Reconstruct basePath without the language part
        basePath = '/' + pathParts.slice(1).join('/');
    }

    return { lang, langPrefix, basePath };
}

async function fetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error(`Failed to fetch ${url}:`, e);
        return null;
    }
}

function createItemCard(item, itemType, lang, langPrefix) {
    const itemUrl = `${langPrefix}/${itemType}/${item.dir}/`;
    const iconHtml = item.icon.startsWith('<') ? item.icon : `<i class="${item.icon}"></i>`;

    return `
        <a href="${itemUrl}" class="c-card">
            <div class="c-card__icon">${iconHtml}</div>
            <h3 class="c-card__title">${item.name[lang]}</h3>
            <p class="c-card__text">${item.description[lang]}</p>
        </a>
    `;
}

async function loadItemGrid(containerId, itemType, allItems, count) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { lang, langPrefix } = getPathContext();
    const items = allItems[itemType + 's'] || [];

    if (items.length === 0) {
        container.innerHTML = `<p>No ${itemType}s found.</p>`;
        return;
    }

    const itemsToShow = items.slice(0, count);
    container.innerHTML = itemsToShow.map(item => createItemCard(item, itemType, lang, langPrefix)).join('');
}

async function loadLatestBlogPosts(allItems) {
    const container = document.getElementById('blog-posts-container');
    if (!container) return;

    const { langPrefix } = getPathContext();
    const posts = allItems.blogs || [];

    if (posts.length === 0) {
        container.innerHTML = '<p>No posts found.</p>';
        return;
    }

    const latestPosts = posts.slice(0, 3);
    container.innerHTML = latestPosts.map(post => {
        const postUrl = `${langPrefix}/blog/${post.dir}/`;
        const iconHtml = post.icon.startsWith('<') ? post.icon : `<i class="${post.icon}"></i>`;
        return `
            <a href="${postUrl}" class="blog-post-card-mini">
                <div class="blog-post-card-mini-icon">${iconHtml}</div>
                <div class="blog-post-card-mini-info">
                    <h4>${post.title}</h4>
                    <span class="blog-post-card-meta">${post.date}</span>
                </div>
            </a>
        `;
    }).join('');
}

export async function initHomepage() {
    console.log("Homepage Initialized");
    const { langPrefix } = getPathContext();
    const allItems = await fetchJson(`${langPrefix}/assets/data/items.json`);

    if (!allItems) {
        // Display error message on all sections
        document.getElementById('featured-tools-container').innerHTML = '<p>Error loading content.</p>';
        document.getElementById('blog-posts-container').innerHTML = '<p>Error loading content.</p>';
        document.getElementById('all-tools-container').innerHTML = '<p>Error loading content.</p>';
        document.getElementById('all-games-container').innerHTML = '<p>Error loading content.</p>';
        return;
    }

    loadItemGrid('featured-tools-container', 'tool', allItems, 3);
    loadLatestBlogPosts(allItems);
    loadItemGrid('all-tools-container', 'tool', allItems, 6);
    loadItemGrid('all-games-container', 'game', allItems, 6);
}
