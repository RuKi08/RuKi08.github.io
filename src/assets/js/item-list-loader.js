const siteConfig = {
    defaultLang: 'en',
    languages: ['en', 'ko']
};

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

export async function loadItemList(itemType) {
    const { langPrefix } = getPathContext();
    const listContainer = document.getElementById(`${itemType}-list-container`);
    const tagContainer = document.getElementById('tag-list');
    const searchInput = document.getElementById('search-input');
    const expandBtn = document.getElementById('expand-tags-btn');
    const i18nData = document.getElementById('i18n-data');
    if (!listContainer || !tagContainer || !searchInput || !expandBtn || !i18nData) return;

    try {
        const response = await fetch(`${langPrefix}/assets/data/items.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch items.json: ${response.statusText}`);
        }
        const allData = await response.json();
        
        const itemsData = itemType === 'game' ? allData.games : allData.tools;
        
        const allTags = new Set();
        itemsData.forEach(item => {
            if (item.tags) {
                item.tags.forEach(tag => allTags.add(tag));
            }
        });

        renderItems(itemsData, listContainer, itemType);
        renderTags(allTags, tagContainer);

        searchInput.addEventListener('input', filterItems);
        expandBtn.addEventListener('click', () => {
            const isCollapsed = tagContainer.classList.toggle('collapsed');
            expandBtn.textContent = isCollapsed ? i18nData.dataset.listExpand : i18nData.dataset.listCollapse;
        });
        expandBtn.textContent = i18nData.dataset.listExpand;

    } catch (error) {
        console.error(`Error loading ${itemType} list:`, error);
        listContainer.innerHTML = `<p>${i18nData.dataset.listError}</p>`;
    }
}

function renderItems(items, container, itemType) {
    const { langPrefix } = getPathContext();
    container.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('a');
        card.href = `${langPrefix}/${itemType}/${item.dir}/`;
        card.className = 'tool-list-card';
        card.dataset.tags = item.tags ? item.tags.join(' ') : '';

        const tagsHTML = item.tags ? `<div class="card-tags">${item.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` : '';

        card.innerHTML = `
            <i class="${item.icon}"></i>
            <h3>${item.name}</h3>
            ${tagsHTML}
            <p>${item.description}</p>
        `;

        card.querySelectorAll('.card-tags .tag').forEach(tagEl => {
            tagEl.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tagName = tagEl.textContent.substring(1);
                handleTagClick(tagName);
            });
        });

        container.appendChild(card);
    });
}

function filterItems() {
    const i18nData = document.getElementById('i18n-data');
    const searchInput = document.getElementById('search-input');
    const searchLower = searchInput.value.toLowerCase();
    const activeTagButtons = document.querySelectorAll('.tag-list .tag-btn.active');
    const activeTags = Array.from(activeTagButtons).map(btn => btn.textContent.toLowerCase());
    const showAll = activeTags.includes(i18nData.dataset.listAllTags.toLowerCase());

    document.querySelectorAll('.tool-list-card').forEach(card => {
        const cardTags = card.dataset.tags.toLowerCase().split(' ');
        const cardName = card.querySelector('h3').textContent.toLowerCase();
        const cardDesc = card.querySelector('p').textContent.toLowerCase();

        const matchesSearch = cardName.includes(searchLower) || cardDesc.includes(searchLower);
        const matchesTags = showAll || activeTags.every(t => cardTags.includes(t));

        if (matchesSearch && matchesTags) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function renderTags(tags, container) {
    const i18nData = document.getElementById('i18n-data');
    container.innerHTML = '';
    const sortedTags = [...tags].sort();

    const allBtn = createTagButton(i18nData.dataset.listAllTags, true);
    container.appendChild(allBtn);

    sortedTags.forEach(tag => {
        const tagBtn = createTagButton(tag);
        container.appendChild(tagBtn);
    });
}

function createTagButton(tag, isActive = false) {
    const tagBtn = document.createElement('button');
    tagBtn.className = 'tag-btn';
    if (isActive) tagBtn.classList.add('active');
    tagBtn.textContent = tag;
    tagBtn.addEventListener('click', () => handleTagClick(tag));
    return tagBtn;
}

function handleTagClick(tagName) {
    const i18nData = document.getElementById('i18n-data');
    const allBtn = document.querySelector('.tag-list .tag-btn:first-child');
    const clickedBtn = Array.from(document.querySelectorAll('.tag-list .tag-btn')).find(btn => btn.textContent === tagName);

    if (tagName === i18nData.dataset.listAllTags) {
        document.querySelectorAll('.tag-list .tag-btn').forEach(btn => btn.classList.remove('active'));
        allBtn.classList.add('active');
    } else {
        allBtn.classList.remove('active');
        if (clickedBtn) {
            clickedBtn.classList.toggle('active');
        }
    }

    if (document.querySelectorAll('.tag-list .tag-btn.active').length === 0) {
        allBtn.classList.add('active');
    }

    filterItems();
}