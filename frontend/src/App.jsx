import Chat from "./components/Chat";
import Upload from "./components/Upload";

export default function App() {
  return (
    <div style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.badge}>Local, source-aware RAG</div>
          <h1 style={styles.title}>Simhas RAG</h1>
          <p style={styles.subtitle}>
            Upload PDFs, ask questions, and inspect the exact source passages behind each answer.
          </p>
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
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #f6efe4 0%, #f4f1ea 40%, #e8eef3 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "48px 20px 64px",
  },
  glowA: {
    position: "absolute",
    inset: "-80px auto auto -120px",
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(227,153,84,0.22) 0%, rgba(227,153,84,0) 68%)",
    filter: "blur(12px)",
  },
  glowB: {
    position: "absolute",
    right: -90,
    bottom: 60,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(49,86,118,0.18) 0%, rgba(49,86,118,0) 68%)",
    filter: "blur(12px)",
  },
  container: {
    position: "relative",
    width: "100%",
    maxWidth: 840,
    zIndex: 1,
  },
  header: { marginBottom: 28 },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(30,30,30,0.08)",
    color: "#5c4a2d",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 14,
    backdropFilter: "blur(10px)",
  },
  title: { fontSize: 42, lineHeight: 1.02, fontWeight: 800, color: "#111", margin: 0 },
  subtitle: {
    fontSize: 16,
    lineHeight: 1.6,
    color: "#4f5b66",
    marginTop: 12,
    maxWidth: 680,
  },
};