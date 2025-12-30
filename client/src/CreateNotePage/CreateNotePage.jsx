import { useState } from "react"; // useState is used for managing component state
import { useNavigate } from "react-router-dom"; // THis is used for navigation 
import styles from "./CreateNotePage.module.css";

export default function CreateNotePage() {
    /**
     * Here, we are using the useState hook to create state variables
     * for the title and content of the note.
     * 
     * setTitle is the function to update the title state variable.
     * setContent is the function to update the content state variable.
     */
    const [title, setTitle] = useState(""); 
    const [content, setContent] = useState("");

    /**
     * useNavigate hook gives us a navigate function that we can use
     * to navigate to different routes.
     */
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        //the default form submission behavior acts like a page reload, so we prevent that
        e.preventDefault();

        /**
         * For now, we settle for local server URL.
         * In a real-world application, this would be replaced.
         * 
         * We use Express server running on port 3001. See ai-notes/server/notes.js
         * 
         * 
         * Environment variables are automatically injected to
         * import.meta.env object by Vite during the build process.
         */
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

        try {
            const response = await fetch(`${API_BASE_URL}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content })
            });

            const data = await response.json();

            if (data.success) {
                // We clear the form fields and navigate back to the notes list
                setTitle("");
                setContent("");
                navigate("/");
            } else {
                alert(data.message || "Error creating note");
            }
        } catch (error) {
            alert("Error creating note: " + error.message);
        }
    };

    return (
        <div className={styles.pageContainer}>
        <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Create a New Note</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>
                Title
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={styles.input}
                />
            </label>
            <label className={styles.label}>
                Content
                <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className={styles.textarea}
                />
            </label>
            <button type="submit" className={styles.submitButton}>
                Create Note
            </button>
            </form>
        </div>
        </div>
    );
}