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
    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/notes`);
                const data = await response.json();
                if (data.success) {
                    // Update the notes state variable with the fetched notes
                    setNotes(data.notes);
                } else {
                    alert(data.message || "Error fetching notes");
                }
            } catch (error) {
                alert("Error fetching notes: " + error.message);
            }
        };

        fetchNotes();
    }, []); // The empty array means "run this effect only once, when the component mounts"

    /**
     * Now we render the list of notes.
     */
    return (
        <div className={styles.container}>
            <h1 className="styles.pageTitle">Notes</h1>
            <Link to="/create"
                className={styles.createLink}
            >
                Create New Note
            </Link>

            {notes.length === 0 ? (
                <p>No notes available.</p>
            ) : (
                notes.map((note) => <NoteCard key={note.id} note={note} />)
            )}
        </div>
    );
}