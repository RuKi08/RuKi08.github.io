const siteConfig = {
    defaultLang: 'en',
    languages: ['en', 'ko']
};

// --- Global variables ---
let allPostsData = [];

// --- Utility Functions ---
function getPathContext() {
    const path = window.location.pathname;
    const pathParts = path.split('/');
    const langCode = pathParts[1];

    if (siteConfig.languages.includes(langCode) && langCode !== siteConfig.defaultLang) {
        return {
            lang: langCode,
            langPrefix: `/${langCode}`,
        };
    }

    return {
        lang: siteConfig.defaultLang,
        langPrefix: '',
    };
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

// --- Rendering Functions ---
function renderPosts(posts) {
    const postsContainer = document.getElementById('blog-posts-list');
    if (!postsContainer) return;

    const { langPrefix } = getPathContext();

    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = '<p>No posts found in this category.</p>';
        return;
    }

    postsContainer.innerHTML = posts.map(post => {
        const postUrl = `${langPrefix}/blog/${post.dir}/`;
        const tagsHtml = (post.tags && post.tags.length) 
            ? `<div class="blog-post-card-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` 
            : '';

        return `
            <a href="${postUrl}" class="blog-post-card">
                <div class="blog-post-card-title"><h3>${post.title}</h3></div>
                <p class="blog-post-card-excerpt">${post.description}</p>
                <div class="blog-post-card-meta">${post.date}</div>
                ${tagsHtml}
            </a>
        `;
    }).join('');
}

function renderCategoryTree(treeData) {
    const treeContainer = document.getElementById('blog-category-tree');
    if (!treeContainer) return;

    const { langPrefix } = getPathContext();

    const createSubtree = (nodes) => {
        const ul = document.createElement('ul');
        nodes.forEach(node => {
            const li = document.createElement('li');
            if (node.type === 'category') {
                const categoryDirs = getAllPostDirs(node);
                li.innerHTML = `
                    <div class="category-name" data-dirs='${JSON.stringify(categoryDirs)}'>
                        <span class="icon">></span>
                        <span>${node.name}</span>
                    </div>
                `;
                li.appendChild(createSubtree(node.children));
            } else {
                const postUrl = `${langPrefix}/blog/${node.dir}/`;
                li.innerHTML = `<a href="${postUrl}" class="post-link">${node.name}</a>`;
            }
            ul.appendChild(li);
        });
        return ul;
    };

    treeContainer.appendChild(createSubtree(treeData));
    addEventListenersToTree(treeContainer);
}

// --- Logic & Event Handling ---
function addEventListenersToTree(treeContainer) {
    treeContainer.addEventListener('click', (e) => {
        const categoryName = e.target.closest('.category-name');

        if (categoryName) {
            e.preventDefault();
            const wasActive = categoryName.classList.contains('active');

            // Remove active class from all categories first
            document.querySelectorAll('#blog-category-tree .category-name').forEach(el => el.classList.remove('active'));

            if (wasActive) {
                // If it was already active, deactivate it and show all posts
                renderPosts(allPostsData);
            } else {
                // Otherwise, activate it and filter
                categoryName.classList.add('active');
                categoryName.classList.toggle('collapsed'); // This handles the icon
                const dirs = JSON.parse(categoryName.dataset.dirs);
                const filteredPosts = allPostsData.filter(p => dirs.includes(p.dir));
                renderPosts(filteredPosts);
            }
        }
        // Post links are now regular anchors, no JS needed
    });
}

function getAllPostDirs(categoryNode) {
    let dirs = [];
    if (categoryNode.children) {
        categoryNode.children.forEach(child => {
            if (child.type === 'post') {
                dirs.push(child.dir);
            } else if (child.type === 'category') {
                dirs = dirs.concat(getAllPostDirs(child));
            }
        });
    }
    return dirs;
}

// --- Initialization ---
export async function initBlogPage() {
    // --- Collapsible Sidebar Logic ---
    const openBtn = document.getElementById('sidebar-open-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const overlay = document.querySelector('.sidebar-overlay');
    const body = document.body;

    if (openBtn && closeBtn && overlay) {
        openBtn.addEventListener('click', () => {
            body.classList.add('sidebar-is-open');
        });

        closeBtn.addEventListener('click', () => {
            body.classList.remove('sidebar-is-open');
        });

        overlay.addEventListener('click', () => {
            body.classList.remove('sidebar-is-open');
        });
    }

    // --- Content Loading Logic ---
    const { langPrefix } = getPathContext();
    const allItems = await fetchJson(`${langPrefix}/assets/data/items.json`);
    const treeData = await fetchJson(`${langPrefix}/assets/data/blog-tree.json`);

    if (allItems && allItems.blogs) {
        allPostsData = allItems.blogs;
        renderPosts(allPostsData);
    } else {
        document.getElementById('blog-posts-list').innerHTML = '<p>Error loading posts.</p>';
    }

    if (treeData) {
        renderCategoryTree(treeData);
    } else {
        document.getElementById('blog-category-tree').innerHTML = '<p>Error loading categories.</p>';
    }
}
