import Chat from "./components/Chat";
import Upload from "./components/Upload";

export default function App() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Simhas RAG</h1>
          <p style={styles.subtitle}>Upload PDFs and ask questions about them</p>
        </header>
        <Upload />
        <Chat />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 20px",
  },
  container: { width: "100%", maxWidth: 720 },
  header:    { marginBottom: 24 },
  title:     { fontSize: 26, fontWeight: 700, color: "#111" },
  subtitle:  { fontSize: 14, color: "#666", marginTop: 6 },
};