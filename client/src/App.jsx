// These imports are necessary for routing in a React application
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import NotesListPage from './NoteListPage/NotesListPage';
import CreateNotePage from './CreateNotePage/CreateNotePage';
import styles from './App.module.css';

function App() {
  return (
    <Router>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>Notes</Link>
          <Link to="/create" className={styles.navLink}>Create Note</Link>
        </nav>
      </header>
      <main className={styles.main}>
      <Routes>
          <Route path="/" element={<NotesListPage />} />
          <Route path="/create" element={<CreateNotePage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;