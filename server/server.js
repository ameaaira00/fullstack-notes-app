import express from "express";
import notesRouter from "./notes.js";
import cors from "cors"; // THis will allow cross-origin requests as the client and server run on different ports


const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Middleware is a function that runs before the route handler.
app.use(express.json()); // Parse JSON request bodies

// Mount the notes router at the "/notes" path
app.use("/notes", notesRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

