# Contributing to This Project

This document provides instructions for developing and adding new content (games and tools) to the website.

## Prerequisites

Before you begin, ensure you have [Node.js](https://nodejs.org/) installed on your system. This will also provide `npm`, the Node.js package manager.

## Initial Setup

1. Clone the repository.
2. In your terminal, run the following command to install the necessary development dependencies:
   ```bash
   npm install
   ```

## Development Workflow

This project uses a **source (`src`)** and **distribution (`dist`)** directory structure. All development and content creation happens in the `src` folder. The final, deployable website is generated in the `dist` folder by a build script.

### 1. Adding New Content (Recommended)

To create a new game or tool, use the `generate` script. This is the easiest and recommended way to add content.

**To add a new game:**
```bash
npm run generate game "Your New Game Name"
```

**To add a new tool:**
```bash
npm run generate tool "Your New Tool Name"
```

This command automatically creates a new directory in `src/content/` with all the necessary boilerplate files. It also runs the build script, so your new item is immediately ready for development.

### 2. Running the Development Server

To build the site and preview it locally, run:

```bash
npm run dev
```

This command first builds the site into the `dist` folder and then starts a local server to preview the result. The server address (usually `http://localhost:3000`) will be displayed in the terminal.

**Important:** If you make changes to files in the `src` directory, you will need to stop the server (`Ctrl+C`) and run `npm run dev` again to see your changes.

## Available Scripts

- `npm run build`: Runs the build script to generate the final website in `/dist`.
- `npm start`: Starts a local server for the `/dist` folder. Use this to preview a site that has already been built.
- `npm run dev`: A convenience script that runs `build` and then `start`.
- `npm run generate <type> "<name>`: Creates a new game or tool with the given name.

## Project Structure (`src` folder)

- `src/_includes/`: Contains HTML templates used by the build script.
  - `item-template.html`: The main template for individual game and tool pages.
- `src/assets/`: Contains all static assets like CSS, JavaScript, and images.
- `src/content/`: Contains all website content.
  - `game/` & `tool/`: Each subdirectory here is a specific game or tool.
    - `meta.json`: Contains metadata (name, description, icon, tags).
    - `content.html`: The main HTML content for the item.
    - `description.md`: A detailed description (in Markdown) shown on the item's page.
    - `script.js`: The specific JavaScript logic for the item. Must export an `init()` function.
    - `style.css`: (For games only) Specific CSS for the game.
  - `index.html`, `home/`, etc.: Static pages and content folders.