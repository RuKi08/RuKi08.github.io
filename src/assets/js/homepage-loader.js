// This script will contain the logic to load featured tools, blog posts, and item grids onto the homepage.

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.json();
}

function createItemCard(item, lang) {
    const itemUrl = `/${lang !== 'en' ? lang + '/' : ''}${item.type}/${item.slug}`;
    return `
        <a href="${itemUrl}" class="item-card">
            <div class="item-icon">${item.icon || '<i class="fa-solid fa-question"></i>'}</div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
            </div>
        </a>
    `;
}

// More functions to load sections will be added here...

export function initHomepage() {
    console.log("Homepage Initialized");
    // We will call functions to load each section here.
    loadFeatured();
    loadLatestBlogPosts();
}

async function loadFeatured() {
    // Placeholder for featured tools logic
    const container = document.getElementById('featured-tools-container');
    if (container) {
        container.innerHTML = "<p>Featured tools coming soon.</p>";
    }
}

async function loadLatestBlogPosts() {
    const container = document.getElementById('blog-posts-container');
    if (!container) return;

    const allItems = await fetchJson('/assets/data/items.json');
    if (!allItems || !allItems.blogs || allItems.blogs.length === 0) {
        container.innerHTML = '<p>No posts found.</p>';
        return;
    }

    // Take the 3 most recent posts
    const latestPosts = allItems.blogs.slice(0, 3);

    let postsHtml = latestPosts.map(post => {
        return `
            <a href="/blog/${post.slug}" class="blog-post-card-mini">
                <div class="blog-post-card-mini-icon">${post.icon || '<i class="fa-solid fa-question"></i>'}</div>
                <div class="blog-post-card-mini-info">
                    <h4>${post.title}</h4>
                    <span class="blog-post-card-meta">${post.date}</span>
                </div>
            </a>
        `;
    }).join('');

    container.innerHTML = postsHtml;
}
