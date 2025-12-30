# Notes – End-to-End Web Development Reflection

## Project Goal

This project is a personal reflection and hands-on exercise to strengthen my understanding of **end-to-end web development**. The goal was to build a complete notes application, starting from the **database**, to the **backend API**, and finally to a fully interactive **frontend**, with future plans to explore AI-powered features.

This first iteration consolidates my understanding of full-stack development, including:
* Database design
* Backend CRUD APIs
* Frontend React integration
* UI styling

## Overview
**AI Notes** is a simple note-taking application built with the following stack:
* **Database:** SQLite3
* **Backend:** Node.js with Express
* **Frontend:** React with Vite, styled with CSS modules
**Goal:** Understand the full flow of data from frontend to backend to database and reflect on React, full-stack, and AI concepts.


## First Iteration
### Demo
![1st Iteration Demo](demo/1stIterationDemo-2025-12-30.gif)

### Backend (`server`)
* **CRUD operations implemented:**
  * Create notes
  * Fetch all notes
  * Fetch note by ID
  * Update notes
  * Soft delete notes
* **Schema:** Notes table with fields: `id`, `title`, `content`, `created_at`, `updated_at`, `deleted_at`

### Frontend (`client`)
* **Pages:**
  * **Notes List Page:** Displays all notes in a card layout
  * **Create Note Page:** Form to create new notes
* **Styling:** Baby-pink theme using CSS modules (I plan to improve this soon)
* **Responsive layout** for mobile and desktop

**Note:** This first iteration, including the backend, database schema, and frontend pages, was completed in **1–2 hours** as a rapid prototype and learning exercise.

## Future Iterations
* **Extend functionality:**
  * Integrate **speech-to-text** for note creation
  * Add **semantic search** for smarter note retrieval

* **AI knowledge reflection:**
  * Experiment with embedding AI features while maintaining the E2E stack

* **Frontend improvements:**
  * Edit and delete notes directly from the UI
  * More polished UX and responsive design


## How to Run
### Backend
```bash
cd server
npx nodemon server.js
```

### Frontend
```bash
cd client
npm install
npm run dev
```

