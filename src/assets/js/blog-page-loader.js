async function fetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.statusText}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
}

function renderTree(node, container) {
    const ul = document.createElement('ul');
    if (node.type === 'category') {
        ul.classList.add('category-list');
    }

    node.children.forEach(child => {
        const li = document.createElement('li');
        if (child.type === 'category') {
            li.innerHTML = `<span><i class="fa-solid fa-folder"></i> ${child.name}</span>`;
            renderTree(child, li);
        } else { // post
            li.innerHTML = `<a href="/blog/${child.slug}"><i class="fa-solid fa-file-lines"></i> ${child.name}</a>`;
        }
        ul.appendChild(li);
    });
    container.appendChild(ul);
}

async function loadSidebar() {
    const treeContainer = document.getElementById('blog-category-tree');
    if (!treeContainer) return;

    const treeData = await fetchJson('/assets/data/blog-tree.json');
    if (treeData && treeData.length > 0) {
        const root = { type: 'category', children: treeData };
        renderTree(root, treeContainer);
    }
}

async function loadPosts() {
    const postsContainer = document.getElementById('blog-posts-container');
    if (!postsContainer) return;

    const allItems = await fetchJson('/assets/data/items.json');
    if (!allItems || !allItems.blogs || allItems.blogs.length === 0) {
        postsContainer.innerHTML = '<p>No posts found.</p>';
        return;
    }

    let postsHtml = allItems.blogs.map(post => {
        return `
            <a href="/blog/${post.slug}" class="blog-post-card">
                <div class="blog-post-card-icon">${post.icon || '<i class="fa-solid fa-question"></i>'}</div>
                <div class="blog-post-card-info">
                    <h3>${post.title}</h3>
                    <p>${post.description}</p>
                    <span class="blog-post-card-meta">${post.author} &middot; ${post.date}</span>
                </div>
            </a>
        `;
    }).join('');

    postsContainer.innerHTML = postsHtml;
}

export function initBlogPage() {
    loadSidebar();
    loadPosts();
}
