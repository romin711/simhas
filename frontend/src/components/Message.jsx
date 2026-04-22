export default function Message({ message }) {
  const isUser = message.role === "user";
  const sourceCount = message.sources ? message.sources.length : 0;
  const confidence = message.meta?.top_score;
  const weakEvidence = Boolean(message.meta?.weak_evidence);

  const confidenceLabel =
    typeof confidence !== "number"
      ? null
      : confidence >= 0.75
        ? "high"
        : confidence >= 0.5
          ? "medium"
          : "low";

  return (
    <div style={{ ...styles.wrapper, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.botBubble) }}>
        <p style={styles.text}>{message.content}</p>

        {!isUser && typeof confidence === "number" && (
          <div style={styles.metaRow}>
            <span style={styles.confidencePill}>Confidence: {confidenceLabel} ({confidence.toFixed(2)})</span>
            <span style={styles.evidencePill}>
              Used {message.meta?.used_chunks ?? 0}/{message.meta?.candidate_chunks ?? message.meta?.retrieved_chunks ?? 0} candidates
            </span>
            {message.meta?.rerank_applied && <span style={styles.evidencePill}>Reranked</span>}
          </div>
        )}

        {!isUser && weakEvidence && sourceCount === 0 && (
          <div style={styles.warningBox}>
            Evidence is weak for this question. Try a more specific query or upload a more relevant PDF.
          </div>
        )}

        {!isUser && weakEvidence && sourceCount > 0 && (
          <div style={styles.warningBox}>
            The answer was generated from weak evidence. Review the source passages before relying on it.
          </div>
        )}

        {!isUser && sourceCount > 0 && (
          <div style={styles.sources}>
            <div style={styles.sourcesHeader}>
              <p style={styles.sourcesLabel}>Sources</p>
              <span style={styles.sourcesCount}>{sourceCount}</span>
            </div>
            {message.sources.map((s, i) => (
              <details key={i} style={styles.source}>
                <summary style={styles.sourceSummary}>
                  <span style={styles.sourceInfo}>
                    <span style={styles.sourceFile}>{s.source}</span>
                    <span style={styles.sourcePage}>p. {s.page}</span>
                  </span>
                  <span style={styles.sourceIndex}>#{i + 1}</span>
                </summary>
                <p style={styles.sourceText}>{s.text}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper:      { display: "flex", marginBottom: 14 },
  bubble:       { maxWidth: "78%", padding: "12px 16px", borderRadius: 18, fontSize: 14, lineHeight: 1.65 },
  userBubble:   { background: "linear-gradient(135deg, #17212b 0%, #2d3a45 100%)", color: "#fff", borderBottomRightRadius: 4 },
  botBubble:    { background: "#fff", color: "#111", border: "1px solid rgba(30,30,30,0.08)", borderBottomLeftRadius: 4, boxShadow: "0 8px 24px rgba(16, 24, 40, 0.05)" },
  text:         { margin: 0 },
  metaRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 },
  confidencePill: {
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eaf2f8",
    color: "#39576f",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  evidencePill: {
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eef3f7",
    color: "#50606d",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  warningBox: {
    marginTop: 10,
    padding: "8px 10px",
    borderRadius: 12,
    background: "#fff3e8",
    border: "1px solid #f3d5ba",
    color: "#8b4f19",
    fontSize: 12,
    lineHeight: 1.5,
    fontWeight: 600,
  },
  sources:      { marginTop: 12, paddingTop: 12, borderTop: "1px solid #eef1f4" },
  sourcesHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  sourcesLabel: { margin: 0, fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#77818b", letterSpacing: 0.7 },
  sourcesCount: { padding: "2px 8px", borderRadius: 999, background: "#eef3f7", color: "#50606d", fontSize: 11, fontWeight: 700 },
  source:       { marginBottom: 8, padding: "8px 10px", borderRadius: 14, background: "#f8fafc", border: "1px solid #edf1f4" },
  sourceSummary: { cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sourceInfo: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
  sourceFile:   { fontWeight: 700, fontSize: 12, color: "#32404a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  sourcePage:   { fontSize: 11, color: "#7a8791", whiteSpace: "nowrap", fontWeight: 700, textTransform: "uppercase" },
  sourceIndex: { fontSize: 11, color: "#53606b", fontWeight: 700 },
  sourceText:   { margin: "8px 0 0", fontSize: 12, color: "#596773", lineHeight: 1.6 },
};