import { createHeader, createFooter } from './common-components.js';
import { initTheme } from './modules/theme.js';

document.addEventListener('DOMContentLoaded', () => {
    document.body.prepend(createHeader());
    document.body.append(createFooter());
    initTheme();
    loadToolsAndTags();
});

async function loadToolsAndTags() {
    const toolContainer = document.getElementById('tool-list-container');
    const tagContainer = document.getElementById('tag-list');
    const searchInput = document.getElementById('search-input');
    const expandBtn = document.getElementById('expand-tags-btn');
    if (!toolContainer || !tagContainer || !searchInput || !expandBtn) return;

    const toolDirs = ['ascii-unicode-converter', 'color-code-converter', 'image-format-converter', 'qr-code-generator', 'secret-box', 'unit-converter'];
    let allTags = new Set();
    let toolsData = [];

    for (const dir of toolDirs) {
        try {
            const response = await fetch(`./${dir}/meta.json`);
            const tool = await response.json();
            tool.dir = dir;
            toolsData.push(tool);
            if (tool.tags) {
                tool.tags.forEach(tag => allTags.add(tag));
            }
        } catch (error) {
            console.error(`Error fetching tool data for ${dir}:`, error);
        }
    }

    renderTools(toolsData, toolContainer);
    renderTags(allTags, tagContainer);

    // Event Listeners
    searchInput.addEventListener('input', () => filterTools(toolsData));
    expandBtn.addEventListener('click', () => {
        const isCollapsed = tagContainer.classList.toggle('collapsed');
        expandBtn.textContent = isCollapsed ? '▼' : '▲';
    });
    expandBtn.textContent = '▼'; // Initial state
}

function renderTools(tools, container) {
    container.innerHTML = '';
    tools.forEach(tool => {
        const card = document.createElement('a');
        card.href = `./${tool.dir}`;
        card.className = 'tool-list-card';
        card.dataset.tags = tool.tags ? tool.tags.join(' ') : '';

        const tagsHTML = tool.tags ? `<div class="card-tags">${tool.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` : '';

        card.innerHTML = `
            <i class="${tool.icon}"></i>
            <h3>${tool.name}</h3>
            ${tagsHTML}
            <p>${tool.description}</p>
        `;

        // Add click event to on-card tags
        card.querySelectorAll('.card-tags .tag').forEach(tagEl => {
            tagEl.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent navigation
                e.stopPropagation(); // Prevent card click
                const tagName = tagEl.textContent.substring(1);
                handleTagClick(tagName);
            });
        });

        container.appendChild(card);
    });
}

function renderTags(tags, container) {
    container.innerHTML = '';
    const sortedTags = [...tags].sort();

    const allBtn = createTagButton('All', true);
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
    const allBtn = document.querySelector('.tag-list .tag-btn:first-child');
    const clickedBtn = Array.from(document.querySelectorAll('.tag-list .tag-btn')).find(btn => btn.textContent === tagName);

    if (tagName === 'All') {
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

    filterTools();
}

function filterTools() {
    const searchInput = document.getElementById('search-input');
    const searchLower = searchInput.value.toLowerCase();
    const activeTagButtons = document.querySelectorAll('.tag-list .tag-btn.active');
    const activeTags = Array.from(activeTagButtons).map(btn => btn.textContent.toLowerCase());
    const showAll = activeTags.includes('all');

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