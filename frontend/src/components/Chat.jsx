import { useEffect, useRef, useState } from "react";
import { queryRAG } from "../api";
import Message from "./Message";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const data = await queryRAG(question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources, meta: data.meta },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.heading}>Chat</h2>
          <p style={styles.helper}>Ask about the uploaded documents and get source-backed answers.</p>
        </div>
        <div style={styles.metaPill}>{messages.length} messages</div>
      </div>

      <div style={styles.messageArea}>
        {messages.length === 0 && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Ready when you are</div>
            <p style={styles.emptyText}>
              Upload a PDF, then ask something specific like “What are the deadlines?” or “Summarize the findings.”
            </p>
            <div style={styles.emptyHints}>
              <span style={styles.emptyHint}>Fast retrieval</span>
              <span style={styles.emptyHint}>Page-level citations</span>
              <span style={styles.emptyHint}>Local inference</span>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <Message key={i} message={msg} />
        ))}
        {loading && (
          <div style={styles.loadingRow}>
            <div style={{ ...styles.bubble, ...styles.botBubble }}>
              <div style={styles.typingDots}>
                <span style={styles.typingDot} />
                <span style={styles.typingDot} />
                <span style={styles.typingDot} />
              </div>
            </div>
          </div>
        )}
        {error && <div style={styles.error}>{error}</div>}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <textarea
          style={styles.input}
          rows={2}
          placeholder="Ask a question about the uploaded PDF..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button
          style={{ ...styles.button, opacity: loading || !input.trim() ? 0.5 : 1 }}
          onClick={send}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "rgba(255,255,255,0.78)",
    borderRadius: 24,
    padding: "24px 28px",
    boxShadow: "0 18px 50px rgba(16, 24, 40, 0.08)",
    border: "1px solid rgba(30,30,30,0.08)",
    backdropFilter: "blur(14px)",
  },
  headerRow: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", marginBottom: 16 },
  heading: { margin: 0, fontSize: 18, fontWeight: 800, color: "#111" },
  helper: { margin: "6px 0 0", fontSize: 13, color: "#5f6b75", lineHeight: 1.5 },
  metaPill: {
    flexShrink: 0,
    padding: "7px 12px",
    borderRadius: 999,
    background: "#eef3f7",
    color: "#45525e",
    fontSize: 12,
    fontWeight: 700,
  },
  messageArea: { minHeight: 340, maxHeight: 520, overflowY: "auto", marginBottom: 16, paddingRight: 4 },
  emptyCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    border: "1px solid rgba(30,30,30,0.08)",
    background: "linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(240,244,248,0.9) 100%)",
  },
  emptyTitle: { fontSize: 16, fontWeight: 800, color: "#1a2430" },
  emptyText: { margin: "8px 0 14px", fontSize: 14, lineHeight: 1.6, color: "#55626d" },
  emptyHints: { display: "flex", flexWrap: "wrap", gap: 8 },
  emptyHint: {
    padding: "7px 10px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid rgba(30,30,30,0.08)",
    color: "#55626d",
    fontSize: 12,
    fontWeight: 600,
  },
  inputRow: { display: "flex", gap: 12, alignItems: "stretch" },
  input: {
    flex: 1,
    minHeight: 52,
    padding: "13px 14px",
    border: "1px solid rgba(30,30,30,0.14)",
    borderRadius: 18,
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
    background: "rgba(255,255,255,0.92)",
  },
  button: {
    padding: "12px 22px",
    background: "linear-gradient(135deg, #17212b 0%, #2d3a45 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 16,
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 10px 20px rgba(23, 33, 43, 0.14)",
  },
  loadingRow: { display: "flex", marginBottom: 14 },
  typingDots: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minHeight: 18,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#9aa5af",
  },
  error: {
    margin: "8px 0 0",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fdecec",
    color: "#a11e1e",
    fontSize: 13,
    fontWeight: 600,
  },
  bubble: { maxWidth: "78%", padding: "12px 16px", borderRadius: 18 },
  botBubble: { background: "#fff", border: "1px solid #e0e0e0", borderBottomLeftRadius: 4 },
};