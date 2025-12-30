import { useState, useRef } from "react"; // useState is used for managing component state
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
    const [isTranscripting, setIsTranscripting] = useState(false);

    /**
     * Keep this ref to manage the SpeechRecognition instance
     * but do not trigger re-renders when it changes.
     */
    const recognitionRef = useRef(null);

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

    /**
     * Using Web Speech API for speech recognition.
     * Note that this also supports TTS (text-to-speech) but we don't use that here.
     * 
     * It works by
     * - receiving audio input from the user's microphone,
     * - processing the audio by a speech recognition service,
     * - returning the recognized text.
     * 
     * See https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
     */
    const toggleRecording  = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        /**
         * Not all browsers support the Web Speech API.
         */
        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        // If already transcripting, stop the recognition when clicked again
        if (isTranscripting && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsTranscripting(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false; // Interim results are the results that are not yet final
        recognition.continuous = true; // Keep recognizing speech until stopped

        setIsTranscripting(true);

        /**
         * Web Speech API seems to not support custom grammar for punctuation,
         * so we handle basic punctuation commands manually in the onresult handler.
         */
        const punctuationMap = {
            "period": ".",
            "comma": ",",
            "question mark": "?",
            "exclamation mark": "!",
            "new line": "\n"
        };

        /**
         * For now, only the final results are appended to the content.
         * 
         * TODO: Improve UX by showing interim results as well.
         */
        recognition.onresult = (event) => {
            let finalTranscript = "";
            /**
             * event.results is a SpeechRecognitionResultList object
             * that contains SpeechRecognitionResult objects.
             */
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    let transcript = event.results[i][0].transcript;

                    /**
                     * Replace spoken punctuation commands with actual punctuation marks.
                     * 
                     * TO DO: Improve. I worry that this is computationally expensive, but for now it works.
                     */
                    Object.keys(punctuationMap).forEach((key) => {
                        /**
                         * We use word boundaries (\b) to ensure we only replace whole words.
                         * `gi` flags are for global (g) and case-insensitive (i) matching.
                         */
                        const regex = new RegExp(`\\b${key}\\b`, "gi");
                        transcript = transcript.replace(regex, punctuationMap[key]);
                    });

                    finalTranscript += transcript;
                }
            }

            /**
             * We only update the content state with final transcripts
             * to avoid cluttering the content with interim results.
             */
            if (finalTranscript) {
                setContent((prev) => prev + " " + finalTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
        };

        recognition.onend = () => {
            setIsTranscripting(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsTranscripting(true);
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
            <div className={styles.contentRow}>
                <span>Content</span>
                {isTranscripting && (
                    <span className={styles.transcriptingText}>Transcripting…</span>
                )}
                <button
                    type="button"
                    onClick={toggleRecording}
                    className={`${styles.recordIconButton} ${isTranscripting ? styles.transcripting : ""}`}
                    aria-label={isTranscripting ? "Stop recording" : "Start recording"}
                    title={isTranscripting ? "Stop recording" : "Start recording"}
                >
                    {isTranscripting ? "⏹️" : "🎤"}
                </button>
                </div>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className={styles.textarea}
            />

            <button type="submit" className={styles.submitButton}>
                Create Note
            </button>
            </form>
        </div>
        </div>
    );
}
