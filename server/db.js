// sqlite3 is a library that provides a lightweight disk-based database.
import sqlite3 from "sqlite3";
// Import the 'open' function from the 'sqlite' package to work with Promises.
import { open } from "sqlite";

export const db = await open({
    filename: "./server/database.sqlite",
    driver: sqlite3.Database
});

const shema = `
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        deleted_at INTEGER NULL
    );
`;

// Initialize the database schema
await db.exec(shema);