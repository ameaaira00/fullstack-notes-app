# Notes – End-to-End Web Development Reflection

## Project Goal

This project is a personal reflection and hands-on exercise to strengthen my understanding of **end-to-end web development**. The goal was to build a complete notes application, starting from the **database**, to the **backend API**, and finally to a fully interactive **frontend**, with future plans to explore AI-powered features.

This first iteration consolidates my understanding of full-stack development, including:
* Database design
* Backend CRUD APIs
* Frontend React integration
* UI styling

## How to Run
### Python Services
1. Navigate to the Python service folder:
```bash
cd python_service
```
2. Create a virtual environment
```bash
python -m venv venv
```
3. Activate the virtual environment:
Windows: `venv\Scripts\activate`
Linux: `source venv/bin/activate`
4. Install dependencies from requirements.txt:
```bash
pip install -r requirements.txt
```
Run the Python service:
```bash
cd python_service
python semantic_search.py
```

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

## Overview
**AI Notes** is a simple note-taking application built with the following stack:
* **Database:** SQLite3
* **Backend:** Node.js with Express
* **Frontend:** React with Vite, styled with CSS modules
**Goal:** Understand the full flow of data from frontend to backend to database and reflect on React, full-stack, and AI concepts.

## Third Iteration
### Semantic Search with Local Embeddings
### Demo
![Semantic Search](demo/3rdIteration/SemanticSearch-2026-01-01.gif)


Recall that embeddings are numerical representations of text that can be used to measure the relatedness between two pieces of text.

Initially, I used [text-embedding-3-small](https://platform.openai.com/docs/models/text-embedding-3-small), but I ran into “too many requests” errors, and since I didn’t want to incur any costs, I looked for alternatives. Luckily, free options exist, so we’re now using local embeddings.

I also previously worked on a similar project at [NotesSearch - Reviewer By Aira](https://github.com/ameaaira00/NotesSearch) which aimed to locate specific information within markdown notes using natural language queries. In that project, I used Hugging Face Transformers specifically `GPT2Tokenizer` and `GPT2Model` for tokenization and embedding generation. It wasn’t perfect back then, but this project produces much better results.

After some research, I found a lighter alternative, which we’re now using here.

#### How it works
- We create a Python microservice runs locally using **[sentence-transformers](https://www.sbert.net/) aka SBERT**. 
  - **SBERT** can compute embeddings with transformer models, calculate similarity scores with cross-encoder models, or generate sparse embeddings.
  - Here, we use it to compute embeddings from title + content.
  - Cosine similarity is calculated between query embeddings and note embeddings. Similarity threshold is set to filter out unrelated notes.
- All notes are converted into embedding vectors whenever they are created or updated.
- When a user searches:
1. The query is converted into an embedding vector.
2. Cosine similarity is calculated against all note embeddings.
3. Notes above a similarity threshold are returned, sorted by relevance.
This allows semantic search, where notes are matched by meaning, not just exact keywords, all locally and for free. Thank you, open source! 🎉 Yey

#### Backend - Microservice communication
To implement semantic search without slowing down the main backend, we created a separate Python microservice as described above.
- The Python backend handles all embedding-related tasks such as adding, deleting, updating, and search most relevant note via embeddings.
- We created a new table `note_embeddings` to store the embeddings separately from the `notes` table.
   - Why not just add a new column?
      - Thought that embeddings can bloat the main table as they are large binary arrays (serialized vectors)
      - Separating them keeps the notes table lightweight for normal CRUD operations
      - Easier to update or recompute embeddings without affecting the core notes schema
-  The Node.js backend communicates with the Python service via HTTP requests using [Axios](https://axios-http.com/docs/intro) which is a promise-based HTTP Client for node.js and the browser.
    - This separation ensures:
      - The main backend stays lightweight and fast
      - ML-heavy computations run in an isolated Python environment
      - Each component can be updated or scaled independently
- A new update endpoint was added to update embeddings whenever a note is updated, though there’s no frontend feature for this yet.

At this point, i didn't focus on making sure my code is clean and error prone. I just made it work.

## Second Iteration
### Demo
#### Search
![Search](demo/2ndIteration/Search-2025-12-30.gif)

While implementing search, I realized that in the backend, route order matters. Having `notes/:id` before `notes/search` caused requests for search to be incorrectly routed. I debugged this using console logs and AI assistance, and learned that the order of route definitions is important in Express.

I still don't have use for `notes/:id` so removed taht for now.

I plan to implenent semantic search next.

#### Speech to Text
![Speech to Text](demo/2ndIteration/SpeechToText-2025-12-30.gif)
It’s been fun reading about the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API). I’m glad we already have this available, it’s easy to integrate, so I don’t have to build speech recognition from scratch.

It works by:
- Receiving audio input from the user's microphone
- Processing the audio by a speech recognition service
- Returning the recognized text

This iteration adds speech-to-text functionality to the notes app, enabling users to dictate notes directly in the frontend.

### Backend (`server`)
- Add search by title or content

### Frontend (`client`)
- Support search and transcription ui
- Use Create Icon instead of a Text button

## First Iteration
### Demo
![1st Iteration Demo](demo/1stIteration/1stIterationDemo-2025-12-30.gif)

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


