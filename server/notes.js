import express from "express" // Creates routes, and handle HTTP requests
import {db} from "./db.js" // SQLite database connection
import axios from "axios"; // Axios is used to make HTTP requests

const router = express.Router();

// Create an Axios instance with Python service base URL
const pythonApi = axios.create({
    baseURL: "http://localhost:5000",
    timeout: 5000
});

/**
 * Create a post request to add a new note
 * 
 * Each route handler is already a self-contained middleware function.
 * 
 * Note that "/" here is relative to the mounting path of this router.
 */
router.post("/", async (req, res) => {
    const {title, content} = req.body;

    // Validate input
    if (!title || !content) {
        return res.status(400).json({
            success: false,
            message: "Title and content are required"
        });
    }

    const sql = `INSERT INTO notes (title, content) VALUES (?, ?)`;
    const params = [title, content];

    try {
        // Execute the insert query. Promise is returned by db.run
        const result = await db.run(sql, params);
        const noteId = result.lastID;
            
        // Call Python semantic search service to create embedding
        try {
            await pythonApi.post("/add_note_embedding", { note_id: noteId, title, content });
        } catch (embeddingError) {
            console.error("Error adding embedding:", embeddingError.message);
            // Don't fail the note creation — just log the error
        }
        
        res.status(201).json({
            success: true,
            message: "Note added successfully",
            noteId
        });
    } catch (error) {
        // Handle any errors during the database operation
        res.status(500).json({
            success: false,
            message: "Error adding note",
            error: error.message
        });
    }
});

/**
 * Perform semantic search considering both title and contents 
 */
router.get("/search", async (req, res) => {
    const query = req.query.q;

    if (query === undefined || query.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Search query is required"
        });
    }

    try {
        // Call the Python semantic search service
        const response = await pythonApi.get("/semantic_search", { params: { q: query } });
        
        const responseData = response?.data ?? null;
        const success = responseData?.success ?? null;

        if (!success) {
            return res.status(500).json({
                success: false,
                message: "Python semantic search service returned an error"
            });
        }

        const results = responseData.results ?? [];

        // Extract note IDs from Python response
        const noteIds = results.map(r => r.note_id);

        let notes = [];
        if (noteIds.length > 0) {
            const placeholders = noteIds.map(() => "?").join(",");
            const sql = `
                SELECT id, title, content, created_at, updated_at
                FROM notes
                WHERE id IN (${placeholders}) AND deleted_at IS NULL
            `;
            notes = await db.all(sql, noteIds);
        }

        // Merge similarity scores into notes
        const notesWithScores = notes.map(note => {
            const scoreObj = results.find(r => r.note_id === note.id);
            return {
                ...note,
                similarity: scoreObj?.similarity ?? 0
            };
        });

        // Sort by similarity descending
        notesWithScores.sort((a, b) => b.similarity - a.similarity);

        return res.status(200).json({
            success: true,
            notes: notesWithScores
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error performing semantic search",
            error: error.message
        });
    }
});


/**
 * Fetch all notes
 * 
 * TO DO: Perform pagination
 */
router.get("/", async (req, res) => {;
    const sql = `
        SELECT id, title, content, created_at, updated_at
        FROM notes
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        `;
    try {
        // Execute the select query. Promise is returned by db.all
        const notes = await db.all(sql);
        res.status(200).json({
            success: true,
            notes: notes
        });
    } catch (error) {
        // Handle any errors during the database operation
        res.status(500).json({
            success: false,
            message: "Error fetching notes",
            error: error.message
        });
    }
});

/**
 * Soft delete a note by ID
 */
router.delete("/:id", async (req, res) => {
    const noteId = req.params.id;
    const sql = `
        UPDATE notes
        SET deleted_at = strftime('%s','now')
        WHERE id = ? AND deleted_at IS NULL
        `;
    const params = [noteId];
    try {
        // Execute the soft delete query. Promise is returned by db.run
        const result = await db.run(sql, params);
        if (result.changes > 0) {
            res.status(200).json({
                success: true,
                message: "Note deleted successfully"
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Note not found"
            });
        }
        try {
           await pythonApi.post("/remove_note_embedding", { note_id: noteId });
        } catch (err) {
            console.error("Error removing embedding:", err.message);
        }

    } catch (error) {
        // Handle any errors during the database operation
        res.status(500).json({
            success: false,
            message: "Error deleting note",
            error: error.message
        });
    }
});

/**
 * Update the title, content and embeddings
 */
router.put("/:id", async (req, res) => {
    const noteId = req.params.id;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({
            success: false,
            message: "Title and content are required"
        });
    }

    const sql = `UPDATE notes SET title = ?, content = ?, updated_at = strftime('%s','now') WHERE id = ?`;
    const params = [title, content, noteId];

    try {
        const result = await db.run(sql, params);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Note not found"
            });
        }

        // Call Python microservice to update embedding
        try {
            await pythonApi.post("/update_note_embedding", { note_id: noteId, title, content });
        } catch (embeddingError) {
            console.error("Error updating embedding:", embeddingError.message);
        }

        res.status(200).json({
            success: true,
            message: "Note updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating note",
            error: error.message
        });
    }
});


// We need to export this router to use it in other parts of the application
export default router;