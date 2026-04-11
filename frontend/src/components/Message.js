export default function Message({ message }) {
  const isUser = message.role === "user";

  return (
    <div style={{ ...styles.wrapper, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.botBubble) }}>
        <p style={styles.text}>{message.content}</p>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div style={styles.sources}>
            <p style={styles.sourcesLabel}>Sources</p>
            {message.sources.map((s, i) => (
              <div key={i} style={styles.source}>
                <span style={styles.sourceFile}>{s.source}</span>
                <span style={styles.sourcePage}> — p. {s.page}</span>
                <p style={styles.sourceText}>
                  {s.text.length > 120 ? s.text.slice(0, 120) + "…" : s.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper:      { display: "flex", marginBottom: 14 },
  bubble:       { maxWidth: "78%", padding: "12px 16px", borderRadius: 8, fontSize: 14, lineHeight: 1.55 },
  userBubble:   { background: "#333", color: "#fff", borderBottomRightRadius: 2 },
  botBubble:    { background: "#fff", color: "#111", border: "1px solid #e0e0e0", borderBottomLeftRadius: 2 },
  text:         { margin: 0 },
  sources:      { marginTop: 10, paddingTop: 10, borderTop: "1px solid #eee" },
  sourcesLabel: { margin: "0 0 6px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#888", letterSpacing: 0.5 },
  source:       { marginBottom: 6 },
  sourceFile:   { fontWeight: 600, fontSize: 12, color: "#444" },
  sourcePage:   { fontSize: 12, color: "#888" },
  sourceText:   { margin: "2px 0 0", fontSize: 12, color: "#666", fontStyle: "italic" },
};