import styles from "./NoteCard.module.css";

export default function NoteCard({ note }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{note.title}</h3>
      <p className={styles.content}>{note.content}</p>
    </div>
  );
}