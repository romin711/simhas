import { useEffect, useRef, useState } from "react";
import { queryRAG } from "../api";
import Message from "./Message";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef               = useRef(null);

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
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Chat</h2>

      <div style={styles.messageArea}>
        {messages.length === 0 && (
          <p style={styles.empty}>Upload a PDF above, then ask a question.</p>
        )}
        {messages.map((msg, i) => (
          <Message key={i} message={msg} />
        ))}
        {loading && (
          <div style={{ display: "flex", marginBottom: 14 }}>
            <div style={{ ...styles.bubble, ...styles.botBubble }}>
              <p style={{ margin: 0, color: "#aaa", fontSize: 14 }}>Loading…</p>
            </div>
          </div>
        )}
        {error && <p style={styles.error}>{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          type="text"
          placeholder="Ask a question..."
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
  container:   { background: "#fff", borderRadius: 8, padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  heading:     { margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#111" },
  messageArea: { minHeight: 320, maxHeight: 480, overflowY: "auto", marginBottom: 16, paddingRight: 4 },
  empty:       { color: "#aaa", fontSize: 14, textAlign: "center", marginTop: 60 },
  inputRow:    { display: "flex", gap: 10 },
  input:       { flex: 1, padding: "9px 14px", border: "1px solid #ccc", borderRadius: 6, fontSize: 14, outline: "none", fontFamily: "inherit" },
  button:      { padding: "9px 20px", background: "#333", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" },
  error:       { fontSize: 13, color: "#b00020", margin: "8px 0 0" },
  bubble:      { maxWidth: "78%", padding: "12px 16px", borderRadius: 8 },
  botBubble:   { background: "#fff", border: "1px solid #e0e0e0", borderBottomLeftRadius: 2 },
};