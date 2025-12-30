import express from "express" // Creates routes, and handle HTTP requests
import {db} from "./db.js" // SQLite database connection

const router = express.Router();

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

        // Send a success response with the new note's ID
        res.status(201).json({
            success: true,
            message: "Note added successfully",
            noteId: result.lastID
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
 * Fetch all notes
 */
router.get("/", async (req, res) => {;
     console.log("Fetch all notes route triggered");
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
 * Search notes by title or content.
 * 
 * TO DO: Support semantic search using a more advanced method.
 */
router.get("/search", async (req, res) => {
    console.log("Search route triggered!", req.query);
    const q = req.query.q;
    console.log("Search query:", q);
    console.log("Type of query:", typeof q);

    if (!q) {
        return res.status(400).json({
            success: false,
            message: "Search query is required"
        });
    }

    const query = q.trim();


    const sql = `
        SELECT id, title, content, created_at, updated_at
        FROM notes
        WHERE (title LIKE ? OR content LIKE ?) AND deleted_at IS NULL
        ORDER BY created_at DESC
        `;
    const likeQuery = `%${query}%`; // wildcard search for partial matches
    const params = [likeQuery, likeQuery];

    try {
        const notes = await db.all(sql, params);

        console.log(`Search for "${query}" returned ${notes.length} notes.`);
        res.status(200).json({
            success: true,
            notes: notes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error searching notes",
            error: error.message
        });
    }  
});

/**
 * Update a note by ID
 */
router.put("/:id", async (req, res) => {
    const noteId = req.params.id;
    const {title, content} = req.body;
    const sql = `
        UPDATE notes
        SET title = ?, content = ?, updated_at = strftime('%s','now')
        WHERE id = ? AND deleted_at IS NULL
        `;
    const params = [title, content, noteId];
    try {
        // Execute the update query. Promise is returned by db.run
        const result = await db.run(sql, params);
        if (result.changes > 0) {
            res.status(200).json({
                success: true,
                message: "Note updated successfully",
                note: { id: noteId, title, content }
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Note not found"
            });
        }
    } catch (error) {
        // Handle any errors during the database operation
        res.status(500).json({
            success: false,
            message: "Error updating note",
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
    } catch (error) {
        // Handle any errors during the database operation
        res.status(500).json({
            success: false,
            message: "Error deleting note",
            error: error.message
        });
    }
});

// We need to export this router to use it in other parts of the application
export default router;