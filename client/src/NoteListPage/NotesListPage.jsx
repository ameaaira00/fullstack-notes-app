import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./NotesListPage.module.css";
import NoteCard from "./NoteCard/NoteCard";


export default function NotesListPage() {
    /**
     * notes store the list of notes fetched from the server.
     * setNotes is the function to update the `notes` state variable.
     */
    const [notes, setNotes] = useState([]);

    /**
     * Search for notes from the server
     */
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);

    /**
     * Environment variables are automatically injected to
     * import.meta.env object by Vite during the build process.
     */
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    /**
     * In simple terms, useEffect is a hook that runs a piece of code
     * after the component has rendered.
     * 
     * Here, we use it to fetch the list of notes from the server
     * when the component mounts (i.e., when it's first added to the DOM).
     */
    const fetchNotes = async (query = "") => {
        setLoading(true);
        try {
            const url = query 
                ? `${API_BASE_URL}/notes/search?q=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/notes`;
            console.log("Fetching notes from:", url);
            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setNotes(data.notes);
            } else {
                alert(data.message || "Error fetching notes");
            }
        } catch (error) {
            alert("Error fetching notes: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Initially fetch all notes.
     * The empty array means "run this effect only once, when the component mounts"
     */
    useEffect(() => {
        fetchNotes();
    }, []); 

    /**
     * Search by title or content when the search input changes
     */
    const handleSearchChange = (e) => {
        const query = e.target.value;
        
        if (query.trim() === "") {
            setSearchQuery("");
            fetchNotes();
            return;
        }

        setSearchQuery(query);
        fetchNotes(query);
    }

    /**
     * Now we render the list of notes.
     */
    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
            <h1 className={styles.pageTitle}>Notes</h1>
            <Link to="/create" className={styles.addNoteButton} title="Add Note">
                ➕
            </Link>
            </div>

            <div className={styles.searchRow}>
                <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className={styles.searchInput}
                />
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : notes.length === 0 ? (
                <p>No notes found.</p>
            ) : (
                notes.map((note) => <NoteCard key={note.id} note={note} />)
)}
        </div>
    );
}