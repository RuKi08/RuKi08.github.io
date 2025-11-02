# Contributing to this Project

This document provides instructions for adding new games and tools to the website.

## Quick Start

To add a new game or tool, use the `generate.js` script.

### Adding a New Game
```bash
node scripts/generate.js game "Your New Game Name"
```

### Adding a New Tool
```bash
node scripts/generate.js tool "Your New Tool Name"
```
This command will automatically create a new directory with all the necessary boilerplate files and update the website's item list. You just need to fill in the content.

## Development Workflow

This project uses a simple Node.js-based build system to manage the lists of games and tools.

### 1. Generating a New Item (Recommended)

Use the `generate.js` script as shown in the Quick Start. It handles everything for you:
- Creates a new directory (e.g., `/game/your-new-game-name/`).
- Generates all required files:
    - `index.html`: The page loader. (Do not edit).
    - `meta.json`: Metadata for the item (name, description, icon, tags).
    - `content.html`: The main HTML content for your item.
    - `script.js`: The JavaScript logic for your item.
    - `style.css`: The CSS styles for your item.
    - `description.md`: A detailed description shown on the item's page.
- Automatically runs the build script to add your new item to the main list.

### 2. Manually Updating the Item List

If you add, remove, or rename a directory manually, you must run the `build.js` script to update the master list of items.

```bash
node scripts/build.js
```
This script scans the `/game` and `/tool` directories and regenerates `assets/data/items.json`. The `generate.js` script runs this for you automatically.

## Item File Structure

Each game or tool has its own directory with the following files:

- **`meta.json`**: Contains metadata displayed on the list page.
    - `name`: The display name.
    - `description`: A short description for the list page card.
    - `icon`: A [Font Awesome](https://fontawesome.com/) icon class (e.g., `fa-solid fa-star`).
    - `tags`: An array of lowercase string tags for filtering.
    - `script`: The name of the script file (usually `script.js`).
    - `style`: The name of the style file (usually `style.css`).
- **`content.html`**: The HTML that will be injected into the page template. This is where the main structure of your item goes.
- **`script.js`**: The JavaScript for your item. It must export a single function: `export function init() { ... }`. This function is called when the page loads.
- **`style.css`**: Scoped CSS for your item.
- **`description.md`**: A longer description written in Markdown that appears below your item on its page.
- **`index.html`**: The loader for the item page. You should not need to edit this file.
