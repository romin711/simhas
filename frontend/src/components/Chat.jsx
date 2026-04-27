import { useEffect, useRef, useState } from "react";
import { queryRAG } from "../api";
import Message from "./Message";

const SESSION_KEY = "simhas-chat-history";
const NOT_IMPLEMENTED_TEXT = "Feature is not implemented yet";

const nextId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function Chat({ onSelectAnswer }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [activeAnswerId, setActiveAnswerId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    } catch {
      // Session storage can be unavailable in some private browsing modes.
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const selectAnswer = (message) => {
    if (message.role !== "assistant") return;
    setActiveAnswerId(message.id);
    onSelectAnswer?.(message);
  };

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setNotice(null);
    const questionMessage = { id: nextId(), role: "user", content: question };
    setMessages((prev) => [...prev, questionMessage]);
    setLoading(true);

    try {
      const data = await queryRAG(question);
      const answerMessage = {
        id: nextId(),
        role: "assistant",
        content: data.answer || NOT_IMPLEMENTED_TEXT,
        sources: Array.isArray(data.sources) ? data.sources : null,
        meta: data.meta || null,
      };
      setMessages((prev) => [
        ...prev,
        answerMessage,
      ]);
      selectAnswer(answerMessage);
    } catch {
      setNotice("Request failed. Please try again. If this feature is unavailable, Feature is not implemented yet");
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
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <div>
          <h2 className="section-title">Research Thread</h2>
          <p className="section-text">Ask precise questions and inspect answers as structured evidence cards.</p>
        </div>
        <div className="workspace-kicker">{messages.length} entries</div>
      </div>

      <div className="workspace-thread">
        {messages.length === 0 && (
          <div className="thread-empty">
            <h3 style={{ margin: 0 }}>Ready for your first query</h3>
            <p className="section-text">Try asking for findings, obligations, dates, limitations, or implementation details from uploaded PDFs.</p>
          </div>
        )}

        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            isActive={activeAnswerId === message.id}
            onSelect={selectAnswer}
          />
        ))}

        {loading && (
          <div className="thinking" aria-live="polite">
            <div style={{ marginBottom: 8, fontSize: "0.86rem", color: "#6a5f50" }}>Analyzing documents and composing answer...</div>
            <div className="thinking-bar" />
            <div className="thinking-bar" style={{ marginTop: 7, width: "80%" }} />
            <div className="thinking-bar" style={{ marginTop: 7, width: "62%" }} />
          </div>
        )}

        {notice && <div className="notice notice-error">{notice}</div>}

        <div ref={bottomRef} />
      </div>

      <div className="ask-shell">
        <div className="ask-label">Ask Workspace</div>
        <textarea
          className="ask-input"
          rows={3}
          placeholder="Ask about the current document set..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <div className="ask-actions">
          <span className="section-text" style={{ margin: 0 }}>
            Press Enter to send, Shift + Enter for newline
          </span>
          <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>
            {loading ? "Working..." : "Ask"}
          </button>
        </div>
      </div>
    </section>
  );
}