# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Run Commands
- Open `index.html` in a browser to run the application
- No build process required (plain HTML/CSS/JS)
- No specific test framework implemented

## Code Style Guidelines
- JavaScript: Use ES6+ features, async/await for API calls
- Functions: camelCase naming (e.g., `handleKeyDown`, `transformTextWithOpenAI`)
- Error handling: Use try/catch blocks with console.error for API calls
- Variables: Declare with let/const, use descriptive names
- DOM queries: Use getElementById or querySelector
- CSS: Use descriptive class names, keep selectors simple
- Whitespace: 4-space indentation
- String concatenation: Use template literals where appropriate
- Timeout handling: Clear timeouts before setting new ones