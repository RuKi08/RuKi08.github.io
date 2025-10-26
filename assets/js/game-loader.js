import { createHeader, createFooter } from './common-components.js';
import { initTheme } from './modules/theme.js';

document.addEventListener('DOMContentLoaded', () => {
    document.body.prepend(createHeader());
    document.body.append(createFooter());
    initTheme();
    loadGamesAndTags();
});

async function loadGamesAndTags() {
    const gameContainer = document.getElementById('game-list-container');
    const tagContainer = document.getElementById('tag-list');
    const searchInput = document.getElementById('search-input');
    const expandBtn = document.getElementById('expand-tags-btn');
    if (!gameContainer || !tagContainer || !searchInput || !expandBtn) return;

    const gameDirs = ['tic-tac-toe', '2048', 'gomoku'];
    let allTags = new Set();
    let gamesData = [];

    for (const dir of gameDirs) {
        try {
            const response = await fetch(`./${dir}/game.json`);
            const game = await response.json();
            game.dir = dir;
            gamesData.push(game);
            if (game.tags) {
                game.tags.forEach(tag => allTags.add(tag));
            }
        } catch (error) {
            console.error(`Error fetching game data for ${dir}:`, error);
        }
    }

    renderGames(gamesData, gameContainer);
    renderTags(allTags, tagContainer);

    // Event Listeners
    searchInput.addEventListener('input', filterGames);
    expandBtn.addEventListener('click', () => {
        const isCollapsed = tagContainer.classList.toggle('collapsed');
        expandBtn.textContent = isCollapsed ? '▼' : '▲';
    });
    expandBtn.textContent = '▼';
}

function renderGames(games, container) {
    container.innerHTML = '';
    games.forEach(game => {
        const card = document.createElement('a');
        card.href = `./${game.dir}`;
        card.className = 'tool-list-card'; // Use same class as tool cards
        card.dataset.tags = game.tags ? game.tags.join(' ') : '';

        const tagsHTML = game.tags ? `<div class="card-tags">${game.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` : '';

        card.innerHTML = `
            <i class="${game.icon}"></i>
            <h3>${game.name}</h3>
            ${tagsHTML}
            <p>${game.description}</p>
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

    filterGames();
}

function filterGames() {
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