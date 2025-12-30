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
 * FEtch a single note by ID
 */
router.get("/:id", async (req, res) => {
    const noteId = req.params.id;
    const sql = `
        SELECT id, title, content, created_at, updated_at
        FROM notes
        WHERE id = ? AND deleted_at IS NULL
        `;
    
    const params = [noteId];
    try {
        // Execute the select query. Promise is returned by db.get
        const note = await db.get(sql, params);
        if (note) {
            res.status(200).json({
                success: true,
                note: note
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
            message: "Error fetching note",
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