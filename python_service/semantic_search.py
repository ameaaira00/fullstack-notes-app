from flask import Flask, request, jsonify # For creating the web service
from sentence_transformers import SentenceTransformer # This is for generating sentence embeddings
import sqlite3 # to interact with the SQLite database
import numpy as np # for numerical operations
import pickle # USed to serialize and deserialize embeddings
import logging

app = Flask(__name__) # this initializes the Flask application

logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s [%(levelname)s] %(message)s"
)


"""
We load the embedding model here.

This is a sentence-transformers model: It maps sentences & paragraphs
to a 384 dimensional dense vector space and can be used for tasks like
clustering or semantic search.

Se https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
"""
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# Path to SQLite DB (Node.js server database)
DB_PATH = '../server/database.sqlite'


def text_to_embed(title, content):
    """Combine title and content for embedding."""
    return f"{title}: {content}"

def store_embedding(note_id, embedding):
    """Store embedding in SQLite DB."""
    embedding_bytes = pickle.dumps(embedding)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO note_embeddings (note_id, embedding)
        VALUES (?, ?)
    """, (note_id, embedding_bytes))
    conn.commit()
    conn.close()

def get_notes_with_embeddings():
    """Fetch all notes and embeddings from the database into memory."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT n.id, n.title, n.content, e.embedding
        FROM notes n
        LEFT JOIN note_embeddings e ON n.id = e.note_id
        WHERE n.deleted_at IS NULL
    """)
    rows = cursor.fetchall()
    conn.close()

    embeddings = []
    for note_id, title, content, embedding_bytes in rows:
        text = text_to_embed(title, content)
        if embedding_bytes is not None:
            emb = pickle.loads(embedding_bytes)
        else:
            emb = model.encode(text)
            store_embedding(note_id, emb)
        embeddings.append((note_id, emb))
    return embeddings

def cosine_similarity(vec1, vec2):
    """Compute cosine similarity between two vectors."""
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    if norm_vec1 == 0 or norm_vec2 == 0:
        return 0.0
    return float(dot_product / (norm_vec1 * norm_vec2))

"""
Initialize the embeddings
"""
note_embeddings = []

def initialize_embeddings():
    """Compute embeddings for existing notes missing embeddings."""
    global note_embeddings
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Notes without embeddings
    cursor.execute("""
        SELECT id, title, content
        FROM notes
        WHERE id NOT IN (SELECT note_id FROM note_embeddings)
        AND deleted_at IS NULL
    """)
    rows = cursor.fetchall()
    count = 0

    for note_id, title, content in rows:
        text = text_to_embed(title, content)
        emb = model.encode(text)
        store_embedding(note_id, emb)
        note_embeddings.append((note_id, emb))
        count += 1

    # Load all embeddings into memory
    note_embeddings = get_notes_with_embeddings()
    logging.info(f"Initialized embeddings for {count} existing notes. Total cached: {len(note_embeddings)}")

initialize_embeddings()

# -----------------------------
# Flask Routes
# -----------------------------
@app.route('/semantic_search', methods=['GET'])
def semantic_search():
    """Perform semantic search on notes."""
    query = request.args.get("q", "")

    if not query:
        return jsonify({"success": False, "message": "Query parameter 'q' is required"}), 400

    query_embedding = model.encode(query)
    similarities = [(nid, cosine_similarity(query_embedding, emb)) for nid, emb in note_embeddings]
    similarities.sort(key=lambda x: x[1], reverse=True)

    """
    We wanna return notes that are moderately related so we filter barely related ones

    Read some few articles (like https://arxiv.org/html/2509.15292v1) but there seems to be no fixed 
    similarity threshold. Setting this as follows based on my manual test (printing results)
    """
    SIMILARITY_THRESHOLD = 0.45
    filtered = [(nid, sim) for nid, sim in similarities if sim >= SIMILARITY_THRESHOLD]

    # Limit results
    MAX_RESULTS = 5
    top_results = filtered[:MAX_RESULTS]

    return jsonify({
        "success": True,
        "results": [{"note_id": nid, "similarity": sim} for nid, sim in top_results]
    })

@app.route('/add_note_embedding', methods=['POST'])
def add_note_embedding():
    """Add embedding for a new note by title and content."""
    data = request.get_json()
    note_id = data.get("note_id")
    title = data.get("title", "")
    content = data.get("content", "")

    if not note_id or not title or not content:
        return jsonify({"success": False, "message": "note_id, title and content required"}), 400

    emb = model.encode(text_to_embed(title, content))
    store_embedding(note_id, emb)

    global note_embeddings
    note_embeddings.append((note_id, emb))

    return jsonify({"success": True, "message": "Embedding added"})

@app.route('/remove_note_embedding', methods=['POST'])
def remove_note_embedding():
    """Remove a note's embedding. Hard delete as we can easily recompute."""
    data = request.get_json()
    note_id = data.get("note_id")

    if not note_id:
        return jsonify({"success": False, "message": "note_id required"}), 400

    # Remove from DB
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM note_embeddings WHERE note_id = ?", (note_id,))
    conn.commit()
    conn.close()

    # Remove from memory
    global note_embeddings
    note_embeddings = [(nid, emb) for nid, emb in note_embeddings if nid != note_id]

    return jsonify({"success": True, "message": "Embedding removed"})


@app.route('/update_note_embedding', methods=['POST'])
def update_note_embedding():
    """Update embedding of existing note"""
    data = request.get_json()
    note_id = data.get("note_id")
    title = data.get("title", "")
    content = data.get("content", "")

    if not note_id or not title or not content:
        return jsonify({"success": False, "message": "note_id, title and content required"}), 400

    # Remove old embedding if exists
    global note_embeddings
    note_embeddings = [(nid, emb) for nid, emb in note_embeddings if nid != note_id]

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM note_embeddings WHERE note_id = ?", (note_id,))
    conn.commit()
    conn.close()

    # Compute new embedding
    emb = model.encode(text_to_embed(title, content))
    store_embedding(note_id, emb)
    note_embeddings.append((note_id, emb))

    return jsonify({"success": True, "message": "Embedding updated"})


# Run Flask app
if __name__ == "__main__":
    app.run(port=5000, debug=True)