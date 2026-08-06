# AIM Service Manager

This repository now contains a minimal full-stack scaffold using Node.js + Express and SQLite for quick local setup.

What I added:
- server.js — Express server that serves static files and provides a simple REST API (customers + invoices).
- package.json — dependencies and start script.
- public/ — static frontend files (index, a login page, a sample admin dashboard).
- .gitignore — ignores node_modules and data.
- SQLite database stored in /data/database.sqlite (created on first run).

Quick start:

1. Clone the repo (already done if you're the owner):
   git clone https://github.com/kabi488/AIM-Service-Manager.git

2. Install dependencies:
   npm install

3. Start the server:
   npm start

4. Open http://localhost:3000 in your browser.

Notes and next steps:
- Authentication is currently client-side only (login page sets a localStorage flag). I can add real auth with hashed passwords and sessions if you want.
- I implemented basic customers and invoices CRUD endpoints. I can expand to services, purchases, reports, and more pages.
- If you want a separate branch or CI setup, tell me which branch or provider.

